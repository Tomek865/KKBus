import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NumpadProps {
    onPress: (val: string) => void;
    onDelete: () => void;
    leftActionLabel: string; // 'CLEAR' dla raportu, '.' dla paliwa
    onLeftAction: () => void;
}

export const Numpad = ({ onPress, onDelete, leftActionLabel, onLeftAction }: NumpadProps) => {
    const keys = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
    ];

    return (
        <View style={styles.container}>
            {keys.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map((key) => (
                        <TouchableOpacity key={key} style={styles.btn} onPress={() => onPress(key)}>
                            <Text style={styles.btnText}>{key}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            <View style={styles.row}>
                <TouchableOpacity style={[styles.btn, styles.actionBtn]} onPress={onLeftAction}>
                    <Text style={styles.actionBtnText}>{leftActionLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => onPress('0')}>
                    <Text style={styles.btnText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.delBtn]} onPress={onDelete}>
                    <Text style={styles.delBtnText}>DEL</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 16, padding: 10, justifyContent: 'space-between' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    btn: { flex: 1, backgroundColor: '#fff', marginHorizontal: 5, aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    btnText: { fontSize: 28, fontWeight: 'bold', color: '#111' },
    actionBtn: { backgroundColor: '#e5e7eb' },
    actionBtnText: { fontSize: 16, fontWeight: 'bold', color: '#4b5563' },
    delBtn: { backgroundColor: '#fee2e2' },
    delBtnText: { fontSize: 16, fontWeight: 'bold', color: '#e60000' }
});