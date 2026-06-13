import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { authFetch } from '../../utils';

export default function DriverFleet() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchFleet = async () => {
                try {
                    const response = await authFetch('/api/driver/trips/fleet');
                    const data = await response.json();
                    setFleet(data);
                } catch (error) {
                    console.error("Błąd pobierania floty", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchFleet();
        }, [])
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Flota KKBus</Text>
            {loading ? <ActivityIndicator size="large" color="#e60000" /> : fleet.map((vehicle) => (
                <View key={vehicle.vehicle_id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="bus" size={28} color="#111827" />
                        <View style={{ marginLeft: 15, flex: 1 }}>
                            <Text style={styles.title}>{vehicle.brand} {vehicle.model}</Text>
                            <Text style={styles.regNumber}>{vehicle.registration_number}</Text>
                        </View>
                        <View style={[styles.statusBadge, vehicle.status === 'Available' ? styles.statusAv : styles.statusNa]}>
                            <Text style={styles.statusText}>{vehicle.status}</Text>
                        </View>
                    </View>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailText}>Parkowanie: {vehicle.parking_location}</Text>
                        <Text style={styles.detailText}>Miejsca: {vehicle.seating_capacity}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flexGrow: 1, backgroundColor: '#f8f9fa' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    regNumber: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusAv: { backgroundColor: '#dcfce7' },
    statusNa: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
    detailText: { fontSize: 14, color: '#4b5563', fontWeight: '500' }
});