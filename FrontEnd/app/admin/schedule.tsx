import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch, IP_adress } from '../../utils';

export default function AdminSchedule() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newEntry, setNewEntry] = useState({
        busId: '',
        route: '',
        driver: '',
        status: 'Planned'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/admin/fleet/');
            const data = await response.json();
            setFleet(data);
        } catch (e) {
            console.error("Błąd pobierania floty:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async () => {
        if (!newEntry.busId || !newEntry.route || !newEntry.driver) {
            showScheduleAlert("Błąd", "Proszę uzupełnić wszystkie pola.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/', {
                method: 'POST',
                body: JSON.stringify(newEntry)
            });
            const created = await response.json();

            if (response.ok) {
                setFleet(prev => [...prev, created]);
                setModalVisible(false);
                setNewEntry({ busId: '', route: '', driver: '', status: 'Planned' });
                showScheduleAlert("Sukces", "Nowy kurs został zaplanowany.");
            } else {
                showScheduleAlert("Błąd", created.message || "Nie udało się dodać kursu.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Błąd połączenia z serwerem.");
        }
    };

    const handleDeleteRoute = (id: number) => {
        const title = "Cancel Course";
        const message = "Are you sure you want to cancel this scheduled course Assignment?";

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) runCancelRouteConfirm(id);
            return;
        }

        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", style: "destructive", onPress: () => runCancelRouteConfirm(id) }
        ]);
    };

    const runCancelRouteConfirm = async (id: number) => {
        try {
            const response = await authFetch(`/api/admin/fleet/${id}`, { method: 'PATCH' });
            const resData = await response.json();

            if (response.ok) {
                setFleet(prev => prev.map(item => item.id === id ? { ...item, status: 'Cancelled' } : item));
                showScheduleAlert("Cancelled", resData.message || "Fleet assignment cancelled successfully.");
            } else {
                showScheduleAlert("Błąd", resData.message || "Nie udało się anulować przypisania.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Błąd połączenia z serwerem.");
        }
    };

    const showScheduleAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            setTimeout(() => { Alert.alert(title, message); }, 100);
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 100 }} />;

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

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add New Fleet Entry</Text>
                        
                        <Text style={styles.inputLabel}>BUS ID / LICENSE PLATE</Text>
                        <TextInput style={styles.input} placeholder="" value={newEntry.busId} onChangeText={(text) => setNewEntry({...newEntry, busId: text})} />

                        <Text style={styles.inputLabel}>ROUTE</Text>
                        <TextInput style={styles.input} placeholder="" value={newEntry.route} onChangeText={(text) => setNewEntry({...newEntry, route: text})} />

                        <Text style={styles.inputLabel}>DRIVER NAME</Text>
                        <TextInput style={styles.input} placeholder="" value={newEntry.driver} onChangeText={(text) => setNewEntry({...newEntry, driver: text})} />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleAddEntry}><Text style={styles.primaryBtnText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}