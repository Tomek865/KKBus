import React, { useState, useEffect } from 'react';
import { View, Text, Modal, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { passengerStyles as styles } from '../src/styles/passengerStyles';


export type ActiveSection = 'personal' | 'payment' | 'notifications' | 'language' | 'help' | 'terms' | null;
interface ProfileSettingsModalProps { visible: boolean; onClose: () => void; activeSection: ActiveSection; }

export default function ProfileSettingsModal({ visible, onClose, activeSection }: ProfileSettingsModalProps) {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [selectedLang, setSelectedLang] = useState('English (UK)');
    const [paymentView, setPaymentView] = useState<'list' | 'edit'>('list');

    useEffect(() => { if (visible) setPaymentView('list'); }, [visible]);

    const handleSavePersonalInfo = () => { onClose(); };
    const handleSaveCard = () => { setPaymentView('list'); };
    const handleToggleNotification = (type: 'push' | 'email', val: boolean) => {
        if(type === 'push') setPushEnabled(val); if(type === 'email') setEmailEnabled(val);
    };

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
            case 'personal': return (
                <View style={styles.settingsSection}>
                    <View style={styles.inputGroup}><Text style={styles.inputLabel}>Full Name</Text><TextInput style={styles.textInput} defaultValue="Anna Kowalska" /></View>
                    <View style={styles.inputGroup}><Text style={styles.inputLabel}>Email Address</Text><TextInput style={styles.textInput} defaultValue="anna.kowalska@example.com" /></View>
                    <View style={styles.inputGroup}><Text style={styles.inputLabel}>Phone Number</Text><TextInput style={styles.textInput} defaultValue="+48 123 456 789" /></View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSavePersonalInfo}><Text style={styles.primaryBtnText}>Save Changes</Text></TouchableOpacity>
                </View>
            );
            case 'payment':
                if (paymentView === 'edit') return (
                    <View style={styles.settingsSection}>
                        <TouchableOpacity style={styles.backButton} onPress={() => setPaymentView('list')}><Ionicons name="arrow-back" size={20} color="#6b7280" /><Text style={styles.backButtonText}>Back to saved cards</Text></TouchableOpacity>
                        <View style={styles.inputGroup}><Text style={styles.inputLabel}>Cardholder Name</Text><TextInput style={styles.textInput} placeholder="Anna Kowalska" /></View>
                        <View style={styles.inputGroup}><Text style={styles.inputLabel}>Card Number</Text><TextInput style={styles.textInput} placeholder="0000 0000 0000 0000" /></View>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}><Text style={styles.inputLabel}>Expiry Date</Text><TextInput style={styles.textInput} placeholder="MM/YY" /></View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}><Text style={styles.inputLabel}>CVV</Text><TextInput style={styles.textInput} placeholder="123" secureTextEntry /></View>
                        </View>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveCard}><Text style={styles.primaryBtnText}>Save Card</Text></TouchableOpacity>
                    </View>
                );
                return (
                    <View style={styles.settingsSection}>
                        <TouchableOpacity style={styles.cardItem} onPress={() => setPaymentView('edit')}>
                            <View style={styles.cardLeft}><Ionicons name="card" size={28} color="#111" /><View style={styles.cardDetails}><Text style={styles.cardTitle}>•••• 4242</Text><Text style={styles.cardExpiry}>Expires 12/28</Text></View></View>
                            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addCardButton} onPress={() => setPaymentView('edit')}><Ionicons name="add" size={20} color="#e60000" /><Text style={styles.addCardText}>Add New Card</Text></TouchableOpacity>
                    </View>
                );
            case 'notifications': return (
                <View style={styles.settingsSection}>
                    <View style={styles.switchRow}><View><Text style={styles.switchTitle}>Push Notifications</Text><Text style={styles.switchSub}>Ticket updates, delays</Text></View><Switch value={pushEnabled} onValueChange={(v) => handleToggleNotification('push', v)} thumbColor={pushEnabled ? '#e60000' : '#f4f3f4'} /></View>
                    <View style={styles.switchRow}><View><Text style={styles.switchTitle}>Email Offers</Text><Text style={styles.switchSub}>Promotions and news</Text></View><Switch value={emailEnabled} onValueChange={(v) => handleToggleNotification('email', v)} thumbColor={emailEnabled ? '#e60000' : '#f4f3f4'} /></View>
                </View>
            );
            case 'language': const languages = ['English (UK)', 'English (US)', 'Polski', 'Deutsch', 'Español']; return (
                <View style={styles.settingsSection}>
                    {languages.map((lang, index) => (
                        <TouchableOpacity key={index} style={[styles.actionRow, index === languages.length - 1 && { borderBottomWidth: 0 }]} onPress={() => setSelectedLang(lang)}>
                            <Text style={[styles.actionRowText, selectedLang === lang && { color: '#e60000', fontWeight: 'bold' }]}>{lang}</Text>{selectedLang === lang && <Ionicons name="checkmark" size={24} color="#e60000" />}
                        </TouchableOpacity>
                    ))}
                </View>
            );
            case 'help': return (
                <View style={styles.settingsSection}>
                    <TouchableOpacity style={styles.actionRow}><View style={styles.actionRowLeft}><Ionicons name="chatbubbles-outline" size={22} color="#111" /><Text style={styles.actionRowText}>Live Chat</Text></View><Ionicons name="chevron-forward" size={20} color="#ccc" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionRow}><View style={styles.actionRowLeft}><Ionicons name="mail-outline" size={22} color="#111" /><Text style={styles.actionRowText}>Email Support</Text></View><Ionicons name="chevron-forward" size={20} color="#ccc" /></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]}><View style={styles.actionRowLeft}><Ionicons name="document-text-outline" size={22} color="#111" /><Text style={styles.actionRowText}>FAQ & Articles</Text></View><Ionicons name="chevron-forward" size={20} color="#ccc" /></TouchableOpacity>
                </View>
            );
            case 'terms': return (
                <View style={styles.settingsSection}>
                    <Text style={styles.termsTitle}>1. Introduction</Text>
                    <Text style={styles.termsText}>Welcome to KKBus. By using our application, you agree to be bound by these terms of service. Please read them carefully.</Text>
                    <Text style={styles.termsTitle}>2. Ticketing & Refunds</Text>
                    <Text style={styles.termsText}>Tickets purchased through the KKBus app are subject to the specific carriers refund policy. Standard tickets can usually be refunded up to 24 hours before departure.</Text>
                </View>
            );
            default: return null;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainerAlt}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{getTitle()}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtnTextWrapper}><Text style={styles.closeBtnText}>Done</Text></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>{renderContent()}</ScrollView>
            </SafeAreaView>
        </Modal>
    );
}