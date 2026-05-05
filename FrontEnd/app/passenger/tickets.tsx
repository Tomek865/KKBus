import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TicketCard } from '../../components/passenger/TicketCard';
import ActiveTicketModal from './ActiveTicketModal'; 
import { passengerStyles as styles } from '../src/styles/passengerStyles'; // Dopasuj ścieżkę do projektu!
import { SafeAreaView } from 'react-native-safe-area-context';

interface TicketData {
    id: string;
    ticketNumber: string;
    seatNumber: string;
    depTime: string;
    arrTime: string;
    depStation: string;
    arrStation: string;
    duration: string;
    seats: number;
    price: number;
    isPast: boolean;
}

const MOCK_TICKETS: TicketData[] = [
    { id: 't1', ticketNumber: 'TR-8492-X91', seatNumber: '12A', depTime: "15:00", arrTime: "16:25", depStation: "Krakow", arrStation: "Katowice", duration: "1H 25M", seats: 1, price: 24, isPast: false },
    { id: 't2', ticketNumber: 'TR-1029-Y44', seatNumber: '8C', depTime: "08:15", arrTime: "09:40", depStation: "Katowice Dworzec", arrStation: "Krakow MDA", duration: "1H 25M", seats: 1, price: 24, isPast: true }
];

export default function PassengerTickets() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

    // --- ANIMATIONS ---
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setTimeout(() => {
            setTickets(MOCK_TICKETS);
            setIsLoading(false);
        }, 600);
    }, []);

    const handleOpenDetails = (ticket: TicketData) => {
        setSelectedTicket(ticket);
        setModalVisible(true);
    };

    const handleArchiveTicket = (ticketId: string) => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true, 
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9, 
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setTickets(prevTickets => 
                prevTickets.map(ticket => 
                    ticket.id === ticketId ? { ...ticket, isPast: true } : ticket
                )
            );
            
            opacityAnim.setValue(1);
            scaleAnim.setValue(1);
        });
    };

    const activeTicket = tickets.find(t => !t.isPast);
    const pastTickets = tickets.filter(t => t.isPast);

    return (
        <SafeAreaView style={styles.safeArea}>
                            {isLoading ? (
                    <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* --- SEKCJA AKTYWNYCH BILETÓW --- */}
                        <View style={styles.activeSection}>
                            <View style={styles.activeHeader}>
                                <Ionicons name="ticket-outline" size={26} color="#d32f2f" style={{ transform: [{ rotate: '-45deg' }] }} />
                                <Text style={styles.activeTitle}>Active Tickets</Text>
                            </View>

                            {activeTicket ? (
                                <Animated.View style={[styles.ticketWrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
                                    <View style={styles.ticketTop}>
                                        <View style={styles.ticketTopRow}>
                                            <Text style={styles.ticketRoute}>
                                                {activeTicket.depStation.toUpperCase()} {activeTicket.arrStation.toUpperCase()}
                                            </Text>
                                            <Text style={styles.ticketSeatLabel}>SEAT</Text>
                                        </View>
                                        <View style={styles.ticketTopRow}>
                                            <Text style={styles.ticketTime}>Today, {activeTicket.depTime}</Text>
                                            <View style={styles.seatBadge}>
                                                <Text style={styles.seatBadgeText}>{activeTicket.seatNumber}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.ticketBottom}>
                                        <View style={styles.qrPlaceholderContainer}>
                                            <Ionicons name="qr-code-outline" size={120} color="#111827" />
                                        </View>
                                        
                                        <Text style={styles.scanText}>SCAN WHEN BOARDING</Text>

                                        <View style={styles.dividerContainer}>
                                            <View style={styles.cutoutLeft} />
                                            <View style={styles.dashedLine} />
                                            <View style={styles.cutoutRight} />
                                        </View>

                                        <View style={styles.ticketActions}>
                                            <TouchableOpacity 
                                                style={styles.viewDetailsBtn}
                                                onPress={() => handleOpenDetails(activeTicket)}
                                            >
                                                <Text style={styles.viewDetailsText}>View Details</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.closeTicketBtn}
                                                onPress={() => handleArchiveTicket(activeTicket.id)}
                                            >
                                                <Ionicons name="close" size={26} color="#d32f2f" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Animated.View>
                            ) : (
                                /* --- EMPTY STATE Z SCREENSHOTU --- */
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="ticket" size={48} color="#d1d5db" />
                                    <Text style={styles.emptyStateTitle}>No Active Tickets</Text>
                                    <Text style={styles.emptyStateSub}>You have cancelled your upcoming trip or have no bookings.</Text>
                                </View>
                            )}
                        </View>

                        {/* --- TRAVEL HISTORY --- */}
                        <Text style={styles.sectionTitle}>Travel History</Text>
                        <View style={{ opacity: 0.6 }}>
                            {pastTickets.map(ticket => (
                                <TouchableOpacity 
                                    key={ticket.id} 
                                    style={{ marginBottom: 15 }}
                                    onPress={() => handleOpenDetails(ticket)}
                                >
                                    <TicketCard {...ticket} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

            {/* --- MODAL ZE SZCZEGÓŁAMI TRASY --- */}
            <ActiveTicketModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                ticket={selectedTicket}
            />

        </SafeAreaView>
    );
}