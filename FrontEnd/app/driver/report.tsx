import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Numpad } from '../../components/driver/Numpad';

export default function DriverSegmentReport() {
    const [boarded, setBoarded] = useState('0');
    const [alighted, setAlighted] = useState('0');
    const [activeField, setActiveField] = useState<'boarded' | 'alighted'>('boarded');

    const handleNumpadPress = (val: string) => {
        if (activeField === 'boarded') {
            setBoarded(prev => prev === '0' ? val : prev + val);
        } else {
            setAlighted(prev => prev === '0' ? val : prev + val);
        }
    };

    const handleDelete = () => {
        if (activeField === 'boarded') {
            setBoarded(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else {
            setAlighted(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        }
    };

    const handleClear = () => {
        if (activeField === 'boarded') setBoarded('0');
        else setAlighted('0');
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}><Ionicons name="document-text" size={24} color="#fff" /></View>
                    <View>
                        <Text style={styles.title}>Segment Report</Text>
                        <Text style={styles.subtitle}>CHRZANOW {'>'} JAWORZNO</Text>
                    </View>
                </View>

                <View style={styles.contentRow}>
                    {/* Lewa kolumna - Pola wprowadzania */}
                    <View style={styles.inputCol}>
                        <TouchableOpacity
                            style={[styles.inputBox, activeField === 'boarded' && styles.inputBoxActive]}
                            onPress={() => setActiveField('boarded')}
                        >
                            <Ionicons name="arrow-down" size={28} color={activeField === 'boarded' ? '#e60000' : '#888'} />
                            <View style={styles.inputTexts}>
                                <Text style={[styles.inputLabel, activeField === 'boarded' && styles.inputLabelActive]}>BOARDED</Text>
                                <Text style={[styles.inputValue, activeField === 'boarded' ? { color: '#111' } : { color: '#ccc' }]}>{boarded}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.inputBox, activeField === 'alighted' && styles.inputBoxActive]}
                            onPress={() => setActiveField('alighted')}
                        >
                            <Ionicons name="arrow-up" size={28} color={activeField === 'alighted' ? '#e60000' : '#888'} />
                            <View style={styles.inputTexts}>
                                <Text style={[styles.inputLabel, activeField === 'alighted' && styles.inputLabelActive]}>ALIGHTED</Text>
                                <Text style={[styles.inputValue, activeField === 'alighted' ? { color: '#111' } : { color: '#ccc' }]}>{alighted}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.warningBox}>
                            <Ionicons name="warning-outline" size={20} color="#d97706" />
                            <Text style={styles.warningText}>Ensure accurate passenger counts for capacity management.</Text>
                        </View>
                    </View>

                    {/* Prawa kolumna - Klawiatura */}
                    <View style={styles.numpadCol}>
                        <Numpad onPress={handleNumpadPress} onDelete={handleDelete} leftActionLabel="CLEAR" onLeftAction={handleClear} />
                    </View>
                </View>

                <TouchableOpacity style={styles.submitBtn}>
                    <Ionicons name="save-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.submitBtnText}>SUBMIT REPORT</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 30, width: '90%', maxWidth: 700, elevation: 4 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    iconContainer: { backgroundColor: '#111827', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    subtitle: { fontSize: 12, color: '#888', fontWeight: 'bold', marginTop: 4 },
    contentRow: { flexDirection: 'row', gap: 30, marginBottom: 30 },
    inputCol: { flex: 1, justifyContent: 'space-between' },
    inputBox: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#f9fafb' },
    inputBoxActive: { borderColor: '#e60000', backgroundColor: '#fff' },
    inputTexts: { marginLeft: 15, alignItems: 'center', flex: 1 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 4 },
    inputLabelActive: { color: '#e60000' },
    inputValue: { fontSize: 40, fontWeight: 'bold' },
    warningBox: { flexDirection: 'row', backgroundColor: '#fffbeb', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    warningText: { color: '#d97706', fontSize: 12, marginLeft: 10, flex: 1, fontWeight: '500' },
    numpadCol: { flex: 1 },
    submitBtn: { backgroundColor: '#e60000', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});