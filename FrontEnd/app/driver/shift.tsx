import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Numpad } from '../../components/driver/Numpad';

export default function DriverEndShift() {
    const [volume, setVolume] = useState('0');
    const [cost, setCost] = useState('0');
    const [activeField, setActiveField] = useState<'volume' | 'cost'>('volume');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNumpadPress = (val: string) => {
        if (activeField === 'volume') {
            setVolume(prev => prev === '0' ? val : prev + val);
        } else {
            setCost(prev => prev === '0' ? val : prev + val);
        }
    };

    const handleDelete = () => {
        if (activeField === 'volume') {
            setVolume(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else {
            setCost(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        }
    };

    // Obsługa kropki dziesiętnej
    const handleDot = () => {
        if (activeField === 'volume' && !volume.includes('.')) setVolume(prev => prev + '.');
        if (activeField === 'cost' && !cost.includes('.')) setCost(prev => prev + '.');
    };

    // MIEJSCE NA TWOJE API
    const completeShift = async () => {
        setIsSubmitting(true);
        try {
            // TUTAJ: await fetch('https://twoje-api.pl/shift/end', { ... })
            console.log(`API: Refueling data - Volume: ${volume}L, Cost: ${cost}PLN`);

            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert("Shift Ended", "Refueling data has been saved. Safe travels!");
            setVolume('0');
            setCost('0');
        } catch (error) {
            Alert.alert("Error", "Failed to save shift data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}><Ionicons name="water" size={24} color="#fff" /></View>
                    <View>
                        <Text style={styles.title}>End of Shift</Text>
                        <Text style={styles.subtitle}>BUS #402 REFUELING</Text>
                    </View>
                </View>

                <View style={styles.contentRow}>
                    <View style={styles.inputCol}>
                        <TouchableOpacity
                            style={[styles.inputBox, activeField === 'volume' && styles.inputBoxActive]}
                            onPress={() => setActiveField('volume')}
                        >
                            <View style={[styles.iconBg, activeField === 'volume' ? { backgroundColor: '#111827' } : { backgroundColor: '#f3f4f6' }]}>
                                <Ionicons name="water-outline" size={24} color={activeField === 'volume' ? '#fff' : '#aaa'} />
                            </View>
                            <View style={styles.inputTexts}>
                                <Text style={styles.inputLabel}>VOLUME FUELED</Text>
                                <View style={styles.inputValueRow}>
                                    <Text style={[styles.inputValue, activeField === 'volume' ? { color: '#111' } : { color: '#ccc' }]}>{volume}</Text>
                                    <Text style={styles.unit}> L</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.inputBox, activeField === 'cost' && styles.inputBoxActive]}
                            onPress={() => setActiveField('cost')}
                        >
                            <View style={[styles.iconBg, activeField === 'cost' ? { backgroundColor: '#111827' } : { backgroundColor: '#f3f4f6' }]}>
                                <Text style={{ fontSize: 20, color: activeField === 'cost' ? '#fff' : '#aaa', fontWeight: 'bold' }}>PLN</Text>
                            </View>
                            <View style={styles.inputTexts}>
                                <Text style={styles.inputLabel}>TOTAL COST</Text>
                                <View style={styles.inputValueRow}>
                                    <Text style={[styles.inputValue, activeField === 'cost' ? { color: '#111' } : { color: '#ccc' }]}>{cost}</Text>
                                    <Text style={styles.unit}> PLN</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.numpadCol}>
                        <Numpad onPress={handleNumpadPress} onDelete={handleDelete} leftActionLabel="." onLeftAction={handleDot} />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={completeShift}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.submitBtnText}>COMPLETE SHIFT</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 30, width: '95%', maxWidth: 700, elevation: 4 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    iconContainer: { backgroundColor: '#111827', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    subtitle: { fontSize: 12, color: '#888', fontWeight: 'bold', marginTop: 4 },
    contentRow: { flexDirection: 'row', gap: 20, marginBottom: 30 },
    inputCol: { flex: 1, justifyContent: 'center', gap: 20 },
    inputBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#f9fafb' },
    inputBoxActive: { borderColor: '#111827', backgroundColor: '#fff' },
    iconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    inputTexts: { marginLeft: 15, flex: 1, alignItems: 'center' },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 4 },
    inputValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    inputValue: { fontSize: 32, fontWeight: 'bold' },
    unit: { fontSize: 14, fontWeight: 'bold', color: '#888' },
    numpadCol: { width: 260 },
    submitBtn: { backgroundColor: '#e60000', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});