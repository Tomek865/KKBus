from app.utils import token_required
from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
import time
from datetime import datetime, timedelta

client_reservation_bp = Blueprint("client_reservations", __name__)


@client_reservation_bp.route("/stations", methods=["GET"])
def get_stations():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT station_id AS id, name, exact_address FROM Station ORDER BY name ASC"
        )
        stations = cur.fetchall()
        cur.close()
        return jsonify(stations), 200
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error fetching stations"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/routes/search", methods=["POST"])
def search_routes():
    """
    Wyszukuje dostępne kursy na dany dzień.
    Przyjmuje JSON-a z parametrami trasy i ilością biletów.
    """
    data = request.get_json()

    # Odbieramy dane ze skondensowanego JSON-a
    from_station = data.get("from_station")
    to_station = data.get("to_station")
    date = data.get("date")

    # Bezpieczne pobranie biletów (domyślnie 1 dorosły, jeśli brakuje pola)
    tickets = data.get("tickets", {})
    adult_count = tickets.get("adult", 1)
    student_count = tickets.get("student", 0)
    reduced_count = tickets.get("reduced", 0)

    if not date or not from_station or not to_station:
        return jsonify(
            {
                "error": "Parameters 'date', 'from_station', and 'to_station' are required."
            }
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Reszta zapytania SQL pozostaje bez zmian!
        query = """
            SELECT 
                tr.trip_id, 
                r.name AS route_name, 
                tr.departure_time AS raw_departure,
                v.seating_capacity,
                tr.status,
                rs_from.order_on_route AS from_order,
                rs_to.order_on_route AS to_order
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
        cur.execute(query, (date, from_station, to_station))
        departures = cur.fetchall()
        cur.close()

        results = []
        for dep in departures:
            # 1. Liczymy odległość
            stops_count = dep["to_order"] - dep["from_order"]
            base_price = 15.00 + (stops_count * 5.00)

            # 2. WYLICZANIE ŁĄCZNEJ CENY ZE ZNIŻKAMI
            total_price = (
                (adult_count * base_price)
                + (student_count * (base_price * 0.49))
                + (reduced_count * (base_price * 0.63))
            )

            # 3. Szacujemy czas podróży i godzinę
            actual_departure = dep["raw_departure"] + timedelta(
                minutes=25 * (dep["from_order"] - 1)
            )
            actual_arrival = dep["raw_departure"] + timedelta(
                minutes=25 * (dep["to_order"] - 1)
            )

            duration_minutes = 25 * stops_count
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            duration_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

            results.append(
                {
                    "trip_id": dep["trip_id"],
                    "route_name": dep["route_name"],
                    "departure_time": actual_departure.strftime("%H:%M"),
                    "arrival_time": actual_arrival.strftime("%H:%M"),
                    "duration": duration_str,
                    "base_price_per_adult": float(base_price),
                    "total_price": float(round(total_price, 2)),
                    "seating_capacity": dep["seating_capacity"],
                    "status": dep["status"],
                }
            )

        return jsonify(results), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error occurred while searching for routes"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/", methods=["POST"])
@token_required
def create_reservation(current_user_id):
    data = request.get_json()

    trip_id = data.get("trip_id")
    from_station = data.get("from_station")
    to_station = data.get("to_station")
    tickets = data.get("tickets", {})

    adult_count = tickets.get("adult", 0)
    student_count = tickets.get("student", 0)
    reduced_count = tickets.get("reduced", 0)

    seat_count = adult_count + student_count + reduced_count

    if not trip_id or seat_count <= 0 or not from_station or not to_station:
        return jsonify(
            {"error": "Missing trip ID, station data or ticket count is 0"}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # SPRAWDZANIE MIEJSC (Twój oryginalny kod)
        query_capacity = """
            SELECT v.seating_capacity, 
                   COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = %s AND status != 'Cancelled'), 0) AS occupied_seats
            FROM Trip tr
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.trip_id = %s;
        """
        cur.execute(query_capacity, (trip_id, trip_id))
        bus_info = cur.fetchone()

        if not bus_info:
            return jsonify({"error": "Trip not found"}), 404

        available_seats = bus_info["seating_capacity"] - bus_info["occupied_seats"]

        if seat_count > available_seats:
            return jsonify(
                {"error": f"Not enough seats available. Available: {available_seats}"}
            ), 409

        # WYLICZANIE CENY Z UWZGLĘDNIENIEM ZNIŻEK (dokładnie to samo co w kalkulatorze)
        query_stops = """
            SELECT 
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS from_order,
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS to_order
            FROM Trip tr WHERE trip_id = %s;
        """
        cur.execute(query_stops, (from_station, to_station, trip_id))
        stops = cur.fetchone()

        stops_count = stops["to_order"] - stops["from_order"]
        base_price = 15.00 + (stops_count * 5.00)

        total_price = (
            (adult_count * base_price)
            + (student_count * (base_price * 0.49))
            + (reduced_count * (base_price * 0.63))
        )

        # TWORZENIE REZERWACJI
        reservation_number = f"RES-{current_user_id}-{int(time.time())}"

        # Dodane: zapisujemy total_price
        query_insert = """
            INSERT INTO Reservation (client_id, trip_id, reservation_number, status, seat_count, total_price)
            VALUES (%s, %s, %s, 'Pending Payment', %s, %s) RETURNING reservation_id;
        """
        cur.execute(
            query_insert,
            (
                current_user_id,
                trip_id,
                reservation_number,
                seat_count,
                round(total_price, 2),
            ),
        )
        new_id = cur.fetchone()["reservation_id"]

        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": "Reservation created successfully.",
                "reservation_number": reservation_number,
                "reservation_id": new_id,
                "total_price": round(total_price, 2),
            }
        ), 201

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error occurred during reservation"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/journey-details/<string:res_number>", methods=["GET"])
@token_required
def get_journey_details(current_client_id, res_number):
    """
    Zwraca szczegóły podróży dla konkretnej rezerwacji.
    Wykorzystywane m.in. do śledzenia trasy i biletów przez klienta.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Pobranie danych o rezerwacji, kursie i przypisanym pojeździe
        query_info = """
            SELECT 
                r.reservation_number,
                r.seat_count,
                tr.trip_id,
                tr.departure_time,
                v.brand,
                v.model,
                v.registration_number
            FROM Reservation r
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE r.reservation_number = %s AND r.client_id = %s;
        """
        cur.execute(query_info, (res_number, current_client_id))
        journey_info = cur.fetchone()

        if not journey_info:
            return jsonify({"error": "Reservation not found or access denied"}), 404

        trip_id = journey_info["trip_id"]
        dep_time = journey_info["departure_time"]

        # 2. Pobranie wszystkich przystanków przypisanych do tego kursu
        query_stations = """
            SELECT 
                s.name,
                rs.order_on_route
            FROM Trip tr
            JOIN Route_Station rs ON tr.route_id = rs.route_id
            JOIN Station s ON rs.station_id = s.station_id
            WHERE tr.trip_id = %s
            ORDER BY rs.order_on_route ASC;
        """
        cur.execute(query_stations, (trip_id,))
        stations = cur.fetchall()
        cur.close()

        # 3. Budowanie routeDetails (symulacja czasu dla pośrednich przystanków)
        route_details = []
        now = datetime.now()

        for index, st in enumerate(stations):
            # Dodajemy np. 25 minut dla każdego kolejnego przystanku
            station_time = dep_time + timedelta(minutes=25 * index)

            route_details.append(
                {
                    "station": st["name"],
                    "time": station_time.strftime("%H:%M"),
                    "isPassed": now
                    > station_time,  # True jeśli obecny czas minął już czas przystanku
                }
            )

        # 4. Formowanie JSON-a dokładnie pod wymagania Reacta
        response_data = {
            "busDetails": {
                "operator": "KKBus Express",
                "vehicleName": f"{journey_info['brand']} {journey_info['model']} / {journey_info['registration_number']}",
                # Zestaw ikon: wifi, klima, prąd, eko
                "amenities": ["wifi", "snow", "flash", "leaf"],
            },
            "ticketInfo": {
                # "To Be Determined" (możesz tu podpiąć system miejsc)
                "seat": "TBD",
                "class": "Standard",
                "seatCount": journey_info["seat_count"],
                "reservationNumber": journey_info["reservation_number"],
            },
            "routeDetails": route_details,
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/calculate-price", methods=["POST"])
@token_required
def calculate_price(current_user_id):
    """
    Endpoint wylicza łączną kwotę za bilety na podstawie przesłanych ilości i typu.
    Frontend wysyła np.:
    {
        "trip_id": 1,
        "from_station": "Kraków",
        "to_station": "Warszawa",
        "tickets": {
            "adult": 1,
            "student": 2,
            "reduced": 0
        }
    }
    """
    data = request.get_json()
    trip_id = data.get("trip_id")
    from_station = data.get("from_station")
    to_station = data.get("to_station")
    tickets = data.get("tickets", {})

    adult_count = tickets.get("adult", 0)
    student_count = tickets.get("student", 0)
    reduced_count = tickets.get("reduced", 0)

    total_seats = adult_count + student_count + reduced_count
    if total_seats == 0:
        return jsonify({"error": "No tickets selected"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Pobieramy kolejność przystanków, żeby wiedzieć jak długa jest trasa
        query_stops = """
            SELECT 
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS from_order,
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS to_order
            FROM Trip tr WHERE trip_id = %s;
        """
        cur.execute(query_stops, (from_station, to_station, trip_id))
        stops = cur.fetchone()

        if not stops or not stops["from_order"] or not stops["to_order"]:
            return jsonify({"error": "Invalid stations for this trip"}), 400

        # 2. Wyliczanie ceny BAZOWEJ (normalnej)
        stops_count = stops["to_order"] - stops["from_order"]
        # TUTAJ USTALASZ SWÓJ WZÓR NA CENĘ (np. 15 zł opłaty stałej + 5 zł za każdy przystanek)
        base_price = 15.00 + (stops_count * 5.00)

        # 3. Naliczanie ZNIŻEK
        # Student = 51% zniżki (czyli płaci 49% ceny)
        # Ulgowy (senior/dziecko) = 37% zniżki (czyli płaci 63% ceny)
        total_price = 0.00
        total_price += adult_count * base_price
        total_price += student_count * (base_price * 0.49)
        total_price += reduced_count * (base_price * 0.63)

        cur.close()

        return jsonify(
            {
                "base_price_per_ticket": round(base_price, 2),
                "total_price": round(total_price, 2),
                "total_seats": total_seats,
            }
        ), 200

    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Error calculating price"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/checkout", methods=["POST"])
@token_required
def process_checkout(current_user_id):
    # Odbieramy całego JSON-a
    data = request.get_json()

    # 1. BEZPIECZNE ROZPAKOWANIE SKONDENSOWANEGO OBIEKTU
    trip_data = data.get("trip", {})
    tickets_data = data.get("tickets", {})

    # 2. WYCIĄGANIE KONKRETNYCH WARTOŚCI
    trip_id = trip_data.get("id")
    from_station = trip_data.get("from")
    to_station = trip_data.get("to")

    adult_count = tickets_data.get("adult", 0)
    student_count = tickets_data.get("student", 0)
    reduced_count = tickets_data.get("reduced", 0)

    seat_count = adult_count + student_count + reduced_count

    # 3. WALIDACJA (Sprawdzamy, czy mamy to, co najważniejsze)
    if not trip_id or seat_count <= 0 or not from_station or not to_station:
        return jsonify(
            {"error": "Missing trip ID, station data or ticket count is 0"}
        ), 400

    # 4. DALSZA LOGIKA BAZY DANYCH
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # --- A. SPRAWDZANIE DOSTĘPNOŚCI MIEJSC ---
        query_capacity = """
            SELECT v.seating_capacity, 
                   COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = %s AND status != 'Cancelled'), 0) AS occupied_seats
            FROM Trip tr
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            WHERE tr.trip_id = %s;
        """
        cur.execute(query_capacity, (trip_id, trip_id))
        bus_info = cur.fetchone()

        if not bus_info:
            return jsonify({"error": "Trip not found"}), 404

        available_seats = bus_info["seating_capacity"] - bus_info["occupied_seats"]

        if seat_count > available_seats:
            return jsonify(
                {"error": f"Not enough seats available. Available: {available_seats}"}
            ), 409

        # --- B. BEZPIECZNE WYLICZANIE CENY (żeby klient nie podmienił jej w przeglądarce) ---
        query_stops = """
            SELECT 
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS from_order,
                (SELECT order_on_route FROM Route_Station rs JOIN Station s ON rs.station_id = s.station_id WHERE rs.route_id = tr.route_id AND s.name = %s) AS to_order
            FROM Trip tr WHERE trip_id = %s;
        """
        cur.execute(query_stops, (from_station, to_station, trip_id))
        stops = cur.fetchone()

        if not stops or not stops["from_order"] or not stops["to_order"]:
            return jsonify({"error": "Invalid stations for this trip"}), 400

        # Odległość w przystankach i cena bazowa (15 zł + 5 zł / przystanek)
        stops_count = stops["to_order"] - stops["from_order"]
        base_price = 15.00 + (stops_count * 5.00)

        # Cena uwzględniająca zniżki (Student: -51% czyli mnożnik 0.49; Ulgowy: -37% czyli mnożnik 0.63)
        total_price = (
            (adult_count * base_price)
            + (student_count * (base_price * 0.49))
            + (reduced_count * (base_price * 0.63))
        )

        total_price = round(total_price, 2)

        # --- C. TWORZENIE REZERWACJI W BAZIE ---
        reservation_number = f"RES-{current_user_id}-{int(time.time())}"

        query_insert = """
            INSERT INTO Reservation (client_id, trip_id, reservation_number, status, seat_count, total_price)
            VALUES (%s, %s, %s, 'Pending Payment', %s, %s) RETURNING reservation_id;
        """
        cur.execute(
            query_insert,
            (current_user_id, trip_id, reservation_number, seat_count, total_price),
        )
        new_id = cur.fetchone()["reservation_id"]

        # --- D. TWORZENIE JEDNEGO GRUPOWEGO BILETU ---

        # 1. Budujemy opis na bilet (np. "1x Normalny, 2x Student")
        summary_parts = []
        if adult_count > 0:
            summary_parts.append(f"{adult_count}x Normalny")
        if student_count > 0:
            summary_parts.append(f"{student_count}x Student")
        if reduced_count > 0:
            summary_parts.append(f"{reduced_count}x Ulgowy")

        ticket_summary = ", ".join(summary_parts)

        default_segment_id = 1

        # 2. Zapisujemy JEDEN bilet do tabeli i POBIERAMY JEGO ID (dodane RETURNING ticket_id)
        query_insert_ticket = """
            INSERT INTO Ticket (reservation_id, segment_id, final_price, ticket_summary, status)
            VALUES (%s, %s, %s, %s, 'Active') RETURNING ticket_id;
        """
        cur.execute(
            query_insert_ticket,
            (new_id, default_segment_id, total_price, ticket_summary),
        )

        # Pobieramy prawdziwe ID nowo utworzonego biletu!
        new_ticket_id = cur.fetchone()["ticket_id"]

        # Potwierdzenie zapisu do bazy!
        conn.commit()
        cur.close()

        # Zwracamy frontendowi odpowiedź z sukcesem
        return (
            jsonify(
                {
                    "message": "Reservation created successfully.",
                    "reservation_id": new_id,
                    "ticket_id": new_ticket_id,
                    "reservation_number": reservation_number,
                    "total_price": total_price,
                    "received_seats": seat_count,
                    "route": f"{from_station} -> {to_station}",
                }
            ),
            201,
        )
    except Exception as e:
        print(f"DB Error w /checkout: {e}")
        if conn:
            conn.rollback()  # Cofamy zmiany w razie błędu
        return jsonify({"error": "Error occurred during checkout"}), 500
    finally:
        if conn:
            conn.close()


@client_reservation_bp.route("/tickets/<int:ticket_id>/cancel", methods=["PATCH"])
@token_required
def cancel_ticket(current_user_id, ticket_id):
    """
    Anuluje bilet grupowy i całą powiązaną z nim rezerwację,
    co automatycznie zwalnia wszystkie miejsca w autobusie.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. WERYFIKACJA: Sprawdzamy bilet i powiązaną rezerwację
        query_check = """
            SELECT t.ticket_id, t.status, r.reservation_id 
            FROM Ticket t
            JOIN Reservation r ON t.reservation_id = r.reservation_id
            WHERE t.ticket_id = %s AND r.client_id = %s;
        """
        cur.execute(query_check, (ticket_id, current_user_id))
        data = cur.fetchone()

        if not data:
            return jsonify({"error": "Bilet nie istnieje lub brak uprawnień."}), 404

        if data["status"] == "Cancelled":
            return jsonify({"error": "Ten bilet został już anulowany."}), 400

        # 2. ANULOWANIE BILETU GRUPOWEGO
        cur.execute(
            "UPDATE Ticket SET status = 'Cancelled' WHERE ticket_id = %s", (ticket_id,)
        )

        # 3. ANULOWANIE GŁÓWNEJ REZERWACJI (To zwalnia miejsca!)
        cur.execute(
            "UPDATE Reservation SET status = 'Cancelled' WHERE reservation_id = %s",
            (data["reservation_id"],),
        )

        conn.commit()
        cur.close()

        return jsonify(
            {
                "message": "Bilet grupowy został anulowany, wszystkie miejsca zostały zwolnione.",
                "ticket_id": ticket_id,
                "new_status": "Cancelled",
            }
        ), 200

    except Exception as e:
        print(f"DB Error w /cancel: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Błąd serwera podczas anulowania biletu."}), 500
    finally:
        if conn:
            conn.close()
