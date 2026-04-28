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

    const submitReport = async () => {
        if (!boarded || !alighted) {
            Alert.alert("Empty fields", "Please enter the number of passengers.");
            return;
        }
        setIsSubmitting(true);
        try {
            console.log(`API: Boarded ${boarded}, Alighted ${alighted}`);
            await new Promise(resolve => setTimeout(resolve, 1200));
            Alert.alert("Report Sent", "Passenger count has been updated.");
            setBoarded(''); setAlighted('');
        } catch (error) {
            Alert.alert("Error", "Check connection.");
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
                            <Text style={styles.title}>Segment Report</Text>
                            <Text style={styles.subtitle}>CHRZANOW {'>'} JAWORZNO</Text>
                        </View>
                    </View>

                    <View style={styles.mainContent}>
                        <View style={[styles.field, focused === 'in' && styles.fieldActive]}>
                            <View style={styles.fieldInfo}>
                                <Ionicons name="arrow-down-circle" size={30} color={focused === 'in' ? '#e60000' : '#d1d5db'} />
                                <Text style={styles.fieldText}>BOARDED</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={boarded}
                                onChangeText={setBoarded}
                                placeholder="0"
                                keyboardType="number-pad"
                                onFocus={() => setFocused('in')}
                                onBlur={() => setFocused(null)}
                            />
                        </View>

                        <View style={[styles.field, focused === 'out' && styles.fieldActive, { marginTop: 15 }]}>
                            <View style={styles.fieldInfo}>
                                <Ionicons name="arrow-up-circle" size={30} color={focused === 'out' ? '#e60000' : '#d1d5db'} />
                                <Text style={styles.fieldText}>ALIGHTED</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={alighted}
                                onChangeText={setAlighted}
                                placeholder="0"
                                keyboardType="number-pad"
                                onFocus={() => setFocused('out')}
                                onBlur={() => setFocused(null)}
                            />
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#3b82f6" />
                        <Text style={styles.infoText}>Data is used for live capacity tracking.</Text>
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={submitReport} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="cloud-upload" size={22} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.btnText}>SEND REPORT</Text>
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
    card: { backgroundColor: '#fff', borderRadius: 32, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    iconBg: { backgroundColor: '#e60000', width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', marginTop: 2 },
    mainContent: { marginBottom: 25 },
    field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#f3f4f6' },
    fieldActive: { borderColor: '#e60000', backgroundColor: '#fff' },
    fieldInfo: { flexDirection: 'row', alignItems: 'center' },
    fieldText: { marginLeft: 12, fontSize: 12, fontWeight: 'bold', color: '#4b5563' },
    input: { fontSize: 32, fontWeight: 'bold', color: '#111827', width: 80, textAlign: 'right' },
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 15, borderRadius: 15, marginBottom: 25 },
    infoText: { marginLeft: 10, fontSize: 12, color: '#1e40af', fontWeight: '500' },
    btn: { backgroundColor: '#111827', padding: 22, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});