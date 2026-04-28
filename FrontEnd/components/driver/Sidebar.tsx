import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

export const Sidebar = () => {
    const pathname = usePathname();

    // Pomocniczy komponent dla przycisków w menu
    const NavItem = ({ icon, label, path }: any) => {
        // Sprawdzamy, czy dany przycisk jest "aktywny"
        const isActive = pathname === path || (path === '/driver' && pathname === '/driver/');

        return (
            <TouchableOpacity
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => router.replace(path as any)}
            >
                <Ionicons name={icon} size={24} color={isActive ? '#e60000' : '#888'} />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.sidebar}>
            {/* Czerwona ikona autobusu na górze */}
            <View style={styles.logoContainer}>
                <Ionicons name="bus" size={28} color="#fff" />
            </View>

            <View style={styles.menu}>
                <NavItem icon="map" label="ROUTE" path="/driver" />
                <NavItem icon="document-text" label="REPORT" path="/driver/report" />
                <NavItem icon="water" label="SHIFT" path="/driver/shift" />
            </View>

            {/* Przycisk wyjścia na samym dole */}
            <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
                <Ionicons name="log-out-outline" size={28} color="#888" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    sidebar: { width: 90, backgroundColor: '#fff', alignItems: 'center', paddingVertical: 20, borderRightWidth: 1, borderColor: '#eee', justifyContent: 'space-between' },
    logoContainer: { width: 56, height: 56, backgroundColor: '#e60000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    menu: { flex: 1, width: '100%', alignItems: 'center', gap: 20 },
    navItem: { alignItems: 'center', paddingVertical: 12, width: '80%', borderRadius: 12 },
    navItemActive: { backgroundColor: '#fee2e2' }, // Delikatne czerwone tło dla aktywnego
    navLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginTop: 6 },
    navLabelActive: { color: '#e60000' },
    logoutBtn: { padding: 10 }
});