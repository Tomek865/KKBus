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
                k.id_kursu AS id, 
                p.nr_rejestracyjny AS "busId", 
                t.nazwa AS route, 
                k.status, 
                pr.imie || ' ' || LEFT(pr.nazwisko, 1) || '.' AS driver
            FROM Kurs k
            JOIN Pojazd p ON k.id_pojazdu = p.id_pojazdu
            JOIN Trasa t ON k.id_trasy = t.id_trasy
            JOIN Pracownik pr ON k.id_pracownika = pr.id_pracownika
            ORDER BY k.data_wyjazdu DESC;
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
        
        # Opcja A: Twarde usunięcie
        # cur.execute("DELETE FROM Kurs WHERE id_kursu = %s", (assignment_id,))
        
        # Opcja B: Miękkie usunięcie (Zalecane w transporcie)
        cur.execute("UPDATE Kurs SET status = 'Anulowany' WHERE id_kursu = %s", (assignment_id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Nie znaleziono kursu"}), 404
            
        conn.commit()
        cur.close()

        return jsonify({"message": "Pomyślnie usunięto przypisanie z floty"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
