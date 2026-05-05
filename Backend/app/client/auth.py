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

    # Prosta walidacja czy przyszły wymagane dane
    if (
        not data
        or not data.get("email")
        or not data.get("haslo")
        or not data.get("imie")
        or not data.get("nazwisko")
    ):
        return jsonify({"error": "Brakujące dane w formularzu"}), 400

    hashed_password = generate_password_hash(data["haslo"])

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Sprawdzamy, czy email już istnieje
        cur.execute(
            "SELECT id_clienta FROM Klient WHERE email = %s", (data["email"],))
        if cur.fetchone():
            return jsonify(
                {"error": "Użytkownik o tym adresie e-mail już istnieje!"}
            ), 409

        # Zapis do bazy danych
        query = """
            INSERT INTO client (imie, nazwisko, email, haslo, numer_telefonu)
            VALUES (%s, %s, %s, %s, %s) RETURNING id_clienta;
        """
        cur.execute(
            query,
            (
                data["imie"],
                data["nazwisko"],
                data["email"],
                hashed_password,
                data.get("numer_telefonu"),
            ),
        )

        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        return jsonify(
            {"message": "Rejestracja zakończona sukcesem!", "id_clienta": new_id}
        ), 201

    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd serwera"}), 500
    finally:
        if conn:
            conn.close()


@client_auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("haslo"):
        return jsonify({"error": "Brak adresu e-mail lub hasła"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id_clienta, haslo, imie, nazwisko FROM Klient WHERE email = %s",
            (data["email"],),
        )
        user = cur.fetchone()
        cur.close()

        # Sprawdzamy hasło i generujemy Token JWT
        if user and check_password_hash(user["haslo"], data["haslo"]):
            token = jwt.encode(
                {
                    "id_clienta": user["id_klienta"],
                    "email": data["email"],
                    "imie": user["imie"],
                    "exp": datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(hours=24),
                },
                current_app.config["SECRET_KEY"],
                algorithm="HS256",
            )

            return jsonify(
                {
                    "message": "Zalogowano pomyślnie",
                    "token": token,
                    "client": {"imie": user["imie"], "nazwisko": user["nazwisko"]},
                }
            ), 200
        else:
            return jsonify({"error": "Nieprawidłowy e-mail lub hasło"}), 401

    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd serwera"}), 500
    finally:
        if conn:
            conn.close()
