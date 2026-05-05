import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverStyles as styles } from '../src/styles/driverStyles';

export default function DriverSegmentReport() {
    const [boarded, setBoarded] = useState('');
    const [alighted, setAlighted] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focused, setFocused] = useState<'in' | 'out' | null>(null);

    const submitReport = async () => {
        if (boarded === '' || alighted === '') {
            Alert.alert("Błąd", "Wprowadź dane.");
            return;
        }

        setIsSubmitting(true);

        // fetch - Wysyłanie raportu o liczbie pasażerów wsiadających/wysiadających na danym przystanku

        setTimeout(() => {
            Alert.alert("Sukces", "Raport wysłany do bazy danych.");
            setIsSubmitting(false);
            setBoarded(''); setAlighted('');
        }, 1200);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View style={styles.card}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 25, color: '#111827' }}>Raport Odcinkowy</Text>

                    <View style={[styles.inputWrapper, focused === 'in' && styles.inputWrapperActive]}>
                        <TextInput
                            style={styles.textInput}
                            value={boarded}
                            onChangeText={setBoarded}
                            keyboardType="number-pad"
                            onFocus={() => setFocused('in')}
                            onBlur={() => setFocused(null)}
                            placeholder="0"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ marginRight: 10, fontWeight: 'bold', color: '#4b5563' }}>WSIADŁO</Text>
                            <Ionicons name="arrow-down-circle" size={30} color={focused === 'in' ? '#e60000' : '#d1d5db'} />
                        </View>
                    </View>

                    <View style={[styles.inputWrapper, focused === 'out' && styles.inputWrapperActive]}>
                        <TextInput
                            style={styles.textInput}
                            value={alighted}
                            onChangeText={setAlighted}
                            keyboardType="number-pad"
                            onFocus={() => setFocused('out')}
                            onBlur={() => setFocused(null)}
                            placeholder="0"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ marginRight: 10, fontWeight: 'bold', color: '#4b5563' }}>WYSIADŁO</Text>
                            <Ionicons name="arrow-up-circle" size={30} color={focused === 'out' ? '#e60000' : '#d1d5db'} />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={submitReport}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>WYŚLIJ RAPORT</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}