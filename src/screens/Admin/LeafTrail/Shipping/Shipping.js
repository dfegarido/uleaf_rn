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
import CubeIcon from '../../../../assets/admin-icons/cube.svg';
import DimensionIcon from '../../../../assets/admin-icons/dimension.svg';
import ScaleIcon from '../../../../assets/admin-icons/scale.svg';
import FilterBar from '../../../../components/Admin/filter';
import LeafTrailHubToolbar from '../../../../components/Admin/LeafTrailHubToolbar';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled } from '../../../../config/featureFlags';
import { useLeafTrailListPrintExport } from '../../../../hooks/useLeafTrailListPrintExport';
import { forceUppercaseHubLabel, LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import {
  getAdminLeafTrailFilters,
  getAdminLeafTrailShipping,
} from '../../../../components/Api/getAdminLeafTrail';
import ShippingBoxCard from './ShippingBoxCard';

const compareBoxes = (a, b) =>
  String(a.boxNumber || '').localeCompare(String(b.boxNumber || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });

const ShippingListItem = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('ViewShippingScreen', { item })}>
    <View style={styles.listItemContainer}>
      <View style={styles.card}>
        <View style={styles.boxIconCircle}>
          <CubeIcon />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.fulfillmentNumber}>{item.boxNumber}</Text>
            <Text style={styles.plantCount}>
              {item.packedPlantsCount}{' '}
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

const ShippingScreen = ({ navigation }) => {
  const hubSpecEnabled = isLeafTrailHubSpecEnabled();
  const [shippingData, setShippingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminFilters, setAdminFilters] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(null);
  const activeFiltersRef = useRef(null);
  activeFiltersRef.current = activeFilters;

  const getFilters = async () => {
    const adminFilter = await getAdminLeafTrailFilters('["packed", "shipping"]');
    setAdminFilters(adminFilter);
  };

  const fetchData = async (filters) => {
    setIsLoading(true);
    try {
      const response = await getAdminLeafTrailShipping(filters);
      setShippingData(response);
    } catch (e) {
      console.error('Failed to fetch shipping data:', e);
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

  const boxes = useMemo(() => {
    return [...(shippingData?.data || [])].sort(compareBoxes);
  }, [shippingData?.data]);

  const hubTotals = useMemo(() => {
    return boxes.reduce(
      (acc, box) => ({
        boxCount: acc.boxCount + 1,
        plantCount: acc.plantCount + (box.packedPlantsCount || 0),
        withTracking: acc.withTracking + (String(box.trackingNumber || '').trim() ? 1 : 0),
      }),
      { boxCount: 0, plantCount: 0, withTracking: 0 },
    );
  }, [boxes]);

  const {
    actionLoading,
    showLabelViewer,
    LabelViewer,
    handlePrint: handlePrintList,
    handleExport: handleExportList,
    exportLoading,
  } = useLeafTrailListPrintExport({
    labelTitle: 'In-Transit labels',
    exportStageLabel: 'in-transit-boxes',
    listKind: 'boxes',
    isLoading,
    listItems: boxes,
    emptyListMessage: 'No boxes in the current list.',
    noPlantsMessage: 'No plants found for these boxes.',
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
        <LeafTrailHubToolbar adminFilters={adminFilters} onFilterChange={onFilterChange} />
      ) : (
        <FilterBar adminFilters={adminFilters} onFilterChange={onFilterChange} />
      )}
      {hubSpecEnabled && boxes.length > 0 ? (
        <View style={styles.receivedSummaryRow}>
          <View style={styles.receivedSummaryCell}>
            <Text style={styles.receivedSummaryValue}>{hubTotals.plantCount}</Text>
            <Text style={styles.receivedSummaryLabel}>plants in transit</Text>
          </View>
          <View style={styles.receivedSummarySep} />
          <View style={styles.receivedSummaryCell}>
            <Text style={[styles.receivedSummaryValue, styles.receivedSummaryValueGreen]}>
              {hubTotals.withTracking}
            </Text>
            <Text style={styles.receivedSummaryLabel}>with tracking</Text>
          </View>
          <View style={styles.receivedSummarySep} />
          <View style={styles.receivedSummaryCell}>
            <Text style={styles.receivedSummaryValue}>
              {Math.max(0, hubTotals.boxCount - hubTotals.withTracking)}
            </Text>
            <Text style={styles.receivedSummaryLabel}>need tracking</Text>
          </View>
        </View>
      ) : null}
      {activeFilters?.search ? (
        <Text style={styles.searchHint}>Showing boxes matching “{activeFilters.search}”</Text>
      ) : null}
      <Text style={styles.countText}>{shippingData?.total ?? boxes.length} box(es)</Text>
      {hubSpecEnabled && boxes.length > 0 ? (
        <Text style={styles.sectionTitle}>All boxes in transit</Text>
      ) : null}
    </>
  );

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
        searchPlaceholder="Search Box Number"
        searchActive={searchActive}
        onSearchPress={() => setSearchActive(!searchActive)}
        navigation={navigation}
        title="In-Transit"
        search
        printButton
        onPrint={handlePrintList}
        downloadCsv
        onDownloadCsv={handleExportList}
        downloadLoading={exportLoading}
        scarQr={hubSpecEnabled}
        scanQrParams={LEAF_TRAIL_SCAN_PARAMS.shipping}
      />
      {hubSpecEnabled ? (
        <FlatList
          key="shipping-box-grid"
          data={boxes}
          numColumns={2}
          keyExtractor={(item) => String(item.boxNumber || item.id)}
          columnWrapperStyle={styles.receiverBoxesRow}
          renderItem={({ item }) => (
            <ShippingBoxCard
              box={item}
              onPress={() => navigation.navigate('ViewShippingScreen', { item })}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>No boxes in transit.</Text>
            ) : null
          }
          contentContainerStyle={styles.hubListContentContainer}
        />
      ) : (
        <FlatList
          data={boxes}
          keyExtractor={(item) => String(item.boxNumber || item.id)}
          renderItem={({ item }) => <ShippingListItem item={item} navigation={navigation} />}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>No boxes in transit.</Text>
            ) : null
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default ShippingScreen;

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
  hubListContentContainer: {
    paddingBottom: 34,
    paddingHorizontal: 8,
  },
  receivedSummaryRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: '#F4F7F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE7E1',
    paddingVertical: 10,
  },
  receivedSummaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  receivedSummarySep: {
    width: 1,
    backgroundColor: '#DDE7E1',
    marginVertical: 4,
  },
  receivedSummaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202325',
  },
  receivedSummaryValueGreen: {
    color: '#2F8C4F',
  },
  receivedSummaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#647276',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    paddingHorizontal: 15,
    paddingTop: 4,
    paddingBottom: 8,
  },
  receiverBoxesRow: {
    gap: 10,
    marginBottom: 10,
    alignItems: 'stretch',
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
  boxIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#48A7F8',
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
  fulfillmentNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
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
