from flask import Blueprint
from .dashboard import admin_dashboard_bp
from .fleet import admin_fleet_bp
from .auth import admin_auth_bp  # <--- NOWY IMPORT

admin_bp = Blueprint('admin', __name__)

admin_bp.register_blueprint(admin_dashboard_bp)
admin_bp.register_blueprint(admin_fleet_bp, url_prefix='/fleet')
admin_bp.register_blueprint(admin_auth_bp, url_prefix='/auth')  # <--- REJESTRACJA
