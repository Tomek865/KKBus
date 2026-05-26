import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '../../components/passenger/SearchInput';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch } from '../../utils';

export interface Departure {
    id: string; 
    departureTime: string; 
    arrivalTime: string; 
    departureStation: string;
    arrivalStation: string; 
    duration: string; 
    seatsLeft: number | string; 
    price: number | null;
}

const generateNext14Days = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() + i); dates.push(d);
    }
    return dates;
};

const DepartureCard = ({ departure, onBook }: { departure: Departure, onBook: () => void }) => {
    const isLowSeats = typeof departure.seatsLeft === 'number' && departure.seatsLeft <= 5;
    
    return (
        <TouchableOpacity style={styles.departureCard} onPress={onBook}>
            <View style={styles.routeContainer}>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeText}>{departure.departureTime}</Text>
                    <Text style={styles.stationText}>{departure.departureStation}</Text>
                </View>
                <View style={styles.durationBlock}>
                    <Text style={styles.durationText}>{departure.duration}</Text>
                    <View style={styles.durationLineWrapper}>
                        <View style={styles.durationDotGray} />
                        <View style={styles.durationLine} />
                        <View style={styles.durationDotRed} />
                    </View>
                </View>
                <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
                    <Text style={styles.timeText}>{departure.arrivalTime}</Text>
                    <Text style={styles.stationText}>{departure.arrivalStation}</Text>
                </View>
            </View>
            <View style={styles.departureFooter}>
                <View style={[styles.seatsBadge, isLowSeats ? styles.seatsBadgeOrange : styles.seatsBadgeGreen]}>
                    <Text style={[styles.seatsText, isLowSeats ? styles.seatsTextOrange : styles.seatsTextGreen]}>
                        {departure.seatsLeft === 'Brak danych' ? 'BRAK DANYCH O MIEJSCACH' : `${departure.seatsLeft} SEATS LEFT`}
                    </Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                        {departure.price !== null ? `${departure.price} PLN` : 'Brak danych'}
                    </Text>
                    <View style={styles.actionIcon}>
                        <Ionicons name="cart" size={18} color="#e60000" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function PassengerSearch() {
    const [stations, setStations] = useState<string[]>([]);
    const [fromStation, setFromStation] = useState('Krakow');
    const [toStation, setToStation] = useState('Warszawa');
    const [availableDates] = useState(generateNext14Days());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [passengerCounts, setPassengerCounts] = useState({ adult: 1, student: 0, reduced: 0 });
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);
    const [passengerModalVisible, setPassengerModalVisible] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [reservationModalVisible, setReservationModalVisible] = useState(false);
    
    const [selectedDep, setSelectedDep] = useState<Departure | null>(null);
    const [isBooking, setIsBooking] = useState(false);

       useEffect(() => {
        const fetchStationsFromDB = async () => {
            try {
                const res = await authFetch('/api/client/reservations/stations');
                if (!res.ok) {
                    console.error("Błąd pobierania stacji, status HTTP:", res.status);
                    return;
                }
                const data = await res.json();
                console.log("Pobrane stacje z API:", data); // Zobacz w konsoli co przyszło

                // Bezpieczniejsze parsowanie - szukamy tablicy głębiej, jeśli Spring ją opakował
                const stationsArray = Array.isArray(data) ? data : (data.content || data.data || data.stations || []);
                
                if (stationsArray && Array.isArray(stationsArray) && stationsArray.length > 0) {
                    // Obsługuje sytuację, gdy backend zwraca obiekty [{name: "Kraków"}] lub od razu stringi ["Kraków"]
                    setStations(stationsArray.map((s: any) => s.name ? s.name : s));
                } else {
                    console.warn("Backend nie zwrócił poprawnej tablicy stacji.");
                }
            } catch (err) {
                console.error("Błąd sieci lub parsowania stacji:", err);
            }
        };
        fetchStationsFromDB();
    }, []);

        const handleSearchRoutes = async () => {
        setIsSearching(true); 
        setHasSearched(true); 
        setDepartures([]);
        
        try {
            // POPRAWKA 1: Generujemy datę ściśle w czasie lokalnym urządzenia, ignorując przesunięcie UTC
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`; 

            
            const payload = {
                from_station: fromStation,
                to_station: toStation,
                date: dateStr,
                tickets: {
                    adult: passengerCounts.adult,
                    student: passengerCounts.student,
                    reduced: passengerCounts.reduced
                }
            };
            const res = await authFetch(`/api/client/reservations/routes/search`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            


            if (!res.ok) {
                console.error("Serwer zwrócił błąd HTTP:", res.status);
                return;
            }
            
            const data = await res.json();
            
            // DIAGNOSTYKA: Wypisujemy w konsoli dokładnie to, co przyszło
            console.log(`Odpowiedź API dla trasy ${fromStation} -> ${toStation} (${dateStr}):`, data);

            // POPRAWKA 2: Szukamy tablicy, nawet jeśli Spring spakował ją w dodatkowy obiekt
            const routesArray = Array.isArray(data) ? data : (data.content || data.data || data.routes);

            if (routesArray && Array.isArray(routesArray)) {
                if (routesArray.length === 0) {
                    console.log("Tablica z backendu jest pusta (brak kursów na ten dzień).");
                }
                
                const mappedDepartures = routesArray.map((d: any) => ({
                    id: String(d.trip_id || d.id || Math.random()), // Zabezpieczenie przed brakiem ID
                    departureTime: d.departure_time || 'Brak danych',
                    arrivalTime: d.arrival_time || 'Brak danych',
                    departureStation: fromStation,
                    arrivalStation: toStation,
                    duration: d.duration || 'Brak danych', 
                    seatsLeft: d.seating_capacity !== undefined ? d.seating_capacity : 'Brak danych', 
                    price: d.total_price !== undefined ? d.total_price : null 
                }));
                setDepartures(mappedDepartures);
            } else {
                console.error("Format odpowiedzi jest nieznany. Frontend oczekiwał tablicy, a dostał:", typeof data);
            }
            
        } catch (err) {
            console.error("Błąd sieci lub parsowania wyszukiwania tras:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleBookTicket = async () => {
        if (!selectedDep) return;
        setIsBooking(true);

        // const generateRandomNumberId = () => {
        //     return Date.now() + Math.floor(Math.random() * 1000); 
        // };

        const payload = {
            //ticket_id: generateRandomNumberId(),
            trip: {
                id: parseInt(selectedDep.id, 10),
                from: selectedDep.departureStation,
                to: selectedDep.arrivalStation
            },
            tickets: {
                adult: passengerCounts.adult,
                student: passengerCounts.student,
                reduced: passengerCounts.reduced
            }

        };
        try {
            const res = await authFetch('/api/client/reservations/checkout', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setReservationModalVisible(false);
                Alert.alert("Success", "Ticket booked successfully!");
            } else {
                Alert.alert("Error", "Failed to book the ticket.");
            }
        } catch (err) {
            console.error("Booking error:", err);
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setIsBooking(false);
        }
    };

    const updateCount = (type: keyof typeof passengerCounts, delta: number) => {
        setPassengerCounts(prev => {
            const newVal = prev[type] + delta;
            if (newVal < 0) return prev;
            if (type === 'adult' && newVal === 0 && prev.student === 0 && prev.reduced === 0) return prev;
            const total = prev.adult + prev.student + prev.reduced + delta;
            if (total > 10) return prev;
            return { ...prev, [type]: newVal };
        });
    };

    const getPassengersSummary = () => {
        const parts = [];
        if (passengerCounts.adult > 0) parts.push(`${passengerCounts.adult} Adult${passengerCounts.adult > 1 ? 's' : ''}`);
        if (passengerCounts.student > 0) parts.push(`${passengerCounts.student} Student${passengerCounts.student > 1 ? 's' : ''}`);
        if (passengerCounts.reduced > 0) parts.push(`${passengerCounts.reduced} Reduced`);
        return parts.length > 0 ? parts.join(', ') : 'Select passengers';
    };

    const swapStations = () => { const temp = fromStation; setFromStation(toStation); setToStation(temp); };
    const formattedDate = selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const totalSeats = passengerCounts.adult + passengerCounts.student + passengerCounts.reduced;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.logo}>KK<Text style={styles.logoRed}>Bus</Text></Text>

                <View style={styles.searchCard}>
                    <SearchInput label="FROM" value={fromStation} onPress={() => { setSelectingField('from'); setModalVisible(true); }} />
                    <TouchableOpacity style={styles.swapIconContainer} onPress={swapStations}>
                        <Ionicons name="swap-vertical" size={20} color="#e60000" />
                    </TouchableOpacity>
                    <SearchInput label="TO" value={toStation} onPress={() => { setSelectingField('to'); setModalVisible(true); }} />

                    <View style={styles.row}>
                        <SearchInput label="DATE" value={formattedDate} flex={1} marginRight={8} onPress={() => setDateModalVisible(true)} />
                        <SearchInput label="PASSENGERS" value={getPassengersSummary()} flex={1} onPress={() => setPassengerModalVisible(true)} />
                    </View>

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSearchRoutes}>
                        <Text style={styles.primaryBtnText}>{isSearching ? 'Searching...' : 'Search Routes'}</Text>
                    </TouchableOpacity>
                </View>
                
                {hasSearched && (
                    <View style={styles.resultsSection}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>Available Departures</Text>
                            <View style={styles.optionsBadge}><Text style={styles.optionsText}>{departures.length} options</Text></View>
                        </View>
                        {isSearching ? <Text style={styles.loadingText}>Loading routes...</Text> : departures.map(dep => <DepartureCard key={dep.id} departure={dep} onBook={() => { setSelectedDep(dep); setReservationModalVisible(true); }} />)}
                    </View>
                )}
            </ScrollView>

            {/* MODAL: WYBÓR STACJI */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Station</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={32} color="#aaa" /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={stations} keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.listItem} onPress={() => { selectingField === 'from' ? setFromStation(item) : setToStation(item); setModalVisible(false); }}>
                                <Ionicons name="location-outline" size={20} color="#888" />
                                <Text style={styles.listItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.loadingText}>Loading stations...</Text>}
                    />
                </SafeAreaView>
            </Modal>

            {/* MODAL: WYBÓR DATY */}
            <Modal visible={dateModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => setDateModalVisible(false)}><Ionicons name="close-circle" size={32} color="#aaa" /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={availableDates} keyExtractor={(item) => item.toISOString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity style={styles.listItem} onPress={() => { setSelectedDate(item); setDateModalVisible(false); }}>
                                <View style={[styles.iconBg, { backgroundColor: index === 0 ? '#e60000' : '#f3f4f6' }]}>
                                    <Ionicons name="calendar" size={16} color={index === 0 ? '#fff' : '#888'} />
                                </View>
                                <Text style={styles.listItemText}>
                                    {index === 0 ? 'Today, ' : index === 1 ? 'Tomorrow, ' : ''}
                                    {item.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}
                                </Text>
                                {selectedDate.toDateString() === item.toDateString() && <Ionicons name="checkmark" size={24} color="#10b981" style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>

            {/* MODAL: WYBÓR PASAŻERÓW */}
            <Modal visible={passengerModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Passengers</Text>
                        <TouchableOpacity onPress={() => setPassengerModalVisible(false)}><Ionicons name="close-circle" size={32} color="#aaa" /></TouchableOpacity>
                    </View>
                    <View style={styles.counterList}>
                        {(['adult', 'student', 'reduced'] as const).map((type) => (
                            <View style={styles.counterRow} key={type}>
                                <View>
                                    <Text style={styles.counterLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                                    <Text style={styles.counterSub}>{type === 'adult' ? 'Standard ticket' : type === 'student' ? 'Valid student ID required (-51%)' : 'Children, Seniors (-37%)'}</Text>
                                </View>
                                <View style={styles.counterControls}>
                                    <TouchableOpacity onPress={() => updateCount(type, -1)} style={styles.countBtn}><Ionicons name="remove" size={20} color="#111" /></TouchableOpacity>
                                    <Text style={styles.countText}>{passengerCounts[type]}</Text>
                                    <TouchableOpacity onPress={() => updateCount(type, 1)} style={styles.countBtn}><Ionicons name="add" size={20} color="#111" /></TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setPassengerModalVisible(false)}>
                        <Text style={styles.primaryBtnText}>Confirm</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {/* MODAL: REZERWACJA */}
            <Modal visible={reservationModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainerAlt}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Confirm Reservation</Text>
                        <TouchableOpacity onPress={() => setReservationModalVisible(false)}><Ionicons name="close-circle" size={32} color="#aaa" /></TouchableOpacity>
                    </View>
                    
                    {selectedDep && (
                        <View style={{ padding: 20 }}>
                            <View style={styles.searchCard}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111' }}>Summary</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text style={{ color: '#6b7280' }}>Route:</Text>
                                    <Text style={{ fontWeight: 'bold' }}>{selectedDep.departureStation} ➝ {selectedDep.arrivalStation}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text style={{ color: '#6b7280' }}>Departure:</Text>
                                    <Text style={{ fontWeight: 'bold' }}>{selectedDep.departureTime}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text style={{ color: '#6b7280' }}>Tickets:</Text>
                                    <Text style={{ fontWeight: 'bold' }}>{totalSeats}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 15 }} />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total:</Text>
                                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#e60000' }}>
                                        {selectedDep.price !== null ? `${(selectedDep.price)} PLN` : 'Brak danych'}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 30 }]} onPress={handleBookTicket} disabled={isBooking}>
                                {isBooking ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm and Book</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}