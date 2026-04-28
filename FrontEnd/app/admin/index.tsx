import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatCard = ({ title, value, icon, trend, trendColor, iconBg }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={trendColor} />
      </View>
      <View style={styles.trendBadge}>
        <Ionicons name={trendColor === '#10b981' ? 'arrow-up' : 'arrow-down'} size={12} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>{trend}</Text>
      </View>
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BACKEND CALL: Pobieranie ogólnych statystyk
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Symulacja: const res = await fetch('https://api.transregion.pl/admin/stats'); fetch
        setTimeout(() => {
          setStats({
            revenue: "124,500 PLN",
            buses: "42 / 50",
            passengers: "14,290",
            routes: "156"
          });
          setLoading(false);
        }, 800);
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Dashboard Overview</Text>
          <Text style={styles.pageSubtitle}>REAL-TIME STATISTICS & METRICS</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="TOTAL REVENUE" value={stats?.revenue} icon="cash-outline" trend="+14.5%" trendColor="#10b981" iconBg="#d1fae5" />
        <StatCard title="ACTIVE BUSES" value={stats?.buses} icon="bus-outline" trend="8 offline" trendColor="#e60000" iconBg="#fee2e2" />
        <StatCard title="TOTAL PASSENGERS" value={stats?.passengers} icon="people-outline" trend="+5.2%" trendColor="#10b981" iconBg="#d0ebff" />
        <StatCard title="SCHEDULED ROUTES" value={stats?.routes} icon="calendar-outline" trend="98% on time" trendColor="#10b981" iconBg="#e0e7ff" />
      </View>

      <View style={styles.bottomContent}>
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="bar-chart-outline" size={60} color="#e5e7eb" />
            <Text style={styles.chartPlaceholderText}>Revenue Chart Visualization</Text>
          </View>
        </View>

        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Live Fleet Status</Text>
          <ScrollView style={styles.alertsList}>
            {/* Tutaj można mapować listę alertów z API */}
            <View style={styles.alertItem}><Text style={styles.alertTitle}>Bus #102 Delayed</Text></View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { marginBottom: 30 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  pageSubtitle: { fontSize: 12, color: '#888', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 2 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 8, borderRadius: 20 },
  trendText: { fontSize: 12, fontWeight: 'bold' },
  statTitle: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  bottomContent: { flexDirection: 'row', gap: 20 },
  chartSection: { flex: 2, backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  chartPlaceholder: { height: 250, backgroundColor: '#f9fafb', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  chartPlaceholderText: { color: '#aaa', fontWeight: 'bold' },
  alertsSection: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  alertsList: { marginTop: 15 },
  alertItem: { padding: 15, backgroundColor: '#fef2f2', borderRadius: 12, marginBottom: 10 },
  alertTitle: { color: '#e60000', fontWeight: 'bold' }
});