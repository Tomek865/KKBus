import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

export const SearchInput = ({ label, value, flex, marginRight, onPress }: any) => (
    <TouchableOpacity
        style={[styles.container, { flex, marginRight }]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    label: { fontSize: 10, color: '#aaa', fontWeight: 'bold' },
    value: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 2 }
});