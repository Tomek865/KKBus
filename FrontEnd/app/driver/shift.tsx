import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Numpad } from '../../components/driver/Numpad';

export default function DriverEndShift() {
    const [volume, setVolume] = useState('0');
    const [cost, setCost] = useState('0.00');
    const [activeField, setActiveField] = useState<'volume' | 'cost'>('volume');

    const handleNumpadPress = (val: string) => {
        if (activeField === 'volume') {
            setVolume(prev => prev === '0' ? val : prev + val);
        } else {
            setCost(prev => prev === '0.00' ? val : prev + val);
        }
    };

    const handleDelete = () => {
        if (activeField === 'volume') {
            setVolume(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else {
            setCost(prev => prev.length > 1 ? prev.slice(0, -1) : '0.00');
        }
    };

    const handleDot = () => {
        if (activeField === 'volume' && !volume.includes('.')) setVolume(prev => prev + '.');
        if (activeField === 'cost' && !cost.includes('.')) setCost(prev => prev + '.');
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
                    {/* Lewa kolumna */}
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
                                <Text style={styles.inputValueRow}>
                                    <Text style={[styles.inputValue, activeField === 'volume' ? { color: '#111' } : { color: '#ccc' }]}>{volume}</Text>
                                    <Text style={styles.unit}> L</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.inputBox, activeField === 'cost' && styles.inputBoxActive]}
                            onPress={() => setActiveField('cost')}
                        >
                            <View style={[styles.iconBg, activeField === 'cost' ? { backgroundColor: '#111827' } : { backgroundColor: '#f3f4f6' }]}>
                                <Text style={{ fontSize: 20, color: activeField === 'cost' ? '#fff' : '#aaa', fontWeight: 'bold' }}>$</Text>
                            </View>
                            <View style={styles.inputTexts}>
                                <Text style={styles.inputLabel}>TOTAL COST</Text>
                                <Text style={styles.inputValueRow}>
                                    <Text style={[styles.inputValue, activeField === 'cost' ? { color: '#111' } : { color: '#ccc' }]}>{cost}</Text>
                                    <Text style={styles.unit}> PLN</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Prawa kolumna */}
                    <View style={styles.numpadCol}>
                        <Numpad onPress={handleNumpadPress} onDelete={handleDelete} leftActionLabel="." onLeftAction={handleDot} />
                    </View>
                </View>

                <TouchableOpacity style={styles.submitBtn}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.submitBtnText}>COMPLETE SHIFT</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Style są prawie identyczne jak w raporcie, więc je powielam z drobnymi zmianami
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 30, width: '90%', maxWidth: 700, elevation: 4 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    iconContainer: { backgroundColor: '#111827', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    subtitle: { fontSize: 12, color: '#888', fontWeight: 'bold', marginTop: 4 },
    contentRow: { flexDirection: 'row', gap: 30, marginBottom: 30 },
    inputCol: { flex: 1, justifyContent: 'center', gap: 20 },
    inputBox: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#f9fafb' },
    inputBoxActive: { borderColor: '#111827', backgroundColor: '#fff' },
    iconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    inputTexts: { marginLeft: 15, flex: 1, alignItems: 'center' },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 4 },
    inputValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    inputValue: { fontSize: 36, fontWeight: 'bold' },
    unit: { fontSize: 16, fontWeight: 'bold', color: '#888' },
    numpadCol: { flex: 1 },
    submitBtn: { backgroundColor: '#e60000', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});