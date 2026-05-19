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
    data = request.get_json()
    vehicle_id = data.get("busId")
    route_id = data.get("route")
    employee_id = data.get("driver")
    status = data.get("status", "Planned")

    from datetime import datetime, timedelta

    departure_time = datetime.now() + timedelta(days=1)
    arrival_time = departure_time + timedelta(hours=4)

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
    Pobiera listę wszystkich autobusów w systemie.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT vehicle_id, registration_number, seating_capacity, is_active FROM Vehicle ORDER BY vehicle_id ASC;"
        )
        buses = cur.fetchall()
        cur.close()

        return jsonify(buses), 200
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
    Dodaje nowy autobus do bazy danych.
    """
    data = request.get_json()
    registration_number = data.get("registrationNumber")
    seating_capacity = data.get("seatingCapacity")
    is_active = data.get("isActive", True)

    if not registration_number or not seating_capacity:
        return jsonify(
            {"error": "Registration number and seating capacity are required"}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = """
            INSERT INTO Vehicle (registration_number, seating_capacity, is_active)
            VALUES (%s, %s, %s) RETURNING vehicle_id;
        """
        cur.execute(query, (registration_number, seating_capacity, is_active))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        return jsonify(
            {
                "id": new_id,
                "registrationNumber": registration_number,
                "seatingCapacity": seating_capacity,
                "isActive": is_active,
            }
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify(
            {"error": "Error creating bus (maybe registration already exists?)"}
        ), 500
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
