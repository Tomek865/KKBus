import psycopg2
from psycopg2.extras import RealDictCursor

# Parametry połączenia z Twoją bazą w Dockerze
DB_HOST = "localhost"
DB_NAME = "kkbus_db"
DB_USER = "kkbus_admin"
DB_PASS = "secretpassword"
DB_PORT = "5432"


def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
    )
    return conn
