from flask import Blueprint, request, jsonify
from db import get_db_connection
from app.utils import token_required

driver_reports_bp = Blueprint('driver_reports', __name__)

@driver_reports_bp.route('/reports', methods=['POST'])
@token_required
def submit_segment_report(current_user_id):
    data = request.get_json()
    
    # Dane przesyłane z Twojego frontendu
    boarded = int(data.get('boarded', 0))
    alighted = int(data.get('alighted', 0))
    
    # Dodatkowo frontend będzie musiał dosłać te dwa ID, żebyśmy wiedzieli o jaki kurs i przystanek chodzi
    id_kursu = data.get('id_kursu')
    id_odcinka = data.get('id_odcinka')

    if not id_kursu or not id_odcinka:
        return jsonify({"error": "Brak ID kursu lub odcinka"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Zgodnie z naszą zaktualizowaną bazą danych zapisujemy dane do Raport_Odcinek
        # Najpierw upewniamy się, że istnieje główny RaportKursu (np. tworzymy go, jeśli to pierwszy odcinek)
        cur.execute("INSERT INTO RaportKursu (id_kursu) VALUES (%s) ON CONFLICT (id_kursu) DO NOTHING RETURNING id_raportu", (id_kursu,))
        cur.execute("SELECT id_raportu FROM RaportKursu WHERE id_kursu = %s", (id_kursu,))
        id_raportu = cur.fetchone()[0]

        # Wrzucamy dane dla konkretnego odcinka
        query = """
            INSERT INTO Raport_Odcinek (id_raportu, id_odcinka, ilosc_wsiadajacych, ilosc_wysiadajacych) 
            VALUES (%s, %s, %s, %s)
        """
        cur.execute(query, (id_raportu, id_odcinka, boarded, alighted))
        conn.commit()
        cur.close()

        return jsonify({"message": "Raport odcinka zapisany poprawnie."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@driver_reports_bp.route('/shift/end', methods=['POST'])
@token_required
def complete_shift(current_user_id):
    data = request.get_json()
    
    # Dane przesyłane z frontendu
    volume = float(data.get('volume', 0))
    cost = float(data.get('cost', 0))
    id_pojazdu = data.get('id_pojazdu') # Kierowca musi wiedzieć, co tankował

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Jeśli podano koszty, logujemy do tabeli Tankowanie
        if volume > 0 and cost > 0 and id_pojazdu:
            cena_za_litr = cost / volume
            query = """
                INSERT INTO Tankowanie (id_pojazdu, id_pracownika, ilosc_litrow, cena_za_litr, koszt_calkowity)
                VALUES (%s, %s, %s, %s, %s)
            """
            cur.execute(query, (id_pojazdu, current_user_id, volume, cena_za_litr, cost))
            conn.commit()
        
        cur.close()
        return jsonify({"message": "Zmiana zakończona sukcesem. Dane zapisane."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
