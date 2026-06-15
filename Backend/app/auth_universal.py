from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash

universal_auth_bp = Blueprint("universal_auth", __name__)


@universal_auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        email = data["email"]
        password_provided = data["password"]

        cur.execute(
            "SELECT client_id, password, first_name, last_name, phone_number FROM Client WHERE email = %s",
            (email,),
        )
        client = cur.fetchone()
        if client and check_password_hash(client["password"], password_provided):
            token = jwt.encode(
                {
                    "client_id": client["client_id"],
                    "role": "Client",
                    "exp": datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(hours=24),
                },
                current_app.config["SECRET_KEY"],
                algorithm="HS256",
            )

            return jsonify(
                {
                    "token": token,
                    "role": "Client",
                    "data": {
                        "first_name": client["first_name"],
                        "last_name": client["last_name"],
                        "email": email,
                        "phone": client["phone_number"],
                    },
                }
            ), 200

        cur.execute(
            "SELECT employee_id, password, first_name, last_name, role FROM Employee WHERE email = %s AND is_active = TRUE",
            (email,),
        )
        employee = cur.fetchone()

        if employee and check_password_hash(employee["password"], password_provided):
            token = jwt.encode(
                {
                    "employee_id": employee["employee_id"],
                    "role": employee["role"],
                    "exp": datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(hours=12),
                },
                current_app.config["SECRET_KEY"],
                algorithm="HS256",
            )

            return jsonify(
                {
                    "token": token,
                    "role": employee["role"],
                    "data": {
                        "first_name": employee["first_name"],
                        "last_name": employee["last_name"],
                        "email": email,
                    },
                }
            ), 200

        return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@universal_auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    phone_number = data.get("phone")
    birth_date_str = data.get("birthDate")
    role = data.get("role", "client")

    if not name or not email or not password or not phone_number or not birth_date_str:
        return jsonify({"error": "Missing required fields"}), 400

    if role.lower() != "client":
        return jsonify({"error": "Invalid role for public registration"}), 403

    try:
        birth_date = datetime.datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Expected DD-MM-YYYY"}), 400

    name_parts = name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute("SELECT client_id FROM Client WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email is already registered"}), 409

        cur.execute("SELECT employee_id FROM Employee WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email is already registered"}), 409

        query = """
            INSERT INTO Client (first_name, last_name, email, password, phone_number, birth_date, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE) RETURNING client_id;
        """
        cur.execute(
            query,
            (first_name, last_name, email, hashed_password, phone_number, birth_date),
        )

        conn.commit()
        cur.close()

        return jsonify({"message": "Registration successful"}), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()
