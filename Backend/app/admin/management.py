from flask import Blueprint, jsonify
from db import get_db_connection
from app.utils import admin_required

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
