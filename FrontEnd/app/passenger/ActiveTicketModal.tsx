import React, { useState, useEffect } from 'react';
import { View, Text, Modal, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { authFetch } from '../../utils';
import { TicketData } from './tickets';

export interface BusDetails { busNumber: string; operator: string; amenities: string[]; }
export interface RouteStop { station: string; time?: string; isPassed: boolean; }
export interface TicketInfo { class: string; reservationNumber: string; seat: string; seatCount: string | number; }
export interface ActiveTicketModalProps { visible: boolean; onClose: () => void; ticket: TicketData | null; }

export default function ActiveTicketModal({ visible, onClose, ticket }: ActiveTicketModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [busDetails, setBusDetails] = useState<BusDetails | null>(null);
    const [routeDetails, setRouteDetails] = useState<RouteStop[]>([]);
    const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);

    useEffect(() => {
        if (visible && ticket) {
            setIsLoading(true);
            
            const fetchJourneyDetails = async () => {
                try {
                    const res = await authFetch(`/api/client/reservations/journey-details/${ticket.ticketNumber}`);
                 
                    if (res.ok) {
                        const data = await res.json();
                        console.log("Journey details data:", data);
                        
                        if (data.busDetails) {
                             setBusDetails({
                                busNumber: data.busDetails.vehicleName || "Brak danych",
                                operator: data.busDetails.operator || "Brak danych",
                                amenities: data.busDetails.amenities || []
                            });
                        } else {
                            setBusDetails(null);
                        }

                        setRouteDetails(data.routeDetails || []);
                        
                        if (data.ticketInfo) {
                            setTicketInfo({
                                class: data.ticketInfo.class || "Standard",
                                reservationNumber: data.ticketInfo.reservationNumber || ticket.ticketNumber,
                                seat: data.ticketInfo.seat || "TBD",
                                seatCount: data.ticketInfo.seatCount !== undefined ? data.ticketInfo.seatCount : 1
                            });
                        } else {
                             setTicketInfo(null);
                        }

                    } else {
                        setBusDetails(null); 
                        setRouteDetails([]);
                        setTicketInfo(null);
                    }
                } catch (error) {
                    console.error("Błąd pobierania szczegółów podróży:", error);
                    setBusDetails(null); 
                    setRouteDetails([]);
                    setTicketInfo(null);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchJourneyDetails();
        } else { 
            setBusDetails(null); 
            setRouteDetails([]); 
            setTicketInfo(null);
        }
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
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#e60000" />
                        <Text style={styles.loadingText}>Fetching journey details...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {busDetails ? (
                            <View style={styles.detailCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.busIconContainer}><Ionicons name="bus" size={24} color="#e60000" /></View>
                                    <View>
                                        <Text style={styles.operatorText}>{busDetails.operator}</Text>
                                        <Text style={styles.busNumberText}>{busDetails.busNumber}</Text>
                                    </View>
                                </View>
                                <View style={styles.amenitiesRow}>
                                    {busDetails.amenities.length > 0 ? busDetails.amenities.map((icon, idx) => (
                                        <View key={idx} style={styles.amenityIcon}>
                                            <Ionicons name={icon as any} size={16} color="#6b7280" />
                                        </View>
                                    )) : <Text style={styles.amenityLabel}>Brak danych o udogodnieniach</Text>}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.detailCard}>
                                <Text style={styles.operatorText}>Brak danych o pojeździe</Text>
                            </View>
                        )}
                        
                        <View style={styles.infoGrid}>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>SEATS</Text>
                                <Text style={styles.infoValue}>
                                    {ticketInfo ? ticketInfo.seatCount : ticket.seats}
                                </Text>
                            </View>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>CLASS</Text>
                                <Text style={styles.infoValue}>{ticketInfo ? ticketInfo.class : 'Standard'}</Text>
                            </View>
                            <View style={[styles.infoBox, { borderRightWidth: 0 }]}>
                                <Text style={styles.infoLabel}>TICKET</Text>
                                <Text style={[styles.infoValue, { fontSize: 13 }]}>
                                    {ticketInfo ? ticketInfo.reservationNumber : ticket.ticketNumber}
                                </Text>
                            </View>
                        </View>

                        {routeDetails.length > 0 ? (
                            <View style={styles.timelineCard}>
                                <Text style={styles.sectionTitle}>Full Route Schedule</Text>
                                {routeDetails.map((stop, index) => (
                                    <View key={index} style={styles.timelineItem}>
                                        <View style={styles.timelineLeft}>
                                            <Text style={[styles.timelineTime, stop.isPassed && styles.textPassed]}>{stop.time || 'Brak'}</Text>
                                        </View>
                                        <View style={styles.timelineCenter}>
                                            <View style={[styles.timelineDot, stop.isPassed ? styles.dotPassed : styles.dotFuture]} />
                                            {index !== routeDetails.length - 1 && (<View style={[styles.timelineLine, stop.isPassed ? styles.linePassed : styles.lineFuture]} />)}
                                        </View>
                                        <View style={styles.timelineRight}>
                                            <Text style={[styles.timelineStation, stop.isPassed && styles.textPassed]}>{stop.station || 'Brak danych'}</Text>
                                            {index === 0 && <Text style={styles.statusLabel}>Departure</Text>}
                                            {index === routeDetails.length - 1 && <Text style={styles.statusLabel}>Final Destination</Text>}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.timelineCard}>
                                <Text style={styles.sectionTitle}>Brak danych o rozkładzie jazdy</Text>
                            </View>
                        )}
                        <View style={styles.footerInfo}>
                            <Ionicons name="information-circle-outline" size={20} color="#9ca3af" />
                            <Text style={styles.footerText}>Please arrive at the platform 15 minutes before departure. Ticket valid only for the selected time.</Text>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
}