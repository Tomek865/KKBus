import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const IP_adress = "http://192.168.100.47:5000";

export { IP_adress };

export const authFetch = async (endpoint: string, options: any = {}) => {
    let token = null;

    try {
        if (Platform.OS === 'web') {
            token = localStorage.getItem('userToken');
        } else {
            token = await SecureStore.getItemAsync('userToken');
        }
    } catch (error) {
        console.error("Błąd podczas pobierania tokena:", error);
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${IP_adress}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        console.warn("Token wygasł lub jest nieprawidłowy (401)");
    }

    return response;
};
