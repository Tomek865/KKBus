from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

universal_auth_bp = Blueprint('universal_auth', __name__)

@universal_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('haslo'):
        return jsonify({"error": "Brak adresu e-mail lub hasła"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        email = data['email']
        haslo_podane = data['haslo']

        # 1. Najpierw sprawdzamy, czy to KLIENT
        cur.execute("SELECT client_id, password, first_name, last_name FROM Client WHERE email = %s", (email,))
        klient = cur.fetchone()

        if klient and check_password_hash(klient['haslo'], haslo_podane):
            token = jwt.encode({
                'id_uzytkownika': klient['id_klienta'],
                'rola': 'Klient',
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "token": token,
                "rola": "Klient",
                "dane": {"imie": klient['imie'], "nazwisko": klient['nazwisko']}
            }), 200

        # 2. Jeśli to nie Klient, sprawdzamy, czy to PRACOWNIK (Kierowca, Sekretariat, Wlasciciel)
        cur.execute("SELECT employee_id, password, first_name, last_name, role FROM Employee WHERE email = %s AND is_active = TRUE", (email,))
        pracownik = cur.fetchone()

        if pracownik and check_password_hash(pracownik['haslo'], haslo_podane):
            token = jwt.encode({
                'id_uzytkownika': pracownik['id_pracownika'],
                'rola': pracownik['rola'],
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "token": token,
                "rola": pracownik['rola'], # Tutaj wyślemy 'Kierowca', 'Wlasciciel' lub 'Sekretariat'
                "dane": {"imie": pracownik['imie'], "nazwisko": pracownik['nazwisko']}
            }), 200

        # 3. Jeśli nie znaleziono ani tu, ani tu (lub hasło błędne)
        return jsonify({"error": "Nieprawidłowy e-mail lub hasło"}), 401

    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd serwera"}), 500
    finally:
        if conn: conn.close()
