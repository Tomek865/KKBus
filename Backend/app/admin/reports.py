from flask import Blueprint, request, send_file, jsonify
from db import get_db_connection
from psycopg2.extras import RealDictCursor
from app.utils import admin_required

import io
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

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


# ---PDF---


def create_pdf_document(title, subtitle, table_data, col_widths=None):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=18,
    )
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
    elements.append(Paragraph(subtitle, styles["Normal"]))
    elements.append(Spacer(1, 20))

    table = Table(table_data, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f9fafb")),
                ("GRID", (0, 0), (-1, -1), 1, colors.lightgrey),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f3f4f6")],
                ),
            ]
        )
    )

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer


@admin_reports_bp.route("/reservations", methods=["GET", "OPTIONS"])
@admin_required
def generate_reservations_pdf(current_user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    report_type = request.args.get("type", "monthly")
    year = request.args.get("year", datetime.now().year)
    month = request.args.get("month", datetime.now().month)

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                DATE(reservation_date) as date,
                COUNT(reservation_id) as total_bookings,
                SUM(seat_count) as total_seats,
                SUM(total_price) as total_revenue
            FROM Reservation
            WHERE EXTRACT(YEAR FROM reservation_date) = %s AND status != 'Cancelled'
        """
        params = [year]

        if report_type == "monthly":
            query += " AND EXTRACT(MONTH FROM reservation_date) = %s "
            params.append(month)

        query += " GROUP BY DATE(reservation_date) ORDER BY date ASC;"

        cur.execute(query, tuple(params))
        records = cur.fetchall()
        cur.close()

        table_data = [["Date", "Bookings", "Seats Sold", "Revenue (PLN)"]]
        total_rev = 0

        for row in records:
            table_data.append(
                [
                    row["date"].strftime("%Y-%m-%d"),
                    str(row["total_bookings"]),
                    str(row["total_seats"]),
                    f"{row['total_revenue']} PLN",
                ]
            )
            total_rev += float(row["total_revenue"] or 0)

        table_data.append(["TOTAL", "", "", f"{round(total_rev, 2)} PLN"])

        subtitle = f"Period: {year}-{
            month if report_type == 'monthly' else 'All Year'
        } | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        pdf_buffer = create_pdf_document(
            "Reservations Report", subtitle, table_data, col_widths=[120, 100, 100, 150]
        )

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"Reservations_{year}_{report_type}.pdf",
            mimetype="application/pdf",
        )

    except Exception as e:
        print(f"Błąd PDF: {e}")
        return jsonify({"error": "Failed to generate PDF"}), 500
    finally:
        if conn:
            conn.close()


@admin_reports_bp.route("/trips", methods=["GET", "OPTIONS"])
@admin_required
def generate_trips_pdf(current_user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    trip_type = request.args.get("type", "daily")
    driver_id = request.args.get("driverId")
    bus_id = request.args.get("busId")

    date = request.args.get("date")
    year = request.args.get("year")
    month = request.args.get("month")

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                tr.trip_id,
                TO_CHAR(tr.departure_time, 'YYYY-MM-DD HH24:MI') as dep_time,
                ro.name as route_name,
                v.registration_number,
                e.last_name || ' ' || e.first_name as driver_name,
                COALESCE((SELECT SUM(seat_count) FROM Reservation WHERE trip_id = tr.trip_id AND status != 'Cancelled'), 0) as passengers
            FROM Trip tr
            JOIN Route ro ON tr.route_id = ro.route_id
            JOIN Vehicle v ON tr.vehicle_id = v.vehicle_id
            JOIN Employee e ON tr.employee_id = e.employee_id
            WHERE 1=1
        """
        params = []

        if trip_type == "daily" and date:
            query += " AND DATE(tr.departure_time) = %s"
            params.append(date)
        elif trip_type == "monthly" and year and month:
            query += " AND EXTRACT(YEAR FROM tr.departure_time) = %s AND EXTRACT(MONTH FROM tr.departure_time) = %s"
            params.extend([year, month])
        elif trip_type == "annual" and year:
            query += " AND EXTRACT(YEAR FROM tr.departure_time) = %s"
            params.append(year)

        if driver_id:
            query += " AND tr.employee_id = %s"
            params.append(driver_id)
        if bus_id:
            query += " AND tr.vehicle_id = %s"
            params.append(bus_id)

        query += " ORDER BY tr.departure_time DESC;"

        cur.execute(query, tuple(params))
        trips = cur.fetchall()
        cur.close()

        table_data = [["Trip ID", "Departure", "Route", "Vehicle", "Driver", "Pax"]]
        total_pax = 0

        for trip in trips:
            table_data.append(
                [
                    str(trip["trip_id"]),
                    trip["dep_time"],
                    trip["route_name"][:20],
                    trip["registration_number"],
                    trip["driver_name"],
                    str(trip["passengers"]),
                ]
            )
            total_pax += int(trip["passengers"] or 0)

        table_data.append(["", "", "", "", "TOTAL PAX:", str(total_pax)])

        subtitle = f"Report Type: {trip_type.upper()} | Generated: {
            datetime.now().strftime('%Y-%m-%d %H:%M')
        }"
        pdf_buffer = create_pdf_document("Trip & Fleet Report", subtitle, table_data)

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"Trips_{trip_type}.pdf",
            mimetype="application/pdf",
        )

    except Exception as e:
        print(f"Błąd PDF: {e}")
        return jsonify({"error": "Failed to generate PDF"}), 500
    finally:
        if conn:
            conn.close()
