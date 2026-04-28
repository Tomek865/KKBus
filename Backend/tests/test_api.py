import pytest
import requests

BASE_URL = "http://localhost:5000/api"


# odpalamy: pytest tests/test_api.py -v

# ==========================================
# FIXTURES (Zautomatyzowane logowanie dla testów)
# ==========================================

@pytest.fixture(scope="module")
def client_headers():
    """Loguje klienta i zwraca nagłówki z tokenem JWT."""
    payload = {"email": "klient@example.com", "haslo": "haslo123"} # Zmień na dane z Twojej bazy
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200, "Nie udało się zalogować klienta testowego."
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def driver_headers():
    """Loguje kierowcę i zwraca nagłówki z tokenem JWT."""
    payload = {"email": "kierowca@example.com", "haslo": "haslo123"} # Zmień na dane z Twojej bazy
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200, "Nie udało się zalogować kierowcy testowego."
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def admin_headers():
    """Loguje administratora i zwraca nagłówki z tokenem JWT."""
    payload = {"email": "admin@example.com", "haslo": "haslo123"} # Zmień na dane z Twojej bazy
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200, "Nie udało się zalogować admina testowego."
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}

# ==========================================
# TESTY: AUTORYZACJA
# ==========================================

def test_login_invalid_credentials():
    payload = {"email": "bledny@mail.com", "haslo": "zlehaslo"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 401
    assert "error" in response.json()

# ==========================================
# TESTY: KLIENT (PASAŻER)
# ==========================================

def test_client_get_stations():
    response = requests.get(f"{BASE_URL}/client/stations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_client_search_routes_missing_params():
    response = requests.get(f"{BASE_URL}/client/routes")
    assert response.status_code == 400

def test_client_search_routes_valid_params():
    # Zmień parametry tak, aby pasowały do kursu istniejącego w Twojej bazie
    params = {"from": "Kraków", "to": "Katowice", "date": "2026-05-10"}
    response = requests.get(f"{BASE_URL}/client/routes", params=params)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_client_get_loyalty(client_headers):
    response = requests.get(f"{BASE_URL}/client/user/loyalty", headers=client_headers)
    assert response.status_code == 200
    assert "punkty" in response.json()

def test_client_create_reservation(client_headers):
    payload = {"id_kursu": 1, "liczba_miejsc": 1}
    response = requests.post(f"{BASE_URL}/client/reservations/", json=payload, headers=client_headers)
    # Zwraca 201 jeśli zrobiono poprawnie, lub 409 jeśli brakuje miejsc
    assert response.status_code in [201, 409] 

# ==========================================
# TESTY: KIEROWCA
# ==========================================

def test_driver_validate_ticket(driver_headers):
    # Próba zwalidowania biletu o ID 1
    response = requests.post(f"{BASE_URL}/driver/tickets/1/validate", headers=driver_headers)
    assert response.status_code in [200, 404] # 404 jest OK jeśli bilet nr 1 nie istnieje, chroni nas to przed błędem 500

def test_driver_submit_report(driver_headers):
    payload = {
        "id_kursu": 1,
        "id_odcinka": 1,
        "boarded": 5,
        "alighted": 2
    }
    response = requests.post(f"{BASE_URL}/driver/reports", json=payload, headers=driver_headers)
    assert response.status_code == 201

def test_driver_shift_end(driver_headers):
    payload = {
        "volume": 120.5,
        "cost": 850.0,
        "id_pojazdu": 1
    }
    response = requests.post(f"{BASE_URL}/driver/shift/end", json=payload, headers=driver_headers)
    assert response.status_code == 200

# ==========================================
# TESTY: ADMIN (SEKRETARIAT / WŁAŚCICIEL)
# ==========================================

def test_admin_get_financial_reports(admin_headers):
    response = requests.get(f"{BASE_URL}/admin/reports/financial", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "netProfit" in data
    assert "grossRevenue" in data

def test_admin_get_fleet(admin_headers):
    response = requests.get(f"{BASE_URL}/admin/fleet/", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_get_users(admin_headers):
    response = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers) # z dashboard.py
    assert response.status_code == 200
    
def test_unauthorized_admin_access(client_headers):
    # Klient próbuje wejść na panel admina
    response = requests.get(f"{BASE_URL}/admin/reports/financial", headers=client_headers)
    assert response.status_code == 403 # Oczekiwany brak dostępu (Forbidden)
