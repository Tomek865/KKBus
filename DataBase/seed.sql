-- odpalenie Get-Content seed.sql | docker exec -i kkbus_postgres psql -U kkbus_admin -d kkbus_db
-- 1. CZYSZCZENIE BAZY (Zabezpieczenie przed duplikatami przy wielokrotnym odpalaniu pliku)
TRUNCATE TABLE Client, Employee, Vehicle, Route, Station, Route_Station, Fare_Segment, Refueling, Trip, Trip_Report, Segment_Report, Reservation, Ticket, Reward, Client_Reward RESTART IDENTITY CASCADE;

-- 2. STACJE (Stations)
INSERT INTO Station (name, gps_coordinates, exact_address) VALUES 
('Kraków', '50.0647, 19.9450', 'MDA Kraków, ul. Bosacka 18'),
('Katowice', '50.2649, 19.0238', 'Dworzec Sądowa, ul. Sądowa 5'),
('Wrocław', '51.0978, 17.0385', 'Dworzec Wrocław, ul. Sucha 1');

-- 3. TRASY (Routes)
INSERT INTO Route (name) VALUES 
('Kraków - Katowice'),
('Kraków - Wrocław');

-- 4. PRZYPISANIE STACJI DO TRAS (Route_Station)
-- Trasa 1: Kraków (1) -> Katowice (2)
INSERT INTO Route_Station (route_id, station_id, order_on_route) VALUES 
(1, 1, 1),
(1, 2, 2);

-- Trasa 2: Kraków (1) -> Katowice (2) -> Wrocław (3)
INSERT INTO Route_Station (route_id, station_id, order_on_route) VALUES 
(2, 1, 1),
(2, 2, 2),
(2, 3, 3);

-- 5. ODCINKI CENOWE (Fare_Segment)
INSERT INTO Fare_Segment (route_id, start_station_id, end_station_id, standard_price) VALUES 
(1, 1, 2, 15.00), -- Kraków -> Katowice
(2, 1, 2, 15.00), -- Kraków -> Katowice (na dłuższej trasie)
(2, 2, 3, 25.00), -- Katowice -> Wrocław
(2, 1, 3, 35.00); -- Kraków -> Wrocław

-- 6. POJAZDY (Vehicles)
INSERT INTO Vehicle (vin, registration_number, brand, model, status, parking_location, seating_capacity, is_active) VALUES 
('WBA1234567890ABCD', 'KR 12345', 'Mercedes-Benz', 'Sprinter', 'Available', 'Baza Kraków', 20, TRUE),
('WBA0987654321WXYZ', 'KR 54321', 'Volkswagen', 'Crafter', 'Available', 'Baza Kraków', 18, TRUE);

-- 7. PRACOWNICY (Employees) 
-- Uwaga: Hasło dla wszystkich to: haslo123 (wygenerowane dla pbkdf2:sha256)
INSERT INTO Employee (first_name, last_name, email, password, role, is_active) VALUES 
('Jan', 'Kowalski', 'kierowca@example.com', 'scrypt:32768:8:1$fG2rA8wL3pT6bY9$3e1174c86d88c4b18c645e9987cf6e5e0c52bbbd098a5e5a2db39d73d6ebbd780c11f71a084ebc810c9c73797c0f1e0de8a9eb3a771966a3106d3e8e8a93bc48', 'Driver', TRUE),
('Anna', 'Nowak', 'admin@example.com', 'scrypt:32768:8:1$fG2rA8wL3pT6bY9$3e1174c86d88c4b18c645e9987cf6e5e0c52bbbd098a5e5a2db39d73d6ebbd780c11f71a084ebc810c9c73797c0f1e0de8a9eb3a771966a3106d3e8e8a93bc48', 'Owner', TRUE);

-- 8. KLIENCI (Clients)
-- Hasło: haslo123
INSERT INTO Client (first_name, last_name, email, password, loyalty_points) VALUES 
('Michał', 'Pasażer', 'klient@example.com', 'scrypt:32768:8:1$fG2rA8wL3pT6bY9$3e1174c86d88c4b18c645e9987cf6e5e0c52bbbd098a5e5a2db39d73d6ebbd780c11f71a084ebc810c9c73797c0f1e0de8a9eb3a771966a3106d3e8e8a93bc48', 100);

-- 9. KURSY (Trips)
-- Ustawiamy kurs na Kraków-Katowice (route_id: 1), bus: 1, kierowca: 1 na jutro rano
INSERT INTO Trip (route_id, vehicle_id, employee_id, departure_time, arrival_time, status) VALUES 
(1, 1, 1, CURRENT_DATE + INTERVAL '1 day 08:00:00', CURRENT_DATE + INTERVAL '1 day 09:30:00', 'Planned');

-- 10. REZERWACJE (Reservations)
-- Pasażer kupuje 1 bilet na powyższy kurs
INSERT INTO Reservation (client_id, trip_id, reservation_number, reservation_date, seat_count, status, payment_status) VALUES 
(1, 1, 'RES-1-1234567890', CURRENT_TIMESTAMP, 1, 'Zrealizowana', 'Opłacona');

-- 11. BILETY (Tickets)
-- Bilet do rezerwacji
INSERT INTO Ticket (reservation_id, segment_id, final_price, discount_type) VALUES 
(1, 1, 15.00, 'Brak');

-- 12. KOSZTY OPERACYJNE (Refueling)
-- Dla testów panelu admina dorzucamy testowe tankowanie
INSERT INTO Refueling (vehicle_id, employee_id, refueling_date, liters_volume, price_per_liter, total_cost) VALUES 
(1, 1, CURRENT_TIMESTAMP, 50.0, 6.50, 325.00);
