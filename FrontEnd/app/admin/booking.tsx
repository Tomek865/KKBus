import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

export default function AdminBooking() {
    const [clients, setClients] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [routeStops, setRouteStops] = useState<any[]>([]);
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
                console.error("Błąd pobierania danych rezerwacji:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchRouteStops = async () => {
            if (!selectedTrip) {
                setRouteStops([]);
                return;
            }

            const trip = trips.find(t => t.id.toString() === selectedTrip);
            if (trip && trip.route_id) {
                try {
                    const response = await authFetch(`/api/admin/fleet/routes/${trip.route_id}/stations`);
                    if (response.ok) {
                        const data = await response.json();
                        setRouteStops(data);
                    }
                } catch (error) {
                    console.error("Błąd pobierania stacji dla trasy:", error);
                }
            }
        };

        fetchRouteStops();
    }, [selectedTrip, trips]);

    const updateTicket = (type: 'adult' | 'student' | 'child', delta: number) => {
        setTickets(prev => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta)
        }));
    };

    const handleBooking = async () => {
        const totalTickets = tickets.adult + tickets.student + tickets.child;

        if (!selectedClient || !selectedTrip || !fromStation || !toStation) {
            showAlert("Błąd", "Proszę wypełnić wszystkie pola (Klient, Kurs, Stacje).");
            return;
        }

        if (totalTickets === 0) {
            showAlert("Błąd", "Proszę wybrać co najmniej jeden bilet.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/admin/management/reservations', {
                method: 'POST',
                body: JSON.stringify({
                    client_id: parseInt(selectedClient.replace('C_', '')),
                    trip: {
                        id: parseInt(selectedTrip),
                        from: fromStation.trim(),
                        to: toStation.trim()
                    },
                    tickets
                })
            });
            console.log("Odpowiedź rezerwacji:", response);

            const data = await response.json();

            if (response.ok) {
                showAlert("Sukces", "Bilet został pomyślnie zarezerwowany dla klienta.");
                // Resetowanie formularza
                setSelectedClient('');
                setSelectedTrip('');
                setFromStation('');
                setToStation('');
                setTickets({ adult: 1, student: 0, child: 0 });
            } else {
                showAlert("Błąd", data.error || data.message || "Błąd podczas rezerwacji.");
            }
        } catch (error) {
            showAlert("Błąd", "Nie udało się połączyć z serwerem.");
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
                    <Text style={styles.title}>Ręczna Rezerwacja Biletów</Text>
                    <Text style={styles.subtitle}>SYSTEM REZERWACJI BIUROWEJ</Text>
                </View>
            </View>

            <View style={[styles.card, { maxWidth: 800 }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Szczegóły Rezerwacji</Text>

                <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>WYBIERZ KLIENTA</Text>
                        <select
                            style={styles.nativeSelectElement as any}
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                        >
                            <option value="">-- Wybierz pasażera --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                            ))}
                        </select>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>WYBIERZ KURS</Text>
                        <select
                            style={styles.nativeSelectElement as any}
                            value={selectedTrip}
                            onChange={(e) => setSelectedTrip(e.target.value)}
                        >
                            <option value="">-- Wybierz zaplanowany kurs --</option>
                            {trips.map(t => {
                                const d = new Date(t.departureTime);
                                const formattedDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                return (
                                    <option key={t.id} value={t.id}>{t.route} | Odjazd: {formattedDate}</option>
                                )
                            })}
                        </select>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>STACJA POCZĄTKOWA</Text>
                        <select
                            style={styles.nativeSelectElement as any}
                            value={fromStation}
                            onChange={(e) => setFromStation(e.target.value)}
                        >
                            <option value="">-- Wybierz stację --</option>
                            {/* ZMIANA: mapujemy po routeStops zamiast stations */}
                            {routeStops.map(s => (
                                <option key={s.id} value={s.name}>{s.orderOnRoute}. {s.name}</option>
                            ))}
                        </select>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>STACJA KOŃCOWA</Text>
                        <select
                            style={styles.nativeSelectElement as any}
                            value={toStation}
                            onChange={(e) => setToStation(e.target.value)}
                        >
                            <option value="">-- Wybierz stację --</option>
                            {/* ZMIANA: mapujemy po routeStops zamiast stations */}
                            {routeStops.map(s => (
                                <option key={s.id} value={s.name}>{s.orderOnRoute}. {s.name}</option>
                            ))}
                        </select>
                    </View>
                </View>

                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: COLORS.dark }}>Bilety</Text>

                <View style={{ gap: 15, marginBottom: 30 }}>
                    {[
                        { key: 'adult', label: 'Bilet Normalny', type: 'adult' as const },
                        { key: 'student', label: 'Bilet Studencki (-30%)', type: 'student' as const },
                        { key: 'child', label: 'Bilet Dziecięcy (Bezpłatny)', type: 'child' as const }
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
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Rezerwuj Bilet</Text>}
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
}