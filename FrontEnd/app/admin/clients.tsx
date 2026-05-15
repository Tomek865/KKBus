import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch, IP_adress } from '../../utils';

export default function AdminClients() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = (userId: string) => {
        console.log("Delete user with ID:", userId);

        const title = "Delete User";
        const message = "Are you sure you want to permanently delete this user?";

        // --- LOGIKA DLA WEB ---
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                runDeleteConfirm(userId);
            }
            return;
        }

        // --- LOGIKA DLA MOBILE (iOS/Android) ---
        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => runDeleteConfirm(userId)
            }
        ]);
    };

    const runDeleteConfirm = async (userId: string) => {
        try {
            const response = await authFetch(`/api/admin/management/users/${userId}`, {
                method: 'DELETE'
            });
            const resData = await response.json();

            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                showAlert("Success", resData.message || "User deleted successfully.");
            } else {
                showAlert("Błąd", resData.message || "Nie udało się usunąć użytkownika.");
            }
        } catch (error) {
            showAlert("Błąd", "Nie udało się połączyć z serwerem.");
        }
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            setTimeout(() => {
                Alert.alert(title, message);
            }, 100);
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.title}>Client & Employee Accounts</Text>
            <View style={[styles.card, { padding: 0, overflow: 'hidden', marginTop: 20 }]}>

                {/* 1. Zaktualizowany nagłówek tabeli (flexy dopasowane do proporcji kolumn) */}
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
                            {/* Szczegóły Użytkownika */}
                            <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.profileAvatar}><Text style={{ fontWeight: 'bold' }}>{user.name[0]}</Text></View>
                                <View>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{user.name} <Text style={{ color: COLORS.grayText, fontSize: 11 }}>({user.id})</Text></Text>
                                    <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{user.email}</Text>
                                </View>
                            </View>

                            {/* Rola */}
                            <View style={{ flex: 1 }}>
                                <View style={[styles.statusBadge, { backgroundColor: user.role === 'Driver' ? COLORS.blueLight : '#f3f4f6' }]}>
                                    <Text style={[styles.statusText, { color: user.role === 'Driver' ? COLORS.blue : '#6b7280' }]}>{user.role}</Text>
                                </View>
                            </View>

                            {/* 2. NOWOŚĆ: Kolumna STATUS (Active/Inactive) na bazie user.isActive */}
                            <View style={{ flex: 0.8, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: user.isActive ?? true ? COLORS.greenLight : COLORS.redLight }]}>
                                    <Text style={[styles.statusText, { color: user.isActive ?? true ? COLORS.green : COLORS.red }]}>
                                        {user.isActive ?? true ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>

                            {/* Liczba przejazdów */}
                            <Text style={{ flex: 0.5, textAlign: 'center', fontSize: 14 }}>{user.trips}</Text>

                            {/* Przycisk usuwania */}
                            <View style={{ flex: 0.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 15 }}>
                                <TouchableOpacity onPress={() => handleDelete(user.id)} style={{ padding: 5 }}>
                                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}