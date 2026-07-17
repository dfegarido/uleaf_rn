import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
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
import {
  mergeFlightDatesIntoAdminFilters,
  mergeSellerFilterLists,
} from '../../../../components/Admin/plantFlightFilter';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled } from '../../../../config/featureFlags';
import LeafTrailLabelGeneratingOverlay from '../../../../components/Admin/LeafTrailLabelGeneratingOverlay';
import { useLeafTrailListPrintExport } from '../../../../hooks/useLeafTrailListPrintExport';
import { forceUppercaseHubLabel, LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import {
  getAdminLeafTrailFilters,
  getAdminLeafTrailPacking,
  sendReceiverBoxesToInTransit,
} from '../../../../components/Api/getAdminLeafTrail';
import PackingTrayCard from './PackingTrayCard';
import PackingTraySummary from './PackingTraySummary';
import PackingBoxSelectionFooter from './PackingBoxSelectionFooter';

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
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(null);
  const [selectedTrayNumbers, setSelectedTrayNumbers] = useState([]);
  const [sendingToInTransit, setSendingToInTransit] = useState(false);
  const activeFiltersRef = useRef(null);
  activeFiltersRef.current = activeFilters;

  const getFilters = async () => {
    setFiltersLoading(true);
    try {
      const adminFilter = await getAdminLeafTrailFilters(
        '["sorted", "packed", "received"]',
        { lite: true },
      );
      setAdminFilters(adminFilter);
    } catch (e) {
      console.error('Failed to load packing filters:', e);
      setAdminFilters((prev) => prev || {});
    } finally {
      setFiltersLoading(false);
    }
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
      Promise.all([fetchData(activeFiltersRef.current), getFilters()]);
    }, []),
  );

  const onFilterChange = (filters) => {
    setActiveFilters(filters);
    fetchData(filters);
  };

  const trays = useMemo(() => {
    return [...(packingData?.data || [])].sort(compareTrays);
  }, [packingData?.data]);

  const sendableTrays = useMemo(
    () => trays.filter((tray) => tray.isReadyForShipping || tray.isComplete),
    [trays],
  );

  const isAllSendableSelected =
    sendableTrays.length > 0 &&
    sendableTrays.every((tray) =>
      selectedTrayNumbers.includes(String(tray.sortingTrayNumber || '').trim()),
    );

  const toggleTraySelection = (tray) => {
    const trayNumber = String(tray?.sortingTrayNumber || '').trim();
    if (!trayNumber) return;
    if (!(tray.isReadyForShipping || tray.isComplete)) {
      Alert.alert(
        'Not ready',
        'Finish packing and assign box numbers before sending to In Transit.',
      );
      return;
    }
    setSelectedTrayNumbers((prev) =>
      prev.includes(trayNumber)
        ? prev.filter((n) => n !== trayNumber)
        : [...prev, trayNumber],
    );
  };

  const handleSelectAllSendable = () => {
    if (isAllSendableSelected) {
      setSelectedTrayNumbers([]);
      return;
    }
    setSelectedTrayNumbers(
      sendableTrays.map((tray) => String(tray.sortingTrayNumber || '').trim()).filter(Boolean),
    );
  };

  const handleSendToInTransit = async () => {
    if (!selectedTrayNumbers.length) return;
    setSendingToInTransit(true);
    try {
      const response = await sendReceiverBoxesToInTransit({
        sortingTrayNumbers: selectedTrayNumbers,
      });
      if (response?.success) {
        const warnings = [];
        if (response.notReady?.length) {
          warnings.push(`Not ready: ${response.notReady.join(', ')}`);
        }
        if (response.missing?.length) {
          warnings.push(`Not found: ${response.missing.join(', ')}`);
        }
        Alert.alert(
          'Sent to In Transit',
          [response.message, ...warnings].filter(Boolean).join('\n'),
        );
        setSelectedTrayNumbers([]);
        await fetchData(activeFiltersRef.current);
      } else {
        Alert.alert('Error', response?.message || 'Could not send boxes to In Transit.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not send boxes to In Transit.');
    } finally {
      setSendingToInTransit(false);
    }
  };

  const hubTotals = useMemo(() => {
    return trays.reduce(
      (acc, tray) => ({
        totalCount: acc.totalCount + (tray.totalCount ?? tray.sortedPlantsCount ?? 0),
        packedCount: acc.packedCount + (tray.packedCount ?? 0),
        boxAssignedCount: acc.boxAssignedCount + (tray.boxAssignedCount ?? 0),
        sortedCount: acc.sortedCount + (tray.sortedCount ?? 0),
      }),
      { totalCount: 0, packedCount: 0, boxAssignedCount: 0, sortedCount: 0 },
    );
  }, [trays]);

  const adminFiltersWithFlights = useMemo(() => {
    const fromTrays = mergeFlightDatesIntoAdminFilters(adminFilters, trays);
    const responseIsos = packingData?.flightDateIsos || [];
    const withFlights = mergeFlightDatesIntoAdminFilters(
      fromTrays,
      responseIsos.map((iso) => ({
        flightDateIso: iso,
      })),
    );
    const mergedSellers = mergeSellerFilterLists(
      withFlights?.seller,
      packingData?.sellers,
    );
    return {
      ...withFlights,
      seller: mergedSellers,
    };
  }, [adminFilters, trays, packingData?.flightDateIsos, packingData?.sellers]);

  const sellersLoading =
    filtersLoading && !(adminFiltersWithFlights?.seller || []).length;

  const {
    actionLoading,
    showLabelViewer,
    printStatusMessage,
    LabelViewer,
    LabelGeneratingOverlay,
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

  const listHeader = (
    <>
      {hubSpecEnabled ? (
        <LeafTrailHubToolbar
          adminFilters={adminFiltersWithFlights}
          onFilterChange={onFilterChange}
          sellersLoading={sellersLoading}
        />
      ) : (
        <FilterBar
          adminFilters={adminFiltersWithFlights}
          onFilterChange={onFilterChange}
          sellersLoading={sellersLoading}
        />
      )}
      {hubSpecEnabled && trays.length > 0 ? (
        <PackingTraySummary metrics={hubTotals} variant="inline" />
      ) : null}
      {activeFilters?.search ? (
        <Text style={styles.searchHint}>
          Showing trays matching “{activeFilters.search}”
        </Text>
      ) : null}
      <Text style={styles.countText}>
        {packingData?.total ?? trays.length} box(es)
      </Text>
      {hubSpecEnabled && trays.length > 0 ? (
        <Text style={styles.sectionTitle}>All receiver boxes</Text>
      ) : null}
      {hubSpecEnabled && sendableTrays.length > 0 ? (
        <Text style={styles.selectionHint}>
          Tap ready boxes to select, then send to In Transit.
        </Text>
      ) : null}
    </>
  );

  const emptyComponent = !isLoading ? (
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
  ) : null;

  return (
    <SafeAreaView style={styles.screenContainer} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {isLoading && !showLabelViewer ? (
        <LeafTrailLabelGeneratingOverlay
          visible
          title="Loading packing trays"
          message="Fetching tray data, please wait…"
        />
      ) : null}
      <LabelGeneratingOverlay />
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
      {hubSpecEnabled ? (
        <FlatList
          key="packing-tray-grid"
          data={trays}
          numColumns={2}
          keyExtractor={(item) => String(item.sortingTrayNumber || item.id)}
          columnWrapperStyle={styles.receiverBoxesRow}
          renderItem={({ item }) => {
            const trayNumber = String(item.sortingTrayNumber || '').trim();
            const canSelect = item.isReadyForShipping || item.isComplete;
            return (
              <PackingTrayCard
                tray={item}
                useBoxLabel
                selectable={canSelect}
                isSelected={selectedTrayNumbers.includes(trayNumber)}
                onToggleSelect={() => toggleTraySelection(item)}
                onPress={() => navigation.navigate('ViewPackingScreen', { item })}
              />
            );
          }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={[
            styles.hubListContentContainer,
            selectedTrayNumbers.length > 0 && styles.hubListContentWithFooter,
          ]}
        />
      ) : (
        <FlatList
          data={trays}
          keyExtractor={(item) => String(item.sortingTrayNumber || item.id)}
          renderItem={({ item }) => (
            <PackingListItem item={item} navigation={navigation} />
          )}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
      {hubSpecEnabled ? (
        <PackingBoxSelectionFooter
          selectedCount={selectedTrayNumbers.length}
          sendableCount={sendableTrays.length}
          isAllSelected={isAllSendableSelected}
          onSelectAll={handleSelectAllSendable}
          onClear={() => setSelectedTrayNumbers([])}
          onSendToInTransit={handleSendToInTransit}
          sending={sendingToInTransit}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#202325',
    textAlign: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContentContainer: {
    paddingBottom: 40,
  },
  hubListContentContainer: {
    paddingBottom: 34,
    paddingHorizontal: 8,
  },
  hubListContentWithFooter: {
    paddingBottom: 180,
  },
  selectionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#647276',
    paddingHorizontal: 15,
    paddingBottom: 8,
  },
  receiverBoxesRow: {
    gap: 10,
    marginBottom: 10,
    alignItems: 'stretch',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    paddingHorizontal: 15,
    paddingTop: 4,
    paddingBottom: 8,
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
