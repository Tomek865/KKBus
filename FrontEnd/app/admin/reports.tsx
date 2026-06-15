import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export default function AdminReports() {
    const [reportData, setReportData] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [tripRevenues, setTripRevenues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const [finRes, statsRes, routeRevenueRes] = await Promise.all([
                    authFetch('/api/admin/reports/financial'),
                    authFetch('/api/admin/stats'),
                    authFetch('/api/admin/reports/route-revenue')
                ]);

                if (finRes.ok) {
                    const finData = await finRes.json();
                    setReportData(finData);
                    setTripRevenues(finData.tripRevenues || []);
                }

                if (routeRevenueRes.ok) {
                    const routeRevenueData = await routeRevenueRes.json();
                    setTripRevenues(prev => [...prev, ...routeRevenueData]);
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

    const printFinancialReport = async () => {
        const html = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
                    h1 { color: #e60000; margin-bottom: 5px; }
                    h3 { color: #555; margin-top: 0; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                    .summary-box { display: flex; justify-content: space-between; background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                    .stat { text-align: center; }
                    .stat h4 { margin: 0; color: #6b7280; font-size: 14px; }
                    .stat p { margin: 5px 0 0; font-size: 24px; font-weight: bold; }
                    .profit { color: ${reportData?.netProfit < 0 ? '#ef4444' : '#10b981'}; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f3f4f6; color: #111; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <h1>Raport Finansowy KKBus</h1>
                <h3>Podsumowanie Operacyjne (MTD)</h3>
                
                <div class="summary-box">
                    <div class="stat">
                        <h4>Przychód Brutto</h4>
                        <p>${reportData?.grossRevenue || '0'} PLN</p>
                    </div>
                    <div class="stat">
                        <h4>Koszty Operacyjne</h4>
                        <p style="color: #ef4444;">- ${reportData?.operatingCosts || '0'} PLN</p>
                    </div>
                    <div class="stat">
                        <h4>Zysk Netto</h4>
                        <p class="profit">${reportData?.netProfit || '0'} PLN</p>
                    </div>
                </div>

                <h3>Przychody według tras</h3>
                <table>
                    <tr>
                        <th>Trasa</th>
                        <th class="text-right">Przychód</th>
                    </tr>
                    ${tripRevenues.map(trip => `
                        <tr>
                            <td>${trip.routeName}</td>
                            <td class="text-right"><strong>${trip.totalRevenue} PLN</strong></td>
                        </tr>
                    `).join('')}
                </table>
                <p style="text-align: right; margin-top: 50px; font-size: 12px; color: #888;">Wygenerowano automatycznie z systemu KKBus</p>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            if (Platform.OS === 'web') {
                window.open(uri, '_blank');
            } else {
                await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            Alert.alert("Błąd", "Nie udało się wygenerować raportu.");
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.pageHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View>
                    <Text style={styles.title}>Financial & Operational Reports</Text>
                    <Text style={styles.subtitle}>MONTH-TO-DATE PERFORMANCE</Text>
                </View>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#111827' }]} onPress={printFinancialReport}>
                    <Ionicons name="print-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Print PDF</Text>
                </TouchableOpacity>
            </View>

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

                <View style={[styles.card, { flex: 1, alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={localStyles.iconWrapperBlue}>
                        <Ionicons name="people-outline" size={28} color={COLORS.blue} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 15 }}>{statsData?.passengers || '0'}</Text>
                    <Text style={styles.subtitle}>Total Passengers</Text>
                </View>
            </View>

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