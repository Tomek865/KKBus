import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';

export default function DriverEndShift() {
    const [volume, setVolume] = useState('');
    const [cost, setCost] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<'volume' | 'cost' | null>(null);

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/driver/shift/end', {
                method: 'POST',
                body: JSON.stringify({
                    volume: volume ? parseFloat(volume) : 0,
                    cost: cost ? parseFloat(cost) : 0,
                    vehicle_id: 1 // W przyszłości można pobrać dynamicznie ze stanu aplikacji
                })
            });

            if (response.ok) {
                Alert.alert("Sukces", "Zmiana zakończona. System wyliczył cenę za litr i zapisał dane z tankowania.");
                setVolume(''); 
                setCost('');
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

                    <TouchableOpacity style={styles.submitBtn} onPress={handleComplete}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ZAKOŃCZ ZMIANĘ</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}