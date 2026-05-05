from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

client_auth_bp = Blueprint("client_auth", __name__)


@client_auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Prosta walidacja czy przyszły wymagane dane (klucze po angielsku)
    if (
        not data
        or not data.get("email")
        or not data.get("password")
        or not data.get("first_name")
        or not data.get("last_name")
    ):
        return jsonify({"error": "Missing form data"}), 400

    hashed_password = generate_password_hash(data["password"])

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Sprawdzamy, czy email już istnieje
        cur.execute(
            "SELECT client_id FROM Client WHERE email = %s", (data["email"],))
        if cur.fetchone():
            return jsonify(
                {"error": "User with this email already exists!"}
            ), 409

        # Zapis do bazy danych
        query = """
            INSERT INTO Client (first_name, last_name, email, password, phone_number)
            VALUES (%s, %s, %s, %s, %s) RETURNING client_id;
        """
        cur.execute(
            query,
            (
                data["first_name"],
                data["last_name"],
                data["email"],
                hashed_password,
                data.get("phone_number"),
            ),
        )

        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        return jsonify(
            {"message": "Registration successful!", "client_id": new_id}
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@client_auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT client_id, password, first_name, last_name FROM Client WHERE email = %s",
            (data["email"],),
        )
        user = cur.fetchone()
        cur.close()

        # Sprawdzamy hasło i generujemy Token JWT
        if user and check_password_hash(user["password"], data["password"]):
            token = jwt.encode(
                {
                    "client_id": user["client_id"], # Zmienione z id_klienta
                    "email": data["email"],
                    "first_name": user["first_name"], # Zmienione z imie
                    "exp": datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(hours=24),
                },
                current_app.config["SECRET_KEY"],
                algorithm="HS256",
            )

            return jsonify(
                {
                    "message": "Logged in successfully",
                    "token": token,
                    "client": {"first_name": user["first_name"], "last_name": user["last_name"]},
                }
            ), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()
