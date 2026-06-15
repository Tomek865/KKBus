from app.utils import token_required
from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
import time
from datetime import datetime, timedelta

client_reservation_bp = Blueprint("client_reservations", __name__)


@client_reservation_bp.route("/stations", methods=["GET"])
def get_stations():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT station_id AS id, name, exact_address FROM Station ORDER BY name ASC"
        )
        stations = cur.fetchall()
        cur.close()
        return jsonify(stations), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error fetching stations"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/routes/search", methods=["POST", "OPTIONS"])
def search_routes():
    if request.method == "OPTIONS":
        res = jsonify({})
        res.headers.add("Access-Control-Allow-Origin", "*")
        res.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        res.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return res, 200

    data = request.get_json()

    from_station = data.get("from_station")
    to_station = data.get("to_station")
    date = data.get("date")

    tickets = data.get("tickets", {})
    adult_count = tickets.get("adult", 1)
    student_count = tickets.get("student", 0)
    reduced_count = tickets.get("reduced", 0)

    if not date or not from_station or not to_station:
        return jsonify(
            {
                "error": "Parameters 'date', 'from_station', and 'to_station' are required."
            }
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tr.trip_id, 
                r.name AS route_name, 
                tr.departure_time AS raw_departure,
                tr.arrival_time AS raw_arrival,
                (SELECT MAX(order_on_route) FROM Route_Station WHERE route_id = r.route_id) AS max_order,
                v.seating_capacity,
                COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = tr.trip_id AND status != 'Cancelled'), 0) AS occupied_seats,
                tr.status,
                rs_from.order_on_route AS from_order,
                rs_to.order_on_route AS to_order
            FROM Trip tr
            JOIN Route r ON tr.route_id = r.route_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            JOIN Route_Station rs_from ON r.route_id = rs_from.route_id
            JOIN Station s_from ON rs_from.station_id = s_from.station_id
            JOIN Route_Station rs_to ON r.route_id = rs_to.route_id
            JOIN Station s_to ON rs_to.station_id = s_to.station_id
            WHERE DATE(tr.departure_time) = %s 
              AND tr.status = 'Planned'
              AND s_from.name = %s 
              AND s_to.name = %s
              AND rs_from.order_on_route < rs_to.order_on_route
            ORDER BY tr.departure_time ASC;
        """
        cur.execute(query, (date, from_station, to_station))
        departures = cur.fetchall()

        results = []
        for dep in departures:
            cur.execute("""
                SELECT fs.standard_price 
                FROM Fare_Segment fs
                JOIN Trip tr ON fs.route_id = tr.route_id
                JOIN Station s1 ON fs.start_station_id = s1.station_id
                JOIN Station s2 ON fs.end_station_id = s2.station_id
                WHERE tr.trip_id = %s AND s1.name = %s AND s2.name = %s
            """, (dep["trip_id"], from_station, to_station))
            price_row = cur.fetchone()
            base_price = float(price_row["standard_price"]) if price_row else 12.00

            available_seats = dep["seating_capacity"] - dep["occupied_seats"]

            total_price = (
                (adult_count * base_price) +
                (student_count * (base_price * 0.70)) +
                (reduced_count * 0.0)
            )

            raw_dep = dep["raw_departure"]
            raw_arr = dep["raw_arrival"]
            max_order = dep["max_order"]
            from_order = dep["from_order"]
            to_order = dep["to_order"]

            total_segments = max_order - 1 if max_order > 1 else 1
            total_route_duration = raw_arr - raw_dep
            time_per_segment = total_route_duration / total_segments

            actual_departure = raw_dep + (time_per_segment * (from_order - 1))
            actual_arrival = raw_dep + (time_per_segment * (to_order - 1))
            trip_duration = actual_arrival - actual_departure

            duration_minutes = int(trip_duration.total_seconds() // 60)
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            duration_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

            results.append(
                {
                    "tripId": dep["trip_id"],
                    "routeName": dep["route_name"],
                    "departureTime": actual_departure.strftime("%H:%M"),
                    "arrivalTime": actual_arrival.strftime("%H:%M"),
                    "duration": duration_str,
                    "basePricePerAdult": float(base_price),
                    "totalPrice": float(round(total_price, 2)),
                    "availableSeats": available_seats,
                    "status": dep["status"],
                }
            )
            
        cur.close()
        return jsonify(results), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error occurred while searching for routes"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/", methods=["POST"])
@token_required
def create_reservation(current_user_id):
    data = request.get_json()

    trip_id = data.get("trip_id")
    from_station = data.get("from_station")
    to_station = data.get("to_station")
    tickets = data.get("tickets", {})

    adult_count = tickets.get("adult", 0)
    student_count = tickets.get("student", 0)
    reduced_count = tickets.get("reduced", 0)
    seat_count = adult_count + student_count + reduced_count

    if not trip_id or seat_count <= 0 or not from_station or not to_station:
        return jsonify(
            {"error": "Missing trip ID, station data or ticket count is 0"}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query_capacity = """
            SELECT v.seating_capacity, 
                   COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = %s AND status != 'Cancelled'), 0) AS occupied_seats
            FROM Trip tr
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.trip_id = %s;
        """
        cur.execute(query_capacity, (trip_id, trip_id))
        bus_info = cur.fetchone()

        if not bus_info:
            return jsonify({"error": "Trip not found"}), 404

        available_seats = bus_info["seating_capacity"] - bus_info["occupied_seats"]

        if seat_count > available_seats:
            return jsonify(
                {"error": f"Not enough seats available. Available: {available_seats}"}
            ), 409

        query_price = """
            SELECT fs.standard_price 
            FROM Fare_Segment fs
            JOIN Trip tr ON fs.route_id = tr.route_id
            JOIN Station s1 ON fs.start_station_id = s1.station_id
            JOIN Station s2 ON fs.end_station_id = s2.station_id
            WHERE tr.trip_id = %s AND s1.name = %s AND s2.name = %s
        """
        cur.execute(query_price, (trip_id, from_station, to_station))
        price_row = cur.fetchone()
        base_price = float(price_row["standard_price"]) if price_row else 12.00

        total_price = (
            (adult_count * base_price)
            + (student_count * (base_price * 0.49))
            + (reduced_count * (base_price * 0.63))
        )

        reservation_number = f"RES-{current_user_id}-{int(time.time())}"

        query_insert = """
            INSERT INTO Reservation (client_id, trip_id, reservation_number, status, seat_count, total_price)
            VALUES (%s, %s, %s, 'Pending Payment', %s, %s) RETURNING reservation_id;
        """
        cur.execute(
            query_insert,
            (
                current_user_id,
                trip_id,
                reservation_number,
                seat_count,
                round(total_price, 2),
            ),
        )
        new_id = cur.fetchone()["reservation_id"]

        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": "Reservation created successfully.",
                "reservation_number": reservation_number,
                "reservation_id": new_id,
                "total_price": round(total_price, 2),
            }
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error occurred during reservation"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/journey-details/<string:res_number>", methods=["GET"])
@token_required
def get_journey_details(current_client_id, res_number):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query_info = """
            SELECT 
                r.reservation_number,
                r.seat_count,
                tr.trip_id,
                tr.departure_time,
                v.brand,
                v.model,
                v.registration_number
            FROM Reservation r
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE r.reservation_number = %s AND r.client_id = %s;
        """
        cur.execute(query_info, (res_number, current_client_id))
        journey_info = cur.fetchone()

        if not journey_info:
            return jsonify({"error": "Reservation not found or access denied"}), 404

        trip_id = journey_info["trip_id"]
        dep_time = journey_info["departure_time"]

        query_stations = """
            SELECT 
                s.name,
                rs.order_on_route
            FROM Trip tr
            JOIN Route_Station rs ON tr.route_id = rs.route_id
            JOIN Station s ON rs.station_id = s.station_id
            WHERE tr.trip_id = %s
            ORDER BY rs.order_on_route ASC;
        """
        cur.execute(query_stations, (trip_id,))
        stations = cur.fetchall()
        cur.close()

        route_details = []
        now = datetime.now()

        for index, st in enumerate(stations):
            station_time = dep_time + timedelta(minutes=25 * index)

            route_details.append(
                {
                    "station": st["name"],
                    "time": station_time.strftime("%H:%M"),
                    "isPassed": now > station_time,
                }
            )

        response_data = {
            "busDetails": {
                "operator": "KKBus Express",
                "vehicleName": f"{journey_info['brand']} {journey_info['model']} / {journey_info['registration_number']}",
                "amenities": ["wifi", "snow", "flash", "leaf"],
            },
            "ticketInfo": {
                "seat": "TBD",
                "class": "Standard",
                "seatCount": journey_info["seat_count"],
                "reservationNumber": journey_info["reservation_number"],
            },
            "routeDetails": route_details,
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/calculate-price", methods=["OPTIONS"])
def calculate_price_options():
    res = jsonify({})
    res.headers.add("Access-Control-Allow-Origin", "*")
    res.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
    return res, 200


@client_reservation_bp.route("/calculate-price", methods=["POST"])
@token_required
def calculate_price(current_user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    trip_id = data.get("trip_id")
    from_station = data.get("from_station")
    to_station = data.get("to_station")
    tickets = data.get("tickets", {})
    
    applied_reward_id = data.get("applied_reward_id") 

    adult_count = tickets.get("adult", 0)
    student_count = tickets.get("student", 0)
    reduced_count = tickets.get("reduced", 0)

    total_seats = adult_count + student_count + reduced_count
    if total_seats == 0:
        return jsonify({"error": "No tickets selected"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # --- NOWY, POPRAWNY SPOSÓB POBIERANIA CENY ---
        query_price = """
            SELECT fs.standard_price 
            FROM Fare_Segment fs
            JOIN Trip tr ON fs.route_id = tr.route_id
            JOIN Station s1 ON fs.start_station_id = s1.station_id
            JOIN Station s2 ON fs.end_station_id = s2.station_id
            WHERE tr.trip_id = %s AND s1.name = %s AND s2.name = %s
        """
        cur.execute(query_price, (trip_id, from_station, to_station))
        price_row = cur.fetchone()
        
        if not price_row:
            return jsonify({"error": "Invalid stations for this trip"}), 400
            
        base_price = float(price_row["standard_price"])

        # --- KALKULACJA NOWYCH ZNIŻEK ---
        total_price = (
            (adult_count * base_price) +
            (student_count * (base_price * 0.70)) +
            (reduced_count * 0.0)
        )

        if applied_reward_id:
            cur.execute(
                "SELECT 1 FROM Client_Reward WHERE client_id = %s AND reward_id = %s LIMIT 1", 
                (current_user_id, applied_reward_id)
            )
            has_reward = cur.fetchone()
            
            if not has_reward:
                return jsonify({"error": "Nie posiadasz tej nagrody na swoim koncie!"}), 403

            if applied_reward_id == 1:
                total_price = max(0, total_price - base_price)
            elif applied_reward_id == 2:
                total_price = max(0, total_price - (base_price * 0.50))

        cur.close()

        return jsonify({
            "base_price_per_ticket": round(base_price, 2),
            "total_price": round(total_price, 2),
            "total_seats": total_seats
        }), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error calculating price"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/checkout", methods=["POST", "OPTIONS"])
@token_required
def process_checkout(current_user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()

    trip_data = data.get("trip", {})
    tickets_data = data.get("tickets", {})

    trip_id = trip_data.get("id")
    from_station = trip_data.get("from")
    to_station = trip_data.get("to")

    applied_reward_id = data.get("applied_reward_id") 

    adult_count = tickets_data.get("adult", 0)
    student_count = tickets_data.get("student", 0)
    reduced_count = tickets_data.get("reduced", 0)

    seat_count = adult_count + student_count + reduced_count

    if not trip_id or seat_count <= 0 or not from_station or not to_station:
        return jsonify(
            {"error": "Missing trip ID, station data or ticket count is 0"}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            "SELECT loyalty_points, email, blocked_until FROM Client WHERE client_id = %s", (current_user_id,)
        )
        client_data = cur.fetchone()
        
        if client_data and client_data.get("blocked_until") and client_data["blocked_until"] > datetime.now():
            return jsonify({"error": f"Konto jest zablokowane do {client_data['blocked_until'].strftime('%Y-%m-%d %H:%M')}"}), 403

        client_email = client_data["email"] if client_data else "nieznany@mail.com"

        cur.execute("SELECT departure_time, route_id FROM Trip WHERE trip_id = %s", (trip_id,))
        trip_info = cur.fetchone()

        if not trip_info:
            return jsonify({"error": "Trip not found"}), 404
            
        target_time = trip_info["departure_time"]
        route_id = trip_info["route_id"]
        now = datetime.now()
        
        if target_time > now + timedelta(days=7):
            return jsonify({"error": "Możesz rezerwować miejsca maksymalnie na tydzień w przód."}), 400

        query_first_trip = """
            SELECT MIN(departure_time) as first_departure 
            FROM Trip 
            WHERE route_id = %s AND DATE(departure_time) = DATE(%s)
        """
        cur.execute(query_first_trip, (route_id, target_time))
        first_trip_res = cur.fetchone()
        
        if first_trip_res and first_trip_res['first_departure']:
            first_trip_time = first_trip_res['first_departure']
            if target_time.date() == now.date() and now > (first_trip_time - timedelta(hours=2)):
                return jsonify({"error": "Rezerwacja możliwa najpóźniej 2h przed pierwszym kursem w wybranym dniu."}), 403

        query_capacity = """
            SELECT v.seating_capacity, 
                   COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = %s AND status != 'Cancelled'), 0) AS occupied_seats
            FROM Trip tr
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.trip_id = %s;
        """
        cur.execute(query_capacity, (trip_id, trip_id))
        bus_info = cur.fetchone()

        available_seats = bus_info["seating_capacity"] - bus_info["occupied_seats"]

        if seat_count > available_seats:
            return jsonify(
                {"error": f"Not enough seats available. Available: {available_seats}"}
            ), 409

        query_price = """
            SELECT fs.standard_price 
            FROM Fare_Segment fs
            JOIN Trip tr ON fs.route_id = tr.route_id
            JOIN Station s1 ON fs.start_station_id = s1.station_id
            JOIN Station s2 ON fs.end_station_id = s2.station_id
            WHERE tr.trip_id = %s AND s1.name = %s AND s2.name = %s
        """
        cur.execute(query_price, (trip_id, from_station, to_station))
        price_row = cur.fetchone()
        
        if not price_row:
            return jsonify({"error": "Invalid stations for this trip"}), 400
            
        base_price = float(price_row["standard_price"])

        total_price = (
            (adult_count * base_price)
            + (student_count * (base_price * 0.49))
            + (reduced_count * (base_price * 0.63))
        )

        summary_parts = []
        if adult_count > 0:
            summary_parts.append(f"{adult_count}x Normalny")
        if student_count > 0:
            summary_parts.append(f"{student_count}x Student")
        if reduced_count > 0:
            summary_parts.append(f"{reduced_count}x Ulgowy")

        ticket_summary = ", ".join(summary_parts)

        if applied_reward_id:
            query_consume_reward = """
                DELETE FROM Client_Reward 
                WHERE client_id = %s AND reward_id = %s AND exchange_date = (
                    SELECT MIN(exchange_date) FROM Client_Reward WHERE client_id = %s AND reward_id = %s
                ) RETURNING reward_id;
            """
            cur.execute(query_consume_reward, (current_user_id, applied_reward_id, current_user_id, applied_reward_id))
            consumed = cur.fetchone()

            if not consumed:
                return jsonify({"error": "Nie posiadasz tego kuponu lub został już wykorzystany!"}), 403

            if applied_reward_id == 1:
                total_price = max(0, total_price - base_price)
                ticket_summary += " [+ Darmowy Przejazd]"
            elif applied_reward_id == 2:
                total_price = max(0, total_price - (base_price * 0.50))
                ticket_summary += " [+ Zniżka 50%]"
            elif applied_reward_id == 3:
                ticket_summary += " [+ Miejsce VIP]"
            elif applied_reward_id == 4:
                ticket_summary += " [+ Darmowy Bagaż]"


        query_orders = """
            SELECT 
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = %s AND s.name = %s LIMIT 1) AS from_order,
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = %s AND s.name = %s LIMIT 1) AS to_order;
        """
        cur.execute(query_orders, (route_id, from_station, route_id, to_station))
        orders = cur.fetchone()

        total_km = 0
        if orders and orders["from_order"] is not None and orders["to_order"] is not None:
            query_distance = """
                SELECT COALESCE(SUM(distance_from_prev), 0) AS total_km
                FROM Route_Station
                WHERE route_id = %s 
                  AND order_on_route > %s 
                  AND order_on_route <= %s;
            """
            cur.execute(query_distance, (route_id, orders["from_order"], orders["to_order"]))
            dist_res = cur.fetchone()
            if dist_res:
                total_km = dist_res["total_km"]

        points_per_seat = int(total_km) if total_km > 0 else 20
        earned_points = points_per_seat * seat_count


        query_update_points = """
            UPDATE Client 
            SET loyalty_points = COALESCE(loyalty_points, 0) + %s 
            WHERE client_id = %s;
        """
        cur.execute(query_update_points, (earned_points, current_user_id))

        total_price = round(total_price, 2)
        import time
        reservation_number = f"RES-{current_user_id}-{int(time.time())}"

        query_insert = """
            INSERT INTO Reservation (client_id, trip_id, reservation_number, status, seat_count, total_price)
            VALUES (%s, %s, %s, 'Pending Payment', %s, %s) RETURNING reservation_id;
        """
        cur.execute(
            query_insert,
            (current_user_id, trip_id, reservation_number, seat_count, total_price),
        )
        new_id = cur.fetchone()["reservation_id"]

        default_segment_id = 1
        query_insert_ticket = """
            INSERT INTO Ticket (reservation_id, segment_id, final_price, ticket_summary, status)
            VALUES (%s, %s, %s, %s, 'Active') RETURNING ticket_id;
        """
        cur.execute(
            query_insert_ticket,
            (new_id, default_segment_id, total_price, ticket_summary),
        )
        new_ticket_id = cur.fetchone()["ticket_id"]

        conn.commit()
        
        return jsonify(
            {
                "message": "Reservation created successfully.",
                "reservation_id": new_id,
                "ticket_id": new_ticket_id,
                "reservation_number": reservation_number,
                "ticket_summary": ticket_summary,
                "total_price": total_price,
                "received_seats": seat_count,
                "earned_points": earned_points,
                "route": f"{from_station} -> {to_station}",
            }
        ), 201

    except Exception as e:
        print(f"DB Error w /checkout: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Error occurred during checkout"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()


@client_reservation_bp.route("/tickets/<int:ticket_id>/cancel", methods=["PATCH"])
@token_required
def cancel_ticket(current_user_id, ticket_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query_check = """
            SELECT t.ticket_id, t.status, r.reservation_id, r.reservation_number, c.email, tr.departure_time
            FROM Ticket t
            JOIN Reservation r ON t.reservation_id = r.reservation_id
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Client c ON r.client_id = c.client_id
            WHERE t.ticket_id = %s AND r.client_id = %s;
        """
        cur.execute(query_check, (ticket_id, current_user_id))
        data = cur.fetchone()

        if not data:
            return jsonify({"error": "Bilet nie istnieje lub brak uprawnień."}), 404
        if data["status"] == "Cancelled":
            return jsonify({"error": "Ten bilet został już anulowany."}), 400

        if data["departure_time"] - datetime.now() < timedelta(hours=24):
            return jsonify({"error": "Bilet można anulować najpóźniej 24 godziny przed wyjazdem."}), 403

        cur.execute("UPDATE Ticket SET status = 'Cancelled' WHERE ticket_id = %s", (ticket_id,))
        cur.execute("UPDATE Reservation SET status = 'Cancelled' WHERE reservation_id = %s", (data["reservation_id"],))

        conn.commit()
        
        print(f"\n[MOCK EMAIL] DO: {data['email']}")
        print(f"Temat: Anulowanie rezerwacji {data['reservation_number']}")
        print(f"Treść: Twoja rezerwacja została pomyślnie anulowana.\n")

        return jsonify(
            {
                "message": "Bilet grupowy został anulowany, wszystkie miejsca zostały zwolnione.",
                "ticket_id": ticket_id,
                "new_status": "Cancelled",
            }
        ), 200

    except Exception as e:
        print(f"DB Error w /cancel: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Błąd serwera podczas anulowania biletu."}), 500
    finally:
        if conn:
            cur.close()
            conn.close()
