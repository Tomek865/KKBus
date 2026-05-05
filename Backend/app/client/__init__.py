from flask import Blueprint
from .reservation import client_reservation_bp
from .auth import client_auth_bp
from .profil import client_profil_bp

client_bp = Blueprint("client", __name__, url_prefix="/api/client")

client_bp.register_blueprint(client_reservation_bp)
client_bp.register_blueprint(client_auth_bp, url_prefix="/auth")
client_bp.register_blueprint(client_profil_bp)
