import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IP_adress } from '../utils';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
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

        try {
            // 1. TWARDY RESET STORAGE'U PRZED ZALOGOWANIEM (Nowość)
            const keysToRemove = ['userToken', 'userData'];
            if (Platform.OS === 'web') {
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                // Dla bezpieczeństwa nie rzucamy błędem, jeśli klucza nie ma w SecureStore
                try {
                    await Promise.all(keysToRemove.map(key => SecureStore.deleteItemAsync(key)));
                } catch (e) { console.log("Brak starych danych do usunięcia"); }
            }

            // 2. STRZAŁ DO BACKENDU
            const response = await fetch(`${IP_adress}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password: password
                })
            });

            const data = await response.json();
            if (response.ok) {
                console.log('dane z logowania', data)
                const role = data.role?.toLowerCase();
                
                if (data.token) {
                    try {
                        // 3. ZAPIS NOWYCH, ŚWIEŻYCH DANYCH
                        if (Platform.OS === 'web') {
                            localStorage.setItem('userToken', String(data.token));
                            if (data.data) {
                                localStorage.setItem('userData', JSON.stringify(data.data));
                            }
                        } else {
                            await SecureStore.setItemAsync('userToken', String(data.token));
                            if (data.data) { // Poprawiony bug: było data.user
                                await SecureStore.setItemAsync('userData', JSON.stringify(data.data));
                            }
                        }
                    } catch (error) {
                        console.error("error while trying to save user session data: ", error);
                    }
                }

                if (role === 'admin') {
                    router.replace('/admin');
                } else if (role === 'driver') {
                    router.replace('/driver');
                } else if (role === 'client') {
                    router.replace('/passenger');
                } else {
                    Alert.alert("Błąd roli", `Twoje konto ma przypisaną nieobsługiwaną rolę: ${data.role}`);
                }
            } else {
                Alert.alert("Błąd", data.message || "Niepoprawny e-mail lub hasło.");
            }
        } catch (e) {
            Alert.alert("Błąd sieci", "Nie udało się połączyć z serwerem");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                <View style={styles.loginCard}>
                    <View style={styles.logoWrapper}>
                        <View style={styles.logoIcon}><Ionicons name="bus" size={24} color="#fff" /></View>
                        <Text style={styles.logoText}>KK<Text style={{ color: '#e60000' }}>Bus</Text></Text>
                    </View>

                    <Text style={styles.welcomeTitle}>Panel Logowania</Text>
                    <Text style={styles.welcomeSub}>Zaloguj się, aby kontynuować</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ADRES E-MAIL</Text>
                        <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperActive]}>
                            <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? '#e60000' : '#9ca3af'} />
                            <TextInput
                                style={styles.input}
                                placeholder=""
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>HASŁO</Text>
                        <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperActive]}>
                            <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? '#e60000' : '#9ca3af'} />
                            <TextInput
                                style={styles.input}
                                placeholder=""
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
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Zaloguj się</Text>}
                    </TouchableOpacity>

                    {/* NOWOŚĆ: Sekcja przekierowania do tworzenia konta klienta */}
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Nie masz konta? </Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={styles.registerLink}>Załóż konto klienta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.footer}>KKbus v1.0</Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f5f7' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loginCard: { backgroundColor: '#fff', padding: 40, borderRadius: 32, width: '100%', maxWidth: 450, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    logoWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 35 },
    logoIcon: { backgroundColor: '#e60000', padding: 8, borderRadius: 12, marginRight: 12 },
    logoText: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
    welcomeTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#111' },
    welcomeSub: { textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 5, marginBottom: 35 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', marginBottom: 8, letterSpacing: 1 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 15, height: 55 },
    inputWrapperActive: { borderColor: '#e60000', backgroundColor: '#fff' },
    input: { flex: 1, fontSize: 15, color: '#111', marginLeft: 10 },
    loginBtn: { backgroundColor: '#111827', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 15, elevation: 4 },
    loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // NOWE STYLE STWORZONE DLA ODNOŚNIKA REJESTRACJI
    registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25 },
    registerText: { color: '#6b7280', fontSize: 14 },
    registerLink: { color: '#e60000', fontSize: 14, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 30, color: '#ccc', fontSize: 11, fontWeight: 'bold' }
});
