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
    const [userData, setUserData] = useState({ name: '', email: '', phone: '' });

    // Stany dla nowych sekcji
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);

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
                            name: `${fName} ${lName}`,
                            email: actual_data.email || 'Brak danych',
                            phone: phone_number
                        });
                    } else {
                        console.warn("Brak danych użytkownika w Local Storage");
                    }

                } catch (error) {
                    console.error("error while trying to load user session data: ", error);
                }
            }

            if (activeSection === 'payment') {
                setIsLoadingPayment(true);
                try {
                    const res = await authFetch('/api/client/profile/payment-methods');
                    if (res.ok) {
                        const data = await res.json();
                        setPaymentMethods(data || []);
                    } else {
                        // Jeśli endpoint nie istnieje, zostaw puste
                        setPaymentMethods([]);
                    }
                } catch (err) { console.error("Błąd pobierania kart:", err); }
                finally { setIsLoadingPayment(false); }
            }

            if (activeSection === 'language' || activeSection === 'notifications') {
                try {
                    const lang = await AsyncStorage.getItem('userLanguage');
                    if (lang) setSelectedLanguage(lang);

                    const push = await AsyncStorage.getItem('pushNotifications');
                    const email = await AsyncStorage.getItem('emailNotifications');
                    setNotifications({
                        push: push !== 'false', // Domyślnie true
                        email: email !== 'false'
                    });
                } catch (err) { }
            }
        };

        loadSectionData();
    }, [visible, activeSection]);

    const handleSavePersonal = async () => {
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
        // Opcjonalnie tutaj można by było wysłać do API preferencję
    };

    if (!visible) return null;

    const getModalTitle = () => {
        switch (activeSection) {
            case 'personal': return 'Personal Information';
            case 'payment': return 'Payment Methods';
            case 'notifications': return 'Notifications';
            case 'language': return 'Language';
            case 'help': return 'Help & Support';
            case 'terms': return 'Terms of Service';
            default: return 'Settings';
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'personal':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Full Name</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
                            value={userData.name}
                            placeholder="Wpisz imię i nazwisko"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, name: text }))}
                        />

                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Email Address</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
                            value={userData.email}
                            placeholder="Wpisz adres email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, email: text }))}
                        />

                        <Text style={{ color: '#4b5563', marginBottom: 6, fontWeight: '600' }}>Phone Number</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 24, backgroundColor: '#f9fafb' }}
                            value={userData.phone}
                            placeholder="Wpisz numer telefonu"
                            keyboardType="phone-pad"
                            onChangeText={(text) => setUserData(prev => ({ ...prev, phone: text }))}
                        />

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSavePersonal} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                );

            case 'payment':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        {isLoadingPayment ? (
                            <ActivityIndicator color="#e60000" style={{ marginTop: 20 }} />
                        ) : paymentMethods.length > 0 ? (
                            paymentMethods.map((method, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 10 }}>
                                    <Ionicons name="card" size={24} color="#4b5563" />
                                    <Text style={{ marginLeft: 15, fontSize: 16 }}>**** **** **** {method.last4}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Ionicons name="card-outline" size={48} color="#d1d5db" />
                                <Text style={{ color: '#6b7280', marginTop: 10 }}>No payment methods found.</Text>
                            </View>
                        )}
                        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]}>
                            <Text style={styles.primaryBtnText}>Add Payment Method</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'notifications':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Push Notifications</Text>
                                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Updates about your trips and tickets.</Text>
                            </View>
                            <Switch value={notifications.push} onValueChange={() => toggleNotification('push')} trackColor={{ false: '#d1d5db', true: '#e60000' }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Email Notifications</Text>
                                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Promotions, news, and invoices.</Text>
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
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Contact Support</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 20, lineHeight: 22 }}>
                            If you encounter any issues with your reservation or the app, please dont hesitate to reach out.
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Ionicons name="call" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 16 }}>+48 123 456 789</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="mail" size={20} color="#e60000" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 16 }}>support@kkbus.pl</Text>
                        </View>
                    </View>
                );

            case 'terms':
                return (
                    <View style={{ paddingVertical: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>1. General Terms</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 15, lineHeight: 22 }}>
                            By using the KKBus application, you agree to comply with our general conditions of carriage. Tickets purchased are strictly for the assigned route and time.
                        </Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>2. Refund Policy</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 15, lineHeight: 22 }}>
                            Tickets can be canceled up to 24 hours before the departure for a full refund. Cancellations made later will not be refunded.
                        </Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>3. Data Privacy</Text>
                        <Text style={{ color: '#4b5563', marginBottom: 15, lineHeight: 22 }}>
                            Your personal and payment data is secured and will not be shared with third parties without your explicit consent.
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
