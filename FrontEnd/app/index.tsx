import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
    Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IP_adress } from '../utils';
import * as SecureStore from 'expo-secure-store';
import { ScrollView } from 'react-native-gesture-handler';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setIsLoading(true);

        try {
            const keysToRemove = ['userToken', 'userData'];
            if (Platform.OS === 'web') {
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                try {
                    await Promise.all(keysToRemove.map(key => SecureStore.deleteItemAsync(key)));
                } catch (e) { console.log("No old data to remove"); }
            }

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
                console.log('login data', data)
                const role = data.role?.toLowerCase();

                if (data.token) {
                    try {
                        if (Platform.OS === 'web') {
                            localStorage.setItem('userToken', String(data.token));
                            if (data.data) {
                                localStorage.setItem('userData', JSON.stringify(data.data));
                            }
                        } else {
                            await SecureStore.setItemAsync('userToken', String(data.token));
                            if (data.data) {
                                await SecureStore.setItemAsync('userData', JSON.stringify(data.data));
                            }
                        }
                    } catch (error) {
                        console.error("error while trying to save user session data: ", error);
                    }
                }

                if (role === 'admin' || role === 'owner') {
                    router.replace('/admin');
                } else if (role === 'driver') {
                    router.replace('/driver');
                } else if (role === 'client') {
                    router.replace('/passenger');
                } else {
                    Alert.alert("Role Error", `Your account has an unsupported role assigned: ${data.role}`);
                }
            } else {
                Alert.alert("Error", data.message || "Invalid email or password.");
            }
        } catch (e) {
            Alert.alert("Network Error", "Failed to connect to the server.");
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

                    <Text style={styles.welcomeTitle}>Login Panel</Text>
                    <Text style={styles.welcomeSub}>Log in to continue</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
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
                        <Text style={styles.label}>PASSWORD</Text>
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
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Log in</Text>}
                    </TouchableOpacity>

                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Dont have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={styles.registerLink}>Create an account</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.guestContainer}>
                        <TouchableOpacity onPress={() => router.replace('/passenger')}>
                            <Text style={styles.guestLink}>Continue as guest</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={{ marginTop: 15 }}>
                            <Text style={{ color: '#e60000', fontSize: 14, fontWeight: '600' }}>About us & Contact</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.footer}>KKbus v1.0</Text>
            </KeyboardAvoidingView>

            {/* MODAL: ABOUT US (FOR GUEST USERS) */}
            <Modal visible={infoModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setInfoModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>About us & Contact</Text>
                        <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#111" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#111' }}>Transport Company KKBus sp z.o.o</Text>

                        <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8, color: '#4b5563' }}>About us</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 20, lineHeight: 22 }}>
                            The company handles passenger transport between Kraków and Katowice. We offer safe transport using a modern fleet of vehicles, and our guest users can always count on full access to route and pricing information.
                        </Text>

                        <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8, color: '#4b5563' }}>Contact Details</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Ionicons name="location" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 15, color: '#4b5563' }}>ul. Jana Pawła II 37, 31-864 Kraków</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Ionicons name="call" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <View>
                                <Text style={{ fontSize: 15, color: '#4b5563' }}>(070) 012-34-56</Text>
                                <Text style={{ fontSize: 15, color: '#4b5563', marginTop: 4 }}>(067) 011-22-33</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="mail" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 15, color: '#4b5563' }}>sekretariat@kkbus.pl</Text>
                        </View>
                       
                    </ScrollView>
                </SafeAreaView>
            </Modal>
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

    registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25 },
    registerText: { color: '#6b7280', fontSize: 14 },
    registerLink: { color: '#e60000', fontSize: 14, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 30, color: '#ccc', fontSize: 11, fontWeight: 'bold' },
    guestContainer: { marginTop: 25, alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    guestLink: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
});