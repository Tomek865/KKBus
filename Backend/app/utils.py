from functools import wraps
from flask import request, jsonify, current_app
import jwt


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Oczekujemy tokena w nagłówku: "Authorization: Bearer <token>"
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Brak tokena autoryzacji!"}), 401

        try:
            data = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            current_user_id = data["id_klienta"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token wygasł! Zaloguj się ponownie."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Nieprawidłowy token!"}), 401

        return f(current_user_id, *args, **kwargs)

    return decorated
