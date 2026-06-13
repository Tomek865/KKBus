import React, { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import ProfileSettingsModal from './profileSettingsModal';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { authFetch } from '../../utils';
import GuestLoginModal from './GuestLoginModal';

interface LoyaltyData { 
    points: number; 
    currentTier: string; 
    nextTier: string; 
    nextTierPoints: number; 
    goldTier: number;
}
interface UserData { first_name: string; last_name: string; email: string; initials: string }

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
    
    const isGold = data.points >= 2000;
    const progressPercentage = Math.min((data.points / data.nextTierPoints) * 100, 100);
    
    return (
        <View style={[
            styles.loyaltyCard, 
            isGold ? localStyles.goldCardBackground : {} 
        ]}>
            <View style={localStyles.chartBackgroundContainer}>
                <View style={[localStyles.chartLineSegment, { backgroundColor: isGold ? 'rgba(0,0,0,0.1)' : '#22c55e', bottom: 12, left: '5%', width: '25%', transform: [{ rotate: '15deg' }] }]} />
                <View style={[localStyles.chartLineSegment, { backgroundColor: isGold ? 'rgba(0,0,0,0.1)' : '#22c55e', bottom: 20, left: '29%', width: '20%', transform: [{ rotate: '-8deg' }] }]} />
                <View style={[localStyles.chartLineSegment, { backgroundColor: isGold ? 'rgba(0,0,0,0.1)' : '#22c55e', bottom: 17, left: '48%', width: '25%', transform: [{ rotate: '35deg' }] }]} />
                <View style={[localStyles.chartLineSegment, { backgroundColor: isGold ? 'rgba(0,0,0,0.1)' : '#22c55e', bottom: 31, left: '72%', width: '25%', transform: [{ rotate: '12deg' }] }]} />
            </View>

            <View style={styles.loyaltyHeader}>
                <View style={{ flex: 1, zIndex: 2 }}>
                    <View style={styles.loyaltyTitleRow}>
                        <Ionicons name={isGold ? "star" : "star-outline"} size={14} color={isGold ? "#000" : "#facc15"} />
                        <Text style={[styles.loyaltyTitleText, isGold && { color: '#000' }]}>LOYALTY POINTS</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <Text style={[styles.pointsValue, isGold && { color: '#000' }]}>
                            {data.points.toLocaleString('en-US')}
                            <Text style={[styles.pointsSuffix, isGold && { color: 'rgba(0,0,0,0.6)' }]}> pts</Text>
                        </Text>
                        <View style={[localStyles.stockTrendBadge, isGold && { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                            <Ionicons name="arrow-up" size={10} color={isGold ? "#000" : "#22c55e"} />
                            <Text style={[localStyles.stockTrendText, isGold && { color: '#000' }]}>+15%</Text>
                        </View>
                    </View>
                </View>
                <View style={[localStyles.goldBadge, isGold && { backgroundColor: '#000' }, { zIndex: 2 }]}>
                    <Ionicons name="trophy" size={16} color="#facc15" />
                    <Text style={localStyles.goldBadgeText}>{data.goldTier}x</Text>
                </View>
            </View>

            <View style={[styles.tierInfoRow, { zIndex: 2 }]}>
                <Text style={[styles.tierText, isGold && { color: '#000' }]}>{data.currentTier}</Text>
                <Text style={[styles.nextTierText, isGold && { color: 'rgba(0,0,0,0.6)' }]}>
                    {isGold ? 'VIP LEVEL' : `${data.nextTier} (${data.nextTierPoints})`}
                </Text>
            </View>

            <View style={[styles.progressBarBackground, isGold && { backgroundColor: 'rgba(0,0,0,0.15)' }, { zIndex: 2 }]}>
                <View style={[styles.progressBarFill, isGold && { backgroundColor: '#000' }, { width: `${progressPercentage}%` }]} />
            </View>
        </View>
    );
};

export default function PassengerProfile() {
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
    const [userData, setUserData] = useState<UserData>({ first_name: 'Ładowanie...', last_name: 'Ładowanie...', email: 'Ładowanie...', initials: '?' });
    const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [activeSection, setActiveSection] = useState<any>(null);
    const [isGuest, setIsGuest] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchLoyaltyAndProfile = async () => {
                setIsLoadingLoyalty(true);
                setIsLoadingProfile(true);
                try {
                    let token = null;
                    if (Platform.OS === 'web') {
                        token = localStorage.getItem('userToken');
                    } else {
                        token = await SecureStore.getItemAsync('userToken');
                    }

                    if (!token) {
                        setIsGuest(true);
                        setIsLoadingLoyalty(false);
                        setIsLoadingProfile(false);
                        return; // Przerywamy dalsze pobieranie
                    }
                    
                    setIsGuest(false);

                    const resLoyalty = await authFetch('/api/client/profile/user/loyalty');
                    if (resLoyalty.ok) {
                        const dataLoyalty = await resLoyalty.json();
                        if (dataLoyalty.points !== undefined) {
                            setLoyaltyData({
                                points: dataLoyalty.points,
                                currentTier: dataLoyalty.points >= 2000 ? 'GOLD' : 'STANDARD',
                                nextTier: 'GOLD',
                                nextTierPoints: 2000,
                                goldTier: dataLoyalty.goldTier || 0
                            });
                        }
                    }

                    let user_data_string;
                    try {
                        if (Platform.OS === 'web') {
                            user_data_string = localStorage.getItem('userData');
                        } else {
                            user_data_string = await SecureStore.getItemAsync('userData');
                        }

                        if (user_data_string) {
                            const parsed_data = JSON.parse(user_data_string);
                            const actual_data = parsed_data.data ? parsed_data.data : parsed_data;
                            const fName = actual_data.first_name || '';
                            const lName = actual_data.last_name || '';
                            const initF = fName.length > 0 ? fName[0] : '';
                            const initL = lName.length > 0 ? lName[0] : '';

                            setUserData({
                                first_name: fName || 'Brak danych',
                                last_name: lName || 'Brak danych',
                                email: actual_data.email || 'Brak danych',
                                initials: (initF + initL) || '?'
                            });
                        }
                    } catch (error) {
                        console.error("error while trying to load user session data: ", error);
                    }
                } finally {
                    setIsLoadingLoyalty(false);
                    setIsLoadingProfile(false);
                }
            };

            fetchLoyaltyAndProfile();
        }, [])
    );

    const handleLogout = async () => {
        try {
            const keysToRemove = ['userToken', 'userData'];
            if (Platform.OS === 'web') {
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                await Promise.all(keysToRemove.map(key => SecureStore.deleteItemAsync(key)));
            }
            router.replace('/');
        } catch (error) {
            console.error("Błąd podczas wylogowywania: ", error);
        }
    };

    const openSettings = (section: any) => { setActiveSection(section); setSettingsModalVisible(true); };
    if (isGuest) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <GuestLoginModal visible={true} onClose={() => { setIsGuest(false); router.navigate('/passenger'); }} />
            </SafeAreaView>
        );
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>My Profile</Text>

                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {isLoadingProfile ? <ActivityIndicator color="#e60000" /> : <Text style={styles.avatarText}>{userData.initials}</Text>}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userData.first_name} {userData.last_name}</Text>
                        <Text style={styles.userEmail}>{userData.email}</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>Standard Passenger</Text></View>
                    </View>
                </View>

                <LoyaltyCard data={loyaltyData} isLoading={isLoadingLoyalty} />

                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem icon="person-outline" title="Personal Information" onPress={() => openSettings('personal')} />
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

const localStyles = StyleSheet.create({
    goldCardBackground: {
        backgroundColor: '#f59e0b',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    goldBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155', 
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    goldBadgeText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    chartBackgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 50,
        overflow: 'hidden',
        opacity: 0.15,
    },
    chartLineSegment: {
        position: 'absolute',
        height: 2.5,
        borderRadius: 2,
    },
    stockTrendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.15)', 
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    stockTrendText: {
        fontSize: 11,
        fontWeight: 'bold',
    }
});