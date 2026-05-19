import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Button, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';

export default function DriverDashboard() {
    const [stops, setStops] = useState<any[]>([]);
    const [passengers, setPassengers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    // Stany obsługi dynamicznego wyboru trasy i pojazdu z backendu
    const [tripsModalVisible, setTripsModalVisible] = useState(false);
    const [availableTrips, setAvailableTrips] = useState<any[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [selectedTripInfo, setSelectedTripInfo] = useState<any>(null); // Przechowuje pełne info o busie i trasie

    // 1. EFEKT STARTOWY: Pobieramy z backendu informacje, czy kierowca ma już aktywny kurs
    useEffect(() => {
        const checkActiveTripOnStart = async () => {
            try {
                const response = await authFetch('/api/driver/active-trip');
                if (response.ok) {
                    const activeTripData = await response.json();
                    if (activeTripData && activeTripData.id) {
                        setSelectedTripInfo(activeTripData);
                        setSelectedTripId(activeTripData.id);
                        return; // fetchData wywoła się automatycznie przez drugi useEffect
                    }
                }
            } catch (e) {
                console.error("Błąd sprawdzania aktywnej trasy na starcie:", e);
            } finally {
                setLoading(false);
            }
        };
        checkActiveTripOnStart();
    }, []);

    // 2. EFEKT ZALEŻNY: Reaguje na zmianę ID kursu i pobiera pasażerów oraz przystanki
    useEffect(() => {
        if (selectedTripId) {
            fetchData(selectedTripId);
        }
    }, [selectedTripId]);

    // Pobieranie wszystkich dostępnych tras dla zalogowanego kierowcy do modalu
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

    // Wybór trasy z modalu -> Wysyłamy informację do backendu, że kierowca rozpoczyna ten kurs
    const handleSelectTrip = async (trip: any) => {
        setLoading(true);
        try {
            // Informujemy backend o wyborze kursu (zmienia status na np. 'In Progress')
            const response = await authFetch(`/api/driver/trips/${trip.id}/start`, {
                method: 'POST'
            });

            if (response.ok) {
                const updatedTripInfo = await response.json();
                setSelectedTripInfo(updatedTripInfo || trip);
                setSelectedTripId(trip.id);
                setTripsModalVisible(false);
            } else {
                Alert.alert("Błąd", "Nie udało się aktywować trasy na serwerze.");
            }
        } catch (e) {
            setSelectedTripInfo(trip);
            setSelectedTripId(trip.id);
            setTripsModalVisible(false);
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
                id: stop.station_id,
                name: stop.name,
                time: stop.exact_address,
                status: index === 0 ? 'done' : index === 1 ? 'active' : 'future'
            })) : []);

            setPassengers(Array.isArray(passengersData) ? passengersData.map((p: any) => ({
                id: p.reservation_id.toString(),
                seat: p.seat_count > 1 ? `X${p.seat_count}` : `RES`,
                name: `${p.first_name} ${p.last_name}`,
                ticket: p.reservation_id.toString(),
                type: p.reservation_number,
                status: p.status === 'Paid' ? 'pending' : 'boarded'
            })) : []);

        } catch (e) {
            Alert.alert("Błąd", "Nie udało się pobrać danych wybranej trasy.");
        } finally {
            setLoading(false);
        }
    };

    const handleArriveAtStop = () => {
        if (selectedTripId) fetchData(selectedTripId);
    };

    const validateTicket = async (ticketData: string) => {
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
                            `BUS: ${selectedTripInfo.busBrand || ''} ${selectedTripInfo.busModel || ''} (${selectedTripInfo.registrationNumber || 'REJ'}) • TRASA: ${selectedTripInfo.routeName || ''}`
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
                        {stops.map((stop, index) => (
                            <View key={stop.id} style={styles.stopItem}>
                                {stop.status === 'done' ? (
                                    <Ionicons name="checkmark-circle" size={32} color="#10b981" style={styles.stopIcon} />
                                ) : stop.status === 'active' ? (
                                    <View style={styles.activeStopDot}><Text style={styles.activeStopNumber}>{index + 1}</Text></View>
                                ) : (
                                    <View style={styles.futureStopDot}><Text style={styles.futureStopNumber}>{index + 1}</Text></View>
                                )}
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text style={stop.status === 'done' ? styles.stopNameDone : stop.status === 'active' ? styles.stopNameActive : styles.stopNameFuture}>{stop.name}</Text>
                                    <Text style={stop.status === 'active' ? styles.stopTimeActive : styles.stopTime}>{stop.time}</Text>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.arriveBtn} onPress={handleArriveAtStop}>
                            <Text style={styles.arriveBtnText}>ARRIVE AT STOP</Text>
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
                                        <Text style={styles.passengerDetails}>{p.type}</Text>
                                    </View>
                                    {p.status === 'boarded' ? <Ionicons name="checkmark-circle" size={28} color="#10b981" /> : <TouchableOpacity style={styles.manualBtn} onPress={() => validateTicket(p.ticket)}><Text style={styles.manualBtnText}>MANUAL</Text></TouchableOpacity>}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            ) : (
                <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 40 }}>
                    <Ionicons name="map-outline" size={64} color="#d1d5db" />
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#4b5563', marginTop: 15, textAlign: 'center', lineHeight: 22 }}>
                        Brak aktywnego kursu. Kliknij przycisk „Wybierz trasę” w prawym górnym rogu, aby załadować dzisiejszy harmonogram.
                    </Text>
                </View>
            )}

            {/* MODAL SYSTEMOWY: DYNAMICZNA LISTA TRAS KIEROWCY */}
            <Modal visible={tripsModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111827' }}>Wybierz dzisiejszy kurs</Text>

                        <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                            {availableTrips.length > 0 ? (
                                availableTrips.map((trip) => (
                                    <TouchableOpacity key={trip.id} style={styles.tripItem} onPress={() => handleSelectTrip(trip)}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ fontWeight: 'bold', color: '#111827', fontSize: 14 }}>{trip.routeName}</Text>
                                            <View style={styles.busBadge}>
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                                    {trip.registrationNumber || `BUS ${trip.busNumber || '402'}`}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                            Pojazd: {trip.busBrand || ''} {trip.busModel || ''} | Odjazd: {trip.departureTime || 'Brak'}
                                        </Text>
                                    </TouchableOpacity>
                                ))
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

            {/* Skaner QR/BarCode */}
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