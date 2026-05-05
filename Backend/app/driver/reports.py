from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import driver_required

driver_reports_bp = Blueprint("driver_reports", __name__)


@driver_reports_bp.route("/reports", methods=["POST"])
@driver_required
def submit_segment_report(current_user_id):
    data = request.get_json()

    # Dane przesyłane z Twojego frontendu
    boarded = int(data.get("boarded", 0))
    alighted = int(data.get("alighted", 0))

    # Wyciągamy ID (obsługuje zarówno stare polskie nazwy z Reacta, jak i nowe angielskie)
    trip_id = data.get("tripId") or data.get("trip_id") or data.get("id_kursu")
    segment_id = (
        data.get("segmentId") or data.get("segment_id") or data.get("id_odcinka")
    )

    if not trip_id or not segment_id:
        return jsonify(
            {"error": "Brak ID kursu (trip_id) lub odcinka (segment_id)"}
        ), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Tworzymy raport główny dla kursu (jeśli to pierwszy odcinek i jeszcze go nie ma)
        cur.execute(
            "INSERT INTO Trip_Report (trip_id) VALUES (%s) ON CONFLICT (trip_id) DO NOTHING",
            (trip_id,),
        )

        # 2. Pobieramy report_id tego kursu
        cur.execute("SELECT report_id FROM Trip_Report WHERE trip_id = %s", (trip_id,))
        report_id = cur.fetchone()["report_id"]

        # 3. Wrzucamy dane dla konkretnego odcinka
        query = """
            INSERT INTO Segment_Report (report_id, segment_id, boarded_passengers, alighted_passengers) 
            VALUES (%s, %s, %s, %s)
        """
        cur.execute(query, (report_id, segment_id, boarded, alighted))
        conn.commit()
        cur.close()

        return jsonify({"message": "Raport odcinka zapisany poprawnie."}), 201
    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd podczas zapisywania raportu."}), 500
    finally:
        if conn:
            conn.close()


@driver_reports_bp.route("/shift/end", methods=["POST"])
@driver_required
def complete_shift(current_user_id):
    data = request.get_json()

    # Dane przesyłane z frontendu
    volume = float(data.get("volume", 0))
    cost = float(data.get("cost", 0))

    # Podobnie jak wyżej, łapiemy nową i starą nazwę
    vehicle_id = (
        data.get("vehicleId") or data.get("vehicle_id") or data.get("id_pojazdu")
    )

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Logujemy do nowej angielskiej tabeli Refueling
        if volume > 0 and cost > 0 and vehicle_id:
            cena_za_litr = cost / volume
            query = """
                INSERT INTO Refueling (vehicle_id, employee_id, liters_volume, price_per_liter, total_cost)
                VALUES (%s, %s, %s, %s, %s)
            """
            cur.execute(
                query, (vehicle_id, current_user_id, volume, cena_za_litr, cost)
            )
            conn.commit()

        cur.close()
        return jsonify(
            {"message": "Zmiana zakończona sukcesem. Dane z tankowania zapisane."}
        ), 200
    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Wystąpił błąd podczas kończenia zmiany."}), 500
    finally:
        if conn:
            conn.close()
