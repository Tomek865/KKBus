// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
// import { router } from 'expo-router';

// export default function Home() {
//     return (
//         <SafeAreaView style={styles.container}>
//             <Text style={styles.logo}>KK<Text style={styles.logoRed}>BUS</Text></Text>
//             <Text style={styles.subtitle}>
//                 A comprehensive, multi-platform solution for regional bus transit. Select your role to view the tailored interface.
//             </Text>

//             <View style={styles.cardsContainer}>
//                 {/* Karta Pasażera */}
//                 <TouchableOpacity
//                     style={styles.card}
//                     onPress={() => router.push('/passenger' as any)}
//                 >
//                     <Text style={styles.cardBadge}>Mobile View</Text>
//                     <Text style={styles.cardTitle}>Passenger App</Text>
//                     <Text style={styles.cardDesc}>Mobile-first. Search routes, book tickets, and manage your profile.</Text>
//                 </TouchableOpacity>

//                 {/* Karta Kierowcy */}
//                 <TouchableOpacity
//                     style={styles.card}
//                     onPress={() => router.push('/driver' as any)}
//                 >
//                     <Text style={styles.cardBadge}>Tablet View</Text>
//                     <Text style={styles.cardTitle}>Driver Dashboard</Text>
//                     <Text style={styles.cardDesc}>Tablet-optimized. Active route tracking, segment reports, and shift management.</Text>
//                 </TouchableOpacity>

//                 {/* Karta Admina */}
//                 <TouchableOpacity
//                     style={styles.card}
//                     onPress={() => router.push('/admin' as any)}
//                 >
//                     <Text style={styles.cardBadge}>Desktop View</Text>
//                     <Text style={styles.cardTitle}>Admin Portal</Text>
//                     <Text style={styles.cardDesc}>Desktop-focused. Real-time statistics, schedule management, and client reports.</Text>
//                 </TouchableOpacity>
//             </View>
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f8f9fa', alignItems: 'center', padding: 20 },
//     logo: { fontSize: 32, fontWeight: 'bold', color: '#1a1f2e', marginTop: 40 },
//     logoRed: { color: '#e60000' },
//     subtitle: { textAlign: 'center', color: '#6c757d', marginVertical: 20, maxWidth: 600 },
//     cardsContainer: { width: '100%', maxWidth: 800, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
//     card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, width: 300, minHeight: 200 },
//     cardBadge: { color: '#e60000', fontSize: 12, fontWeight: 'bold', alignSelf: 'flex-end', marginBottom: 10 },
//     cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1f2e', marginBottom: 8 },
//     cardDesc: { textAlign: 'center', color: '#6c757d' }
// });



import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    // STANY DLA PÓL - to pozwala na wpisywanie tekstu
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Błąd", "Proszę wypełnić wszystkie pola.");
            return;
        }

        setIsLoading(true);

        // // fetch - Tutaj wykonasz zapytanie do API (np. POST /api/login)
        // // Przykładowo: const response = await fetch('https://twoje-api.pl/login', { ... });
        // // Na podstawie odpowiedzi z serwera (np. data.role) przekierujesz użytkownika.

        // Symulacja logowania i sprawdzania uprawnień
        setTimeout(() => {
            setIsLoading(false);
            const userEmail = email.toLowerCase().trim();

            // W prawdziwej aplikacji te warunki będą oparte na danych zwróconych z // fetch
            if (userEmail === 'admin@kkbus.pl') {
                router.replace('/admin');
            } else if (userEmail === 'driver@kkbus.pl') {
                router.replace('/driver');
            } else {
                router.replace('/passenger');
            }
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.loginCard}>
                    {/* POPRAWIONE LOGO: Pełna nazwa zamiast samej ikony */}
                    <View style={styles.logoWrapper}>
                        <View style={styles.logoIcon}>
                            <Ionicons name="bus" size={24} color="#fff" />
                        </View>
                        <Text style={styles.logoText}>
                            KK<Text style={{ color: '#e60000' }}>Bus</Text>
                        </Text>
                    </View>

                    <Text style={styles.welcomeTitle}>Panel Logowania</Text>
                    <Text style={styles.welcomeSub}>Zaloguj się, aby zarządzać transportem</Text>

                    {/* POLE: EMAIL */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ADRES E-MAIL</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'email' && styles.inputWrapperActive
                        ]}>
                            <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? '#e60000' : '#9ca3af'} />
                            <TextInput
                                style={styles.input}
                                placeholder="przyklad@firma.pl"
                                placeholderTextColor="#ccc"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* POLE: HASŁO */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>HASŁO</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'password' && styles.inputWrapperActive
                        ]}>
                            <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? '#e60000' : '#9ca3af'} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#ccc"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginBtnText}>Zaloguj się</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>KKbus v1.0</Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f5f7' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loginCard: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 32,
        width: '100%',
        maxWidth: 450,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    logoWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 35 },
    logoIcon: {
        backgroundColor: '#e60000',
        padding: 8,
        borderRadius: 12,
        marginRight: 12,
        elevation: 4
    },
    logoText: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
    welcomeTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#111' },
    welcomeSub: { textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 5, marginBottom: 35 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', marginBottom: 8, letterSpacing: 1 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#f3f4f6',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 55
    },
    inputWrapperActive: { borderColor: '#e60000', backgroundColor: '#fff' },
    input: { flex: 1, fontSize: 15, color: '#111', marginLeft: 10 },
    loginBtn: {
        backgroundColor: '#111827',
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        elevation: 4
    },
    loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    footer: { position: 'absolute', bottom: 30, color: '#ccc', fontSize: 11, fontWeight: 'bold' }
});