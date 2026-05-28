import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

export default function AdminReports() {
    const [reportData, setReportData] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [tripRevenues, setTripRevenues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

       useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                // Fetch statystyk i jednego, rozbudowanego raportu finansowego
                const [finRes, statsRes, routeRevenueRes] = await Promise.all([
                    authFetch('/api/admin/reports/financial'),
                    authFetch('/api/admin/stats'),
                    authFetch('/api/admin/reports/route-revenue') // Nowy endpoint dla przychodów z kursów
                ]);

                if (finRes.ok) {
                    const finData = await finRes.json();
                    setReportData(finData);
                    // Automatycznie wyciągamy nową tablicę z backendu (lub dajemy pustą, jeśli jej jeszcze nie ma)
                    setTripRevenues(finData.tripRevenues || []);
                }

                if (routeRevenueRes.ok) {
                    const routeRevenueData = await routeRevenueRes.json();
                    setTripRevenues(prev => [...prev, ...routeRevenueData]);
                    console.log("Fetched route revenue data:", routeRevenueData);
                }

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStatsData(statsData);
                }

            } catch (error) {
                console.error("Błąd pobierania raportów:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.title}>Financial & Operational Reports</Text>
                    <Text style={styles.subtitle}>MONTH-TO-DATE PERFORMANCE</Text>
                </View>
            </View>

            {/* GÓRNY RZĄD: KLUCZOWE METRYKI */}
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperGreen}>
                        <Ionicons name="cash-outline" size={28} color={COLORS.green} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{reportData?.ticketSales || '0'} PLN</Text>
                    <Text style={styles.subtitle}>Ticket Sales (MTD)</Text>
                </View>
                
                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperRed}>
                        <Ionicons name="water-outline" size={28} color={COLORS.red} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{reportData?.fuelCosts || '0'} PLN</Text>
                    <Text style={styles.subtitle}>Fuel Costs (MTD)</Text>
                </View>

                {/* Info z endpointu /stats */}
                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperBlue}>
                        <Ionicons name="people-outline" size={28} color={COLORS.blue} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{statsData?.passengers || '0'}</Text>
                    <Text style={styles.subtitle}>Total Passengers</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 20 }}>
                {/* LEWA KOLUMNA: WYNIK FINANSOWY */}
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

                {/* PRAWA KOLUMNA: TABELA PRZYCHODÓW Z KURSÓW */}
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
                            <Text style={{ textAlign: 'center', color: COLORS.grayText, marginTop: 20, fontStyle: 'italic' }}>Brak danych o kursach.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    iconWrapperGreen: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.greenLight, justifyContent: 'center', alignItems: 'center'
    },
    iconWrapperRed: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.redLight, justifyContent: 'center', alignItems: 'center'
    },
    iconWrapperBlue: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.blueLight, justifyContent: 'center', alignItems: 'center'
    }
});