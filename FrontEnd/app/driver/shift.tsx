import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { driverStyles as styles } from '../src/styles/driverStyles';

export default function DriverEndShift() {
    const [volume, setVolume] = useState('');
    const [cost, setCost] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<'volume' | 'cost' | null>(null);

    const handleComplete = async () => {
        if (!volume || !cost) {
            Alert.alert("Błąd", "Uzupełnij dane tankowania.");
            return;
        }

        setIsSubmitting(true);

        // fetch - Wysyłanie danych o kosztach i ilości paliwa na koniec zmiany

        setTimeout(() => {
            Alert.alert("Sukces", "Zmiana zakończona. Dane zapisane.");
            setIsSubmitting(false);
            setVolume(''); setCost('');
        }, 1500);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View style={styles.card}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 25, color: '#111827' }}>Koniec Zmiany</Text>

                    <View style={[styles.inputWrapper, focusedField === 'volume' && styles.inputWrapperActive]}>
                        <TextInput
                            style={styles.textInput}
                            value={volume}
                            onChangeText={setVolume}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedField('volume')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="0.00"
                        />
                        <Text style={{ fontWeight: 'bold', color: '#9ca3af' }}>LITRY</Text>
                    </View>

                    <View style={[styles.inputWrapper, focusedField === 'cost' && styles.inputWrapperActive]}>
                        <TextInput
                            style={styles.textInput}
                            value={cost}
                            onChangeText={setCost}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedField('cost')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="0.00"
                        />
                        <Text style={{ fontWeight: 'bold', color: '#9ca3af' }}>PLN</Text>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleComplete}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ZAKOŃCZ ZMIANĘ</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}