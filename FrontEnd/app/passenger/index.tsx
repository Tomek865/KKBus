import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { SearchInput } from '../../components/passenger/SearchInput';
import { TicketCard } from '../../components/passenger/TicketCard';
import { Ionicons } from '@expo/vector-icons';

export default function PassengerSearch() {
    const [resultsVisible, setResultsVisible] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Logo */}
                <Text style={styles.logo}>Trans<Text style={styles.logoRed}>Region</Text></Text>

                {/* Karta Wyszukiwania */}
                <View style={styles.searchCard}>
                    <SearchInput label="FROM" value="Krakow" />
                    <View style={styles.swapIconContainer}>
                        <Ionicons name="swap-vertical" size={20} color="#e60000" />
                    </View>
                    <SearchInput label="TO" value="Katowice" />

                    <View style={styles.row}>
                        <SearchInput label="DATE" value="Today, 14 Oct" flex={1} marginRight={8} />
                        <SearchInput label="PASSENGERS" value="1 Adult" flex={1} />
                    </View>

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => setResultsVisible(true)}
                    >
                        <Text style={styles.searchButtonText}>Search Routes</Text>
                    </TouchableOpacity>
                </View>

                {/* Wyniki */}
                {resultsVisible && (
                    <View style={styles.resultsSection}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>Available Departures</Text>
                            <Text style={styles.resultsCount}>6 options</Text>
                        </View>

                        <TicketCard
                            depTime="08:15" arrTime="09:40"
                            depStation="Krakow MDA" arrStation="Katowice Dworzec"
                            duration="1H 25M" seats={12} price={24}
                        />
                        <TicketCard
                            depTime="09:30" arrTime="10:55"
                            depStation="Krakow MDA" arrStation="Katowice Dworzec"
                            duration="1H 25M" seats={4} price={24}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    container: { padding: 20 },
    logo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    logoRed: { color: '#e60000' },
    searchCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    row: { flexDirection: 'row' },
    swapIconContainer: { alignItems: 'center', marginVertical: -10, zIndex: 1 },
    searchButton: { backgroundColor: '#e60000', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 10 },
    searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    resultsSection: { marginTop: 30 },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    resultsTitle: { fontSize: 18, fontWeight: 'bold' },
    resultsCount: { color: '#888', backgroundColor: '#eee', paddingHorizontal: 8, borderRadius: 10, fontSize: 12, overflow: 'hidden' }
});