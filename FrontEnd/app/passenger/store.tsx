import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { authFetch } from '../../utils';
import GuestLoginModal from './GuestLoginModal';
import { passengerStyles as styles } from '../src/styles/passengerStyles';

interface Reward {
    reward_id: number;
    name: string;
    required_points: number;
    description?: string;
    icon?: string;
}

const getRewardIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ticket') || lowerName.includes('ride')) return 'ticket';
    if (lowerName.includes('discount') || lowerName.includes('zniżka')) return 'pricetag';
    if (lowerName.includes('seat') || lowerName.includes('miejsce')) return 'star';
    if (lowerName.includes('luggage') || lowerName.includes('bagaż')) return 'briefcase';
    return 'gift';
};

const getRewardDescription = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ticket')) return 'Wymień punkty na darmowy przejazd na dowolnej trasie.';
    if (lowerName.includes('discount')) return 'Zdobądź 50% zniżki na kolejny pojedynczy bilet.';
    if (lowerName.includes('seat')) return 'Gwarancja najlepszego miejsca i dodatkowego miejsca na nogi.';
    if (lowerName.includes('luggage')) return 'Zabierz dodatkową walizkę bez dodatkowych opłat.';
    return 'Specjalna nagroda lojalnościowa dla naszych stałych podróżnych.';
};

export default function LoyaltyStore() {
    const [points, setPoints] = useState<number>(0);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchStoreData = async () => {
                setIsLoading(true);
                try {
                    let token = null;
                    if (Platform.OS === 'web') {
                        token = localStorage.getItem('userToken');
                    } else {
                        token = await SecureStore.getItemAsync('userToken');
                    }

                    if (!token) {
                        setIsGuest(true);
                        setIsLoading(false);
                        return;
                    }

                    setIsGuest(false);

                    const resLoyalty = await authFetch('/api/client/profile/user/loyalty');
                    if (resLoyalty.ok) {
                        const data = await resLoyalty.json();
                        setPoints(data.points !== undefined ? data.points : 0);
                    }

                    const resRewards = await authFetch('/api/client/profile/loyalty/rewards');
                    if (resRewards.ok) {
                        const rewardsData = await resRewards.json();
                        console.log("Fetched rewards:", rewardsData);
                        setRewards(rewardsData);
                    }
                } catch (err) {
                    console.error("Error fetching store data:", err);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchStoreData();
        }, [])
    );

    const handlePurchase = (rewardId: number, cost: number, title: string) => {
        if (points < cost) {
            const message = "Nie masz wystarczającej liczby punktów, aby odebrać tę nagrodę.";
            Platform.OS === 'web' ? window.alert(message) : Alert.alert("Brak punktów", message);
            return;
        }

        const executePurchase = async () => {
            setIsPurchasing(rewardId);
            try {
                const res = await authFetch('/api/client/profile/loyalty/purchase', {
                    method: 'POST',
                    body: JSON.stringify({ reward_id: rewardId, cost: cost })
                });

                if (res.ok) {
                    setPoints(prev => prev - cost);
                    const successMsg = `Pomyślnie odebrano: ${title}. Znajdziesz to w swoich dostępnych voucherach/opcjach.`;
                    Platform.OS === 'web' ? window.alert(`Sukces!\n${successMsg}`) : Alert.alert("Sukces!", successMsg);
                } else {
                    const failMsg = "Nie udało się przetworzyć transakcji. Spróbuj ponownie.";
                    Platform.OS === 'web' ? window.alert(`Błąd\n${failMsg}`) : Alert.alert("Błąd", failMsg);
                }
            } catch (error) {
                console.error("Error during points purchase:", error);
            } finally {
                setIsPurchasing(null);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Czy na pewno chcesz wymienić ${cost} punktów na: ${title}?`);
            if (confirmed) executePurchase();
        } else {
            Alert.alert(
                "Potwierdzenie",
                `Czy na pewno chcesz wymienić ${cost} punktów na: ${title}?`,
                [
                    { text: "Anuluj", style: "cancel" },
                    { text: "Odbierz", style: "default", onPress: executePurchase }
                ]
            );
        }
    };

    if (isGuest) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <GuestLoginModal visible={true} onClose={() => { setIsGuest(false); router.navigate('/passenger'); }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                <View style={localStyles.headerSection}>
                    <Text style={styles.headerTitle}>Sklep z Nagrodami</Text>
                    <View style={localStyles.balanceCard}>
                        <Ionicons name="gift" size={40} color="#facc15" style={localStyles.balanceIcon} />
                        <Text style={localStyles.balanceLabel}>TWOJE PUNKTY</Text>
                        {isLoading ? (
                            <ActivityIndicator color="#fff" style={{ marginTop: 5 }} />
                        ) : (
                            <Text style={localStyles.balanceAmount}>{points.toLocaleString('en-US')}</Text>
                        )}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Dostępne Nagrody</Text>

                <View style={localStyles.rewardsContainer}>
                    {isLoading && rewards.length === 0 ? (
                        <ActivityIndicator color="#e60000" size="large" style={{ marginTop: 20 }} />
                    ) : (
                        rewards.map((reward) => {
                            const iconName = getRewardIcon(reward.name);
                            const description = getRewardDescription(reward.name);

                            return (
                                <View key={reward.reward_id} style={localStyles.rewardCard}>
                                    <View style={localStyles.rewardIconContainer}>
                                        <Ionicons name={iconName as any} size={28} color="#e60000" />
                                    </View>
                                    <View style={localStyles.rewardInfo}>
                                        <Text style={localStyles.rewardTitle}>{reward.name}</Text>
                                        <Text style={localStyles.rewardDesc}>{description}</Text>
                                        <View style={localStyles.costContainer}>
                                            <Ionicons name="star" size={14} color="#facc15" />
                                            <Text style={localStyles.costText}>{reward.required_points} pkt</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            localStyles.buyButton,
                                            points < reward.required_points && localStyles.buyButtonDisabled
                                        ]}
                                        onPress={() => handlePurchase(reward.reward_id, reward.required_points, reward.name)}
                                        disabled={points < reward.required_points || isPurchasing === reward.reward_id}
                                    >
                                        {isPurchasing === reward.reward_id ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={localStyles.buyButtonText}>Odbierz</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    headerSection: { marginBottom: 20 },
    balanceCard: { backgroundColor: '#111827', borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 15, position: 'relative', overflow: 'hidden' },
    balanceIcon: { position: 'absolute', right: -10, top: -10, opacity: 0.2, transform: [{ scale: 2.5 }] },
    balanceLabel: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
    balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '900' },
    rewardsContainer: { gap: 15, paddingBottom: 30 },
    rewardCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    rewardIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    rewardInfo: { flex: 1 },
    rewardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
    rewardDesc: { fontSize: 12, color: '#6b7280', lineHeight: 16, marginBottom: 8 },
    costContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    costText: { fontSize: 12, fontWeight: 'bold', color: '#b45309', marginLeft: 4 },
    buyButton: { backgroundColor: '#e60000', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginLeft: 10, minWidth: 80, alignItems: 'center' },
    buyButtonDisabled: { backgroundColor: '#e5e7eb' },
    buyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});