import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import TrayIcon from '../../../../assets/admin-icons/tray.svg';
import FilterBar from '../../../../components/Admin/filter';
import LeafTrailHubToolbar from '../../../../components/Admin/LeafTrailHubToolbar';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled } from '../../../../config/featureFlags';
import { LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import { exportLeafTrailLinesToCsv } from '../../../../utils/leafTrailHubExport';
import {
  generateThermalLabels,
  getAdminLeafTrailFilters,
  getAdminLeafTrailPacking,
  getOrdersBySortingTray,
} from '../../../../components/Api/getAdminLeafTrail';

const compareTrays = (a, b) =>
  String(a.sortingTrayNumber || '').localeCompare(
    String(b.sortingTrayNumber || ''),
    undefined,
    { numeric: true, sensitivity: 'base' },
  );

async function fetchPlantsForTrays(trayItems) {
  const trayNumbers = [
    ...new Set(
      (trayItems || [])
        .map((t) => String(t.sortingTrayNumber || '').trim())
        .filter(Boolean),
    ),
  ];
  if (!trayNumbers.length) return [];

  const responses = await Promise.all(
    trayNumbers.map((sortingTrayNumber) => getOrdersBySortingTray(sortingTrayNumber)),
  );
  return responses.flatMap((r) => r?.data || []);
}

const PackingListItem = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('ViewPackingScreen', { item })}>
    <View style={styles.listItemContainer}>
      <View style={styles.card}>
        <View style={styles.trayIconCircle}>
          <TrayIcon />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.boxNumber}>{item.sortingTrayNumber}</Text>
          <Text style={styles.plantCount}>
            {item.sortedPlantsCount ?? item.totalCount ?? 0}
            <Text style={{ color: '#556065' }}> plant(s)</Text>
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.flightDetailsRow}>
          <AirplaneIcon />
          <Text style={styles.flightDateText}>
            Plant Flight{' '}
            <Text style={{ fontWeight: 'bold' }}>{item.flightDate || 'Date TBD'}</Text>
          </Text>
        </View>
        <View style={styles.userRow}>
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          <View>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
            <Text style={styles.userRole}>Receiver</Text>
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const PackingScreen = ({ navigation }) => {
  const hubSpecEnabled = isLeafTrailHubSpecEnabled();
  const [packingData, setPackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminFilters, setAdminFilters] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(null);
  const activeFiltersRef = useRef(null);
  activeFiltersRef.current = activeFilters;

  const getFilters = async () => {
    const adminFilter = await getAdminLeafTrailFilters('["sorted", "packed"]');
    setAdminFilters(adminFilter);
  };

  const fetchData = async (filters) => {
    setIsLoading(true);
    try {
      const response = await getAdminLeafTrailPacking(filters);
      setPackingData(response);
    } catch (e) {
      console.error('Failed to fetch packing data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(activeFiltersRef.current);
      getFilters();
    }, []),
  );

  const onFilterChange = (filters) => {
    setActiveFilters(filters);
    fetchData(filters);
  };

  const trays = useMemo(() => {
    return [...(packingData?.data || [])].sort(compareTrays);
  }, [packingData?.data]);

  const handleSearch = () => {
    const trimmed = String(searchValue || '').trim();
    const next = { ...(activeFilters || {}) };
    if (trimmed) {
      next.search = trimmed;
    } else {
      delete next.search;
    }
    const payload = Object.keys(next).length ? next : null;
    setActiveFilters(payload);
    fetchData(payload);
    setSearchActive(false);
  };

  const handleSearchClear = () => {
    setSearchValue('');
    const next = { ...(activeFilters || {}) };
    delete next.search;
    const payload = Object.keys(next).length ? next : null;
    setActiveFilters(payload);
    fetchData(payload);
  };

  const handlePrintList = useCallback(async () => {
    if (actionLoading) return;
    if (!trays.length) {
      Alert.alert('Print', 'No trays in the current list.');
      return;
    }
    try {
      setActionLoading(true);
      const plants = await fetchPlantsForTrays(trays);
      if (!plants.length) {
        Alert.alert('Print', 'No plants found in the current tray list.');
        return;
      }
      const ids = plants.map((p) => p.id).filter(Boolean);
      const response = await generateThermalLabels(ids);
      if (!response?.success) {
        Alert.alert('Print', response?.message || 'Failed to generate barcodes.');
      }
    } catch (e) {
      Alert.alert('Print', e?.message || 'Failed to generate barcodes.');
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, trays]);

  const handleExportList = useCallback(async () => {
    if (actionLoading) return;
    if (!trays.length) {
      Alert.alert('Export', 'No trays in the current list.');
      return;
    }
    try {
      setActionLoading(true);
      const plants = await fetchPlantsForTrays(trays);
      if (!plants.length) {
        Alert.alert('Export', 'No plants found in the current tray list.');
        return;
      }
      await exportLeafTrailLinesToCsv(plants, { stageLabel: 'packing-trays' });
    } catch (e) {
      if (e?.message !== 'User did not share') {
        Alert.alert('Export failed', e?.message || 'Could not export data.');
      }
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, trays]);

  return (
    <SafeAreaView style={styles.screenContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {(isLoading || actionLoading) && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScreenHeader
        onSearchChange={setSearchValue}
        searchValue={searchValue}
        onSearchSubmit={handleSearch}
        onSearchClear={handleSearchClear}
        searchPlaceholder="Search Tray Number"
        searchActive={searchActive}
        onSearchPress={() => setSearchActive(!searchActive)}
        navigation={navigation}
        title="Packing"
        search
        printButton={!!hubSpecEnabled}
        onPrint={handlePrintList}
        downloadCsv={!!hubSpecEnabled}
        onDownloadCsv={handleExportList}
        downloadLoading={actionLoading}
        scarQr={hubSpecEnabled}
        scanQrParams={LEAF_TRAIL_SCAN_PARAMS.packing}
      />
      <FlatList
        data={trays}
        keyExtractor={(item) => String(item.sortingTrayNumber || item.id)}
        renderItem={({ item }) => (
          <PackingListItem item={item} navigation={navigation} />
        )}
        ListHeaderComponent={
          <>
            {hubSpecEnabled ? (
              <LeafTrailHubToolbar
                adminFilters={adminFilters}
                onFilterChange={onFilterChange}
              />
            ) : (
              <FilterBar adminFilters={adminFilters} onFilterChange={onFilterChange} />
            )}
            {activeFilters?.search ? (
              <Text style={styles.searchHint}>
                Showing trays matching “{activeFilters.search}”
              </Text>
            ) : null}
            <Text style={styles.countText}>
              {packingData?.total ?? trays.length} tray(es)
            </Text>
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No trays ready for packing.</Text>
          ) : null
        }
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContentContainer: {
    paddingBottom: 40,
  },
  searchHint: {
    paddingHorizontal: 15,
    paddingTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#539461',
  },
  countText: {
    textAlign: 'right',
    color: '#647276',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#647276',
    fontSize: 16,
    marginTop: 24,
  },
  listItemContainer: {
    backgroundColor: '#F5F6F6',
    padding: 12,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  trayIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB323',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  plantCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  detailsContainer: {
    paddingHorizontal: 6,
    gap: 8,
  },
  flightDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flightDateText: {
    fontSize: 16,
    color: '#556065',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  userHandle: {
    fontSize: 16,
    color: '#7F8D91',
  },
  userRole: {
    fontSize: 14,
    color: '#647276',
  },
});

export default PackingScreen;
