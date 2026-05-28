from flask import Blueprint, jsonify, request
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import admin_required

admin_fleet_bp = Blueprint("admin_fleet", __name__)


@admin_fleet_bp.route("/", methods=["GET"])
@admin_required
def get_fleet_assignments(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tr.trip_id AS id, 
                v.registration_number AS "busId", 
                rt.name AS route, 
                tr.status, 
                e.first_name || ' ' || LEFT(e.last_name, 1) || '.' AS driver
            FROM Trip tr
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            JOIN Route rt ON tr.route_id = rt.route_id
            JOIN Employee e ON tr.employee_id = e.employee_id
            ORDER BY tr.departure_time DESC;
        """
        cur.execute(query)
        fleet_data = cur.fetchall()
        cur.close()

        return jsonify(fleet_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/<int:assignment_id>", methods=["PATCH"])
@admin_required
def cancel_fleet_assignment(current_admin_id, assignment_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute(
            "UPDATE Trip SET status = 'Cancelled' WHERE trip_id = %s", (assignment_id,)
        )

        if cur.rowcount == 0:
            return jsonify({"error": "Trip not found"}), 404

        cur.execute(
            "UPDATE Reservation SET status = 'Cancelled' WHERE trip_id = %s",
            (assignment_id,),
        )

        conn.commit()
        cur.close()

        return jsonify({"message": "Trip cancelled successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/", methods=["POST"])
@admin_required
def create_trip(current_admin_id):
    from datetime import datetime, timedelta

    data = request.get_json()
    vehicle_id = data.get("busId")
    route_id = data.get("route")
    employee_id = data.get("driver")
    status = data.get("status", "Planned")
    departure_time = data.get("departureTime", datetime.now() + timedelta(days=1))
    arrival_time = data.get("arrivalTime", departure_time + timedelta(hours=4))

    if not vehicle_id or not route_id or not employee_id:
        return jsonify({"message": "All fields are required"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        query = """
            INSERT INTO Trip (vehicle_id, route_id, employee_id, departure_time, arrival_time, status)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING trip_id;
        """
        cur.execute(
            query,
            (vehicle_id, route_id, employee_id, departure_time, arrival_time, status),
        )
        new_id = cur.fetchone()[0]

        cur.execute(
            "SELECT registration_number FROM Vehicle WHERE vehicle_id = %s",
            (vehicle_id,),
        )
        bus_reg = cur.fetchone()[0]

        cur.execute("SELECT name FROM Route WHERE route_id = %s", (route_id,))
        route_name = cur.fetchone()[0]

        cur.execute(
            "SELECT first_name FROM Employee WHERE employee_id = %s", (employee_id,)
        )
        driver_name = cur.fetchone()[0]

        conn.commit()
        cur.close()

        return jsonify(
            {
                "id": new_id,
                "busId": bus_reg,
                "route": route_name,
                "driver": driver_name,
                "status": status,
            }
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Error creating trip"}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/buses", methods=["GET"])
@admin_required
def get_all_buses(current_admin_id):
    """
    Pobiera pełną listę wszystkich autobusów ze szczegółami.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT 
                vehicle_id, 
                vin, 
                registration_number, 
                brand, 
                model, 
                status, 
                parking_location, 
                seating_capacity, 
                is_active 
            FROM Vehicle 
            ORDER BY vehicle_id ASC;
        """
        cur.execute(query)
        buses = cur.fetchall()
        cur.close()

        formatted_buses = [
            {
                "id": b["vehicle_id"],
                "vin": b["vin"],
                "registrationNumber": b["registration_number"],
                "brand": b["brand"],
                "model": b["model"],
                "status": b["status"],
                "parkingLocation": b["parking_location"],
                "seatingCapacity": b["seating_capacity"],
                "isActive": b["is_active"],
            }
            for b in buses
        ]

        return jsonify(formatted_buses), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/buses", methods=["POST"])
@admin_required
def create_bus(current_admin_id):
    """
    Dodaje nowy autobus ze wszystkimi wymaganymi polami.
    """
    data = request.get_json()

    vin = data.get("vin")
    registration_number = data.get("registrationNumber")
    brand = data.get("brand")
    model = data.get("model")
    status = data.get("status", "Available")
    parking_location = data.get("parkingLocation", "")
    seating_capacity = data.get("seatingCapacity")
    is_active = data.get("isActive", True)

    if (
        not vin
        or not registration_number
        or not brand
        or not model
        or not seating_capacity
    ):
        return jsonify(
            {
                "error": "VIN, registration number, brand, model, and seating capacity are required"
            }
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = """
            INSERT INTO Vehicle (vin, registration_number, brand, model, status, parking_location, seating_capacity, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING vehicle_id;
        """
        cur.execute(
            query,
            (
                vin,
                registration_number,
                brand,
                model,
                status,
                parking_location,
                seating_capacity,
                is_active,
            ),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        return jsonify(
            {
                "id": new_id,
                "vin": vin,
                "registrationNumber": registration_number,
                "brand": brand,
                "model": model,
                "status": status,
                "parkingLocation": parking_location,
                "seatingCapacity": seating_capacity,
                "isActive": is_active,
            }
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error creating bus. Check if VIN is unique."}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/routes", methods=["POST"])
@admin_required
def create_route(current_admin_id):
    """
    Tworzy nową, pustą trasę (bez przypisanych jeszcze przystanków).
    """
    data = request.get_json()
    name = data.get("name")

    if not name:
        return jsonify({"error": "Route name is required"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = "INSERT INTO Route (name) VALUES (%s) RETURNING route_id;"
        cur.execute(query, (name,))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        return jsonify({"id": new_id, "name": name}), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error creating route"}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/routes", methods=["GET"])
@admin_required
def get_all_routes(current_admin_id):
    """
    Pobiera listę wszystkich tras w systemie (przydatne do dropdowna).
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT route_id AS id, name FROM Route ORDER BY name ASC;")
        routes = cur.fetchall()
        cur.close()

        return jsonify(routes), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/drivers", methods=["GET"])
@admin_required
def get_all_drivers(current_admin_id):
    """
    Pobiera listę tylko tych pracowników, którzy są kierowcami i są aktywni.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT 
                employee_id AS id, 
                first_name || ' ' || last_name AS name,
                email
            FROM Employee 
            WHERE role = 'Driver' AND is_active = TRUE
            ORDER BY last_name ASC;
        """
        cur.execute(query)
        drivers = cur.fetchall()
        cur.close()

        return jsonify(drivers), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


# ==========================================
# ZARZĄDZANIE PRZYSTANKAMI (Stations)
# ==========================================


@admin_fleet_bp.route("/stations", methods=["GET"])
@admin_required
def get_fleet_stations(current_admin_id):
    """
    Pobiera listę wszystkich przystanków w systemie.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT station_id AS id, name, exact_address FROM Station ORDER BY name ASC;"
        )
        stations = cur.fetchall()
        cur.close()

        # Formatujemy na camelCase dla frontendu
        formatted = [
            {"id": s["id"], "name": s["name"], "exactAddress": s["exact_address"]}
            for s in stations
        ]

        return jsonify(formatted), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/stations", methods=["POST"])
@admin_required
def create_station(current_admin_id):
    """
    Tworzy nowy przystanek (stację) w bazie danych.
    """
    data = request.get_json()
    name = data.get("name")
    exact_address = data.get("exact_address")

    if not name or not exact_address:
        return jsonify({"error": "Station name and exact address are required"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = "INSERT INTO Station (name, exact_address) VALUES (%s, %s) RETURNING station_id;"
        cur.execute(query, (name, exact_address))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        return jsonify({"id": new_id, "name": name, "exactAddress": exact_address}), 201
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


# ==========================================
# PRZYPISYWANIE PRZYSTANKÓW DO TRASY
# ==========================================


@admin_fleet_bp.route("/routes/<int:route_id>/stations", methods=["POST"])
@admin_required
def assign_stations_to_route(current_admin_id, route_id):
    """
    Przyjmuje tablicę z ID przystanków (np. [1, 5, 3, 2])
    i zapisuje je w bazie w podanej kolejności dla danej trasy.
    """
    data = request.get_json()
    station_ids = data.get("stations")  # Oczekujemy tablicy: [1, 5, 3, 2]

    # Sprawdzamy, czy w ogóle dostaliśmy dane i czy faktycznie są one listą (tablicą)
    if not station_ids or not isinstance(station_ids, list):
        return jsonify(
            {"error": "No stations provided. Expected an array of IDs."}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # 1. Czyścimy obecne przystanki przypisane do tej trasy
        cur.execute("DELETE FROM Route_Station WHERE route_id = %s", (route_id,))

        # 2. Wrzucamy przystanki po kolei z otrzymanej listy
        query = """
            INSERT INTO Route_Station (route_id, station_id, order_on_route)
            VALUES (%s, %s, %s);
        """

        for index, station_id in enumerate(station_ids):
            # Pierwszy element w tablicy dostanie numer 1, drugi 2, itd.
            order = index + 1
            # Rzutujemy station_id na int, by uniknąć błędów jeśli frontend wyśle np. ["1", "2"]
            cur.execute(query, (route_id, int(station_id), order))

        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": f"Successfully assigned {len(station_ids)} stations to route {route_id} in order."
            }
        ), 200

    except Exception as e:
        if conn:
            conn.rollback()  # Cofamy operację, jeśli któraś stacja np. nie istnieje w bazie
        print(f"DB Error: {e}")
        return jsonify(
            {"error": "Server error occurred. Make sure all station IDs exist."}
        ), 500
    finally:
        if conn:
            conn.close()


@admin_fleet_bp.route("/routes/<int:route_id>/stations", methods=["GET"])
@admin_required
def get_route_stations(current_admin_id, route_id):
    """
    Pobiera listę wszystkich przystanków przypisanych do danej trasy
    w odpowiedniej kolejności (order_on_route).
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Łączymy tabelę łącznikową Route_Station z tabelą Station,
        # aby wyciągnąć pełne dane o przystankach dla konkretnej trasy
        query = """
            SELECT 
                s.station_id AS id,
                s.name,
                s.exact_address,
                rs.order_on_route
            FROM Route_Station rs
            JOIN Station s ON rs.station_id = s.station_id
            WHERE rs.route_id = %s
            ORDER BY rs.order_on_route ASC;
        """
        cur.execute(query, (route_id,))
        stations = cur.fetchall()
        cur.close()

        # Formatujemy klucze na camelCase dla spójności z frontendem Reacta
        formatted_stations = [
            {
                "id": s["id"],
                "name": s["name"],
                "exactAddress": s["exact_address"],
                "orderOnRoute": s["order_on_route"],
            }
            for s in stations
        ]

        return jsonify(formatted_stations), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()
