import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PassengerLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#e60000',
            tabBarStyle: { height: 60, paddingBottom: 10 }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Szukaj',
                    tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    title: 'Moje bilety',
                    tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="store"
                options={{
                    title: 'Nagrody',
                    tabBarIcon: ({ color }) => <Ionicons name="gift-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profileSettingsModal"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="ActiveTicketModal"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="GuestLoginModal"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}