import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '../../../../assets/admin-icons/back.svg';
import ScanQrIcon from '../../../../assets/admin-icons/qr.svg';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import { LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import {
  SORTING_BOX_COLOR_COMPLETE,
  SORTING_BOX_COLOR_INCOMPLETE,
  computeSortingBoxMetrics,
  isAwaitingSortPlant as plantAwaitingSort,
  isSortedPlant as plantIsSorted,
  sortPlantsForSortingBoxList,
  sortingPlantStatusLabel,
} from '../../../../utils/sortingBoxMetrics';
import SortingBoxPrintedSummary from './SortingBoxPrintedSummary';
import SortingTrayAssign from './SortingTrayAssign';

const SortingPlantRow = ({ plant, index }) => {
  const sorted = plantIsSorted(plant);
  const statusLabel = sortingPlantStatusLabel(plant);
  return (
    <View
      style={[
        styles.plantCard,
        sorted ? styles.plantCardDone : styles.plantCardPending,
      ]}>
      <View style={styles.plantIndexWrap}>
        <Text style={styles.plantIndex}>{index + 1}</Text>
      </View>
      <Image source={{ uri: plant.plantImage }} style={styles.plantImage} />
      <View style={styles.plantDetails}>
        <Text style={styles.plantCode}>{plant.plantCode}</Text>
        <Text style={styles.plantName} numberOfLines={2}>
          {plant.genus} {plant.species}
        </Text>
        <Text style={styles.plantMeta} numberOfLines={1}>
          {plant.variegation} · {plant.size}
        </Text>
        {plant.listingType ? (
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText}>{plant.listingType}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.plantRight}>
        <CountryFlagIcon code={plant.countryCode} width={28} height={18} />
        <View
          style={[
            styles.statusPill,
            sorted ? styles.statusPillDone : styles.statusPillPending,
          ]}>
          <Text
            style={[
              styles.statusPillText,
              sorted ? styles.statusPillTextDone : styles.statusPillTextPending,
            ]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
};

const BOX_PLANT_TABS = {
  awaiting: 'awaiting',
  sorted: 'sorted',
};

const SortingBoxDetail = ({ visible, box, navigation, onClose, onRefresh }) => {
  const insets = useSafeAreaInsets();
  const [finishPromptVisible, setFinishPromptVisible] = useState(false);
  const [plantTab, setPlantTab] = useState(BOX_PLANT_TABS.awaiting);

  const metrics = useMemo(
    () => computeSortingBoxMetrics(box?.plants || []),
    [box?.plants],
  );

  const alphabeticalPlants = useMemo(
    () => sortPlantsForSortingBoxList(box?.plants || []),
    [box?.plants],
  );

  const awaitingPlants = useMemo(
    () => alphabeticalPlants.filter(plantAwaitingSort),
    [alphabeticalPlants],
  );

  const sortedPlantsList = useMemo(
    () => alphabeticalPlants.filter(plantIsSorted),
    [alphabeticalPlants],
  );

  const visiblePlants =
    plantTab === BOX_PLANT_TABS.sorted ? sortedPlantsList : awaitingPlants;

  const prevSortedCountRef = React.useRef(0);

  React.useEffect(() => {
    if (visible && box?.boxKey) {
      setPlantTab(BOX_PLANT_TABS.awaiting);
      prevSortedCountRef.current = (box?.plants || []).filter(plantIsSorted).length;
    }
  }, [visible, box?.boxKey]);

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
      setPlantTab(BOX_PLANT_TABS.sorted);
    }
    prevSortedCountRef.current = sortedCount;
  }, [visible, sortedPlantsList.length]);

  const statusTint = metrics.isComplete
    ? SORTING_BOX_COLOR_COMPLETE
    : SORTING_BOX_COLOR_INCOMPLETE;

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
          <View style={styles.scanCtaTextWrap}>
            <Text style={styles.scanCtaTitle}>Scan to sort plants</Text>
            <Text style={styles.scanCtaSub}>
              Scan a plant QR — sorted plants move to the Sorted tab and count toward fulfill
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plants in this box</Text>
      </View>

      <View style={styles.plantTabsRow}>
        <TouchableOpacity
          style={[
            styles.plantTab,
            plantTab === BOX_PLANT_TABS.awaiting && styles.plantTabActive,
          ]}
          onPress={() => setPlantTab(BOX_PLANT_TABS.awaiting)}
          activeOpacity={0.85}>
          <Text
            style={[
              styles.plantTabText,
              plantTab === BOX_PLANT_TABS.awaiting && styles.plantTabTextActive,
            ]}>
            Awaiting to sort
          </Text>
          <Text
            style={[
              styles.plantTabCount,
              plantTab === BOX_PLANT_TABS.awaiting && styles.plantTabCountActive,
            ]}>
            {awaitingPlants.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.plantTab,
            plantTab === BOX_PLANT_TABS.sorted && styles.plantTabActive,
          ]}
          onPress={() => setPlantTab(BOX_PLANT_TABS.sorted)}
          activeOpacity={0.85}>
          <Text
            style={[
              styles.plantTabText,
              plantTab === BOX_PLANT_TABS.sorted && styles.plantTabTextActive,
            ]}>
            Sorted
          </Text>
          <Text
            style={[
              styles.plantTabCount,
              plantTab === BOX_PLANT_TABS.sorted && styles.plantTabCountActive,
            ]}>
            {sortedPlantsList.length}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.plantListHint}>
        {metrics.totalPlantsToFulfill} plant(s) to fulfill · Scanned sorted plants appear under
        Sorted, not Awaiting
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBack}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <BackIcon width={22} height={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Receiver box
          </Text>
          <TouchableOpacity
            style={styles.headerScanIcon}
            onPress={openScan}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ScanQrIcon width={32} height={32} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={visiblePlants}
          keyExtractor={(item) => item.id}
          extraData={plantTab}
          ListHeaderComponent={listHeader}
          renderItem={({ item, index }) => (
            <SortingPlantRow plant={item} index={index} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 200 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.emptyPlants}>
              <Text style={styles.emptyPlantsText}>
                {plantTab === BOX_PLANT_TABS.sorted
                  ? 'No sorted plants yet. Scan plants to sort them.'
                  : 'All plants in this box are sorted.'}
              </Text>
            </View>
          }
        />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <SortingTrayAssign
            plants={box?.plants || []}
            onAssigned={onRefresh}
            variant="footer"
          />
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => setFinishPromptVisible(true)}
            activeOpacity={0.85}>
            <Text style={styles.finishButtonText}>Finished scanning?</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent visible={finishPromptVisible} animationType="fade">
          <View style={styles.finishOverlay}>
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
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  headerScanIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  scanCtaTextWrap: { flex: 1 },
  scanCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanCtaSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
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
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#E8ECEA',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  plantListHint: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 17,
    color: '#647276',
  },
  plantTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
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
  plantCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
  },
  plantCardDone: {
    borderLeftWidth: 4,
    borderLeftColor: '#2F8C4F',
  },
  plantIndexWrap: {
    width: 24,
    paddingTop: 4,
  },
  plantIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A8B4B8',
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
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillPending: { backgroundColor: '#FFF3E0' },
  statusPillDone: { backgroundColor: '#EAF7EF' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusPillTextPending: { color: '#E65100' },
  statusPillTextDone: { color: '#1B7A43' },
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  finishBackdrop: {
    ...StyleSheet.absoluteFillObject,
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
