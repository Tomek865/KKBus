import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';

export default function AdminReports() {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                // fetch - Pobieranie zagregowanych raportów finansowych
                const response = await fetch(`${IP_adress}/api/reports`);
                const data = await response.json();
                setReportData(data);
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
        <ScrollView style={{ flex: 1 }}>
            <Text style={styles.title}>Financial Reports</Text>

            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                    <Ionicons name="cash-outline" size={32} color={COLORS.green} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 10 }}>{reportData?.ticketSales || '0'} PLN</Text>
                    <Text style={styles.subtitle}>Ticket Sales (MTD)</Text>
                </View>
                <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                    <Ionicons name="water-outline" size={32} color={COLORS.red} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 10 }}>{reportData?.fuelCosts || '0'} PLN</Text>
                    <Text style={styles.subtitle}>Fuel Costs (MTD)</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Monthly Performance</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text>Gross Revenue</Text>
                    <Text style={{ fontWeight: 'bold' }}>{reportData?.grossRevenue || '0'} PLN</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text>Operating Costs</Text>
                    <Text style={{ fontWeight: 'bold', color: COLORS.red }}>- {reportData?.operatingCosts || '0'} PLN</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', marginTop: 10, paddingTop: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Net Profit</Text>
                    <Text style={{ fontWeight: 'bold', color: COLORS.green, fontSize: 18 }}>{reportData?.netProfit || '0'} PLN</Text>
                </View>
            </View>
        </ScrollView>
    );
}