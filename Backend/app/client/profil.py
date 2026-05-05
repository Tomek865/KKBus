from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import token_required

client_profil_bp = Blueprint("client_profile", __name__)

@client_profil_bp.route("/user/loyalty", methods=["GET"])
@token_required
def get_loyalty(current_user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT loyalty_points FROM Client WHERE client_id = %s",
            (current_user_id,),
        )
        loyalty_data = cur.fetchone()
        cur.close()

        if not loyalty_data:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"points": loyalty_data["loyalty_points"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/user/update", methods=["POST", "PUT"])
@token_required
def update_profile(current_user_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    phone_number = data.get("phone_number")

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = """
            UPDATE Client 
            SET first_name = COALESCE(%s, first_name), 
                last_name = COALESCE(%s, last_name), 
                phone_number = COALESCE(%s, phone_number)
            WHERE client_id = %s
        """
        cur.execute(query, (first_name, last_name, phone_number, current_user_id))
        conn.commit()
        cur.close()

        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/user/tickets", methods=["GET"])
@token_required
def get_tickets(current_user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT 
                r.reservation_number,
                r.reservation_date,
                r.status,
                t.name AS route,
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI') AS departure_time
            FROM Reservation r
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Route t ON tr.route_id = t.route_id
            WHERE r.client_id = %s
            ORDER BY tr.departure_time DESC
        """
        cur.execute(query, (current_user_id,))
        tickets = cur.fetchall()
        cur.close()

        return jsonify(tickets), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
