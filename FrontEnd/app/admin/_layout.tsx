import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Wyciągnięto MenuItem poza główny komponent, aby uniknąć zbędnych re-renderów
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

                {/* Menu Boczne (Sidebar) */}
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
                        <View style={styles.avatar}><Text style={styles.avatarText}>AD</Text></View>
                        <View>
                            <Text style={styles.profileName}>Admin Secretariat</Text>
                            <Text style={styles.profileEmail}>admin@transregion.pl</Text>
                        </View>
                    </View>
                </View>

                {/* Prawa strona - Główna zawartość */}
                <View style={styles.mainArea}>

                    {/* Górny pasek (Top Bar) */}
                    <View style={styles.topbar}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                            <TextInput
                                // outlineStyle przeniesiono do inline style i rzutowano na any
                                style={[styles.searchInput, { outlineStyle: 'none' } as any]}
                                placeholder="Search buses, drivers, routes..."
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.topbarActions}>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="notifications-outline" size={24} color="#111" />
                                <View style={styles.notificationDot} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
                                <Ionicons name="log-out-outline" size={20} color="#111" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tutaj ładują się ekrany (np. index.tsx) */}
                    <View style={styles.content}>
                        <Slot />
                    </View>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, flexDirection: 'row' },

    // Sidebar
    sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderColor: '#eee', padding: 20, justifyContent: 'flex-start' },
    logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
    logoIcon: { width: 32, height: 32, backgroundColor: '#e60000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    logoText: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    menuSection: { marginBottom: 30 },
    sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 15, letterSpacing: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, marginBottom: 5 },
    menuItemActive: { backgroundColor: '#fee2e2' },
    menuLabel: { marginLeft: 15, fontSize: 14, color: '#4b5563', fontWeight: '500' },
    menuLabelActive: { color: '#e60000', fontWeight: 'bold' },
    profileSection: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingTop: 20, borderTopWidth: 1, borderColor: '#eee' },
    avatar: { width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontWeight: 'bold', color: '#111' },
    profileName: { fontSize: 14, fontWeight: 'bold', color: '#111' },
    profileEmail: { fontSize: 12, color: '#888' },

    // Prawa strona
    mainArea: { flex: 1, backgroundColor: '#f4f5f7' },
    topbar: { height: 70, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, borderBottomWidth: 1, borderColor: '#eee' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 15, borderRadius: 12, width: 400, height: 45, borderWidth: 1, borderColor: '#eee' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14 },
    topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    actionBtn: { position: 'relative' },
    notificationDot: { position: 'absolute', top: 0, right: 2, width: 8, height: 8, backgroundColor: '#e60000', borderRadius: 4 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoutText: { fontSize: 14, fontWeight: '500' },

    content: { flex: 1, padding: 30 }
});