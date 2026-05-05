from flask import Blueprint, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import admin_required

admin_dashboard_bp = Blueprint('admin_dashboard', __name__)

@admin_dashboard_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Obliczamy Przychody (suma sprzedanych biletów)
        cur.execute("SELECT COALESCE(SUM(final_price), 0) AS revenue FROM Ticket;")
        revenue = cur.fetchone()['revenue']
        
        # Obliczamy pojazdy (Aktywne / Wszystkie)
        cur.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS active FROM Vehicle;")
        buses_data = cur.fetchone()
        buses = f"{buses_data['active'] or 0} / {buses_data['total'] or 0}"
        
        # Obliczamy sumę zarezerwowanych miejsc (pasażerowie)
        cur.execute("SELECT COALESCE(SUM(seat_count), 0) AS passengers FROM Reservation WHERE status != 'Cancelled';")
        passengers = cur.fetchone()['passengers']
        
        # Liczba tras
        cur.execute("SELECT COUNT(*) AS routes FROM Route;")
        routes = cur.fetchone()['routes']
        
        cur.close()

        # Zwracamy w formacie, jakiego oczekuje React
        return jsonify({
            "revenue": f"{revenue:,.2f} PLN",
            "buses": buses,
            "passengers": f"{passengers:,}",
            "routes": str(routes)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@admin_dashboard_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Łączymy Klientów i Pracowników w jedną listę (UNION). Zmieniłem K_ na C_ (Client) i P_ na E_ (Employee)
        query = """
            SELECT 
                'C_' || client_id AS id, 
                first_name || ' ' || last_name AS name, 
                email, 
                'Passenger' AS role, 
                unfulfilled_reservations_count AS trips 
            FROM Client
            UNION ALL
            SELECT 
                'E_' || employee_id AS id, 
                first_name || ' ' || last_name AS name, 
                email, 
                role AS role, 
                0 AS trips 
            FROM Employee
            ORDER BY name ASC;
        """
        cur.execute(query)
        users = cur.fetchall()
        cur.close()

        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
