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

        # 1. ZMIANA STATUSU REZERWACJI I POBRANIE JEJ ID
        query_reservation = """
            UPDATE Reservation 
            SET status = 'Boarded' 
            WHERE reservation_number = %s 
            RETURNING reservation_id;
        """
        cur.execute(query_reservation, (res_number,))
        updated_reservation = cur.fetchone()

        # Jeśli fetchone() nic nie zwróci, to znaczy, że taki numer nie istnieje
        if not updated_reservation:
            return jsonify({"error": "Ticket not found."}), 404

        # Pobieramy reservation_id (zwykły kursor zwraca krotkę, więc indeks [0])
        reservation_id = updated_reservation[0]

        # 2. ZMIANA STATUSU FIZYCZNEGO BILETU (GRUPOWEGO) NA 'Realized'
        query_ticket = """
            UPDATE Ticket 
            SET status = 'Realized' 
            WHERE reservation_id = %s AND status != 'Cancelled';
        """
        cur.execute(query_ticket, (reservation_id,))

        # Zatwierdzenie obu zmian
        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": f"Ticket {res_number} validated successfully.",
                "reservation_status": "Boarded",
                "ticket_status": "Realized",
            }
        ), 200

    except Exception as e:
        print(f"DB Error w /validate: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Server error while validating ticket"}), 500
    finally:
        if conn:
            conn.close()
