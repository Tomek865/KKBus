import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStyles as styles, COLORS } from '../src/styles/adminStyles';
import { authFetch } from '../../utils';

const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    try {
        const d = new Date(dateString);

        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');

        return `${hours}:${minutes}`;
    } catch (e) {
        return '--:--';
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'Brak daty';
    try {
        const d = new Date(dateString);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = String(d.getUTCFullYear()).slice(-2);

        return `${day}.${month}.${year}`;
    } catch {
        return '';
    }
};

export default function AdminSchedule() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [busModalVisible, setBusModalVisible] = useState(false);
    const [routeModalVisible, setRouteModalVisible] = useState(false);
    const [stationModalVisible, setStationModalVisible] = useState(false);
    const [routeStopsModalVisible, setRouteStopsModalVisible] = useState(false);
    const [faresModalVisible, setFaresModalVisible] = useState(false);

    const [availableBuses, setAvailableBuses] = useState<any[]>([]);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [availableStations, setAvailableStations] = useState<any[]>([]);

    const [openDropdown, setOpenDropdown] = useState<'bus' | 'route' | 'driver' | 'editRoute' | 'editFareRoute' | null>(null);

    const [newEntry, setNewEntry] = useState({
        busId: '',
        route: '',
        driver: '',
        date: '',
        departureTime: '',
        arrivalTime: '',
        status: 'Planned'
    });

    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatConfig, setRepeatConfig] = useState({
        endDate: '',
        frequency: 'daily',
        customDays: [] as number[]
    });

    const DAYS_OF_WEEK = [
        { label: 'Pon', value: 1 },
        { label: 'Wt', value: 2 },
        { label: 'Śr', value: 3 },
        { label: 'Czw', value: 4 },
        { label: 'Pt', value: 5 },
        { label: 'Sob', value: 6 },
        { label: 'Ndz', value: 0 },
    ];

    const [newRoute, setNewRoute] = useState({ name: '' });
    const [newStation, setNewStation] = useState({ name: '', exactAddress: '' });

    const [newBus, setNewBus] = useState({
        vin: '',
        registrationNumber: '',
        brand: '',
        model: '',
        status: 'Available',
        parkingLocation: 'Baza Główna',
        seatingCapacity: '55',
        isActive: true
    });

    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [routeStops, setRouteStops] = useState<any[]>([]);

    const [selectedFareRouteId, setSelectedFareRouteId] = useState<string>('');
    const [routeFares, setRouteFares] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/admin/fleet/');
            const data = await response.json();
            console.log("Fetched fleet data:", data);
            setFleet(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Błąd pobierania floty:", e);
        } finally {
            setLoading(false);
        }
    };

    const loadFormOptions = async () => {
        try {
            const busRes = await authFetch('/api/admin/fleet/buses');
            const busData = await busRes.json();
            setAvailableBuses(Array.isArray(busData) ? busData : []);

            const routeRes = await authFetch('/api/admin/fleet/routes');
            const routeData = await routeRes.json();
            setAvailableRoutes(Array.isArray(routeData) ? routeData : []);

            const driverRes = await authFetch('/api/admin/fleet/drivers');
            const userData = await driverRes.json();
            setAvailableDrivers(Array.isArray(userData) ? userData : []);

            setScheduleModalVisible(true);
        } catch (e) {
            showScheduleAlert("Błąd", "Nie udało się pobrać aktualnych opcji z bazy danych.");
        }
    };

    const loadRouteStopsConfigurator = async () => {
        try {
            const routeRes = await authFetch('/api/admin/fleet/routes');
            const routeData = await routeRes.json();
            setAvailableRoutes(Array.isArray(routeData) ? routeData : []);

            const stationRes = await authFetch('/api/admin/fleet/stations');
            const stationData = await stationRes.json();
            setAvailableStations(Array.isArray(stationData) ? stationData : []);

            setRouteStopsModalVisible(true);
        } catch (e) {
            showScheduleAlert("Błąd", "Nie udało się załadować słowników przystanków.");
        }
    };

    const loadFaresConfigurator = async () => {
        try {
            const routeRes = await authFetch('/api/admin/fleet/routes');
            const routeData = await routeRes.json();
            setAvailableRoutes(Array.isArray(routeData) ? routeData : []);

            const stationRes = await authFetch('/api/admin/fleet/stations');
            const stationData = await stationRes.json();
            setAvailableStations(Array.isArray(stationData) ? stationData : []);

            setFaresModalVisible(true);
        } catch (e) {
            showScheduleAlert("Błąd", "Nie udało się załadować tras do cennika.");
        }
    };

    useEffect(() => {
        if (!selectedRouteId) return;

        const fetchSegmentStops = async () => {
            try {
                const res = await authFetch(`/api/admin/fleet/routes/${selectedRouteId}/stations`);
                const data = await res.json();
                setRouteStops(Array.isArray(data) ? data.map(st => ({ station_id: st.id?.toString() || st.station_id?.toString() || '' })) : []);
            } catch (e) {
                setRouteStops([]);
            }
        };
        fetchSegmentStops();
    }, [selectedRouteId]);

    useEffect(() => {
        if (!selectedFareRouteId) return;

        const fetchFares = async () => {
            try {
                const res = await authFetch(`/api/admin/fleet/routes/${selectedFareRouteId}/fares`);
                if (res.ok) {
                    const data = await res.json();
                    setRouteFares(Array.isArray(data) ? data : []);
                } else {
                    setRouteFares([]);
                }
            } catch (e) {
                setRouteFares([]);
            }
        };
        fetchFares();
    }, [selectedFareRouteId]);

    const handleAddStopToRouteSequence = () => {
        setRouteStops(prev => [
            ...prev,
            { station_id: '' }
        ]);
    };

    const handleSaveRouteStopsSequence = async () => {
        if (!selectedRouteId) return;

        const stationIdsOnly = routeStops
            .map(stop => parseInt(stop.station_id))
            .filter(id => !isNaN(id));

        try {
            const response = await authFetch(`/api/admin/fleet/routes/${selectedRouteId}/stations`, {
                method: 'POST',
                body: JSON.stringify({ stations: stationIdsOnly })
            });

            if (response.ok) {
                setRouteStopsModalVisible(false);
                setSelectedRouteId('');
                setRouteStops([]);
                showScheduleAlert("Sukces", "Sekwencja stacji trasy została zaktualizowana.");
            } else {
                showScheduleAlert("Błąd", "Nie udało się zapisać punktów trasy.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem.");
        }
    };

    const handleAddFareSegment = () => {
        setRouteFares(prev => [
            ...prev,
            { start_station_id: '', end_station_id: '', standard_price: '12.00' }
        ]);
    };

    const handleSaveFares = async () => {
        if (!selectedFareRouteId) return;

        try {
            const response = await authFetch(`/api/admin/fleet/routes/${selectedFareRouteId}/fares`, {
                method: 'POST',
                body: JSON.stringify({
                    fares: routeFares.map(f => ({
                        start_station_id: parseInt(f.start_station_id),
                        end_station_id: parseInt(f.end_station_id),
                        standard_price: parseFloat(f.standard_price)
                    }))
                })
            });

            if (response.ok) {
                setFaresModalVisible(false);
                setSelectedFareRouteId('');
                setRouteFares([]);
                showScheduleAlert("Sukces", "Cennik trasy został zaktualizowany.");
            } else {
                showScheduleAlert("Błąd", "Nie udało się zapisać cennika.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem.");
        }
    };

    const generateScheduleDates = () => {
        const dates: string[] = [];
        let currentDate = new Date(`${newEntry.date}T00:00:00`);
        const endDateObj = new Date(`${repeatConfig.endDate}T23:59:59`);

        if (currentDate > endDateObj) return dates;

        while (currentDate <= endDateObj) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            if (repeatConfig.frequency === 'custom') {
                if (repeatConfig.customDays.includes(currentDate.getDay())) {
                    dates.push(dateString);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            } else {
                dates.push(dateString);

                if (repeatConfig.frequency === 'daily') {
                    currentDate.setDate(currentDate.getDate() + 1);
                } else if (repeatConfig.frequency === 'weekly') {
                    currentDate.setDate(currentDate.getDate() + 7);
                } else if (repeatConfig.frequency === 'biweekly') {
                    currentDate.setDate(currentDate.getDate() + 14);
                }
            }
        }
        return dates;
    };

    const handleAddEntry = async () => {
        if (!newEntry.busId || !newEntry.route || !newEntry.driver || !newEntry.date || !newEntry.departureTime || !newEntry.arrivalTime) {
            showScheduleAlert("Błąd", "Proszę wypełnić wszystkie podstawowe pola (w tym czas odjazdu i przyjazdu).");
            return;
        }

        if (isRepeating && !repeatConfig.endDate) {
            showScheduleAlert("Błąd", "Wybierz datę końcową dla cyklu.");
            return;
        }

        const datesToSchedule = isRepeating
            ? generateScheduleDates()
            : [newEntry.date];

        if (datesToSchedule.length === 0) {
            showScheduleAlert("Błąd", "Brak dat do zaplanowania w wybranym przedziale.");
            return;
        }

        try {
            const requests = datesToSchedule.map(dateStr => {
                const departureIso = `${dateStr}T${newEntry.departureTime}:00`;
                console.log("Departure ISO:", departureIso);
                let arrivalDateObj = new Date(`${dateStr}T${newEntry.arrivalTime}`);
                if (newEntry.arrivalTime < newEntry.departureTime) {
                    arrivalDateObj.setDate(arrivalDateObj.getDate() + 1);
                }
                const arrivalIso = `${dateStr}T${newEntry.arrivalTime}:00`;
                console.log("Arrival ISO:", arrivalIso);
                return authFetch('/api/admin/fleet/', {
                    method: 'POST',
                    body: JSON.stringify({
                        busId: parseInt(newEntry.busId),
                        route: parseInt(newEntry.route),
                        driver: parseInt(newEntry.driver),
                        departureTime: departureIso,
                        arrivalTime: arrivalIso,
                        status: 'Planned'
                    })
                });
            });

            const responses = await Promise.all(requests);
            const allOk = responses.every(r => r.ok);

            if (allOk) {
                fetchInitialData();

                setScheduleModalVisible(false);
                setNewEntry({ busId: '', route: '', driver: '', date: '', departureTime: '', arrivalTime: '', status: 'Planned' });
                setIsRepeating(false);
                setRepeatConfig({ endDate: '', frequency: 'daily', customDays: [] });

                showScheduleAlert("Sukces", `Zaplanowano ${datesToSchedule.length} kursów.`);
            } else {
                showScheduleAlert("Ostrzeżenie", "Niektóre kursy mogły nie zostać zapisane.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Błąd połączenia z serwerem podczas planowania.");
        }
    };

    const handleAddBus = async () => {
        if (!newBus.vin || !newBus.registrationNumber || !newBus.brand || !newBus.model || !newBus.parkingLocation) {
            showScheduleAlert("Błąd", "Proszę uzupełnić wszystkie wymagane dane pojazdu.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/buses', {
                method: 'POST',
                body: JSON.stringify({
                    vin: newBus.vin.trim().toUpperCase(),
                    registrationNumber: newBus.registrationNumber.trim().toUpperCase(),
                    brand: newBus.brand.trim(),
                    model: newBus.model.trim(),
                    status: newBus.status,
                    parkingLocation: newBus.parkingLocation.trim(),
                    seatingCapacity: parseInt(newBus.seatingCapacity) || 55,
                    isActive: newBus.isActive
                })
            });
            const created = await response.json();

            if (response.ok) {
                setBusModalVisible(false);
                setNewBus({
                    vin: '', registrationNumber: '', brand: '', model: '',
                    status: 'Available', parkingLocation: 'Baza Główna', seatingCapacity: '55', isActive: true
                });
                showScheduleAlert("Sukces", `Dodano autobus o ID: ${created.id || ''}`);
            } else {
                showScheduleAlert("Błąd", created.message || "Nie udało się dodać pojazdu.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem.");
        }
    };

    const handleAddRoute = async () => {
        if (!newRoute.name) {
            showScheduleAlert("Błąd", "Wprowadź nazwę trasy.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/routes', {
                method: 'POST',
                body: JSON.stringify({ name: newRoute.name.trim() })
            });
            const created = await response.json();

            if (response.ok) {
                setRouteModalVisible(false);
                setNewRoute({ name: '' });
                showScheduleAlert("Sukces", `Utworzono trasę: ${created.name || newRoute.name}`);
            } else {
                showScheduleAlert("Błąd", created.message || "Nie udało się zapisać trasy.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem sieciowym.");
        }
    };

    const handleAddRouteStops = async () => {
        if (!selectedRouteId) {
            showScheduleAlert("Błąd", "Wybierz trasę.");
            return;
        }

        try {
            const response = await authFetch(`/api/admin/fleet/routes/${selectedRouteId}/stations`, {
                method: 'POST',
                body: JSON.stringify({
                    stations: routeStops.map((stop) => parseInt(stop.station_id))
                })
            });

            if (response.ok) {
                setRouteStopsModalVisible(false);
                showScheduleAlert("Sukces", "Przystanki zostały zaktualizowane.");
            } else {
                showScheduleAlert("Błąd", "Nie udało się zapisać przystanków.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Problem z połączeniem sieciowym.");
        }
    };

    const handleCreateStation = async () => {
        if (!newStation.name || !newStation.exactAddress) {
            showScheduleAlert("Błąd", "Wprowadź nazwę i adres przystanku.");
            return;
        }

        try {
            const response = await authFetch('/api/admin/fleet/stations', {
                method: 'POST',
                body: JSON.stringify({
                    name: newStation.name.trim(),
                    exact_address: newStation.exactAddress.trim()
                })
            });

            if (response.ok) {
                setStationModalVisible(false);
                setNewStation({ name: '', exactAddress: '' });
                showScheduleAlert("Sukces", "Nowy przystanek dodany do bazy danych.");
            } else {
                showScheduleAlert("Błąd", "Nie udało się zapisać przystanku.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Błąd połączenia sieciowego.");
        }
    };

    const handleDeleteRoute = (id: number) => {
        const title = "Cancel Course";
        const message = "Are you sure you want to cancel this scheduled course Assignment?";

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) runCancelRouteConfirm(id);
            return;
        }

        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", style: "destructive", onPress: () => runCancelRouteConfirm(id) }
        ]);
    };

    const runCancelRouteConfirm = async (id: number) => {
        try {
            const response = await authFetch(`/api/admin/fleet/${id}`, { method: 'PATCH' });
            const resData = await response.json();

            if (response.ok) {
                setFleet(prev => prev.map(item => item.id === id ? { ...item, status: 'Cancelled' } : item));
                showScheduleAlert("Cancelled", resData.message || "Fleet assignment cancelled successfully.");
            } else {
                showScheduleAlert("Błąd", resData.message || "Nie udało się anulować przypisania.");
            }
        } catch (e) {
            showScheduleAlert("Błąd", "Błąd połączenia z serwerem.");
        }
    };

    const showScheduleAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            setTimeout(() => { Alert.alert(title, message); }, 100);
        }
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.red} style={{ marginTop: 100 }} />;

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

            <View style={styles.pageHeader}>
                <Text style={styles.title}>Schedule & Fleet Management</Text>

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4b5563' }]} onPress={() => setBusModalVisible(true)}>
                        <Ionicons name="bus-outline" size={16} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Bus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4b5563' }]} onPress={() => setRouteModalVisible(true)}>
                        <Ionicons name="git-branch-outline" size={16} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Route</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4b5563' }]} onPress={() => setStationModalVisible(true)}>
                        <Ionicons name="location-outline" size={16} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Station</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#059669' }]} onPress={loadRouteStopsConfigurator}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Edit Stops</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#059669' }]} onPress={loadFaresConfigurator}>
                        <Ionicons name="cash-outline" size={16} color="#fff" />
                        <Text style={styles.primaryBtnText}>+ Edit Fares</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={loadFormOptions}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>Add New Entry</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 1 }]}>BUS ID / REJ</Text>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>ROUTE</Text>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>SCHEDULE</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>DRIVER</Text>
                    <Text style={{ width: 40 }}></Text>
                </View>

                {fleet.map((bus) => {
                    const isCancelled = bus.status === 'Cancelled';
                    return (
                        <View key={bus.id} style={[styles.tableRow, isCancelled && { opacity: 0.4 }]}>
                            <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>{bus.busId}</Text>
                            <Text style={[styles.cell, { flex: 1.5 }]}>{bus.route}</Text>

                            <View style={{ flex: 1.5 }}>
                                <Text style={[styles.cell, { fontWeight: 'bold' }]}>
                                    {formatTime(bus.departureTime)} - {formatTime(bus.arrivalTime)}
                                </Text>
                                <Text style={{ fontSize: 11, color: COLORS.grayText, marginTop: 2 }}>
                                    {formatDate(bus.departureTime)}
                                </Text>
                            </View>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: bus.status === 'Planned' ? COLORS.greenLight : COLORS.redLight }]}>
                                    <Text style={[styles.statusText, { color: bus.status === 'Planned' ? COLORS.green : COLORS.red }]}>{bus.status}</Text>
                                </View>
                            </View>
                            <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>{bus.driver}</Text>

                            <View style={{ width: 40, alignItems: 'flex-end' }}>
                                {!isCancelled && (
                                    <TouchableOpacity onPress={() => handleDeleteRoute(bus.id)} style={{ padding: 5 }}>
                                        <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            <Modal visible={scheduleModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { overflow: 'visible', zIndex: 10 }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add New Fleet Entry</Text>

                        <Text style={styles.inputLabel}>CHOOSE VEHICLE</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'bus' ? null : 'bus')}>
                            <Text style={{ color: newEntry.busId ? '#111' : '#9ca3af' }}>
                                {availableBuses.find(b => b.id?.toString() === newEntry.busId)?.registrationNumber || "Select active bus..."}
                            </Text>
                            <Ionicons name={openDropdown === 'bus' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'bus' && (
                            <View style={styles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                    {availableBuses.map((bus) => (
                                        <TouchableOpacity key={bus.id} style={styles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, busId: bus.id?.toString() || '' }); setOpenDropdown(null); }}>
                                            <Text>{bus.registrationNumber || "No registration"} ({bus.seatingCapacity || 0} seats)</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <Text style={[styles.inputLabel, { marginTop: 15 }]}>CHOOSE ROUTE</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'route' ? null : 'route')}>
                            <Text style={{ color: newEntry.route ? '#111' : '#9ca3af' }}>
                                {availableRoutes.find(r => r.id?.toString() === newEntry.route)?.name || "Select route..."}
                            </Text>
                            <Ionicons name={openDropdown === 'route' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'route' && (
                            <View style={styles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                    {availableRoutes.map((route) => (
                                        <TouchableOpacity key={route.id} style={styles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, route: route.id?.toString() || '' }); setOpenDropdown(null); }}>
                                            <Text>{route.name || "Unnamed route"}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <Text style={[styles.inputLabel, { marginTop: 15 }]}>ASSIGN DRIVER</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'driver' ? null : 'driver')}>
                            <Text style={{ color: newEntry.driver ? '#111' : '#9ca3af' }}>
                                {availableDrivers.find(d => d.id?.toString() === newEntry.driver)?.name || "Select employee..."}
                            </Text>
                            <Ionicons name={openDropdown === 'driver' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'driver' && (
                            <View style={styles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                    {availableDrivers.map((driver) => (
                                        <TouchableOpacity key={driver.id} style={styles.dropdownItem} onPress={() => { setNewEntry({ ...newEntry, driver: driver.id?.toString() || '' }); setOpenDropdown(null); }}>
                                            <Text>{driver.name || "No name"} ({driver.id})</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={{ marginTop: 15 }}>
                            <Text style={styles.inputLabel}>SCHEDULE DATE</Text>
                            <input
                                type="date"
                                style={{ ...(styles.nativeDateInput as any), marginBottom: 12 }}
                                value={newEntry.date}
                                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                            />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>DEPARTURE TIME</Text>
                                    <input
                                        type="time"
                                        style={styles.nativeDateInput as any}
                                        value={newEntry.departureTime}
                                        onChange={(e) => setNewEntry({ ...newEntry, departureTime: e.target.value })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>ARRIVAL TIME</Text>
                                    <input
                                        type="time"
                                        style={styles.nativeDateInput as any}
                                        value={newEntry.arrivalTime}
                                        onChange={(e) => setNewEntry({ ...newEntry, arrivalTime: e.target.value })}
                                    />
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 }}
                            onPress={() => setIsRepeating(!isRepeating)}
                        >
                            <Ionicons name={isRepeating ? "checkbox" : "square-outline"} size={22} color={isRepeating ? COLORS.red : COLORS.grayText} />
                            <Text style={{ fontWeight: 'bold', color: '#111' }}>Repeat schedule</Text>
                        </TouchableOpacity>

                        {isRepeating && (
                            <View style={{ backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: COLORS.grayBorder }}>

                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>END DATE</Text>
                                        <input
                                            type="date"
                                            style={styles.nativeDateInput as any}
                                            value={repeatConfig.endDate}
                                            min={newEntry.date}
                                            onChange={(e) => setRepeatConfig({ ...repeatConfig, endDate: e.target.value })}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>FREQUENCY</Text>
                                        <select
                                            style={styles.nativeDateInput as any}
                                            value={repeatConfig.frequency}
                                            onChange={(e) => setRepeatConfig({ ...repeatConfig, frequency: e.target.value as any })}
                                        >
                                            <option value="daily">Every day</option>
                                            <option value="weekly">Every week</option>
                                            <option value="biweekly">Every 2 weeks</option>
                                            <option value="custom">Selected days</option>
                                        </select>
                                    </View>
                                </View>

                                {repeatConfig.frequency === 'custom' && (
                                    <View>
                                        <Text style={styles.inputLabel}>SELECT DAYS</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                                            {DAYS_OF_WEEK.map(day => {
                                                const isSelected = repeatConfig.customDays.includes(day.value);
                                                return (
                                                    <TouchableOpacity
                                                        key={day.value}
                                                        style={{
                                                            paddingVertical: 8,
                                                            paddingHorizontal: 12,
                                                            borderRadius: 8,
                                                            backgroundColor: isSelected ? COLORS.red : '#e5e7eb',
                                                        }}
                                                        onPress={() => {
                                                            setRepeatConfig(prev => {
                                                                const newDays = isSelected
                                                                    ? prev.customDays.filter(d => d !== day.value)
                                                                    : [...prev.customDays, day.value];
                                                                return { ...prev, customDays: newDays };
                                                            });
                                                        }}
                                                    >
                                                        <Text style={{
                                                            color: isSelected ? COLORS.white : '#4b5563',
                                                            fontWeight: 'bold', fontSize: 12
                                                        }}>
                                                            {day.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 25 }}>
                            <TouchableOpacity onPress={() => {
                                setScheduleModalVisible(false);
                                setOpenDropdown(null);
                                setIsRepeating(false);
                            }}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleAddEntry}><Text style={styles.primaryBtnText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={busModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 500, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20 }]}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Add New Bus to Fleet</Text>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compactLabel}>VIN NUMBER</Text>
                                <TextInput style={styles.compactInput} placeholder="e.g. WBA000000..." value={newBus.vin} onChangeText={(text) => setNewBus({ ...newBus, vin: text })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compactLabel}>REGISTRATION NUMBER</Text>
                                <TextInput style={styles.compactInput} placeholder="e.g. KR 12345" value={newBus.registrationNumber} onChangeText={(text) => setNewBus({ ...newBus, registrationNumber: text })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compactLabel}>BRAND</Text>
                                <TextInput style={styles.compactInput} placeholder="e.g. Mercedes" value={newBus.brand} onChangeText={(text) => setNewBus({ ...newBus, brand: text })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compactLabel}>MODEL</Text>
                                <TextInput style={styles.compactInput} placeholder="e.g. Tourismo" value={newBus.model} onChangeText={(text) => setNewBus({ ...newBus, model: text })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compactLabel}>PARKING LOCATION</Text>
                                <TextInput style={styles.compactInput} placeholder="e.g. Baza Główna" value={newBus.parkingLocation} onChangeText={(text) => setNewBus({ ...newBus, parkingLocation: text })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compactLabel}>SEATING CAPACITY</Text>
                                <TextInput style={styles.compactInput} keyboardType="number-pad" placeholder="55" value={newBus.seatingCapacity} onChangeText={(text) => setNewBus({ ...newBus, seatingCapacity: text })} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15 }}>
                            <TouchableOpacity onPress={() => setBusModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10, fontSize: 14 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20, height: 40 }]} onPress={handleAddBus}><Text style={styles.primaryBtnText}>Add Bus</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={routeModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Create New Route</Text>

                        <Text style={styles.inputLabel}>ROUTE LINE NAME</Text>
                        <TextInput style={styles.input} placeholder="e.g. Kraków - Zakopane" value={newRoute.name} onChangeText={(text) => setNewRoute({ name: text })} />

                        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'flex-end', marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setRouteModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleAddRoute}><Text style={styles.primaryBtnText}>Create Route</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={stationModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add New Destination Station</Text>

                        <Text style={styles.inputLabel}>STATION NAME</Text>
                        <TextInput style={styles.input} placeholder="e.g. Katowice Dworzec" value={newStation.name} onChangeText={(text) => setNewStation({ ...newStation, name: text })} />

                        <Text style={[styles.inputLabel, { marginTop: 15 }]}>EXACT ADDRESS</Text>
                        <TextInput style={styles.input} placeholder="e.g. ul. Piotra Skargi 4" value={newStation.exactAddress} onChangeText={(text) => setNewStation({ ...newStation, exactAddress: text })} />

                        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'flex-end', marginTop: 25 }}>
                            <TouchableOpacity onPress={() => setStationModalVisible(false)}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20 }]} onPress={handleCreateStation}><Text style={styles.primaryBtnText}>Save Station</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={routeStopsModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 550, overflow: 'visible' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>Configure Route Stops Sequence</Text>

                        <Text style={styles.inputLabel}>SELECT ROUTE LINE</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'editRoute' ? null : 'editRoute')}>
                            <Text style={{ color: selectedRouteId ? '#111' : '#9ca3af' }}>
                                {availableRoutes.find(r => r.id?.toString() === selectedRouteId)?.name || "Choose route line..."}
                            </Text>
                            <Ionicons name={openDropdown === 'editRoute' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'editRoute' && (
                            <View style={[styles.dropdownContainer, { left: 25, right: 25 }]}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 120 }}>
                                    {availableRoutes.map((route) => (
                                        <TouchableOpacity key={route.id} style={styles.dropdownItem} onPress={() => { setSelectedRouteId(route.id?.toString() || ''); setOpenDropdown(null); }}>
                                            <Text>{route.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {selectedRouteId !== '' && (
                            <View style={{ marginTop: 20, maxHeight: 220 }}>
                                <Text style={[styles.inputLabel, { marginBottom: 10 }]}>STATIONS TIMELINE ORDER</Text>
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                    {routeStops.map((stop, index) => (
                                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <View style={styles.indexBadge}>
                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{index + 1}</Text>
                                            </View>

                                            <View style={{ flex: 1, zIndex: 100 - index, position: 'relative' }}>
                                                <select
                                                    style={styles.nativeSelectElement}
                                                    value={stop.station_id || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRouteStops(prev => prev.map((s, i) => i === index ? { ...s, station_id: val } : s));
                                                    }}
                                                >
                                                    <option value="">-- Choose stop --</option>
                                                    {availableStations.map(st => (
                                                        <option key={st.id} value={st.id}>{st.name}</option>
                                                    ))}
                                                </select>
                                            </View>

                                            <TouchableOpacity onPress={() => setRouteStops(prev => prev.filter((_, i) => i !== index))}>
                                                <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <TouchableOpacity style={styles.plusButtonRow} onPress={handleAddStopToRouteSequence}>
                                        <Ionicons name="add-circle" size={26} color="#059669" />
                                        <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 14 }}>Add Stop Location</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'flex-end', marginTop: 25 }}>
                            <TouchableOpacity onPress={() => { setRouteStopsModalVisible(false); setSelectedRouteId(''); setRouteStops([]); setOpenDropdown(null); }}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20, backgroundColor: '#059669' }]} disabled={!selectedRouteId} onPress={handleSaveRouteStopsSequence}><Text style={styles.primaryBtnText}>Save Sequence</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={faresModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 650, overflow: 'visible' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>Configure Route Fares</Text>

                        <Text style={styles.inputLabel}>SELECT ROUTE LINE</Text>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenDropdown(openDropdown === 'editFareRoute' ? null : 'editFareRoute')}>
                            <Text style={{ color: selectedFareRouteId ? '#111' : '#9ca3af' }}>
                                {availableRoutes.find(r => r.id?.toString() === selectedFareRouteId)?.name || "Choose route line..."}
                            </Text>
                            <Ionicons name={openDropdown === 'editFareRoute' ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                        </TouchableOpacity>
                        {openDropdown === 'editFareRoute' && (
                            <View style={[styles.dropdownContainer, { left: 25, right: 25 }]}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 120 }}>
                                    {availableRoutes.map((route) => (
                                        <TouchableOpacity key={route.id} style={styles.dropdownItem} onPress={() => { setSelectedFareRouteId(route.id?.toString() || ''); setOpenDropdown(null); }}>
                                            <Text>{route.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {selectedFareRouteId !== '' && (
                            <View style={{ marginTop: 20, maxHeight: 300 }}>
                                <Text style={[styles.inputLabel, { marginBottom: 10 }]}>FARE SEGMENTS</Text>
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                    {routeFares.map((fare, index) => (
                                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: '#f9fafb', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>From Station</Text>
                                                <select
                                                    style={styles.nativeSelectElement}
                                                    value={fare.start_station_id || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRouteFares(prev => prev.map((f, i) => i === index ? { ...f, start_station_id: val } : f));
                                                    }}
                                                >
                                                    <option value="">-- Start --</option>
                                                    {availableStations.map(st => (
                                                        <option key={st.id} value={st.id}>{st.name}</option>
                                                    ))}
                                                </select>
                                            </View>

                                            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />

                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>To Station</Text>
                                                <select
                                                    style={styles.nativeSelectElement}
                                                    value={fare.end_station_id || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRouteFares(prev => prev.map((f, i) => i === index ? { ...f, end_station_id: val } : f));
                                                    }}
                                                >
                                                    <option value="">-- End --</option>
                                                    {availableStations.map(st => (
                                                        <option key={st.id} value={st.id}>{st.name}</option>
                                                    ))}
                                                </select>
                                            </View>

                                            <View style={{ width: 80 }}>
                                                <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Price (PLN)</Text>
                                                <TextInput
                                                    style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 }}
                                                    keyboardType="numeric"
                                                    value={fare.standard_price?.toString() || ''}
                                                    onChangeText={(val) => {
                                                        setRouteFares(prev => prev.map((f, i) => i === index ? { ...f, standard_price: val } : f));
                                                    }}
                                                />
                                            </View>

                                            <TouchableOpacity onPress={() => setRouteFares(prev => prev.filter((_, i) => i !== index))} style={{ padding: 5 }}>
                                                <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <TouchableOpacity style={[styles.plusButtonRow, { marginTop: 10 }]} onPress={handleAddFareSegment}>
                                        <Ionicons name="add-circle" size={26} color="#059669" />
                                        <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 14 }}>Add Fare Segment</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'flex-end', marginTop: 25 }}>
                            <TouchableOpacity onPress={() => { setFaresModalVisible(false); setSelectedFareRouteId(''); setRouteFares([]); setOpenDropdown(null); }}><Text style={{ color: '#888', fontWeight: 'bold', padding: 10 }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 20, backgroundColor: '#059669' }]} disabled={!selectedFareRouteId} onPress={handleSaveFares}><Text style={styles.primaryBtnText}>Save Fares</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}