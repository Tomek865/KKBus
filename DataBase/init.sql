CREATE TABLE Klient (
    id_klienta SERIAL PRIMARY KEY,
    imie VARCHAR(50) NOT NULL,
    nazwisko VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    haslo VARCHAR(255) NOT NULL,
    numer_telefonu VARCHAR(20),
    data_urodzenia DATE,
    punkty_lojalnosciowe INTEGER DEFAULT 0,
    czy_student BOOLEAN DEFAULT FALSE,
    ilosc_niezrealizowanych_rezerwacji INTEGER DEFAULT 0,
    data_utworzenia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Pracownik (
    id_pracownika SERIAL PRIMARY KEY,
    imie VARCHAR(50) NOT NULL,
    nazwisko VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    haslo VARCHAR(255) NOT NULL,
    rola VARCHAR(50) NOT NULL, -- Kierowca, Sekretariat, Wlasciciel
    nr_prawa_jazdy VARCHAR(50),
    waznosc_badan_lekarskich DATE,
    baza_przypisania VARCHAR(50), -- np. Kraków, Katowice
    czy_aktywny BOOLEAN DEFAULT TRUE
);

CREATE TABLE Pojazd (
    id_pojazdu SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    nr_rejestracyjny VARCHAR(20) NOT NULL,
    marka VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    stan VARCHAR(50), 
    miejsce_parkowania VARCHAR(100),
    pojemnosc_miejsc INTEGER NOT NULL,
    czy_aktywny BOOLEAN DEFAULT TRUE
);

CREATE TABLE Trasa (
    id_trasy SERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL
);

CREATE TABLE Przystanek (
    id_przystanku SERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    wspolrzedne_gps VARCHAR(50),
    dokladny_adres VARCHAR(255)
);

CREATE TABLE Trasa_Przystanek (
    id_trasy INTEGER NOT NULL REFERENCES Trasa(id_trasy) ON DELETE CASCADE,
    id_przystanku INTEGER NOT NULL REFERENCES Przystanek(id_przystanku) ON DELETE CASCADE,
    kolejnosc_na_trasie INTEGER NOT NULL,
    PRIMARY KEY (id_trasy, id_przystanku)
);

CREATE TABLE Odcinek_Cenowy (
    id_odcinka SERIAL PRIMARY KEY,
    id_trasy INTEGER NOT NULL REFERENCES Trasa(id_trasy),
    id_przystanek_poczatkowy INTEGER NOT NULL REFERENCES Przystanek(id_przystanku),
    id_przystanek_koncowy INTEGER NOT NULL REFERENCES Przystanek(id_przystanku),
    cena_normalna FLOAT NOT NULL
);

CREATE TABLE Tankowanie (
    id_tankowania SERIAL PRIMARY KEY,
    id_pojazdu INTEGER NOT NULL REFERENCES Pojazd(id_pojazdu),
    id_pracownika INTEGER NOT NULL REFERENCES Pracownik(id_pracownika), -- Kierowca tankujący
    data_tankowania TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ilosc_litrow FLOAT NOT NULL,
    cena_za_litr FLOAT NOT NULL,
    koszt_calkowity FLOAT NOT NULL
);

CREATE TABLE Kurs (
    id_kursu SERIAL PRIMARY KEY,
    id_trasy INTEGER NOT NULL REFERENCES Trasa(id_trasy),
    id_pojazdu INTEGER NOT NULL REFERENCES Pojazd(id_pojazdu),
    id_pracownika INTEGER NOT NULL REFERENCES Pracownik(id_pracownika),
    data_wyjazdu TIMESTAMP NOT NULL,
    data_przyjazdu TIMESTAMP,
    status VARCHAR(50) 
);

CREATE TABLE RaportKursu (
    id_raportu SERIAL PRIMARY KEY,
    id_kursu INTEGER UNIQUE NOT NULL REFERENCES Kurs(id_kursu) ON DELETE CASCADE
    -- Koszty paliwa i ogólna liczba pasażerów usunięte zgodnie z recenzją
);

CREATE TABLE Raport_Odcinek (
    id_raportu_odcinka SERIAL PRIMARY KEY,
    id_raportu INTEGER NOT NULL REFERENCES RaportKursu(id_raportu) ON DELETE CASCADE,
    id_odcinka INTEGER NOT NULL REFERENCES Odcinek_Cenowy(id_odcinka),
    ilosc_wsiadajacych INTEGER DEFAULT 0,
    ilosc_wysiadajacych INTEGER DEFAULT 0
);

CREATE TABLE Rezerwacja (
    id_rezerwacji SERIAL PRIMARY KEY,
    id_klienta INTEGER NOT NULL REFERENCES Klient(id_klienta),
    id_kursu INTEGER NOT NULL REFERENCES Kurs(id_kursu),
    numer_rezerwacji VARCHAR(50) UNIQUE NOT NULL,
    data_rezerwacji TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    liczba_miejsc INTEGER NOT NULL,
    status VARCHAR(50), 
    status_platnosci VARCHAR(50) DEFAULT 'Nieoplacona' -- Kluczowe dla wymuszenia płatności online
);

CREATE TABLE Bilet (
    id_biletu SERIAL PRIMARY KEY,
    id_rezerwacji INTEGER NOT NULL REFERENCES Rezerwacja(id_rezerwacji) ON DELETE CASCADE,
    id_odcinka INTEGER NOT NULL REFERENCES Odcinek_Cenowy(id_odcinka),
    cena_koncowa FLOAT NOT NULL,
    rodzaj_znizki VARCHAR(50)
);

CREATE TABLE Nagroda (
    id_nagrody SERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    wymagane_punkty INTEGER NOT NULL
);

CREATE TABLE Klient_Nagroda (
    id_klienta INTEGER NOT NULL REFERENCES Klient(id_klienta) ON DELETE CASCADE,
    id_nagrody INTEGER NOT NULL REFERENCES Nagroda(id_nagrody) ON DELETE CASCADE,
    data_wymiany TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_klienta, id_nagrody, data_wymiany)
);
