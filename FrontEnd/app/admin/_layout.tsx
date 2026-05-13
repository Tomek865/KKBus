import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
                            <View style={{ width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>AD</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Admin Secretariat</Text>
                                <Text style={{ fontSize: 12, color: '#888' }}>admin@transregion.pl</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.mainArea}>
                    <View style={styles.topbar}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#888" />
                            <TextInput
                                style={[styles.searchInput, { outlineStyle: 'none', marginLeft: 10 } as any]}
                                placeholder="Search buses, drivers, routes..."
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                            <TouchableOpacity style={{ position: 'relative' }}>
                                <Ionicons name="notifications-outline" size={24} color="#111" />
                                <View style={{ position: 'absolute', top: 0, right: 2, width: 8, height: 8, backgroundColor: '#e60000', borderRadius: 4 }} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
                                <Ionicons name="log-out-outline" size={20} color="#111" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Slot />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}