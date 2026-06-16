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
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAgreed, setIsAgreed] = useState(false); // NOWY STAN DLA CHECKBOXA
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'phone' | 'birthDate' | 'password' | 'confirmPassword' | null>(null);

    // Sprytne formatowanie daty (samo dodaje myślniki podczas wpisywania)
    const handleDateChange = (text: string) => {
        if (text.length < birthDate.length) {
            setBirthDate(text);
            return;
        }

        let cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
        }
        if (cleaned.length > 4) {
            formatted = formatted.slice(0, 5) + '-' + cleaned.slice(4, 8);
        }
        setBirthDate(formatted);
    };

    const handleRegister = async () => {
        if (!name || !email || !phone || !birthDate || !password || !confirmPassword) {
            showRegisterAlert("Błąd", "Proszę wypełnić wszystkie pola.");
            return;
        }

        // WALIDACJA WYMAGANEGO CHECKBOXA
        if (!isAgreed) {
            showRegisterAlert("Błąd", "Musisz zaakceptować regulamin programu lojalnościowego.");
            return;
        }

        if (birthDate.length !== 10) {
            showRegisterAlert("Błąd", "Wprowadź pełną datę urodzenia w formacie DD-MM-RRRR.");
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
            const [day, month, year] = birthDate.split('-');
            const backendFormattedDate = `${year}-${month}-${day}`;

            const response = await fetch(`${IP_adress}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    phone: phone.trim(),
                    birthDate: backendFormattedDate,
                    password: password,
                    role: 'client'
                })
            });

            const data = await response.json();

            if (response.ok) {
                showRegisterAlert("Sukces", "Konto zostało pomyślnie utworzone! Możesz się teraz zalogować.");
                router.replace('/');
            } else {
                showRegisterAlert("Błąd Rejestracji", data.message || "Nie udało się utworzyć konta.");
            }
        } catch (e) {
            showRegisterAlert("Błąd Sieci", "Nie udało się połączyć z serwerem.");
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

                        <TouchableOpacity style={styles.backButtonTop} onPress={() => router.replace('/')}>
                            <Ionicons name="arrow-back" size={22} color="#4b5563" />
                        </TouchableOpacity>

                        <View style={styles.logoWrapper}>
                            <View style={styles.logoIcon}><Ionicons name="bus" size={18} color="#fff" /></View>
                            <Text style={styles.logoText}>KK<Text style={{ color: '#e60000' }}>Bus</Text></Text>
                        </View>

                        <Text style={styles.welcomeTitle}>Rejestracja Pasażera</Text>
                        <Text style={styles.welcomeSub}>Załóż darmowe konto, aby rezerwować bilety</Text>

                        {/* Imię i Nazwisko */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, focusedField === 'name' && styles.labelActive]}>IMIĘ I NAZWISKO *</Text>
                            <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperActive]}>
                                <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Jan Kowalski"
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, focusedField === 'email' && styles.labelActive]}>ADRES EMAIL *</Text>
                            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperActive]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="jan@example.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Telefon */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, focusedField === 'phone' && styles.labelActive]}>NUMER TELEFONU *</Text>
                            <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputWrapperActive]}>
                                <Ionicons name="call-outline" size={18} color={focusedField === 'phone' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="123 456 789"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    onFocus={() => setFocusedField('phone')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Data Urodzenia */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, focusedField === 'birthDate' && styles.labelActive]}>DATA URODZENIA (DD-MM-RRRR) *</Text>
                            <View style={[styles.inputWrapper, focusedField === 'birthDate' && styles.inputWrapperActive]}>
                                <Ionicons name="calendar-outline" size={18} color={focusedField === 'birthDate' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="np. 15-06-1995"
                                    value={birthDate}
                                    onChangeText={handleDateChange}
                                    keyboardType="numeric"
                                    maxLength={10}
                                    onFocus={() => setFocusedField('birthDate')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Hasło */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, focusedField === 'password' && styles.labelActive]}>HASŁO *</Text>
                            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperActive]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min. 6 znaków"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Potwierdzenie Hasła */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, focusedField === 'confirmPassword' && styles.labelActive]}>POTWIERDŹ HASŁO *</Text>
                            <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputWrapperActive]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'confirmPassword' ? '#e60000' : '#9ca3af'} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Powtórz hasło"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => setFocusedField('confirmPassword')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* POPRAWIONY I AKTYWNY CHECKBOX */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 15 }}>
                            <TouchableOpacity onPress={() => setIsAgreed(!isAgreed)} style={{ padding: 6 }}>
                                <Ionicons name={isAgreed ? 'checkbox' : 'square-outline'} size={22} color="#e60000" />
                            </TouchableOpacity>
                            <Text 
                                style={{ fontSize: 13, color: '#4b5563', flex: 1, marginLeft: 8 }}
                                onPress={() => setIsAgreed(!isAgreed)}
                            >
                                Zgadzam się na warunki korzystania z usługi karty lojalnościowej. *
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.loginBtn, 
                                (isLoading || !isAgreed) && { opacity: 0.5 } // Wizualne zablokowanie przycisku
                            ]}
                            onPress={handleRegister}
                            disabled={isLoading || !isAgreed} // Fizyczna blokada kliknięcia
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Zarejestruj się</Text>}
                        </TouchableOpacity>

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
    welcomeTitle: { fontSize: 19, fontWeight: 'bold', textAlign: 'center', color: '#11' },
    welcomeSub: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 4, marginBottom: 20 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 9, fontWeight: 'bold', color: '#9ca3af', marginBottom: 5, letterSpacing: 1 },
    labelActive: { color: '#e60000' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputWrapperActive: { 
        borderColor: '#e60000', 
        backgroundColor: '#fff',
        shadowColor: '#e60000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3 
    },
    input: { flex: 1, fontSize: 14, color: '#111', marginLeft: 8 },
    loginBtn: { backgroundColor: '#111827', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12, elevation: 3 },
    loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    registerText: { color: '#6b7280', fontSize: 13 },
    registerLink: { color: '#e60000', fontSize: 13, fontWeight: 'bold' }
});