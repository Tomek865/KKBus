import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

const YEARS = [2023, 2024, 2025, 2026, 2027];
const MONTHS = [
    { label: 'Jan', value: 1 }, { label: 'Feb', value: 2 },
    { label: 'Mar', value: 3 }, { label: 'Apr', value: 4 },
    { label: 'May', value: 5 }, { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 }, { label: 'Aug', value: 8 },
    { label: 'Sep', value: 9 }, { label: 'Oct', value: 10 },
    { label: 'Nov', value: 11 }, { label: 'Dec', value: 12 }
];

export default function AdminReports() {
    const [reportData, setReportData] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [tripRevenues, setTripRevenues] = useState<any[]>([]);

    // Dane do filtrów
    const [drivers, setDrivers] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- STANY: RAPORTY Z REZERWACJI ---
    const [resModalVisible, setResModalVisible] = useState(false);
    const [resType, setResType] = useState<'monthly' | 'annual'>('monthly');
    const [resYear, setResYear] = useState<number>(new Date().getFullYear());
    const [resMonth, setResMonth] = useState<number>(new Date().getMonth() + 1);
    const [isGeneratingRes, setIsGeneratingRes] = useState(false);

    // --- STANY: RAPORTY Z KURSÓW ---
    const [tripModalVisible, setTripModalVisible] = useState(false);
    const [tripType, setTripType] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
    const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
    const [tripWeek, setTripWeek] = useState('');
    const [tripMonth, setTripMonth] = useState<number>(new Date().getMonth() + 1);
    const [tripYear, setTripYear] = useState<number>(new Date().getFullYear());
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [selectedBusId, setSelectedBusId] = useState<string>('');
    const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);

    useEffect(() => {
        const fetchReportsAndFilters = async () => {
            setLoading(true);
            try {
                // Bezpieczna funkcja pomocnicza - zapobiega zamrożeniu ekranu przy braku endpointu
                const safeFetch = async (url: string) => {
                    try {
                        const res = await authFetch(url);
                        if (!res || !res.ok) return null;
                        return await res.json();
                    } catch (error) {
                        console.warn(`Brak dostępu lub błąd na endpoincie: ${url}`);
                        return null;
                    }
                };

                const [finData, stats, routeRevenueData, driversData, busesData] = await Promise.all([
                    safeFetch('/api/admin/reports/financial'),
                    safeFetch('/api/admin/stats'),
                    safeFetch('/api/admin/reports/route-revenue'),
                    safeFetch('/api/admin/fleet/drivers'),
                    safeFetch('/api/admin/fleet/buses')
                ]);

                if (finData) {
                    setReportData(finData);
                    setTripRevenues(finData.tripRevenues || []);
                }
                if (routeRevenueData) {
                    setTripRevenues(prev => [...prev, ...routeRevenueData]);
                }
                if (stats) setStatsData(stats);

                // Przypisanie filtrów (jeśli istnieją na backendzie)
                setDrivers(Array.isArray(driversData) ? driversData : []);
                setBuses(Array.isArray(busesData) ? busesData : []);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportsAndFilters();
    }, []);

    const showNotification = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}\n${message}`);
        } else {
            setTimeout(() => { Alert.alert(title, message); }, 100);
        }
    };

    const handlePDFDownload = async (response: Response, filename: string) => {
        try {
            // 1. Odbieramy odpowiedź z serwera jako surowy plik binarny (Blob)
            const blob = await response.blob();

            // 2. Tworzymy tymczasowy link URL w pamięci przeglądarki
            const url = window.URL.createObjectURL(blob);

            // 3. Tworzymy niewidzialny tag <a> (HTML)
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; // Atrybut download wymusza pobranie na dysk zamiast otwierania w nowej karcie

            // 4. Dodajemy do strony, "klikamy" i natychmiast sprzątamy
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Zwalniamy pamięć

            showNotification("Sukces", "Raport PDF został pobrany!");
        } catch (error) {
            console.error("Błąd podczas przetwarzania pliku PDF:", error);
            showNotification("Błąd", "Nie udało się zapisać pliku na dysku.");
        }
    };

    const handleGenerateReservationReport = async () => {
        setResModalVisible(false);
        setIsGeneratingRes(true);
        try {
            const url = `/api/admin/reports/reservations?type=${resType}&year=${resYear}` + (resType === 'monthly' ? `&month=${resMonth}` : '');

            // WAŻNE: Odbieramy pełny obiekt Response
            const response = await authFetch(url, { method: 'GET' });

            if (response.ok) {
                const filename = `Reservations_${resYear}_${resType}.pdf`;
                await handlePDFDownload(response, filename);
            } else {
                showNotification("Error", "Failed to generate reservation report.");
            }
        } catch (error) {
            showNotification("Network Error", "Could not connect to the server.");
        } finally {
            setIsGeneratingRes(false);
        }
    };

    const handleGenerateTripReport = async () => {
        setTripModalVisible(false);
        setIsGeneratingTrip(true);
        try {
            let url = `/api/admin/reports/trips?type=${tripType}`;

            if (tripType === 'daily') url += `&date=${tripDate}`;
            if (tripType === 'weekly') url += `&week=${tripWeek}`;
            if (tripType === 'monthly') url += `&year=${tripYear}&month=${tripMonth}`;
            if (tripType === 'annual') url += `&year=${tripYear}`;
            if (selectedDriverId) url += `&driverId=${selectedDriverId}`;
            if (selectedBusId) url += `&busId=${selectedBusId}`;

            const response = await authFetch(url, { method: 'GET' });

            if (response.ok) {
                const filename = `Trips_${tripType}_Report.pdf`;
                await handlePDFDownload(response, filename);
            } else {
                showNotification("Error", "Failed to generate trip report.");
            }
        } catch (error) {
            showNotification("Network Error", "Could not connect to the server.");
        } finally {
            setIsGeneratingTrip(false);
        }
    };


    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Data & Reports Center</Text>
                <Text style={styles.subtitle}>GENERATE REQUIRED SYSTEM REPORTS</Text>
            </View>

            {/* SEKCJA Z PRZYCISKAMI EKSPORTU */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: COLORS.dark }}>Export Documents</Text>
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>

                {/* 7. RAPORT Z REZERWACJI */}
                <TouchableOpacity
                    style={[styles.card, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 20, borderColor: COLORS.blue, borderWidth: 1 }]}
                    onPress={() => setResModalVisible(true)}
                    disabled={isGeneratingRes}
                >
                    <View style={[localStyles.iconWrapperBlue, { width: 50, height: 50, borderRadius: 12 }]}>
                        {isGeneratingRes ? <ActivityIndicator color={COLORS.blue} /> : <Ionicons name="ticket-outline" size={24} color={COLORS.blue} />}
                    </View>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Reservation Reports</Text>
                        <Text style={{ fontSize: 12, color: COLORS.grayText }}>Monthly and annual bookings</Text>
                    </View>
                </TouchableOpacity>

                {/* 8. RAPORT Z KURSÓW */}
                <TouchableOpacity
                    style={[styles.card, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 20, borderColor: COLORS.red, borderWidth: 1 }]}
                    onPress={() => setTripModalVisible(true)}
                    disabled={isGeneratingTrip}
                >
                    <View style={[localStyles.iconWrapperRed, { width: 50, height: 50, borderRadius: 12 }]}>
                        {isGeneratingTrip ? <ActivityIndicator color={COLORS.red} /> : <Ionicons name="bus-outline" size={24} color={COLORS.red} />}
                    </View>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Trip & Fleet Reports</Text>
                        <Text style={{ fontSize: 12, color: COLORS.grayText }}>Passengers, fuel, specific buses/drivers</Text>
                    </View>
                </TouchableOpacity>

            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: COLORS.dark }}>Current Month Summary (MTD)</Text>
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperGreen}><Ionicons name="cash-outline" size={28} color={COLORS.green} /></View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{reportData?.ticketSales || '0'} PLN</Text>
                    <Text style={styles.subtitle}>Ticket Sales</Text>
                </View>
                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperRed}><Ionicons name="water-outline" size={28} color={COLORS.red} /></View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{reportData?.fuelCosts || '0'} PLN</Text>
                    <Text style={styles.subtitle}>Fuel Costs</Text>
                </View>
                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperBlue}><Ionicons name="people-outline" size={28} color={COLORS.blue} /></View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{statsData?.passengers || '0'}</Text>
                    <Text style={styles.subtitle}>Total Passengers</Text>
                </View>
            </View>

            {/* ORYGINALNE PODSUMOWANIA KTÓRE MIAŁY ZOSTAĆ NIENARUSZONE */}
            <View style={{ flexDirection: 'row', gap: 20 }}>
                <View style={[styles.card, { flex: 1 }]}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Monthly P&L Summary</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                        <Text style={{ color: COLORS.grayText, fontWeight: '500' }}>Gross Revenue</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{reportData?.grossRevenue || '0'} PLN</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                        <Text style={{ color: COLORS.grayText, fontWeight: '500' }}>Operating Costs</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: COLORS.red }}>- {reportData?.operatingCosts || '0'} PLN</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: COLORS.grayBorder, marginTop: 10, paddingTop: 15 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Net Profit</Text>
                        <Text style={{ fontWeight: 'bold', color: reportData?.netProfit < 0 ? COLORS.red : COLORS.green, fontSize: 20 }}>
                            {reportData?.netProfit || '0'} PLN
                        </Text>
                    </View>
                </View>

                <View style={[styles.card, { flex: 2 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Revenue by Trip</Text>
                    </View>

                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { flex: 2 }]}>ROUTE</Text>
                        <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>REVENUE</Text>
                    </View>

                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                        {tripRevenues.map((trip: any, index: number) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.cell, { flex: 2, fontWeight: '500' }]}>{trip.routeName}</Text>
                                <Text style={[styles.cell, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: COLORS.green }]}>
                                    {trip.totalRevenue} PLN
                                </Text>
                            </View>
                        ))}
                        {tripRevenues.length === 0 && (
                            <Text style={{ textAlign: 'center', color: COLORS.grayText, marginTop: 20, fontStyle: 'italic' }}>No route data available.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* MODAL 1: RAPORTY Z REZERWACJI */}
            <Modal visible={resModalVisible} animationType="slide" transparent={true}>
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        <View style={localStyles.modalHeader}>
                            <Text style={localStyles.modalTitle}>Reservation Report</Text>
                            <TouchableOpacity onPress={() => setResModalVisible(false)}><Ionicons name="close" size={24} color="#111" /></TouchableOpacity>
                        </View>

                        <Text style={localStyles.sectionLabel}>REPORT TYPE</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            <TouchableOpacity style={[localStyles.typeBtn, resType === 'monthly' && localStyles.typeBtnActive]} onPress={() => setResType('monthly')}>
                                <Text style={[localStyles.typeText, resType === 'monthly' && localStyles.typeTextActive]}>Monthly</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[localStyles.typeBtn, resType === 'annual' && localStyles.typeBtnActive]} onPress={() => setResType('annual')}>
                                <Text style={[localStyles.typeText, resType === 'annual' && localStyles.typeTextActive]}>Annual</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={localStyles.sectionLabel}>YEAR</Text>
                        <View style={localStyles.pickerRow}>
                            {YEARS.map(year => (
                                <TouchableOpacity key={year} style={[localStyles.pickerItem, resYear === year && localStyles.pickerItemActive]} onPress={() => setResYear(year)}>
                                    <Text style={[localStyles.pickerText, resYear === year && localStyles.pickerTextActive]}>{year}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {resType === 'monthly' && (
                            <>
                                <Text style={localStyles.sectionLabel}>MONTH</Text>
                                <FlatList
                                    data={MONTHS}
                                    keyExtractor={(item) => item.value.toString()}
                                    numColumns={4}
                                    scrollEnabled={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[localStyles.monthPickerItem, resMonth === item.value && localStyles.monthPickerItemActive]} onPress={() => setResMonth(item.value)}>
                                            <Text style={[localStyles.pickerText, resMonth === item.value && localStyles.monthPickerItemActive && { color: COLORS.blue }]}>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </>
                        )}
                        <TouchableOpacity style={[localStyles.confirmBtn, { backgroundColor: COLORS.blue }]} onPress={handleGenerateReservationReport}>
                            <Text style={localStyles.confirmBtnText}>Download Reservations Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: RAPORTY Z KURSÓW */}
            <Modal visible={tripModalVisible} animationType="slide" transparent={true}>
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { maxWidth: 550 }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={localStyles.modalTitle}>Trip & Fleet Report</Text>
                            <TouchableOpacity onPress={() => setTripModalVisible(false)}><Ionicons name="close" size={24} color="#111" /></TouchableOpacity>
                        </View>

                        <Text style={localStyles.sectionLabel}>TIME FRAME</Text>
                        <View style={{ flexDirection: 'row', gap: 5, marginBottom: 20 }}>
                            {['daily', 'weekly', 'monthly', 'annual'].map((type) => (
                                <TouchableOpacity key={type} style={[localStyles.typeBtn, { flex: 1 }, tripType === type && localStyles.typeBtnActiveRed]} onPress={() => setTripType(type as any)}>
                                    <Text style={[localStyles.typeText, { fontSize: 12 }, tripType === type && localStyles.typeTextActiveRed]}>{type.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={localStyles.sectionLabel}>SELECT DATE</Text>
                        {tripType === 'daily' && (
                            <input type="date" style={styles.nativeSelectElement as any} value={tripDate} onChange={(e: any) => setTripDate(e.target.value)} />
                        )}
                        {tripType === 'weekly' && (
                            <input type="week" style={styles.nativeSelectElement as any} value={tripWeek} onChange={(e: any) => setTripWeek(e.target.value)} />
                        )}
                        {(tripType === 'monthly' || tripType === 'annual') && (
                            <View style={localStyles.pickerRow}>
                                {YEARS.map(year => (
                                    <TouchableOpacity key={year} style={[localStyles.pickerItem, tripYear === year && localStyles.pickerItemActiveRed]} onPress={() => setTripYear(year)}>
                                        <Text style={[localStyles.pickerText, tripYear === year && localStyles.pickerTextActiveRed]}>{year}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {tripType === 'monthly' && (
                            <View style={{ marginTop: 10 }}>
                                <FlatList
                                    data={MONTHS} keyExtractor={(item) => item.value.toString()} numColumns={4} scrollEnabled={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[localStyles.monthPickerItem, tripMonth === item.value && localStyles.monthPickerItemActiveRed]} onPress={() => setTripMonth(item.value)}>
                                            <Text style={[localStyles.pickerText, tripMonth === item.value && localStyles.monthPickerItemActiveRed && { color: COLORS.red }]}>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 15, marginTop: 20 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.sectionLabel}>FILTER BY DRIVER</Text>
                                <select style={styles.nativeSelectElement as any} value={selectedDriverId} onChange={(e: any) => setSelectedDriverId(e.target.value)}>
                                    <option value="">All Drivers</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.sectionLabel}>FILTER BY VEHICLE</Text>
                                <select style={styles.nativeSelectElement as any} value={selectedBusId} onChange={(e: any) => setSelectedBusId(e.target.value)}>
                                    <option value="">All Vehicles</option>
                                    {buses.map(b => <option key={b.id} value={b.id}>{b.registrationNumber}</option>)}
                                </select>
                            </View>
                        </View>

                        <Text style={{ fontSize: 11, color: COLORS.grayText, fontStyle: 'italic', marginTop: 15 }}>
                            * Report includes passengers per route segment, fuel vs revenue statistics, and specific filters.
                        </Text>

                        <TouchableOpacity style={[localStyles.confirmBtn, { backgroundColor: COLORS.red }]} onPress={handleGenerateTripReport}>
                            <Text style={localStyles.confirmBtnText}>Download Trip Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    iconWrapperGreen: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.greenLight, justifyContent: 'center', alignItems: 'center' },
    iconWrapperRed: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.redLight, justifyContent: 'center', alignItems: 'center' },
    iconWrapperBlue: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.blueLight, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 25, width: '100%', maxWidth: 450 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },

    sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', marginBottom: 8, letterSpacing: 1 },

    typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
    typeBtnActive: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
    typeBtnActiveRed: { backgroundColor: COLORS.redLight, borderColor: COLORS.red },
    typeText: { color: '#4b5563', fontWeight: 'bold' },
    typeTextActive: { color: COLORS.blue },
    typeTextActiveRed: { color: COLORS.red },

    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    pickerItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    pickerItemActive: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
    pickerItemActiveRed: { backgroundColor: COLORS.redLight, borderColor: COLORS.red },

    pickerText: { color: '#4b5563', fontWeight: '600' },
    pickerTextActive: { color: COLORS.blue, fontWeight: 'bold' },
    pickerTextActiveRed: { color: COLORS.red, fontWeight: 'bold' },

    monthPickerItem: { flex: 1, margin: 4, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
    monthPickerItemActive: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
    monthPickerItemActiveRed: { backgroundColor: COLORS.redLight, borderColor: COLORS.red },

    confirmBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 25 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
