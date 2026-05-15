from flask import Blueprint, jsonify, request
from db import get_db_connection
from app.utils import admin_required
from werkzeug.security import generate_password_hash

admin_management_bp = Blueprint('admin_management', __name__)

@admin_management_bp.route('/users/<string:user_id>', methods=['PATCH'])
@admin_required
def deactivate_user(current_admin_id, user_id):
    """
    Endpoint dezaktywuje użytkownika (soft delete) na podstawie jego ID z frontendu 
    (np. 'C_1' dla klienta, 'E_2' dla pracownika).
    """
    if not user_id or '_' not in user_id:
        return jsonify({"error": "Invalid user ID format"}), 400

    user_type, actual_id = user_id.split('_')
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        if user_type == 'C':
            cur.execute("UPDATE Client SET is_active = FALSE WHERE client_id = %s", (actual_id,))
        elif user_type == 'E':
            if int(actual_id) == current_admin_id:
                return jsonify({"error": "You cannot deactivate your own account"}), 403
            cur.execute("UPDATE Employee SET is_active = FALSE WHERE employee_id = %s", (actual_id,))
        else:
            return jsonify({"error": "Unknown user type"}), 400

        if cur.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close()

        return jsonify({"message": "User deactivated successfully"}), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn: conn.close()


@admin_management_bp.route('/users', methods=['POST'])
@admin_required
def create_user(current_admin_id):
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    role = data.get('role')
    is_active = data.get('isActive', True)
    
    if not name or not email:
        return jsonify({"message": "Name and email are required"}), 400

    name_parts = name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    default_password = generate_password_hash("haslo123")

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        if role == 'Client':
            query = """
                INSERT INTO Client (first_name, last_name, email, password, is_active)
                VALUES (%s, %s, %s, %s, %s) RETURNING client_id;
            """
            cur.execute(query, (first_name, last_name, email, default_password, is_active))
            new_id = f"C_{cur.fetchone()[0]}"
        else:
            query = """
                INSERT INTO Employee (first_name, last_name, email, password, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING employee_id;
            """
            cur.execute(query, (first_name, last_name, email, default_password, role, is_active))
            new_id = f"E_{cur.fetchone()[0]}"

        conn.commit()
        cur.close()

        return jsonify({
            "id": new_id,
            "name": name,
            "email": email,
            "role": role,
            "isActive": is_active,
            "trips": 0
        }), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Email already exists or server error"}), 500
    finally:
        if conn: conn.close()
