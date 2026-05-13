import { StyleSheet } from 'react-native';

export const COLORS = {
    red: '#e60000',
    redLight: '#fee2e2',
    dark: '#111827',
    grayText: '#888',
    grayBorder: '#eee',
    grayBg: '#f4f5f7',
    white: '#ffffff',
    green: '#10b981',
    greenLight: '#d1fae5',
    blue: '#4338ca',
    blueLight: '#e0e7ff',
};

export const adminStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    container: { flex: 1, flexDirection: 'row' },

    // Sidebar & Navigation
    sidebar: { width: 260, backgroundColor: COLORS.white, borderRightWidth: 1, borderColor: COLORS.grayBorder, padding: 20 },
    logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
    logoIcon: { width: 32, height: 32, backgroundColor: COLORS.red, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
    logoText: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    menuSection: { marginBottom: 30 },
    sectionTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.grayText, marginBottom: 15, letterSpacing: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, marginBottom: 5 },
    menuItemActive: { backgroundColor: COLORS.redLight },
    menuLabel: { marginLeft: 15, fontSize: 14, color: '#4b5563', fontWeight: '500' },
    menuLabelActive: { color: COLORS.red, fontWeight: 'bold' },

    // Profile & Logout (Fixes for red underlines)
    profileSection: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingTop: 20, borderTopWidth: 1, borderColor: COLORS.grayBorder },
    profileAvatar: { width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoutText: { fontSize: 14, fontWeight: '500', color: '#111' },

    // Topbar
    mainArea: { flex: 1, backgroundColor: COLORS.grayBg },
    topbar: { height: 70, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, borderBottomWidth: 1, borderColor: COLORS.grayBorder },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 15, borderRadius: 12, width: 400, height: 45, borderWidth: 1, borderColor: COLORS.grayBorder },
    searchInput: { flex: 1, fontSize: 14, marginLeft: 10 },
    content: { flex: 1, padding: 30 },

    // Cards & Headers
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark },
    subtitle: { fontSize: 12, color: COLORS.grayText, letterSpacing: 1 },

    // Tables
    tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 18, borderBottomWidth: 1, borderColor: COLORS.grayBorder },
    tableRow: { flexDirection: 'row', padding: 18, borderBottomWidth: 1, borderColor: '#f4f4f4', alignItems: 'center' },
    headerCell: { fontWeight: 'bold', color: COLORS.grayText, fontSize: 11 },
    cell: { fontSize: 14 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, minWidth: 90, alignItems: 'center' },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    // Modals & Forms
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: COLORS.white, padding: 30, borderRadius: 24, width: 450, elevation: 20 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 10, padding: 12, marginBottom: 15 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.grayText, marginBottom: 5, letterSpacing: 1 },
    primaryBtn: { backgroundColor: COLORS.red, flexDirection: 'row', padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryBtnText: { color: COLORS.white, marginLeft: 6, fontWeight: 'bold' }
});