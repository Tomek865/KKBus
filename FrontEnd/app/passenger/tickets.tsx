import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import ActiveTicketModal from './ActiveTicketModal';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch } from '../../utils';
import * as SecureStore from 'expo-secure-store';
import GuestLoginModal from './GuestLoginModal';

export interface TicketData {
    id: string;
    ticketNumber: string;
    depTime: string;
    depStation: string;
    arrStation: string;
    seats: string | number;
    status: string;
    isPast: boolean;
    rawDepTime?: string;
}
const ActiveTicketCard = ({ ticket, onViewDetails, onArchiveSuccess }: { ticket: TicketData, onViewDetails: (t: TicketData) => void, onArchiveSuccess: (id: string) => void }) => {
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const showNotification = (title: string, message: string) => {
        if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
        else Alert.alert(title, message);
    };

    const handleArchiveTicket = () => {
        if (ticket.rawDepTime) {
            const depDate = new Date(ticket.rawDepTime);
            const now = new Date();
            const diffHours = (depDate.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (diffHours < 24) {
                showNotification("Niedozwolona operacja", "Zgodnie z regulaminem, bilet można anulować najpóźniej 24 godziny przed wyjazdem.");
                return;
            }
        }
        const executeCancellation = async () => {
            try {
                const res = await authFetch(`/api/client/reservations/tickets/${ticket.id}/cancel`, {
                    method: 'PATCH',
                });

                if (res.ok) {
                    Animated.parallel([
                        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                        Animated.timing(scaleAnim, { toValue: 0.9, duration: 300, useNativeDriver: true })
                    ]).start(() => {
                        onArchiveSuccess(ticket.id);
                    });
                    showNotification("Sukces", "Bilet został pomyślnie anulowany.");
                } else {
                    showNotification("Błąd", "Nie udało się anulować biletu. Spróbuj ponownie.");
                }
            } catch (err) {
                showNotification("Błąd połączenia", "Wystąpił problem z siecią.");
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Czy na pewno chcesz anulować ten bilet? Tej akcji nie można cofnąć.");
            if (confirmed) executeCancellation();
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

    return (
        <Animated.View style={[(styles as any).ticketWrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }], marginBottom: 20 }]}>
            <View style={(styles as any).ticketTop}>
                <View style={(styles as any).ticketTopRow}>
                    <Text style={(styles as any).ticketRoute}>{ticket.depStation.toUpperCase()} - {ticket.arrStation.toUpperCase()}</Text>
                </View>
                <View style={(styles as any).ticketTopRow}>
                    <Text style={(styles as any).ticketTime}>Dzisiaj, {ticket.depTime}</Text>
                </View>
            </View>

            <View style={(styles as any).ticketBottom}>
                <View style={(styles as any).qrPlaceholderContainer}>
                    {ticket.ticketNumber && ticket.ticketNumber !== 'Brak' ? (
                        <QRCode
                            value={ticket.ticketNumber}
                            size={240}
                            color="#111827"
                            backgroundColor="transparent"
                        />
                    ) : (
                        <Ionicons name="qr-code-outline" size={240} color="#111827" />
                    )}
                </View>
                <Text style={(styles as any).scanText}>ZESKANUJ PRZY WEJŚCIU</Text>
                <View style={(styles as any).dividerContainer}>
                    <View style={(styles as any).cutoutLeft} />
                    <View style={(styles as any).dashedLine} />
                    <View style={(styles as any).cutoutRight} />
                </View>
                <View style={(styles as any).ticketActions}>
                    <TouchableOpacity style={(styles as any).viewDetailsBtn} onPress={() => onViewDetails(ticket)}>
                        <Text style={(styles as any).viewDetailsText}>Szczegóły</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={(styles as any).closeTicketBtn} onPress={handleArchiveTicket}>
                        <Ionicons name="close" size={26} color="#d32f2f" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const PastTicketCard = ({ ticket }: { ticket: TicketData }) => {
    const statusNormalized = ticket.status.toLowerCase();

    let statusLabel = 'Zarchiwizowany';
    let statusColor = '#9ca3af';
    let iconName: any = 'checkmark-circle';

    if (statusNormalized.includes('cancel')) {
        statusLabel = 'Anulowany';
        statusColor = '#ef4444';
        iconName = 'close-circle';
    } else if (statusNormalized.includes('realized')) {
        statusLabel = 'Zrealizowany';
        statusColor = '#10b981';
        iconName = 'checkmark-done-circle';
    } else if (statusNormalized.includes('paid')) {
        statusLabel = 'Opłacony';
        statusColor = '#3b82f6';
        iconName = 'checkmark-circle';
    }

    return (
        <View style={(styles as any).pastTicketCard}>
            <View style={(styles as any).pastTicketHeader}>
                <Text style={(styles as any).pastTicketRoute}>
                    {ticket.depStation} - {ticket.arrStation}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
                    {ticket.depTime}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#4b5563', fontWeight: '700' }}>
                        BILETY: {ticket.seats}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={iconName} size={16} color={statusColor} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 14, color: statusColor, fontWeight: '600', textTransform: 'capitalize' }}>
                        {statusLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default function PassengerTickets() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchTickets = async () => {
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
                        return; // Przerywamy dalsze pobieranie
                    }

                    setIsGuest(false);

                    const res = await authFetch('/api/client/profile/tickets');
                    if (!res.ok) {
                        console.error("Błąd pobierania biletów, status HTTP:", res.status);
                        return;
                    }
                    const data = await res.json();

                    const mappedTickets = data.map((t: any) => {
                        const rawTicketStatus = (t.ticketStatus || '').toLowerCase();
                        const rawReservationStatus = (t.reservationStatus || '').toLowerCase();
                        const combinedStatus = rawTicketStatus || rawReservationStatus;

                        const validDateString = t.departureTime ? t.departureTime.replace(' ', 'T') : null;
                        const isTimePast = validDateString ? new Date(validDateString) < new Date() : false;

                        const isCancelled = combinedStatus.includes('cancel');
                        const isRealized = combinedStatus.includes('realized');

                        const isPast = isTimePast || isCancelled || isRealized;

                        let displayStatus = 'Paid';
                        if (isCancelled) displayStatus = 'Cancelled';
                        else if (isRealized || isTimePast) displayStatus = 'Realized';
                        else if (t.ticketStatus) displayStatus = t.ticketStatus;

                        const routeParts = t.route ? t.route.split('-') : [];
                        const depStation = routeParts[0] ? routeParts[0].trim() : 'Brak danych';
                        const arrStation = routeParts[1] ? routeParts[1].trim() : 'Brak danych';
                        const timeOnly = t.departureTime ? (t.departureTime.includes(' ') ? t.departureTime.split(' ')[1] : t.departureTime) : 'Brak danych';

                        return {
                            id: String(t.ticketId || Math.random()),
                            ticketNumber: String(t.reservationNumber || 'Brak'),
                            depTime: timeOnly,
                            rawDepTime: validDateString,
                            depStation: depStation,
                            arrStation: arrStation,
                            seats: t.ticketsSummary || 1,
                            status: displayStatus,
                            isPast: isPast
                        };
                    });

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

    const handleOpenDetails = (ticket: TicketData) => {
        setSelectedTicket(ticket);
        setModalVisible(true);
    };

    const handleArchiveSuccess = (ticketId: string) => {
        setTickets(prevTickets =>
            prevTickets.map(ticket =>
                ticket.id === ticketId ? { ...ticket, isPast: true, status: 'Cancelled' } : ticket
            )
        );
    };
    const activeTickets = tickets.filter(t => !t.isPast);
    const pastTickets = tickets.filter(t => t.isPast);
    if (isGuest) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <GuestLoginModal visible={true} onClose={() => { setIsGuest(false); router.navigate('/passenger'); }} />
            </SafeAreaView>
        );
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#e60000" style={{ flex: 1, justifyContent: 'center' }} />
            ) : (
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.activeSection}>
                        <View style={styles.activeHeader}>
                            <Ionicons name="ticket-outline" size={26} color="#d32f2f" style={{ transform: [{ rotate: '-45deg' }] }} />
                            <Text style={styles.activeTitle}>Aktywne Bilety</Text>
                        </View>

                        {/* Listujemy wszystkie aktywne bilety */}
                        {activeTickets.length > 0 ? (
                            activeTickets.map(ticket => (
                                <ActiveTicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    onViewDetails={handleOpenDetails}
                                    onArchiveSuccess={handleArchiveSuccess}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="ticket" size={48} color="#d1d5db" />
                                <Text style={styles.emptyStateTitle}>Brak Aktywnych Biletów</Text>
                                <Text style={styles.emptyStateSub}>Anulowałeś nadchodzącą podróż lub nie masz żadnych rezerwacji.</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Historia Podróży</Text>
                    <View style={(styles as any).historyContainer}>
                        {pastTickets.map(ticket => (
                            <TouchableOpacity
                                key={ticket.id}
                                onPress={() => handleOpenDetails(ticket)}
                                style={(styles as any).pastTicketWrapper}
                            >
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