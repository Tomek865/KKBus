from flask import Blueprint, jsonify, request
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import admin_required

admin_shifts_bp = Blueprint("admin_shifts", __name__)

@admin_shifts_bp.route("/availability", methods=["GET"])
@admin_required
def get_availabilities(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT role FROM Employee WHERE employee_id = %s", (current_admin_id,))
        user_data = cur.fetchone()
        
        if not user_data:
            return jsonify({"error": "Brak uprawnień lub użytkownik nie istnieje"}), 403
            
        current_role = user_data["role"]

        # Właściciel widzi zgłoszoną dyspozycyjność Adminów i Kierowców. Admin widzi tylko Kierowców.
        role_filter = "('Admin', 'Driver')" if current_role == 'Owner' else "('Driver')"

        query = f"""
            SELECT a.availability_id, a.employee_id, e.first_name, e.last_name, e.role,
                   TO_CHAR(a.available_date, 'YYYY-MM-DD') as date,
                   TO_CHAR(a.start_time, 'HH24:MI') as start_time,
                   TO_CHAR(a.end_time, 'HH24:MI') as end_time
            FROM Employee_Availability a
            JOIN Employee e ON a.employee_id = e.employee_id
            WHERE e.role IN {role_filter}
            ORDER BY a.available_date ASC, e.last_name ASC;
        """
        cur.execute(query)
        data = cur.fetchall()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@admin_shifts_bp.route("/", methods=["POST"])
@admin_required
def create_shift(current_admin_id):
    data = request.get_json()
    target_employee_id = data.get("employee_id")
    shift_date = data.get("date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    if not all([target_employee_id, shift_date, start_time, end_time]):
        return jsonify({"error": "Wszystkie pola grafiku są wymagane"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Sprawdzenie uprawnień admina
        cur.execute("SELECT role FROM Employee WHERE employee_id = %s", (current_admin_id,))
        admin_data = cur.fetchone()
        if not admin_data:
             return jsonify({"error": "Sesja wygasła lub administrator nie istnieje."}), 403
        current_role = admin_data["role"]

        # 2. Sprawdzenie roli pracownika, któremu przypisujemy zmianę
        cur.execute("SELECT role FROM Employee WHERE employee_id = %s", (target_employee_id,))
        target_emp = cur.fetchone()

        if not target_emp:
            return jsonify({"error": "Wskazany pracownik nie istnieje"}), 404
        
        target_role = target_emp["role"]

        if current_role == 'Admin' and target_role != 'Driver':
            return jsonify({"error": "Brak uprawnień. Jako pracownik biura możesz ustalać grafik tylko dla kierowców."}), 403

        # ---------------------------------------------------------
        # NOWY KOD: Sprawdzenie, czy kierowca podał dyspozycyjność
        # ---------------------------------------------------------
        check_avail_query = """
            SELECT * FROM Employee_Availability 
            WHERE employee_id = %s AND available_date = %s
        """
        cur.execute(check_avail_query, (target_employee_id, shift_date))
        availability = cur.fetchone()

        # Jeśli zapytanie nic nie zwróciło, blokujemy operację
        if not availability:
            return jsonify({
                "error": f"Operacja zablokowana: Ten kierowca nie zgłosił dyspozycyjności na dzień {shift_date}."
            }), 400
        # ---------------------------------------------------------

        # 3. Zapisanie zmiany, jeśli wszystkie testy przeszły pomyślnie
        query = """
            INSERT INTO Work_Shift (employee_id, assigned_by, shift_date, start_time, end_time)
            VALUES (%s, %s, %s, %s, %s) RETURNING shift_id;
        """
        cur.execute(query, (target_employee_id, current_admin_id, shift_date, start_time, end_time))
        new_id = cur.fetchone()["shift_id"]
        
        conn.commit()
        return jsonify({"message": "Pomyślnie przypisano zmianę do grafiku", "shift_id": new_id}), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@admin_shifts_bp.route("/", methods=["GET"])
@admin_required
def get_shifts(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT role FROM Employee WHERE employee_id = %s", (current_admin_id,))
        admin_data = cur.fetchone()
        if not admin_data:
            return jsonify({"error": "Administrator nie istnieje"}), 403
            
        current_role = admin_data["role"]

        role_filter = "('Admin', 'Driver')" if current_role == 'Owner' else "('Driver')"

        query = f"SELECT w.shift_id, w.employee_id, e.first_name, e.last_name, e.role, TO_CHAR(w.shift_date, 'YYYY-MM-DD') as date, TO_CHAR(w.start_time, 'HH24:MI') as start_time, TO_CHAR(w.end_time, 'HH24:MI') as end_time FROM Work_Shift w JOIN Employee e ON w.employee_id = e.employee_id WHERE e.role IN {role_filter} ORDER BY w.shift_date ASC;"
        cur.execute(query)
        return jsonify(cur.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()