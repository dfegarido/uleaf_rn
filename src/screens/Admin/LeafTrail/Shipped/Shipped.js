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
import BarcodeIcon from '../../../../assets/admin-icons/barcode.svg';
import DimensionIcon from '../../../../assets/admin-icons/dimension.svg';
import ScaleIcon from '../../../../assets/admin-icons/scale.svg';
import FilterBar from '../../../../components/Admin/filter';
import LeafTrailHubToolbar from '../../../../components/Admin/LeafTrailHubToolbar';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled } from '../../../../config/featureFlags';
import { forceUppercaseHubLabel, LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import { exportLeafTrailLinesToCsv } from '../../../../utils/leafTrailHubExport';
import {
  generateThermalLabels,
  getAdminLeafTrailFilters,
  getAdminLeafTrailShipped,
  getOrdersByTrackingNumber,
} from '../../../../components/Api/getAdminLeafTrail';

const compareTracking = (a, b) =>
  String(a.trackingNumber || '').localeCompare(String(b.trackingNumber || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });

async function fetchPlantsForTracking(trackingItems) {
  const trackingNumbers = [
    ...new Set(
      (trackingItems || [])
        .map((t) => String(t.trackingNumber || '').trim())
        .filter(Boolean),
    ),
  ];
  if (!trackingNumbers.length) return [];

  const responses = await Promise.all(
    trackingNumbers.map((trackingNumber) => getOrdersByTrackingNumber(trackingNumber)),
  );
  return responses.flatMap((r) => r?.data || []);
}

const ShippedListItem = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('ViewShippedScreen', { item })}>
    <View style={styles.listItemContainer}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <BarcodeIcon />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
            <Text style={styles.plantCount}>
              {item.shippedPlantsCount}{' '}
              <Text style={{ color: '#556065' }}> plant(s)</Text>
            </Text>
          </View>
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <DimensionIcon />
              <Text style={styles.specText}>
                {item?.packingData?.dimensions?.length || 0}x
                {item?.packingData?.dimensions?.width || 0}x
                {item?.packingData?.dimensions?.height || 0} in
              </Text>
            </View>
            <View style={styles.specItem}>
              <ScaleIcon />
              <Text style={styles.specText}>
                {item?.packingData?.weight?.value || 0}{' '}
                {item?.packingData?.weight?.unit || ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.flightDetailsRow}>
          <AirplaneIcon />
          <Text style={styles.detailsText}>
            Plant Flight{' '}
            <Text style={{ fontWeight: 'bold' }}>{item.flightDateFormatted || 'Date TBD'}</Text>
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

const ShippedScreen = ({ navigation }) => {
  const hubSpecEnabled = isLeafTrailHubSpecEnabled();
  const [shippedData, setShippedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminFilters, setAdminFilters] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(null);
  const activeFiltersRef = useRef(null);
  activeFiltersRef.current = activeFilters;

  const getFilters = async () => {
    const adminFilter = await getAdminLeafTrailFilters('["shipped"]');
    setAdminFilters(adminFilter);
  };

  const fetchData = async (filters) => {
    setIsLoading(true);
    try {
      const response = await getAdminLeafTrailShipped(filters);
      setShippedData(response);
    } catch (e) {
      console.error('Failed to fetch delivered data:', e);
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

  const trackingGroups = useMemo(() => {
    return [...(shippedData?.data || [])].sort(compareTracking);
  }, [shippedData?.data]);

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

  const handlePrintList = useCallback(async () => {
    if (actionLoading) return;
    if (!trackingGroups.length) {
      Alert.alert('Print', 'No tracking numbers in the current list.');
      return;
    }
    try {
      setActionLoading(true);
      const plants = await fetchPlantsForTracking(trackingGroups);
      if (!plants.length) {
        Alert.alert('Print', 'No plants found in the current list.');
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
  }, [actionLoading, trackingGroups]);

  const handleExportList = useCallback(async () => {
    if (actionLoading) return;
    if (!trackingGroups.length) {
      Alert.alert('Export', 'No tracking numbers in the current list.');
      return;
    }
    try {
      setActionLoading(true);
      const plants = await fetchPlantsForTracking(trackingGroups);
      if (!plants.length) {
        Alert.alert('Export', 'No plants found in the current list.');
        return;
      }
      await exportLeafTrailLinesToCsv(plants, { stageLabel: 'delivered-boxes' });
    } catch (e) {
      if (e?.message !== 'User did not share') {
        Alert.alert('Export failed', e?.message || 'Could not export data.');
      }
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, trackingGroups]);

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
        onSearchChange={(text) => setSearchValue(forceUppercaseHubLabel(text))}
        searchValue={searchValue}
        onSearchSubmit={handleSearch}
        onSearchClear={handleSearchClear}
        searchPlaceholder="Search Tracking Number"
        searchActive={searchActive}
        onSearchPress={() => setSearchActive(!searchActive)}
        navigation={navigation}
        title="Delivered"
        search
        printButton={!!hubSpecEnabled}
        onPrint={handlePrintList}
        downloadCsv={!!hubSpecEnabled}
        onDownloadCsv={handleExportList}
        downloadLoading={actionLoading}
        scarQr={hubSpecEnabled}
        scanQrParams={LEAF_TRAIL_SCAN_PARAMS.shipped}
      />
      {hubSpecEnabled ? (
        <LeafTrailHubToolbar adminFilters={adminFilters} onFilterChange={onFilterChange} />
      ) : (
        <FilterBar adminFilters={adminFilters} onFilterChange={onFilterChange} />
      )}
      {activeFilters?.search ? (
        <Text style={styles.searchHint}>
          Showing tracking numbers matching “{activeFilters.search}”
        </Text>
      ) : null}
      <Text style={styles.countText}>
        {shippedData?.total ?? trackingGroups.length} tracking number(s)
      </Text>
      <FlatList
        data={trackingGroups}
        keyExtractor={(item) => String(item.trackingNumber || item.id)}
        renderItem={({ item }) => <ShippedListItem item={item} navigation={navigation} />}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No delivered shipments yet.</Text>
          ) : null
        }
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

export default ShippedScreen;

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
    color: '#647276',
    fontSize: 14,
    paddingHorizontal: 15,
    paddingTop: 4,
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
    paddingVertical: 32,
    paddingHorizontal: 15,
  },
  listItemContainer: {
    backgroundColor: '#F5F6F6',
    padding: 12,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    flexShrink: 1,
  },
  plantCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specText: {
    fontSize: 16,
    color: '#647276',
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
  detailsText: {
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
