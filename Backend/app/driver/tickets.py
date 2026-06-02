from flask import Blueprint, jsonify, request
from db import get_db_connection
from app.utils import driver_required

driver_tickets_bp = Blueprint("driver_tickets", __name__)


@driver_tickets_bp.route("/<string:res_number>/validate", methods=["POST"])
@driver_required
def validate_ticket(current_user_id, res_number):
    data = request.get_json(silent=True) or {}
    active_trip_id = data.get("trip_id")

    if not active_trip_id:
        return jsonify(
            {"error": "Brak ID aktualnego kursu w zapytaniu (trip_id)."}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        query_check = """
            SELECT 
                r.reservation_id,
                r.status,
                tr.trip_id,
                tr.employee_id, 
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI')
            FROM Reservation r
            JOIN Trip tr ON r.trip_id = tr.trip_id
            WHERE r.reservation_number = %s;
        """
        cur.execute(query_check, (res_number,))

        ticket_info = cur.fetchone()
        print(ticket_info)

        if not ticket_info:
            return jsonify({"error": "Nie znaleziono takiego biletu w systemie."}), 404

        if ticket_info[1] == "Cancelled":
            return jsonify(
                {"error": "Błąd! Ten bilet został anulowany i jest nieważny."}
            ), 400

        if ticket_info[1] == "Boarded":
            return jsonify({"error": "Uwaga! Ten bilet został już zeskanowany."}), 409

        if ticket_info[2] != int(active_trip_id):
            return jsonify(
                {
                    "error": "Błąd kursu! Ten bilet jest wystawiony na inny przejazd.",
                    "expected_trip_time": ticket_info[4],
                }
            ), 403

        if ticket_info[3] != current_user_id:
            return jsonify(
                {"error": "Brak uprawnień. Ten kurs obsługuje inny kierowca."}
            ), 403

        reservation_id = ticket_info[0]

        cur.execute(
            "UPDATE Reservation SET status = 'Boarded' WHERE reservation_id = %s",
            (reservation_id,),
        )

        cur.execute(
            "UPDATE Ticket SET status = 'Realized' WHERE reservation_id = %s AND status != 'Cancelled'",
            (reservation_id,),
        )

        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": "Bilet zweryfikowany pomyślnie!",
                "reservation_status": "Boarded",
                "ticket_status": "Realized",
            }
        ), 200

    except Exception as e:
        print(f"DB Error w /validate: {e}")
        if conn:
            conn.rollback()
        return jsonify(
            {"error": "Wystąpił błąd serwera podczas walidacji biletu."}
        ), 500
    finally:
        if conn:
            conn.close()
