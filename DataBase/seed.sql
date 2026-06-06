-- odpalenie Get-Content seed.sql | docker exec -i kkbus_postgres psql -U kkbus_admin -d kkbus_db
TRUNCATE TABLE Client, Employee, Vehicle, Route, Station, Route_Station, Fare_Segment, Refueling, Trip, Trip_Report, Segment_Report, Reservation, Ticket, Reward, Client_Reward RESTART IDENTITY CASCADE;

INSERT INTO Station (name, gps_coordinates, exact_address) VALUES 
('Kraków', '50.0647, 19.9450', 'MDA Kraków, ul. Bosacka 18'),
('Katowice', '50.2649, 19.0238', 'Dworzec Sądowa, ul. Sądowa 5'),
('Wrocław', '51.0978, 17.0385', 'Dworzec Wrocław, ul. Sucha 1');

INSERT INTO Route (name) VALUES 
('Kraków - Katowice'),
('Kraków - Wrocław');

-- Trasa 1: Kraków (1) -> Katowice (2)
INSERT INTO Route_Station (route_id, station_id, order_on_route) VALUES 
(1, 1, 1),
(1, 2, 2);

-- Trasa 2: Kraków (1) -> Katowice (2) -> Wrocław (3)
INSERT INTO Route_Station (route_id, station_id, order_on_route) VALUES 
(2, 1, 1),
(2, 2, 2),
(2, 3, 3);

INSERT INTO Fare_Segment (route_id, start_station_id, end_station_id, standard_price) VALUES 
(1, 1, 2, 15.00),
(2, 1, 2, 15.00),
(2, 2, 3, 25.00),
(2, 1, 3, 35.00);

INSERT INTO Vehicle (vin, registration_number, brand, model, status, parking_location, seating_capacity, is_active) VALUES 
('WBA1234567890ABCD', 'KR 12345', 'Mercedes-Benz', 'Sprinter', 'Available', 'Baza Kraków', 20, TRUE),
('WBA0987654321WXYZ', 'KR 54321', 'Volkswagen', 'Crafter', 'Available', 'Baza Kraków', 18, TRUE);

-- Uwaga: Hasło dla wszystkich to: haslo123 (wygenerowane dla pbkdf2:sha256)
INSERT INTO Employee (first_name, last_name, email, password, role, is_active) VALUES 
('Jan', 'Kowalski', 'kierowca@example.com', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Driver', TRUE),
('Anna', 'Nowak', 'admin@example.com', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 'Admin', TRUE);

-- Hasło: haslo123
INSERT INTO Client (first_name, last_name, email, password, loyalty_points) VALUES 
('Michał', 'Pasażer', 'klient@example.com', 'pbkdf2:sha256:600000$ZROY7nHNsJgGdO1c$9b3c1f3f7394900e250321bbe6952b2593d9f9325981b73ccb89caf86a8ef654', 100);

INSERT INTO Trip (route_id, vehicle_id, employee_id, departure_time, arrival_time, status) VALUES 
(1, 1, 1, CURRENT_DATE + INTERVAL '1 day 08:00:00', CURRENT_DATE + INTERVAL '1 day 09:30:00', 'Planned');

INSERT INTO Reservation (client_id, trip_id, reservation_number, reservation_date, seat_count, status, payment_status) VALUES 
(1, 1, 'RES-1-1234567890', CURRENT_TIMESTAMP, 1, 'Zrealizowana', 'Opłacona');

INSERT INTO Ticket (reservation_id, segment_id, final_price, discount_type) VALUES 
(1, 1, 15.00, 'Brak');

INSERT INTO Refueling (vehicle_id, employee_id, refueling_date, liters_volume, price_per_liter, total_cost) VALUES 
(1, 1, CURRENT_TIMESTAMP, 50.0, 6.50, 325.00);
