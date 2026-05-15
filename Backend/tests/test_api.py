# odpalenie pytest tests/test_api.py -v
import pytest
import requests
import time

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
    response = requests.get(f"{BASE_URL}/client/user/loyalty", headers=client_headers)
    assert response.status_code == 200
    assert "points" in response.json()


def test_client_create_reservation(client_headers):
    params = {"date": "2026-05-10", "from": "Kraków", "to": "Warszawa"}
    routes_resp = requests.get(f"{BASE_URL}/client/routes", params=params)

    valid_trip_id = 1
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
    payload = {"trip_id": 1, "segment_id": 1, "boarded": 5, "alighted": 2}
    response = requests.post(
        f"{BASE_URL}/driver/reports", json=payload, headers=driver_headers
    )
    assert response.status_code == 201


def test_driver_shift_end(driver_headers):
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
    response = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
    assert response.status_code == 200


def test_unauthorized_admin_access(client_headers):
    response = requests.get(f"{BASE_URL}/admin/stats", headers=client_headers)
    assert response.status_code == 403


def test_public_registration():
    unique_email = f"nowy{int(time.time())}@example.com"
    payload = {
        "name": "Testowy Pasażer",
        "email": unique_email,
        "password": "bezpiecznehaslo",
        "role": "client"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    assert response.status_code == 201

def test_admin_create_and_deactivate_user(admin_headers):
    unique_email = f"pracownik{int(time.time())}@example.com"
    payload = {
        "name": "Nowy Pracownik",
        "email": unique_email,
        "role": "Driver",
        "isActive": True
    }
    create_resp = requests.post(f"{BASE_URL}/admin/management/users", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201
    
    user_id = create_resp.json().get("id")
    assert user_id is not None
    
    deactivate_resp = requests.patch(f"{BASE_URL}/admin/management/users/{user_id}", headers=admin_headers)
    assert deactivate_resp.status_code == 200

def test_admin_create_and_cancel_trip(admin_headers):
    payload = {
        "busId": 1,
        "route": 1,
        "driver": 1,
        "status": "Planned"
    }
    create_resp = requests.post(f"{BASE_URL}/admin/fleet/", json=payload, headers=admin_headers)
    
    if create_resp.status_code == 201:
        trip_id = create_resp.json().get("id")
        
        cancel_resp = requests.patch(f"{BASE_URL}/admin/fleet/{trip_id}", headers=admin_headers)
        assert cancel_resp.status_code == 200

def test_driver_get_assigned_trips(driver_headers):
    response = requests.get(f"{BASE_URL}/driver/trips/", headers=driver_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_driver_get_trip_details(driver_headers):
    trips_resp = requests.get(f"{BASE_URL}/driver/trips/", headers=driver_headers)
    
    if trips_resp.status_code == 200 and len(trips_resp.json()) > 0:
        trip_id = trips_resp.json()[0]['trip_id']
        
        stations_resp = requests.get(f"{BASE_URL}/driver/trips/{trip_id}/stations", headers=driver_headers)
        assert stations_resp.status_code == 200
        
        passengers_resp = requests.get(f"{BASE_URL}/driver/trips/{trip_id}/passengers", headers=driver_headers)
        assert passengers_resp.status_code == 200
