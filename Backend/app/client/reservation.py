from flask import Blueprint, request, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor

# Create a Blueprint for client reservations/searching
client_reservations_bp = Blueprint("client_reservations", __name__)


@client_reservations_bp.route("/trips", methods=["GET"])
def get_trips():
    # Get the date from the URL, e.g.: /api/client/reservations/trips?date=2026-05-10
    query_date = request.args.get("date")

    if not query_date:
        return jsonify({"error": "Missing 'date' parameter (format YYYY-MM-DD)"}), 400

    conn = get_db_connection()
    try:
        # Cursor set to RealDictCursor to immediately get a JSON-friendly format
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # SQL query fetching trips for a given day, joining with the Trasa (Route) table
        # Note: Database table and column names remain in Polish to match the DB schema.
        query = """
            SELECT 
                k.id_kursu AS trip_id, 
                t.nazwa AS route_name, 
                k.data_wyjazdu AS departure_time, 
                k.data_przyjazdu AS arrival_time, 
                k.status 
            FROM Kurs k
            JOIN Trasa t ON k.id_trasy = t.id_trasy
            WHERE DATE(k.data_wyjazdu) = %s AND k.status = 'Planowany'
            ORDER BY k.data_wyjazdu ASC;
        """

        # Execute the query, safely injecting the date
        cur.execute(query, (query_date,))
        trips = cur.fetchall()

        # Close the cursor
        cur.close()

        # If there are no trips
        if not trips:
            return jsonify(
                {"message": "No scheduled trips for this date", "trips": []}
            ), 200

        # Return the list of trips
        return jsonify({"trips": trips}), 200

    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
    finally:
        # Always close the connection!
        if conn:
            conn.close()
