import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Wczytanie zmiennych z pliku .env
load_dotenv()

# Pobieranie zmiennych ze środowiska.
# Drugi argument w os.getenv() to wartość domyślna, gdyby zapomniano dodać zmiennej do .env
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "kkbus_db")
DB_USER = os.getenv("DB_USER", "kkbus_admin")
DB_PASS = os.getenv("DB_PASS", "haslo")
DB_PORT = os.getenv("DB_PORT", "5432")


def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
    )
    return conn
