import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';

export default function DriverEndShift() {
    const [volume, setVolume] = useState('');
    const [cost, setCost] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<'volume' | 'cost' | 'kilometers' | null>(null);
    const [kilometers, setKilometers] = useState('');

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/driver/shift/end', {
                method: 'POST',
                body: JSON.stringify({
                    volume: volume ? parseFloat(volume) : 0,
                    cost: cost ? parseFloat(cost) : 0,
                    driven_kilometers: kilometers ? parseFloat(kilometers) : 0,
                    vehicle_id: 1 // TODO: Zaciągane dynamicznie z local storage w przyszłości
                })
            });

            const resData = await response.json();

            if (response.ok) {
                Alert.alert("Sukces", resData.message || "Zmiana zakończona.");
                setVolume('');
                setCost('');
                setKilometers('');
            } else {
                throw new Error();
            }
        } catch (error) {
            Alert.alert("Błąd", "Wystąpił błąd podczas kończenia zmiany.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
                <View style={styles.card}>
                    <View style={{ alignItems: 'center', marginBottom: 25 }}>
                        <Ionicons name="water-outline" size={50} color="#e60000" />
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 10 }}>Koniec Zmiany</Text>
                        <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 5 }}>Jeśli tankowałeś, przepisz dane z dystrybutora. Średnia cena zostanie wyliczona automatycznie.</Text>
                    </View>

                    <View style={[styles.inputWrapper, focusedField === 'volume' && styles.inputWrapperActive, { backgroundColor: '#f9fafb' }]}>
                        <TextInput
                            style={styles.textInput}
                            value={volume}
                            onChangeText={setVolume}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedField('volume')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Zatankowane litry (np. 50.5)"
                        />
                        <Text style={{ fontWeight: 'bold', color: '#9ca3af' }}>LITRY</Text>
                    </View>

                    <View style={[styles.inputWrapper, focusedField === 'cost' && styles.inputWrapperActive, { backgroundColor: '#f9fafb' }]}>
                        <TextInput
                            style={styles.textInput}
                            value={cost}
                            onChangeText={setCost}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedField('cost')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Całkowity koszt (np. 320.50)"
                        />
                        <Text style={{ fontWeight: 'bold', color: '#9ca3af' }}>PLN</Text>
                    </View>

                    <View style={[styles.inputWrapper, focusedField === 'kilometers' && styles.inputWrapperActive, { backgroundColor: '#f9fafb' }]}>
                        <TextInput
                            style={styles.textInput}
                            value={kilometers}
                            onChangeText={setKilometers}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedField('kilometers')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Przejechane km (np. 450.5)"
                        />
                        <Text style={{ fontWeight: 'bold', color: '#9ca3af' }}>KM</Text>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleComplete}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ZAKOŃCZ ZMIANĘ</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}