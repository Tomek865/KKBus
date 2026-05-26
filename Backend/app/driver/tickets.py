from flask import Blueprint, jsonify
from db import get_db_connection
from app.utils import token_required

driver_tickets_bp = Blueprint("driver_tickets", __name__)


@driver_tickets_bp.route("/<string:res_number>/validate", methods=["POST"])
@token_required
def validate_ticket(current_user_id, res_number):
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        query = (
            "UPDATE Reservation SET status = 'Boarded' WHERE reservation_number = %s"
        )
        cur.execute(query, (res_number,))

        if cur.rowcount == 0:
            return jsonify({"error": "Ticket not found."}), 404

        conn.commit()
        cur.close()

        return jsonify({"message": f"Ticket {res_number} validated successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
