from flask import Blueprint
from .rezerwacje import klient_rezerwacje_bp
from .auth import klient_auth_bp
from .profil import klient_profil_bp  # <--- NOWY IMPORT

klient_bp = Blueprint('klient', __name__, url_prefix='/api/klient')

klient_bp.register_blueprint(klient_rezerwacje_bp) # usunąłem prefix żeby łapało /stations bezpośrednio
klient_bp.register_blueprint(klient_auth_bp, url_prefix='/auth')
klient_bp.register_blueprint(klient_profil_bp)     # łapie /user/loyalty itp.
