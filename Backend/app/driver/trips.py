from flask import Blueprint, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import driver_required

driver_trips_bp = Blueprint("driver_trips", __name__)


@driver_trips_bp.route("/", methods=["GET"])
@driver_required
def get_assigned_trips(current_driver_id):
    """
    Zwraca wszystkie kursy przypisane do zalogowanego kierowcy (harmonogram pracy).
    """
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

        # Zwracamy listę kursów (nawet jeśli jest pusta, to frontend sobie z tym poradzi)
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
    """
    Zwraca wszystkie przystanki na trasie w odpowiedniej kolejności dla danego kursu.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Pobieramy stacje, ale tylko jeśli ten kurs jest przypisany do zalogowanego kierowcy
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
    """
    Zwraca listę pasażerów przypisanych do tego kursu.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Pobieramy dane z rezerwacji. Znów sprawdzamy, czy kurs należy do tego kierowcy.
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

        # Zwracamy pustą listę jeśli nikogo nie ma, nie traktujemy tego jako błąd
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
    """
    Zwraca szczegółowe informacje o konkretnym kursie.
    Kierowca ma dostęp tylko do swoich własnych kursów.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Łączymy wybrane kolumny z tabel Trip, Route i Vehicle
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

        # Formatujemy klucze na camelCase zgodnie z wymaganiami frontendu
        return jsonify(
            {
                "id": trip["trip_id"],
                "routeName": trip["route_name"],
                "busBrand": trip["brand"],
                "busModel": trip["model"],
                "registrationNumber": trip["registration_number"],
                # Używamy vehicle_id jako numeru bocznego
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
