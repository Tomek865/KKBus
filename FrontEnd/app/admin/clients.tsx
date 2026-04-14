import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminClients() {
    const users = [
        { name: 'Jan Kowalski', email: 'jan.k@gmail.com', role: 'Passenger', trips: 12 },
        { name: 'Marek Zawadzki', email: 'm.zawadzki@transregion.pl', role: 'Driver', trips: 450 },
        { name: 'Anna Nowak', email: 'a.nowak@yahoo.com', role: 'Passenger', trips: 3 },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Client Accounts</Text>

            <View style={styles.listCard}>
                {users.map((user, index) => (
                    <View key={index} style={styles.userRow}>
                        <View style={styles.avatar}><Text>{user.name[0]}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{user.role}</Text>
                        </View>
                        <Text style={styles.tripCount}>{user.trips} trips</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    listCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
    userRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    userName: { fontWeight: 'bold', fontSize: 16 },
    userEmail: { color: '#888', fontSize: 12 },
    roleBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 15 },
    roleText: { color: '#4338ca', fontSize: 10, fontWeight: 'bold' },
    tripCount: { color: '#888', fontSize: 12, width: 60, textAlign: 'right' }
});