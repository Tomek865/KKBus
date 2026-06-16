import React, { useState, useEffect } from 'react';
import { View, Text, Modal, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { passengerStyles as styles } from '../src/styles/passengerStyles';
import { authFetch } from '../../utils';

interface ProfileSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    activeSection: 'personal' | 'payment' | 'notifications' | 'language' | 'help' | 'terms' | null;
}

export default function ProfileSettingsModal({ visible, onClose, activeSection }: ProfileSettingsModalProps) {
    const [userData, setUserData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    const [confirmPassword, setConfirmPassword] = useState('');

    const [notifications, setNotifications] = useState({ push: true, email: true });
    const [selectedLanguage, setSelectedLanguage] = useState('pl');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;

        const loadSectionData = async () => {
            if (activeSection === 'personal') {
                let user_data_string;

                try {
                    if (Platform.OS === 'web') {
                        user_data_string = localStorage.getItem('userData');
                    } else {
                        user_data_string = await SecureStore.getItemAsync('userData');
                    }

                    if (user_data_string) {
                        const parsed_data = JSON.parse(user_data_string);
                        const actual_data = parsed_data.data ? parsed_data.data : parsed_data;
                        const fName = actual_data.first_name || '';
                        const lName = actual_data.last_name || '';
                        const phone_number = actual_data.phone || '';

                        setUserData({
                            firstName: `${fName}`,
                            lastName: `${lName}`,
                            email: actual_data.email || 'Brak danych',
                            phone: phone_number,
                            password: ''
                        });
                        setConfirmPassword('');
                    } else {
                        console.warn("Brak danych użytkownika w Local Storage");
                    }

                } catch (error) {
                    console.error("error while trying to load user session data: ", error);
                }
            }

            if (activeSection === 'language' || activeSection === 'notifications') {
                try {
                    const lang = await AsyncStorage.getItem('userLanguage');
                    if (lang) setSelectedLanguage(lang);

                    const push = await AsyncStorage.getItem('pushNotifications');
                    const email = await AsyncStorage.getItem('emailNotifications');
                    setNotifications({
                        push: push !== 'false',
                        email: email !== 'false'
                    });
                } catch (err) { }
            }
        };

        loadSectionData();
    }, [visible, activeSection]);

    const handleSavePersonal = async () => {
        if (userData.password || confirmPassword) {
            if (userData.password !== confirmPassword) {
                Alert.alert("Błąd", "Podane hasła nie są identyczne.");
                return;
            }
            if (userData.password.length < 6) {
                Alert.alert("Błąd", "Hasło musi mieć co najmniej 6 znaków.");
                return;
            }
        }

        setIsSaving(true);
        try {
            const res = await authFetch('/api/client/profile/user/update', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            if (res.ok) {
                Alert.alert("Sukces", "Zaktualizowano profil.");
                onClose();
            } else {
                Alert.alert("Błąd", "Nie udało się zaktualizować profilu.");
            }
        } catch (err) {
            Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNotification = async (type: 'push' | 'email') => {
        const newValue = !notifications[type];
        setNotifications(prev => ({ ...prev, [type]: newValue }));
        await AsyncStorage.setItem(`${type}Notifications`, String(newValue));
    };

    const changeLanguage = async (lang: string) => {
        setSelectedLanguage(lang);
        await AsyncStorage.setItem('userLanguage', lang);
    };

    if (!visible) return null;

    const getModalTitle = () => {
        switch (activeSection) {
            case 'personal': return 'Dane Osobowe';
            case 'notifications': return 'Powiadomienia';
            case 'language': return 'Język';
            case 'help': return 'Pomoc i Wsparcie';
            case 'terms': return 'Regulamin';
            default: return 'Ustawienia';
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'personal':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Imię</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
                            value={userData.firstName}
                            placeholder="Wpisz imię"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, firstName: text }))}
                        />
                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Nazwisko</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
                            value={userData.lastName}
                            placeholder="Wpisz nazwisko"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, lastName: text }))}
                        />

                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Adres Email</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
                            value={userData.email}
                            placeholder="Wpisz adres email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, email: text }))}
                        />

                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Numer Telefonu</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 24, backgroundColor: '#f9fafb' }}
                            value={userData.phone}
                            placeholder="Wpisz numer telefonu"
                            keyboardType="phone-pad"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, phone: text }))}
                        />
                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Hasło</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 24, backgroundColor: '#f9fafb' }}
                            value={userData.password}
                            placeholder="Wpisz nowe hasło"
                            secureTextEntry
                            onChangeText={(text) => setUserData(prev => ({ ...prev, password: text }))}
                        />
                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Potwierdź Hasło</Text>
                        {/* 3. PODPIĘCIE NOWEGO STANU POD DRUGIE POLE HASŁA */}
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 24, backgroundColor: '#f9fafb' }}
                            value={confirmPassword}
                            placeholder="Powtórz nowe hasło"
                            secureTextEntry
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSavePersonal} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Zapisz Zmiany</Text>}
                        </TouchableOpacity>
                    </View>
                );

            case 'notifications':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Powiadomienia Push</Text>
                                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Aktualizacje o Twoich podróżach i biletach.</Text>
                            </View>
                            <Switch value={notifications.push} onValueChange={() => toggleNotification('push')} trackColor={{ false: '#d1d5db', true: '#e60000' }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Powiadomienia Email</Text>
                                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Promocje, nowości i faktury.</Text>
                            </View>
                            <Switch value={notifications.email} onValueChange={() => toggleNotification('email')} trackColor={{ false: '#d1d5db', true: '#e60000' }} />
                        </View>
                    </View>
                );

            case 'language':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <TouchableOpacity onPress={() => changeLanguage('pl')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            <Text style={{ fontSize: 16 }}>Polski</Text>
                            {selectedLanguage === 'pl' && <Ionicons name="checkmark" size={20} color="#e60000" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => changeLanguage('en')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            <Text style={{ fontSize: 16 }}>English</Text>
                            {selectedLanguage === 'en' && <Ionicons name="checkmark" size={20} color="#e60000" />}
                        </TouchableOpacity>
                    </View>
                );

            case 'help':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#111' }}>Firma transportowa KKBus sp z.o.o</Text>

                        <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8, color: '#4b5563' }}>O nas</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 20, lineHeight: 22 }}>
                            Firma zajmuje się transportem osób między Krakowem a Katowicami. Posiadamy nowoczesną flotę busów i autokarów. Zapewniamy komfortowe i bezpieczne przejazdy na naszych trasach.
                        </Text>

                        <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8, color: '#4b5563' }}>Dane kontaktowe</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Ionicons name="location" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 15, color: '#4b5563' }}>ul. Jana Pawła II 37, 31-864 Kraków</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Ionicons name="call" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <View>
                                <Text style={{ fontSize: 15, color: '#4b5563' }}>(070) 012-34-56</Text>
                                <Text style={{ fontSize: 15, color: '#4b5563', marginTop: 4 }}>(070) 011-22-33</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="mail" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 15, color: '#4b5563' }}>sekretariat@kkbus.pl</Text>
                        </View>
                    </View>
                );

            case 'terms':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>1. Warunki Ogólne</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 15, lineHeight: 22 }}>
                            Korzystając z aplikacji KKBus, zgadzasz się na przestrzeganie naszych ogólnych warunków przewozu. Zakupione bilety obowiązują wyłącznie na przydzielonej trasie i w określonym czasie.
                        </Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>2. Polityka zwrotów</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 15, lineHeight: 22 }}>
                            Bilety można anulować do 24 godzin przed odjazdem, aby uzyskać pełny zwrot kosztów. Późniejsze anulacje nie podlegają zwrotowi.
                        </Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>3. Prywatność danych</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 15, lineHeight: 22 }}>
                            Twoje dane osobowe i płatnicze są zabezpieczone i nie będą udostępniane stronom trzecim bez Twojej wyraźnej zgody.
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainerAlt || { flex: 1, backgroundColor: '#fff' }}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtnIcon}>
                        <Ionicons name="close" size={24} color="#111" />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}