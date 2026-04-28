import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.client import client_bp
from app.driver import driver_bp
from app.admin import admin_bp
from app.auth_universal import universal_auth_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key_123')
    
    # Konfiguracja CORS
    CORS(app)
    
    # Rejestracja głównych modułów z nowymi prefixami
    app.register_blueprint(client_bp, url_prefix='/api/client')
    app.register_blueprint(driver_bp, url_prefix='/api/driver')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(universal_auth_bp, url_prefix='/api/auth')

    return app
