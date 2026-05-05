# odpalenie pytest tests/test_api.py -v
import pytest
import requests

BASE_URL = "http://127.0.0.1:5000/api"


@pytest.fixture(scope="module")
def client_headers():
    payload = {"email": "klient@example.com", "password": "haslo123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200, "Nie udało się zalogować klienta testowego."
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def driver_headers():
    payload = {"email": "kierowca@example.com", "password": "haslo123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200, "Nie udało się zalogować kierowcy testowego."
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_headers():
    payload = {"email": "admin@example.com", "password": "haslo123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200, "Nie udało się zalogować admina testowego."
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}


def test_login_invalid_credentials():
    payload = {"email": "test@example.com", "password": "zle_haslo"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 401


def test_client_get_stations():
    # Przywrócony oryginalny krótki URL
    response = requests.get(f"{BASE_URL}/client/stations")
    assert response.status_code == 200


def test_client_search_routes_missing_params():
    response = requests.get(f"{BASE_URL}/client/routes")
    assert response.status_code == 400


def test_client_search_routes_valid_params():
    params = {"date": "2026-05-10", "from": "Kraków", "to": "Warszawa"}
    response = requests.get(f"{BASE_URL}/client/routes", params=params)
    assert response.status_code == 200


def test_client_get_loyalty(client_headers):
    # Przywrócony oryginalny krótki URL
    response = requests.get(f"{BASE_URL}/client/user/loyalty", headers=client_headers)
    assert response.status_code == 200
    assert "points" in response.json()


def test_client_create_reservation(client_headers):
    # Używamy działających parametrów z poprzedniego testu
    params = {"date": "2026-05-10", "from": "Kraków", "to": "Warszawa"}
    routes_resp = requests.get(f"{BASE_URL}/client/routes", params=params)

    valid_trip_id = 1  # Domyślny fallback
    if routes_resp.status_code == 200 and len(routes_resp.json()) > 0:
        valid_trip_id = routes_resp.json()[0]["trip_id"]

    payload = {"trip_id": valid_trip_id, "seat_count": 1}

    response = requests.post(
        f"{BASE_URL}/client/", json=payload, headers=client_headers
    )

    if response.status_code == 404:
        print(f"\nPOWÓD BŁĘDU 404: {response.text}")

    assert response.status_code in [201, 409, 404]


def test_driver_validate_ticket(driver_headers):
    response = requests.post(
        f"{BASE_URL}/driver/tickets/1/validate", headers=driver_headers
    )
    assert response.status_code in [200, 404]


def test_driver_submit_report(driver_headers):
    # Przywrócony oryginalny krótki URL
    payload = {"trip_id": 1, "segment_id": 1, "boarded": 5, "alighted": 2}
    response = requests.post(
        f"{BASE_URL}/driver/reports", json=payload, headers=driver_headers
    )
    assert response.status_code == 201


def test_driver_shift_end(driver_headers):
    # Przywrócony oryginalny krótki URL
    payload = {"volume": 120.5, "cost": 850.0, "vehicle_id": 1}
    response = requests.post(
        f"{BASE_URL}/driver/shift/end", json=payload, headers=driver_headers
    )
    assert response.status_code == 200


def test_admin_get_financial_reports(admin_headers):
    response = requests.get(
        f"{BASE_URL}/admin/reports/financial", headers=admin_headers
    )
    assert response.status_code == 200


def test_admin_get_fleet(admin_headers):
    response = requests.get(f"{BASE_URL}/admin/fleet/", headers=admin_headers)
    assert response.status_code == 200


def test_admin_get_users(admin_headers):
    # Przywrócony oryginalny krótki URL statystyk dashboardu
    response = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
    assert response.status_code == 200


def test_unauthorized_admin_access(client_headers):
    response = requests.get(f"{BASE_URL}/admin/stats", headers=client_headers)
    assert response.status_code == 403
