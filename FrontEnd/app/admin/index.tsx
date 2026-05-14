import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { IP_adress, authFetch } from '../../utiles';

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
    <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</Text>
  </View>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Błąd pobierania statystyk:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
        <StatCard title="TOTAL REVENUE" value={stats?.revenue} icon="cash-outline" trend="+14.5%" trendColor={COLORS.green} iconBg={COLORS.greenLight} />
        <StatCard title="ACTIVE BUSES" value={stats?.buses} icon="bus-outline" trend="8 offline" trendColor={COLORS.red} iconBg={COLORS.redLight} />
        <StatCard title="TOTAL PASSENGERS" value={stats?.passengers} icon="people-outline" trend="+5.2%" trendColor={COLORS.green} iconBg={COLORS.blueLight} />
        <StatCard title="SCHEDULED ROUTES" value={stats?.routes} icon="calendar-outline" trend="98% on time" trendColor={COLORS.green} iconBg="#e0e7ff" />
      </View>
    </ScrollView>
  );
}
