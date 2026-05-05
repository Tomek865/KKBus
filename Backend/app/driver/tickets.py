from flask import Blueprint, jsonify
from db import get_db_connection
from app.utils import token_required # Jeśli masz driver_required, warto go tu użyć zamiast token_required!

driver_tickets_bp = Blueprint('driver_tickets', __name__)

@driver_tickets_bp.route('/<int:ticket_id>/validate', methods=['POST'])
@token_required
def validate_ticket(current_user_id, ticket_id):
    # Update the reservation/ticket status to 'Boarded'
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # We change the status in the Reservation table
        # Wcześniej było id_rezerwacji, teraz używamy reservation_id
        query = "UPDATE Reservation SET status = 'Boarded' WHERE reservation_id = %s"
        cur.execute(query, (ticket_id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Ticket not found."}), 404
            
        conn.commit()
        cur.close()

        return jsonify({"message": f"Ticket {ticket_id} validated successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
