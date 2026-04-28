import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TicketCard } from '../../components/passenger/TicketCard';
import ActiveTicketModal from './ActiveTicketModal'; // <-- Import Twojego nowego modala

// ==========================================
// TYPES & MOCKS
// ==========================================
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
    { 
        id: 't1', 
        ticketNumber: 'TR-8492-X91',
        seatNumber: '12A',
        depTime: "15:00", 
        arrTime: "16:25", 
        depStation: "Krakow", 
        arrStation: "Katowice", 
        duration: "1H 25M", 
        seats: 1, 
        price: 24, 
        isPast: false 
    },
    { 
        id: 't2', 
        ticketNumber: 'TR-1029-Y44',
        seatNumber: '8C',
        depTime: "08:15", 
        arrTime: "09:40", 
        depStation: "Katowice Dworzec", 
        arrStation: "Krakow MDA", 
        duration: "1H 25M", 
        seats: 1, 
        price: 24, 
        isPast: true 
    }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function PassengerTickets() {
    // --- STATES ---
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Sterowanie modalem szczegółów
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

    // --- API SIMULATION ---
    useEffect(() => {
        const fetchTickets = async () => {
            // TODO: BACKEND FETCH - Pobieranie biletów
            setTimeout(() => {
                setTickets(MOCK_TICKETS);
                setIsLoading(false);
            }, 600);
        };
        fetchTickets();
    }, []);

    // --- HANDLERS ---
    const handleOpenDetails = (ticket: TicketData) => {
        setSelectedTicket(ticket);
        setModalVisible(true);
    };

    const activeTicket = tickets.find(t => !t.isPast);
    const pastTickets = tickets.filter(t => t.isPast);

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                {isLoading ? (
                    <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* --- AKTYWNY BILET NA GÓRZE --- */}
                        {activeTicket && (
                            <View style={styles.activeSection}>
                                <View style={styles.activeHeader}>
                                    <Ionicons name="ticket-outline" size={26} color="#d32f2f" style={{ transform: [{ rotate: '-45deg' }] }} />
                                    <Text style={styles.activeTitle}>Active Tickets</Text>
                                </View>

                                <View style={styles.ticketWrapper}>
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
                                            <TouchableOpacity style={styles.closeBtn}>
                                                <Ionicons name="close" size={26} color="#d32f2f" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

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
            </ScrollView>

            {/* --- MODAL ZE SZCZEGÓŁAMI TRASY --- */}
            <ActiveTicketModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                ticket={selectedTicket}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    activeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    activeTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginLeft: 10, letterSpacing: -0.5 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    activeSection: { marginBottom: 40 },

    ticketWrapper: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
    ticketTop: { backgroundColor: '#d32f2f', padding: 24 },
    ticketTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 },
    ticketRoute: { color: '#ffcccc', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    ticketSeatLabel: { color: '#ffcccc', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    ticketTime: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    seatBadge: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
    seatBadgeText: { color: '#d32f2f', fontSize: 22, fontWeight: '900' },
    ticketBottom: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 30, paddingBottom: 24 },
    qrPlaceholderContainer: { padding: 20, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 32, marginBottom: 25, backgroundColor: '#fafafa' },
    scanText: { color: '#9ca3af', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 25, position: 'relative' },
    cutoutLeft: { position: 'absolute', left: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f4f5f7', zIndex: 2 },
    dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', marginHorizontal: 25 },
    cutoutRight: { position: 'absolute', right: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f4f5f7', zIndex: 2 },
    ticketActions: { flexDirection: 'row', width: '100%', paddingHorizontal: 24, justifyContent: 'space-between' },
    viewDetailsBtn: { flex: 1, backgroundColor: '#111827', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginRight: 15 },
    viewDetailsText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    closeBtn: { width: 60, height: 60, backgroundColor: '#fef2f2', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});