from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import token_required

client_profil_bp = Blueprint("client_profile", __name__)


@client_profil_bp.route("/user/loyalty", methods=["GET"])
@token_required
def get_loyalty(current_user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT loyalty_points FROM Client WHERE client_id = %s",
            (current_user_id,),
        )
        loyalty_data = cur.fetchone()
        cur.close()

        if not loyalty_data:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"points": loyalty_data["loyalty_points"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/user/update", methods=["POST", "PUT"])
@token_required
def update_profile(current_user_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    phone_number = data.get("phone_number")

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = """
            UPDATE Client 
            SET first_name = COALESCE(%s, first_name), 
                last_name = COALESCE(%s, last_name), 
                phone_number = COALESCE(%s, phone_number)
            WHERE client_id = %s
        """
        cur.execute(query, (first_name, last_name, phone_number, current_user_id))
        conn.commit()
        cur.close()

        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/tickets", methods=["GET"])
@token_required
def get_tickets(current_user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Wyciągamy szczegóły BILETU (ticket_summary, final_price)
        # i łączymy je z danymi o trasie i rezerwacji
        query = """
            SELECT 
                tc.ticket_id,
                tc.status AS ticket_status,
                tc.ticket_summary,
                tc.final_price,
                r.reservation_number,
                TO_CHAR(r.reservation_date, 'YYYY-MM-DD HH24:MI') AS reservation_date,
                r.status AS reservation_status,
                rt.name AS route,
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI') AS departure_time
            FROM Ticket tc
            JOIN Reservation r ON tc.reservation_id = r.reservation_id
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Route rt ON tr.route_id = rt.route_id
            WHERE r.client_id = %s
            ORDER BY tr.departure_time DESC
        """
        cur.execute(query, (current_user_id,))
        tickets = cur.fetchall()
        cur.close()

        # Formatujemy klucze na camelCase dla frontendu (React)
        formatted_tickets = []
        for t in tickets:
            formatted_tickets.append(
                {
                    "ticketId": t["ticket_id"],
                    "ticketStatus": t["ticket_status"],
                    # np. "1x Normalny, 1x Student"
                    "ticketSummary": t["ticket_summary"],
                    "finalPrice": float(t["final_price"]),  # np. 45.0
                    "reservationNumber": t["reservation_number"],
                    "reservationDate": t["reservation_date"],
                    "reservationStatus": t["reservation_status"],
                    "route": t["route"],
                    "departureTime": t["departure_time"],
                }
            )

        return jsonify(formatted_tickets), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Wystąpił błąd podczas pobierania biletów"}), 500
    finally:
        if conn:
            conn.close()
