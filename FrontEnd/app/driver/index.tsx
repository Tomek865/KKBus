import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverDashboard() {
    return (
        <View style={styles.container}>
            {/* Nagłówek */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Driver Dashboard</Text>
                    <Text style={styles.headerSub}>BUS #402 • KRAKOW - KATOWICE</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ON ROUTE</Text>
                </View>
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>Marek Z.</Text>
                    <Text style={styles.driverId}>ID: 9842</Text>
                </View>
            </View>

            <View style={styles.contentRow}>
                {/* Kolumna Lewa: Przystanki */}
                <View style={styles.routeCol}>
                    <Text style={styles.sectionTitle}>Route Progress</Text>

                    <View style={styles.stopItem}>
                        <Ionicons name="checkmark-circle" size={28} color="#111" style={styles.stopIcon} />
                        <View>
                            <Text style={styles.stopNameDone}>Krakow MDA</Text>
                            <Text style={styles.stopTime}>15:00</Text>
                        </View>
                    </View>

                    <View style={styles.stopItem}>
                        <View style={styles.activeStopDot}><Text style={styles.activeStopNumber}>2</Text></View>
                        <View>
                            <Text style={styles.stopNameActive}>Chrzanow</Text>
                            <Text style={styles.stopTimeActive}>15:25 • NEXT STOP</Text>
                        </View>
                    </View>

                    <View style={styles.stopItem}>
                        <View style={styles.futureStopDot}><Text style={styles.futureStopNumber}>3</Text></View>
                        <View>
                            <Text style={styles.stopNameFuture}>Jaworzno</Text>
                            <Text style={styles.stopTime}>15:50</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.arriveBtn}>
                        <Text style={styles.arriveBtnText}>ARRIVE AT STOP</Text>
                    </TouchableOpacity>
                </View>

                {/* Kolumna Prawa: Skanowanie i Pasażerowie */}
                <View style={styles.actionCol}>
                    <TouchableOpacity style={styles.scanBtn}>
                        <Ionicons name="qr-code-outline" size={40} color="#fff" style={{ marginRight: 15 }} />
                        <View>
                            <Text style={styles.scanBtnTitle}>SCAN TICKET</Text>
                            <Text style={styles.scanBtnSub}>CAMERA AUTOMATICALLY OPENS</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.boardingList}>
                        <View style={styles.boardingHeader}>
                            <Text style={styles.sectionTitle}>Boarding List</Text>
                            <View style={styles.tabs}>
                                <Text style={[styles.tab, styles.tabActive]}>All (6)</Text>
                                <Text style={styles.tab}>Pending (3)</Text>
                            </View>
                        </View>

                        <ScrollView>
                            {/* Przykładowy Pasażer 1 */}
                            <View style={styles.passengerRow}>
                                <View style={styles.seatBadge}><Text style={styles.seatText}>12A</Text></View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.passengerName}>Jan Kowalski</Text>
                                    <Text style={styles.passengerDetails}>TICKET JS-12A • STUDENT</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                            </View>

                            {/* Przykładowy Pasażer 2 */}
                            <View style={[styles.passengerRow, styles.passengerRowPending]}>
                                <View style={[styles.seatBadge, { backgroundColor: '#fee2e2' }]}><Text style={[styles.seatText, { color: '#e60000' }]}>14B</Text></View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.passengerName}>Anna Nowak</Text>
                                    <Text style={styles.passengerDetails}>TICKET AN-14B • ADULT</Text>
                                </View>
                                <TouchableOpacity style={styles.manualBtn}>
                                    <Text style={styles.manualBtnText}>MANUAL</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    headerSub: { fontSize: 12, color: '#888', fontWeight: 'bold', marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 'auto', marginRight: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e60000', marginRight: 6 },
    statusText: { color: '#e60000', fontWeight: 'bold', fontSize: 12 },
    driverInfo: { alignItems: 'flex-end', borderLeftWidth: 1, borderColor: '#eee', paddingLeft: 20 },
    driverName: { fontWeight: 'bold', fontSize: 14 },
    driverId: { color: '#888', fontSize: 12 },

    contentRow: { flexDirection: 'row', gap: 24, flex: 1 },
    routeCol: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
    actionCol: { flex: 1.5, gap: 24 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    stopIcon: { width: 40, textAlign: 'center', marginRight: 15 },
    activeStopDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e60000', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 5, shadowColor: '#e60000', shadowOpacity: 0.4, shadowRadius: 10 },
    activeStopNumber: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    futureStopDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    futureStopNumber: { color: '#aaa', fontWeight: 'bold', fontSize: 18 },
    stopNameDone: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    stopNameActive: { fontSize: 18, fontWeight: 'bold', color: '#e60000' },
    stopNameFuture: { fontSize: 16, fontWeight: 'bold', color: '#aaa' },
    stopTime: { color: '#888', fontSize: 12 },
    stopTimeActive: { color: '#e60000', fontSize: 12, fontWeight: 'bold' },
    arriveBtn: { backgroundColor: '#111827', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 'auto' },
    arriveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    scanBtn: { backgroundColor: '#e60000', padding: 30, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5 },
    scanBtnTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    scanBtnSub: { color: '#ffb3b3', fontSize: 12, fontWeight: 'bold' },

    boardingList: { backgroundColor: '#fff', borderRadius: 16, padding: 20, flex: 1, elevation: 2 },
    boardingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    tabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4 },
    tab: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, fontWeight: 'bold', color: '#888' },
    tabActive: { backgroundColor: '#fff', color: '#111', borderRadius: 8, elevation: 1 },
    passengerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
    passengerRowPending: { backgroundColor: '#fff', borderColor: '#fee2e2' },
    seatBadge: { backgroundColor: '#e5e7eb', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    seatText: { fontWeight: 'bold', color: '#4b5563' },
    passengerName: { fontWeight: 'bold', color: '#111', fontSize: 16 },
    passengerDetails: { fontSize: 10, color: '#888', marginTop: 2 },
    manualBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    manualBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});