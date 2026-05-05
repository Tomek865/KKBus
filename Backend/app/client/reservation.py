from app.utils import token_required
from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
import time

client_reservation_bp = Blueprint("client_reservations", __name__)


@client_reservation_bp.route("/stations", methods=["GET"])
def get_stations():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT station_id AS id, name, exact_address FROM Station ORDER BY name ASC")
        stations = cur.fetchall()
        cur.close()
        return jsonify(stations), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error fetching stations"}), 500
    finally:
        if conn: conn.close()


@client_reservation_bp.route("/routes", methods=["GET"])
def search_routes():
    from_station = request.args.get("from")
    to_station = request.args.get("to")
    date = request.args.get("date")

    if not date or not from_station or not to_station:
        return jsonify({"error": "Parameters 'date', 'from', and 'to' are required."}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tr.trip_id, 
                r.name AS route_name, 
                TO_CHAR(tr.departure_time, 'HH24:MI') AS departure_time,
                TO_CHAR(tr.arrival_time, 'HH24:MI') AS arrival_time,
                v.seating_capacity,
                tr.status
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
        cur.close()

        return jsonify(departures), 200

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
    seat_count = data.get("seat_count", 1)

    if not trip_id:
        return jsonify({"error": "Missing trip ID"}), 400

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
                {
                    "error": f"Not enough seats available. Available: {available_seats}"
                }
            ), 409

        reservation_number = f"RES-{current_user_id}-{int(time.time())}"

        query_insert = """
            INSERT INTO Reservation (client_id, trip_id, reservation_number, status, seat_count)
            VALUES (%s, %s, %s, 'Pending Payment', %s) RETURNING reservation_id;
        """
        cur.execute(
            query_insert,
            (current_user_id, trip_id, reservation_number, seat_count),
        )
        new_id = cur.fetchone()["reservation_id"]

        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": "Reservation created successfully.",
                "reservation_number": reservation_number,
                "reservation_id": new_id,
            }
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error occurred during reservation"}), 500
    finally:
        if conn:
            conn.close()
