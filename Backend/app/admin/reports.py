from flask import Blueprint, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import admin_required
import datetime

admin_reports_bp = Blueprint("admin_reports", __name__)


@admin_reports_bp.route("/financial", methods=["GET"])
@admin_required
def get_financial_reports(current_admin_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        now = datetime.datetime.now()
        current_month = now.month
        current_year = now.year

        query_revenue = """
            SELECT COALESCE(SUM(final_price), 0) AS revenue 
            FROM Ticket t
            JOIN Reservation res ON t.reservation_id = res.reservation_id
            WHERE EXTRACT(MONTH FROM res.reservation_date) = %s AND EXTRACT(YEAR FROM res.reservation_date) = %s;
        """
        cur.execute(query_revenue, (current_month, current_year))
        gross_revenue = cur.fetchone()["revenue"]

        query_costs = """
            SELECT COALESCE(SUM(total_cost), 0) AS costs 
            FROM Refueling 
            WHERE EXTRACT(MONTH FROM refueling_date) = %s AND EXTRACT(YEAR FROM refueling_date) = %s;
        """
        cur.execute(query_costs, (current_month, current_year))
        operating_costs = cur.fetchone()["costs"]

        cur.close()

        net_profit = gross_revenue - operating_costs

        return jsonify(
            {
                "ticketSales": float(gross_revenue),
                "fuelCosts": float(operating_costs),
                "grossRevenue": float(gross_revenue),
                "operatingCosts": float(operating_costs),
                "netProfit": float(net_profit),
            }
        ), 200

    except Exception as e:
        print(f"Błąd DB: {e}")
        return jsonify({"error": "Błąd podczas generowania raportu"}), 500
    finally:
        if conn:
            conn.close()


@admin_reports_bp.route("/route-revenue", methods=["GET"])
@admin_required
def get_revenue_by_route(current_user_id):
    """
    Zwraca listę tras wraz z wygenerowanym przez nie całkowitym dochodem.
    Przydatne do wykresów w Dashboardzie Administratora.
    """

    # Tutaj opcjonalnie możesz dodać sprawdzenie, czy current_user_id ma rolę 'Admin'

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # SQL: Grupujemy po nazwie trasy i sumujemy total_price.
        # Używamy LEFT JOIN, żeby uwzględnić trasy bez żadnych rezerwacji.
        # Odfiltrowujemy anulowane rezerwacje na etapie złączenia (ON ... AND status != 'Cancelled')
        query = """
            SELECT 
                rt.name AS route_name,
                COALESCE(SUM(r.total_price), 0.00) AS total_revenue
            FROM Route rt
            LEFT JOIN Trip tr ON rt.route_id = tr.route_id
            LEFT JOIN Reservation r ON tr.trip_id = r.trip_id AND r.status != 'Cancelled'
            GROUP BY rt.name
            ORDER BY total_revenue DESC;
        """
        cur.execute(query)
        revenue_data = cur.fetchall()

        # Formatowanie danych pod Frontend (konwersja Decimal na float dla JSON)
        formatted_results = []
        for row in revenue_data:
            formatted_results.append(
                {
                    "routeName": row["route_name"],
                    "totalRevenue": float(row["total_revenue"]),
                }
            )

        return jsonify(formatted_results), 200

    except Exception as e:
        print(f"DB Error w /revenue-by-route: {e}")
        return jsonify(
            {"error": "Wystąpił błąd podczas generowania raportu dochodów."}
        ), 500
    finally:
        if conn:
            conn.close()
