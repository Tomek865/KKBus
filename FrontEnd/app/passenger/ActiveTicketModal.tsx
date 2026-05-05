import React, { useState, useEffect } from 'react';
import { View, Text, Modal, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { passengerStyles as styles } from '../src/styles/passengerStyles';


// INTERFACES & MOCKS (same as before)
export interface BusDetails { busNumber: string; operator: string; amenities: string[]; }
export interface RouteStop { station: string; time: string; isPassed: boolean; }
interface TicketData { id: string; ticketNumber: string; seatNumber: string; depStation: string; arrStation: string; price: number; }
interface ActiveTicketModalProps { visible: boolean; onClose: () => void; ticket: TicketData | null; }

const MOCK_BUS: BusDetails = { busNumber: "A240 / Line 4", operator: "KKBus Express", amenities: ['wifi', 'snow', 'flash', 'leaf'] };
const MOCK_ROUTE: RouteStop[] = [
    { station: "Krakow MDA", time: "15:00", isPassed: true }, { station: "Krakow Balice", time: "15:25", isPassed: false },
    { station: "Chrzanow Glowy", time: "15:55", isPassed: false }, { station: "Katowice Dworzec", time: "16:25", isPassed: false },
];

export default function ActiveTicketModal({ visible, onClose, ticket }: ActiveTicketModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [busDetails, setBusDetails] = useState<BusDetails | null>(null);
    const [routeDetails, setRouteDetails] = useState<RouteStop[]>([]);

    useEffect(() => {
        if (visible && ticket) {
            setIsLoading(true);
            setTimeout(() => { setBusDetails(MOCK_BUS); setRouteDetails(MOCK_ROUTE); setIsLoading(false); }, 700);
        } else { setBusDetails(null); setRouteDetails([]); }
    }, [visible, ticket]);

    if (!ticket) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainerAlt}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Journey Details</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtnIcon}><Ionicons name="close" size={24} color="#111" /></TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#e60000" /><Text style={styles.loadingText}>Fetching journey details...</Text></View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {busDetails && (
                            <View style={styles.detailCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.busIconContainer}><Ionicons name="bus" size={24} color="#e60000" /></View>
                                    <View><Text style={styles.operatorText}>{busDetails.operator}</Text><Text style={styles.busNumberText}>{busDetails.busNumber}</Text></View>
                                </View>
                                <View style={styles.amenitiesRow}>
                                    {busDetails.amenities.map((icon, idx) => (<View key={idx} style={styles.amenityIcon}><Ionicons name={icon as any} size={16} color="#6b7280" /></View>))}
                                    <Text style={styles.amenityLabel}>Standard Amenities Included</Text>
                                </View>
                            </View>
                        )}
                        <View style={styles.infoGrid}>
                            <View style={styles.infoBox}><Text style={styles.infoLabel}>SEAT</Text><Text style={styles.infoValue}>{ticket.seatNumber}</Text></View>
                            <View style={styles.infoBox}><Text style={styles.infoLabel}>CLASS</Text><Text style={styles.infoValue}>Standard</Text></View>
                            <View style={[styles.infoBox, { borderRightWidth: 0 }]}><Text style={styles.infoLabel}>TICKET</Text><Text style={[styles.infoValue, { fontSize: 14 }]}>{ticket.ticketNumber}</Text></View>
                        </View>

                        {routeDetails.length > 0 && (
                            <View style={styles.timelineCard}>
                                <Text style={styles.sectionTitle}>Full Route Schedule</Text>
                                {routeDetails.map((stop, index) => (
                                    <View key={index} style={styles.timelineItem}>
                                        <View style={styles.timelineLeft}><Text style={[styles.timelineTime, stop.isPassed && styles.textPassed]}>{stop.time}</Text></View>
                                        <View style={styles.timelineCenter}>
                                            <View style={[styles.timelineDot, stop.isPassed ? styles.dotPassed : styles.dotFuture]} />
                                            {index !== routeDetails.length - 1 && (<View style={[styles.timelineLine, stop.isPassed ? styles.linePassed : styles.lineFuture]} />)}
                                        </View>
                                        <View style={styles.timelineRight}>
                                            <Text style={[styles.timelineStation, stop.isPassed && styles.textPassed]}>{stop.station}</Text>
                                            {index === 0 && <Text style={styles.statusLabel}>Departure</Text>}
                                            {index === routeDetails.length - 1 && <Text style={styles.statusLabel}>Final Destination</Text>}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                        <View style={styles.footerInfo}><Ionicons name="information-circle-outline" size={20} color="#9ca3af" /><Text style={styles.footerText}>Please arrive at the platform 15 minutes before departure. Ticket valid only for the selected time.</Text></View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
}