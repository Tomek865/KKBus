-- odpalenie Get-Content seed.sql | docker exec -i kkbus_postgres psql -U kkbus_admin -d kkbus_db
TRUNCATE TABLE Client, Employee, Vehicle, Route, Station, Route_Station, Fare_Segment, Refueling, Trip, Trip_Report, Segment_Report, Reservation, Ticket, Reward, Client_Reward RESTART IDENTITY CASCADE;

-- 1. STACJE (PRZYSTANKI)
INSERT INTO Station (name, gps_coordinates, exact_address) VALUES 
('Kraków', '50.0647, 19.9450', 'MDA Kraków, ul. Bosacka 18'),
('Chrzanów', '50.1432, 19.3985', 'Węzeł Balińska, ul. Balińska 1'),
('Jaworzno', '50.2052, 19.2743', 'Centrum, ul. Grunwaldzka 50'),
('Katowice', '50.2649, 19.0238', 'Dworzec Sądowa, ul. Sądowa 5');

-- 2. TRASY
INSERT INTO Route (name) VALUES 
('Kraków - Katowice'),
('Katowice - Kraków');

-- Trasa 1: Kraków -> Katowice (4 przystanki)
INSERT INTO Route_Station (route_id, station_id, order_on_route) VALUES 
(1, 1, 1), -- Kraków
(1, 2, 2), -- Chrzanów
(1, 3, 3), -- Jaworzno
(1, 4, 4); -- Katowice

-- Trasa 2: Katowice -> Kraków (3 przystanki - pomija Chrzanów)
INSERT INTO Route_Station (route_id, station_id, order_on_route) VALUES 
(2, 4, 1), -- Katowice
(2, 3, 2), -- Jaworzno
(2, 1, 3); -- Kraków

-- 3. CENNIK ODCINKÓW
-- Ceny dla najdłuższej trasy to 15 zł (Trasa 1) i 12 zł (Trasa 2). 
-- Krótsze odcinki ustalone na minimalną kwotę 12 zł, aby zgadzało się z założeniem najkrótszej trasy.
INSERT INTO Fare_Segment (route_id, start_station_id, end_station_id, standard_price) VALUES 
(1, 1, 4, 15.00), -- Kraków -> Katowice (całość)
(1, 1, 2, 12.00), -- Kraków -> Chrzanów
(1, 1, 3, 12.00), -- Kraków -> Jaworzno
(1, 2, 4, 12.00), -- Chrzanów -> Katowice
(1, 3, 4, 12.00), -- Jaworzno -> Katowice
(2, 4, 1, 12.00), -- Katowice -> Kraków (całość)
(2, 4, 3, 12.00), -- Katowice -> Jaworzno
(2, 3, 1, 12.00); -- Jaworzno -> Kraków

-- 4. POJAZDY FLOTY (4 busy x 20 miejsc, 1 autokar x 60 miejsc)
INSERT INTO Vehicle (vin, registration_number, brand, model, status, parking_location, seating_capacity, is_active) VALUES 
('WBA1111111111ABCD', 'KR 10001', 'Mercedes-Benz', 'Sprinter', 'Available', 'Baza Kraków', 20, TRUE),      -- Bus 1
('WBA2222222222ABCD', 'KR 10002', 'Volkswagen', 'Crafter', 'Available', 'Baza Kraków', 20, TRUE),         -- Bus 2
('WBA3333333333ABCD', 'SK 20001', 'Ford', 'Transit', 'Available', 'Baza Katowice', 20, TRUE),             -- Bus 3
('WBA4444444444ABCD', 'SK 20002', 'Renault', 'Master', 'Available', 'Baza Katowice', 20, TRUE),           -- Bus 4
('WBA5555555555ABCD', 'KR 99999', 'Mercedes-Benz', 'Tourismo', 'Available', 'Baza Kraków', 60, TRUE);     -- Autokar 1

-- 5. PRACOWNICY
-- Uwaga: Hasło dla wszystkich to: haslo123 (wygenerowane dla pbkdf2:sha256)
-- Właściciel
INSERT INTO Employee (first_name, last_name, email, password, role, is_active) VALUES 
('Jan', 'Kowalski', 'jan.kowalski@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Owner', TRUE);


-- Sekretariat
INSERT INTO Employee (first_name, last_name, email, password, role, is_active) VALUES 
('Piotr', 'Uprzejmy', 'piotr.uprzejmy@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Admin', TRUE),
('Agnieszka', 'Miła', 'agnieszka.mila@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Admin', TRUE);

-- Kierowcy
INSERT INTO Employee (first_name, last_name, email, password, role, is_active) VALUES 
('Tomasz', 'Rajdowiec', 'tomasz.rajdowiec@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE),
('Kazimierz', 'Rajdowiec', 'kazimierz.rajdowiec@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE),
('Mirosław', 'Szybki', 'miroslaw.szybki@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE),
('Jan', 'Doświadczony', 'jan.doswiadczony@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE),
('Marek', 'Poprawny', 'marek.poprawny@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE),
('Zuzanna', 'Konkretna', 'zuzanna.konkretna@kkbus.pl', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE);

-- 6. KLIENCI
-- Hasło: haslo123
INSERT INTO Client (first_name, last_name, email, password, loyalty_points) VALUES 
('Michał', 'Pasażer', 'klient@example.com', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 100);

-- 7. TESTOWY KURS I REZERWACJA
-- Kurs: Trasa 1, Autokar (Vehicle 5), Kierowca: Tomasz Rajdowiec (Employee 4)
INSERT INTO Trip (route_id, vehicle_id, employee_id, departure_time, arrival_time, status) VALUES 
(1, 5, 4, CURRENT_DATE + INTERVAL '1 day 08:00:00', CURRENT_DATE + INTERVAL '1 day 09:30:00', 'Planned');

INSERT INTO Reservation (client_id, trip_id, reservation_number, reservation_date, seat_count, status, payment_status) VALUES 
(1, 1, 'RES-1-1234567890', CURRENT_TIMESTAMP, 1, 'Zrealizowana', 'Opłacona');

-- Odcinek Kraków -> Katowice za pełną stawkę 15 zł
INSERT INTO Ticket (reservation_id, segment_id, final_price, ticket_summary) VALUES 
(1, 1, 15.00, 'Brak zniżki');

-- Testowe tankowanie dla autokaru (Kierowca: Tomasz Rajdowiec)
INSERT INTO Refueling (vehicle_id, employee_id, refueling_date, liters_volume, price_per_liter, total_cost) VALUES 
(5, 4, CURRENT_TIMESTAMP, 120.0, 6.50, 780.00);


INSERT INTO Reward (name, description, required_points) VALUES 
('Free Ticket', 'Exchange points for a free ride on any route.', 1000),
('50% Discount', 'Get a 50% discount on your next single ticket.', 500),
('VIP Seat', 'Guarantee of the best seat and extra legroom.', 300),
('Free Luggage', 'Take an extra suitcase at no additional cost.', 200);
