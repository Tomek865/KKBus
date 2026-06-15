import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

export default function AdminBooking() {
    const [clients, setClients] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedClient, setSelectedClient] = useState('');
    const [selectedTrip, setSelectedTrip] = useState('');
    const [fromStation, setFromStation] = useState('');
    const [toStation, setToStation] = useState('');
    
    const [tickets, setTickets] = useState({ adult: 1, student: 0, child: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, tripsRes, stationsRes] = await Promise.all([
                    authFetch('/api/admin/users'),
                    authFetch('/api/admin/fleet/'),
                    authFetch('/api/admin/fleet/stations')
                ]);

                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    // Filter passengers only
                    setClients(usersData.filter((u: any) => u.role === 'Passenger'));
                }
                
                if (tripsRes.ok) {
                    const tripsData = await tripsRes.json();
                    // Show only planned trips
                    setTrips(tripsData.filter((t: any) => t.status === 'Planned'));
                }

                if (stationsRes.ok) {
                    const stationsData = await stationsRes.json();
                    setStations(stationsData); 
                }
            } catch (error) {
                console.error("Error fetching booking data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const updateTicket = (type: 'adult' | 'student' | 'child', delta: number) => {
        setTickets(prev => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta)
        }));
    };

    const handleBooking = async () => {
        const totalTickets = tickets.adult + tickets.student + tickets.child;
        
        if (!selectedClient || !selectedTrip || !fromStation || !toStation) {
            showAlert("Error", "Please fill in all fields (Client, Trip, Stations).");
            return;
        }

        if (totalTickets === 0) {
            showAlert("Error", "Please select at least one ticket.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Note: We will create this endpoint in the backend in the next step
            const response = await authFetch('/api/admin/management/reservations', {
                method: 'POST',
                body: JSON.stringify({
                    client_id: parseInt(selectedClient.replace('C_', '')),
                    trip_id: parseInt(selectedTrip),
                    from_station: fromStation.trim(),
                    to_station: toStation.trim(),
                    tickets
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert("Success", "The ticket has been successfully booked for the client.");
                setSelectedClient('');
                setSelectedTrip('');
                setFromStation('');
                setToStation('');
                setTickets({ adult: 1, student: 0, child: 0 });
            } else {
                showAlert("Error", data.error || data.message || "Error during booking.");
            }
        } catch (error) {
            showAlert("Error", "Failed to connect to the server.");
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
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.title}>Manual Ticket Booking</Text>
                    <Text style={styles.subtitle}>OFFICE RESERVATION SYSTEM</Text>
                </View>
            </View>

            <View style={[styles.card, { maxWidth: 800 }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Booking Details</Text>

                <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>SELECT CLIENT</Text>
                        <select 
                            style={styles.nativeSelectElement as any}
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                        >
                            <option value="">-- Select passenger --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                            ))}
                        </select>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>SELECT TRIP</Text>
                        <select 
                            style={styles.nativeSelectElement as any}
                            value={selectedTrip}
                            onChange={(e) => setSelectedTrip(e.target.value)}
                        >
                            <option value="">-- Select scheduled trip --</option>
                            {trips.map(t => {
                                const d = new Date(t.departureTime);
                                const formattedDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth()+1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                return (
                                    <option key={t.id} value={t.id}>{t.route} | Departure: {formattedDate}</option>
                                )
                            })}
                        </select>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>DEPARTURE STATION</Text>
                        <select 
                            style={styles.nativeSelectElement as any}
                            value={fromStation}
                            onChange={(e) => setFromStation(e.target.value)}
                        >
                            <option value="">-- Select station --</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>ARRIVAL STATION</Text>
                        <select 
                            style={styles.nativeSelectElement as any}
                            value={toStation}
                            onChange={(e) => setToStation(e.target.value)}
                        >
                            <option value="">-- Select station --</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </View>
                </View>

                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: COLORS.dark }}>Tickets</Text>
                
                <View style={{ gap: 15, marginBottom: 30 }}>
                    {[
                        { key: 'adult', label: 'Standard Ticket', type: 'adult' as const },
                        { key: 'student', label: 'Student Ticket (-51%)', type: 'student' as const },
                        { key: 'child', label: 'Child Ticket (Free)', type: 'child' as const }
                    ].map((item) => (
                        <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
                            <Text style={{ fontWeight: '600', color: COLORS.dark }}>{item.label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <TouchableOpacity onPress={() => updateTicket(item.type, -1)} style={{ backgroundColor: '#e5e7eb', borderRadius: 8, padding: 5 }}>
                                    <Ionicons name="remove" size={20} color={COLORS.dark} />
                                </TouchableOpacity>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', width: 25, textAlign: 'center' }}>{tickets[item.type]}</Text>
                                <TouchableOpacity onPress={() => updateTicket(item.type, 1)} style={{ backgroundColor: COLORS.red, borderRadius: 8, padding: 5 }}>
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity 
                    style={[styles.primaryBtn, { alignSelf: 'flex-start', paddingHorizontal: 30, paddingVertical: 15 }]} 
                    onPress={handleBooking}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Book Ticket</Text>}
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
}