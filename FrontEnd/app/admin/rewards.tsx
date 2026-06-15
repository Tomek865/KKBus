import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

// --- LOGIKA Z APLIKACJI KLIENTA ---
const getRewardIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ticket') || lowerName.includes('ride') || lowerName.includes('przejazd') || lowerName.includes('bilet')) return 'ticket';
    if (lowerName.includes('discount') || lowerName.includes('zniżka') || lowerName.includes('rabat')) return 'pricetag';
    if (lowerName.includes('seat') || lowerName.includes('miejsce')) return 'star';
    if (lowerName.includes('luggage') || lowerName.includes('bagaż')) return 'briefcase';
    return 'gift';
};

const getRewardDescription = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ticket') || lowerName.includes('przejazd')) return 'Wymień punkty na darmowy przejazd na dowolnej trasie.';
    if (lowerName.includes('discount') || lowerName.includes('zniżka')) return 'Odbierz 50% zniżki na swój kolejny bilet.';
    if (lowerName.includes('seat') || lowerName.includes('miejsce')) return 'Gwarancja najlepszego miejsca i dodatkowej przestrzeni na nogi.';
    if (lowerName.includes('luggage') || lowerName.includes('bagaż')) return 'Zabierz dodatkową walizkę bez żadnych opłat.';
    return 'Specjalna nagroda lojalnościowa dla naszych stałych pasażerów.';
};
// ----------------------------------

export default function AdminRewards() {
    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // POPRAWIONY STAN: Używamy tylko required_points
    const [newReward, setNewReward] = useState({
        name: '',
        description: '',
        required_points: ''
    });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/admin/management/rewards');
            if (response.ok) {
                const data = await response.json();
                setRewards(data);
            }
        } catch (error) {
            console.error("Błąd pobierania nagród:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReward = async () => {
        // POPRAWIONA WALIDACJA
        if (!newReward.name || !newReward.required_points) {
            showAlert("Błąd", "Proszę podać nazwę nagrody i jej koszt punktowy.");
            return;
        }

        setIsSubmitting(true);
        try {
            // POPRAWIONE WYSYŁANIE
            const response = await authFetch('/api/admin/management/rewards', {
                method: 'POST',
                body: JSON.stringify({
                    name: newReward.name,
                    description: newReward.description,
                    required_points: parseInt(newReward.required_points)
                })
            });

            const created = await response.json();

            if (response.ok) {
                setModalVisible(false);
                setNewReward({ name: '', description: '', required_points: '' });
                showAlert("Sukces", "Nagroda została dodana do systemu.");
                fetchRewards();
            } else {
                showAlert("Błąd", created.error || "Nie udało się utworzyć nagrody.");
            }
        } catch (error) {
            showAlert("Błąd", "Błąd połączenia z serwerem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            setTimeout(() => { Alert.alert(title, message); }, 100);
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.title}>Program Lojalnościowy</Text>
                    <Text style={styles.subtitle}>ZARZĄDZANIE NAGRODAMI ZA PUNKTY</Text>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="gift-outline" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Dodaj Nagrodę</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.card, { padding: 0, overflow: 'hidden', marginTop: 20, flex: 1 }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 2.5 }]}>NAGRODA (WIDOK KLIENTA)</Text>
                    <Text style={[styles.headerCell, { flex: 3 }]}>OPIS</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>KOSZT</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 15 }}>
                    {rewards.length === 0 && (
                        <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>Brak dostępnych nagród. Dodaj pierwszą!</Text>
                    )}
                    {rewards.map((reward) => (
                        <View key={reward.reward_id} style={styles.tableRow}>
                            <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name={getRewardIcon(reward.name) as any} size={20} color={COLORS.red} />
                                </View>
                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#111827', flexShrink: 1 }}>{reward.name}</Text>
                            </View>

                            <View style={{ flex: 3, paddingRight: 15 }}>
                                <Text style={{ color: '#6b7280', fontSize: 12 }}>
                                    {reward.description || getRewardDescription(reward.name)}
                                </Text>
                            </View>

                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="star" size={14} color="#facc15" />
                                <Text style={{ fontWeight: 'bold', color: '#b45309', fontSize: 16 }}>
                                    {reward.required_points}
                                </Text>
                            </View>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: reward.is_active ? COLORS.greenLight : COLORS.redLight }]}>
                                    <Text style={[styles.statusText, { color: reward.is_active ? COLORS.green : COLORS.red }]}>
                                        {reward.is_active ? 'Aktywna' : 'Nieaktywna'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#111827' }}>Nowa Nagroda</Text>

                        <Text style={styles.inputLabel}>NAZWA NAGRODY</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="np. Darmowy bilet, Zniżka 50%"
                            value={newReward.name}
                            onChangeText={(text) => setNewReward({ ...newReward, name: text })}
                        />

                        <Text style={styles.inputLabel}>KOSZT (W PUNKTACH)</Text>
                        {/* POPRAWIONY INPUT Z required_points */}
                        <TextInput
                            style={styles.input}
                            placeholder="np. 500"
                            keyboardType="numeric"
                            value={newReward.required_points}
                            onChangeText={(text) => setNewReward({ ...newReward, required_points: text.replace(/[^0-9]/g, '') })}
                        />

                        <Text style={styles.inputLabel}>OPIS NAGRODY (Zostaw puste dla domyślnego)</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                            placeholder="Krótki opis widoczny dla pasażerów..."
                            multiline
                            value={newReward.description}
                            onChangeText={(text) => setNewReward({ ...newReward, description: text })}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15 }}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={{ color: '#6b7280', fontWeight: 'bold', padding: 10 }}>Anuluj</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleCreateReward}>
                                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Dodaj Nagrodę</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}