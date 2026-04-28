import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// IMPORTUJEMY KAMERĘ
import { CameraView, useCameraPermissions } from 'expo-camera';

// --- MOCK DATA ---
const initialStops = [
    { id: 1, name: 'Krakow MDA', time: '15:00', status: 'done' },
    { id: 2, name: 'Chrzanow', time: '15:25', status: 'active' }, //fetch
    { id: 3, name: 'Jaworzno', time: '15:50', status: 'future' }
];

const initialPassengers = [
    { id: '1', seat: '12A', name: 'Jan Kowalski', ticket: 'JS-12A', type: 'STUDENT', status: 'boarded' },
    { id: '2', seat: '14B', name: 'Anna Nowak', ticket: 'AN-14B', type: 'ADULT', status: 'pending' }, //fetch
    { id: '3', seat: '15C', name: 'Piotr Wiśniewski', ticket: 'PW-15C', type: 'REDUCED', status: 'pending' },
];

export default function DriverDashboard() {
    const [stops, setStops] = useState(initialStops);
    const [passengers, setPassengers] = useState(initialPassengers);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

    // Stany UI do skanera
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanned, setScanned] = useState(false);

    // --- UPRAWNIENIA KAMERY ---
    const [permission, requestPermission] = useCameraPermissions();

    // 1. Zaznaczenie przybycia na przystanek (BACKEND CALL)
    const handleArriveAtStop = async () => {
        // TUTAJ: await fetch(...) fetch
        console.log("API CALL: Zaktualizowano pozycję autobusu.");

        setStops(prevStops => {
            let foundActive = false;
            return prevStops.map(stop => {
                if (stop.status === 'active') {
                    foundActive = true;
                    return { ...stop, status: 'done' };
                }
                if (foundActive && stop.status === 'future') {
                    foundActive = false;
                    return { ...stop, status: 'active' };
                }
                return stop;
            });
        });
    };

    // 2. Walidacja biletu (BACKEND CALL)
    const validateTicket = async (ticketData: string) => {
        // ticketData to treść zakodowana w kodzie QR (np. ID biletu)
        // TUTAJ: const response = await fetch(`/api/validate?id=${ticketData}`) fetch 

        const passenger = passengers.find(p => p.ticket === ticketData || p.id === ticketData);

        if (passenger) {
            if (passenger.status === 'boarded') {
                Alert.alert("Already Boarded", "This ticket has already been used.");
            } else {
                setPassengers(prev => prev.map(p =>
                    p.id === passenger.id ? { ...p, status: 'boarded' } : p
                ));
                Alert.alert("Success", `Validated: ${passenger.name}`);
            }
        } else {
            Alert.alert("Invalid Ticket", "No passenger found with this ticket ID.");
        }

        setIsScannerOpen(false);
        setScanned(false);
    };

    // Obsługa zdarzenia zeskanowania kodu
    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return; // Zapobiegamy wielokrotnemu skanowaniu w ułamku sekundy
        setScanned(true);
        validateTicket(data);
    };

    if (!permission) {
        return <View style={styles.container}><ActivityIndicator size="large" /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.cameraPermissionContainer}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" color="#e60000" />
            </View>
        );
    }

    const pendingCount = passengers.filter(p => p.status === 'pending').length;
    const displayedPassengers = activeTab === 'all' ? passengers : passengers.filter(p => p.status === 'pending');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                {/* PRZYCISK URUCHAMIAJĄCY KAMERĘ */}
                <TouchableOpacity style={styles.scanBtn} onPress={() => setIsScannerOpen(true)}>
                    <Ionicons name="qr-code-outline" size={40} color="#fff" style={{ marginRight: 15 }} />
                    <View>
                        <Text style={styles.scanBtnTitle}>SCAN TICKET</Text>
                        <Text style={styles.scanBtnSub}>OPENS DEVICE CAMERA</Text>
                    </View>
                </TouchableOpacity>

                {/* PRZYSTANKI */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Route Progress</Text>
                    {stops.map((stop, index) => (
                        <View key={stop.id} style={styles.stopItem}>
                            {stop.status === 'done' && <Ionicons name="checkmark-circle" size={28} color="#111" style={styles.stopIcon} />}
                            {stop.status === 'active' && <View style={styles.activeStopDot}><Text style={styles.activeStopNumber}>{index + 1}</Text></View>}
                            {stop.status === 'future' && <View style={styles.futureStopDot}><Text style={styles.futureStopNumber}>{index + 1}</Text></View>}
                            <View>
                                <Text style={[stop.status === 'done' && styles.stopNameDone, stop.status === 'active' && styles.stopNameActive, stop.status === 'future' && styles.stopNameFuture]}>{stop.name}</Text>
                                <Text style={stop.status === 'active' ? styles.stopTimeActive : styles.stopTime}>{stop.time} {stop.status === 'active' && '• NEXT STOP'}</Text>
                            </View>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.arriveBtn} onPress={handleArriveAtStop}>
                        <Text style={styles.arriveBtnText}>ARRIVE AT STOP</Text>
                    </TouchableOpacity>
                </View>

                {/* LISTA PASAŻERÓW */}
                <View style={styles.card}>
                    <View style={styles.boardingHeader}>
                        <Text style={styles.sectionTitle}>Boarding List</Text>
                        <View style={styles.tabs}>
                            <TouchableOpacity onPress={() => setActiveTab('all')}><Text style={[styles.tab, activeTab === 'all' && styles.tabActive]}>All ({passengers.length})</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('pending')}><Text style={[styles.tab, activeTab === 'pending' && styles.tabActive]}>Pending ({pendingCount})</Text></TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.passengerList}>
                        {displayedPassengers.map(p => (
                            <View key={p.id} style={[styles.passengerRow, p.status === 'pending' && styles.passengerRowPending]}>
                                <View style={[styles.seatBadge, p.status === 'pending' && { backgroundColor: '#fee2e2' }]}><Text style={[styles.seatText, p.status === 'pending' && { color: '#e60000' }]}>{p.seat}</Text></View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.passengerName}>{p.name}</Text>
                                    <Text style={styles.passengerDetails}>TICKET {p.ticket} • {p.type}</Text>
                                </View>
                                {p.status === 'boarded' ? <Ionicons name="checkmark-circle" size={28} color="#10b981" /> : <TouchableOpacity style={styles.manualBtn} onPress={() => validateTicket(p.ticket)}><Text style={styles.manualBtnText}>MANUAL</Text></TouchableOpacity>}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* MODAL Z PRAWDZIWĄ KAMERĄ */}
            <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                    />

                    {/* Nakładka UI na kamerę */}
                    <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsScannerOpen(false)}>
                        <Ionicons name="close-circle" size={48} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.scanTarget}>
                        <View style={[styles.corner, styles.topL]} />
                        <View style={[styles.corner, styles.topR]} />
                        <View style={[styles.corner, styles.botL]} />
                        <View style={[styles.corner, styles.botR]} />
                    </View>

                    <Text style={styles.cameraOverlayText}>Scan Passenger QR Ticket</Text>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    cameraPermissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSub: { fontSize: 10, color: '#888', fontWeight: 'bold' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e60000', marginRight: 6 },
    statusText: { color: '#e60000', fontWeight: 'bold', fontSize: 10 },
    contentColumn: { flexDirection: 'column', gap: 20, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    stopIcon: { width: 40, textAlign: 'center', marginRight: 15 },
    activeStopDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e60000', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
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
    scanBtn: { backgroundColor: '#e60000', padding: 25, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    scanBtnTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scanBtnSub: { color: '#ffb3b3', fontSize: 10, fontWeight: 'bold' },
    boardingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    tabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4 },
    tab: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, fontWeight: 'bold', color: '#888' },
    tabActive: { backgroundColor: '#fff', color: '#111', borderRadius: 8 },
    passengerList: { gap: 10 },
    passengerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12 },
    passengerRowPending: { backgroundColor: '#fff', borderColor: '#fee2e2', borderWidth: 1 },
    seatBadge: { backgroundColor: '#e5e7eb', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    seatText: { fontWeight: 'bold', color: '#4b5563' },
    passengerName: { fontWeight: 'bold', color: '#111', fontSize: 14 },
    passengerDetails: { fontSize: 10, color: '#888' },
    manualBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    manualBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },

    // STYLE KAMERY
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    closeCameraBtn: { position: 'absolute', top: 60, alignSelf: 'center', zIndex: 10 },
    cameraOverlayText: { position: 'absolute', bottom: 100, alignSelf: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
    scanTarget: { width: 250, height: 250, alignSelf: 'center', marginTop: '50%', position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: '#e60000', borderWidth: 4 },
    topL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    botL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    botR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 }
});