from flask import Blueprint, jsonify
from db import get_db_connection
from app.utils import token_required

driver_tickets_bp = Blueprint('driver_tickets', __name__)

@driver_tickets_bp.route('/<int:ticket_id>/validate', methods=['POST'])
@token_required
def validate_ticket(current_user_id, ticket_id):
    # Aktualizujemy status rezerwacji/biletu na 'Zrealizowana' (boarded)
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Zakładamy, że zmieniamy status w tabeli Rezerwacja
        query = "UPDATE Rezerwacja SET status = 'Zrealizowana' WHERE id_rezerwacji = %s"
        cur.execute(query, (ticket_id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Nie znaleziono biletu."}), 404
            
        conn.commit()
        cur.close()

        return jsonify({"message": f"Bilet {ticket_id} zwalidowany poprawnie."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
