import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { TicketCard } from '../../components/passenger/TicketCard';

export default function PassengerTickets() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>My Tickets</Text>

                <Text style={styles.sectionTitle}>Upcoming Journeys</Text>
                <TicketCard
                    depTime="14:20" arrTime="15:45"
                    depStation="Krakow MDA" arrStation="Katowice Dworzec"
                    duration="1H 25M" seats={1} price={24}
                />

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Travel History</Text>
                <View style={{ opacity: 0.6 }}>
                    <TicketCard
                        depTime="08:15" arrTime="09:40"
                        depStation="Katowice Dworzec" arrStation="Krakow MDA"
                        duration="1H 25M" seats={1} price={24}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 25 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, textTransform: 'uppercase' }
});