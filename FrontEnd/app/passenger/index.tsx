import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '../../components/passenger/SearchInput';
import { passengerStyles as styles } from '../src/styles/passengerStyles'; // Dopasuj ścieżkę do projektu!

export interface Departure {
    id: string; departureTime: string; arrivalTime: string; departureStation: string;
    arrivalStation: string; duration: string; seatsLeft: number; price: number;
}

const MOCK_DEPARTURES: Departure[] = [
    { id: '1', departureTime: '08:15', arrivalTime: '09:40', departureStation: 'Krakow MDA', arrivalStation: 'Katowice Dworzec', duration: '1H 25M', seatsLeft: 12, price: 24 },
    { id: '2', departureTime: '09:30', arrivalTime: '10:55', departureStation: 'Krakow MDA', arrivalStation: 'Katowice Dworzec', duration: '1H 25M', seatsLeft: 4, price: 24 }
];

const generateNext14Days = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() + i); dates.push(d);
    }
    return dates;
};

const DepartureCard = ({ departure }: { departure: Departure }) => {
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
                    <TouchableOpacity style={styles.actionIcon}>
                        <Ionicons name="swap-horizontal" size={18} color="#e60000" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function PassengerSearch() {
    const [stations, setStations] = useState<string[]>([]);
    const [fromStation, setFromStation] = useState('Krakow');
    const [toStation, setToStation] = useState('Katowice');
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

    useEffect(() => {
        const fetchStationsFromDB = async () => {
            setTimeout(() => setStations(['Krakow', 'Katowice', 'Warszawa', 'Wroclaw', 'Gdansk', 'Zakopane']), 500);
        };
        fetchStationsFromDB();
    }, []);

    const handleSearchRoutes = () => {
        setIsSearching(true); setHasSearched(true); setDepartures([]);
        setTimeout(() => { setDepartures(MOCK_DEPARTURES); setIsSearching(false); }, 1200); 
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
                        {isSearching ? <Text style={styles.loadingText}>Loading routes...</Text> : departures.map(dep => <DepartureCard key={dep.id} departure={dep} />)}
                    </View>
                )}
            </ScrollView>

            {/* Modals - reszta pozostaje logiką TSX z użyciem wspólnych styli modalContainer / modalHeader */}
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
        </SafeAreaView>
    );
}