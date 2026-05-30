import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import FilterBar from '../../../../components/Admin/filter';
import LeafTrailHubToolbar from '../../../../components/Admin/LeafTrailHubToolbar';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled } from '../../../../config/featureFlags';
import { useLeafTrailHubActions } from '../../../../hooks/useLeafTrailHubActions';
import { LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import {
  getAdminLeafTrailFilters,
  getAdminLeafTrailSorting,
} from '../../../../components/Api/getAdminLeafTrail';
import SortingBoxDetail from './SortingBoxDetail';
import SortingBoxPrintedSummary from './SortingBoxPrintedSummary';

const ListItem = ({ item, navigation }) => (
  <TouchableOpacity
    onPress={() => navigation.navigate('LeafTrailSortingDetailsScreen', { item })}>
    <View style={styles.greenhouseList}>
      <View style={styles.card}>
        <Image source={{ uri: item?.avatar || '' }} style={styles.avatar} />
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{item.name}</Text>
            <Text style={styles.usernameText}>@{item.username}</Text>
          </View>
          <View style={styles.quantityRow}>
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Received</Text>
              <Text style={styles.receivedNumber}>{item.receivedPlantsCount}</Text>
            </View>
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Sorted</Text>
              <Text style={styles.receivedNumber}>{item.sortedPlantsCount}</Text>
            </View>
          </View>
          <View style={styles.quantityRow}>
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Need to Stay</Text>
              <Text style={styles.receivedNumber}>{item.needsToStayOrderCount}</Text>
            </View>
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Mishap</Text>
              <Text style={styles.mishapNumber}>{item.journeyMishapCount}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailsContent}>
          <AirplaneIcon width={20} height={20} color="#556065" />
          <Text style={styles.detailsText}>
            Plant Flight{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {item.flightDateFormatted || 'Date TBD'}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

/** Same order as backend: receiver first name A→Z, then full name. */
const compareSortingBoxes = (a, b) => {
  const firstCmp = String(a.receiverFirstName || '').localeCompare(
    String(b.receiverFirstName || ''),
  );
  if (firstCmp !== 0) return firstCmp;
  return String(a.receiverName || '').localeCompare(String(b.receiverName || ''));
};

const SortingBoxCard = ({ box, displayBoxNumber, onPress }) => (
  <TouchableOpacity
    style={[styles.receiverBoxCard, { backgroundColor: box.boxColor || '#FDE8F0' }]}
    activeOpacity={0.85}
    onPress={onPress}>
    <View style={styles.boxNumberBadge}>
      <Text style={styles.boxNumberText}>{displayBoxNumber}</Text>
    </View>
    <Text style={styles.receiverBoxTitle} numberOfLines={2}>
      {box.receiverName}
      {box.username ? (
        <Text style={styles.receiverBoxHandle}> @{box.username}</Text>
      ) : null}
    </Text>
    {box.joiners?.length > 0 ? (
      <View style={styles.joinersBlock}>
        <Text style={styles.joinersLabel}>Joiners</Text>
        <Text style={styles.joinersList} numberOfLines={3}>
          {box.joiners.join(', ')}
        </Text>
      </View>
    ) : null}
    <View style={styles.receiverBoxDivider} />
    <SortingBoxPrintedSummary metrics={box} variant="card" />
    <Text style={styles.receiverBoxHint}>Tap to open box</Text>
  </TouchableOpacity>
);

const SortingScreen = ({ navigation }) => {
  const hubSpecEnabled = isLeafTrailHubSpecEnabled();
  const [sortingData, setSortingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminFilters, setAdminFilters] = useState(null);
  const [activeBox, setActiveBox] = useState(null);
  const [activeFilters, setActiveFilters] = useState(null);
  const activeFiltersRef = useRef(null);
  activeFiltersRef.current = activeFilters;

  const getFilters = async () => {
    const adminFilter = await getAdminLeafTrailFilters(
      '["received", "damaged", "missing", "sorted", "needsToStay"]',
    );
    setAdminFilters(adminFilter);
  };

  const fetchData = async (filters) => {
    setIsLoading(true);
    try {
      const response = await getAdminLeafTrailSorting(filters);
      setSortingData(response);
      if (activeBox?.boxKey) {
        const refreshed = (response?.receiverBoxes || []).find(
          (b) => b.boxKey === activeBox.boxKey,
        );
        if (refreshed) setActiveBox(refreshed);
      }
    } catch (e) {
      console.error('Failed to fetch plant data:', e);
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

  /** Grid reads left→right, top→bottom; numbers must be 1,2,3… in that same order. */
  const receiverBoxes = useMemo(() => {
    const boxes = [...(sortingData?.receiverBoxes || [])].sort(compareSortingBoxes);
    return boxes.map((box, index) => ({
      ...box,
      boxNumber: index + 1,
    }));
  }, [sortingData?.receiverBoxes]);

  /** Aggregate received/sorted totals across all hub boxes for the summary row. */
  const hubTotals = useMemo(() => {
    return receiverBoxes.reduce(
      (acc, box) => ({
        forReceivingCount: acc.forReceivingCount + (box.forReceivingCount || 0),
        receivedCount: acc.receivedCount + (box.receivedCount || 0),
        sortedCount: acc.sortedCount + (box.sortedCount || 0),
      }),
      { forReceivingCount: 0, receivedCount: 0, sortedCount: 0 },
    );
  }, [receiverBoxes]);

  const hubHeaderActions = useLeafTrailHubActions({
    exportLines: receiverBoxes.flatMap((b) => b.plants || []),
    exportStageLabel: 'sorting-receivers',
    onPrintPress: () => {},
    printDisabled: true,
    exportDisabled: !receiverBoxes.length,
    emptyPrintMessage: 'Open a receiver box to print plant barcodes.',
    emptyExportMessage: 'No receiver boxes to export.',
  });

  const listHeader = (
    <>
      {hubSpecEnabled ? (
        <LeafTrailHubToolbar adminFilters={adminFilters} onFilterChange={onFilterChange} />
      ) : (
        <FilterBar adminFilters={adminFilters} onFilterChange={onFilterChange} />
      )}
      {hubSpecEnabled && receiverBoxes.length > 0 ? (
        <View style={styles.receivedSummaryRow}>
          <View style={styles.receivedSummaryCell}>
            <Text style={styles.receivedSummaryValue}>{hubTotals.receivedCount}</Text>
            <Text style={styles.receivedSummaryLabel}>
              {'of '}
              <Text style={styles.receivedSummaryTotal}>{hubTotals.forReceivingCount}</Text>
              {' received'}
            </Text>
          </View>
          <View style={styles.receivedSummarySep} />
          <View style={styles.receivedSummaryCell}>
            <Text style={[styles.receivedSummaryValue, styles.receivedSummaryValueGreen]}>
              {hubTotals.sortedCount}
            </Text>
            <Text style={styles.receivedSummaryLabel}>sorted</Text>
          </View>
          <View style={styles.receivedSummarySep} />
          <View style={styles.receivedSummaryCell}>
            <Text style={styles.receivedSummaryValue}>
              {Math.max(0, hubTotals.receivedCount - hubTotals.sortedCount)}
            </Text>
            <Text style={styles.receivedSummaryLabel}>to sort</Text>
          </View>
        </View>
      ) : null}
      <Text style={styles.countText}>
        {hubSpecEnabled
          ? `${sortingData?.receiverBoxCount || receiverBoxes.length} box(es)`
          : `${sortingData?.total || 0} receiver(s)`}
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {isLoading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScreenHeader
        navigation={navigation}
        title="Plant Sorting"
        printButton={!!hubSpecEnabled}
        onPrint={hubHeaderActions.onPrint}
        downloadCsv={!!hubSpecEnabled}
        onDownloadCsv={hubHeaderActions.onExport}
        downloadLoading={hubHeaderActions.exportLoading}
        scarQr={hubSpecEnabled}
        scanQrParams={LEAF_TRAIL_SCAN_PARAMS.sorting}
      />

      {hubSpecEnabled ? (
        <FlatList
          key="sorting-box-grid"
          data={receiverBoxes}
          numColumns={2}
          keyExtractor={(item) => item.boxKey}
          columnWrapperStyle={styles.receiverBoxesRow}
          renderItem={({ item, index }) => (
            <SortingBoxCard
              box={item}
              displayBoxNumber={index + 1}
              onPress={() => setActiveBox(item)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>No receiver boxes found.</Text>
            ) : null
          }
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <FlatList
          data={sortingData?.data || []}
          renderItem={({ item }) => (
            <ListItem item={item} navigation={navigation} />
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      <SortingBoxDetail
        visible={!!activeBox}
        box={activeBox}
        navigation={navigation}
        onClose={() => setActiveBox(null)}
        onRefresh={() => fetchData(activeFilters)}
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
  },
  receivedSummaryTotal: {
    fontWeight: '700',
    color: '#202325',
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
  receiverBoxesRow: {
    gap: 10,
    marginBottom: 10,
    alignItems: 'stretch',
  },
  receiverBoxCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFEAE2',
    padding: 12,
    minHeight: 200,
    overflow: 'hidden',
    position: 'relative',
  },
  boxNumberBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  boxNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#202325',
  },
  receiverBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A23',
    paddingRight: 36,
  },
  receiverBoxHandle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8D91',
  },
  joinersBlock: {
    marginTop: 6,
  },
  joinersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5E6A62',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  joinersList: {
    fontSize: 12,
    color: '#38423D',
    lineHeight: 17,
    marginTop: 2,
  },
  receiverBoxDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 8,
  },
  receiverBoxHint: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    color: '#2F8C4F',
  },
  greenhouseList: {
    backgroundColor: '#F5F6F6',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  usernameText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#7F8D91',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantitySection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#647276',
  },
  receivedNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#202325',
  },
  mishapNumber: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#E7522F',
  },
  detailsRow: {
    paddingHorizontal: 6,
  },
  detailsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#556065',
  },
});

export default SortingScreen;
