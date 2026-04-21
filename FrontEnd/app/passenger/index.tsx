import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '../../components/passenger/SearchInput';

// --- TYPES ---
export interface Departure {
    id: string;
    departureTime: string;
    arrivalTime: string;
    departureStation: string;
    arrivalStation: string;
    duration: string;
    seatsLeft: number;
    price: number;
}

// --- MOCK DATA ---
const MOCK_DEPARTURES: Departure[] = [
    {
        id: '1',
        departureTime: '08:15',
        arrivalTime: '09:40',
        departureStation: 'Krakow MDA',
        arrivalStation: 'Katowice Dworzec',
        duration: '1H 25M',
        seatsLeft: 12,
        price: 24,
    },
    {
        id: '2',
        departureTime: '09:30',
        arrivalTime: '10:55',
        departureStation: 'Krakow MDA',
        arrivalStation: 'Katowice Dworzec',
        duration: '1H 25M',
        seatsLeft: 4,
        price: 24,
    }
];


// Helper function to generate the next 14 days
const generateNext14Days = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
};

// --- COMPONENTS ---
const DepartureCard = ({ departure }: { departure: Departure }) => {
    const isLowSeats = departure.seatsLeft <= 5;

    return (
        <View style={styles.departureCard}>
            {/* Top Row: Times & Line */}
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

            {/* Bottom Row: Status & Price */}
            <View style={styles.departureFooter}>
                <View style={[styles.seatsBadge, isLowSeats ? styles.seatsBadgeOrange : styles.seatsBadgeGreen]}>
                    <Text style={[styles.seatsText, isLowSeats ? styles.seatsTextOrange : styles.seatsTextGreen]}>
                        {departure.seatsLeft} SEATS LEFT
                    </Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>{departure.price} PLN</Text>
                    <TouchableOpacity style={styles.actionIcon}>
                        <Ionicons name="swap-horizontal" size={18} color="#e60000" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function PassengerSearch() {
    // --- STATES ---
    const [stations, setStations] = useState<string[]>([]);
    const [fromStation, setFromStation] = useState('Krakow');
    const [toStation, setToStation] = useState('Katowice');

    const [availableDates] = useState(generateNext14Days());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Passenger counts object
    const [passengerCounts, setPassengerCounts] = useState({
        adult: 1,
        student: 0,
        reduced: 0
    });

    // --- DEPARTURES STATES ---
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // --- SEARCH LOGIC ---
    const handleSearchRoutes = () => {
        setIsSearching(true);
        setHasSearched(true);
        setDepartures([]); // Czyścimy poprzednie wyniki
        
        // Symulacja opóźnienia sieciowego (pobieranie z backendu)
        setTimeout(() => {
            setDepartures(MOCK_DEPARTURES);
            setIsSearching(false);
        }, 1200); // 1.2s opóźnienia
    };

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);
    const [passengerModalVisible, setPassengerModalVisible] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);

    // --- MOCK BACKEND ---
    useEffect(() => {
        const fetchStationsFromDB = async () => {
            setTimeout(() => {
                setStations(['Krakow', 'Katowice', 'Warszawa', 'Wroclaw', 'Gdansk', 'Zakopane']);
            }, 500);
        };
        fetchStationsFromDB();
    }, []);

    // --- PASSENGER FUNCTIONS ---
    const updateCount = (type: 'adult' | 'student' | 'reduced', delta: number) => {
        setPassengerCounts(prev => {
            const newVal = prev[type] + delta;
            // Prevent negative values and ensure at least 1 passenger total
            if (newVal < 0) return prev;
            if (type === 'adult' && newVal === 0 && prev.student === 0 && prev.reduced === 0) return prev;

            // Overall limit of 10 passengers
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

    // --- OTHER FUNCTIONS ---
    const handleStationSelect = (station: string) => {
        if (selectingField === 'from') setFromStation(station);
        if (selectingField === 'to') setToStation(station);
        setModalVisible(false);
    };

    const swapStations = () => {
        const temp = fromStation;
        setFromStation(toStation);
        setToStation(temp);
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setDateModalVisible(false);
    };

    const formattedDate = selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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

                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchRoutes}>
                        <Text style={styles.searchButtonText}>
                        {isSearching ? 'Searching...' : 'Search Routes'}
                         </Text>
                    </TouchableOpacity>
                </View>
                
                {hasSearched && (
                    <View style={styles.resultsSection}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>Available Departures</Text>
                            <View style={styles.optionsBadge}>
                                <Text style={styles.optionsText}>{departures.length} options</Text>
                            </View>
                        </View>

                        {isSearching ? (
                            <Text style={styles.loadingText}>Loading routes...</Text>
                        ) : (
                            departures.map(dep => (
                                <DepartureCard key={dep.id} departure={dep} />
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* --- DATE MODAL --- */}
            <Modal visible={dateModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                            <Ionicons name="close-circle" size={32} color="#aaa" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={availableDates}
                        keyExtractor={(item) => item.toISOString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity style={styles.listItem} onPress={() => handleDateSelect(item)}>
                                <View style={[styles.iconBg, { backgroundColor: index === 0 ? '#e60000' : '#f3f4f6' }]}>
                                    <Ionicons name="calendar" size={16} color={index === 0 ? '#fff' : '#888'} />
                                </View>
                                <Text style={styles.listItemText}>
                                    {index === 0 ? 'Today, ' : index === 1 ? 'Tomorrow, ' : ''}
                                    {item.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}
                                </Text>
                                {selectedDate.toDateString() === item.toDateString() && (
                                    <Ionicons name="checkmark" size={24} color="#10b981" style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>

            {/* --- PASSENGER MODAL (COUNTERS) --- */}
            <Modal visible={passengerModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Passengers</Text>
                        <TouchableOpacity onPress={() => setPassengerModalVisible(false)}>
                            <Ionicons name="close-circle" size={32} color="#aaa" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.counterList}>
                        {/* ADULTS */}
                        <View style={styles.counterRow}>
                            <View>
                                <Text style={styles.counterLabel}>Adult</Text>
                                <Text style={styles.counterSub}>Standard ticket</Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity onPress={() => updateCount('adult', -1)} style={styles.countBtn}>
                                    <Ionicons name="remove" size={20} color="#111" />
                                </TouchableOpacity>
                                <Text style={styles.countText}>{passengerCounts.adult}</Text>
                                <TouchableOpacity onPress={() => updateCount('adult', 1)} style={styles.countBtn}>
                                    <Ionicons name="add" size={20} color="#111" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* STUDENTS */}
                        <View style={styles.counterRow}>
                            <View>
                                <Text style={styles.counterLabel}>Student</Text>
                                <Text style={styles.counterSub}>Valid student ID required (-51%)</Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity onPress={() => updateCount('student', -1)} style={styles.countBtn}>
                                    <Ionicons name="remove" size={20} color="#111" />
                                </TouchableOpacity>
                                <Text style={styles.countText}>{passengerCounts.student}</Text>
                                <TouchableOpacity onPress={() => updateCount('student', 1)} style={styles.countBtn}>
                                    <Ionicons name="add" size={20} color="#111" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* REDUCED */}
                        <View style={styles.counterRow}>
                            <View>
                                <Text style={styles.counterLabel}>Reduced</Text>
                                <Text style={styles.counterSub}>Children, Seniors (-37%)</Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity onPress={() => updateCount('reduced', -1)} style={styles.countBtn}>
                                    <Ionicons name="remove" size={20} color="#111" />
                                </TouchableOpacity>
                                <Text style={styles.countText}>{passengerCounts.reduced}</Text>
                                <TouchableOpacity onPress={() => updateCount('reduced', 1)} style={styles.countBtn}>
                                    <Ionicons name="add" size={20} color="#111" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => setPassengerModalVisible(false)}
                    >
                        <Text style={styles.doneButtonText}>Confirm</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {/* --- STATION MODAL --- */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Station</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close-circle" size={32} color="#aaa" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={stations}
                        keyExtractor={(item) => item}
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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    logo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    logoRed: { color: '#e60000' },
    searchCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 4 },
    row: { flexDirection: 'row' },
    swapIconContainer: { alignItems: 'center', marginVertical: -10, zIndex: 1, backgroundColor: '#fff', width: 30, height: 30, borderRadius: 15, alignSelf: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
    searchButton: { backgroundColor: '#e60000', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 10 },
    searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    // Shared Modal Styles
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f9f9f9' },
    listItemText: { fontSize: 16, marginLeft: 15, color: '#111', fontWeight: '500' },
    iconBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    loadingText: { textAlign: 'center', marginTop: 20, color: '#888' },

    // Counter Styles
    counterList: { padding: 20 },
    counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderColor: '#f4f4f4' },
    counterLabel: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    counterSub: { fontSize: 12, color: '#888' },
    counterControls: { flexDirection: 'row', alignItems: 'center' },
    countBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    countText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
    doneButton: { backgroundColor: '#e60000', margin: 20, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 'auto' },
    doneButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // --- DEPARTURES STYLES ---
    resultsSection: { marginTop: 30, paddingBottom: 40 },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
    resultsTitle: { fontSize: 22, fontWeight: '900', color: '#111' },
    optionsBadge: { backgroundColor: '#eef0f3', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
    optionsText: { fontSize: 14, color: '#555', fontWeight: '600' },
    
    // Departure Card Styles
    departureCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    routeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    timeBlock: { flex: 1 },
    timeText: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 4 },
    stationText: { fontSize: 13, color: '#888', fontWeight: '500' },
    
    // Duration Line
    durationBlock: { flex: 1.5, alignItems: 'center', marginHorizontal: 10 },
    durationText: { fontSize: 11, color: '#aaa', fontWeight: 'bold', marginBottom: 5, letterSpacing: 0.5 },
    durationLineWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    durationDotGray: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc' },
    durationLine: { flex: 1, height: 2, backgroundColor: '#eee' },
    durationDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e60000' },
    
    // Footer (Seats & Price)
    departureFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#f8f8f8', paddingTop: 15 },
    seatsBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    seatsBadgeGreen: { backgroundColor: '#e6f7ec' },
    seatsBadgeOrange: { backgroundColor: '#fdf0d5' },
    seatsText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    seatsTextGreen: { color: '#10b981' },
    seatsTextOrange: { color: '#f59e0b' },
    
    priceContainer: { flexDirection: 'row', alignItems: 'center' },
    priceText: { fontSize: 20, fontWeight: '900', color: '#e60000', marginRight: 15 },
    actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fcecec', justifyContent: 'center', alignItems: 'center' }
});