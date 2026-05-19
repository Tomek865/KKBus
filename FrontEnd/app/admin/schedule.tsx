import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch, IP_adress } from '../../utils';

export default function AdminSchedule() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Widoczność okien modalnych
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [busModalVisible, setBusModalVisible] = useState(false);
    const [routeModalVisible, setRouteModalVisible] = useState(false);

    // Dynamiczne opcje z backendu (zawsze inicjalizowane jako puste tablice)
    const [availableBuses, setAvailableBuses] = useState<any[]>([]);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

    // Kontrola dropdownów
    const [openDropdown, setOpenDropdown] = useState<'bus' | 'route' | 'driver' | null>(null);

    // Stany formularzy
    const [newEntry, setNewEntry] = useState({ busId: '', route: '', driver: '', status: 'Planned' });

    // ZAKTUALIZOWANO: Pełny obiekt nowego autobusu wymagany przez API
    const [newBus, setNewBus] = useState({
        vin: '',
        registrationNumber: '',
        brand: '',
        model: '',
        status: 'Available',
        parkingLocation: 'Baza Główna',
        seatingCapacity: '55',
        isActive: true
    });
    const [newRoute, setNewRoute] = useState({ name: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // [GET] /api/admin/fleet/
            const response = await authFetch('/api/admin/fleet/');
            const data = await response.json();
            setFleet(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Błąd pobierania floty:", e);
        } finally {
            setLoading(false);
        }
    };

    // Naprawiona i w pełni zabezpieczona funkcja ładowania opcji do formularza
    const loadFormOptions = async () => {
        try {
            // 1. Pobieranie autobusów: [GET] /api/admin/fleet/buses
            const busRes = await authFetch('/api/admin/fleet/buses');
            const busData = await busRes.json();
            setAvailableBuses(Array.isArray(busData) ? busData : []);

            // 2. Pobieranie tras: Dostosowane do Twoich struktur
            const routeRes = await authFetch('/api/admin/fleet/routes');
            const routeData = await routeRes.json();
            setAvailableRoutes(Array.isArray(routeData) ? routeData : []);

            const driverRes = await authFetch('/api/admin/fleet/drivers');
            const userData = await driverRes.json();

            if (Array.isArray(userData)) {
                setAvailableDrivers(userData);
            } else {
                setAvailableDrivers([]);
            }

            setScheduleModalVisible(true);
        } catch (e) {
            showScheduleAlert("Błąd", "Nie udało się pobrać aktualnych opcji z bazy danych.");
        }
    };

    // [POST] /api/admin/fleet/ - Zaplanowanie kursu
    const handleAddEntry = async () => {
        if (!newEntry.busId || !newEntry.route || !newEntry.driver) {
            showScheduleAlert("Błąd", "Proszę wybrać wszystkie opcje z listy.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/', {
                method: 'POST',
                body: JSON.stringify({
                    busId: parseInt(newEntry.busId),
                    route: parseInt(newEntry.route),
                    driver: parseInt(newEntry.driver),
                    status: 'Planned'
                })
            });
            const created = await response.json();

            if (response.ok) {
                setFleet(prev => [...prev, created]);
                setScheduleModalVisible(false);
                setNewEntry({ busId: '', route: '', driver: '', status: 'Planned' });
                showScheduleAlert("Sukces", "Kurs został zaplanowany.");
            } else {
                showScheduleAlert("Błąd", created.message || "Błąd zapisu.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Błąd połączenia z serwerem.");
        }
    };

    // ZAKTUALIZOWANO: [POST] /api/admin/fleet/buses - Kompleksowe dodanie autobusu do floty
    const handleAddBus = async () => {
        if (!newBus.vin || !newBus.registrationNumber || !newBus.brand || !newBus.model || !newBus.parkingLocation) {
            showScheduleAlert("Błąd", "Proszę uzupełnić wszystkie wymagane dane pojazdu.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/buses', {
                method: 'POST',
                body: JSON.stringify({
                    vin: newBus.vin.trim().toUpperCase(),
                    registrationNumber: newBus.registrationNumber.trim().toUpperCase(),
                    brand: newBus.brand.trim(),
                    model: newBus.model.trim(),
                    status: newBus.status,
                    parkingLocation: newBus.parkingLocation.trim(),
                    seatingCapacity: parseInt(newBus.seatingCapacity) || 55,
                    isActive: newBus.isActive
                })
            });
            const created = await response.json();

            if (response.ok) {
                setBusModalVisible(false);
                // Przywrócenie domyślnego, czystego stanu
                setNewBus({
                    vin: '',
                    registrationNumber: '',
                    brand: '',
                    model: '',
                    status: 'Available',
                    parkingLocation: 'Baza Główna',
                    seatingCapacity: '55',
                    isActive: true
                });
                showScheduleAlert("Sukces", `Dodano autobus o ID: ${created.id || ''}`);
            } else {
                showScheduleAlert("Błąd", created.message || "Nie udało się dodać pojazdu.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem.");
        }
    };

    // [POST] /api/admin/fleet/routes - Stworzenie nowej trasy
    const handleAddRoute = async () => {
        if (!newRoute.name) {
            showScheduleAlert("Błąd", "Wprowadź nazwę trasy.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/routes', {
                method: 'POST',
                body: JSON.stringify({ name: newRoute.name.trim() })
            });
            const created = await response.json();

            if (response.ok) {
                setRouteModalVisible(false);
                setNewRoute({ name: '' });
                showScheduleAlert("Sukces", `Utworzono trasę: ${created.name || newRoute.name}`);
            } else {
                showScheduleAlert("Błąd", created.message || "Nie udało się zapisać trasy.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem sieciowym.");
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

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4b5563' }]} onPress={() => setBusModalVisible(true)}>
                        <Ionicons name="bus-outline" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Bus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4b5563' }]} onPress={() => setRouteModalVisible(true)}>
                        <Ionicons name="git-branch-outline" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Route</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={loadFormOptions}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>Add New Entry</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 1 }]}>BUS ID / REJ</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>ROUTE</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                    <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>DRIVER</Text>
                    <Text style={{ width: 40 }}></Text>
                </View>
                {fleet.map((bus) => {
                    const isCancelled = bus.status === 'Cancelled';
                    return (
                        <View key={bus.id} style={[styles.tableRow, isCancelled && { opacity: 0.4 }]}>
                            <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>{bus.busId}</Text>
                            <Text style={[styles.cell, { flex: 2 }]}>{bus.route}</Text>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: bus.status === 'Planned' ? COLORS.greenLight : COLORS.redLight }]}>
                                    <Text style={[styles.statusText, { color: bus.status === 'Planned' ? COLORS.green : COLORS.red }]}>{bus.status}</Text>
                                </View>
                            </View>
                            <Text style={[styles.cell, { flex: 1.2, textAlign: 'center' }]}>{bus.driver}</Text>
                            <View style={{ width: 40, alignItems: 'flex-end' }}>
                                {!isCancelled && (
                                    <TouchableOpacity onPress={() => handleDeleteRoute(bus.id)} style={{ padding: 5 }}>
                                        <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* MODAL 1: NOWY KURS (Z ZABEZPIECZONYMI DROPDOWNAMI) */}
            <Modal visible={scheduleModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { overflow: 'visible', zIndex: 10 }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add New Fleet Entry</Text>

                        {/* Dropdown: Autobus */}
                        <Text style={styles.inputLabel}>CHOOSE VEHICLE</Text>
                        <TouchableOpacity style={localStyles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'bus' ? null : 'bus')}>
                            <Text style={{ color: newEntry.busId ? '#111' : '#9ca3af' }}>
                                {availableBuses.find(b => b.id?.toString() === newEntry.busId)?.registrationNumber || "Select active bus..."}
                            </Text>
                            <Ionicons name={openDropdown === 'bus' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'bus' && (
                            <View style={localStyles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                    {availableBuses.map((bus) => (
                                        <TouchableOpacity key={bus.id} style={localStyles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, busId: bus.id?.toString() || '' }); setOpenDropdown(null); }}>
                                            <Text>{bus.registrationNumber || "No registration"} ({bus.seatingCapacity || 0} seats)</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Dropdown: Trasa */}
                        <Text style={[styles.inputLabel, { marginTop: 15 }]}>CHOOSE ROUTE</Text>
                        <TouchableOpacity style={localStyles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'route' ? null : 'route')}>
                            <Text style={{ color: newEntry.route ? '#111' : '#9ca3af' }}>
                                {availableRoutes.find(r => r.id?.toString() === newEntry.route)?.name || "Select route..."}
                            </Text>
                            <Ionicons name={openDropdown === 'route' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'route' && (
                            <View style={localStyles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                    {availableRoutes.map((route) => (
                                        <TouchableOpacity key={route.id} style={localStyles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, route: route.id?.toString() || '' }); setOpenDropdown(null); }}>
                                            <Text>{route.name || "Unnamed route"}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Dropdown: Kierowca */}
                        <Text style={[styles.inputLabel, { marginTop: 15 }]}>ASSIGN DRIVER</Text>
                        <TouchableOpacity style={localStyles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'driver' ? null : 'driver')}>
                            <Text style={{ color: newEntry.driver ? '#111' : '#9ca3af' }}>
                                {availableDrivers.find(d => d.id?.toString() === newEntry.driver)?.name || "Select employee..."}
                            </Text>
                            <Ionicons name={openDropdown === 'driver' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'driver' && (
                            <View style={localStyles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                    {availableDrivers.map((driver) => (
                                        <TouchableOpacity key={driver.id} style={localStyles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, driver: driver.id?.toString() || '' }); setOpenDropdown(null); }}>
                                            <Text>{driver.name || "No name"} ({driver.id})</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 25 }}>
                            <TouchableOpacity onPress={() => { setScheduleModalVisible(false); setOpenDropdown(null); }}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleAddEntry}><Text style={styles.primaryBtnText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ZAKTUALIZOWANO: MODAL 2 DLA NOWEGO AUTOBUSU (KOMPAKTOWY, DWUKOLUMNOWY, WSZYSTKIE 8 ATRYBUTÓW) */}
            <Modal visible={busModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 500, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20 }]}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Add New Bus to Fleet</Text>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.compactLabel}>VIN NUMBER</Text>
                                <TextInput style={localStyles.compactInput} placeholder="e.g. WBA000000..." value={newBus.vin} onChangeText={(text) => setNewBus({ ...newBus, vin: text })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.compactLabel}>REGISTRATION NUMBER</Text>
                                <TextInput style={localStyles.compactInput} placeholder="e.g. KR 12345" value={newBus.registrationNumber} onChangeText={(text) => setNewBus({ ...newBus, registrationNumber: text })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.compactLabel}>BRAND</Text>
                                <TextInput style={localStyles.compactInput} placeholder="e.g. Mercedes" value={newBus.brand} onChangeText={(text) => setNewBus({ ...newBus, brand: text })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.compactLabel}>MODEL</Text>
                                <TextInput style={localStyles.compactInput} placeholder="e.g. Tourismo" value={newBus.model} onChangeText={(text) => setNewBus({ ...newBus, model: text })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.compactLabel}>PARKING LOCATION</Text>
                                <TextInput style={localStyles.compactInput} placeholder="e.g. Baza Główna" value={newBus.parkingLocation} onChangeText={(text) => setNewBus({ ...newBus, parkingLocation: text })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.compactLabel}>SEATING CAPACITY</Text>
                                <TextInput style={localStyles.compactInput} keyboardType="number-pad" placeholder="55" value={newBus.seatingCapacity} onChangeText={(text) => setNewBus({ ...newBus, seatingCapacity: text })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15 }}>
                            <TouchableOpacity onPress={() => setBusModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10, fontSize: 14 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20, height: 40 }]} onPress={handleAddBus}><Text style={styles.primaryBtnText}>Add Bus</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL 3: STWORZENIE TRASY */}
            <Modal visible={routeModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Create New Route</Text>

                        <Text style={styles.inputLabel}>ROUTE LINE NAME</Text>
                        <TextInput style={styles.input} placeholder="e.g. Kraków - Zakopane" value={newRoute.name} onChangeText={(text) => setNewRoute({ name: text })} />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setRouteModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleAddRoute}><Text style={styles.primaryBtnText}>Create Route</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
        marginTop: 5
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginTop: 4,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
        position: 'absolute',
        left: 30,
        right: 30,
        top: 'auto',
        zIndex: 999,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },

    compactLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#9ca3af',
        marginBottom: 4,
        letterSpacing: 0.5
    },
    compactInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#f3f4f6',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        fontSize: 13,
        color: '#111'
    }
});