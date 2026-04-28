from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

driver_auth_bp = Blueprint('driver_auth', __name__)

@driver_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('haslo'):
        return jsonify({"error": "Brak adresu e-mail lub hasła"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Szukamy tylko aktywnych pracowników z rolą 'Kierowca'
        query = """
            SELECT id_pracownika, haslo, imie, nazwisko, rola 
            FROM Pracownik 
            WHERE email = %s AND rola = 'Kierowca' AND czy_aktywny = TRUE
        """
        cur.execute(query, (data['email'],))
        driver = cur.fetchone()
        cur.close()

        # Weryfikacja hasła i generowanie tokena JWT
        if driver and check_password_hash(driver['haslo'], data['haslo']):
            token = jwt.encode({
                'id_pracownika': driver['id_pracownika'],
                'email': data['email'],
                'rola': driver['rola'],
                # Token ważny 12 godzin (typowy czas trwania zmiany)
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "message": "Zalogowano pomyślnie na konto kierowcy.", 
                "token": token,
                "kierowca": {"imie": driver['imie'], "nazwisko": driver['nazwisko']}
            }), 200
        else:
            return jsonify({"error": "Nieprawidłowe dane logowania lub konto jest nieaktywne."}), 401

    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd serwera"}), 500
    finally:
        if conn:
            conn.close()
