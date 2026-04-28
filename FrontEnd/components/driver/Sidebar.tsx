import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

export const Sidebar = () => {
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const NavItem = ({ icon, label, path }: any) => {
        const isActive = pathname === path || (path === '/driver' && pathname === '/driver/');
        return (
            <TouchableOpacity
                style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                    isMobile && { flex: 1, paddingVertical: 12 }
                ]}
                onPress={() => router.replace(path as any)}
            >
                <Ionicons name={icon} size={24} color={isActive ? '#e60000' : '#888'} />
                {!isMobile && <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[
            styles.sidebar,
            isMobile ? styles.bottomBar : styles.sideBarFull
        ]}>
            {!isMobile && (
                <View style={styles.logoContainer}>
                    <Ionicons name="bus" size={28} color="#fff" />
                </View>
            )}

            <View style={[styles.menu, isMobile && styles.menuRow]}>
                <NavItem icon="map" label="ROUTE" path="/driver" />
                <NavItem icon="document-text" label="REPORT" path="/driver/report" />
                <NavItem icon="water" label="SHIFT" path="/driver/shift" />
                {isMobile && <NavItem icon="log-out-outline" label="EXIT" path="/" />}
            </View>

            {!isMobile && (
                <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
                    <Ionicons name="log-out-outline" size={28} color="#888" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    sidebar: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
    sideBarFull: { width: 90, height: '100%', paddingVertical: 20, borderRightWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
    bottomBar: { width: '100%', height: 80, flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10 },

    logoContainer: { width: 56, height: 56, backgroundColor: '#e60000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    menu: { width: '100%', alignItems: 'center' },
    menuRow: { flexDirection: 'row', flex: 1 },

    navItem: { alignItems: 'center', paddingVertical: 12, width: '80%', borderRadius: 12 },
    navItemActive: { backgroundColor: '#fee2e2' },
    navLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginTop: 6 },
    navLabelActive: { color: '#e60000' },
    logoutBtn: { padding: 10 }
});