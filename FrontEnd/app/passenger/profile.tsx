import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ProfileSettingsModal from './profileSettingsModal';

// ==========================================
// TYPES & MOCKS
// ==========================================
interface LoyaltyData {
    points: number;
    currentTier: string;
    nextTier: string;
    nextTierPoints: number;
}

const MOCK_LOYALTY_DATA: LoyaltyData = {
    points: 1450,
    currentTier: 'SILVER TIER',
    nextTier: 'GOLD',
    nextTierPoints: 2000,
};

// ==========================================
// SUB-COMPONENTS
// ==========================================
const ProfileMenuItem = ({ icon, title, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <Ionicons name={icon} size={24} color={isDestructive ? '#e60000' : '#4b5563'} />
            <Text style={[styles.menuItemText, isDestructive && styles.destructiveText]}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
);

const LoyaltyCard = ({ data, isLoading }: { data: LoyaltyData | null, isLoading: boolean }) => {
    if (isLoading || !data) {
        return (
            <View style={[styles.loyaltyCard, styles.loyaltyCardLoading]}>
                <Text style={styles.loadingText}>Loading loyalty points...</Text>
            </View>
        );
    }
    const progressPercentage = (data.points / data.nextTierPoints) * 100;

    return (
        <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyHeader}>
                <View>
                    <View style={styles.loyaltyTitleRow}>
                        <Ionicons name="star" size={14} color="#facc15" />
                        <Text style={styles.loyaltyTitleText}>LOYALTY POINTS</Text>
                    </View>
                    <Text style={styles.pointsValue}>
                        {data.points.toLocaleString('en-US')}
                        <Text style={styles.pointsSuffix}> pts</Text>
                    </Text>
                </View>
                <TouchableOpacity style={styles.trendButton}>
                    <Ionicons name="trending-up" size={24} color="#4ade80" />
                </TouchableOpacity>
            </View>
            <View style={styles.tierInfoRow}>
                <Text style={styles.tierText}>{data.currentTier}</Text>
                <Text style={styles.nextTierText}>{data.nextTier} ({data.nextTierPoints})</Text>
            </View>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
        </View>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function PassengerProfile() {
    // --- STATES ---
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
    const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [activeSection, setActiveSection] = useState<'personal' | 'payment' | 'notifications' | 'language' | 'help' | 'terms' | null>(null);

    // ==========================================
    // API / BACKEND CALLS
    // ==========================================
    useEffect(() => {
        const fetchLoyaltyData = async () => {
            // TODO: BACKEND FETCH - Pobieranie punktów lojalnościowych użytkownika
            // Przykład: const res = await fetch('/api/user/loyalty'); const data = await res.json();
            setTimeout(() => {
                setLoyaltyData(MOCK_LOYALTY_DATA);
                setIsLoadingLoyalty(false);
            }, 800);
        };
        fetchLoyaltyData();
    }, []);

    // ==========================================
    // HANDLERS
    // ==========================================
    const openSettings = (section: 'personal' | 'payment' | 'notifications' | 'language' | 'help' | 'terms') => {
        setActiveSection(section);
        setSettingsModalVisible(true);
    };

    const handleLogout = () => {
        // TODO: BACKEND MUTATION - Wylogowanie sesji z serwera (opcjonalnie przed redirectem)
        router.replace('/');
    };

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>My Profile</Text>

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

                <LoyaltyCard data={loyaltyData} isLoading={isLoadingLoyalty} />

                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem icon="person-outline" title="Personal Information" onPress={() => openSettings('personal')} />
                    <ProfileMenuItem icon="card-outline" title="Payment Methods" onPress={() => openSettings('payment')} />
                    <ProfileMenuItem icon="notifications-outline" title="Notifications" onPress={() => openSettings('notifications')} />
                </View>

                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem icon="language-outline" title="Language" onPress={() => openSettings('language')} />
                    <ProfileMenuItem icon="help-circle-outline" title="Help & Support" onPress={() => openSettings('help')} />
                    <ProfileMenuItem icon="document-text-outline" title="Terms of Service" onPress={() => openSettings('terms')} />
                </View>

                <View style={[styles.menuContainer, { marginTop: 20 }]}>
                    <ProfileMenuItem icon="log-out-outline" title="Log Out" isDestructive={true} onPress={handleLogout} />
                </View>
            </ScrollView>

            <ProfileSettingsModal 
                visible={settingsModalVisible} 
                onClose={() => setSettingsModalVisible(false)} 
                activeSection={activeSection} 
            />
        </SafeAreaView>
    );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 20 },
    
    // User Card
    profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 24 },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: '#e60000' },
    userInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#4b5563' },

    // Loyalty
    loyaltyCard: { backgroundColor: '#181824', borderRadius: 28, padding: 24, marginBottom: 30, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    loyaltyCardLoading: { justifyContent: 'center', alignItems: 'center', minHeight: 140 },
    loadingText: { color: '#9ca3af', fontSize: 16 },
    loyaltyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    loyaltyTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    loyaltyTitleText: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginLeft: 6 },
    pointsValue: { color: '#ffffff', fontSize: 40, fontWeight: '900', letterSpacing: -1 },
    pointsSuffix: { color: '#9ca3af', fontSize: 18, fontWeight: '600', letterSpacing: 0 },
    trendButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#2a2a36', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3b3b4a' },
    tierInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    tierText: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    nextTierText: { color: '#facc15', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    progressBarBackground: { height: 6, backgroundColor: '#374151', borderRadius: 3, width: '100%', overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 3 },

    // Menu
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    menuContainer: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 10, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuItemText: { fontSize: 16, fontWeight: '600', color: '#111', marginLeft: 15 },
    destructiveText: { color: '#e60000' }
});