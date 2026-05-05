import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverSegmentReport() {
    const [boarded, setBoarded] = useState('');
    const [alighted, setAlighted] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focused, setFocused] = useState<'in' | 'out' | null>(null);

    // Funkcja: tylko liczby całkowite
    const handleIntegerInput = (text: string, setter: (val: string) => void) => {
        const cleaned = text.replace(/[^0-9]/g, ''); // Usuwa wszystko co nie jest cyfrą
        setter(cleaned);
    };

    const submitReport = async () => {
        if (boarded === '' || alighted === '') {
            Alert.alert("Błąd", "Wprowadź liczbę pasażerów (nawet jeśli to 0).");
            return;
        }

        setIsSubmitting(true);
        try {
            // // fetch - Tutaj wyślesz dane o pasażerach na tym odcinku
            console.log(`API: Boarded ${boarded}, Alighted ${alighted}`);

            await new Promise(resolve => setTimeout(resolve, 1200));
            Alert.alert("Sukces", "Raport został wysłany.");
            setBoarded(''); setAlighted('');
        } catch (error) {
            Alert.alert("Błąd", "Problem z połączeniem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconBg}><Ionicons name="people" size={24} color="#fff" /></View>
                        <View>
                            <Text style={styles.title}>Raport Odcinkowy</Text>
                            <Text style={styles.subtitle}>CHRZANÓW {'>'} JAWORZNO</Text>
                        </View>
                    </View>

                    <View style={styles.mainContent}>
                        {/* POLE: WSIADŁO (Input po lewej, opis po prawej) */}
                        <View style={[styles.field, focused === 'in' && styles.fieldActive]}>
                            <TextInput
                                style={styles.input}
                                value={boarded}
                                onChangeText={(t) => handleIntegerInput(t, setBoarded)}
                                placeholder="0"
                                keyboardType="number-pad"
                                onFocus={() => setFocused('in')}
                                onBlur={() => setFocused(null)}
                            />
                            <View style={styles.fieldInfo}>
                                <Text style={styles.fieldText}>WSIADŁO</Text>
                                <Ionicons name="arrow-down-circle" size={30} color={focused === 'in' ? '#e60000' : '#d1d5db'} />
                            </View>
                        </View>

                        {/* POLE: WYSIADŁO (Input po lewej, opis po prawej) */}
                        <View style={[styles.field, focused === 'out' && styles.fieldActive, { marginTop: 15 }]}>
                            <TextInput
                                style={styles.input}
                                value={alighted}
                                onChangeText={(t) => handleIntegerInput(t, setAlighted)}
                                placeholder="0"
                                keyboardType="number-pad"
                                onFocus={() => setFocused('out')}
                                onBlur={() => setFocused(null)}
                            />
                            <View style={styles.fieldInfo}>
                                <Text style={styles.fieldText}>WYSIADŁO</Text>
                                <Ionicons name="arrow-up-circle" size={30} color={focused === 'out' ? '#e60000' : '#d1d5db'} />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={submitReport} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="cloud-upload" size={22} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.btnText}>WYŚLIJ RAPORT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 32, padding: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    iconBg: { backgroundColor: '#e60000', width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', marginTop: 2 },
    mainContent: { marginBottom: 25 },
    field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#f3f4f6' },
    fieldActive: { borderColor: '#e60000', backgroundColor: '#fff' },
    fieldInfo: { flexDirection: 'row', alignItems: 'center' },
    fieldText: { marginRight: 12, fontSize: 12, fontWeight: 'bold', color: '#4b5563' }, // Zmienione na marginRight
    input: { fontSize: 32, fontWeight: 'bold', color: '#111827', flex: 1, textAlign: 'left' }, // textAlign: 'left' oraz flex: 1
    btn: { backgroundColor: '#111827', padding: 22, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});