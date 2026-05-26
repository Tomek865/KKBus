import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import ActiveTicketModal from './ActiveTicketModal'; 
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch } from '../../utils';

export interface TicketData {
    id: string; ticketNumber: string; seatCount: string; depTime: string; arrTime: string;
    depStation: string; arrStation: string; duration: string; seats: number; price: number | string; isPast: boolean; isCancelled: boolean;
}

// ------------------------------------------------------------------
// NOWY KOMPONENT: Dedykowana karta dla historii podróży
// ------------------------------------------------------------------
const PastTicketCard = ({ ticket }: { ticket: TicketData }) => {
    return (
        <View style={{
            backgroundColor: '#f9fafb',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            padding: 16,
            marginBottom: 10
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
                    {ticket.depStation} - {ticket.arrStation}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
                    {ticket.depTime}
                </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#4b5563', fontWeight: '700' }}>
                        TICKETS: {ticket.seatCount}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={16} color="#9ca3af" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '600' }}>
                        Archived
                    </Text>
                </View>
            </View>
        </View>
    );
};
// ------------------------------------------------------------------

export default function PassengerTickets() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

    const opacityAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useFocusEffect(
        useCallback(() => {
            const fetchTickets = async () => {
                setIsLoading(true);
                try {
                    const res = await authFetch('/api/client/profile/tickets');
                    if (!res.ok) {
                        console.error("Błąd pobierania biletów, status HTTP:", res.status);
                        return;
                    }
                    const data = await res.json();
                    console.log("Pobrane bilety:", data);
                    const mappedTickets = data.map((t: any) => ({
                        id: String(t.ticket_id),
                        ticketNumber: String(t.reservation_number || t.id),
                        seatCount: t.seat_count || 'Brak danych', 
                        depTime: t.departure_time ? (t.departure_time.includes(' ') ? t.departure_time.split(' ')[1] : t.departure_time) : 'Brak danych',
                        arrTime: t.arrival_time ? (t.arrival_time.includes(' ') ? t.arrival_time.split(' ')[1] : t.arrival_time) : 'Brak danych',
                        depStation: t.route?.split('-')[0]?.trim() || 'Brak danych', 
                        arrStation: t.route?.split('-')[1]?.trim() || 'Brak danych',
                        duration: t.duration || 'Brak danych',
                        seats: t.seat_count || 1,
                        price: t.total_price !== undefined ? t.total_price : (t.price !== undefined ? t.price : 'Brak danych'),
                        isPast: t.departure_time ? new Date(t.departure_time) < new Date() : false,
                        isCancelled: t.is_cancelled || false
                    }));
                    setTickets(mappedTickets);
                } catch (err) {
                    console.error("Błąd pobierania biletów:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTickets();
        }, [])
    );

    const handleOpenDetails = (ticket: TicketData) => { setSelectedTicket(ticket); setModalVisible(true); };

    const showNotification = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}\n${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleArchiveTicket = (ticketId: string) => {
        const executeCancellation = async () => {
            try {
                const res = await authFetch(`/api/client/reservations/tickets/${ticketId}/cancel`, {
                    method: 'PATCH', 
                });

                if (res.ok) {
                    Animated.parallel([
                        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                        Animated.timing(scaleAnim, { toValue: 0.9, duration: 300, useNativeDriver: true })
                    ]).start(() => {
                        setTickets(prevTickets => prevTickets.map(ticket => ticket.id === ticketId ? { ...ticket, isPast: true } : ticket));
                        opacityAnim.setValue(1);
                        scaleAnim.setValue(1);
                    });
                    showNotification("Sukces", "Bilet został pomyślnie anulowany.");
                } else {
                    console.error("Błąd usuwania biletu, status:", res.status);
                    showNotification("Błąd", "Nie udało się anulować biletu. Spróbuj ponownie.");
                }
            } catch (err) {
                console.error("Błąd sieci podczas usuwania:", err);
                showNotification("Błąd połączenia", "Wystąpił problem z siecią.");
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Czy na pewno chcesz anulować ten bilet? Tej akcji nie można cofnąć.");
            if (confirmed) {
                executeCancellation();
            }
        } else {
            Alert.alert(
                "Anuluj bilet",
                "Czy na pewno chcesz anulować ten bilet? Tej akcji nie można cofnąć.",
                [
                    { text: "Nie", style: "cancel" },
                    { text: "Tak, anuluj", style: "destructive", onPress: executeCancellation }
                ]
            );
        }
    };

    const activeTicket = tickets.find(t => !t.isPast);
    const pastTickets = tickets.filter(t => t.isPast);

    return (
        <SafeAreaView style={styles.safeArea}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#e60000" style={{ flex: 1, justifyContent: 'center' }} />
            ) : (
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.activeSection}>
                        <View style={styles.activeHeader}>
                            <Ionicons name="ticket-outline" size={26} color="#d32f2f" style={{ transform: [{ rotate: '-45deg' }] }} />
                            <Text style={styles.activeTitle}>Active Tickets</Text>
                        </View>

                        {activeTicket ? (
                            <Animated.View style={[styles.ticketWrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
                                <View style={styles.ticketTop}>
                                    <View style={styles.ticketTopRow}>
                                        <Text style={styles.ticketRoute}>{activeTicket.depStation.toUpperCase()} - {activeTicket.arrStation.toUpperCase()}</Text>
                                        <Text style={styles.ticketSeatLabel}>SEAT</Text>
                                    </View>
                                    <View style={styles.ticketTopRow}>
                                        <Text style={styles.ticketTime}>Today, {activeTicket.depTime}</Text>
                                        <View style={styles.seatBadge}>
                                            <Text style={styles.seatBadgeText}>
                                                {activeTicket.seatCount}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.ticketBottom}>
                                    <View style={styles.qrPlaceholderContainer}>
                                        {activeTicket.ticketNumber ? (
                                            <QRCode
                                                value={activeTicket.ticketNumber}
                                                size={120}
                                                color="#111827"
                                                backgroundColor="transparent"
                                            />
                                        ) : (
                                            <Ionicons name="qr-code-outline" size={120} color="#111827" />
                                        )}
                                    </View>
                                    <Text style={styles.scanText}>SCAN WHEN BOARDING</Text>
                                    <View style={styles.dividerContainer}>
                                        <View style={styles.cutoutLeft} />
                                        <View style={styles.dashedLine} />
                                        <View style={styles.cutoutRight} />
                                    </View>
                                    <View style={styles.ticketActions}>
                                        <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => handleOpenDetails(activeTicket)}>
                                            <Text style={styles.viewDetailsText}>View Details</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.closeTicketBtn} onPress={() => handleArchiveTicket(activeTicket.id)}>
                                            <Ionicons name="close" size={26} color="#d32f2f" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Animated.View>
                        ) : (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="ticket" size={48} color="#d1d5db" />
                                <Text style={styles.emptyStateTitle}>No Active Tickets</Text>
                                <Text style={styles.emptyStateSub}>You have cancelled your upcoming trip or have no bookings.</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Travel History</Text>
                    <View style={{ opacity: 0.6 }}>
                        {pastTickets.map(ticket => (
                            <TouchableOpacity key={ticket.id} onPress={() => handleOpenDetails(ticket)}>
                                {/* Używamy nowego, dedykowanego komponentu */}
                                <PastTicketCard ticket={ticket} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
            <ActiveTicketModal visible={modalVisible} onClose={() => setModalVisible(false)} ticket={selectedTicket} />
        </SafeAreaView>
    );
}