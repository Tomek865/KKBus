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
            const response = await authFetch(`/api/admin/fleet/`);
            const data = await response.json();
            setFleet(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = (id: string) => {
        Alert.alert("Delete Route", "Are you sure?", [
            { text: "Cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        // fetch - Usuwanie trasy zgodnie z Twoim komentarzem
                        await authFetch(`/api/admin/fleet/${id}`, { method: 'DELETE' });
                        setFleet(prev => prev.filter(item => item.id !== id));
                    } catch (e) {
                        Alert.alert("Błąd", "Nie udało się usunąć trasy.");
                    }
                }
            }
        ]);
    };

    const handleAddEntry = async (newEntry: any) => {
        try {
            // fetch - Dodawanie nowej trasy
            const response = await authFetch(`/api/admin/fleet/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry)
            });
            const created = await response.json();
            setFleet(prev => [...prev, created]);
        } catch (e) {
            Alert.alert("Błąd", "Nie udało się dodać trasy.");
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 100 }} />;

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Schedule & Fleet</Text>
            </View>
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                {fleet.map((bus) => (
                    <View key={bus.id} style={styles.tableRow}>
                        <Text style={[styles.cell, { flex: 1 }]}>{bus.busId}</Text>
                        <Text style={[styles.cell, { flex: 2 }]}>{bus.route}</Text>
                        <TouchableOpacity onPress={() => handleDeleteRoute(bus.id)}>
                            <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
