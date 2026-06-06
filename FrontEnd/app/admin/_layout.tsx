import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { adminStyles as styles } from '../src/styles/adminStyles';

const MenuItem = ({ icon, label, path, pathname }: any) => {
    const isActive = pathname === path || (path === '/admin' && pathname === '/admin/');
    return (
        <TouchableOpacity
            style={[styles.menuItem, isActive && styles.menuItemActive]}
            onPress={() => router.replace(path as any)}
        >
            <Ionicons name={icon} size={20} color={isActive ? '#e60000' : '#4b5563'} />
            <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );
};

export default function AdminLayout() {
    const pathname = usePathname();
    const [adminData, setAdminData] = useState({ name: 'Administrator', email: 'admin@kkbus.pl' });

    useEffect(() => {
        const loadAdminProfile = async () => {
            try {
                let storedData = null;
                if (Platform.OS === 'web') {
                    storedData = localStorage.getItem('userData');
                } else {
                    storedData = await SecureStore.getItemAsync('userData');
                }

                if (storedData) {
                    setAdminData(JSON.parse(storedData));
                }
            } catch (e) {
                console.error("Błąd ładowania profilu admina:", e);
            }
        };
        loadAdminProfile();
    }, []);

    const handleLogout = async () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userData');
            } else {
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('userData');
            }
            router.replace('/');
        } catch (e) {
            router.replace('/');
        }
    };

    const avatarInitial = adminData.name ? adminData.name[0].toUpperCase() : 'A';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.sidebar}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}><Text style={styles.logoIconText}>K</Text></View>
                        <Text style={styles.logoText}>KK<Text style={{ color: '#e60000' }}>BUS</Text></Text>
                    </View>

                    <View style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>OPERATIONS</Text>
                        <MenuItem icon="grid-outline" label="Dashboard Overview" path="/admin" pathname={pathname} />
                        <MenuItem icon="calendar-outline" label="Schedule & Fleet" path="/admin/schedule" pathname={pathname} />
                    </View>

                    <View style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>MANAGEMENT</Text>
                        <MenuItem icon="people-outline" label="Client Accounts" path="/admin/clients" pathname={pathname} />
                        <MenuItem icon="document-text-outline" label="Financial Reports" path="/admin/reports" pathname={pathname} />
                    </View>

                    <View style={styles.profileSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.profileAvatar}>
                                <Text style={{ fontWeight: 'bold' }}>{avatarInitial}</Text>
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold' }} numberOfLines={1}>{adminData.name}</Text>
                                <Text style={{ fontSize: 12, color: '#888' }} numberOfLines={1}>{adminData.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.mainArea}>
                    <View style={[styles.topbar, { justifyContent: 'flex-end' }]}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color="#111" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <Slot />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}