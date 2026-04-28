import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definicja typu użytkownika
interface User {
    id: string;
    name: string;
    email: string;
    role: 'Passenger' | 'Driver';
    trips: number;
}

export default function AdminClients() {
    // 1. Używamy useState dla listy użytkowników - to klucz do działania usuwania
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Pobieranie danych (symulacja) fetch
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setTimeout(() => {
                setUsers([
                    { id: '1', name: 'Jan Kowalski', email: 'jan.k@gmail.com', role: 'Passenger', trips: 12 },
                    { id: '2', name: 'Marek Zawadzki', email: 'm.zawadzki@transregion.pl', role: 'Driver', trips: 450 },
                    { id: '3', name: 'Anna Nowak', email: 'a.nowak@yahoo.com', role: 'Passenger', trips: 3 },
                ]);
                setLoading(false);
            }, 800);
        };
        fetchUsers();
    }, []);

    // 2. FUNKCJA USUWANIA - Teraz modyfikuje stan, więc wiersz zniknie z ekranu
    const handleDelete = (userId: string) => {
        Alert.alert(
            "Delete User",
            "Are you sure you want to remove this user?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // Filtrujemy tablicę: zostawiamy wszystkich, których ID jest inne niż usuwane
                        setUsers(prev => prev.filter(u => u.id !== userId));
                        console.log(`API CALL: Usunięto użytkownika ${userId}`);
                    }
                }
            ]
        );
    };

    // 3. LOGIKA EDYCJI
    const handleEdit = (user: User) => {
        setSelectedUser({ ...user });
        setEditModalVisible(true);
    };

    const saveChanges = () => {
        if (!selectedUser) return;
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
        setEditModalVisible(false);
    };

    if (loading) return <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Client Accounts</Text>

            <View style={styles.listCard}>
                {/* Nagłówki tabeli */}
                <View style={styles.listHeader}>
                    <Text style={[styles.headerText, { flex: 1.5 }]}>USER DETAILS</Text>
                    <Text style={[styles.headerText, { flex: 1 }]}>ROLE</Text>
                    <Text style={[styles.headerText, { flex: 0.5, textAlign: 'center' }]}>TRIPS</Text>
                    <Text style={[styles.headerText, { flex: 0.5, textAlign: 'right' }]}>ACTIONS</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {users.map((user) => (
                        <View key={user.id} style={styles.userRow}>
                            <View style={styles.userInfoCol}>
                                <View style={styles.avatar}><Text style={styles.avatarText}>{user.name[0]}</Text></View>
                                <View>
                                    <Text style={styles.userName}>{user.name}</Text>
                                    <Text style={styles.userEmail}>{user.email}</Text>
                                </View>
                            </View>

                            <View style={styles.roleCol}>
                                <View style={[styles.roleBadge, { backgroundColor: user.role === 'Driver' ? '#e0e7ff' : '#f3f4f6' }]}>
                                    <Text style={[styles.roleText, { color: user.role === 'Driver' ? '#4338ca' : '#6b7280' }]}>{user.role}</Text>
                                </View>
                            </View>

                            <Text style={styles.tripCount}>{user.trips}</Text>

                            <View style={styles.actionsCol}>
                                <TouchableOpacity onPress={() => handleEdit(user)} style={styles.actionBtn}>
                                    <Ionicons name="pencil-outline" size={18} color="#4b5563" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(user.id)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#e60000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* MODAL EDYCJI */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit User & Role</Text>

                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <TextInput
                            style={styles.input}
                            value={selectedUser?.name}
                            onChangeText={(t) => setSelectedUser(prev => prev ? { ...prev, name: t } : null)}
                        />

                        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                        <TextInput
                            style={styles.input}
                            value={selectedUser?.email}
                            onChangeText={(t) => setSelectedUser(prev => prev ? { ...prev, email: t } : null)}
                        />

                        <Text style={styles.inputLabel}>ROLE</Text>
                        <View style={styles.roleSelector}>
                            <TouchableOpacity
                                style={[styles.roleOption, selectedUser?.role === 'Passenger' && styles.roleOptionActive]}
                                onPress={() => setSelectedUser(prev => prev ? { ...prev, role: 'Passenger' } : null)}
                            >
                                <Text style={[styles.roleOptionText, selectedUser?.role === 'Passenger' && styles.roleOptionTextActive]}>Passenger</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleOption, selectedUser?.role === 'Driver' && styles.roleOptionActive]}
                                onPress={() => setSelectedUser(prev => prev ? { ...prev, role: 'Driver' } : null)}
                            >
                                <Text style={[styles.roleOptionText, selectedUser?.role === 'Driver' && styles.roleOptionTextActive]}>Driver</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111' },
    listCard: { backgroundColor: '#fff', borderRadius: 16, elevation: 4, overflow: 'hidden' },
    listHeader: { flexDirection: 'row', padding: 15, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderColor: '#eee' },
    headerText: { fontSize: 11, fontWeight: 'bold', color: '#888' },
    userRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#f4f4f4' },
    userInfoCol: { flex: 1.5, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontWeight: 'bold', color: '#111' },
    userName: { fontWeight: 'bold', fontSize: 14, color: '#111' },
    userEmail: { color: '#888', fontSize: 12 },
    roleCol: { flex: 1 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    roleText: { fontSize: 10, fontWeight: 'bold' },
    tripCount: { flex: 0.5, textAlign: 'center', fontSize: 14, color: '#4b5563' },
    actionsCol: { flex: 0.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    actionBtn: { padding: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, width: 400 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 5 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, marginBottom: 15 },
    roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    roleOption: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
    roleOptionActive: { backgroundColor: '#111827', borderColor: '#111827' },
    roleOptionText: { fontSize: 12, fontWeight: 'bold', color: '#888' },
    roleOptionTextActive: { color: '#fff' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
    cancelBtn: { padding: 10 },
    cancelBtnText: { color: '#888', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#e60000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontWeight: 'bold' }
});