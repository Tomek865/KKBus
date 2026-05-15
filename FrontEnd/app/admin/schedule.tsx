import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch, IP_adress } from '../../utils';

export default function AdminSchedule() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Zmiana na nowy endpoint (z ukośnikiem na końcu): /admin/fleet/
            const response = await authFetch('/api/admin/fleet/');
            const data = await response.json();
            setFleet(data);
        } catch (e) {
            console.error("Błąd pobierania floty:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = (id: number) => {
        Alert.alert("Cancel Course", "Are you sure you want to cancel this scheduled course Assignment?", [
            { text: "Cancel" },
            {
                text: "Confirm", style: "destructive", onPress: async () => {
                    try {
                        // Zmiana na nowy endpoint usuwania kursu: /admin/fleet/<id_kursu>
                        const response = await authFetch(`/api/admin/fleet/${id}`, {
                            method: 'DELETE'
                        });
                        const resData = await response.json();

                        if (response.ok) {
                            Alert.alert("Cancelled", resData.message || "Fleet assignment removed successfully.");
                            setFleet(prev => prev.filter(item => item.id !== id));
                        } else {
                            Alert.alert("Błąd", "Nie udało się anulować przypisania.");
                        }
                    } catch (e) {
                        Alert.alert("Błąd", "Błąd połączenia z serwerem.");
                    }
                }
            }
        ]);
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 100 }} />;

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Schedule & Fleet Management</Text>
            </View>
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 1 }]}>BUS ID / REJ</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>ROUTE</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                    <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>DRIVER</Text>
                    <Text style={{ width: 40 }}></Text>
                </View>
                {fleet.map((bus) => (
                    <View key={bus.id} style={styles.tableRow}>
                        <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>{bus.busId}</Text>
                        <Text style={[styles.cell, { flex: 2 }]}>{bus.route}</Text>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <View style={[styles.statusBadge, { backgroundColor: bus.status === 'Planned' ? COLORS.greenLight : COLORS.redLight }]}>
                                <Text style={[styles.statusText, { color: bus.status === 'Planned' ? COLORS.green : COLORS.red }]}>{bus.status}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cell, { flex: 1.2, textAlign: 'center' }]}>{bus.driver}</Text>
                        <TouchableOpacity onPress={() => handleDeleteRoute(bus.id)} style={{ width: 40, alignItems: 'flex-end', padding: 5 }}>
                            <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}