import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Slot } from 'expo-router';
import { Sidebar } from '../../components/driver/Sidebar';

export default function DriverLayout() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Nasze boczne menu */}
                <Sidebar />

                {/* Główna zawartość ekranu */}
                <View style={styles.content}>
                    <Slot />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#111827' }, // Ciemne tło na marginesach (zgodnie z Figmą)
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8f9fa' },
    content: { flex: 1, padding: 24 }
});