from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

driver_auth_bp = Blueprint('driver_auth', __name__)

@driver_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT employee_id, password, first_name, last_name, role 
            FROM Employee 
            WHERE email = %s AND role = 'Driver' AND is_active = TRUE
        """
        cur.execute(query, (data['email'],))
        driver = cur.fetchone()
        cur.close()

        if driver and check_password_hash(driver['password'], data['password']):
            token = jwt.encode({
                'employee_id': driver['employee_id'],
                'email': data['email'],
                'role': driver['role'],
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "message": "Logged in successfully as a driver.", 
                "token": token,
                "driver": {"first_name": driver['first_name'], "last_name": driver['last_name']}
            }), 200
        else:
            return jsonify({"error": "Invalid credentials or account is inactive."}), 401

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()
