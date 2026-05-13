const IP_adress = "http://10.154.64.138:5000";

export { IP_adress };

import * as SecureStore from 'expo-secure-store';


export const authFetch = async (endpoint: string, options: any = {}) => {
    const token = await SecureStore.getItemAsync('userToken');

    const headers = {
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
    }

    return response;
};
