import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const TicketCard = ({ depTime, arrTime, depStation, arrStation, duration, seats, price }: any) => (
    <TouchableOpacity style={styles.card}>
        <View style={styles.mainRow}>
            <View>
                <Text style={styles.time}>{depTime}</Text>
                <Text style={styles.station}>{depStation}</Text>
            </View>
            <View style={styles.durationLine}>
                <Text style={styles.durationText}>{duration}</Text>
                <View style={styles.line} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.time}>{arrTime}</Text>
                <Text style={styles.station}>{arrStation}</Text>
            </View>
        </View>
        <View style={styles.footer}>
            <Text style={styles.seats}>{seats} SEATS LEFT</Text>
            <Text style={styles.price}>{price} PLN</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2 },
    mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    time: { fontSize: 22, fontWeight: 'bold' },
    station: { fontSize: 12, color: '#888' },
    durationLine: { flex: 1, alignItems: 'center', marginHorizontal: 15 },
    durationText: { fontSize: 10, color: '#ccc', fontWeight: 'bold' },
    line: { height: 2, backgroundColor: '#eee', width: '100%', marginTop: 4 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f9f9f9' },
    seats: { color: '#28a745', fontWeight: 'bold', fontSize: 12, backgroundColor: '#e9f6ec', padding: 4, borderRadius: 6 },
    price: { fontSize: 20, fontWeight: 'bold', color: '#e60000' }
});