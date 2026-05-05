import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';

export default function AdminReports() {
    // fetch - Pobieranie zagregowanych raportów (przychody, wydatki na paliwo, profity)
    return (
        <ScrollView style={{ flex: 1 }}>
            <Text style={styles.title}>Financial Reports</Text>

            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                    <Ionicons name="cash-outline" size={32} color={COLORS.green} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 10 }}>84,200 PLN</Text>
                    <Text style={styles.subtitle}>Ticket Sales (MTD)</Text>
                </View>
                <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                    <Ionicons name="water-outline" size={32} color={COLORS.red} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 10 }}>12,450 PLN</Text>
                    <Text style={styles.subtitle}>Fuel Costs (MTD)</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Monthly Performance</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text>Gross Revenue</Text>
                    <Text style={{ fontWeight: 'bold' }}>124,500 PLN</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text>Operating Costs</Text>
                    <Text style={{ fontWeight: 'bold', color: COLORS.red }}>- 32,100 PLN</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', marginTop: 10, paddingTop: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Net Profit</Text>
                    <Text style={{ fontWeight: 'bold', color: COLORS.green, fontSize: 18 }}>92,400 PLN</Text>
                </View>
            </View>
        </ScrollView>
    );
}