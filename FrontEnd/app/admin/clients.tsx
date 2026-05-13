import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';

export default function AdminClients() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            // fetch - Pobieranie listy użytkowników
            setTimeout(() => {
                setUsers([
                    { id: '1', name: 'Jan Kowalski', email: 'jan.k@gmail.com', role: 'Passenger', trips: 12 },
                    { id: '2', name: 'Marek Zawadzki', email: 'm.zawadzki@transregion.pl', role: 'Driver', trips: 450 },
                ]);
                setLoading(false);
            }, 800);
        };
        fetchUsers();
    }, []);

    const handleDelete = (userId: string) => {
        Alert.alert("Delete User", "Are you sure?", [
            { text: "Cancel" },
            {
                text: "Delete", style: "destructive", onPress: () => {
                    // fetch - DELETE użytkownika
                    setUsers(prev => prev.filter(u => u.id !== userId));
                }
            }
        ]);
    };

    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.title}>Client Accounts</Text>
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>USER DETAILS</Text>
                    <Text style={[styles.headerCell, { flex: 1 }]}>ROLE</Text>
                    <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'center' }]}>TRIPS</Text>
                    <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'right' }]}>ACTIONS</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {users.map((user) => (
                        <View key={user.id} style={styles.tableRow}>
                            <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.profileAvatar}><Text style={{ fontWeight: 'bold' }}>{user.name[0]}</Text></View>
                                <View>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{user.name}</Text>
                                    <Text style={{ color: '#888', fontSize: 12 }}>{user.email}</Text>
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={[styles.statusBadge, { backgroundColor: user.role === 'Driver' ? COLORS.blueLight : '#f3f4f6' }]}>
                                    <Text style={[styles.statusText, { color: user.role === 'Driver' ? COLORS.blue : '#6b7280' }]}>{user.role}</Text>
                                </View>
                            </View>
                            <Text style={{ flex: 0.5, textAlign: 'center' }}>{user.trips}</Text>
                            <View style={{ flex: 0.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 15 }}>
                                <TouchableOpacity onPress={() => handleDelete(user.id)}><Ionicons name="trash-outline" size={18} color={COLORS.red} /></TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}