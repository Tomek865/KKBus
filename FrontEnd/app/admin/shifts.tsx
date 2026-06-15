import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

export default function AdminShifts() {
    const [availabilities, setAvailabilities] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [newShift, setNewShift] = useState({ employee_id: '', date: '', start_time: '', end_time: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [availRes, shiftsRes, usersRes] = await Promise.all([
                authFetch('/api/admin/shifts/availability'),
                authFetch('/api/admin/shifts/'),
                authFetch('/api/admin/users')
            ]);

            if (availRes.ok) setAvailabilities(await availRes.json());
            if (shiftsRes.ok) setShifts(await shiftsRes.json());

            if (usersRes.ok) {
                const allUsers = await usersRes.json();
                const staff = allUsers.filter((u: any) => u.role === 'Driver' || u.role === 'Admin');
                setEmployees(staff);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignShift = async () => {
        if (!newShift.employee_id || !newShift.date || !newShift.start_time || !newShift.end_time) {
            showAlert("Błąd", "Wypełnij wszystkie pola w formularzu.");
            return;
        }

        try {
            // Usunięcie ewentualnego prefixu "E_" przypisanego do kont pracowniczych w backendzie
            const empId = newShift.employee_id.replace('E_', '');
            const response = await authFetch('/api/admin/shifts/', {
                method: 'POST',
                body: JSON.stringify({
                    employee_id: parseInt(empId),
                    date: newShift.date,
                    start_time: newShift.start_time,
                    end_time: newShift.end_time
                })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert("Sukces", "Przypisano zmianę pracownikowi.");
                setModalVisible(false);
                setNewShift({ employee_id: '', date: '', start_time: '', end_time: '' });
                fetchData();
            } else {
                showAlert("Odmowa dostępu", data.error || "Błąd zapisu.");
            }
        } catch (error) {
            showAlert("Błąd", "Wystąpił problem z połączeniem z serwerem.");
        }
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            setTimeout(() => { Alert.alert(title, message); }, 100);
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Schedules & Shifts</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="calendar" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Assign Shift</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 20, flex: 1, marginTop: 20 }}>
                <View style={[styles.card, { flex: 1, padding: 0, overflow: 'hidden' }]}>
                    <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Declared Availability (Kierowcy)</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {availabilities.length === 0 && <Text style={{ padding: 15, color: '#6b7280', fontStyle: 'italic' }}>Brak zgłoszonej dyspozycyjności.</Text>}
                        {availabilities.map(item => (
                            <View key={item.availability_id} style={[styles.tableRow, { paddingHorizontal: 15 }]}>
                                <View>
                                    <Text style={{ fontWeight: 'bold' }}>{item.first_name} {item.last_name}</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Rola: {item.role}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontWeight: 'bold' }}>{item.date}</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Godziny: {item.start_time} - {item.end_time}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={[styles.card, { flex: 1, padding: 0, overflow: 'hidden' }]}>
                    <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Assigned Work Shifts</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {shifts.length === 0 && <Text style={{ padding: 15, color: '#6b7280', fontStyle: 'italic' }}>Brak ustalonych zmian w grafiku.</Text>}
                        {shifts.map(item => (
                            <View key={item.shift_id} style={[styles.tableRow, { paddingHorizontal: 15 }]}>
                                <View>
                                    <Text style={{ fontWeight: 'bold' }}>{item.first_name} {item.last_name}</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Rola: {item.role}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontWeight: 'bold', color: COLORS.green }}>{item.date}</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.start_time} - {item.end_time}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* MODAL DO ZAPISYWANIA ZMIANY */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { overflow: 'visible' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Assign New Shift</Text>

                        <Text style={styles.inputLabel}>SELECT EMPLOYEE</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenDropdown(!openDropdown)}>
                            <Text style={{ color: newShift.employee_id ? '#111' : '#9ca3af' }}>
                                {employees.find(e => e.id === newShift.employee_id)?.name || "Choose employee..."}
                            </Text>
                            <Ionicons name={openDropdown ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown && (
                            <View style={[styles.dropdownContainer, { zIndex: 100 }]}>
                                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                                    {employees.map(emp => (
                                        <TouchableOpacity key={emp.id} style={styles.dropdownItem} onPress={() => { setNewShift({ ...newShift, employee_id: emp.id }); setOpenDropdown(false); }}>
                                            <Text>{emp.name} ({emp.role})</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={{ marginTop: 15 }}>
                            <Text style={styles.inputLabel}>SHIFT DATE</Text>
                            <input type="date" style={styles.nativeDateInput as any} value={newShift.date} onChange={(e) => setNewShift({ ...newShift, date: e.target.value })} />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>START TIME</Text>
                                <input type="time" style={styles.nativeDateInput as any} value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>END TIME</Text>
                                <input type="time" style={styles.nativeDateInput as any} value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 25 }}>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setOpenDropdown(false); }}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleAssignShift}><Text style={styles.primaryBtnText}>Assign Shift</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}