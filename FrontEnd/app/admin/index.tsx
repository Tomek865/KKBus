import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Komponent: Pojedyncza karta ze statystyką
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

// Komponent: Pojedynczy alert
const AlertItem = ({ title, desc, time, type }: any) => {
  const getColors = () => {
    switch (type) {
      case 'warning': return { bg: '#fffbeb', border: '#fde68a', text: '#d97706' };
      case 'danger': return { bg: '#fef2f2', border: '#fecaca', text: '#e60000' };
      case 'success': return { bg: '#f0fdf4', border: '#bbf7d0', text: '#10b981' };
      default: return { bg: '#f9fafb', border: '#eee', text: '#111' };
    }
  };
  const colors = getColors();

  return (
    <View style={[styles.alertItem, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: colors.text }]}>{title}</Text>
        <Text style={styles.alertDesc}>{desc}</Text>
      </View>
      <Text style={styles.alertTime}>{time}</Text>
    </View>
  );
};

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Nagłówek sekcji */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Dashboard Overview</Text>
          <Text style={styles.pageSubtitle}>REAL-TIME STATISTICS & METRICS</Text>
        </View>
        <View style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}><Text style={[styles.filterText, styles.filterTextActive]}>Today</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}><Text style={styles.filterText}>7 Days</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}><Text style={styles.filterText}>30 Days</Text></TouchableOpacity>
        </View>
      </View>

      {/* Karty Statystyk */}
      <View style={styles.statsGrid}>
        <StatCard title="TOTAL REVENUE" value="124,500 PLN" icon="cash-outline" trend="+14.5%" trendColor="#10b981" iconBg="#d1fae5" />
        <StatCard title="ACTIVE BUSES" value="42 / 50" icon="bus-outline" trend="8 offline" trendColor="#e60000" iconBg="#fee2e2" />
        <StatCard title="TOTAL PASSENGERS" value="14,290" icon="people-outline" trend="+5.2%" trendColor="#10b981" iconBg="#d0ebff" />
        <StatCard title="SCHEDULED ROUTES" value="156" icon="calendar-outline" trend="98% on time" trendColor="#10b981" iconBg="#e0e7ff" />
      </View>

      {/* Dolna sekcja: Wykres i Alerty */}
      <View style={styles.bottomContent}>

        {/* Lewa strona: Wykres */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <Text style={styles.sectionSubtitle}>PAST 7 DAYS PERFORMANCE</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="bar-chart-outline" size={60} color="#e5e7eb" />
            <Text style={styles.chartPlaceholderText}>Revenue Chart Visualization</Text>
          </View>
        </View>

        {/* Prawa strona: Alerty */}
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Text style={styles.sectionTitle}>Live Fleet Status</Text>
            <View style={styles.pulsingDot} />
          </View>
          <Text style={styles.sectionSubtitle}>REAL-TIME ALERTS</Text>

          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            <AlertItem type="warning" title="Bus #102 Delayed" desc="15 mins late on Krakow-Katowice" time="2M AGO" />
            <AlertItem type="danger" title="Maintenance Required" desc="Bus #44 engine check engine light" time="15M AGO" />
            <AlertItem type="success" title="Route Completed" desc="Bus #201 finished safely" time="1H AGO" />
          </ScrollView>

          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>VIEW ALL ALERTS</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  pageSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 4, letterSpacing: 1 },
  filterTabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#eee' },
  filterTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  filterTabActive: { backgroundColor: '#f9fafb', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  filterText: { fontSize: 14, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#111' },

  // Stat Cards
  statsGrid: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  statIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  trendText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  statTitle: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 8, letterSpacing: 1 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#111' },

  // Dolna sekcja (Wykres + Alerty)
  bottomContent: { flexDirection: 'row', gap: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  sectionSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#888', marginTop: 4, letterSpacing: 1, marginBottom: 20 },

  // Wykres
  chartSection: { flex: 2, backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  chartPlaceholder: { flex: 1, minHeight: 250, backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  chartPlaceholderText: { color: '#aaa', fontWeight: 'bold', marginTop: 10 },

  // Alerty
  alertsSection: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  alertsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulsingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e60000' },
  alertsList: { flex: 1, minHeight: 200 },
  alertItem: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  alertTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  alertDesc: { fontSize: 12, color: '#6b7280' },
  alertTime: { fontSize: 10, fontWeight: 'bold', color: '#aaa', marginTop: 2 },
  viewAllBtn: { marginTop: 15, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  viewAllText: { fontSize: 12, fontWeight: 'bold', color: '#111' }
});