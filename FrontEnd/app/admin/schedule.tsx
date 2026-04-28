import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BusRoute {
    id: string;
    busId: string;
    route: string;
    status: 'On Route' | 'Maintenance' | 'In Depot';
    driver: string;
}

export default function AdminSchedule() {
    // 1. GŁÓWNE STANY (Kluczowe dla działania usuwania i dodawania)
    const [fleet, setFleet] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Listy pomocnicze (w przyszłości pobierane z backendu)
    const availableDrivers = ["Marek Zawadzki", "Jan Kowalski", "Anna Nowak", "Piotr Wiśniewski"];
    const availableRoutes = ["Krakow - Katowice", "Warszawa - Krakow", "Wroclaw - Katowice", "Gdansk - Warszawa"];

    // Stany dla dropdownów
    const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
    const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);

    const [newEntry, setNewEntry] = useState({
        busId: 'BUS-' + Math.floor(100 + Math.random() * 900), // Automatyczny ID busa
        route: 'Select Route',
        status: 'In Depot' as const,
        driver: 'Select Driver'
    });

    // SYMULACJA POBIERANIA DANYCH
    useEffect(() => {
        const fetchInitialData = async () => { //fetch
            setLoading(true);
            setTimeout(() => {
                setFleet([
                    { id: '1', busId: 'BUS-402', route: 'Krakow - Katowice', status: 'On Route', driver: 'Marek Z.' },
                    { id: '2', busId: 'BUS-105', route: 'Warszawa - Krakow', status: 'Maintenance', driver: 'N/A' },
                    { id: '3', busId: 'BUS-202', route: 'Wroclaw - Katowice', status: 'In Depot', driver: 'Jan K.' },
                ]);
                setLoading(false);
            }, 800);
        };
        fetchInitialData();
    }, []);

    // 2. FUNKCJA USUWANIA (TERAZ DZIAŁA NA STANIE)
    const handleDeleteRoute = (id: string) => {
        Alert.alert("Delete Route", "Are you sure you want to remove this entry?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    // API CALL: await fetch(`/api/fleet/${id}`, { method: 'DELETE' }); fetch
                    setFleet(prev => prev.filter(item => item.id !== id));
                }
            }
        ]);
    };

    // 3. FUNKCJA DODAWANIA
    const handleAddEntry = () => {
        if (newEntry.route === 'Select Route' || newEntry.driver === 'Select Driver') {
            Alert.alert("Error", "Please select both a Route and a Driver.");
            return;
        }

        // API CALL: await fetch('/api/fleet', { method: 'POST', body: JSON.stringify(newEntry) }); fetch
        const created: BusRoute = { id: Math.random().toString(), ...newEntry };
        setFleet(prev => [...prev, created]);
        setModalVisible(false);
        setNewEntry({ busId: 'BUS-' + Math.floor(100 + Math.random() * 900), route: 'Select Route', status: 'In Depot', driver: 'Select Driver' });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'On Route': return { bg: '#d1fae5', text: '#10b981' };
            case 'Maintenance': return { bg: '#fef2f2', text: '#e60000' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 100 }} />;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Schedule & Fleet Management</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>Add New Entry</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tableCard}>
                {/* WYRÓWNANE NAGŁÓWKI */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 0.8 }]}>BUS ID</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>ROUTE</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                    <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>DRIVER</Text>
                    <Text style={[styles.headerCell, { width: 40 }]}></Text>
                </View>

                {fleet.map((bus) => {
                    const statusColors = getStatusStyle(bus.status);
                    return (
                        <View key={bus.id} style={styles.tableRow}>
                            <Text style={[styles.cell, { flex: 0.8, fontWeight: 'bold' }]}>{bus.busId}</Text>
                            <Text style={[styles.cell, { flex: 2 }]}>{bus.route}</Text>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                                    <Text style={[styles.statusText, { color: statusColors.text }]}>{bus.status}</Text>
                                </View>
                            </View>
                            <Text style={[styles.cell, { flex: 1.2, textAlign: 'center' }]}>{bus.driver}</Text>

                            {/* PRZYCISK USUWANIA */}
                            <TouchableOpacity style={{ width: 40, alignItems: 'flex-end' }} onPress={() => handleDeleteRoute(bus.id)}>
                                <Ionicons name="trash-outline" size={18} color="#e60000" />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>

            {/* MODAL Z DWOMA DROPDOWNAMI */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Assign Route & Driver</Text>

                        <Text style={styles.inputLabel}>VEHICLE</Text>
                        <View style={[styles.input, { backgroundColor: '#f3f4f6' }]}><Text>{newEntry.busId}</Text></View>

                        {/* Dropdown: WYBÓR TRASY */}
                        <Text style={styles.inputLabel}>ROUTE</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => { setIsRouteDropdownOpen(!isRouteDropdownOpen); setIsDriverDropdownOpen(false); }}>
                            <Text style={{ color: newEntry.route === 'Select Route' ? '#aaa' : '#111' }}>{newEntry.route}</Text>
                            <Ionicons name="location-outline" size={18} color="#888" />
                        </TouchableOpacity>
                        {isRouteDropdownOpen && (
                            <View style={styles.dropdownList}>
                                {availableRoutes.map((r) => (
                                    <TouchableOpacity key={r} style={styles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, route: r }); setIsRouteDropdownOpen(false); }}>
                                        <Text>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Dropdown: WYBÓR KIEROWCY */}
                        <Text style={styles.inputLabel}>DRIVER</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => { setIsDriverDropdownOpen(!isDriverDropdownOpen); setIsRouteDropdownOpen(false); }}>
                            <Text style={{ color: newEntry.driver === 'Select Driver' ? '#aaa' : '#111' }}>{newEntry.driver}</Text>
                            <Ionicons name="person-outline" size={18} color="#888" />
                        </TouchableOpacity>
                        {isDriverDropdownOpen && (
                            <View style={styles.dropdownList}>
                                {availableDrivers.map((d) => (
                                    <TouchableOpacity key={d} style={styles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, driver: d }); setIsDriverDropdownOpen(false); }}>
                                        <Text>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleAddEntry}><Text style={styles.saveBtnText}>Confirm Assignment</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    addBtn: { backgroundColor: '#e60000', flexDirection: 'row', padding: 12, borderRadius: 10, alignItems: 'center' },
    addBtnText: { color: '#fff', marginLeft: 6, fontWeight: 'bold' },
    tableCard: { backgroundColor: '#fff', borderRadius: 16, elevation: 4, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 18, borderBottomWidth: 1, borderColor: '#eee' },
    headerCell: { fontWeight: 'bold', color: '#888', fontSize: 11 },
    tableRow: { flexDirection: 'row', padding: 18, borderBottomWidth: 1, borderColor: '#f4f4f4', alignItems: 'center' },
    cell: { fontSize: 14 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, minWidth: 90, alignItems: 'center' },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 24, width: 450, elevation: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 15 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#aaa', marginBottom: 5, letterSpacing: 1 },
    dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 15, backgroundColor: '#f9fafb' },
    dropdownList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 15, maxHeight: 150, overflow: 'hidden' },
    dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 25, marginTop: 10, alignItems: 'center' },
    cancelText: { color: '#888', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#e60000', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontWeight: 'bold' }
});