import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- MOCK DATA ---
const initialStops = [
    { id: 1, name: 'Krakow MDA', time: '15:00', status: 'done' }, // done, active, future
    { id: 2, name: 'Chrzanow', time: '15:25', status: 'active' },
    { id: 3, name: 'Jaworzno', time: '15:50', status: 'future' }
];

const initialPassengers = [
    { id: '1', seat: '12A', name: 'Jan Kowalski', ticket: 'JS-12A', type: 'STUDENT', status: 'boarded' },
    { id: '2', seat: '14B', name: 'Anna Nowak', ticket: 'AN-14B', type: 'ADULT', status: 'pending' },
    { id: '3', seat: '15C', name: 'Piotr Wiśniewski', ticket: 'PW-15C', type: 'REDUCED', status: 'pending' },
];

export default function DriverDashboard() {
    // --- STANY (STATE) ---
    const [stops, setStops] = useState(initialStops);
    const [passengers, setPassengers] = useState(initialPassengers);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

    // Stany UI do skanera
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // --- LOGIKA BACKENDU I AKCJI ---

    // 1. Zaznaczenie przybycia na przystanek
    const handleArriveAtStop = async () => {
        // Symulacja wysłania GPS/Statusu do bazy danych
        console.log("API CALL: Zaktualizowano pozycję autobusu na backendzie.");

        setStops(prevStops => {
            let foundActive = false;
            return prevStops.map(stop => {
                if (stop.status === 'active') {
                    foundActive = true;
                    return { ...stop, status: 'done' }; // Zmień obecny na wykonany
                }
                if (foundActive && stop.status === 'future') {
                    foundActive = false;
                    return { ...stop, status: 'active' }; // Zmień następny na aktywny
                }
                return stop;
            });
        });
    };

    // 2. Ręczna weryfikacja pasażera (Przycisk MANUAL)
    const handleManualValidation = async (passengerId: string) => {
        // TUTAJ BACKEND: np. await fetch(`/api/tickets/${ticketId}/validate`, { method: 'POST' })
        console.log(`API CALL: Bilet pasażera ${passengerId} zwalidowany ręcznie.`);

        setPassengers(prev => prev.map(p =>
            p.id === passengerId ? { ...p, status: 'boarded' } : p
        ));
    };

    // 3. Symulacja Skanera QR
    const simulateQRScan = () => {
        setIsScanning(true);
        // Symulujemy czas odczytu z kamery i zapytanie do serwera (1.5s)
        setTimeout(() => {
            setIsScanning(false);
            setIsScannerOpen(false);

            // Znajdź pierwszego oczekującego i "zeskanuj" go
            const pendingPassenger = passengers.find(p => p.status === 'pending');
            if (pendingPassenger) {
                handleManualValidation(pendingPassenger.id);
                alert(`Zeskanowano bilet: ${pendingPassenger.name}`);
            } else {
                alert("Wszyscy pasażerowie są już na pokładzie!");
            }
        }, 1500);
    };

    // --- FILTROWANIE DANYCH ---
    const pendingCount = passengers.filter(p => p.status === 'pending').length;
    const displayedPassengers = activeTab === 'all'
        ? passengers
        : passengers.filter(p => p.status === 'pending');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Nagłówek */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Driver Dashboard</Text>
                    <Text style={styles.headerSub}>BUS #402 • KRAKOW - KATOWICE</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} /><Text style={styles.statusText}>ON ROUTE</Text>
                </View>
            </View>

            <View style={styles.contentColumn}>
                {/* SKANER */}
                <TouchableOpacity style={styles.scanBtn} onPress={() => setIsScannerOpen(true)}>
                    <Ionicons name="qr-code-outline" size={40} color="#fff" style={{ marginRight: 15 }} />
                    <View>
                        <Text style={styles.scanBtnTitle}>SCAN TICKET</Text>
                        <Text style={styles.scanBtnSub}>CAMERA AUTOMATICALLY OPENS</Text>
                    </View>
                </TouchableOpacity>

                {/* PRZYSTANKI */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Route Progress</Text>

                    {stops.map((stop, index) => (
                        <View key={stop.id} style={styles.stopItem}>
                            {stop.status === 'done' && (
                                <Ionicons name="checkmark-circle" size={28} color="#111" style={styles.stopIcon} />
                            )}
                            {stop.status === 'active' && (
                                <View style={styles.activeStopDot}><Text style={styles.activeStopNumber}>{index + 1}</Text></View>
                            )}
                            {stop.status === 'future' && (
                                <View style={styles.futureStopDot}><Text style={styles.futureStopNumber}>{index + 1}</Text></View>
                            )}

                            <View>
                                <Text style={[
                                    stop.status === 'done' && styles.stopNameDone,
                                    stop.status === 'active' && styles.stopNameActive,
                                    stop.status === 'future' && styles.stopNameFuture,
                                ]}>{stop.name}</Text>
                                <Text style={stop.status === 'active' ? styles.stopTimeActive : styles.stopTime}>
                                    {stop.time} {stop.status === 'active' && '• NEXT STOP'}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.arriveBtn} onPress={handleArriveAtStop}>
                        <Text style={styles.arriveBtnText}>ARRIVE AT STOP</Text>
                    </TouchableOpacity>
                </View>

                {/* PASAŻEROWIE */}
                <View style={styles.card}>
                    <View style={styles.boardingHeader}>
                        <Text style={styles.sectionTitle}>Boarding List</Text>
                        <View style={styles.tabs}>
                            <TouchableOpacity onPress={() => setActiveTab('all')}>
                                <Text style={[styles.tab, activeTab === 'all' && styles.tabActive]}>All ({passengers.length})</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('pending')}>
                                <Text style={[styles.tab, activeTab === 'pending' && styles.tabActive]}>Pending ({pendingCount})</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.passengerList}>
                        {displayedPassengers.length === 0 && (
                            <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>All passengers boarded!</Text>
                        )}
                        {displayedPassengers.map(p => (
                            <View key={p.id} style={[styles.passengerRow, p.status === 'pending' && styles.passengerRowPending]}>
                                <View style={[styles.seatBadge, p.status === 'pending' && { backgroundColor: '#fee2e2' }]}>
                                    <Text style={[styles.seatText, p.status === 'pending' && { color: '#e60000' }]}>{p.seat}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.passengerName}>{p.name}</Text>
                                    <Text style={styles.passengerDetails}>TICKET {p.ticket} • {p.type}</Text>
                                </View>

                                {p.status === 'boarded' ? (
                                    <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                                ) : (
                                    <TouchableOpacity style={styles.manualBtn} onPress={() => handleManualValidation(p.id)}>
                                        <Text style={styles.manualBtnText}>MANUAL</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* MODAL KAMERY (Symulacja) */}
            <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
                <View style={styles.cameraContainer}>
                    <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsScannerOpen(false)}>
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.cameraFrame}>
                        {isScanning ? (
                            <ActivityIndicator size="large" color="#e60000" />
                        ) : (
                            <Ionicons name="scan-outline" size={150} color="#fff" />
                        )}
                    </View>
                    <Text style={styles.cameraText}>Aim camera at the QR code</Text>

                    <TouchableOpacity style={styles.simulateBtn} onPress={simulateQRScan} disabled={isScanning}>
                        <Text style={styles.simulateBtnText}>{isScanning ? "Verifying..." : "SIMULATE SCAN (TEST)"}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </ScrollView>
    );
}

// STYLING POZOSTAJE BEZ ZMIAN (dodałem tylko klasy modala kamery)
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2, flexWrap: 'wrap' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    headerSub: { fontSize: 10, color: '#888', fontWeight: 'bold', marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginTop: 5 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e60000', marginRight: 6 },
    statusText: { color: '#e60000', fontWeight: 'bold', fontSize: 10 },
    contentColumn: { flexDirection: 'column', gap: 20, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    stopIcon: { width: 40, textAlign: 'center', marginRight: 15 },
    activeStopDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e60000', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 5 },
    activeStopNumber: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    futureStopDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    futureStopNumber: { color: '#aaa', fontWeight: 'bold', fontSize: 18 },
    stopNameDone: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    stopNameActive: { fontSize: 18, fontWeight: 'bold', color: '#e60000' },
    stopNameFuture: { fontSize: 16, fontWeight: 'bold', color: '#aaa' },
    stopTime: { color: '#888', fontSize: 12 },
    stopTimeActive: { color: '#e60000', fontSize: 12, fontWeight: 'bold' },
    arriveBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    arriveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    scanBtn: { backgroundColor: '#e60000', padding: 25, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5 },
    scanBtnTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scanBtnSub: { color: '#ffb3b3', fontSize: 10, fontWeight: 'bold' },
    boardingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 },
    tabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4 },
    tab: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, fontWeight: 'bold', color: '#888' },
    tabActive: { backgroundColor: '#fff', color: '#111', borderRadius: 8, elevation: 1 },
    passengerList: { gap: 10 },
    passengerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0' },
    passengerRowPending: { backgroundColor: '#fff', borderColor: '#fee2e2' },
    seatBadge: { backgroundColor: '#e5e7eb', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    seatText: { fontWeight: 'bold', color: '#4b5563' },
    passengerName: { fontWeight: 'bold', color: '#111', fontSize: 14 },
    passengerDetails: { fontSize: 10, color: '#888', marginTop: 2 },
    manualBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    manualBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
    cameraContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    closeCameraBtn: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
    cameraFrame: { width: 250, height: 250, borderWidth: 4, borderColor: '#e60000', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    cameraText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 40 },
    simulateBtn: { backgroundColor: '#e60000', padding: 15, borderRadius: 12 },
    simulateBtnText: { color: '#fff', fontWeight: 'bold' }
});