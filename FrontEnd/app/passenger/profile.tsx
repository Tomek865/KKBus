import React, { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import ProfileSettingsModal from './profileSettingsModal';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { authFetch } from '../../utils';

interface LoyaltyData { points: number; currentTier: string; nextTier: string; nextTierPoints: number; }
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
    const [userData, setUserData] = useState<UserData>({ first_name: 'Ładowanie...', last_name: 'Ładowanie...', email: 'Ładowanie...', initials: '?' });
    const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [activeSection, setActiveSection] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchLoyaltyAndProfile = async () => {
                setIsLoadingLoyalty(true);
                setIsLoadingProfile(true);
                try {
                    // 1. Fetch Loyalty z API
                    const resLoyalty = await authFetch('/api/client/profile/user/loyalty');
                    if (resLoyalty.ok) {
                        const dataLoyalty = await resLoyalty.json();
                        if (dataLoyalty.points !== undefined) {
                            setLoyaltyData({
                                points: dataLoyalty.points,
                                currentTier: dataLoyalty.points > 2000 ? 'GOLD' : 'STANDARD',
                                nextTier: 'GOLD',
                                nextTierPoints: 2000
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
                        } else {
                            console.warn("Brak danych użytkownika w Local Storage");
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
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
            } else {
                await Promise.all(
                    keysToRemove.map(key => SecureStore.deleteItemAsync(key))
                );
            }

            router.replace('/');
        } catch (error) {
            console.error("Błąd podczas wylogowywania: ", error);
        }
    };

    const openSettings = (section: any) => { setActiveSection(section); setSettingsModalVisible(true); };

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
