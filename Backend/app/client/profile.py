from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import token_required
from werkzeug.security import generate_password_hash

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


@client_profil_bp.route("/user/my-rewards", methods=["GET", "OPTIONS"])
@token_required
def get_my_rewards(current_user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                cr.reward_id, 
                r.name, 
                r.description, 
                COUNT(*) as quantity
            FROM Client_Reward cr
            JOIN Reward r ON cr.reward_id = r.reward_id
            WHERE cr.client_id = %s
            GROUP BY cr.reward_id, r.name, r.description
            ORDER BY cr.reward_id ASC;
        """
        cur.execute(query, (current_user_id,))
        my_rewards = cur.fetchall()
        cur.close()
        
        formatted_rewards = []
        for reward in my_rewards:
            reward_dict = dict(reward)
            reward_dict['icon'] = get_reward_icon(reward['name'])
            formatted_rewards.append(reward_dict)

        return jsonify(formatted_rewards), 200

    except Exception as e:
        print(f"DB Error w GET /user/my-rewards: {e}")
        return jsonify({"error": "Failed to fetch user rewards"}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/loyalty/rewards", methods=["GET", "OPTIONS"])
def get_all_rewards():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT reward_id, name, required_points, description 
            FROM Reward 
            ORDER BY required_points ASC;
        """
        cur.execute(query)
        db_rewards = cur.fetchall()
        cur.close()
        
        formatted_rewards = []
        for reward in db_rewards:
            reward_dict = dict(reward)
            reward_dict['icon'] = get_reward_icon(reward['name'])
            formatted_rewards.append(reward_dict)
            
        return jsonify(formatted_rewards), 200

    except Exception as e:
        print(f"DB Error w GET /loyalty/rewards: {e}")
        return jsonify({"error": "Failed to load rewards from database"}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/loyalty/purchase", methods=["POST", "OPTIONS"])
@token_required
def purchase_reward(current_user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing data payload"}), 400

    reward_id = data.get("reward_id")

    if not reward_id:
        return jsonify({"error": "Parameter 'reward_id' is required"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            "SELECT reward_id, required_points FROM Reward WHERE reward_id = %s;",
            (reward_id,),
        )
        reward_data = cur.fetchone()

        if not reward_data:
            return jsonify({"error": "Reward not found in database"}), 404

        actual_cost = reward_data["required_points"]

        cur.execute(
            "SELECT loyalty_points FROM Client WHERE client_id = %s;",
            (current_user_id,),
        )
        client_data = cur.fetchone()
        current_points = (
            client_data["loyalty_points"]
            if client_data and client_data["loyalty_points"] is not None
            else 0
        )

        if current_points < actual_cost:
            return jsonify({"error": "Not enough loyalty points for this reward"}), 403

        cur.execute(
            "UPDATE Client SET loyalty_points = loyalty_points - %s WHERE client_id = %s;",
            (actual_cost, current_user_id),
        )

        cur.execute(
            "INSERT INTO Client_Reward (client_id, reward_id) VALUES (%s, %s);",
            (current_user_id, reward_id),
        )

        conn.commit()
        cur.close()

        return jsonify({"message": "Reward redeemed successfully!"}), 200

    except Exception as e:
        print(f"DB Error w POST /loyalty/purchase: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Transaction failed due to server error"}), 500
    finally:
        if conn:
            conn.close()


def get_reward_icon(name):
    lower_name = name.lower()
    if 'ticket' in lower_name or 'ride' in lower_name: return 'ticket'
    if 'discount' in lower_name or 'zniżka' in lower_name: return 'pricetag'
    if 'seat' in lower_name or 'miejsce' in lower_name: return 'star'
    if 'luggage' in lower_name or 'bagaż' in lower_name: return 'briefcase'
    return 'gift'


@client_profil_bp.route("/user/update", methods=["POST", "PUT"])
@token_required
def update_profile(current_user_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    phone_number = data.get("phoneNumber")

    raw_password = data.get("password")
    hashed_password = None
    if raw_password:
        hashed_password = generate_password_hash(raw_password)

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        query = """
            UPDATE Client 
            SET first_name = COALESCE(%s, first_name), 
                last_name = COALESCE(%s, last_name), 
                email = COALESCE(%s, email),
                password = COALESCE(%s, password),
                phone_number = COALESCE(%s, phone_number)
            WHERE client_id = %s;
        """

        cur.execute(
            query,
            (
                first_name,
                last_name,
                email,
                hashed_password,
                phone_number,
                current_user_id,
            ),
        )

        conn.commit()
        cur.close()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print(f"DB Error w /user/update: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Server error while updating profile"}), 500
    finally:
        if conn:
            conn.close()


@client_profil_bp.route("/tickets", methods=["GET"])
@token_required
def get_tickets(current_user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tc.ticket_id,
                tc.status AS ticket_status,
                tc.ticket_summary,
                tc.final_price,
                r.reservation_number,
                TO_CHAR(r.reservation_date, 'YYYY-MM-DD HH24:MI') AS reservation_date,
                r.status AS reservation_status,
                rt.name AS route,
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI') AS departure_time
            FROM Ticket tc
            JOIN Reservation r ON tc.reservation_id = r.reservation_id
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Route rt ON tr.route_id = rt.route_id
            WHERE r.client_id = %s
            ORDER BY tr.departure_time DESC
        """
        cur.execute(query, (current_user_id,))
        tickets = cur.fetchall()
        cur.close()

        formatted_tickets = []
        for t in tickets:
            formatted_tickets.append(
                {
                    "ticketId": t["ticket_id"],
                    "ticketStatus": t["ticket_status"],
                    "ticketSummary": t["ticket_summary"],
                    "finalPrice": float(t["final_price"]),
                    "reservationNumber": t["reservation_number"],
                    "reservationDate": t["reservation_date"],
                    "reservationStatus": t["reservation_status"],
                    "route": t["route"],
                    "departureTime": t["departure_time"],
                }
            )

        return jsonify(formatted_tickets), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Wystąpił błąd podczas pobierania biletów"}), 500
    finally:
        if conn:
            conn.close()
