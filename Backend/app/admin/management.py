from flask import Blueprint, jsonify, request
from db import get_db_connection
from app.utils import admin_required
from werkzeug.security import generate_password_hash
import time

admin_management_bp = Blueprint('admin_management', __name__)

@admin_management_bp.route('/users/<string:user_id>', methods=['PATCH'])
@admin_required
def deactivate_user(current_admin_id, user_id):
    if not user_id or '_' not in user_id:
        return jsonify({"error": "Invalid user ID format"}), 400

    user_type, actual_id = user_id.split('_')
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        if user_type == 'C':
            cur.execute("UPDATE Client SET is_active = FALSE WHERE client_id = %s", (actual_id,))
        elif user_type == 'E':
            if int(actual_id) == current_admin_id:
                return jsonify({"error": "You cannot deactivate your own account"}), 403
            cur.execute("UPDATE Employee SET is_active = FALSE WHERE employee_id = %s", (actual_id,))
        else:
            return jsonify({"error": "Unknown user type"}), 400

        if cur.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close()

        return jsonify({"message": "User deactivated successfully"}), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn: conn.close()

@admin_management_bp.route("/reservations", methods=["POST", "OPTIONS"])
@admin_required
def admin_purchase_ticket(current_admin_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    if not data:
        return jsonify({"error": "Brak danych w zapytaniu."}), 400

    # 1. ROZPAKOWANIE DANYCH
    target_client_id = data.get("client_id")
    trip_data = data.get("trip", {})
    tickets_data = data.get("tickets", {})

    trip_id = trip_data.get("id")
    from_station = trip_data.get("from")
    to_station = trip_data.get("to")

    # ZMIANA: Zmiana z 'reduced' na 'child'
    adult_count = tickets_data.get("adult", 0)
    student_count = tickets_data.get("student", 0)
    child_count = tickets_data.get("child", 0)

    seat_count = adult_count + student_count + child_count

    # Walidacja wejścia
    if not target_client_id or not trip_id or seat_count <= 0 or not from_station or not to_station:
        return jsonify({"error": "Brakujące dane: wymagane client_id, trip, stacje oraz min. 1 bilet."}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # --- A. SPRAWDZENIE CZY KLIENT ISTNIEJE ---
        cur.execute("SELECT loyalty_points FROM Client WHERE client_id = %s AND is_active = TRUE", (target_client_id,))
        client_data = cur.fetchone()
        if not client_data:
            return jsonify({"error": "Wskazany klient nie istnieje lub jest nieaktywny."}), 404
        
        loyalty_points = client_data[0] if client_data[0] is not None else 0

        # --- B. SPRAWDZANIE DOSTĘPNOŚCI MIEJSC ---
        query_capacity = """
            SELECT v.seating_capacity, 
                   COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = %s AND status != 'Cancelled'), 0)
            FROM Trip tr
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.trip_id = %s;
        """
        cur.execute(query_capacity, (trip_id, trip_id))
        bus_info = cur.fetchone()

        if not bus_info:
            return jsonify({"error": "Kurs nie został znaleziony."}), 404

        available_seats = bus_info[0] - bus_info[1]
        if seat_count > available_seats:
            return jsonify({"error": f"Brak wolnych miejsc. Dostępne: {available_seats}"}), 409

        # --- C. WYLICZANIE POZYCJI NA TRASIE I CENY ---
        query_stops = """
            SELECT 
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS from_order,
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS to_order
            FROM Trip tr WHERE trip_id = %s;
        """
        cur.execute(query_stops, (from_station, to_station, trip_id))
        stops = cur.fetchone()

        if not stops or stops[0] is None or stops[1] is None:
            return jsonify({"error": "Nieprawidłowe stacje dla tego kursu."}), 400

        stops_count = stops[1] - stops[0]
        base_price = 15.00 + (stops_count * 5.00)

        # ZMIANA: Wyliczanie bazowej sumy z nowymi zniżkami (Student -30%, Dziecko -100%)
        total_price = (
            (adult_count * base_price)
            + (student_count * (base_price * 0.70))
            + (child_count * 0.00)
        )

        # --- D. LOGIKA ZŁOTEJ ZNIŻKI ---
        is_gold_eligible = loyalty_points >= 2000
        earned_points = seat_count * 40

        if is_gold_eligible:
            total_price = total_price * 0.40
            query_update_points = """
                UPDATE Client 
                SET loyalty_points = loyalty_points - 2000 + %s,
                    gold_tier_count = gold_tier_count + 1
                WHERE client_id = %s;
            """
            cur.execute(query_update_points, (earned_points, target_client_id))
        else:
            query_update_points = """
                UPDATE Client 
                SET loyalty_points = loyalty_points + %s 
                WHERE client_id = %s;
            """
            cur.execute(query_update_points, (earned_points, target_client_id))

        total_price = round(total_price, 2)

        # --- E. TWORZENIE REZERWACJI ---
        reservation_number = f"RES-{target_client_id}-{int(time.time())}"

        query_insert_res = """
            INSERT INTO Reservation (client_id, trip_id, reservation_number, status, payment_status, seat_count, total_price)
            VALUES (%s, %s, %s, 'Confirmed', 'Paid', %s, %s) RETURNING reservation_id;
        """
        cur.execute(
            query_insert_res,
            (target_client_id, trip_id, reservation_number, seat_count, total_price)
        )
        new_reservation_id = cur.fetchone()[0]

        # --- F. TWORZENIE BILETU GRUPOWEGO ---
        # ZMIANA: Etykiety biletów
        summary_parts = []
        if adult_count > 0: summary_parts.append(f"{adult_count}x Normalny")
        if student_count > 0: summary_parts.append(f"{student_count}x Uczeń/Student")
        if child_count > 0: summary_parts.append(f"{child_count}x Dziecko")
        ticket_summary = ", ".join(summary_parts)
        
        default_segment_id = 1 

        query_insert_ticket = """
            INSERT INTO Ticket (reservation_id, segment_id, final_price, ticket_summary, status)
            VALUES (%s, %s, %s, %s, 'Active') RETURNING ticket_id;
        """
        cur.execute(
            query_insert_ticket,
            (new_reservation_id, default_segment_id, total_price, ticket_summary)
        )
        new_ticket_id = cur.fetchone()[0]

        # --- G. ZATWIERDZENIE TRANSAKCJI ---
        conn.commit()
        cur.close()

        return jsonify({
            "message": "Bilet został pomyślnie zakupiony przez administratora.",
            "reservation_id": new_reservation_id,
            "reservation_number": reservation_number,
            "total_price": total_price
        }), 201

    except Exception as e:
        print(f"DB Error w admin_purchase_ticket: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Wystąpił błąd serwera podczas zakupu biletu przez admina."}), 500
    finally:
        if conn:
            conn.close()