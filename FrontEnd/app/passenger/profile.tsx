import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ProfileSettingsModal from './profileSettingsModal';
import { passengerStyles as styles } from '../src/styles/passengerStyles';


// INTERFACES & MOCKS (same as before)
interface LoyaltyData { points: number; currentTier: string; nextTier: string; nextTierPoints: number; }
const MOCK_LOYALTY_DATA: LoyaltyData = { points: 1450, currentTier: 'SILVER TIER', nextTier: 'GOLD', nextTierPoints: 2000, };

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
    if (isLoading || !data) return (<View style={[styles.loyaltyCard, styles.loyaltyCardLoading]}><Text style={styles.loadingText}>Loading loyalty points...</Text></View>);
    const progressPercentage = (data.points / data.nextTierPoints) * 100;
    return (
        <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyHeader}>
                <View>
                    <View style={styles.loyaltyTitleRow}>
                        <Ionicons name="star" size={14} color="#facc15" />
                        <Text style={styles.loyaltyTitleText}>LOYALTY POINTS</Text>
                    </View>
                    <Text style={styles.pointsValue}>{data.points.toLocaleString('en-US')}<Text style={styles.pointsSuffix}> pts</Text></Text>
                </View>
                <TouchableOpacity style={styles.trendButton}><Ionicons name="trending-up" size={24} color="#4ade80" /></TouchableOpacity>
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

export default function PassengerProfile() {
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
    const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [activeSection, setActiveSection] = useState<any>(null);

    useEffect(() => {
        setTimeout(() => { setLoyaltyData(MOCK_LOYALTY_DATA); setIsLoadingLoyalty(false); }, 800);
    }, []);

    const openSettings = (section: any) => { setActiveSection(section); setSettingsModalVisible(true); };
    const handleLogout = () => { router.replace('/'); };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}><Text style={styles.avatarText}>AK</Text></View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Anna Kowalska</Text>
                        <Text style={styles.userEmail}>anna.kowalska@example.com</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>Standard Passenger</Text></View>
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
            <ProfileSettingsModal visible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} activeSection={activeSection} />
        </SafeAreaView>
    );
}