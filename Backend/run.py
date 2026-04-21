from flask import Flask
from app.klient.rezerwacje import klient_rezerwacje_bp

app = Flask(__name__)

# Rejestrujemy nasz Blueprint z odpowiednim prefixem
app.register_blueprint(klient_rezerwacje_bp, url_prefix="/api/klient/rezerwacje")

if __name__ == "__main__":
    # Odpalamy serwer na porcie 5000 w trybie debug (żeby widzieć błędy od razu)
    app.run(debug=True, port=5000)
