import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ProfileMenuItem = ({ icon, title, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <Ionicons name={icon} size={24} color={isDestructive ? '#e60000' : '#4b5563'} />
            <Text style={[styles.menuItemText, isDestructive && styles.destructiveText]}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
);

export default function PassengerProfile() {
    const handleLogout = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>My Profile</Text>

                {/* Karta z danymi użytkownika */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>AK</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Anna Kowalska</Text>
                        <Text style={styles.userEmail}>anna.kowalska@example.com</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Standard Passenger</Text>
                        </View>
                    </View>
                </View>

                {/* Opcje konta */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem icon="person-outline" title="Personal Information" />
                    <ProfileMenuItem icon="card-outline" title="Payment Methods" />
                    <ProfileMenuItem icon="notifications-outline" title="Notifications" />
                </View>

                {/* Ustawienia aplikacji */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem icon="language-outline" title="Language" />
                    <ProfileMenuItem icon="help-circle-outline" title="Help & Support" />
                    <ProfileMenuItem icon="document-text-outline" title="Terms of Service" />
                </View>

                {/* Wylogowanie */}
                <View style={[styles.menuContainer, { marginTop: 20 }]}>
                    <ProfileMenuItem
                        icon="log-out-outline"
                        title="Log Out"
                        isDestructive={true}
                        onPress={handleLogout}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 20 },

    // Karta Użytkownika
    profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 30 },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: '#e60000' },
    userInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#4b5563' },

    // Sekcje menu
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase' },
    menuContainer: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 10, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },

    // Pojedynczy element menu
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuItemText: { fontSize: 16, fontWeight: '600', color: '#111', marginLeft: 15 },
    destructiveText: { color: '#e60000' }
});