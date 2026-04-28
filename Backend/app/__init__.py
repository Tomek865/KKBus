import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.klient import klient_bp
# from app.kierowca import kierowca_bp
# from app.wlasciciel import wlasciciel_bp

# Wczytanie zmiennych z pliku .env
load_dotenv()


def create_app():
    app = Flask(__name__)

    # Odczytanie tajnego klucza z pliku .env
    app.config["SECRET_KEY"] = os.getenv(
        "SECRET_KEY", "domyslny_niebezpieczny_klucz")

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(klient_bp)
    # app.register_blueprint(kierowca_bp)
    # app.register_blueprint(wlasciciel_bp)

    return app
