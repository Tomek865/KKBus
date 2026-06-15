import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverStyles as styles } from '../src/styles/driverStyles';
import { authFetch } from '../../utils';
import * as SecureStore from 'expo-secure-store';

export default function DriverSegmentReport() {
    const [boarded, setBoarded] = useState(0);
    const [alighted, setAlighted] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [maxCapacity, setMaxCapacity] = useState(55);
    const [currentlyOnboard, setCurrentlyOnboard] = useState(0);

    useEffect(() => {
        const loadLocalActiveTrip = async () => {
            try {
                let storedTripInfo = null;

                if (Platform.OS === 'web') {
                    storedTripInfo = localStorage.getItem('activeTripInfo');
                } else {
                    storedTripInfo = await SecureStore.getItemAsync('activeTripInfo');
                }

                if (storedTripInfo) {
                    let info = JSON.parse(storedTripInfo)
                    setMaxCapacity(info.busCapacity);
                }
            } catch (e) {
                console.error("Błąd ładowania lokalnej trasy:", e);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadLocalActiveTrip();
    }, []);

    const loadTripInfo = async () => {
        try {
            let storedTripInfo = null;

            if (Platform.OS === 'web') {
                storedTripInfo = localStorage.getItem('activeTripInfo');
            } else {
                storedTripInfo = await SecureStore.getItemAsync('activeTripInfo');
            }

            if (storedTripInfo) {
                const info = JSON.parse(storedTripInfo);

                setCurrentlyOnboard(info?.occupied_seats || 0);

                if (info?.busCapacity) {
                    setMaxCapacity(info.busCapacity);
                }
            }
        } catch (e) {
            console.error("Błąd podczas wczytywania danych trasy:", e);
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadTripInfo();
            setIsLoadingData(false);
        };
        init();
    }, []);

    // --- LOGIKA LIMITÓW ---
    // Max ile osób może wysiąść = tyle, ile aktualnie jest w autobusie
    const maxAlightedAllowed = currentlyOnboard;

    // Max ile osób może wsiąść = (wszystkie miejsca - aktualnie zajęte) + te, które właśnie wysiadły i zwolniły miejsce
    const maxBoardedAllowed = maxCapacity - currentlyOnboard + alighted;

    const handleIncrementBoarded = () => {
        if (boarded < maxBoardedAllowed) setBoarded(boarded + 1);
        else Alert.alert("Brak miejsc", "Autobus jest pełny!");
    };

    const handleDecrementBoarded = () => {
        if (boarded > 0) setBoarded(boarded - 1);
    };

    const handleIncrementAlighted = () => {
        if (alighted < maxAlightedAllowed) setAlighted(alighted + 1);
        else Alert.alert("Błąd", "W autobusie nie ma tylu pasażerów!");
    };

    const handleDecrementAlighted = () => {
        if (alighted > 0) setAlighted(alighted - 1);
    };

    const submitReport = async () => {
        setIsSubmitting(true);
        try {
            const newOnboardCount = currentlyOnboard - alighted + boarded;

            let storedTripInfo = null;
            if (Platform.OS === 'web') {
                storedTripInfo = localStorage.getItem('activeTripInfo');
            } else {
                storedTripInfo = await SecureStore.getItemAsync('activeTripInfo');
            }

            if (storedTripInfo) {
                let info = JSON.parse(storedTripInfo);

                info.occupied_seats = newOnboardCount;

                if (Platform.OS === 'web') {
                    localStorage.setItem('activeTripInfo', JSON.stringify(info));
                } else {
                    await SecureStore.setItemAsync('activeTripInfo', JSON.stringify(info));
                }
            }

            setCurrentlyOnboard(newOnboardCount);
            setBoarded(0);
            setAlighted(0);

            Alert.alert("Sukces", "Raport wysłany! Liczba pasażerów zaktualizowana.");

        } catch (error) {
            Alert.alert("Błąd", "Nie udało się zaktualizować stanu pasażerów.");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoadingData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#e60000" />
                <Text style={{ marginTop: 10 }}>Pobieranie danych o kursie...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: '#f8f9fa', padding: 20 }}>
            <View style={styles.card}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#111827', textAlign: 'center' }}>
                    Raport Odcinkowy
                </Text>

                {/* Informacja dla kierowcy */}
                <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 25 }}>
                    Pasażerów na pokładzie: <Text style={{ fontWeight: 'bold', color: '#111' }}>{currentlyOnboard} / {maxCapacity}</Text>
                </Text>

                {/* WYSIADAJĄCY (Najpierw dajemy wysiadających, bo oni zwalniają miejsce w autobusie!) */}
                <View style={{ marginBottom: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4b5563', marginBottom: 15 }}>LICZBA WYSIADAJĄCYCH</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity onPress={handleDecrementAlighted} style={{ backgroundColor: '#f3f4f6', padding: 20, borderRadius: 15 }}>
                            <Ionicons name="remove" size={40} color={alighted > 0 ? "#374151" : "#d1d5db"} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 48, fontWeight: 'bold', marginHorizontal: 40, color: '#111827', width: 60, textAlign: 'center' }}>
                            {alighted}
                        </Text>

                        <TouchableOpacity
                            onPress={handleIncrementAlighted}
                            disabled={alighted >= maxAlightedAllowed}
                            style={{ backgroundColor: alighted >= maxAlightedAllowed ? '#fca5a5' : '#e60000', padding: 20, borderRadius: 15 }}
                        >
                            <Ionicons name="add" size={40} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
                        Max do wysadzenia: {maxAlightedAllowed}
                    </Text>
                </View>

                {/* WSIADAJĄCY */}
                <View style={{ marginBottom: 30, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4b5563', marginBottom: 15 }}>LICZBA WSIADAJĄCYCH (BEZ BILETU)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity onPress={handleDecrementBoarded} style={{ backgroundColor: '#f3f4f6', padding: 20, borderRadius: 15 }}>
                            <Ionicons name="remove" size={40} color={boarded > 0 ? "#374151" : "#d1d5db"} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 48, fontWeight: 'bold', marginHorizontal: 40, color: '#111827', width: 60, textAlign: 'center' }}>
                            {boarded}
                        </Text>

                        <TouchableOpacity
                            onPress={handleIncrementBoarded}
                            disabled={boarded >= maxBoardedAllowed}
                            style={{ backgroundColor: boarded >= maxBoardedAllowed ? '#fca5a5' : '#e60000', padding: 20, borderRadius: 15 }}
                        >
                            <Ionicons name="add" size={40} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
                        Wolne miejsca: {maxBoardedAllowed - boarded}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, (boarded === 0 && alighted === 0) && { backgroundColor: '#d1d5db' }]}
                    onPress={submitReport}
                    disabled={boarded === 0 && alighted === 0 || isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>WYŚLIJ RAPORT</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
