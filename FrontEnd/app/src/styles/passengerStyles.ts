import { StyleSheet } from 'react-native';

export const COLORS = {
    primary: '#e60000',
    primaryDark: '#d32f2f',
    bgMain: '#f4f5f7',
    bgDark: '#181824',
    white: '#ffffff',
    textMain: '#111111',
    textDark: '#111827',
    textMuted: '#6b7280',
    textLight: '#9ca3af',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
};

export const passengerStyles = StyleSheet.create({
    // ==========================================
    // SHARED / UNIFIED
    // ==========================================
    safeArea: { flex: 1, backgroundColor: COLORS.bgMain },
    container: { padding: 20 },
    scrollContent: { padding: 20 },
    row: { flexDirection: 'row' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    loadingText: { textAlign: 'center', marginTop: 20, color: '#888' },

    // ==========================================
    // BUTTONS
    // ==========================================
    primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 10 },
    primaryBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },

    // ==========================================
    // MODALS (Shared)
    // ==========================================
    modalContainer: { flex: 1, backgroundColor: COLORS.white },
    modalContainerAlt: { flex: 1, backgroundColor: COLORS.bgMain },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },
    closeBtnIcon: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
    closeBtnTextWrapper: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fcecec', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    closeBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },

    // ==========================================
    // INDEX.TSX (Search)
    // ==========================================
    logo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    logoRed: { color: COLORS.primary },
    searchCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, elevation: 4 },
    swapIconContainer: { alignItems: 'center', marginVertical: -10, zIndex: 1, backgroundColor: COLORS.white, width: 30, height: 30, borderRadius: 15, alignSelf: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f9f9f9' },
    listItemText: { fontSize: 16, marginLeft: 15, color: COLORS.textMain, fontWeight: '500' },
    iconBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    counterList: { padding: 20 },
    counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderColor: '#f4f4f4' },
    counterLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },
    counterSub: { fontSize: 12, color: '#888' },
    counterControls: { flexDirection: 'row', alignItems: 'center' },
    countBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    countText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
    resultsSection: { marginTop: 30, paddingBottom: 40 },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
    resultsTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textMain },
    optionsBadge: { backgroundColor: '#eef0f3', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
    optionsText: { fontSize: 14, color: '#555', fontWeight: '600' },
    departureCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    routeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    timeBlock: { flex: 1 },
    timeText: { fontSize: 24, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
    stationText: { fontSize: 13, color: '#888', fontWeight: '500' },
    durationBlock: { flex: 1.5, alignItems: 'center', marginHorizontal: 10 },
    durationText: { fontSize: 11, color: '#aaa', fontWeight: 'bold', marginBottom: 5, letterSpacing: 0.5 },
    durationLineWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    durationDotGray: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc' },
    durationLine: { flex: 1, height: 2, backgroundColor: '#eee' },
    durationDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
    departureFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#f8f8f8', paddingTop: 15 },
    seatsBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    seatsBadgeGreen: { backgroundColor: '#e6f7ec' },
    seatsBadgeOrange: { backgroundColor: '#fdf0d5' },
    seatsText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    seatsTextGreen: { color: COLORS.success },
    seatsTextOrange: { color: COLORS.warning },
    priceContainer: { flexDirection: 'row', alignItems: 'center' },
    priceText: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginRight: 15 },
    actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fcecec', justifyContent: 'center', alignItems: 'center' },

    // ==========================================
    // TICKETS.TSX
    // ==========================================
    activeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    activeTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginLeft: 10, letterSpacing: -0.5 },
    activeSection: { marginBottom: 40 },
    ticketWrapper: { backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
    ticketTop: { backgroundColor: COLORS.primaryDark, padding: 24 },
    ticketTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 },
    ticketRoute: { color: '#ffcccc', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    ticketSeatLabel: { color: '#ffcccc', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    ticketTime: { color: COLORS.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    seatBadge: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
    seatBadgeText: { color: COLORS.primaryDark, fontSize: 22, fontWeight: '900' },
    ticketBottom: { backgroundColor: COLORS.white, alignItems: 'center', paddingTop: 30, paddingBottom: 24 },
    qrPlaceholderContainer: { padding: 20, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 32, marginBottom: 25, backgroundColor: '#fafafa' },
    scanText: { color: COLORS.textLight, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 25, position: 'relative' },
    cutoutLeft: { position: 'absolute', left: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bgMain, zIndex: 2 },
    dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', marginHorizontal: 25 },
    cutoutRight: { position: 'absolute', right: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bgMain, zIndex: 2 },
    ticketActions: { flexDirection: 'row', width: '100%', paddingHorizontal: 24, justifyContent: 'space-between' },
    viewDetailsBtn: { flex: 1, backgroundColor: COLORS.textDark, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginRight: 15 },
    viewDetailsText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    closeTicketBtn: { width: 60, height: 60, backgroundColor: '#fef2f2', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    // ==========================================
    // PROFILE.TSX
    // ==========================================
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 20 },
    profileCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 24 },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
    userInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
    userEmail: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#4b5563' },
    loyaltyCard: { backgroundColor: COLORS.bgDark, borderRadius: 28, padding: 24, marginBottom: 30, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    loyaltyCardLoading: { justifyContent: 'center', alignItems: 'center', minHeight: 140 },
    loyaltyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    loyaltyTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    loyaltyTitleText: { color: COLORS.textLight, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginLeft: 6 },
    pointsValue: { color: COLORS.white, fontSize: 40, fontWeight: '900', letterSpacing: -1 },
    pointsSuffix: { color: COLORS.textLight, fontSize: 18, fontWeight: '600', letterSpacing: 0 },
    trendButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#2a2a36', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3b3b4a' },
    tierInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    tierText: { color: COLORS.textLight, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    nextTierText: { color: '#facc15', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    progressBarBackground: { height: 6, backgroundColor: '#374151', borderRadius: 3, width: '100%', overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 3 },
    menuContainer: { backgroundColor: COLORS.white, borderRadius: 20, paddingVertical: 10, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuItemText: { fontSize: 16, fontWeight: '600', color: COLORS.textMain, marginLeft: 15 },
    destructiveText: { color: COLORS.primary },

    // ==========================================
    // PROFILE SETTINGS MODAL
    // ==========================================
    settingsSection: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase' },
    textInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 15, fontSize: 16, color: COLORS.textMain },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    backButtonText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600', marginLeft: 8 },
    cardItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    cardDetails: { marginLeft: 15 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
    cardExpiry: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    addCardButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, backgroundColor: '#fcecec' },
    addCardText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    switchTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
    switchSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    actionRowLeft: { flexDirection: 'row', alignItems: 'center' },
    actionRowText: { fontSize: 16, color: COLORS.textMain, marginLeft: 12 },
    termsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginTop: 15, marginBottom: 8 },
    termsText: { fontSize: 14, color: '#4b5563', lineHeight: 22 },

    // ==========================================
    // ACTIVE TICKET MODAL
    // ==========================================
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    detailCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    busIconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#fcecec', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    operatorText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
    busNumberText: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },
    amenitiesRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 15 },
    amenityIcon: { marginRight: 10, backgroundColor: '#f9fafb', padding: 6, borderRadius: 8 },
    amenityLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
    infoGrid: { flexDirection: 'row', backgroundColor: COLORS.textDark, borderRadius: 24, padding: 20, marginBottom: 20 },
    infoBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: '#374151' },
    infoLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 5 },
    infoValue: { fontSize: 18, color: COLORS.white, fontWeight: 'bold' },
    timelineCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    timelineItem: { flexDirection: 'row', minHeight: 70 },
    timelineLeft: { width: 50, alignItems: 'flex-start' },
    timelineTime: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
    timelineCenter: { width: 30, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
    dotPassed: { backgroundColor: COLORS.primary },
    dotFuture: { backgroundColor: COLORS.border },
    timelineLine: { width: 2, position: 'absolute', top: 12, bottom: 0 },
    linePassed: { backgroundColor: COLORS.primary },
    lineFuture: { backgroundColor: '#f3f4f6' },
    timelineRight: { flex: 1, paddingLeft: 10, paddingBottom: 25 },
    timelineStation: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
    textPassed: { color: COLORS.textLight },
    statusLabel: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase' },
    footerInfo: { flexDirection: 'row', padding: 20, alignItems: 'center' },
    footerText: { flex: 1, fontSize: 12, color: COLORS.textLight, marginLeft: 10, lineHeight: 18 },
        // ==========================================
    // EMPTY STATE (No Tickets)
    // ==========================================
    emptyStateContainer: { backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#6b7280', marginTop: 15, marginBottom: 8 },
    emptyStateSub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },

});