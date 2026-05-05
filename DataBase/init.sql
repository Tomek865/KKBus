-- odpalenie Get-Content init.sql | docker exec -i kkbus_postgres psql -U kkbus_admin -d kkbus_db
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE TABLE Client (
    client_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    birth_date DATE,
    loyalty_points INTEGER DEFAULT 0,
    is_student BOOLEAN DEFAULT FALSE,
    unfulfilled_reservations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Employee (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Driver, Secretariat, Owner
    driving_license_number VARCHAR(50),
    medical_exam_validity DATE,
    assigned_base VARCHAR(50), -- e.g., Krakow, Katowice
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    registration_number VARCHAR(20) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    status VARCHAR(50), 
    parking_location VARCHAR(100),
    seating_capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Route (
    route_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE Station (
    station_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gps_coordinates VARCHAR(50),
    exact_address VARCHAR(255)
);

CREATE TABLE Route_Station (
    route_id INTEGER NOT NULL REFERENCES Route(route_id) ON DELETE CASCADE,
    station_id INTEGER NOT NULL REFERENCES Station(station_id) ON DELETE CASCADE,
    order_on_route INTEGER NOT NULL,
    PRIMARY KEY (route_id, station_id)
);

CREATE TABLE Fare_Segment (
    segment_id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES Route(route_id),
    start_station_id INTEGER NOT NULL REFERENCES Station(station_id),
    end_station_id INTEGER NOT NULL REFERENCES Station(station_id),
    standard_price FLOAT NOT NULL
);

CREATE TABLE Refueling (
    refueling_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES Vehicle(vehicle_id),
    employee_id INTEGER NOT NULL REFERENCES Employee(employee_id), -- Driver refueling
    refueling_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    liters_volume FLOAT NOT NULL,
    price_per_liter FLOAT NOT NULL,
    total_cost FLOAT NOT NULL
);

CREATE TABLE Trip (
    trip_id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES Route(route_id),
    vehicle_id INTEGER NOT NULL REFERENCES Vehicle(vehicle_id),
    employee_id INTEGER NOT NULL REFERENCES Employee(employee_id),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    status VARCHAR(50) -- e.g., Planned, In Progress, Completed, Cancelled
);

CREATE TABLE Trip_Report (
    report_id SERIAL PRIMARY KEY,
    trip_id INTEGER UNIQUE NOT NULL REFERENCES Trip(trip_id) ON DELETE CASCADE
);

CREATE TABLE Segment_Report (
    segment_report_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES Trip_Report(report_id) ON DELETE CASCADE,
    segment_id INTEGER NOT NULL REFERENCES Fare_Segment(segment_id),
    boarded_passengers INTEGER DEFAULT 0,
    alighted_passengers INTEGER DEFAULT 0
);

CREATE TABLE Reservation (
    reservation_id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES Client(client_id),
    trip_id INTEGER NOT NULL REFERENCES Trip(trip_id),
    reservation_number VARCHAR(50) UNIQUE NOT NULL,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seat_count INTEGER NOT NULL,
    status VARCHAR(50), 
    payment_status VARCHAR(50) DEFAULT 'Unpaid' 
);

CREATE TABLE Ticket (
    ticket_id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES Reservation(reservation_id) ON DELETE CASCADE,
    segment_id INTEGER NOT NULL REFERENCES Fare_Segment(segment_id),
    final_price FLOAT NOT NULL,
    discount_type VARCHAR(50)
);

CREATE TABLE Reward (
    reward_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    required_points INTEGER NOT NULL
);

CREATE TABLE Client_Reward (
    client_id INTEGER NOT NULL REFERENCES Client(client_id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES Reward(reward_id) ON DELETE CASCADE,
    exchange_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id, reward_id, exchange_date)
);
