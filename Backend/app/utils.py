from functools import wraps
from flask import request, jsonify, current_app
import jwt

def token_required(f):
    """
    Dekorator dla ogólnych użytkowników (Klientów i Pracowników).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            
            current_user_id = data.get('client_id') or data.get('employee_id')
            
            if not current_user_id:
                 return jsonify({'error': 'Invalid token payload!'}), 401
                 
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired! Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated

def admin_required(f):
    """
    Dekorator wymagający uprawnień właściciela lub sekretariatu.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            
            role = data.get('role') or data.get('rola')
            
            if role not in ['Owner', 'Secretariat']:
                return jsonify({'error': 'Access denied. Administrator privileges required.'}), 403
                
            current_admin_id = data.get('employee_id')
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired! Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401

        return f(current_admin_id, *args, **kwargs)
    return decorated

def driver_required(f):
    """
    Dekorator wymagający uprawnień kierowcy.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            
            role = data.get('role') or data.get('rola')
            
            if role != 'Driver':
                return jsonify({'error': 'Access denied. Driver privileges required.'}), 403
                
            current_driver_id = data.get('employee_id')
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired! Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401

        return f(current_driver_id, *args, **kwargs)
    return decorated
