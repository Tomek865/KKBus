import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';

export default function AdminSchedule() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            // fetch - Pobieranie floty z backendu
            setTimeout(() => {
                setFleet([
                    { id: '1', busId: 'BUS-402', route: 'Krakow - Katowice', status: 'On Route', driver: 'Marek Z.' },
                    { id: '2', busId: 'BUS-105', route: 'Warszawa - Krakow', status: 'Maintenance', driver: 'N/A' },
                ]);
                setLoading(false);
            }, 800);
        };
        fetchInitialData();
    }, []);

    const handleDeleteRoute = (id: string) => {
        Alert.alert("Delete Route", "Are you sure?", [
            { text: "Cancel" },
            {
                text: "Delete", style: "destructive", onPress: () => {
                    // fetch - Usuwanie trasy z backendu
                    setFleet(prev => prev.filter(item => item.id !== id));
                }
            }
        ]);
    };

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Schedule & Fleet Management</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Add New Entry</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 0.8 }]}>BUS ID</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>ROUTE</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                    <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>DRIVER</Text>
                    <Text style={{ width: 40 }}></Text>
                </View>
                {fleet.map((bus) => (
                    <View key={bus.id} style={styles.tableRow}>
                        <Text style={[styles.cell, { flex: 0.8, fontWeight: 'bold' }]}>{bus.busId}</Text>
                        <Text style={[styles.cell, { flex: 2 }]}>{bus.route}</Text>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <View style={[styles.statusBadge, { backgroundColor: bus.status === 'On Route' ? COLORS.greenLight : COLORS.redLight }]}>
                                <Text style={[styles.statusText, { color: bus.status === 'On Route' ? COLORS.green : COLORS.red }]}>{bus.status}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cell, { flex: 1.2, textAlign: 'center' }]}>{bus.driver}</Text>
                        <TouchableOpacity onPress={() => handleDeleteRoute(bus.id)} style={{ width: 40, alignItems: 'flex-end' }}>
                            <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}