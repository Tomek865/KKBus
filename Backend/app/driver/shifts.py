from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import driver_required

driver_shifts_bp = Blueprint("driver_shifts", __name__)

@driver_shifts_bp.route("/availability", methods=["POST"])
@driver_required
def handle_availability(current_user_id):
    data = request.get_json()
    date = data.get("date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    if not all([date, start_time, end_time]):
        return jsonify({"error": "Wszystkie pola są wymagane"}), 400

    # CZYSZCZENIE ID - zapobiega błędom w bazie jeśli ID to np. "E_15"
    try:
        clean_user_id = int(str(current_user_id).replace("E_", "").replace("D_", "").replace("C_", ""))
    except ValueError:
        clean_user_id = current_user_id

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = "INSERT INTO employee_availability (employee_id, available_date, start_time, end_time) VALUES (%s, %s, %s, %s)"
        cur.execute(query, (clean_user_id, date, start_time, end_time))
        conn.commit()
        return jsonify({"message": "Dyspozycyjność została zapisana"}), 201
    except Exception as e:
        # TO JEST NAJWAŻNIEJSZA LINIJKA - WYDRUKUJE NAM DOKŁADNY POWÓD BŁĘDU
        print(f"\n>>> BŁĄD 500 W BAZIE DANYCH: {str(e)}\n") 
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@driver_shifts_bp.route("/", methods=["GET"])
@driver_required
def get_my_shifts(current_user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = "SELECT shift_id, TO_CHAR(shift_date, 'YYYY-MM-DD') as date, TO_CHAR(start_time, 'HH24:MI') as start_time, TO_CHAR(end_time, 'HH24:MI') as end_time FROM Work_Shift WHERE employee_id = %s ORDER BY shift_date ASC"
        cur.execute(query, (current_user_id,))
        return jsonify(cur.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()