import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// TYPES
// ==========================================
export interface BusDetails {
    busNumber: string;
    operator: string;
    amenities: string[];
}

export interface RouteStop {
    station: string;
    time: string;
    isPassed: boolean;
}

interface TicketData {
    id: string;
    ticketNumber: string;
    seatNumber: string;
    depStation: string;
    arrStation: string;
    price: number;
}

interface ActiveTicketModalProps {
    visible: boolean;
    onClose: () => void;
    ticket: TicketData | null;
}

// ==========================================
// MOCK DATA (Do API)
// ==========================================
const MOCK_BUS: BusDetails = {
    busNumber: "A240 / Line 4",
    operator: "KKBus Express", // ZMIANA OPERATORA
    amenities: ['wifi', 'snow', 'flash', 'leaf']
};

const MOCK_ROUTE: RouteStop[] = [
    { station: "Krakow MDA", time: "15:00", isPassed: true },
    { station: "Krakow Balice", time: "15:25", isPassed: false },
    { station: "Chrzanow Glowy", time: "15:55", isPassed: false },
    { station: "Katowice Dworzec", time: "16:25", isPassed: false },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ActiveTicketModal({ visible, onClose, ticket }: ActiveTicketModalProps) {
    // --- STATES ---
    const [isLoading, setIsLoading] = useState(true);
    const [busDetails, setBusDetails] = useState<BusDetails | null>(null);
    const [routeDetails, setRouteDetails] = useState<RouteStop[]>([]);

    // --- API SIMULATION ---
    useEffect(() => {
        if (visible && ticket) {
            setIsLoading(true);
            
            // TODO: BACKEND FETCH
            const fetchJourneyDetails = async () => {
                setTimeout(() => {
                    setBusDetails(MOCK_BUS);
                    setRouteDetails(MOCK_ROUTE);
                    setIsLoading(false);
                }, 700);
            };
            
            fetchJourneyDetails();
        } else {
            setBusDetails(null);
            setRouteDetails([]);
        }
    }, [visible, ticket]);

    if (!ticket) return null;

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Journey Details</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#111" />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#e60000" />
                        <Text style={styles.loadingText}>Fetching journey details...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        {/* 1. BUS & OPERATOR CARD */}
                        {busDetails && (
                            <View style={styles.detailCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.busIconContainer}>
                                        <Ionicons name="bus" size={24} color="#e60000" />
                                    </View>
                                    <View>
                                        <Text style={styles.operatorText}>{busDetails.operator}</Text>
                                        <Text style={styles.busNumberText}>{busDetails.busNumber}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.amenitiesRow}>
                                    {busDetails.amenities.map((icon, idx) => (
                                        <View key={idx} style={styles.amenityIcon}>
                                            <Ionicons name={icon as any} size={16} color="#6b7280" />
                                        </View>
                                    ))}
                                    <Text style={styles.amenityLabel}>Standard Amenities Included</Text>
                                </View>
                            </View>
                        )}

                        {/* 2. SEAT & TICKET INFO */}
                        <View style={styles.infoGrid}>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>SEAT</Text>
                                <Text style={styles.infoValue}>{ticket.seatNumber}</Text>
                            </View>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>CLASS</Text>
                                <Text style={styles.infoValue}>Standard</Text>
                            </View>
                            <View style={[styles.infoBox, { borderRightWidth: 0 }]}>
                                <Text style={styles.infoLabel}>TICKET</Text>
                                <Text style={[styles.infoValue, { fontSize: 14 }]}>{ticket.ticketNumber}</Text>
                            </View>
                        </View>

                        {/* 3. ROUTE TIMELINE */}
                        {routeDetails.length > 0 && (
                            <View style={styles.timelineCard}>
                                <Text style={styles.sectionTitle}>Full Route Schedule</Text>
                                
                                {routeDetails.map((stop, index) => (
                                    <View key={index} style={styles.timelineItem}>
                                        <View style={styles.timelineLeft}>
                                            <Text style={[styles.timelineTime, stop.isPassed && styles.textPassed]}>
                                                {stop.time}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.timelineCenter}>
                                            <View style={[styles.timelineDot, stop.isPassed ? styles.dotPassed : styles.dotFuture]} />
                                            {index !== routeDetails.length - 1 && (
                                                <View style={[styles.timelineLine, stop.isPassed ? styles.linePassed : styles.lineFuture]} />
                                            )}
                                        </View>
                                        
                                        <View style={styles.timelineRight}>
                                            <Text style={[styles.timelineStation, stop.isPassed && styles.textPassed]}>
                                                {stop.station}
                                            </Text>
                                            {index === 0 && <Text style={styles.statusLabel}>Departure</Text>}
                                            {index === routeDetails.length - 1 && <Text style={styles.statusLabel}>Final Destination</Text>}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* 4. FOOTER INFO */}
                        <View style={styles.footerInfo}>
                            <Ionicons name="information-circle-outline" size={20} color="#9ca3af" />
                            <Text style={styles.footerText}>
                                Please arrive at the platform 15 minutes before departure. Ticket valid only for the selected time.
                            </Text>
                        </View>

                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#f4f5f7' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    closeButton: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
    scrollContent: { padding: 20 },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#6b7280', fontWeight: '600' },

    // Card 1: Bus Info
    detailCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    busIconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#fcecec', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    operatorText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
    busNumberText: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    amenitiesRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 15 },
    amenityIcon: { marginRight: 10, backgroundColor: '#f9fafb', padding: 6, borderRadius: 8 },
    amenityLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },

    // Card 2: Grid Info
    infoGrid: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 24, padding: 20, marginBottom: 20 },
    infoBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: '#374151' },
    infoLabel: { fontSize: 10, color: '#9ca3af', fontWeight: 'bold', marginBottom: 5 },
    infoValue: { fontSize: 18, color: '#fff', fontWeight: 'bold' },

    // Card 3: Timeline
    timelineCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 25 },
    timelineItem: { flexDirection: 'row', minHeight: 70 },
    timelineLeft: { width: 50, alignItems: 'flex-start' },
    timelineTime: { fontSize: 14, fontWeight: 'bold', color: '#111' },
    timelineCenter: { width: 30, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
    dotPassed: { backgroundColor: '#e60000' },
    dotFuture: { backgroundColor: '#e5e7eb' },
    timelineLine: { width: 2, position: 'absolute', top: 12, bottom: 0 },
    linePassed: { backgroundColor: '#e60000' },
    lineFuture: { backgroundColor: '#f3f4f6' },
    timelineRight: { flex: 1, paddingLeft: 10, paddingBottom: 25 },
    timelineStation: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
    textPassed: { color: '#9ca3af' },
    statusLabel: { fontSize: 11, color: '#e60000', fontWeight: 'bold', textTransform: 'uppercase' },

    // Footer
    footerInfo: { flexDirection: 'row', padding: 20, alignItems: 'center' },
    footerText: { flex: 1, fontSize: 12, color: '#9ca3af', marginLeft: 10, lineHeight: 18 }
});