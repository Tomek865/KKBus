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
                    title: 'Search',
                    tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    title: 'My Tickets',
                    tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
    name="profileSettingsModal"
    options={{
        href: null, // To ukrywa ten plik z paska nawigacji!
    }}
            />
            <Tabs.Screen
    name="ActiveTicketModal"
    options={{
        href: null, // To ukrywa ten plik z paska nawigacji!
    }}
/>
        </Tabs>
    );
}