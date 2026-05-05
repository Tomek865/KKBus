from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

admin_auth_bp = Blueprint('admin_auth', __name__)

@admin_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Szukamy aktywnych pracowników, którzy mają uprawnienia do panelu
        query = """
            SELECT employee_id, password, first_name, last_name, role 
            FROM Employee 
            WHERE email = %s AND role IN ('Owner', 'Secretariat') AND is_active = TRUE
        """
        cur.execute(query, (data['email'],))
        admin_user = cur.fetchone()
        cur.close()

        # Weryfikacja hasła i generowanie tokena JWT
        if admin_user and check_password_hash(admin_user['password'], data['password']):
            token = jwt.encode({
                'employee_id': admin_user['employee_id'],
                'email': data['email'],
                'role': admin_user['role'],
                # Token na krócej lub dłużej, standardowo np. 12 godzin pracy biurowej
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "message": "Logged in successfully to the admin panel.", 
                "token": token,
                "admin_info": {
                    "first_name": admin_user['first_name'], 
                    "last_name": admin_user['last_name'],
                    "role": admin_user['role'] 
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials or missing permissions."}), 401

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()
