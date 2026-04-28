from flask import Blueprint
from .tickets import driver_tickets_bp
from .reports import driver_reports_bp
from .auth import driver_auth_bp  # <--- NOWY IMPORT

driver_bp = Blueprint('driver', __name__)

driver_bp.register_blueprint(driver_tickets_bp, url_prefix='/tickets')
driver_bp.register_blueprint(driver_reports_bp)
driver_bp.register_blueprint(driver_auth_bp, url_prefix='/auth')  # <--- REJESTRACJA
