import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ActiveSection = 'personal' | 'payment' | 'notifications' | 'language' | 'help' | 'terms' | null;

interface ProfileSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    activeSection: ActiveSection;
}

export default function ProfileSettingsModal({ visible, onClose, activeSection }: ProfileSettingsModalProps) {
    // --- STANY ---
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [selectedLang, setSelectedLang] = useState('English (UK)');
    
    // Nowy stan do zarządzania widokiem płatności (lista vs formularz)
    const [paymentView, setPaymentView] = useState<'list' | 'edit'>('list');

    // Resetowanie widoku płatności przy każdym otwarciu modala
    useEffect(() => {
        if (visible) {
            setPaymentView('list');
        }
    }, [visible]);

    const getTitle = () => {
        switch (activeSection) {
            case 'personal': return 'Personal Information';
            case 'payment': return paymentView === 'list' ? 'Payment Methods' : 'Add New Card';
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
                    <View style={styles.sectionContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput style={styles.input} defaultValue="Anna Kowalska" placeholder="Enter your name" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput style={styles.input} defaultValue="anna.kowalska@example.com" keyboardType="email-address" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput style={styles.input} defaultValue="+48 123 456 789" keyboardType="phone-pad" />
                        </View>
                        <TouchableOpacity style={styles.saveButton} onPress={onClose}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'payment':
                // WIDOK FORMULARZA (DODAWANIE/EDYCJA)
                if (paymentView === 'edit') {
                    return (
                        <View style={styles.sectionContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={() => setPaymentView('list')}>
                                <Ionicons name="arrow-back" size={20} color="#6b7280" />
                                <Text style={styles.backButtonText}>Back to saved cards</Text>
                            </TouchableOpacity>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cardholder Name</Text>
                                <TextInput style={styles.input} placeholder="Anna Kowalska" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Card Number</Text>
                                <TextInput style={styles.input} placeholder="0000 0000 0000 0000" keyboardType="numeric" maxLength={19} />
                            </View>
                            
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.label}>Expiry Date</Text>
                                    <TextInput style={styles.input} placeholder="MM/YY" maxLength={5} />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.label}>CVV</Text>
                                    <TextInput style={styles.input} placeholder="123" keyboardType="numeric" maxLength={4} secureTextEntry />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={() => setPaymentView('list')}>
                                <Text style={styles.saveButtonText}>Save Card</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }

                // WIDOK LISTY (DOMYŚLNY)
                return (
                    <View style={styles.sectionContainer}>
                        <TouchableOpacity style={styles.cardItem} onPress={() => setPaymentView('edit')}>
                            <View style={styles.cardLeft}>
                                <Ionicons name="card" size={28} color="#111" />
                                <View style={styles.cardDetails}>
                                    <Text style={styles.cardTitle}>•••• 4242</Text>
                                    <Text style={styles.cardExpiry}>Expires 12/28</Text>
                                </View>
                            </View>
                            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.addCardButton} onPress={() => setPaymentView('edit')}>
                            <Ionicons name="add" size={20} color="#e60000" />
                            <Text style={styles.addCardText}>Add New Card</Text>
                        </TouchableOpacity>
                    </View>
                );

            // ... reszta sekcji (notifications, language, help, terms) pozostaje bez zmian
            case 'notifications':
                return (
                    <View style={styles.sectionContainer}>
                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchTitle}>Push Notifications</Text>
                                <Text style={styles.switchSub}>Ticket updates, delays</Text>
                            </View>
                            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#d1d5db', true: '#fca5a5' }} thumbColor={pushEnabled ? '#e60000' : '#f4f3f4'} />
                        </View>
                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchTitle}>Email Offers</Text>
                                <Text style={styles.switchSub}>Promotions and news</Text>
                            </View>
                            <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: '#d1d5db', true: '#fca5a5' }} thumbColor={emailEnabled ? '#e60000' : '#f4f3f4'} />
                        </View>
                    </View>
                );
            case 'language':
                const languages = ['English (UK)', 'English (US)', 'Polski', 'Deutsch', 'Español'];
                return (
                    <View style={styles.sectionContainer}>
                        {languages.map((lang, index) => (
                            <TouchableOpacity key={index} style={[styles.actionRow, index === languages.length - 1 && { borderBottomWidth: 0 }]} onPress={() => setSelectedLang(lang)}>
                                <Text style={[styles.actionRowText, selectedLang === lang && { color: '#e60000', fontWeight: 'bold' }]}>{lang}</Text>
                                {selectedLang === lang && <Ionicons name="checkmark" size={24} color="#e60000" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 'help':
                return (
                    <View style={styles.sectionContainer}>
                        <TouchableOpacity style={styles.actionRow}>
                            <View style={styles.actionRowLeft}><Ionicons name="chatbubbles-outline" size={22} color="#111" /><Text style={styles.actionRowText}>Live Chat</Text></View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionRow}>
                            <View style={styles.actionRowLeft}><Ionicons name="mail-outline" size={22} color="#111" /><Text style={styles.actionRowText}>Email Support</Text></View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.actionRowLeft}><Ionicons name="document-text-outline" size={22} color="#111" /><Text style={styles.actionRowText}>FAQ & Articles</Text></View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                );
            case 'terms':
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.termsTitle}>1. Introduction</Text>
                        <Text style={styles.termsText}>Welcome to TransRegion. By using our application, you agree to be bound by these terms of service. Please read them carefully.</Text>
                        <Text style={styles.termsTitle}>2. Ticketing & Refunds</Text>
                        <Text style={styles.termsText}>Tickets purchased through the TransRegion app are subject to the specific carriers refund policy. Standard tickets can usually be refunded up to 24 hours before departure.</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{getTitle()}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#f4f5f7' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    closeButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fcecec', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    closeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#e60000' },
    scrollContent: { padding: 20 },
    sectionContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    
    row: { flexDirection: 'row' },
    
    // Formularze
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 15, fontSize: 16, color: '#111' },
    saveButton: { backgroundColor: '#e60000', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Płatności
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    backButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    cardItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    cardDetails: { marginLeft: 15 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    cardExpiry: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    addCardButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, backgroundColor: '#fcecec' },
    addCardText: { color: '#e60000', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },

    // Reszta bez zmian...
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    switchTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    switchSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    actionRowLeft: { flexDirection: 'row', alignItems: 'center' },
    actionRowText: { fontSize: 16, color: '#111', marginLeft: 12 },
    termsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 15, marginBottom: 8 },
    termsText: { fontSize: 14, color: '#4b5563', lineHeight: 22 }
});