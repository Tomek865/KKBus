-- 1. Aktualizacja schematu (dodanie odległości i czasu do odcinków)
ALTER TABLE Odcinek_Cenowy 
ADD COLUMN odleglosc_km INTEGER,
ADD COLUMN czas_przejazdu_min INTEGER;

-- 2. Dodanie zasobów (Kierowca i Pojazd)
INSERT INTO Pracownik (imie, nazwisko, email, haslo, rola, nr_prawa_jazdy, czy_aktywny) 
VALUES ('Jan', 'Kowalski', 'jan.kowalski@kkbus.pl', 'haslo123', 'Kierowca', 'PRAWO12345', TRUE);

INSERT INTO Pojazd (vin, nr_rejestracyjny, marka, model, stan, pojemnosc_miejsc, czy_aktywny) 
VALUES ('VIN12345678901234', 'KR 12345', 'Mercedes', 'Sprinter', 'Dostepny', 20, TRUE);

-- 3. Definicja Tras (Tam i z powrotem)
INSERT INTO Trasa (nazwa) VALUES ('Kraków -> Katowice'); -- ID 1
INSERT INTO Trasa (nazwa) VALUES ('Katowice -> Kraków'); -- ID 2

-- 4. Dodanie 10 przystanków
INSERT INTO Przystanek (nazwa, dokladny_adres) VALUES 
('Kraków, MDA', 'ul. Bosacka 18, Kraków'),          -- ID 1
('Kraków, Rondo Ofiar Katynia', 'Rondo Ofiar Katynia, Kraków'), -- ID 2
('Zabierzów', 'ul. Krakowska, Zabierzów'),          -- ID 3
('Krzeszowice', 'ul. Kościuszki, Krzeszowice'),     -- ID 4
('Trzebinia', 'ul. Dworcowa, Trzebinia'),           -- ID 5
('Chrzanów', 'ul. Zielona, Chrzanów'),              -- ID 6
('Jaworzno', 'ul. Grunwaldzka, Jaworzno'),          -- ID 7
('Mysłowice', 'ul. Katowicka, Mysłowice'),          -- ID 8
('Katowice, Zawodzie', 'ul. 1 Maja, Katowice'),     -- ID 9
('Katowice, Dworzec', 'ul. Piotra Skargi, Katowice'); -- ID 10

-- 5. Powiązanie przystanków z trasami (kolejność)
-- Trasa 1: Kraków -> Katowice
INSERT INTO Trasa_Przystanek (id_trasy, id_przystanku, kolejnosc_na_trasie) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5), 
(1, 6, 6), (1, 7, 7), (1, 8, 8), (1, 9, 9), (1, 10, 10);

-- Trasa 2: Katowice -> Kraków (odwrotna kolejność)
INSERT INTO Trasa_Przystanek (id_trasy, id_przystanku, kolejnosc_na_trasie) VALUES
(2, 10, 1), (2, 9, 2), (2, 8, 3), (2, 7, 4), (2, 6, 5), 
(2, 5, 6), (2, 4, 7), (2, 3, 8), (2, 2, 9), (2, 1, 10);

-- 6. Definicja odcinków (odległość, czas, cena) pomiędzy KOLEJNYMI przystankami
-- Dla trasy Kraków -> Katowice
INSERT INTO Odcinek_Cenowy (id_trasy, id_przystanek_poczatkowy, id_przystanek_koncowy, cena_normalna, odleglosc_km, czas_przejazdu_min) VALUES
(1, 1, 2, 4.0, 6, 15),
(1, 2, 3, 4.0, 8, 10),
(1, 3, 4, 5.0, 12, 15),
(1, 4, 5, 5.0, 14, 20),
(1, 5, 6, 4.0, 8, 10),
(1, 6, 7, 5.0, 15, 20),
(1, 7, 8, 4.0, 10, 15),
(1, 8, 9, 4.0, 8, 10),
(1, 9, 10, 3.0, 3, 5);

-- Dla trasy Katowice -> Kraków (odwrotnie)
INSERT INTO Odcinek_Cenowy (id_trasy, id_przystanek_poczatkowy, id_przystanek_koncowy, cena_normalna, odleglosc_km, czas_przejazdu_min) VALUES
(2, 10, 9, 3.0, 3, 5),
(2, 9, 8, 4.0, 8, 10),
(2, 8, 7, 4.0, 10, 15),
(2, 7, 6, 5.0, 15, 20),
(2, 6, 5, 4.0, 8, 10),
(2, 5, 4, 5.0, 14, 20),
(2, 4, 3, 5.0, 12, 15),
(2, 3, 2, 4.0, 8, 10),
(2, 2, 1, 4.0, 6, 15);

-- 7. Zaplanowanie 4 kursów na konkretny dzień (np. 2026-05-10)
-- 2 kursy Kraków -> Katowice (Trasa 1)
INSERT INTO Kurs (id_trasy, id_pojazdu, id_pracownika, data_wyjazdu, data_przyjazdu, status) VALUES
(1, 1, 1, '2026-05-10 08:00:00', '2026-05-10 10:00:00', 'Planowany'),
(1, 1, 1, '2026-05-10 16:00:00', '2026-05-10 18:00:00', 'Planowany');

-- 2 kursy Katowice -> Kraków (Trasa 2)
INSERT INTO Kurs (id_trasy, id_pojazdu, id_pracownika, data_wyjazdu, data_przyjazdu, status) VALUES
(2, 1, 1, '2026-05-10 12:00:00', '2026-05-10 14:00:00', 'Planowany'),
(2, 1, 1, '2026-05-10 20:00:00', '2026-05-10 22:00:00', 'Planowany');
