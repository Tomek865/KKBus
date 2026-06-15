import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '../../components/passenger/SearchInput';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch } from '../../utils';
import * as SecureStore from 'expo-secure-store';
import GuestLoginModal from './GuestLoginModal';

const formatTime = (timeString?: string, searchedDate?: string) => {
    if (!timeString) return 'N/A';
    
    try {
        let isoString = timeString;
        
        if (!timeString.includes('T')) {
            const cleanTime = timeString.length === 5 ? `${timeString}:00` : timeString;
            const baseDate = searchedDate || new Date().toISOString().split('T')[0];
            isoString = `${baseDate}T${cleanTime}Z`;
        }

        const d = new Date(isoString);
        
        if (isNaN(d.getTime())) return timeString.substring(0, 5); 
        
        return d.toISOString().split('T')[1].substring(0, 5);
    } catch {
        return timeString.substring(0, 5);
    }
};

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

const generateNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
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
                        {departure.seatsLeft === 'Brak danych' || departure.seatsLeft === 'N/A' ? 'NO SEAT DATA' : `${departure.seatsLeft} SEATS LEFT`}
                    </Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                        {departure.price !== null ? `${departure.price.toFixed(2)} PLN` : 'N/A'}
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
    const [fromStation, setFromStation] = useState('Kraków');
    const [toStation, setToStation] = useState('Katowice');
    const [availableDates] = useState(generateNext7Days());
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
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [guestModalVisible, setGuestModalVisible] = useState(false);

    // Vouchers / Rewards State
    const [myRewards, setMyRewards] = useState<any[]>([]);
    const [isLoadingRewards, setIsLoadingRewards] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);

    useEffect(() => {
        const fetchStationsFromDB = async () => {
            try {
                const res = await authFetch('/api/client/reservations/stations');
                if (!res.ok) return;
                const data = await res.json();
                const stationsArray = Array.isArray(data) ? data : (data.content || data.data || data.stations || []);
                
                if (stationsArray && Array.isArray(stationsArray) && stationsArray.length > 0) {
                    setStations(stationsArray.map((s: any) => s.name ? s.name : s));
                }
            } catch (err) {
                console.error("Network or parsing error:", err);
            }
        };
        fetchStationsFromDB();
    }, []);

    const fetchMyRewards = async () => {
        setIsLoadingRewards(true);
        try {
            const res = await authFetch('/api/client/profile/user/my-rewards');
            if (res.ok) {
                const data = await res.json();
                setMyRewards(data);
            }
        } catch (err) {
            console.error("Error fetching rewards:", err);
        } finally {
            setIsLoadingRewards(false);
        }
    };

    const handleSearchRoutes = async () => {
        setIsSearching(true); 
        setHasSearched(true); 
        setDepartures([]);
        
        try {
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

            if (!res.ok) return;
            
            const data = await res.json();
            const routesArray = Array.isArray(data) ? data : (data.content || data.data || data.routes);

            if (routesArray && Array.isArray(routesArray)) {
                const mappedDepartures = routesArray.map((d: any) => ({
                    id: String(d.tripId || d.id), 
                    departureTime: formatTime(d.departureTime),
                    arrivalTime: formatTime(d.arrivalTime),
                    departureStation: fromStation,
                    arrivalStation: toStation,
                    duration: d.duration || 'N/A', 
                    seatsLeft: d.availableSeats !== undefined ? d.availableSeats : 'N/A', 
                    price: d.totalPrice !== undefined ? d.totalPrice : null 
                }));
                setDepartures(mappedDepartures);
            } 
        } catch (err) {
            console.error("Search routes error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchExactPrice = async (departure: Departure, rewardId: number | null) => {
        setIsCalculating(true);
        try {
            const payload: any = {
                trip_id: parseInt(departure.id, 10),
                from_station: departure.departureStation,
                to_station: departure.arrivalStation,
                tickets: {
                    adult: passengerCounts.adult,
                    student: passengerCounts.student,
                    reduced: passengerCounts.reduced
                }
            };
            if (rewardId) {
                payload.applied_reward_id = rewardId; 
            }

            const res = await authFetch('/api/client/reservations/calculate-price', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setCalculatedPrice(data.total_price);
            } else {
                setCalculatedPrice(departure.price); 
            }
        } catch (err) {
            setCalculatedPrice(departure.price);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleBookTicket = async () => {
        if (!selectedDep) return;
        setIsBooking(true);
        
        const payload: any = {
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

        if (selectedRewardId) {
            payload.applied_reward_id = selectedRewardId;
        }

        try {
            const res = await authFetch('/api/client/reservations/checkout', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setReservationModalVisible(false);
                setSelectedRewardId(null);
                Alert.alert("Success", "Ticket booked successfully!");
            } else {
                Alert.alert("Error", "Failed to book the ticket.");
            }
        } catch (err) {
            Alert.alert("Error", "Connection problem occurred.");
        } finally {
            setIsBooking(false);
        }
    };

    const updateCount = (type: keyof typeof passengerCounts, delta: number) => {
        setPassengerCounts(prev => {
            const newVal = prev[type] + delta;
            if (newVal < 0) return prev;
            
            const total = prev.adult + prev.student + prev.reduced + delta;
            if (total <= 0) return prev; 
            if (total > 10) return prev; 
            
            return { ...prev, [type]: newVal };
        });
    };

    const getPassengersSummary = () => {
        const parts = [];
        if (passengerCounts.adult > 0) parts.push(`${passengerCounts.adult} Standard`);
        if (passengerCounts.student > 0) parts.push(`${passengerCounts.student} Student`);
        if (passengerCounts.reduced > 0) parts.push(`${passengerCounts.reduced} Child`);
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
                        {isSearching ? <Text style={styles.loadingText}>Loading routes...</Text> : departures.map(dep => 
                        <DepartureCard 
                            key={dep.id} 
                            departure={dep}
                            onBook={async () => {
                                let token = null;
                                try {
                                    if (Platform.OS === 'web') {
                                        token = localStorage.getItem('userToken');
                                    } else {
                                        token = await SecureStore.getItemAsync('userToken');
                                    }
                                } catch (error) {
                                    console.error("Token read error", error);
                                }
                                if (!token) {
                                    setGuestModalVisible(true);
                                    return;
                                }
                                setSelectedDep(dep);
                                setSelectedRewardId(null);
                                setCalculatedPrice(dep.price);
                                setReservationModalVisible(true);
                                
                                fetchMyRewards();
                                fetchExactPrice(dep, null);
                            }}
                        />
                    )}
                    </View>
                )}
            </ScrollView>

            {/* MODAL: SELECT STATION */}
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

            {/* MODAL: SELECT DATE */}
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

            {/* MODAL: SELECT PASSENGERS */}
            <Modal visible={passengerModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Passengers</Text>
                        <TouchableOpacity onPress={() => setPassengerModalVisible(false)}><Ionicons name="close-circle" size={32} color="#aaa" /></TouchableOpacity>
                    </View>
                    <View style={styles.counterList}>
                        
                        <View style={styles.counterRow}>
                            <View>
                                <Text style={styles.counterLabel}>Standard</Text>
                                <Text style={styles.counterSub}>Regular adult ticket</Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity onPress={() => updateCount('adult', -1)} style={styles.countBtn}><Ionicons name="remove" size={20} color="#111" /></TouchableOpacity>
                                <Text style={styles.countText}>{passengerCounts.adult}</Text>
                                <TouchableOpacity onPress={() => updateCount('adult', 1)} style={styles.countBtn}><Ionicons name="add" size={20} color="#111" /></TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <View>
                                <Text style={styles.counterLabel}>Student (-30%)</Text>
                                <Text style={styles.counterSub}>Valid student ID required</Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity onPress={() => updateCount('student', -1)} style={styles.countBtn}><Ionicons name="remove" size={20} color="#111" /></TouchableOpacity>
                                <Text style={styles.countText}>{passengerCounts.student}</Text>
                                <TouchableOpacity onPress={() => updateCount('student', 1)} style={styles.countBtn}><Ionicons name="add" size={20} color="#111" /></TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <View>
                                <Text style={styles.counterLabel}>Child under 5</Text>
                                <Text style={styles.counterSub}>Travels for free (0 PLN)</Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity onPress={() => updateCount('reduced', -1)} style={styles.countBtn}><Ionicons name="remove" size={20} color="#111" /></TouchableOpacity>
                                <Text style={styles.countText}>{passengerCounts.reduced}</Text>
                                <TouchableOpacity onPress={() => updateCount('reduced', 1)} style={styles.countBtn}><Ionicons name="add" size={20} color="#111" /></TouchableOpacity>
                            </View>
                        </View>

                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setPassengerModalVisible(false)}>
                        <Text style={styles.primaryBtnText}>Confirm</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {/* MODAL: RESERVATION CONFIRMATION */}
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
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                                    <Text style={{ color: '#6b7280' }}>Departure:</Text>
                                    <Text style={{ fontWeight: 'bold' }}>{selectedDep.departureTime}</Text>
                                </View>
                                
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={{ color: '#6b7280', marginBottom: 6 }}>Tickets:</Text>
                                    {passengerCounts.adult > 0 && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontWeight: '500', color: '#374151' }}>Standard</Text>
                                            <Text style={{ fontWeight: 'bold' }}>{passengerCounts.adult}x</Text>
                                        </View>
                                    )}
                                    {passengerCounts.student > 0 && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontWeight: '500', color: '#374151' }}>Student (-30%)</Text>
                                            <Text style={{ fontWeight: 'bold' }}>{passengerCounts.student}x</Text>
                                        </View>
                                    )}
                                    {passengerCounts.reduced > 0 && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontWeight: '500', color: '#374151' }}>Child under 5 (Free)</Text>
                                            <Text style={{ fontWeight: 'bold' }}>{passengerCounts.reduced}x</Text>
                                        </View>
                                    )}
                                </View>

                                {/* VOUCHERS LIST */}
                                {isLoadingRewards ? (
                                    <ActivityIndicator color="#e60000" style={{ marginVertical: 15 }} />
                                ) : myRewards.length > 0 ? (
                                    <View style={{ marginTop: 15, marginBottom: 5 }}>
                                        <Text style={{ color: '#111', fontWeight: 'bold', marginBottom: 10 }}>Available Rewards / Vouchers:</Text>
                                        {myRewards.map((reward) => {
                                            const isSelected = selectedRewardId === reward.reward_id;
                                            return (
                                                <TouchableOpacity
                                                    key={reward.reward_id}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        padding: 10,
                                                        borderRadius: 8,
                                                        marginBottom: 8,
                                                        borderWidth: 1,
                                                        borderColor: isSelected ? '#e60000' : '#e5e7eb',
                                                        backgroundColor: isSelected ? '#fff5f5' : '#f9fafb'
                                                    }}
                                                    onPress={() => {
                                                        const newSelectedId = isSelected ? null : reward.reward_id;
                                                        setSelectedRewardId(newSelectedId);
                                                        fetchExactPrice(selectedDep, newSelectedId);
                                                    }}
                                                >
                                                    <Ionicons name={reward.icon as any} size={20} color={isSelected ? '#e60000' : '#6b7280'} style={{ marginRight: 10 }} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontWeight: 'bold', color: isSelected ? '#e60000' : '#374151' }}>
                                                            {reward.name} (x{reward.quantity})
                                                        </Text>
                                                        <Text style={{ fontSize: 12, color: '#6b7280' }}>{reward.description}</Text>
                                                    </View>
                                                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#e60000" />}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ) : null}

                                <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 15 }} />
                                
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total:</Text>
                                    {isCalculating ? (
                                        <ActivityIndicator color="#e60000" />
                                    ) : (
                                        <Text style={{ fontSize: 24, fontWeight: '900', color: calculatedPrice === 0 ? '#10b981' : '#e60000' }}>
                                            {calculatedPrice !== null ? `${calculatedPrice.toFixed(2)} PLN` : 'N/A'}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.primaryBtn, { marginTop: 30 }]} 
                                onPress={handleBookTicket} 
                                disabled={isBooking || isCalculating}
                            >
                                {isBooking ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm and Book</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
            <GuestLoginModal 
                visible={guestModalVisible} 
                onClose={() => setGuestModalVisible(false)} 
            />
        </SafeAreaView>
    );
}