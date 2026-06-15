import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { authFetch } from '../../utils';
import GuestLoginModal from './GuestLoginModal';
import { passengerStyles as styles } from '../src/styles/passengerStyles';

// Definicja nagród dostępnych w sklepie (przetłumaczona na angielski)
const REWARDS = [
    { id: 'FREE_RIDE_1000', title: 'Free Ticket', description: 'Exchange points for a free ride on any route.', cost: 1000, icon: 'ticket' },
    { id: 'DISCOUNT_50', title: '50% Discount', description: 'Get a 50% discount on your next single ticket.', cost: 500, icon: 'pricetag' },
    { id: 'VIP_SEAT', title: 'VIP Seat', description: 'Guarantee of the best seat and extra legroom.', cost: 300, icon: 'star' },
    { id: 'FREE_LUGGAGE', title: 'Free Luggage', description: 'Take an extra suitcase at no additional cost.', cost: 200, icon: 'briefcase' },
];

export default function LoyaltyStore() {
    const [points, setPoints] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchPoints = async () => {
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
                } catch (err) {
                    console.error("Error fetching store points:", err);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchPoints();
        }, [])
    );

    const handlePurchase = (rewardId: string, cost: number, title: string) => {
        if (points < cost) {
            const message = "You do not have enough points to redeem this reward.";
            Platform.OS === 'web' ? window.alert(message) : Alert.alert("Not enough points", message);
            return;
        }

        const executePurchase = async () => {
            setIsPurchasing(rewardId);
            try {
                const res = await authFetch('/api/client/loyalty/purchase', {
                    method: 'POST',
                    body: JSON.stringify({ reward_id: rewardId, cost: cost })
                });

                if (res.ok) {
                    setPoints(prev => prev - cost);
                    const successMsg = `Successfully claimed: ${title}. You will find it in your available vouchers/options.`;
                    Platform.OS === 'web' ? window.alert(`Success!\n${successMsg}`) : Alert.alert("Success!", successMsg);
                } else {
                    const failMsg = "Failed to process the transaction. Please try again.";
                    Platform.OS === 'web' ? window.alert(`Error\n${failMsg}`) : Alert.alert("Error", failMsg);
                }
            } catch (error) {
                console.error("Error during points purchase:", error);
            } finally {
                setIsPurchasing(null);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to exchange ${cost} points for: ${title}?`);
            if (confirmed) executePurchase();
        } else {
            Alert.alert(
                "Confirmation",
                `Are you sure you want to exchange ${cost} points for: ${title}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Redeem", style: "default", onPress: executePurchase }
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

                {/* Nagłówek i Stan Konta */}
                <View style={localStyles.headerSection}>
                    <Text style={styles.headerTitle}>Rewards Store</Text>
                    <View style={localStyles.balanceCard}>
                        <Ionicons name="gift" size={40} color="#facc15" style={localStyles.balanceIcon} />
                        <Text style={localStyles.balanceLabel}>YOUR POINTS</Text>
                        {isLoading ? (
                            <ActivityIndicator color="#fff" style={{ marginTop: 5 }} />
                        ) : (
                            <Text style={localStyles.balanceAmount}>{points.toLocaleString('en-US')}</Text>
                        )}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Available Rewards</Text>

                {/* Lista Nagród */}
                <View style={localStyles.rewardsContainer}>
                    {REWARDS.map((reward) => (
                        <View key={reward.id} style={localStyles.rewardCard}>
                            <View style={localStyles.rewardIconContainer}>
                                <Ionicons name={reward.icon as any} size={28} color="#e60000" />
                            </View>
                            <View style={localStyles.rewardInfo}>
                                <Text style={localStyles.rewardTitle}>{reward.title}</Text>
                                <Text style={localStyles.rewardDesc}>{reward.description}</Text>
                                <View style={localStyles.costContainer}>
                                    <Ionicons name="star" size={14} color="#facc15" />
                                    <Text style={localStyles.costText}>{reward.cost} pts</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[
                                    localStyles.buyButton,
                                    points < reward.cost && localStyles.buyButtonDisabled
                                ]}
                                onPress={() => handlePurchase(reward.id, reward.cost, reward.title)}
                                disabled={points < reward.cost || isPurchasing === reward.id}
                            >
                                {isPurchasing === reward.id ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={localStyles.buyButtonText}>Redeem</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    headerSection: {
        marginBottom: 20,
    },
    balanceCard: {
        backgroundColor: '#111827',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginTop: 15,
        position: 'relative',
        overflow: 'hidden',
    },
    balanceIcon: {
        position: 'absolute',
        right: -10,
        top: -10,
        opacity: 0.2,
        transform: [{ scale: 2.5 }]
    },
    balanceLabel: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '900',
    },
    rewardsContainer: {
        gap: 15,
        paddingBottom: 30,
    },
    rewardCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    rewardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 4,
    },
    rewardDesc: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 16,
        marginBottom: 8,
    },
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    costText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#b45309',
        marginLeft: 4,
    },
    buyButton: {
        backgroundColor: '#e60000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    buyButtonDisabled: {
        backgroundColor: '#e5e7eb',
    },
    buyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});