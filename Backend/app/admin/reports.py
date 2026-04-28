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

        # Pobieramy obecny rok i miesiąc do filtrowania (MTD)
        now = datetime.datetime.now()
        current_month = now.month
        current_year = now.year

        # 1. Przychody ze sprzedaży biletów w tym miesiącu (Gross Revenue)
        query_revenue = """
            SELECT COALESCE(SUM(cena_koncowa), 0) AS revenue 
            FROM Bilet 
            WHERE EXTRACT(MONTH FROM data_zakupu) = %s AND EXTRACT(YEAR FROM data_zakupu) = %s;
        """
        cur.execute(query_revenue, (current_month, current_year))
        gross_revenue = cur.fetchone()["revenue"]

        # 2. Koszty operacyjne (Paliwo) w tym miesiącu (Operating Costs)
        # Zakładamy, że w tabeli Tankowanie mamy kolumnę z datą operacji
        query_costs = """
            SELECT COALESCE(SUM(koszt_calkowity), 0) AS costs 
            FROM Tankowanie 
            WHERE EXTRACT(MONTH FROM data_tankowania) = %s AND EXTRACT(YEAR FROM data_tankowania) = %s;
        """
        cur.execute(query_costs, (current_month, current_year))
        operating_costs = cur.fetchone()["costs"]

        cur.close()

        # Obliczamy zysk netto
        net_profit = gross_revenue - operating_costs

        # Zwracamy dokładnie to, czego oczekuje Twój React Native
        return jsonify(
            {
                # Można uformować walutę we frontendzie
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
