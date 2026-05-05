from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

universal_auth_bp = Blueprint('universal_auth', __name__)

@universal_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # ZMIANA: Szukamy klucza 'password' zamiast 'haslo'
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        email = data['email']
        password_provided = data['password']

        # 1. Najpierw sprawdzamy, czy to KLIENT (tabela Client)
        cur.execute("SELECT client_id, password, first_name, last_name FROM Client WHERE email = %s", (email,))
        client = cur.fetchone()

        if client and check_password_hash(client['password'], password_provided):
            token = jwt.encode({
                'client_id': client['client_id'], 
                'role': 'Client',
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "token": token,
                "role": "Client",
                "data": {"first_name": client['first_name'], "last_name": client['last_name']}
            }), 200

        # 2. Jeśli to nie Klient, sprawdzamy, czy to PRACOWNIK (tabela Employee)
        cur.execute("SELECT employee_id, password, first_name, last_name, role FROM Employee WHERE email = %s AND is_active = TRUE", (email,))
        employee = cur.fetchone()

        if employee and check_password_hash(employee['password'], password_provided):
            token = jwt.encode({
                'employee_id': employee['employee_id'],
                'role': employee['role'],
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "token": token,
                "role": employee['role'], 
                "data": {"first_name": employee['first_name'], "last_name": employee['last_name']}
            }), 200

        # 3. Błędne dane
        return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn: conn.close()
