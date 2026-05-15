import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IP_adress } from '../utils';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'confirmPassword' | null>(null);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showRegisterAlert("Błąd", "Proszę wypełnić wszystkie pola.");
            return;
        }

        if (password !== confirmPassword) {
            showRegisterAlert("Błąd", "Podane hasła nie są identyczne.");
            return;
        }

        if (password.length < 6) {
            showRegisterAlert("Błąd", "Hasło musi mieć co najmniej 6 znaków.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${IP_adress}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    password: password,
                    role: 'client'
                })
            });

            const data = await response.json();

            if (response.ok) {
                showRegisterAlert("Sukces", "Konto zostało utworzone pomyślnie! Możesz się teraz zalogować.");
                router.replace('/');
            } else {
                showRegisterAlert("Błąd rejestracji", data.message || "Nie udało się utworzyć konto.");
            }
        } catch (e) {
            showRegisterAlert("Błąd sieci", "Nie udało się połączyć z serwerem.");
        } finally {
            setIsLoading(false);
        }
    };

    const showRegisterAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.loginCard}>

                        {/* NOWOŚĆ: PRZYCISK COFANIA W LEWYM GÓRNYM ROGU KARTY */}
                        <TouchableOpacity style={styles.backButtonTop} onPress={() => router.replace('/')}>
                            <Ionicons name="arrow-back" size={22} color="#4b5563" />
                        </TouchableOpacity>

                        {/* Logo */}
                        <View style={styles.logoWrapper}>
                            <View style={styles.logoIcon}><Ionicons name="bus" size={18} color="#fff" /></View>
                            <Text style={styles.logoText}>KK<Text style={{ color: '#e60000' }}>Bus</Text></Text>
                        </View>

                        <Text style={styles.welcomeTitle}>Rejestracja Klienta</Text>
                        <Text style={styles.welcomeSub}>Załóż darmowe konto, aby rezerwować bilety</Text>

                        {/* Imię i Nazwisko */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>IMIĘ I NAZWISKO</Text>
                            <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperActive]}>
                                <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder=""
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ADRES E-MAIL</Text>
                            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperActive]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder=""
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Hasło */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>HASŁO</Text>
                            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperActive]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#e60000' : '#9ca3af'} />
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

                        {/* Powtórz Hasło */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>POWTÓRZ HASŁO</Text>
                            <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputWrapperActive]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'confirmPassword' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder=""
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => setFocusedField('confirmPassword')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Przycisk Zarejestruj */}
                        <TouchableOpacity
                            style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Zarejestruj się</Text>}
                        </TouchableOpacity>

                        {/* Powrót do logowania na dole */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Masz już konto? </Text>
                            <TouchableOpacity onPress={() => router.replace('/')}>
                                <Text style={styles.registerLink}>Zaloguj się</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f5f7' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 15, paddingTop: 20, paddingBottom: 25 },
    loginCard: { position: 'relative', backgroundColor: '#fff', paddingHorizontal: 30, paddingTop: 35, paddingBottom: 25, borderRadius: 24, width: '100%', maxWidth: 430, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15 },

    backButtonTop: { position: 'absolute', top: 18, left: 20, padding: 5, borderRadius: 8, backgroundColor: '#f3f4f6' },

    logoWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    logoIcon: { backgroundColor: '#e60000', padding: 6, borderRadius: 10, marginRight: 10 },
    logoText: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    welcomeTitle: { fontSize: 19, fontWeight: 'bold', textAlign: 'center', color: '#111' },
    welcomeSub: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 4, marginBottom: 20 },

    inputGroup: { marginBottom: 12 },
    label: { fontSize: 9, fontWeight: 'bold', color: '#9ca3af', marginBottom: 5, letterSpacing: 1 },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputWrapperActive: { borderColor: '#e60000', backgroundColor: '#fff' },
    input: { flex: 1, fontSize: 14, color: '#111', marginLeft: 8 },

    loginBtn: { backgroundColor: '#111827', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12, elevation: 3 },
    loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    registerText: { color: '#6b7280', fontSize: 13 },
    registerLink: { color: '#e60000', fontSize: 13, fontWeight: 'bold' }
});