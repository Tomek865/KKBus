from flask import Blueprint, jsonify, request
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import driver_required

driver_trips_bp = Blueprint("driver_trips", __name__)


@driver_trips_bp.route("/", methods=["GET"])
@driver_required
def get_assigned_trips(current_driver_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tr.trip_id,
                rt.name AS route_name,
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI') AS departure_time,
                TO_CHAR(tr.arrival_time, 'YYYY-MM-DD HH24:MI') AS arrival_time,
                v.registration_number AS bus_id,
                tr.status
            FROM Trip tr
            JOIN Route rt ON tr.route_id = rt.route_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.employee_id = %s
            ORDER BY tr.departure_time ASC;
        """
        cur.execute(query, (current_driver_id,))
        trips = cur.fetchall()
        cur.close()

        return jsonify(trips), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@driver_trips_bp.route("/<int:trip_id>/stations", methods=["GET"])
@driver_required
def get_trip_stations(current_driver_id, trip_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                s.station_id, 
                s.name, 
                s.exact_address, 
                rs.order_on_route
            FROM Trip tr
            JOIN Route_Station rs ON tr.route_id = rs.route_id
            JOIN Station s ON rs.station_id = s.station_id
            WHERE tr.trip_id = %s AND tr.employee_id = %s
            ORDER BY rs.order_on_route ASC;
        """
        cur.execute(query, (trip_id, current_driver_id))
        stations = cur.fetchall()
        cur.close()

        if not stations:
            return jsonify({"error": "Trip not found or access denied"}), 404

        return jsonify(stations), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@driver_trips_bp.route("/<int:trip_id>/passengers", methods=["GET"])
@driver_required
def get_trip_passengers(current_driver_id, trip_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                r.reservation_id,
                r.reservation_number,
                c.first_name,
                c.last_name,
                c.phone_number,
                r.seat_count,
                r.status,
                r.payment_status
            FROM Reservation r
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Client c ON r.client_id = c.client_id
            WHERE r.trip_id = %s 
              AND tr.employee_id = %s 
              AND r.status != 'Cancelled'
            ORDER BY c.last_name ASC;
        """
        cur.execute(query, (trip_id, current_driver_id))
        passengers = cur.fetchall()
        cur.close()

        return jsonify(passengers), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@driver_trips_bp.route("/<int:trip_id>", methods=["GET"])
@driver_required
def get_trip_details(current_driver_id, trip_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tr.trip_id,
                rt.name AS route_name,
                v.brand,
                v.model,
                v.registration_number,
                v.vehicle_id,
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI') AS departure_time,
                tr.status
            FROM Trip tr
            JOIN Route rt ON tr.route_id = rt.route_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.trip_id = %s AND tr.employee_id = %s;
        """
        cur.execute(query, (trip_id, current_driver_id))
        trip = cur.fetchone()
        cur.close()

        if not trip:
            return jsonify(
                {"error": "Trip not found or you don't have access to it"}
            ), 404

        return jsonify(
            {
                "id": trip["trip_id"],
                "routeName": trip["route_name"],
                "busBrand": trip["brand"],
                "busModel": trip["model"],
                "registrationNumber": trip["registration_number"],
                "busNumber": str(trip["vehicle_id"]),
                "departureTime": trip["departure_time"],
                "status": trip["status"],
            }
        ), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()

@driver_trips_bp.route("/fleet", methods=["GET"])
@driver_required
def get_fleet(current_driver_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT vehicle_id, brand, model, registration_number, status, parking_location, seating_capacity 
            FROM Vehicle WHERE is_active = TRUE
        """)
        fleet = cur.fetchall()
        return jsonify(fleet), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Wystąpił błąd przy pobieraniu floty"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@driver_trips_bp.route("/schedule", methods=["OPTIONS"])
def schedule_options():
    res = jsonify({})
    res.headers.add("Access-Control-Allow-Origin", "*")
    res.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    return res, 200

@driver_trips_bp.route("/schedule", methods=["GET", "POST"])
@driver_required
def handle_schedule(current_driver_id):
    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if request.method == "POST":
            data = request.get_json()
            
            if isinstance(data, dict):
                data = [data]

            if not isinstance(data, list):
                return jsonify({"error": "Nieprawidłowy format danych."}), 400

            query = """
                INSERT INTO Driver_Availability (employee_id, available_date, is_available, notes)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (employee_id, available_date) 
                DO UPDATE SET is_available = EXCLUDED.is_available, notes = EXCLUDED.notes
            """
            
            for item in data:
                date_str = item.get("date")
                is_available = item.get("is_available", True)
                notes = item.get("notes", "")

                if date_str:
                    cur.execute(query, (current_driver_id, date_str, is_available, notes))
            
            conn.commit()
            return jsonify({"message": "Zapisano dyspozycyjność dla wielu dni"}), 201

        else:
            cur.execute("""
                SELECT TO_CHAR(available_date, 'YYYY-MM-DD') as date, is_available, notes 
                FROM Driver_Availability 
                WHERE employee_id = %s AND available_date >= CURRENT_DATE
                ORDER BY available_date ASC
            """, (current_driver_id,))
            schedule = cur.fetchall()
            return jsonify(schedule), 200
            
    except Exception as e:
        print(f"DB Error w schedule: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Wystąpił błąd z dyspozycyjnością"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
