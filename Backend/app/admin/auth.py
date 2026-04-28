from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import jwt
import datetime
from db import get_db_connection
from psycopg2.extras import RealDictCursor

admin_auth_bp = Blueprint('admin_auth', __name__)

@admin_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('haslo'):
        return jsonify({"error": "Brak adresu e-mail lub hasła"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Szukamy aktywnych pracowników, którzy mają uprawnienia do panelu
        query = """
            SELECT id_pracownika, haslo, imie, nazwisko, rola 
            FROM Pracownik 
            WHERE email = %s AND rola IN ('Wlasciciel', 'Sekretariat') AND czy_aktywny = TRUE
        """
        cur.execute(query, (data['email'],))
        admin_user = cur.fetchone()
        cur.close()

        # Weryfikacja hasła i generowanie tokena JWT
        if admin_user and check_password_hash(admin_user['haslo'], data['haslo']):
            token = jwt.encode({
                'id_pracownika': admin_user['id_pracownika'],
                'email': data['email'],
                'rola': admin_user['rola'],
                # Token na krócej lub dłużej, standardowo np. 12 godzin pracy biurowej
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "message": "Zalogowano pomyślnie do panelu administracyjnego.", 
                "token": token,
                "admin_info": {
                    "imie": admin_user['imie'], 
                    "nazwisko": admin_user['nazwisko'],
                    "rola": admin_user['rola'] # Przydatne we frontendzie do ukrywania opcji (np. tylko Właściciel widzi przychody)
                }
            }), 200
        else:
            return jsonify({"error": "Nieprawidłowe dane logowania lub brak uprawnień."}), 401

    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd serwera"}), 500
    finally:
        if conn:
            conn.close()
