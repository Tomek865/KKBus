from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from db import get_db_connection
from psycopg2.extras import RealDictCursor

def check_unfulfilled_reservations():
    print("[SCHEDULER] Sprawdzanie niezrealizowanych rezerwacji...")
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Znajdujemy bilety, które nadal mają status 'Active' (kierowca ich nie zwalidował), 
        # a kurs zakończył się ponad godzinę temu.
        query = """
            SELECT c.client_id, c.email, t.ticket_id
            FROM Ticket t
            JOIN Reservation r ON t.reservation_id = r.reservation_id
            JOIN Trip tr ON r.trip_id = tr.trip_id
            JOIN Client c ON r.client_id = c.client_id
            WHERE t.status = 'Active' 
              AND tr.arrival_time < NOW() - INTERVAL '1 hour';
        """
        cur.execute(query)
        unfulfilled = cur.fetchall()

        for record in unfulfilled:
            c_id = record['client_id']
            email = record['email']
            t_id = record['ticket_id']
            
            cur.execute("UPDATE Ticket SET status = 'Unfulfilled' WHERE ticket_id = %s", (t_id,))
            
            cur.execute("""
                UPDATE Client 
                SET unfulfilled_reservations_count = COALESCE(unfulfilled_reservations_count, 0) + 1 
                WHERE client_id = %s
                RETURNING unfulfilled_reservations_count;
            """, (c_id,))
            count = cur.fetchone()['unfulfilled_reservations_count']
            
            if count >= 3:
                cur.execute("""
                    UPDATE Client 
                    SET blocked_until = NOW() + INTERVAL '30 days',
                        unfulfilled_reservations_count = 0
                    WHERE client_id = %s;
                """, (c_id,))
                print(f"\n[MOCK EMAIL] DO: {email}")
                print("Temat: Konto zablokowane na 30 dni")
                print("Treść: Przekroczyłeś limit 3 niezrealizowanych rezerwacji. Możliwość rezerwacji została zablokowana na miesiąc.\n")
            else:
                print(f"\n[MOCK EMAIL] DO: {email}")
                print(f"Temat: Niestawienie się na kursie ({count}/3)")
                print(f"Treść: Odnotowaliśmy niestawienie się na opłaconym kursie. Uwaga: 3 ostrzeżenia skutkują blokadą.\n")
                
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"Błąd Schedulera: {e}")
    finally:
        if conn:
            conn.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Interwał sprawdzania ustawiony na 1 godzinę
    scheduler.add_job(func=check_unfulfilled_reservations, trigger="interval", hours=1)
    scheduler.start()