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
import { useLeafTrailListPrintExport } from '../../../../hooks/useLeafTrailListPrintExport';
import { forceUppercaseHubLabel, LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import {
  getAdminLeafTrailFilters,
  getAdminLeafTrailPacking,
} from '../../../../components/Api/getAdminLeafTrail';

const compareTrays = (a, b) =>
  String(a.sortingTrayNumber || '').localeCompare(
    String(b.sortingTrayNumber || ''),
    undefined,
    { numeric: true, sensitivity: 'base' },
  );

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
  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
    setFetchError(null);
    try {
      const response = await getAdminLeafTrailPacking(filters);
      setPackingData(response);
    } catch (e) {
      console.error('Failed to fetch packing data:', e);
      setFetchError(e?.message || 'Could not load packing trays.');
      setPackingData({ total: 0, data: [] });
      Alert.alert(
        'Packing load failed',
        e?.message ||
          'Could not reach the server. If using the emulator, confirm npm run serve is running and LOCAL_BASE_URL in .env matches your machine IP.',
      );
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

  const {
    actionLoading,
    showLabelViewer,
    LabelViewer,
    handlePrint: handlePrintList,
    handleExport: handleExportList,
    exportLoading,
  } = useLeafTrailListPrintExport({
    labelTitle: 'Packing labels',
    exportStageLabel: 'packing-trays',
    listKind: 'trays',
    isLoading,
    listItems: trays,
    emptyListMessage: 'No trays in the current list.',
    noPlantsMessage:
      'No plants found for these trays. Confirm tray numbers are assigned and plants are sorted.',
  });

  const handleSearch = () => {
    const trimmed = forceUppercaseHubLabel(String(searchValue || '').trim());
    setSearchValue(trimmed);
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

  return (
    <SafeAreaView style={styles.screenContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {(isLoading || actionLoading) && !showLabelViewer && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <LabelViewer />
      <ScreenHeader
        onSearchChange={(text) => setSearchValue(forceUppercaseHubLabel(text))}
        searchValue={searchValue}
        onSearchSubmit={handleSearch}
        onSearchClear={handleSearchClear}
        searchPlaceholder="Search Tray Number"
        searchActive={searchActive}
        onSearchPress={() => setSearchActive(!searchActive)}
        navigation={navigation}
        title="Packing"
        search
        printButton
        onPrint={handlePrintList}
        downloadCsv
        onDownloadCsv={handleExportList}
        downloadLoading={exportLoading}
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
            <View style={styles.emptyWrap}>
              {fetchError ? (
                <Text style={styles.emptyErrorText}>{fetchError}</Text>
              ) : (
                <>
                  <Text style={styles.emptyText}>No trays ready for packing.</Text>
                  <Text style={styles.emptyHint}>
                    Trays appear here after plants are scanned as sorted in Plant Sorting and
                    assigned a tray number on the receiver box (tray icon in the box header).
                  </Text>
                  {activeFilters &&
                  (activeFilters.search ||
                    activeFilters.flightDate ||
                    activeFilters.gardenOrCompanyName ||
                    activeFilters.sellerName) ? (
                    <Text style={styles.emptyHint}>
                      Active filters may be hiding trays — clear filters and try again.
                    </Text>
                  ) : null}
                </>
              )}
            </View>
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
  emptyWrap: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#647276',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    textAlign: 'center',
    color: '#7F8D91',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyErrorText: {
    textAlign: 'center',
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
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
