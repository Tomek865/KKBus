import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.logo}>Trans<Text style={styles.logoRed}>Region</Text></Text>
            <Text style={styles.subtitle}>
                A comprehensive, multi-platform solution for regional bus transit. Select your role to view the tailored interface.
            </Text>

            <View style={styles.cardsContainer}>
                {/* Karta Pasażera */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/passenger' as any)}
                >
                    <Text style={styles.cardBadge}>Mobile View</Text>
                    <Text style={styles.cardTitle}>Passenger App</Text>
                    <Text style={styles.cardDesc}>Mobile-first. Search routes, book tickets, and manage your profile.</Text>
                </TouchableOpacity>

                {/* Karta Kierowcy */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/driver' as any)}
                >
                    <Text style={styles.cardBadge}>Tablet View</Text>
                    <Text style={styles.cardTitle}>Driver Dashboard</Text>
                    <Text style={styles.cardDesc}>Tablet-optimized. Active route tracking, segment reports, and shift management.</Text>
                </TouchableOpacity>

                {/* Karta Admina */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/admin' as any)}
                >
                    <Text style={styles.cardBadge}>Desktop View</Text>
                    <Text style={styles.cardTitle}>Admin Portal</Text>
                    <Text style={styles.cardDesc}>Desktop-focused. Real-time statistics, schedule management, and client reports.</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', alignItems: 'center', padding: 20 },
    logo: { fontSize: 32, fontWeight: 'bold', color: '#1a1f2e', marginTop: 40 },
    logoRed: { color: '#e60000' },
    subtitle: { textAlign: 'center', color: '#6c757d', marginVertical: 20, maxWidth: 600 },
    cardsContainer: { width: '100%', maxWidth: 800, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, width: 300, minHeight: 200 },
    cardBadge: { color: '#e60000', fontSize: 12, fontWeight: 'bold', alignSelf: 'flex-end', marginBottom: 10 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1f2e', marginBottom: 8 },
    cardDesc: { textAlign: 'center', color: '#6c757d' }
});