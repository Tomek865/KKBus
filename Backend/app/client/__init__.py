from flask import Blueprint
from .rezerwacje import klient_rezerwacje_bp
from .auth import klient_auth_bp

# Główny blueprint dla klienta
klient_bp = Blueprint("klient", __name__, url_prefix="/api/klient")

# Zagnieżdżanie pod-modułów
klient_bp.register_blueprint(klient_rezerwacje_bp, url_prefix="/rezerwacje")
klient_bp.register_blueprint(klient_auth_bp, url_prefix="/auth")
