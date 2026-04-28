from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor

klient_rezerwacje_bp = Blueprint('klient_rezerwacje', __name__)

@klient_rezerwacje_bp.route('/stations', methods=['GET'])
def get_stations():
    # Pobieranie listy dostępnych stacji (unikalne nazwy przystanków)
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT DISTINCT nazwa FROM Przystanek ORDER BY nazwa ASC;")
        stations_raw = cur.fetchall()
        cur.close()

        # Formatujemy do prostej tablicy stringów, tak jak oczekuje Twój React: ['Krakow', 'Katowice', ...]
        stations = [station['nazwa'] for station in stations_raw]
        return jsonify(stations), 200

    except Exception as e:
        print(f"Błąd bazy: {e}")
        return jsonify({"error": "Błąd serwera przy pobieraniu stacji"}), 500
    finally:
        if conn:
            conn.close()


@klient_rezerwacje_bp.route('/routes', methods=['GET'])
def search_routes():
    # Pobieranie parametrów z frontendu
    from_station = request.args.get('from')
    to_station = request.args.get('to')
    date = request.args.get('date')
    # passenger_counts = request.args.get('passengers', 1) # Do użycia przy sprawdzaniu pojemności

    if not date:
        return jsonify({"error": "Parametr 'date' jest wymagany."}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Wyszukujemy kursy na dany dzień. 
        # W zaawansowanej wersji tutaj doszłoby złączenie tabel i sprawdzanie, czy "from" jest na trasie przed "to".
        # Dla uproszczenia (zgodnie z listą kursów) wyciągamy kursy po dacie.
        query = """
            SELECT 
                k.id_kursu, 
                t.nazwa AS trasa, 
                TO_CHAR(k.data_wyjazdu, 'HH24:MI') AS godzina_odjazdu,
                TO_CHAR(k.data_przyjazdu, 'HH24:MI') AS godzina_przyjazdu,
                p.pojemnosc_miejsc,
                k.status
            FROM Kurs k
            JOIN Trasa t ON k.id_trasy = t.id_trasy
            JOIN Pojazd p ON k.id_pojazdu = p.id_pojazdu
            WHERE DATE(k.data_wyjazdu) = %s AND k.status = 'Planowany'
        """
        cur.execute(query, (date,))
        departures = cur.fetchall()
        cur.close()

        return jsonify(departures), 200

    except Exception as e:
        print(f"Błąd bazy: {e}")
        return jsonify({"error": "Wystąpił błąd podczas wyszukiwania kursów"}), 500
    finally:
        if conn:
            conn.close()
