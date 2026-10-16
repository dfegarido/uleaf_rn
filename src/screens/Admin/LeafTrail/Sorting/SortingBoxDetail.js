import AppImage from '../../../../components/AppImage/AppImage';

import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '../../../../assets/admin-icons/back.svg';
import OptionsIcon from '../../../../assets/admin-icons/options.svg';
import ScanQrIcon from '../../../../assets/admin-icons/qr.svg';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import PrintIcon from '../../../../assets/icons/greylight/printer.svg';
import { updateLeafTrailStatus } from '../../../../components/Api/getAdminLeafTrail';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import { useLeafTrailThermalPrint } from '../../../../hooks/useLeafTrailThermalPrint';
import { formatPlantStatusDisplayLabel } from '../../OrderSummary/OrderSummaryStatusSheet';
import { LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import {
  SORTING_BOX_COLOR_COMPLETE,
  SORTING_BOX_COLOR_INCOMPLETE,
  computeSortingBoxMetrics,
  isForReceivingPlant,
  isIncludedInSortingPlantList,
  isReceivedAndSortedTogether,
  isReceivedSeparatelyPlant,
  isSortedPlant as plantIsSorted,
  sortPlantsForSortingBoxList,
} from '../../../../utils/sortingBoxMetrics';
import { getAdminHeaderTopPadding } from '../../../../utils/adminHeaderInsets';
import SortingBoxPrintedSummary from './SortingBoxPrintedSummary';
import TagAsOptions from './TagAs';
import {
  SortingTrayAssignSheet,
  getSharedSortingTrayNumber,
} from './SortingTrayAssign';

const buildTagAsFlagsForPlant = (plant) => {
  let status = {
    isMissing: true,
    isDamaged: true,
    isNeedsToStay: true,
    isOthers: true,
  };
  const leaf = String(plant?.leafTrailStatus || '')
    .toLowerCase()
    .replace(/\s+/g, '');
  if (leaf === 'missing') {
    status = { isDamaged: true, isNeedsToStay: true, isOthers: true, forShipping: true };
  } else if (leaf === 'damaged') {
    status = { isMissing: true, isNeedsToStay: true, isOthers: true, forShipping: true };
  } else if (leaf === 'needstostay') {
    status = { isMissing: true, isDamaged: true, isOthers: true, forShipping: true };
  } else if (leaf === 'others') {
    status = { isMissing: true, isDamaged: true, isNeedsToStay: true, forShipping: true };
  }
  return status;
};

function receivedSeparatelyLabel(plant) {
  const leaf = String(plant?.leafTrailStatus || '').toLowerCase().replace(/[\s_-]+/g, '');
  return leaf === 'needstostay' ? 'Needs to Stay' : 'Received';
}

function formatScanStamp(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const SortingPlantRow = ({ plant, boxNumber, actionLabel, statusLabel, statusTone, onOpenTagAs, onScan }) => {
  const scannedAt = formatScanStamp(plant.receivedAt);
  return (
    <View style={styles.plantCard}>
      <AppImage source={{ uri: plant.plantImage }} style={styles.plantImage} />
      <View style={styles.plantDetails}>
        <Text style={styles.plantName} numberOfLines={2}>
          {plant.genus} {plant.species}
        </Text>
        {plant.variegation ? (
          <Text style={styles.plantMeta} numberOfLines={1}>{plant.variegation}</Text>
        ) : null}
        {plant.gardenName ? (
          <Text style={styles.plantMeta} numberOfLines={1}>{plant.gardenName}</Text>
        ) : null}
        <Text style={styles.plantCode}>{plant.plantCode}</Text>
        {boxNumber ? (
          <View style={styles.boxChip}>
            <Text style={styles.boxChipText}>Box {boxNumber}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.plantRight}>
        <View style={styles.plantRightTop}>
          <CountryFlagIcon code={plant.countryCode} width={22} height={14} />
          <TouchableOpacity
            onPress={() => onOpenTagAs?.(plant)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Tag plant status">
            <OptionsIcon width={20} height={20} />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.statusPill,
            statusTone === 'waiting' ? styles.statusPillWaiting : styles.statusPillDone,
          ]}>
          <Text
            style={[
              styles.statusPillText,
              statusTone === 'waiting' ? styles.statusPillTextWaiting : styles.statusPillTextDone,
            ]}>
            {statusLabel}
          </Text>
        </View>
        {scannedAt ? <Text style={styles.scanStamp}>{scannedAt}</Text> : null}
        {plant.receivedBy ? (
          <Text style={styles.scanBy} numberOfLines={1}>by {plant.receivedBy}</Text>
        ) : null}
        {actionLabel ? (
          <TouchableOpacity style={styles.rowScanButton} onPress={onScan} activeOpacity={0.85}>
            <ScanQrIcon width={16} height={16} />
            <Text style={styles.rowScanButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const BOX_PLANT_TABS = [
  { key: 'forReceiving', label: 'For Receiving', empty: 'No plants are still For receiving.' },
  { key: 'receivedSeparately', label: 'Received Separately', empty: 'No plants were received separately.' },
  { key: 'together', label: 'Received & Sorted Together', empty: 'No plants were received and sorted together.' },
  { key: 'sorted', label: 'Sorted', empty: 'No sorted plants yet.' },
];

const SortingBoxDetail = ({ visible, box, navigation, onClose, onRefresh }) => {
  const insets = useSafeAreaInsets();
  const [finishPromptVisible, setFinishPromptVisible] = useState(false);
  const [traySheetVisible, setTraySheetVisible] = useState(false);
  const [plantTab, setPlantTab] = useState('forReceiving');
  const [isTagAsVisible, setTagAsVisible] = useState(false);
  const [tagOrderId, setTagOrderId] = useState(null);
  const [tagFlags, setTagFlags] = useState({
    isMissing: false,
    isDamaged: false,
    isNeedsToStay: false,
    isOthers: false,
    forShipping: false,
  });
  const {
    printOrderIds,
    actionLoading: printLoading,
    showLabelViewer,
    LabelViewer,
    LabelGeneratingOverlay,
  } = useLeafTrailThermalPrint('Plant QR labels', { embeddedOverlay: true });

  const boxPlants = useMemo(
    () => (box?.plants || []).filter(isIncludedInSortingPlantList),
    [box?.plants],
  );

  const metrics = useMemo(
    () => computeSortingBoxMetrics(boxPlants),
    [boxPlants],
  );

  const alphabeticalPlants = useMemo(
    () => sortPlantsForSortingBoxList(boxPlants),
    [boxPlants],
  );

  const forReceivingPlants = useMemo(
    () => alphabeticalPlants.filter(isForReceivingPlant),
    [alphabeticalPlants],
  );
  const receivedSeparatelyPlants = useMemo(
    () => alphabeticalPlants.filter(isReceivedSeparatelyPlant),
    [alphabeticalPlants],
  );
  const togetherPlants = useMemo(
    () => alphabeticalPlants.filter(isReceivedAndSortedTogether),
    [alphabeticalPlants],
  );
  const sortedPlantsList = useMemo(
    () => alphabeticalPlants.filter(plantIsSorted),
    [alphabeticalPlants],
  );
  const plantsByTab = {
    forReceiving: forReceivingPlants,
    receivedSeparately: receivedSeparatelyPlants,
    together: togetherPlants,
    sorted: sortedPlantsList,
  };
  const visiblePlants = plantsByTab[plantTab] || [];
  const activeTab = BOX_PLANT_TABS.find((tab) => tab.key === plantTab) || BOX_PLANT_TABS[0];

  const handlePrintVisiblePlants = useCallback(() => {
    printOrderIds(
      visiblePlants.map((p) => p.id).filter(Boolean),
      {
        emptyMessage: `No ${activeTab.label} plants in this box to print.`,
      },
    );
  }, [activeTab.label, printOrderIds, visiblePlants]);

  const openTagAs = useCallback((plant) => {
    if (!plant?.id) return;
    setTagFlags(buildTagAsFlagsForPlant(plant));
    setTagOrderId(plant.id);
    setTagAsVisible(true);
  }, []);

  const closeTagAs = useCallback(() => {
    setTagAsVisible(false);
    setTagOrderId(null);
  }, []);

  const setTagAs = useCallback(
    async (status) => {
      if (!tagOrderId) return;
      closeTagAs();
      try {
        const response = await updateLeafTrailStatus(tagOrderId, status, {
          refreshSortingView: true,
        });
        if (response?.success === false) {
          Alert.alert('Error', response?.message || 'Failed to update plant status.');
          return;
        }
        onRefresh?.();
        Alert.alert(
          'Success',
          `Plant tagged as ${formatPlantStatusDisplayLabel(status)}.`,
        );
      } catch (error) {
        console.error('Sorting tag status error:', error);
        Alert.alert('Error', error?.message || 'Failed to update plant status.');
      }
    },
    [tagOrderId, closeTagAs, onRefresh],
  );

  const prevSortedCountRef = React.useRef(0);

  React.useEffect(() => {
    if (visible && box?.boxKey) {
      setPlantTab('forReceiving');
      setTraySheetVisible(false);
      closeTagAs();
      prevSortedCountRef.current = (box?.plants || [])
        .filter(isIncludedInSortingPlantList)
        .filter(plantIsSorted).length;
    }
    if (!visible) {
      setTraySheetVisible(false);
      closeTagAs();
    }
  }, [visible, box?.boxKey, closeTagAs]);

  useFocusEffect(
    useCallback(() => {
      if (visible && box?.boxKey) {
        onRefresh?.();
      }
    }, [visible, box?.boxKey, onRefresh]),
  );

  React.useEffect(() => {
    if (!visible) return;
    const sortedCount = sortedPlantsList.length;
    if (sortedCount > prevSortedCountRef.current) {
      setPlantTab('sorted');
    }
    prevSortedCountRef.current = sortedCount;
  }, [visible, sortedPlantsList.length]);

  const statusTint = metrics.isComplete
    ? SORTING_BOX_COLOR_COMPLETE
    : SORTING_BOX_COLOR_INCOMPLETE;

  const sharedTrayNumber = useMemo(
    () =>
      getSharedSortingTrayNumber(boxPlants) ||
      (box?.boxNumber ? String(box.boxNumber) : '') ||
      (box?.sortingTrayNumber ? String(box.sortingTrayNumber) : ''),
    [boxPlants, box?.boxNumber, box?.sortingTrayNumber],
  );

  const openScan = useCallback(() => {
    if (!box?.boxKey) return;
    navigation.navigate(
      'LeafTrailScanQRAdminScreen',
      LEAF_TRAIL_SCAN_PARAMS.sortingBox(box),
    );
  }, [box, navigation]);

  const handleFinishYes = () => {
    setFinishPromptVisible(false);
    onClose();
  };

  if (!box) return null;

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={[styles.statusBanner, { backgroundColor: statusTint }]}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: metrics.isComplete ? '#2F8C4F' : '#E7522F' },
          ]}
        />
        <Text style={styles.statusBannerText}>
          {metrics.isComplete ? 'Box complete' : 'Sorting in progress'}
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIdentity}>
            <Text style={styles.heroName}>{box.receiverName}</Text>
            {box.username ? (
              <Text style={styles.heroUsername}>@{box.username}</Text>
            ) : null}
            {box.boxNumber ? (
              <Text style={styles.heroBoxTray}>
                Box {box.boxNumber} · Tray {sharedTrayNumber || box.boxNumber}
              </Text>
            ) : null}
          </View>
        </View>

        {box.joiners?.length > 0 ? (
          <View style={styles.joinersCard}>
            <Text style={styles.joinersLabel}>Joiners</Text>
            <Text style={styles.joinersValue}>{box.joiners.join(' · ')}</Text>
          </View>
        ) : null}

        <View style={styles.statsCard}>
          <SortingBoxPrintedSummary metrics={metrics} variant="detail" />
        </View>

        <TouchableOpacity style={styles.scanCta} onPress={openScan} activeOpacity={0.85}>
          <ScanQrIcon width={28} height={28} />
          <Text style={styles.scanCtaTitle}>Scan QR Code to Receive/Sort</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plants in this box</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plantTabsRow}>
        {BOX_PLANT_TABS.map((tab) => {
          const active = plantTab === tab.key;
          const count = (plantsByTab[tab.key] || []).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.plantTab, active && styles.plantTabActive]}
              onPress={() => setPlantTab(tab.key)}
              activeOpacity={0.85}>
              <Text style={[styles.plantTabText, active && styles.plantTabTextActive]}>
                {tab.label}
              </Text>
              <Text style={[styles.plantTabCount, active && styles.plantTabCountActive]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.tabSummary}>
        {activeTab.label} {visiblePlants.length}/{metrics.forReceivingCount}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      <View style={styles.modalRoot}>
        <LabelViewer />
        <LabelGeneratingOverlay />
        <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
          <View style={[styles.header, { paddingTop: getAdminHeaderTopPadding(insets) }]}>
            <TouchableOpacity
              style={styles.headerBack}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <BackIcon width={22} height={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Receiver box
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionIcon}
                onPress={handlePrintVisiblePlants}
                disabled={printLoading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Reprint QR labels for ${activeTab.label} plants`}>
                <PrintIcon width={22} height={22} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerActionIcon,
                  sharedTrayNumber && styles.headerActionIconActive,
                ]}
                onPress={() => setTraySheetVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  sharedTrayNumber
                    ? `Tray number ${sharedTrayNumber}. Tap to view.`
                    : 'View tray number'
                }>
                <TrayIcon width={26} height={26} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionIcon}
                onPress={openScan}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Scan QR Code to Receive/Sort">
                <ScanQrIcon width={32} height={32} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
          data={visiblePlants}
          keyExtractor={(item) => item.id}
          extraData={plantTab}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => {
            const forReceiving = isForReceivingPlant(item);
            const awaitingSort = isReceivedSeparatelyPlant(item) && !plantIsSorted(item);
            const together = isReceivedAndSortedTogether(item);
            let statusLabel = 'Sorted';
            let statusTone = 'done';
            let actionLabel = null;
            if (forReceiving) {
              statusLabel = 'Not Yet Received';
              statusTone = 'waiting';
              actionLabel = 'Receive & Sort';
            } else if (awaitingSort) {
              statusLabel = receivedSeparatelyLabel(item);
              statusTone = statusLabel === 'Needs to Stay' ? 'waiting' : 'done';
              actionLabel = 'Sort';
            } else if (together) {
              statusLabel = 'Received & Sorted';
            }
            return (
              <SortingPlantRow
                plant={item}
                boxNumber={box?.boxNumber}
                actionLabel={actionLabel}
                statusLabel={statusLabel}
                statusTone={statusTone}
                onOpenTagAs={openTagAs}
                onScan={openScan}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 88 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.emptyPlants}>
              <Text style={styles.emptyPlantsText}>{activeTab.empty}</Text>
            </View>
          }
          />

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => setFinishPromptVisible(true)}
              activeOpacity={0.85}>
              <Text style={styles.finishButtonText}>Finished scanning?</Text>
            </TouchableOpacity>
          </View>

          {finishPromptVisible ? (
            <View style={styles.finishOverlay} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.finishBackdrop}
                activeOpacity={1}
                onPress={() => setFinishPromptVisible(false)}
              />
              <View style={[styles.finishSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.finishHandle} />
                <Text style={styles.finishTitle}>Finished scanning?</Text>
                <Text style={styles.finishSubtitle}>
                  Review counts before leaving this box.
                </Text>
                <View style={styles.finishSummaryWrap}>
                  <SortingBoxPrintedSummary metrics={metrics} variant="card" />
                </View>
                <TouchableOpacity style={styles.finishYes} onPress={handleFinishYes}>
                  <Text style={styles.finishYesText}>Yes — exit box</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.finishNo}
                  onPress={() => setFinishPromptVisible(false)}>
                  <Text style={styles.finishNoText}>No — keep sorting</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </SafeAreaView>

        <SortingTrayAssignSheet
          embedded={Platform.OS === 'android'}
          readOnly
          visible={traySheetVisible}
          onClose={() => setTraySheetVisible(false)}
          plants={boxPlants}
          defaultTrayNumber={box?.boxNumber}
          onAssigned={onRefresh}
        />
        <TagAsOptions
          embedded={Platform.OS === 'android'}
          visible={isTagAsVisible}
          setTagAs={setTagAs}
          isMissing={tagFlags.isMissing}
          isDamaged={tagFlags.isDamaged}
          isNeedsToStay={tagFlags.isNeedsToStay}
          isOthers={tagFlags.isOthers}
          forShipping={tagFlags.forShipping}
          onClose={closeTagAs}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE3E5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#E3E7E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#202325',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionIcon: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  headerActionIconActive: {
    backgroundColor: '#EAF7EF',
    borderWidth: 1,
    borderColor: '#B8DFC4',
  },
  listHeader: {
    paddingBottom: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38423D',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECEA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  heroTop: {
    marginBottom: 12,
  },
  heroIdentity: {
    gap: 4,
  },
  boxBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#202325',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  boxBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202325',
    lineHeight: 28,
  },
  heroUsername: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7F8D91',
  },
  heroBoxTray: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#2F8C4F',
  },
  joinersCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#539461',
  },
  joinersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#647276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  joinersValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#38423D',
    fontWeight: '500',
  },
  statsCard: {
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEFEF',
    marginBottom: 16,
  },
  scanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#539461',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  scanCtaTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202325',
  },
  plantTabsRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tabSummary: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  plantTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E8ECEA',
  },
  plantTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  plantTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#647276',
  },
  plantTabTextActive: {
    color: '#202325',
  },
  plantTabCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#647276',
    backgroundColor: '#DDE3E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  plantTabCountActive: {
    color: '#1B7A43',
    backgroundColor: '#EAF7EF',
  },
  sectionBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#647276',
    backgroundColor: '#E8ECEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionBadgeWarn: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: { height: 10 },
  plantCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECEA',
    gap: 10,
    overflow: 'hidden',
  },
  boxChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#F4F6F7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  boxChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#556065',
  },
  plantImage: {
    width: 76,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#ECEFEF',
  },
  plantDetails: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  plantCode: {
    fontSize: 13,
    fontWeight: '500',
    color: '#647276',
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    lineHeight: 21,
  },
  plantMeta: {
    fontSize: 14,
    color: '#647276',
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#202325',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  plantRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 100,
    paddingTop: 2,
  },
  plantRightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillWaiting: { backgroundColor: '#FFF4D6' },
  statusPillDone: { backgroundColor: '#EAF7EF' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusPillTextWaiting: { color: '#8A6A12' },
  statusPillTextDone: { color: '#1B7A43' },
  scanStamp: {
    fontSize: 11,
    color: '#556065',
    textAlign: 'right',
  },
  scanBy: {
    fontSize: 11,
    color: '#7F8D91',
    textAlign: 'right',
  },
  rowScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1F8A4C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowScanButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPlants: {
    padding: 32,
    alignItems: 'center',
  },
  emptyPlantsText: {
    fontSize: 15,
    color: '#647276',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE3E5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  finishButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#539461',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#1B7A43',
    fontSize: 16,
    fontWeight: '700',
  },
  finishOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 110,
    elevation: 110,
  },
  finishBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  finishSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  finishHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CDD3D4',
    marginBottom: 16,
  },
  finishTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202325',
    textAlign: 'center',
  },
  finishSubtitle: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  finishSummaryWrap: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  finishYes: {
    backgroundColor: '#539461',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  finishYesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  finishNo: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  finishNoText: {
    color: '#647276',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SortingBoxDetail;
