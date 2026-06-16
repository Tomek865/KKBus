import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface GuestLoginModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function GuestLoginModal({ visible, onClose }: GuestLoginModalProps) {
    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={44} color="#e60000" />
                    </View>
                    <Text style={styles.title}>Wymagane logowanie</Text>
                    <Text style={styles.subtitle}>
                        Musisz posiadać konto i być zalogowanym, aby uzyskać dostęp do tej sekcji, przeglądać swoje bilety lub dokonać rezerwacji.
                    </Text>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => {
                            onClose();
                            router.replace('/'); // Przekierowanie do ekranu logowania
                        }}
                    >
                        <Text style={styles.loginBtnText}>Zaloguj się lub załóż konto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Wróć do wyszukiwania</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    iconContainer: {
        backgroundColor: '#fee2e2',
        padding: 16,
        borderRadius: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    loginBtn: {
        backgroundColor: '#111827',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    loginBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelBtn: {
        width: '100%',
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#6b7280',
        fontWeight: 'bold',
        fontSize: 15,
    }
});