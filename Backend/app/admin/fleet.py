from flask import Blueprint, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import admin_required

admin_fleet_bp = Blueprint('admin_fleet', __name__)

@admin_fleet_bp.route('/', methods=['GET'])
@admin_required
def get_fleet_assignments(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Wyciągamy dane o kursie ze złączeniem tras, pojazdów i pracowników
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
        if conn: conn.close()

@admin_fleet_bp.route('/<int:assignment_id>', methods=['DELETE'])
@admin_required
def delete_fleet_assignment(current_admin_id, assignment_id):
    # Usuwanie (lub anulowanie) zaplanowanego kursu
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Opcja B: Miękkie usunięcie (Zalecane w transporcie) - Przetłumaczone na status 'Cancelled'
        cur.execute("UPDATE Trip SET status = 'Cancelled' WHERE trip_id = %s", (assignment_id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Trip not found"}), 404
            
        conn.commit()
        cur.close()

        return jsonify({"message": "Fleet assignment removed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
