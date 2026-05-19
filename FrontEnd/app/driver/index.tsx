import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Button, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';

const getRouteName = (t: any) => t?.routeName || t?.route_name || t?.route?.name || 'Trasa nieznana';
const getBusBrand = (t: any) => t?.busBrand || t?.bus_brand || t?.bus?.brand || 'Autobus';
const getBusModel = (t: any) => t?.busModel || t?.bus_model || t?.bus?.model || '';
const getRegNum = (t: any) => t?.registrationNumber || t?.registration_number || t?.bus?.registration_number || 'Brak Rej.';
const getBusNum = (t: any) => t?.busNumber || t?.bus_number || t?.busId || t?.bus_id || t?.bus?.id || '???';
const getDeparture = (t: any) => t?.departureTime || t?.departure_time || t?.time || 'Brak danych';

export default function DriverDashboard() {
    const [stops, setStops] = useState<any[]>([]);
    const [passengers, setPassengers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const [tripsModalVisible, setTripsModalVisible] = useState(false);
    const [availableTrips, setAvailableTrips] = useState<any[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [selectedTripInfo, setSelectedTripInfo] = useState<any>(null);

    const [currentStopIndex, setCurrentStopIndex] = useState(0);

    // FUNKCJE POMOCNICZE: Zapis i odczyt postępu trasy (Indexu przystanku) z pamięci
    const saveStopIndexLocally = async (tripId: number, index: number) => {
        const key = `stopIndex_${tripId}`;
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, index.toString());
            } else {
                await SecureStore.setItemAsync(key, index.toString());
            }
        } catch (e) {
            console.error("Błąd zapisu postępu trasy:", e);
        }
    };

    const loadStopIndexLocally = async (tripId: number) => {
        const key = `stopIndex_${tripId}`;
        try {
            let saved = null;
            if (Platform.OS === 'web') {
                saved = localStorage.getItem(key);
            } else {
                saved = await SecureStore.getItemAsync(key);
            }
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            console.error("Błąd odczytu postępu trasy:", e);
            return 0;
        }
    };

    // 1. START: Ładowanie aktywnej trasy z pamięci
    useEffect(() => {
        const loadLocalActiveTrip = async () => {
            try {
                let storedTripId = null;
                let storedTripInfo = null;

                if (Platform.OS === 'web') {
                    storedTripId = localStorage.getItem('activeTripId');
                    storedTripInfo = localStorage.getItem('activeTripInfo');
                } else {
                    storedTripId = await SecureStore.getItemAsync('activeTripId');
                    storedTripInfo = await SecureStore.getItemAsync('activeTripInfo');
                }

                if (storedTripId && storedTripInfo) {
                    setSelectedTripId(Number(storedTripId));
                    setSelectedTripInfo(JSON.parse(storedTripInfo));
                }
            } catch (e) {
                console.error("Błąd ładowania lokalnej trasy na starcie:", e);
            } finally {
                setLoading(false);
            }
        };
        loadLocalActiveTrip();
    }, []);

    // 2. REAKCJA NA ZMIANĘ ID: Pobiera stacje
    useEffect(() => {
        if (selectedTripId) {
            fetchData(selectedTripId);
        }
    }, [selectedTripId]);

    const handleLoadRoutesModal = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/driver/trips/');
            const data = await response.json();
            setAvailableTrips(Array.isArray(data) ? data : []);
            setTripsModalVisible(true);
        } catch (e) {
            Alert.alert("Błąd", "Nie udało się załadować dostępnych kursów.");
        } finally {
            setLoading(false);
        }
    };

    // WYBÓR TRASY
    const handleSelectTrip = async (trip: any) => {
        const actualTripId = trip.id || trip.trip_id || trip.schedule_id;

        if (!actualTripId) {
            Alert.alert("Błąd integracji", "Obiekt kursu z backendu nie posiada atrybutu ID.");
            return;
        }

        setLoading(true);
        try {
            const response = await authFetch(`/api/driver/trips/${actualTripId}/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const resData = await response.json();
            const tripDataToSave = response.ok ? (resData || trip) : trip;

            setSelectedTripInfo(tripDataToSave);
            setSelectedTripId(actualTripId);
            setTripsModalVisible(false);

            if (Platform.OS === 'web') {
                localStorage.setItem('activeTripId', actualTripId.toString());
                localStorage.setItem('activeTripInfo', JSON.stringify(tripDataToSave));
            } else {
                await SecureStore.setItemAsync('activeTripId', actualTripId.toString());
                await SecureStore.setItemAsync('activeTripInfo', JSON.stringify(tripDataToSave));
            }

            if (!response.ok) {
                Alert.alert("Uwaga", "Załadowano trasę lokalnie, ale backend zwrócił błąd aktywacji.");
            }

        } catch (e) {
            console.error("Błąd ładowania wyboru trasy:", e);
            setSelectedTripInfo(trip);
            setSelectedTripId(actualTripId);
            setTripsModalVisible(false);

            if (Platform.OS === 'web') {
                localStorage.setItem('activeTripId', actualTripId.toString());
                localStorage.setItem('activeTripInfo', JSON.stringify(trip));
            } else {
                SecureStore.setItemAsync('activeTripId', actualTripId.toString());
                SecureStore.setItemAsync('activeTripInfo', JSON.stringify(trip));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async (tripId: number) => {
        setLoading(true);
        try {
            const [stopsRes, passengersRes] = await Promise.all([
                authFetch(`/api/driver/trips/${tripId}/stations`),
                authFetch(`/api/driver/trips/${tripId}/passengers`)
            ]);

            const stopsData = await stopsRes.json();
            const passengersData = await passengersRes.json();

            setStops(Array.isArray(stopsData) ? stopsData.map((stop: any, index: number) => ({
                id: stop.station_id || stop.id || index,
                name: stop.name || stop.station?.name || 'Przystanek',
                time: stop.exact_address || stop.station?.exact_address || '',
            })) : []);

            // Przywracanie zapisanego postępu trasy z pamięci dla danego kursu
            const savedIndex = await loadStopIndexLocally(tripId);
            setCurrentStopIndex(savedIndex);

            setPassengers(Array.isArray(passengersData) ? passengersData.map((p: any, index: number) => ({
                id: p.reservation_id?.toString() || index.toString(),
                seat: p.seat_count > 1 ? `X${p.seat_count}` : `RES`,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Nieznany Pasażer',
                ticket: p.reservation_id?.toString() || '',
                type: p.reservation_number || 'Standard',
                status: p.status === 'Paid' ? 'pending' : 'boarded'
            })) : []);

        } catch (e) {
            Alert.alert("Błąd", "Nie udało się pobrać danych dla tej trasy.");
        } finally {
            setLoading(false);
        }
    };

    // PRZEJŚCIE DO NASTĘPNEGO PRZYSTANKU I ZAPIS W PAMIĘCI
    const handleArriveAtStop = async () => {
        if (currentStopIndex < stops.length - 1) {
            const nextIndex = currentStopIndex + 1;
            setCurrentStopIndex(nextIndex);

            if (selectedTripId) {
                await saveStopIndexLocally(selectedTripId, nextIndex);
            }
        } else {
            Alert.alert("Koniec trasy", "Osiągnięto ostatni przystanek na tym kursie.");
        }
    };

    const validateTicket = async (ticketData: string) => {
        if (!ticketData) return;

        try {
            const response = await authFetch(`/api/driver/tickets/${ticketData}/validate`, {
                method: 'POST'
            });
            const resData = await response.json();

            if (response.ok) {
                Alert.alert("Sukces", resData.message || "Bilet zweryfikowany pomyślnie.");
                if (selectedTripId) fetchData(selectedTripId);
            } else {
                Alert.alert("Błąd", resData.message || "Nieprawidłowy lub wykorzystany bilet.");
            }
        } catch (e) {
            Alert.alert("Błąd", "Błąd połączenia z bazą biletów.");
        } finally {
            setIsScannerOpen(false);
            setScanned(false);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        validateTicket(data);
    };

    if (!permission?.granted) {
        return <View style={styles.container}><Button onPress={requestPermission} title="Zezwól na aparat" color="#e60000" /></View>;
    }

    const displayedPassengers = activeTab === 'all' ? passengers : passengers.filter(p => p.status === 'pending');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Driver Dashboard</Text>
                    <Text style={styles.headerSub}>
                        {selectedTripInfo ? (
                            `BUS: ${getBusBrand(selectedTripInfo)} ${getBusModel(selectedTripInfo)} (${getRegNum(selectedTripInfo)}) • TRASA: ${getRouteName(selectedTripInfo)}`
                        ) : (
                            "PROSZĘ WYBRAĆ TRASĘ PRZEJAZDU"
                        )}
                    </Text>
                </View>

                <TouchableOpacity style={styles.selectRouteHeaderBtn} onPress={handleLoadRoutesModal}>
                    <Ionicons name="bus-outline" size={16} color="#fff" />
                    <Text style={styles.selectRouteHeaderBtnText}>
                        {selectedTripId ? "Zmień trasę" : "Wybierz trasę"}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color="#e60000" style={{ marginVertical: 20 }} />}

            {selectedTripId ? (
                <View>
                    <TouchableOpacity style={styles.scanBtn} onPress={() => setIsScannerOpen(true)}>
                        <Ionicons name="qr-code-outline" size={32} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 18 }}>SKANUJ BILET</Text>
                    </TouchableOpacity>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Route Progress</Text>

                        {stops.map((stop, index) => {
                            const dynamicStatus = index < currentStopIndex ? 'done' : index === currentStopIndex ? 'active' : 'future';

                            return (
                                <View key={stop.id} style={styles.stopItem}>
                                    {dynamicStatus === 'done' ? (
                                        <Ionicons name="checkmark-circle" size={32} color="#10b981" style={styles.stopIcon} />
                                    ) : dynamicStatus === 'active' ? (
                                        <View style={styles.activeStopDot}><Text style={styles.activeStopNumber}>{index + 1}</Text></View>
                                    ) : (
                                        <View style={styles.futureStopDot}><Text style={styles.futureStopNumber}>{index + 1}</Text></View>
                                    )}
                                    <View style={{ flex: 1, marginLeft: 5 }}>
                                        <Text style={dynamicStatus === 'done' ? styles.stopNameDone : dynamicStatus === 'active' ? styles.stopNameActive : styles.stopNameFuture}>{stop.name}</Text>
                                        <Text style={dynamicStatus === 'active' ? styles.stopTimeActive : styles.stopTime}>{stop.time}</Text>
                                    </View>
                                </View>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.arriveBtn, currentStopIndex >= stops.length - 1 && { opacity: 0.5 }]}
                            onPress={handleArriveAtStop}
                            disabled={currentStopIndex >= stops.length - 1 || stops.length === 0}
                        >
                            <Text style={styles.arriveBtnText}>ARRIVE AT NEXT STOP</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.boardingHeader}>
                            <Text style={styles.sectionTitle}>Boarding List</Text>
                            <View style={styles.tabs}>
                                <TouchableOpacity onPress={() => setActiveTab('all')}><Text style={[styles.tab, activeTab === 'all' && styles.tabActive]}>All</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => setActiveTab('pending')}><Text style={[styles.tab, activeTab === 'pending' && styles.tabActive]}>Pending</Text></TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.passengerList}>
                            {displayedPassengers.map(p => (
                                <View key={p.id} style={[styles.passengerRow, p.status === 'pending' && styles.passengerRowPending]}>
                                    <View style={styles.seatBadge}><Text style={styles.seatText}>{p.seat}</Text></View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.passengerName}>{p.name}</Text>
                                        <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{p.type}</Text>
                                    </View>
                                    {p.status === 'boarded' ? <Ionicons name="checkmark-circle" size={28} color="#10b981" /> : <TouchableOpacity style={styles.manualBtn} onPress={() => validateTicket(p.ticket)}><Text style={styles.manualBtnText}>MANUAL</Text></TouchableOpacity>}
                                </View>
                            ))}
                            {displayedPassengers.length === 0 && (
                                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 10 }}>Brak pasażerów w tej kategorii.</Text>
                            )}
                        </View>
                    </View>
                </View>
            ) : (
                <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
                    <Ionicons name="map-outline" size={64} color="#d1d5db" />
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#4b5563', marginTop: 15, textAlign: 'center', lineHeight: 22 }}>
                        Brak aktywnego kursu. Kliknij przycisk „Wybierz trasę” w prawym górnym rogu, aby załadować aktualne dane z serwera.
                    </Text>
                </View>
            )}

            <Modal visible={tripsModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111827' }}>Wybierz dzisiejszy kurs</Text>

                        <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                            {availableTrips.length > 0 ? (
                                availableTrips.map((trip, index) => {
                                    const actualTripId = trip.id || trip.trip_id || trip.schedule_id;
                                    return (
                                        <TouchableOpacity key={actualTripId || index} style={styles.tripItem} onPress={() => handleSelectTrip(trip)}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{ fontWeight: 'bold', color: '#111827', fontSize: 14 }}>
                                                    {getRouteName(trip)}
                                                </Text>
                                                <View style={styles.busBadge}>
                                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                                        BUS {getBusNum(trip)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 5 }}>
                                                Pojazd: {getBusBrand(trip)} {getBusModel(trip)} | Start: {getDeparture(trip)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20, fontSize: 13 }}>
                                    Brak przypisanych Tobie kursów w bazie danych na dziś.
                                </Text>
                            )}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                            <TouchableOpacity onPress={() => setTripsModalVisible(false)}>
                                <Text style={{ color: '#4b5563', fontWeight: 'bold', padding: 10, fontSize: 14 }}>Zamknij</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={isScannerOpen} animationType="slide">
                <View style={styles.cameraContainer}>
                    <CameraView style={StyleSheet.absoluteFillObject} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} />
                    <TouchableOpacity style={{ position: 'absolute', top: 50, alignSelf: 'center' }} onPress={() => setIsScannerOpen(false)}>
                        <Ionicons name="close-circle" size={60} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </ScrollView>
    );
}