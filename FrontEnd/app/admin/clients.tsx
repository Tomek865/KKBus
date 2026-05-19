import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch, IP_adress } from '../../utils';

export default function AdminClients() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Formularz nowego użytkownika
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'Passenger',
        isActive: true,
        trips: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/admin/users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Błąd pobierania użytkowników:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email) {
            showAlert("Błąd", "Proszę podać imię, nazwisko oraz adres e-mail.");
            return;
        }

        try {
            // fetch - Dodawanie użytkownika z tokenem (POST)
            const response = await authFetch('/api/admin/management/users', {
                method: 'POST',
                body: JSON.stringify(newUser)
            });
            const created = await response.json();

            if (response.ok) {
                setUsers(prev => [...prev, created]);
                setModalVisible(false);
                setNewUser({ name: '', email: '', role: 'Client', isActive: true, trips: 0 });
                showAlert("Sukces", "Konto zostało pomyślnie utworzone.");
            } else {
                showAlert("Błąd", created.message || "Nie udało się utworzyć konta.");
            }
        } catch (error) {
            showAlert("Błąd", "Błąd połączenia z serwerem.");
        }
    };

    const handleDelete = (userId: string) => {
        const title = "Delete User";
        const message = "Are you sure you want to permanently delete this user?";

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) runDeleteConfirm(userId);
            return;
        }

        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => runDeleteConfirm(userId) }
        ]);
    };

    const runDeleteConfirm = async (userId: string) => {
        try {
            const response = await authFetch(`/api/admin/management/users/${userId}`, { method: 'PATCH' });
            const resData = await response.json();

            if (response.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));
                showAlert("Success", resData.message || "User deactivated successfully.");
            } else {
                showAlert("Błąd", resData.message || "Nie udało się dezaktywować użytkownika.");
            }
        } catch (error) {
            showAlert("Błąd", "Nie udało się połączyć z serwerem.");
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
                <Text style={styles.title}>Client & Employee Accounts</Text>

                {/* PRZYWRÓCONY PRZYCISK DODAWANIA UŻYTKOWNIKA */}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="person-add" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Add User</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.card, { padding: 0, overflow: 'hidden', marginTop: 20 }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>USER DETAILS (ID)</Text>
                    <Text style={[styles.headerCell, { flex: 1 }]}>ROLE</Text>
                    <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>STATUS</Text>
                    <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'center' }]}>TRIPS</Text>
                    <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'right' }]}>ACTIONS</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {users.map((user) => (
                        <View key={user.id} style={styles.tableRow}>
                            <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.profileAvatar}><Text style={{ fontWeight: 'bold' }}>{user.name[0]}</Text></View>
                                <View>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{user.name} <Text style={{ color: COLORS.grayText, fontSize: 11 }}>({user.id})</Text></Text>
                                    <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{user.email}</Text>
                                </View>
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={[styles.statusBadge, { backgroundColor: user.role === 'Driver' ? COLORS.blueLight : '#f3f4f6' }]}>
                                    <Text style={[styles.statusText, { color: user.role === 'Driver' ? COLORS.blue : '#6b7280' }]}>{user.role}</Text>
                                </View>
                            </View>

                            <View style={{ flex: 0.8, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: user.isActive ?? true ? COLORS.greenLight : COLORS.redLight }]}>
                                    <Text style={[styles.statusText, { color: user.isActive ?? true ? COLORS.green : COLORS.red }]}>
                                        {user.isActive ?? true ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={{ flex: 0.5, textAlign: 'center', fontSize: 14 }}>{user.trips}</Text>

                            <View style={{ flex: 0.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 15 }}>
                                <TouchableOpacity onPress={() => handleDelete(user.id)} style={{ padding: 5 }}>
                                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* NOWE OKNO MODALNE REJESTRACJI UŻYTKOWNIKA */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Create Account</Text>

                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <TextInput style={styles.input} placeholder="" value={newUser.name} onChangeText={(text) => setNewUser({ ...newUser, name: text })} />

                        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                        <TextInput style={styles.input} placeholder="" keyboardType="email-address" autoCapitalize="none" value={newUser.email} onChangeText={(text) => setNewUser({ ...newUser, email: text })} />

                        <Text style={styles.inputLabel}>ACCOUNT TYPE / ROLE</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                            {['Client', 'Driver', 'Admin'].map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[styles.statusBadge, { flex: 1, paddingVertical: 10, backgroundColor: newUser.role === role ? COLORS.redLight : '#f3f4f6', borderColor: newUser.role === role ? COLORS.red : 'transparent', borderWidth: 1 }]}
                                    onPress={() => setNewUser({ ...newUser, role })}
                                >
                                    <Text style={{ color: newUser.role === role ? COLORS.red : '#6b7280', fontWeight: 'bold' }}>{role}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleCreateUser}><Text style={styles.primaryBtnText}>Create</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}