import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';

export default function DriverAvailability() {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [shifts, setShifts] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/driver/shifts/');
            if (response.ok) setShifts(await response.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!date || !startTime || !endTime) {
            Alert.alert("Błąd", "Wypełnij wszystkie pola w formularzu.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/driver/shifts/availability', {
                method: 'POST',
                body: JSON.stringify({ date, start_time: startTime, end_time: endTime })
            });

            if (response.ok) {
                Alert.alert("Sukces", "Dyspozycyjność została wysłana do panelu biura.");
                setDate(''); setStartTime(''); setEndTime('');
            } else {
                Alert.alert("Błąd", "Nie udało się zapisać dyspozycyjności.");
            }
        } catch (error) {
            Alert.alert("Błąd", "Problem z połączeniem z serwerem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>Mój Grafik Pracy</Text>

                <View style={[styles.card, { marginBottom: 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                        <Ionicons name="calendar-outline" size={24} color="#e60000" />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>Zgłoś Dyspozycyjność (do Biura)</Text>
                    </View>

                    <Text style={{ fontWeight: 'bold', color: '#6b7280', fontSize: 12, marginBottom: 5 }}>DATA DYSPOZYCJI</Text>
                    <input
                        type="date"
                        style={{
                            width: '100%',
                            boxSizing: 'border-box', // NAPRAWA BŁĘDU SZEROKOŚCI
                            padding: '12px 15px',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            marginBottom: 15,
                            backgroundColor: '#f9fafb',
                            color: '#111827',
                            fontSize: 16,
                            fontFamily: 'inherit',
                            outlineStyle: 'none',
                            minHeight: 48
                        } as any}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: '#6b7280', fontSize: 12, marginBottom: 5 }}>OD GODZINY</Text>
                            <input
                                type="time"
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box', // NAPRAWA BŁĘDU SZEROKOŚCI
                                    padding: '12px 15px',
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    backgroundColor: '#f9fafb',
                                    color: '#111827',
                                    fontSize: 16,
                                    fontFamily: 'inherit',
                                    outlineStyle: 'none',
                                    minHeight: 48
                                } as any}
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: '#6b7280', fontSize: 12, marginBottom: 5 }}>DO GODZINY</Text>
                            <input
                                type="time"
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box', // NAPRAWA BŁĘDU SZEROKOŚCI
                                    padding: '12px 15px',
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    backgroundColor: '#f9fafb',
                                    color: '#111827',
                                    fontSize: 16,
                                    fontFamily: 'inherit',
                                    outlineStyle: 'none',
                                    minHeight: 48
                                } as any}
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>WYŚLIJ ZGŁOSZENIE</Text>}
                    </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 10, marginBottom: 10 }}>Mój Ustalony Grafik Zmian</Text>
                {shifts.length === 0 && <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>Brak zatwierdzonych zmian na Twoim koncie.</Text>}
                {shifts.map(shift => (
                    <View key={shift.shift_id} style={{ backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                <Ionicons name="briefcase-outline" size={20} color="#e60000" />
                            </View>
                            <View>
                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{shift.date}</Text>
                                <Text style={{ color: '#6b7280' }}>Godziny pracy: {shift.start_time} - {shift.end_time}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}