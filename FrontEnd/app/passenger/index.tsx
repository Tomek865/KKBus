import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '../../components/passenger/SearchInput';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch, IP_adress } from '../../utils';
import { router } from 'expo-router';

export interface Departure {
    id: string; departureTime: string; arrivalTime: string; departureStation: string;
    arrivalStation: string; duration: string; seatsLeft: number; price: number;
}

const generateNext14Days = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() + i); dates.push(d);
    }
    return dates;
};

const DepartureCard = ({ departure, onBook }: { departure: Departure, onBook: () => void }) => {
    const isLowSeats = departure.seatsLeft <= 5;
    return (
        <View style={styles.departureCard}>
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
                        {departure.seatsLeft} SEATS LEFT
                    </Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>{departure.price} PLN</Text>
                    <TouchableOpacity style={styles.actionIcon} onPress={onBook}>
                        <Ionicons name="cart" size={18} color="#e60000" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
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
    
    // Stany Modali
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
                // Używamy authFetch dla spójności nagłówków i bazowego URL
                const res = await authFetch('/api/client/reservations/stations');
                
                if (!res.ok) {
                    console.error("Błąd HTTP przy pobieraniu stacji:", res.status);
                    return;
                }

                const data = await res.json();
                
                // Zabezpieczenie: sprawdzamy czy backend na pewno zwrócił tablicę
                if (Array.isArray(data)) {
                    setStations(data.map((s: any) => s.name));
                } else {
                    console.error("Nieoczekiwany format danych stacji:", data);
                }
            } catch (err) {
                console.error("Błąd pobierania stacji (sieć/CORS):", err);
            }
        };
        fetchStationsFromDB();
    }, []);

    const handleSearchRoutes = async () => {
        setIsSearching(true); 
        setHasSearched(true); 
        setDepartures([]);
        
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            // Tu również przechodzimy na authFetch
            const res = await authFetch(`/api/client/reservations/routes?from=${fromStation}&to=${toStation}&date=${dateStr}`);
            
            if (!res.ok) {
                console.error("Błąd HTTP przy pobieraniu tras:", res.status);
                return;
            }

            const data = await res.json();
            
            if (Array.isArray(data)) {
                const mappedDepartures = data.map((d: any) => ({
                    id: String(d.trip_id),
                    departureTime: d.departure_time,
                    arrivalTime: d.arrival_time,
                    departureStation: fromStation,
                    arrivalStation: toStation,
                    duration: 'N/A', 
                    seatsLeft: d.seating_capacity, 
                    price: 24 
                }));
                setDepartures(mappedDepartures);
            } else {
                console.error("Nieoczekiwany format danych tras:", data);
            }
        } catch (err) {
            console.error("Błąd wyszukiwania tras:", err);
        } finally {
            setIsSearching(false);
        }
    };

        const handleBookTicket = async () => {
        if (!selectedDep) return;
        setIsBooking(true);
        const totalSeats = passengerCounts.adult + passengerCounts.student + passengerCounts.reduced;

        try {
            const res = await authFetch('/api/client/reservations/', {
                method: 'POST',
                body: JSON.stringify({
                    trip_id: parseInt(selectedDep.id, 10),
                    seat_count: totalSeats
                })
            });

            if (res.ok) {
                setReservationModalVisible(false);
                router.push('../user/tickets' as any);
            } else {
                const errorText = await res.text();
                console.error("Serwer zwrócił błąd:", errorText);
                Alert.alert("Error", "Failed to book the ticket. Check console.");
            }
        } catch (err) {
            console.error("Booking error:", err);
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setIsBooking(false);
        }
    };

    const openReservationModal = (departure: Departure) => {
        setSelectedDep(departure);
        setReservationModalVisible(true);
    };

    const updateCount = (type: 'adult' | 'student' | 'reduced', delta: number) => {
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

    const handleStationSelect = (station: string) => {
        if (selectingField === 'from') setFromStation(station);
        if (selectingField === 'to') setToStation(station);
        setModalVisible(false);
    };

    const swapStations = () => { const temp = fromStation; setFromStation(toStation); setToStation(temp); };
    const handleDateSelect = (date: Date) => { setSelectedDate(date); setDateModalVisible(false); };
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
                        {isSearching ? <Text style={styles.loadingText}>Loading routes...</Text> : departures.map(dep => <DepartureCard key={dep.id} departure={dep} onBook={() => openReservationModal(dep)} />)}
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
                            <TouchableOpacity style={styles.listItem} onPress={() => handleStationSelect(item)}>
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
                            <TouchableOpacity style={styles.listItem} onPress={() => handleDateSelect(item)}>
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
                        {['adult', 'student', 'reduced'].map((type) => (
                            <View style={styles.counterRow} key={type}>
                                <View>
                                    <Text style={styles.counterLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                                    <Text style={styles.counterSub}>{type === 'adult' ? 'Standard ticket' : type === 'student' ? 'Valid student ID required (-51%)' : 'Children, Seniors (-37%)'}</Text>
                                </View>
                                <View style={styles.counterControls}>
                                    <TouchableOpacity onPress={() => updateCount(type as any, -1)} style={styles.countBtn}><Ionicons name="remove" size={20} color="#111" /></TouchableOpacity>
                                    <Text style={styles.countText}>{(passengerCounts as any)[type]}</Text>
                                    <TouchableOpacity onPress={() => updateCount(type as any, 1)} style={styles.countBtn}><Ionicons name="add" size={20} color="#111" /></TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setPassengerModalVisible(false)}>
                        <Text style={styles.primaryBtnText}>Confirm</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {/* MODAL: POTWIERDZENIE REZERWACJI */}
            <Modal visible={reservationModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Confirm Reservation</Text>
                        <TouchableOpacity onPress={() => setReservationModalVisible(false)}><Ionicons name="close-circle" size={32} color="#aaa" /></TouchableOpacity>
                    </View>
                    
                    {selectedDep && (
                        <View style={{ padding: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Summary</Text>
                            <Text>Route: {selectedDep.departureStation} ➝ {selectedDep.arrivalStation}</Text>
                            <Text>Departure: {selectedDep.departureTime}</Text>
                            <Text>Tickets: {totalSeats}</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20, color: '#e60000' }}>
                                Total: {(selectedDep.price * totalSeats)} PLN
                            </Text>

                            <TouchableOpacity 
                                style={[styles.primaryBtn, { marginTop: 40 }]} 
                                onPress={handleBookTicket}
                                disabled={isBooking}
                            >
                                {isBooking ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Confirm and Book</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}