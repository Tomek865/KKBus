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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stopsRes, passengersRes] = await Promise.all([
                authFetch(`/driver/stops`),
                authFetch(`/driver/passengers`)
            ]);
            setStops(await stopsRes.json());
            setPassengers(await passengersRes.json());
        } catch (e) {
            Alert.alert("Błąd", "Nie udało się pobrać danych trasy.");
        } finally {
            setLoading(false);
        }
    };

    const handleArriveAtStop = () => {
        // Usunięto authFetch zgodnie z życzeniem
        fetchData();
    };

    const validateTicket = async (ticketData: string) => {
        try {
            // Zmiana na nowy endpoint: /driver/tickets/<id_rezerwacji>/validate
            const response = await authFetch(`/driver/tickets/${ticketData}/validate`, {
                method: 'POST'
            });
            const resData = await response.json();

            if (response.ok) {
                Alert.alert("Sukces", resData.message || "Bilet został pomyślnie zweryfikowany.");
                fetchData();
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

    if (loading) return <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />;

    const displayedPassengers = activeTab === 'all' ? passengers : passengers.filter(p => p.status === 'pending');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Driver Dashboard</Text>
                    <Text style={styles.headerSub}>BUS #402 • KRAKOW - KATOWICE</Text>
                </View>
            </View>

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
                        <View>
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
                                <Text style={styles.passengerDetails}>TICKET {p.ticket} • {p.type}</Text>
                            </View>
                            {p.status === 'boarded' ? <Ionicons name="checkmark-circle" size={28} color="#10b981" /> : <TouchableOpacity style={styles.manualBtn} onPress={() => validateTicket(p.ticket)}><Text style={styles.manualBtnText}>MANUAL</Text></TouchableOpacity>}
                        </View>
                    ))}
                </View>
            </View>

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