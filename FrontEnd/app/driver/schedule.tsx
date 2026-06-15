import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { authFetch } from '../../utils';

const generateNext7Days = () => {
    const dates = [];
    const dayNames = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        const display = `${dayNames[d.getDay()]}, ${day}.${month}`;
        
        dates.push({ formatted, display });
    }
    return dates;
};

export default function DriverSchedule() {
    // Od razu generujemy domyślny tydzień, żeby UI nigdy nie było puste
    const defaultSchedule = generateNext7Days().map(day => ({
        date: day.formatted,
        display: day.display,
        isAvailable: true,
        notes: ''
    }));

    const [scheduleList, setScheduleList] = useState<any[]>(defaultSchedule);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/driver/trips/schedule');
            const existingData = await response.json();
            
            const baseDays = generateNext7Days();
            
            const merged = baseDays.map(baseDay => {
                const found = Array.isArray(existingData) ? existingData.find((d: any) => d.date === baseDay.formatted) : undefined;
                return {
                    date: baseDay.formatted,
                    display: baseDay.display,
                    isAvailable: found?.is_available ?? true,
                    notes: found?.notes || ''
                };
            });
            
            setScheduleList(merged);
        } catch (error) {
           console.error("Błąd sieci/pobierania grafiku:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchSchedule(); }, []));

    // Aktualizacja pojedynczego pola (Switcha lub Notatki) dla konkretnego dnia
    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newList = [...scheduleList];
        newList[index][field] = value;
        setScheduleList(newList);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Przygotowujemy czystą tablicę obiektów dla backendu
            const payload = scheduleList.map(item => ({
                date: item.date,
                is_available: item.isAvailable,
                notes: item.notes
            }));

            const response = await authFetch('/api/driver/trips/schedule', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Alert.alert("Sukces", "Zapisano cały grafik na najbliższe dni.");
                fetchSchedule();
            } else {
                throw new Error();
            }
        } catch (e) {
            Alert.alert("Błąd", "Nie udało się zapisać grafiku.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#e60000" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Twój Grafik (7 Dni)</Text>
            <Text style={{ color: '#6b7280', marginBottom: 20, lineHeight: 20 }}>
                Domyślnie jesteś zgłoszony jako dostępny do pracy. Odznacz te dni, w które nie możesz pracować (np. urlop) i opcjonalnie podaj powód w notatce.
            </Text>

            {scheduleList.map((item, index) => (
                <View key={item.date} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                        <View>
                            <Text style={styles.dayTitle}>{item.display}</Text>
                            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{item.date}</Text>
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={[styles.statusText, { color: item.isAvailable ? '#10b981' : '#ef4444' }]}>
                                {item.isAvailable ? 'DOSTĘPNY' : 'NIEDOSTĘPNY'}
                            </Text>
                            <Switch 
                                value={item.isAvailable} 
                                onValueChange={(val) => handleUpdateItem(index, 'isAvailable', val)} 
                                trackColor={{ false: '#fca5a5', true: '#6ee7b7' }} 
                                thumbColor={item.isAvailable ? '#10b981' : '#ef4444'}
                            />
                        </View>
                    </View>
                    
                    <TextInput 
                        style={styles.input} 
                        placeholder="Notatki (np. wizyta u lekarza)..." 
                        value={item.notes} 
                        onChangeText={(text) => handleUpdateItem(index, 'notes', text)} 
                    />
                </View>
            ))}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ZAPISZ CAŁY GRAFIK</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flexGrow: 1, backgroundColor: '#f8f9fa' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#111827' },
    dayCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2, marginBottom: 15 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dayTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontWeight: 'bold', fontSize: 12, marginRight: 8 },
    input: { borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 8, padding: 10, backgroundColor: '#f9fafb', fontSize: 14, color: '#4b5563' },
    submitBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30 },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});