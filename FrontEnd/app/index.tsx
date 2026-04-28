import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.logo}>KK<Text style={styles.logoRed}>BUS</Text></Text>
            <Text style={styles.subtitle}>
                A comprehensive, multi-platform solution for regional bus transit. Select your role to view the tailored interface.
            </Text>

            <View style={styles.cardsContainer}>
                {/* Karta Pasażera */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/passenger' as any)}
                >
                    <Text style={styles.cardBadge}>Mobile View</Text>
                    <Text style={styles.cardTitle}>Passenger App</Text>
                    <Text style={styles.cardDesc}>Mobile-first. Search routes, book tickets, and manage your profile.</Text>
                </TouchableOpacity>

                {/* Karta Kierowcy */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/driver' as any)}
                >
                    <Text style={styles.cardBadge}>Tablet View</Text>
                    <Text style={styles.cardTitle}>Driver Dashboard</Text>
                    <Text style={styles.cardDesc}>Tablet-optimized. Active route tracking, segment reports, and shift management.</Text>
                </TouchableOpacity>

                {/* Karta Admina */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/admin' as any)}
                >
                    <Text style={styles.cardBadge}>Desktop View</Text>
                    <Text style={styles.cardTitle}>Admin Portal</Text>
                    <Text style={styles.cardDesc}>Desktop-focused. Real-time statistics, schedule management, and client reports.</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', alignItems: 'center', padding: 20 },
    logo: { fontSize: 32, fontWeight: 'bold', color: '#1a1f2e', marginTop: 40 },
    logoRed: { color: '#e60000' },
    subtitle: { textAlign: 'center', color: '#6c757d', marginVertical: 20, maxWidth: 600 },
    cardsContainer: { width: '100%', maxWidth: 800, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, width: 300, minHeight: 200 },
    cardBadge: { color: '#e60000', fontSize: 12, fontWeight: 'bold', alignSelf: 'flex-end', marginBottom: 10 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1f2e', marginBottom: 8 },
    cardDesc: { textAlign: 'center', color: '#6c757d' }
});




// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
// import { router } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// export default function LoginScreen() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     // MOCK LOGIN LOGIC - Tutaj w przyszłości będzie fetch do backendu
//     const handleLogin = async () => {
//         if (!email || !password) {
//             Alert.alert("Error", "Please fill in all fields.");
//             return;
//         }

//         setIsLoading(true);

//         // Symulacja zapytania do bazy danych
//         setTimeout(() => {
//             setIsLoading(false);
            
//             const userEmail = email.toLowerCase().trim();

//             if (userEmail === 'admin@transregion.pl' && password === 'admin123') {
//                 router.replace('/admin'); // Przekierowanie do Admin Portal
//             } else if (userEmail === 'driver@transregion.pl' && password === 'driver123') {
//                 router.replace('/driver'); // Przekierowanie do Driver Dashboard
//             } else if (userEmail === 'user@gmail.com' && password === 'user123') {
//                 router.replace('/passenger'); // Przekierowanie do Passenger App
//             } else {
//                 Alert.alert("Login Failed", "Invalid email or password. Try: admin@transregion.pl / admin123");
//             }
//         }, 1500);
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <View style={styles.loginCard}>
//                 <View style={styles.logoContainer}>
//                     <View style={styles.logoIcon}><Text style={styles.logoIconText}>T</Text></View>
//                     <Text style={styles.logoText}>Trans<Text style={{ color: '#e60000' }}>Region</Text></Text>
//                 </View>

//                 <Text style={styles.welcomeText}>Welcome Back</Text>
//                 <Text style={styles.subtitle}>Enter your credentials to access your dashboard</Text>

//                 <View style={styles.inputContainer}>
//                     <Text style={styles.label}>EMAIL ADDRESS</Text>
//                     <View style={styles.inputWrapper}>
//                         <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
//                         <TextInput 
//                             style={styles.input} 
//                             placeholder="name@company.com"
//                             value={email}
//                             onChangeText={setEmail}
//                             autoCapitalize="none"
//                             keyboardType="email-address"
//                         />
//                     </View>
//                 </View>

//                 <View style={styles.inputContainer}>
//                     <Text style={styles.label}>PASSWORD</Text>
//                     <View style={styles.inputWrapper}>
//                         <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
//                         <TextInput 
//                             style={styles.input} 
//                             placeholder="••••••••"
//                             secureTextEntry
//                             value={password}
//                             onChangeText={setPassword}
//                         />
//                     </View>
//                 </View>

//                 <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
//                     {isLoading ? (
//                         <ActivityIndicator color="#fff" />
//                     ) : (
//                         <Text style={styles.loginBtnText}>Sign In</Text>
//                     )}
//                 </TouchableOpacity>

//                 <TouchableOpacity style={styles.forgotPass}>
//                     <Text style={styles.forgotText}>Forgot password?</Text>
//                 </TouchableOpacity>
//             </View>
            
//             <Text style={styles.footerText}>© 2026 TransRegion Logistics System</Text>
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f4f5f7', justifyContent: 'center', alignItems: 'center', padding: 20 },
//     loginCard: { backgroundColor: '#fff', padding: 40, borderRadius: 24, width: '100%', maxWidth: 450, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
//     logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
//     logoIcon: { width: 36, height: 36, backgroundColor: '#e60000', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
//     logoIconText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
//     logoText: { fontSize: 24, fontWeight: 'bold', color: '#111' },
//     welcomeText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#111' },
//     subtitle: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 8, marginBottom: 30 },
//     inputContainer: { marginBottom: 20 },
//     label: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 8, letterSpacing: 1 },
//     inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#eee', borderRadius: 12, paddingHorizontal: 15, height: 50 },
//     inputIcon: { marginRight: 12 },
//     input: { flex: 1, fontSize: 14, color: '#111' },
//     loginBtn: { backgroundColor: '#111827', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
//     loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//     forgotPass: { marginTop: 20, alignItems: 'center' },
//     forgotText: { color: '#e60000', fontWeight: '600', fontSize: 13 },
//     footerText: { marginTop: 40, color: '#aaa', fontSize: 12 }
// });