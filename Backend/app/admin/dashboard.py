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
        cur.execute("SELECT COALESCE(SUM(cena_koncowa), 0) AS przychod FROM Bilet;")
        revenue = cur.fetchone()['przychod']
        
        # Obliczamy pojazdy (Aktywne / Wszystkie)
        cur.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN czy_aktywny = TRUE THEN 1 ELSE 0 END) AS active FROM Pojazd;")
        buses_data = cur.fetchone()
        buses = f"{buses_data['active'] or 0} / {buses_data['total'] or 0}"
        
        # Obliczamy sumę zarezerwowanych miejsc (pasażerowie)
        cur.execute("SELECT COALESCE(SUM(liczba_miejsc), 0) AS pasazerowie FROM Rezerwacja WHERE status != 'Anulowana';")
        passengers = cur.fetchone()['pasazerowie']
        
        # Liczba tras
        cur.execute("SELECT COUNT(*) AS trasy FROM Trasa;")
        routes = cur.fetchone()['trasy']
        
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
        
        # Łączymy Klientów i Pracowników w jedną listę (UNION)
        query = """
            SELECT 
                'K_' || id_klienta AS id, 
                imie || ' ' || nazwisko AS name, 
                email, 
                'Passenger' AS role, 
                ilosc_niezrealizowanych_rezerwacji AS trips 
            FROM Klient
            UNION ALL
            SELECT 
                'P_' || id_pracownika AS id, 
                imie || ' ' || nazwisko AS name, 
                email, 
                rola AS role, 
                0 AS trips 
            FROM Pracownik
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
