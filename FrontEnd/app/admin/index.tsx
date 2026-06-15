import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

const StatCard = ({ title, value, icon, trend, trendColor, iconBg }: any) => (
    <View style={[styles.card, { flex: 1 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={icon} size={20} color={trendColor} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 8, borderRadius: 20 }}>
                <Ionicons name={trendColor === COLORS.green ? 'arrow-up' : 'arrow-down'} size={12} color={trendColor} />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: trendColor }}>{trend}</Text>
            </View>
        </View>
        <Text style={styles.headerCell}>{title}</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 5 }}>{value}</Text>
    </View>
);

export default function AdminDashboard() {
    const router = useRouter();

    const [stats, setStats] = useState<any>(null);
    const [buses, setBuses] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);

    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const safeFetch = async (url: string) => {
                    try {
                        const res = await authFetch(url);
                        if (!res || !res.ok) return null;
                        return await res.json();
                    } catch (error) {
                        console.warn(`Brak dostępu lub błąd na endpoincie: ${url}`);
                        return null;
                    }
                };

                const [statsData, busesData, routesData, stationsData, topUsersData] = await Promise.all([
                    safeFetch('/api/admin/stats'),
                    safeFetch('/api/admin/fleet/buses'),
                    safeFetch('/api/admin/fleet/routes'),
                    safeFetch('/api/admin/fleet/stations'),
                    safeFetch('/api/admin/users'),
                ]);

                setStats(statsData || null);
                setBuses(Array.isArray(busesData) ? busesData : []);
                setRoutes(Array.isArray(routesData) ? routesData : []);
                setStations(Array.isArray(stationsData) ? stationsData : []);

                if (Array.isArray(topUsersData)) {
                    const passengers = topUsersData.filter(u => u.role === 'Passenger' || u.role === 'Client');
                    const sorted = passengers.sort((a, b) => {
                        const ptsA = a.loyalty_points || a.loyaltyPoints || a.points || 0;
                        const ptsB = b.loyalty_points || b.loyaltyPoints || b.points || 0;
                        return ptsB - ptsA;
                    });
                    setTopUsers(sorted.slice(0, 5));
                } else {
                    setTopUsers([]);
                }
            } catch (e) {
                console.error("Krytyczny błąd pobierania danych na dashboard:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.title}>Dashboard Overview</Text>
                    <Text style={styles.subtitle}>REAL-TIME STATISTICS & METRICS</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>
                <StatCard title="TOTAL REVENUE" value={stats?.revenue || "0.00 PLN"} icon="cash-outline" trend="+14.5%" trendColor={COLORS.green} iconBg={COLORS.greenLight} />
                <StatCard title="ACTIVE BUSES" value={stats?.buses || "0 / 0"} icon="bus-outline" trend="Zgodnie z planem" trendColor={COLORS.red} iconBg={COLORS.redLight} />
                <StatCard title="TOTAL PASSENGERS" value={stats?.passengers || "0"} icon="people-outline" trend="+5.2%" trendColor={COLORS.green} iconBg={COLORS.blueLight} />
                <StatCard title="SCHEDULED ROUTES" value={stats?.routes || "0"} icon="calendar-outline" trend="98% on time" trendColor={COLORS.green} iconBg="#e0e7ff" />
            </View>

            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>

                <View style={{ flex: 2, gap: 20 }}>
                    <View style={[styles.card, { flex: 1 }]}>
                        <Text style={localStyles.sectionTitle}>Fleet Overview</Text>
                        <ScrollView style={{ maxHeight: 420 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                            {buses.map((bus) => (
                                <View key={bus.id} style={localStyles.listItemRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={localStyles.iconContainer}>
                                            <Ionicons name="bus" size={16} color={COLORS.dark} />
                                        </View>
                                        <View>
                                            <Text style={{ fontWeight: 'bold' }}>{bus.registrationNumber}</Text>
                                            <Text style={{ fontSize: 12, color: COLORS.grayText }}>{bus.brand} {bus.model} • {bus.seatingCapacity} miejsc</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: bus.status === 'Available' ? COLORS.greenLight : COLORS.redLight }]}>
                                        <Text style={[styles.statusText, { color: bus.status === 'Available' ? COLORS.green : COLORS.red }]}>{bus.status}</Text>
                                    </View>
                                </View>
                            ))}
                            {buses.length === 0 && <Text style={localStyles.emptyText}>Brak dodanych pojazdów we flocie.</Text>}
                        </ScrollView>
                    </View>
                </View>

                <View style={{ flex: 1, gap: 20 }}>

                    <View style={[styles.card, { paddingVertical: 25 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                            <View style={[localStyles.iconContainer, { backgroundColor: COLORS.redLight }]}>
                                <Ionicons name="calendar" size={20} color={COLORS.red} />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Schedule Management</Text>
                        </View>
                        <TouchableOpacity style={[styles.primaryBtn, { width: '100%', height: 40 }]} onPress={() => router.push('/admin/schedule')}>
                            <Text style={styles.primaryBtnText}>Otwórz organizator kursów</Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { flex: 1 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={localStyles.sectionTitle}>Top Customers (Pkt)</Text>
                            <TouchableOpacity onPress={() => router.push('/admin/clients')}>
                                <Text style={{ fontSize: 12, color: COLORS.blue, fontWeight: 'bold' }}>Zarządzaj kontami</Text>
                            </TouchableOpacity>
                        </View>

                        {topUsers.map((user, index) => {
                            const rankStr = String(index + 1);
                            const userPts = user.loyalty_points || user.loyaltyPoints || user.points || 0;
                            return (
                                <View key={user.id} style={[localStyles.listItemRow, { paddingVertical: 10 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={[localStyles.rankBadge, rankStr === '1' ? { backgroundColor: '#fcd34d' } : rankStr === '2' ? { backgroundColor: '#cbd5e1' } : rankStr === '3' ? { backgroundColor: '#b45309' } : { backgroundColor: COLORS.dark }]}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{rankStr}</Text>
                                        </View>
                                        <Text style={{ fontWeight: '600', fontSize: 13 }}>{user.name}</Text>
                                    </View>
                                    <Text style={{ fontWeight: 'bold', color: COLORS.green, fontSize: 13 }}>{userPts} pkt</Text>
                                </View>
                            )
                        })}
                        {topUsers.length === 0 && <Text style={localStyles.emptyText}>Brak danych z rankingu.</Text>}
                    </View>
                </View>

            </View>

            <View style={{ flexDirection: 'row', gap: 20 }}>
                <View style={[styles.card, { flex: 1 }]}>
                    <Text style={localStyles.sectionTitle}>Active Routes</Text>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {routes.map((route) => (
                            <View key={route.id} style={localStyles.listItemRow}>
                                <Ionicons name="git-branch-outline" size={16} color={COLORS.grayText} style={{ marginRight: 8 }} />
                                <Text style={{ fontWeight: '500', flex: 1 }}>{route.name}</Text>
                            </View>
                        ))}
                        {routes.length === 0 && <Text style={localStyles.emptyText}>Brak utworzonych tras.</Text>}
                    </ScrollView>
                </View>

                <View style={[styles.card, { flex: 1 }]}>
                    <Text style={localStyles.sectionTitle}>Stations Database</Text>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {stations.map((station) => (
                            <View key={station.id} style={localStyles.listItemRow}>
                                <Ionicons name="location-outline" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: '500' }}>{station.name}</Text>
                                    <Text style={{ fontSize: 11, color: COLORS.grayText }}>{station.exactAddress || station.exact_address}</Text>
                                </View>
                            </View>
                        ))}
                        {stations.length === 0 && <Text style={localStyles.emptyText}>Brak przystanków w bazie.</Text>}
                    </ScrollView>
                </View>
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.dark,
        letterSpacing: 0.5
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: COLORS.grayBorder
    },
    iconContainer: {
        width: 36,
        height: 36,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rankBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.grayText,
        fontStyle: 'italic',
        marginTop: 10
    }
});