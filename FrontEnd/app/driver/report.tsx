import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';

export default function DriverSegmentReport() {
    const [boarded, setBoarded] = useState(0);
    const [alighted, setAlighted] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => setter(value + 1);
    const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => setter(value > 0 ? value - 1 : 0);

    const submitReport = async () => {
        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/driver/reports', {
                method: 'POST',
                body: JSON.stringify({
                    trip_id: 1,
                    segment_id: 2,
                    boarded: boarded,
                    alighted: alighted
                })
            });

            if (response.ok) {
                Alert.alert("Sukces", "Raport odcinka zapisany poprawnie.");
                setBoarded(0);
                setAlighted(0);
            } else {
                throw new Error();
            }
        } catch (error) {
            Alert.alert("Błąd", "Wystąpił błąd podczas zapisywania raportu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: '#f8f9fa', padding: 20 }}>
            <View style={styles.card}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 25, color: '#111827', textAlign: 'center' }}>Raport Odcinkowy</Text>

                <View style={{ marginBottom: 30, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4b5563', marginBottom: 15 }}>LICZBA WSIADAJĄCYCH (BEZ BILETU)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity onPress={() => decrement(setBoarded, boarded)} style={{ backgroundColor: '#f3f4f6', padding: 20, borderRadius: 15 }}>
                            <Ionicons name="remove" size={40} color="#374151" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 48, fontWeight: 'bold', marginHorizontal: 40, color: '#111827' }}>{boarded}</Text>
                        <TouchableOpacity onPress={() => increment(setBoarded, boarded)} style={{ backgroundColor: '#e60000', padding: 20, borderRadius: 15 }}>
                            <Ionicons name="add" size={40} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginBottom: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4b5563', marginBottom: 15 }}>LICZBA WYSIADAJĄCYCH</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity onPress={() => decrement(setAlighted, alighted)} style={{ backgroundColor: '#f3f4f6', padding: 20, borderRadius: 15 }}>
                            <Ionicons name="remove" size={40} color="#374151" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 48, fontWeight: 'bold', marginHorizontal: 40, color: '#111827' }}>{alighted}</Text>
                        <TouchableOpacity onPress={() => increment(setAlighted, alighted)} style={{ backgroundColor: '#e60000', padding: 20, borderRadius: 15 }}>
                            <Ionicons name="add" size={40} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={submitReport}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>WYŚLIJ RAPORT</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}