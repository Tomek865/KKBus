import React from 'react';
import { View, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { Slot } from 'expo-router';
import { Sidebar } from '../../components/driver/Sidebar';

export default function DriverLayout() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768; // Próg dla urządzeń mobilnych

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[
                styles.container,
                { flexDirection: isMobile ? 'column' : 'row' }
            ]}>
                {/* Główna zawartość ekranu */}
                <View style={styles.content}>
                    <Slot />
                </View>

                {/* Menu: Boczny pasek na tablecie / Dolny pasek na telefonie */}
                <Sidebar />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { flex: 1 }
});