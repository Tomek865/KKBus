import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverEndShift() {
    const [volume, setVolume] = useState('');
    const [cost, setCost] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<'volume' | 'cost' | null>(null);

    const completeShift = async () => {
        if (!volume || !cost) {
            Alert.alert("Error", "Please fill in all data.");
            return;
        }
        setIsSubmitting(true);
        try {
            console.log(`API: Refueling - ${volume}L, ${cost}PLN`); //fetch
            await new Promise(resolve => setTimeout(resolve, 1500));
            Alert.alert("Success", "Shift data saved!");
            setVolume(''); setCost('');
        } catch (error) {
            Alert.alert("Error", "Failed to save.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}><Ionicons name="water" size={24} color="#fff" /></View>
                        <View>
                            <Text style={styles.title}>End of Shift</Text>
                            <Text style={styles.subtitle}>BUS #402 REFUELING</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>VOLUME FUELED</Text>
                        <View style={[styles.inputWrapper, focusedField === 'volume' && styles.activeWrapper]}>
                            <TextInput
                                style={styles.textInput}
                                value={volume}
                                onChangeText={setVolume}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                onFocus={() => setFocusedField('volume')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <Text style={styles.unitText}>Liters</Text>
                        </View>

                        <Text style={[styles.label, { marginTop: 20 }]}>TOTAL COST</Text>
                        <View style={[styles.inputWrapper, focusedField === 'cost' && styles.activeWrapper]}>
                            <TextInput
                                style={styles.textInput}
                                value={cost}
                                onChangeText={setCost}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                onFocus={() => setFocusedField('cost')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <Text style={styles.unitText}>PLN</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
                        onPress={completeShift}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="checkmark-done" size={24} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.submitBtnText}>COMPLETE SHIFT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 28, padding: 25, width: '100%', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
    iconContainer: { backgroundColor: '#111827', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 11, color: '#6b7280', fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
    inputGroup: { marginBottom: 35 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 18, borderWidth: 2, borderColor: '#f3f4f6', paddingHorizontal: 20, height: 70 },
    activeWrapper: { borderColor: '#e60000', backgroundColor: '#fff' },
    textInput: { flex: 1, fontSize: 28, fontWeight: 'bold', color: '#111827' },
    unitText: { fontSize: 14, fontWeight: 'bold', color: '#9ca3af', marginLeft: 10 },
    submitBtn: { backgroundColor: '#e60000', padding: 22, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});