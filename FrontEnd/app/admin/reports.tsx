import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminReports() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Financial Reports</Text>

            <View style={styles.row}>
                <View style={styles.reportBox}>
                    <Ionicons name="cash-outline" size={32} color="#10b981" />
                    <Text style={styles.boxVal}>84,200 PLN</Text>
                    <Text style={styles.boxLabel}>Ticket Sales (MTD)</Text>
                </View>
                <View style={styles.reportBox}>
                    <Ionicons name="water-outline" size={32} color="#e60000" />
                    <Text style={styles.boxVal}>12,450 PLN</Text>
                    <Text style={styles.boxLabel}>Fuel Costs (MTD)</Text>
                </View>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Monthly Performance</Text>
                <View style={styles.summaryRow}>
                    <Text>Gross Revenue</Text>
                    <Text style={{ fontWeight: 'bold' }}>124,500 PLN</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text>Operating Costs</Text>
                    <Text style={{ fontWeight: 'bold', color: '#e60000' }}>- 32,100 PLN</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: '#eee', marginTop: 10, paddingTop: 10 }]}>
                    <Text style={{ fontWeight: 'bold' }}>Net Profit</Text>
                    <Text style={{ fontWeight: 'bold', color: '#10b981', fontSize: 18 }}>92,400 PLN</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    row: { flexDirection: 'row', gap: 20, marginBottom: 20 },
    reportBox: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', elevation: 2 },
    boxVal: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
    boxLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
    summaryCard: { backgroundColor: '#fff', padding: 25, borderRadius: 16, elevation: 2 },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }
});