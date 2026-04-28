from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import token_required

klient_profil_bp = Blueprint("klient_profil", __name__)


@klient_profil_bp.route("/user/loyalty", methods=["GET"])
@token_required
def get_loyalty(current_user_id):
    # Pobieranie punktów lojalnościowych zalogowanego użytkownika
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT punkty_lojalnosciowe FROM Klient WHERE id_klienta = %s",
            (current_user_id,),
        )
        loyalty_data = cur.fetchone()
        cur.close()

        if not loyalty_data:
            return jsonify({"error": "Nie znaleziono użytkownika"}), 404

        return jsonify({"punkty": loyalty_data["punkty_lojalnosciowe"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@klient_profil_bp.route("/user/update", methods=["POST", "PUT"])
@token_required
def update_profile(current_user_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "Brak danych do aktualizacji"}), 400

    imie = data.get("imie")
    nazwisko = data.get("nazwisko")
    telefon = data.get("telefon")

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = """
            UPDATE Klient 
            SET imie = COALESCE(%s, imie), 
                nazwisko = COALESCE(%s, nazwisko), 
                numer_telefonu = COALESCE(%s, numer_telefonu)
            WHERE id_klienta = %s
        """
        cur.execute(query, (imie, nazwisko, telefon, current_user_id))
        conn.commit()
        cur.close()

        return jsonify({"message": "Zaktualizowano profil pomyślnie"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@klient_profil_bp.route("/user/tickets", methods=["GET"])
@token_required
def get_tickets(current_user_id):
    # Pobieranie zapisanych biletów użytkownika
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT 
                r.numer_rezerwacji,
                r.data_rezerwacji,
                r.status,
                t.nazwa AS trasa,
                TO_CHAR(k.data_wyjazdu, 'YYYY-MM-DD HH24:MI') as data_wyjazdu
            FROM Rezerwacja r
            JOIN Kurs k ON r.id_kursu = k.id_kursu
            JOIN Trasa t ON k.id_trasy = t.id_trasy
            WHERE r.id_klienta = %s
            ORDER BY k.data_wyjazdu DESC
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
