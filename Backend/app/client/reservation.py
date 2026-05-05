from app.utils import token_required
from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor

client_reservation_bp = Blueprint("klient_rezerwacje", __name__)


@client_reservation_bp.route("/stations", methods=["GET"])
def get_stations():
    # Pobieranie listy dostępnych stacji (unikalne nazwy przystanków)
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT DISTINCT nazwa FROM Przystanek ORDER BY nazwa ASC;")
        stations_raw = cur.fetchall()
        cur.close()

        # Formatujemy do prostej tablicy stringów, tak jak oczekuje Twój React: ['Krakow', 'Katowice', ...]
        stations = [station["nazwa"] for station in stations_raw]
        return jsonify(stations), 200

    except Exception as e:
        print(f"Błąd bazy: {e}")
        return jsonify({"error": "Błąd serwera przy pobieraniu stacji"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/routes", methods=["GET"])
def search_routes():
    # Pobieranie parametrów z frontendu
    from_station = request.args.get("from")
    to_station = request.args.get("to")
    date = request.args.get("date")

    # Teraz wymagamy wszystkich trzech parametrów, żeby wyszukiwarka miała sens
    if not date or not from_station or not to_station:
        return jsonify({"error": "Parametry 'date', 'from' i 'to' są wymagane."}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Zaawansowane zapytanie SQL
        # Łączymy trasę z przystankami dwukrotnie: raz dla stacji początkowej (tp_from), raz dla końcowej (tp_to)
        # Warunek tp_from.kolejnosc < tp_to.kolejnosc gwarantuje poprawny kierunek jazdy!
        query = """
            SELECT 
                tr.trip_id AS id_kursu, 
                r.name AS trasa, 
                TO_CHAR(tr.departure_time, 'HH24:MI') AS godzina_odjazdu,
                TO_CHAR(tr.arrival_time, 'HH24:MI') AS godzina_przyjazdu,
                v.seating_capacity AS pojemnosc_miejsc,
                tr.status
            FROM Trip tr
            JOIN Route r ON tr.route_id = r.route_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            
            JOIN Route_Station rs_from ON r.route_id = rs_from.route_id
            JOIN Station s_from ON rs_from.station_id = s_from.station_id
            
            JOIN Route_Station rs_to ON r.route_id = rs_to.route_id
            JOIN Station s_to ON rs_to.station_id = s_to.station_id
            
            WHERE DATE(tr.departure_time) = %s 
              AND tr.status = 'Planned'
              AND s_from.name = %s 
              AND s_to.name = %s
              AND rs_from.order_on_route < rs_to.order_on_route
            ORDER BY tr.departure_time ASC;
        """
        # Wstrzykujemy wszystkie trzy zmienne do zapytania
        cur.execute(query, (date, from_station, to_station))
        departures = cur.fetchall()
        cur.close()

        return jsonify(departures), 200

    except Exception as e:
        print(f"Błąd bazy: {e}")
        return jsonify({"error": "Wystąpił błąd podczas wyszukiwania kursów"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/", methods=["POST"])
@token_required
def create_reservation(current_user_id):
    data = request.get_json()

    id_kursu = data.get("id_kursu")
    liczba_miejsc = data.get("liczba_miejsc", 1)

    if not id_kursu:
        return jsonify({"error": "Brak ID kursu"}), 400

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            # 1. Sprawdzamy pojemność busa i ile miejsc jest już zajętych
            query_capacity = """
                SELECT p.pojemnosc_miejsc, 
                       COALESCE((SELECT SUM(liczba_miejsc) FROM Rezerwacja WHERE id_kursu = %s AND status != 'Anulowana'), 0) AS zajete_miejsca
                FROM Kurs k
                JOIN Pojazd p ON k.id_pojazdu = p.id_pojazdu
                WHERE k.id_kursu = %s;
            """
            cur.execute(query_capacity, (id_kursu, id_kursu))
            bus_info = cur.fetchone()

            if not bus_info:
                return jsonify({"error": "Nie znaleziono kursu"}), 404

            dostepne_miejsca = bus_info["pojemnosc_miejsc"] - bus_info["zajete_miejsca"]

            if liczba_miejsc > dostepne_miejsca:
                return jsonify(
                    {
                        "error": f"Brak wystarczającej liczby miejsc. Dostępne: {dostepne_miejsca}"
                    }
                ), 409

            # 2. Tworzymy rezerwację z unikalnym numerem (np. RES-ID-TIMESTAMP)
            import time

            numer_rezerwacji = f"RES-{current_user_id}-{int(time.time())}"

            query_insert = """
                INSERT INTO Rezerwacja (id_klienta, id_kursu, numer_rezerwacji, status, liczba_miejsc)
                VALUES (%s, %s, %s, 'Oczekuje na płatność', %s) RETURNING id_rezerwacji;
            """
            cur.execute(
                query_insert,
                (current_user_id, id_kursu, numer_rezerwacji, liczba_miejsc),
            )
            nowe_id = cur.fetchone()["id_rezerwacji"]

            conn.commit()
            cur.close()

            return jsonify(
                {
                    "message": "Rezerwacja została utworzona pomyślnie.",
                    "numer_rezerwacji": numer_rezerwacji,
                    "id_rezerwacji": nowe_id,
                }
            ), 201

        except Exception as e:
            print(f"Błąd DB: {e}")
            return jsonify({"error": "Wystąpił błąd podczas rezerwacji"}), 500
        finally:
            if conn:
                conn.close()
