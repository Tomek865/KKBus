import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { TicketCard } from '../../components/passenger/TicketCard';

// ==========================================
// TYPES & MOCKS (Zarys pod backend)
// ==========================================
interface TicketData {
    id: string;
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
    { id: 't1', depTime: "14:20", arrTime: "15:45", depStation: "Krakow MDA", arrStation: "Katowice Dworzec", duration: "1H 25M", seats: 1, price: 24, isPast: false },
    { id: 't2', depTime: "08:15", arrTime: "09:40", depStation: "Katowice Dworzec", arrStation: "Krakow MDA", duration: "1H 25M", seats: 1, price: 24, isPast: true }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function PassengerTickets() {
    // --- STATES ---
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ==========================================
    // API / BACKEND CALLS
    // ==========================================
    useEffect(() => {
        const fetchTickets = async () => {
            // TODO: BACKEND FETCH - Pobieranie zapisanych biletów użytkownika
            // Przykład: const response = await fetch('/api/user/tickets'); const data = await response.json();
            setTimeout(() => {
                setTickets(MOCK_TICKETS);
                setIsLoading(false);
            }, 600);
        };
        fetchTickets();
    }, []);

    // ==========================================
    // HELPERS
    // ==========================================
    const upcomingTickets = tickets.filter(t => !t.isPast);
    const pastTickets = tickets.filter(t => t.isPast);

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>My Tickets</Text>

                <Text style={styles.sectionTitle}>Upcoming Journeys</Text>
                <TicketCard
                    depTime="14:20" arrTime="15:45"
                    depStation="Krakow MDA" arrStation="Katowice Dworzec"
                    duration="1H 25M" seats={1} price={24}
                />

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Travel History</Text>
                <View style={{ opacity: 0.6 }}>
                    {pastTickets.length === 0 ? (
                        <Text style={styles.emptyText}>No past journeys</Text>
                    ) : (
                        pastTickets.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                depTime={ticket.depTime} arrTime={ticket.arrTime}
                                depStation={ticket.depStation} arrStation={ticket.arrStation}
                                duration={ticket.duration} seats={ticket.seats} price={ticket.price}
                            />
                        ))
                    )}
                </View>
            </>
                )}
        </ScrollView>
        </SafeAreaView >
    );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 25 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, textTransform: 'uppercase' },
    emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 20 }
});