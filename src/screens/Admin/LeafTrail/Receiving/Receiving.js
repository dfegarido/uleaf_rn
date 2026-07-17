import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    Dimensions,
    View,
    ScrollView,
    PermissionsAndroid,
    Platform
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar, TabView } from 'react-native-tab-view';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import Options from '../../../../assets/admin-icons/options.svg';
import QuestionMarkIcon from '../../../../assets/admin-icons/question-mark.svg';
import ReceivedIcon from '../../../../assets/admin-icons/received.svg';
import CheckedBoxIcon from '../../../../assets/admin-icons/checked-box.svg';
import DownloadIcon from '../../../../assets/admin-icons/download.svg';
import PrintIcon from '../../../../assets/icons/greylight/printer.svg';
import FilterBar from '../../../../components/Admin/filter';
import LeafTrailLabelGeneratingOverlay from '../../../../components/Admin/LeafTrailLabelGeneratingOverlay';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled, isTrail1ForReceivingEnabled } from '../../../../config/featureFlags';
import {
    getAdminLeafTrailFilters,
    getAdminLeafTrailReceiving,
    updateLeafTrailStatus,
    updatePlantStatus,
    generateThermalLabels,
    emailThermalLabels,
    assignReceiverBoxes,
} from '../../../../components/Api/getAdminLeafTrail';
import OrderSummaryStatusSheet, {
    LEAF_TRAIL_STATUS_OPTIONS,
    buildReceivingPlantStatusOptions,
    formatLeafTrailStatusDisplayLabel,
    mapPlantStatusPickerToApi,
    receivingPlantStatusUsesLeafTrail,
} from '../../OrderSummary/OrderSummaryStatusSheet';
import { exportLeafTrailLinesToCsv } from '../../../../utils/leafTrailHubExport';
import ReceivingPlantCountHeader from './ReceivingPlantCountHeader';
import {
    useReceivingSelection,
    useSelectionCount,
    useSelectionListVersion,
} from './useReceivingSelection';

const LIST_SEP_10 = () => <View style={{ height: 10 }} />;
const LIST_SEP_6 = () => <View style={{ height: 6 }} />;

const FLATLIST_PERF_PROPS = {
    removeClippedSubviews: Platform.OS === 'android',
    initialNumToRender: 10,
    maxToRenderPerBatch: 8,
    windowSize: 8,
    updateCellsBatchingPeriod: 64,
};
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import TagAsOptions from './TagAs';
import CloseIcon from '../../../../assets/icons/white/x-regular.svg';
import BackIcon from '../../../../assets/admin-icons/back.svg';
import { parseAdminFlightDateTokenToIso } from '../../../../components/Admin/plantFlightFilter';
import ForReceivingPlantCard from './ForReceivingPlantCard';
import {
  formatPlantFlightDateForDisplay,
  getDateOrderedDatePart,
} from './receivingPlantFormatters';
import { useLeafTrailHubActions } from '../../../../hooks/useLeafTrailHubActions';
import {
    buildReceivingScanParams,
    LEAF_TRAIL_SCAN_PARAMS,
} from '../../../../utils/leafTrailScanNav';
import {
    saveThermalLabelsToGallery,
    shareThermalLabels,
} from '../../../../utils/thermalLabelExport';
import {
    buildReceiverBoxAssignments,
    filterReceiverBoxAssignmentsNeedingPersist,
    groupItemsIntoSortedReceiverBoxes,
    getReceiverBoxPlantStatusPill,
    getReceiverBoxPlantsFromReceivingResponse,
    mergeReceivingItemsForReceiverBoxes,
    receiverBoxAssignmentSignature,
} from './receiverBoxUtils';

/** getAdminFilters `statuses` query per Receiving tab (JSON string). */
const ADMIN_FILTER_STATUSES_BY_TAB = {
  forReceiving: '["forReceiving"]',
  inventoryForHub: '["received","needsToStay"]',
  received: '["forReceiving","received","sorted","needsToStay"]',
  missing: '["missing"]',
  damaged: '["damaged"]',
  needsToStay: '["needsToStay"]',
  others: '["others"]',
};

/** Seller / buyer / order-receiver lists match For Receiving on every Receiving sub-tab. */
const ADMIN_FILTER_STATUSES_FOR_SELLER_BUYER = '["forReceiving"]';

/** Tabs that show per-plant cards (select all, bulk status, print/export/scan). */
const TABS_WITH_PLANT_SELECTION = new Set(['forReceiving', 'inventoryForHub']);

/** Tabs whose ⋯ menu includes Change leaf trail / Change plant status sheets. */
const TABS_WITH_STATUS_ACTIONS = new Set([
    'forReceiving',
    'received',
    'inventoryForHub',
    'missing',
    'damaged',
    'needsToStay',
    'others',
]);

const RECEIVING_PLANT_STATUS_MENU_FLAGS = {
    isMissing: true,
    isDamaged: true,
    isNeedsToStay: true,
    isOthers: true,
};

const formatStatusLabel = (value) => {
    if (!value) return '';
    const raw = String(value).trim();
    const spaced = raw.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const normalizeReceivingLeafTrailStatus = (status) =>
    String(status || '').trim().toLowerCase().replace(/\s+/g, '');
const getReceivingListStatusPill = (type, item) => {
    if (type === 'missing') {
        return { label: 'Missing', variant: 'missing' };
    }
    if (type === 'damaged') {
        return { label: 'Damaged', variant: 'damaged' };
    }
    if (type === 'needsToStay') {
        return { label: 'Needs to Stay', variant: 'needsToStay' };
    }
    if (type === 'others') {
        return { label: 'Others', variant: 'others' };
    }
    if (type === 'forInventoryHub') {
        const status = normalizeReceivingLeafTrailStatus(item?.leafTrailStatus);
        if (status === 'needstostay') {
            return { label: 'Needs to Stay', variant: 'needsToStay' };
        }
        return { label: 'At Hub', variant: 'inventoryReceived' };
    }
    return { label: 'For Receiving', variant: 'forReceiving' };
};

const ReceivingListPlantCard = ({ item, type, openTagAs, showCheckbox, isSelected, selectionStore }) => {
    const pill = getReceivingListStatusPill(type, item);
    return (
        <ForReceivingPlantCard
            item={item}
            openTagAs={openTagAs}
            showCheckbox={showCheckbox}
            isSelected={isSelected}
            selectionStore={selectionStore}
            statusPillLabel={pill.label}
            statusPillVariant={pill.variant}
        />
    );
};

// A single card in the list
const PlantListItem = ({ item, type, openTagAs, showCheckbox, isSelected, onToggleSelect }) => {
      const [isImageModalVisible, setImageModalVisible] = useState(false);
      const pressInTimeout = useRef(null);
      const isLongPress = useRef(false);
    
        const handlePressIn = () => {
        // When the user presses down, start a timer.
        pressInTimeout.current = setTimeout(() => {
        // If the timer completes (user is holding), show the modal and flag it as a long press.
        setImageModalVisible(true);
        isLongPress.current = true;
        }, 200); // 200ms delay to distinguish from a tap.
    };

    const handlePressOut = () => {
        // When the user releases their finger...
        clearTimeout(pressInTimeout.current); // Always clear the timer.
        if (isLongPress.current) {
        // If it was a long press (peek), close the modal.
        setImageModalVisible(false);
        isLongPress.current = false; // Reset the flag.
        }
    };

    const handlePress = () => {
        // This only fires on a short tap because the long press is handled above.
        // Open the modal and let it stay open.
        setImageModalVisible(true);
    };

    const setTags = () => {
        openTagAs(null, item.id);
    };

    const dateOrderedDatePart = getDateOrderedDatePart(item);

    return (
    <View style={styles.listItemOuterContainer}>
        {type === 'missing' && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.missingStatusText}>Missing</Text>
            </View>
        )}
        {type === 'damaged' && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.missingStatusText}>Damaged</Text>
            </View>
        )}
        {type === 'needsToStay' && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.needsToStayStatusText}>Needs to Stay</Text>
            </View>
        )}
        {type === 'others' && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.othersStatusText}>Others</Text>
            </View>
        )}
        
        {(item?.sellerScanned && type === 'received') && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.scannedStatusText}>Seller Scanned</Text>
            </View>
        )}

        {(!(item?.sellerScanned) && type === 'received') && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.unscannedStatusText}>Seller Unscanned</Text>
            </View>
        )}
        <View style={styles.flightDetailsRow}>
             <AirplaneIcon width={20} height={20} color="#556065"/>
             <Text style={styles.flightDateText}>Plant Flight <Text style={{ fontWeight: 'bold' }}>{formatPlantFlightDateForDisplay(item.flightDate) || item.flightDate || '—'}</Text></Text>
        </View>
        {item.receivedDate && (
             <View style={styles.flightDetailsRow}>
                {/* Placeholder for received date icon */}
                <ReceivedIcon />
                <Text style={styles.flightDateText}>Date Received <Text style={{ fontWeight: 'bold' }}>{item.receivedDate}</Text></Text>
            </View>
        )}
        {type === 'received' && item.user && (
            <View style={styles.receivedUserDetails}>
                <Image source={{ uri: item.user.avatar }} style={styles.receivedUserAvatar} />
                <View>
                    <Text style={styles.receivedUserName}>{item.user.name} <Text style={styles.receivedUserHandle}>{item.user.username}</Text></Text>
                    <Text style={styles.receivedUserHandle}>Hub Receiver</Text>
                </View>
            </View>
        )}

        <Modal
            visible={isImageModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}
            presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
            statusBarTranslucent={Platform.OS === 'android'}
          >
            <View style={styles.fullScreenImageContainer}>
              <TouchableOpacity
                style={styles.fullScreenImageCloseButton}
                onPress={() => setImageModalVisible(false)}
              >
                <CloseIcon width={24} height={24} fill="#fff" />
              </TouchableOpacity>
              <ImageZoom
                cropWidth={Dimensions.get('window').width}
                cropHeight={Dimensions.get('window').height}
                imageWidth={Dimensions.get('window').width}
                imageHeight={Dimensions.get('window').height}
                minScale={0.5}
                maxScale={3}
                enableSwipeDown={true} // Allow swiping down to close
                onSwipeDown={() => setImageModalVisible(false)}
                onClick={() => setImageModalVisible(false)}>
                <Image
                  source={{ uri: item.plantImage || '' }}
                  style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
                  resizeMode="contain"
                />
              </ImageZoom>
            </View>
          </Modal>
        
        <View style={styles.cardContainer}>
             <View style={styles.plantImageColumn}>
             <View style={styles.plantImageWrap}>
             <TouchableOpacity
                  style={styles.plantImageTouchable}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                  activeOpacity={0.8}>
                    <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
            </TouchableOpacity>
            {showCheckbox ? (
                <TouchableOpacity
                    onPress={() => onToggleSelect(item.id)}
                    style={styles.imageCheckbox}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    activeOpacity={0.85}>
                    {isSelected ? (
                        <CheckedBoxIcon width={24} height={24} />
                    ) : (
                        <View style={styles.uncheckedBox} />
                    )}
                </TouchableOpacity>
            ) : null}
             </View>
            {!!dateOrderedDatePart && (
                <Text style={styles.dateOrderedCaption}>
                  Date Ordered: {dateOrderedDatePart}
                </Text>
            )}
             </View>
            <View style={styles.cardDetails}>
                <View>
                    <View style={styles.codeRow}>
                        <Text style={styles.plantCode}>{item.plantCode}</Text>
                        <QuestionMarkIcon />
                        <View style={{flex: 1}} />
                        <Text style={styles.countryText}>{item.country}</Text>
                        <CountryFlagIcon code={item.country} width={24} height={16} />
                        <TouchableOpacity onPress={setTags}>
                           <Options style={{paddingRight: 10}} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.plantGenus}>{item.genus} {item.species}</Text>
                    <Text style={styles.plantVariegation}>{item.variegation} • {item.size}</Text>
                </View>
                <View style={styles.typeRow}>
                    {(item.listingType && type === 'received') && <View style={styles.listingTypeChip}><Text style={styles.listingTypeText}>{item.listingType}</Text></View>}
                    {!(type === 'received') && <View style={{flex: 1}} />}
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                </View>
            </View>
        </View>
    </View>
)};


// --- TAB SCREENS ---

const ForReceivingTab = React.memo(function ForReceivingTab({
    data,
    onFilterChange,
    adminFilters,
    openTagAs,
    showCheckbox,
    selectionStore,
    trail1IntakeMode,
}) {
    const plantCount = data?.total ?? data?.data?.length ?? 0;
    const listData = useMemo(() => data?.data || [], [data?.data]);
    const listVersion = useSelectionListVersion(selectionStore);
    const selectedCount = useSelectionCount(selectionStore);
    const onClearSelection = useCallback(() => selectionStore.clear(), [selectionStore]);
    const onSelectAll = useCallback(() => {
        const ids = listData.map((item) => item.id).filter(Boolean);
        selectionStore.selectAll(ids);
    }, [listData, selectionStore]);
    const isAllSelected = plantCount > 0 && selectedCount === plantCount;

    const listHeaderPrefix = useMemo(
        () => (
            <>
                <FilterBar showScan={!trail1IntakeMode} onFilterChange={onFilterChange} adminFilters={adminFilters} />
                {showCheckbox ? (
                    <ReceivingPlantCountHeader
                        plantCount={plantCount}
                        isAllSelected={isAllSelected}
                        onSelectAll={onSelectAll}
                        selectedCount={selectedCount}
                        onClearSelection={onClearSelection}
                    />
                ) : (
                    <Text style={styles.countText}>{plantCount} plant(s)</Text>
                )}
            </>
        ),
        [
            trail1IntakeMode,
            onFilterChange,
            adminFilters,
            showCheckbox,
            plantCount,
            isAllSelected,
            onSelectAll,
            selectedCount,
            onClearSelection,
        ],
    );

    const keyExtractor = useCallback((item) => item.id, []);

    const renderItem = useCallback(
        ({ item }) => (
            <ForReceivingPlantCard
                openTagAs={openTagAs}
                item={item}
                showCheckbox={showCheckbox}
                isSelected={selectionStore.has(item.id)}
                selectionStore={selectionStore}
                compact={trail1IntakeMode}
            />
        ),
        [openTagAs, showCheckbox, selectionStore, trail1IntakeMode],
    );

    if (!listData.length) {
        return (
            <FlatList
                ListHeaderComponent={listHeaderPrefix}
                ItemSeparatorComponent={LIST_SEP_6}
                contentContainerStyle={styles.listContentContainer}
                ListFooterComponent={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#647276' }}>No For Receiving plants found.</Text>
                    </View>
                }
            />
        );
    }

    return (
        <FlatList
            data={listData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={listVersion}
            ListHeaderComponent={listHeaderPrefix}
            ItemSeparatorComponent={LIST_SEP_10}
            contentContainerStyle={styles.forReceivingListContent}
            {...FLATLIST_PERF_PROPS}
        />
    );
});

const ReceivedTab = ({
    receivingData,
    onFilterChange,
    adminFilters,
    openTagAs,
    onBoxDetailOpenChange,
    renderPlantActionOverlays,
    onPrintBoxPlants,
    printBusy = false,
}) => {
    const [activeBox, setActiveBox] = useState(null);

    const setBoxOpen = useCallback((box) => {
        setActiveBox(box);
        onBoxDetailOpenChange?.(Boolean(box));
    }, [onBoxDetailOpenChange]);

    const receiverBoxPlantItems = React.useMemo(
        () => getReceiverBoxPlantsFromReceivingResponse(receivingData || {}),
        [receivingData],
    );

    const receiverBoxes = React.useMemo(() => {
        const items = mergeReceivingItemsForReceiverBoxes(receiverBoxPlantItems);
        return groupItemsIntoSortedReceiverBoxes(items);
    }, [receiverBoxPlantItems]);

    // Sort buyers alphabetically by name for the Received tab only
    const sortedAdminFilters = React.useMemo(() => {
        if (!adminFilters) return adminFilters;
        
        const sortedBuyers = adminFilters.buyer 
            ? [...adminFilters.buyer].sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            })
            : adminFilters.buyer;
        
        return {
            ...adminFilters,
            buyer: sortedBuyers
        };
    }, [adminFilters]);
    
    const plantTotal =
        receivingData?.receiverBoxPlants?.total ??
        receiverBoxPlantItems.length ??
        receiverBoxes.reduce((sum, box) => sum + box.items.length, 0);

    const boxGridHeader = (
        <>
            <FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={sortedAdminFilters} />
            <View style={styles.receivedSummaryRow}>
                <Text style={styles.receivedSummaryPill}>{receiverBoxes.length} box(es)</Text>
                <Text style={styles.countText}>{plantTotal} plant(s)</Text>
            </View>
        </>
    );

    const boxDetailModal = (
        <Modal
            visible={!!activeBox}
            animationType="slide"
            transparent={false}
            presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
            statusBarTranslucent={Platform.OS === 'android'}
            onRequestClose={() => setBoxOpen(null)}>
            <View style={styles.receiverBoxModalRoot}>
                <SafeAreaView style={styles.receiverBoxModalContainer} edges={['top', 'bottom']}>
                    <View style={styles.receiverBoxModalHeader}>
                    <TouchableOpacity
                        style={styles.receiverBoxModalBack}
                        onPress={() => setBoxOpen(null)}>
                        <BackIcon width={22} height={22} />
                    </TouchableOpacity>
                    <View style={styles.receiverBoxModalTitleWrap}>
                        <Text style={styles.receiverBoxModalTitle} numberOfLines={1}>
                            {activeBox?.boxNumber
                                ? `Box ${activeBox.boxNumber} · ${activeBox.receiverName || 'Receiver'}`
                                : activeBox?.receiverName || 'Receiver Box'}
                        </Text>
                        {activeBox?.receiverUsername ? (
                            <Text style={styles.receiverBoxModalUsername} numberOfLines={1}>
                                @{activeBox.receiverUsername}
                            </Text>
                        ) : null}
                        <Text style={styles.receiverBoxModalMeta}>
                            {(activeBox?.items || []).length} plant(s) · Scanned {activeBox?.scannedCount || 0} · Unscanned {activeBox?.unscannedCount || 0}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.receiverBoxModalPrint}
                        onPress={() => {
                            const ids = (activeBox?.items || []).map((p) => p.id).filter(Boolean);
                            setBoxOpen(null);
                            onPrintBoxPlants?.(ids);
                        }}
                        disabled={printBusy || !(activeBox?.items || []).length}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Reprint QR labels for plants in this box">
                        <PrintIcon width={22} height={22} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    style={styles.receiverBoxModalList}
                    data={activeBox?.items || []}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const statusPill = getReceiverBoxPlantStatusPill(item);
                        return (
                            <ForReceivingPlantCard
                                item={item}
                                openTagAs={openTagAs}
                                compact={false}
                                statusPillLabel={statusPill.label}
                                statusPillVariant={statusPill.variant}
                            />
                        );
                    }}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    contentContainerStyle={styles.receiverBoxModalListContent}
                />
                </SafeAreaView>
                {/* Embedded sheets — avoid nested RN Modals on Android */}
                {typeof renderPlantActionOverlays === 'function'
                    ? renderPlantActionOverlays(true)
                    : null}
            </View>
        </Modal>
    );

    if (!receiverBoxes.length) {
        return (
            <>
                <FlatList
                    key="received-box-grid"
                    data={[]}
                    numColumns={2}
                    ListHeaderComponent={
                        <>
                            <FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={sortedAdminFilters} />
                            <Text style={styles.countText}>{plantTotal} plant(s)</Text>
                        </>
                    }
                    ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                    contentContainerStyle={styles.listContentContainer}
                    ListFooterComponent={
                         <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 16, color: '#647276'}}>No receiver boxes found.</Text>
                        </View>}
                />
            </>
        )
     }

    return (
        <>
            <FlatList
                key="received-box-grid"
                data={receiverBoxes}
                keyExtractor={(item) => `box-${item.boxNumber}-${item.receiverName}`}
                numColumns={2}
                columnWrapperStyle={styles.receiverBoxesRow}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.receiverBoxCard}
                        activeOpacity={0.85}
                        onPress={() => setBoxOpen(item)}>
                        <View style={styles.receiverBoxTopAccent} />
                        <View style={styles.receiverBoxNumberRow}>
                            <View style={styles.receiverBoxNumberBadge}>
                                <Text style={styles.receiverBoxNumberText}>{item.boxNumber}</Text>
                            </View>
                            <Text style={styles.receiverBoxSubtitle}>Receiver Box</Text>
                        </View>
                        <Text style={styles.receiverBoxTitle} numberOfLines={2}>
                            {item.receiverName}
                        </Text>
                        {item.receiverUsername ? (
                            <Text style={styles.receiverBoxUsername} numberOfLines={1}>
                                @{item.receiverUsername}
                            </Text>
                        ) : null}

                        <View style={styles.receiverBoxDivider} />

                        <Text style={styles.receiverBoxCount}>{item.items.length} plant(s)</Text>
                        <View style={styles.receiverBoxStatusRow}>
                            <View style={[styles.receiverBoxStatusChip, styles.receiverBoxScannedChip]}>
                                <Text style={[styles.receiverBoxStatusText, styles.receiverBoxScannedText]}>
                                    Scanned {item.scannedCount}
                                </Text>
                            </View>
                            <View style={[styles.receiverBoxStatusChip, styles.receiverBoxUnscannedChip]}>
                                <Text style={[styles.receiverBoxStatusText, styles.receiverBoxUnscannedText]}>
                                    Unscanned {item.unscannedCount}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.receiverBoxJoinersLabel}>Joiners</Text>
                        <Text style={styles.receiverBoxJoiners} numberOfLines={2}>
                            {item.joiners.length ? item.joiners.join(', ') : 'No joiners'}
                        </Text>
                        <Text style={styles.receiverBoxHint}>Tap to open box</Text>
                    </TouchableOpacity>
                )}
                ListHeaderComponent={boxGridHeader}
                contentContainerStyle={styles.listContentContainer}
            />
            {boxDetailModal}
        </>
    );
};

const ReceivingTabListHeader = ({
    onFilterChange,
    adminFilters,
    showLegacyScan,
    total,
}) => (
    <>
        <FilterBar showScan={showLegacyScan} onFilterChange={onFilterChange} adminFilters={adminFilters} />
        <Text style={styles.countText}>{total ?? 0} plant(s)</Text>
    </>
);

const InventoryForHubTab = React.memo(function InventoryForHubTab({
    data,
    onFilterChange,
    adminFilters,
    openTagAs,
    showCheckbox,
    selectionStore,
}) {
    const plantCount = data?.total ?? data?.data?.length ?? 0;
    const listData = useMemo(() => data?.data || [], [data?.data]);
    const listVersion = useSelectionListVersion(selectionStore);
    const selectedCount = useSelectionCount(selectionStore);
    const onClearSelection = useCallback(() => selectionStore.clear(), [selectionStore]);
    const onSelectAll = useCallback(() => {
        const ids = listData.map((item) => item.id).filter(Boolean);
        selectionStore.selectAll(ids);
    }, [listData, selectionStore]);
    const isAllSelected = plantCount > 0 && selectedCount === plantCount;

    const listHeaderPrefix = useMemo(
        () => (
            <>
                <FilterBar showScan onFilterChange={onFilterChange} adminFilters={adminFilters} />
                {showCheckbox ? (
                    <ReceivingPlantCountHeader
                        plantCount={plantCount}
                        isAllSelected={isAllSelected}
                        onSelectAll={onSelectAll}
                        selectedCount={selectedCount}
                        onClearSelection={onClearSelection}
                    />
                ) : (
                    <Text style={styles.countText}>{plantCount} plant(s)</Text>
                )}
            </>
        ),
        [
            onFilterChange,
            adminFilters,
            showCheckbox,
            plantCount,
            isAllSelected,
            onSelectAll,
            selectedCount,
            onClearSelection,
        ],
    );

    const keyExtractor = useCallback((item) => item.id, []);

    const renderItem = useCallback(
        ({ item }) => (
            <ReceivingListPlantCard
                openTagAs={openTagAs}
                item={item}
                type="forInventoryHub"
                showCheckbox={showCheckbox}
                isSelected={selectionStore.has(item.id)}
                selectionStore={selectionStore}
            />
        ),
        [openTagAs, showCheckbox, selectionStore],
    );

    if (!listData.length) {
        return (
            <FlatList
                ListHeaderComponent={listHeaderPrefix}
                ItemSeparatorComponent={LIST_SEP_6}
                contentContainerStyle={styles.forReceivingListContent}
                ListFooterComponent={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#647276' }}>No For Inventory Hub plants found.</Text>
                    </View>
                }
            />
        );
    }

    return (
        <FlatList
            data={listData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={listVersion}
            ListHeaderComponent={listHeaderPrefix}
            ItemSeparatorComponent={LIST_SEP_10}
            contentContainerStyle={styles.forReceivingListContent}
            {...FLATLIST_PERF_PROPS}
        />
    );
});

const MissingTab = ({data, onFilterChange, adminFilters, openTagAs, hubSpecEnabled}) => {
    
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={
                        <ReceivingTabListHeader
                            hubSpecEnabled={hubSpecEnabled}
                            onFilterChange={onFilterChange}
                            adminFilters={adminFilters}
                            total={data.total}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                    contentContainerStyle={styles.forReceivingListContent}
                    ListFooterComponent={<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 16, color: '#647276'}}>No Missing plants found.</Text>
                    </View>}
                />
            </>
        )
    }

    return (
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <ReceivingListPlantCard openTagAs={openTagAs} item={item} type="missing" />
        )}
        ListHeaderComponent={
            <ReceivingTabListHeader
                hubSpecEnabled={hubSpecEnabled}
                onFilterChange={onFilterChange}
                adminFilters={adminFilters}
                total={data.total}
            />
        }
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
        contentContainerStyle={styles.forReceivingListContent}
    />
)};

const DamagedTab = ({data, onFilterChange, adminFilters, openTagAs, hubSpecEnabled}) => {
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={
                        <ReceivingTabListHeader
                            hubSpecEnabled={hubSpecEnabled}
                            onFilterChange={onFilterChange}
                            adminFilters={adminFilters}
                            total={data.total}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                    contentContainerStyle={styles.forReceivingListContent}
                    ListFooterComponent={
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 16, color: '#647276'}}>No Damaged plants found.</Text>
                        </View>
                    }
                />
            </>
            
        )
     }

    return (
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <ReceivingListPlantCard openTagAs={openTagAs} item={item} type="damaged" />
        )}
        ListHeaderComponent={
            <ReceivingTabListHeader
                hubSpecEnabled={hubSpecEnabled}
                onFilterChange={onFilterChange}
                adminFilters={adminFilters}
                total={data.total}
            />
        }
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
        contentContainerStyle={styles.forReceivingListContent}
    />
)};

const OthersTab = ({ data, onFilterChange, adminFilters, openTagAs }) => {
    if (!(data?.data) || data.data.length === 0) {
        return (
            <FlatList
                ListHeaderComponent={
                    <ReceivingTabListHeader
                        onFilterChange={onFilterChange}
                        adminFilters={adminFilters}
                        total={data?.total}
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                contentContainerStyle={styles.forReceivingListContent}
                ListFooterComponent={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#647276' }}>No Others plants found.</Text>
                    </View>
                }
            />
        );
    }

    return (
        <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ReceivingListPlantCard openTagAs={openTagAs} item={item} type="others" />
            )}
            ListHeaderComponent={
                <ReceivingTabListHeader
                    onFilterChange={onFilterChange}
                    adminFilters={adminFilters}
                    total={data.total}
                />
            }
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={styles.forReceivingListContent}
        />
    );
};

const NeedsToStayTab = ({ data, onFilterChange, adminFilters, openTagAs }) => {
    if (!(data?.data) || data.data.length === 0) {
        return (
            <FlatList
                ListHeaderComponent={
                    <ReceivingTabListHeader
                        onFilterChange={onFilterChange}
                        adminFilters={adminFilters}
                        total={data?.total}
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                contentContainerStyle={styles.forReceivingListContent}
                ListFooterComponent={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#647276' }}>No Needs to Stay plants found.</Text>
                    </View>
                }
            />
        );
    }

    return (
        <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ReceivingListPlantCard openTagAs={openTagAs} item={item} type="needsToStay" />
            )}
            ListHeaderComponent={
                <ReceivingTabListHeader
                    onFilterChange={onFilterChange}
                    adminFilters={adminFilters}
                    total={data.total}
                />
            }
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={styles.forReceivingListContent}
        />
    );
};

const DEFAULT_RECEIVING_ROUTES = [
    { key: 'forReceiving', title: 'For Receiving' },
    { key: 'inventoryForHub', title: 'Inventory for Hub' },
    { key: 'received', title: 'Received' },
    { key: 'missing', title: 'Missing' },
    { key: 'damaged', title: 'Damaged' },
    { key: 'needsToStay', title: 'Needs to Stay' },
    { key: 'others', title: 'Others' },
];
const TRAIL1_RECEIVING_ROUTES = DEFAULT_RECEIVING_ROUTES;

const ReceivingLoadingOverlay = ({ message, contextLabel = 'Receiving', title = 'Fetching plant data' }) => (
    <View style={styles.loadingOverlay}>
        <View style={styles.loadingCard}>
            <View style={styles.loadingTopRow}>
                <View style={styles.loadingDot} />
                <Text style={styles.loadingTagText}>{contextLabel}</Text>
            </View>
            <View style={styles.loadingSpinnerWrap}>
                <ActivityIndicator size="large" color="#2F8C4F" />
            </View>
            <Text style={styles.loadingTitle}>{title}</Text>
            <Text style={styles.loadingMessage}>{message}</Text>
            <View style={styles.loadingProgressTrack}>
                <View style={styles.loadingProgressFill} />
            </View>
        </View>
    </View>
);

const ReceivingScreen = ({navigation, route}) => {
    const hubSpecEnabled = isLeafTrailHubSpecEnabled();
    const trail1IntakeMode = isTrail1ForReceivingEnabled();
    const [index, setIndex] = useState(0);
    const routes = useMemo(
        () => (trail1IntakeMode ? TRAIL1_RECEIVING_ROUTES : DEFAULT_RECEIVING_ROUTES),
        [trail1IntakeMode],
    );
    const [receivingData, setReceivingData] = useState(null);
    const [adminFilters, setAdminFilters] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Preparing For Receiving data...');
    const [error, setError] = useState(null);
    const [isTagAsVisible, setTagAsVisible] = useState(false);
    const [receiverBoxDetailOpen, setReceiverBoxDetailOpen] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const { store: selectionStore } = useReceivingSelection();
    const [leafSheetVisible, setLeafSheetVisible] = useState(false);
    const [plantSheetVisible, setPlantSheetVisible] = useState(false);
    const [plantStatusSheetOptions, setPlantStatusSheetOptions] = useState(
        () => buildReceivingPlantStatusOptions(),
    );
    const [exportBusy, setExportBusy] = useState(false);
    const [generatedLabels, setGeneratedLabels] = useState([]);
    const [showLabelViewer, setShowLabelViewer] = useState(false);
    const lastReceivingFiltersRef = useRef(undefined);
    const tabStatusesRef = useRef(ADMIN_FILTER_STATUSES_BY_TAB.forReceiving);
    const lastAssignedSignatureRef = useRef('');

    const openTagAs = (_status, id) => {
        setOrderId(id);
        setPlantStatusSheetOptions(buildReceivingPlantStatusOptions(RECEIVING_PLANT_STATUS_MENU_FLAGS));
        setTagAsVisible(true);
    };

    const openLeafTrailSheetFromCardMenu = () => {
        setLeafSheetVisible(true);
    };

    const openPlantSheetFromCardMenu = () => {
        setPlantSheetVisible(true);
    };

    const refreshAdminFilters = async (statuses, { withPageLoader = false } = {}) => {
        if (withPageLoader) {
            setIsLoading(true);
        }
        try {
            const adminFilter = await getAdminLeafTrailFilters(statuses, {
                sellerBuyerStatuses: ADMIN_FILTER_STATUSES_FOR_SELLER_BUYER,
            });
            setAdminFilters(adminFilter);
        } catch (e) {
            console.error('Failed to load admin filters:', e);
        } finally {
            if (withPageLoader) {
                setIsLoading(false);
            }
        }
    };

    const fetchData = async (filters) => {
            try {
                setIsLoading(true);
                if (filters !== undefined) {
                    lastReceivingFiltersRef.current = filters;
                }
                const effectiveFilters =
                    filters !== undefined
                        ? filters
                        : (lastReceivingFiltersRef.current ?? { sort: 'desc' });
                const response = await getAdminLeafTrailReceiving(effectiveFilters);

                setError(null);
                setReceivingData(response);
                await refreshAdminFilters(tabStatusesRef.current, { withPageLoader: false });

                const itemsForBoxes = mergeReceivingItemsForReceiverBoxes(
                    getReceiverBoxPlantsFromReceivingResponse(response),
                );
                const assignments = filterReceiverBoxAssignmentsNeedingPersist(
                    itemsForBoxes,
                    buildReceiverBoxAssignments(itemsForBoxes),
                );
                const assignmentSignature = receiverBoxAssignmentSignature(assignments);
                if (assignmentSignature && assignmentSignature !== lastAssignedSignatureRef.current) {
                    assignReceiverBoxes(assignments)
                        .then(() => {
                            lastAssignedSignatureRef.current = assignmentSignature;
                        })
                        .catch((assignError) => {
                            console.error('Failed to auto-assign receiver boxes:', assignError);
                        });
                }
                
            } catch (e) {
                setIsLoading(false);
                setError(e);
                console.error("Failed to fetch plant data:", e);
                Alert.alert(
                    'Receiving of Plants',
                    e?.message ||
                        'Could not load receiving plants. Check API connectivity and admin login.',
                );
            } finally {
                setIsLoading(false);
            }
    };

    const activeTabKey = routes[index]?.key || 'forReceiving';
    const supportsPlantSelection = TABS_WITH_PLANT_SELECTION.has(activeTabKey);
    const supportsStatusActions = TABS_WITH_STATUS_ACTIONS.has(activeTabKey);
    const showPlantCheckboxes = supportsPlantSelection;

    const handleReceiverBoxDetailOpenChange = useCallback((open) => {
        setReceiverBoxDetailOpen(open);
        if (!open) {
            setTagAsVisible(false);
            setLeafSheetVisible(false);
            setPlantSheetVisible(false);
        }
    }, []);

    const openLeafTrailScan = useCallback(() => {
        const baseParams = trail1IntakeMode
            ? LEAF_TRAIL_SCAN_PARAMS.receivingIntake
            : LEAF_TRAIL_SCAN_PARAMS.receiving;
        navigation.navigate(
            'LeafTrailScanQRAdminScreen',
            buildReceivingScanParams(activeTabKey, baseParams),
        );
    }, [navigation, trail1IntakeMode, activeTabKey]);

    const handleScanPress = useCallback(() => {
        const selectedIds = selectionStore.toArray();
        if (supportsPlantSelection && selectedIds.length > 0) {
            const baseParams = trail1IntakeMode
                ? LEAF_TRAIL_SCAN_PARAMS.receivingIntake
                : LEAF_TRAIL_SCAN_PARAMS.receiving;
            navigation.navigate(
                'LeafTrailScanQRAdminScreen',
                buildReceivingScanParams(activeTabKey, {
                    ...baseParams,
                    preselectedOrderIds: selectedIds,
                }),
            );
            return;
        }
        if (supportsPlantSelection && !selectedIds.length) {
            Alert.alert('No selection', 'Select at least one plant, or use Scan QR to scan without a selection.');
        }
        openLeafTrailScan();
    }, [supportsPlantSelection, selectionStore, trail1IntakeMode, navigation, openLeafTrailScan, activeTabKey]);

    const onFilterChange = (filters) => {
         fetchData(filters);
    }

    const adminFiltersForActiveTab = React.useMemo(() => {
        if (!adminFilters) {
            return adminFilters;
        }
        const isoSet = new Set();
        const addFlightDateToken = (token) => {
            const iso = parseAdminFlightDateTokenToIso(token);
            if (iso) {
                isoSet.add(iso);
            }
        };
        (adminFilters.flightDates || []).forEach(addFlightDateToken);
        (adminFilters.flightDateIsos || []).forEach((iso) => {
            if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
                isoSet.add(iso);
            }
        });
        const tabKey = routes[index]?.key;
        const tabItems = tabKey && receivingData?.[tabKey]?.data ? receivingData[tabKey].data : [];
        tabItems.forEach((item) => {
            addFlightDateToken(item?.flightDate);
            addFlightDateToken(item?.flightDateFormatted);
        });
        const mergedFlightDateIsos = [...isoSet].sort((a, b) => b.localeCompare(a));
        return {
            ...adminFilters,
            flightDateIsos: mergedFlightDateIsos,
            flightDates: adminFilters.flightDates || [],
        };
    }, [adminFilters, receivingData, index, routes]);

    const getCurrentTabData = useCallback(() => {
        switch (routes[index].key) {
            case 'forReceiving':
                return receivingData?.forReceiving || {};
            case 'inventoryForHub':
                return receivingData?.inventoryForHub || {};
            case 'received':
                return receivingData?.receiverBoxPlants || { total: 0, data: [] };
            case 'missing':
                return receivingData?.missing || {};
            case 'damaged':
                return receivingData?.damaged || {};
            case 'needsToStay':
                return receivingData?.needsToStay || {};
            case 'others':
                return receivingData?.others || {};
            default:
                return {};
        }
    }, [receivingData, index, routes]);

    const clearSelectedItems = useCallback(() => {
        selectionStore.clear();
    }, [selectionStore]);

    const renderTabBar = props => (
        <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor="#202325"
            inactiveColor="#647276"
            scrollEnabled={true}
        />
    );

    const tabChange = async (newIndex) => {
        const tabKey = routes[newIndex]?.key || 'forReceiving';
        const statuses =
            ADMIN_FILTER_STATUSES_BY_TAB[tabKey] || ADMIN_FILTER_STATUSES_BY_TAB.forReceiving;
        tabStatusesRef.current = statuses;
        await refreshAdminFilters(statuses, { withPageLoader: true });
    }

    const switchToTabByKey = useCallback((tabKey) => {
        const tabIndex = routes.findIndex((r) => r.key === tabKey);
        if (tabIndex >= 0) {
            setIndex(tabIndex);
            tabChange(tabIndex);
            clearSelectedItems();
        }
    }, [routes, clearSelectedItems]);

    useFocusEffect(
        useCallback(() => {
            const advanceToTab = route.params?.advanceToTab;
            if (advanceToTab) {
                switchToTabByKey(advanceToTab);
                navigation.setParams({ advanceToTab: undefined });
            }
            fetchData();
        }, [route.params?.advanceToTab, switchToTabByKey, navigation]),
    );

    const runThermalPrint = async (ids) => {
        if (!ids.length) {
            Alert.alert('No selection', 'Select at least one plant to print labels for.');
            return;
        }
        try {
            setLoadingMessage('Generating your labels, please wait...');
            setIsLoading(true);
            const response = await generateThermalLabels(ids);
            if (response.success && response.labels) {
                setGeneratedLabels(response.labels);
                setShowLabelViewer(true);
                selectionStore.clear();
            } else {
                Alert.alert('Error', response.message || 'Failed to generate thermal labels');
            }
        } catch (error) {
            console.error('Error generating thermal labels:', error);
            Alert.alert('Error', error.message || 'Failed to generate thermal labels');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = async () => {
        if (supportsPlantSelection) {
            await runThermalPrint(selectionStore.toArray());
            return;
        }
        if (activeTabKey === 'received') {
            const plants = getReceiverBoxPlantsFromReceivingResponse(receivingData || {});
            const ids = plants.map((p) => p.id).filter(Boolean);
            if (!ids.length) {
                Alert.alert('Nothing to print', 'No received plants to print labels for.');
                return;
            }
            await runThermalPrint(ids);
        }
    };

    const handlePrintReceivedBox = async (ids) => {
        if (!ids?.length) {
            Alert.alert('Nothing to print', 'No plants in this box to print labels for.');
            return;
        }
        await runThermalPrint(ids);
    };

    const handleExportSelected = async () => {
        const allLines = getCurrentTabData()?.data || [];
        const selectedSet = new Set(selectionStore.toArray());
        const lines = supportsPlantSelection
            ? allLines.filter((row) => selectedSet.has(row.id))
            : allLines;
        if (!lines.length) {
            Alert.alert(
                'Nothing to export',
                supportsPlantSelection
                    ? 'Select at least one plant to export.'
                    : 'No plants on this tab to export.',
            );
            return;
        }
        try {
            setExportBusy(true);
            const result = await exportLeafTrailLinesToCsv(lines, { stageLabel: activeTabKey });
            if (result?.success) {
                Alert.alert('Export', `Shared CSV for ${result.count} plant line(s).`);
            }
        } catch (e) {
            if (e?.message !== 'User did not share') {
                Alert.alert('Export failed', e?.message || 'Could not export data.');
            }
        } finally {
            setExportBusy(false);
        }
    };

    const applyLeafTrailForCard = async (status) => {
        if (!orderId) {
            Alert.alert('Error', 'Order ID is missing.');
            return;
        }
        setLoadingMessage('Updating leaf trail status...');
        setIsLoading(true);
        try {
            const response = await updateLeafTrailStatus(orderId, status);
            if (response?.success) {
                await fetchData();
                Alert.alert('Success', 'Leaf trail status updated.');
            } else {
                Alert.alert('Error', response?.message || 'Failed to update status.');
            }
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to update status.');
        } finally {
            setIsLoading(false);
        }
    };

    const applyPlantStatusForCard = async (status) => {
        if (!orderId) {
            Alert.alert('Error', 'Order ID is missing.');
            return;
        }
        setLoadingMessage('Updating plant status...');
        setIsLoading(true);
        try {
            const response = await updatePlantStatus(orderId, mapPlantStatusPickerToApi(status));
            if (response?.success) {
                await fetchData();
                Alert.alert('Success', 'Plant status updated.');
            } else {
                Alert.alert('Error', response?.message || 'Failed to update plant status.');
            }
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to update plant status.');
        } finally {
            setIsLoading(false);
        }
    };

    const onLeafTrailStatusSelect = (value) => {
        setLeafSheetVisible(false);
        if (String(value).toLowerCase() === 'delivered') {
            Alert.alert(
                'Delivered status',
                'Delivered requires tracking details per order. Use Order Summary for delivery details.',
            );
            return;
        }
        Alert.alert(
            'Update leaf trail status',
            `Set this plant to "${formatLeafTrailStatusDisplayLabel(value)}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Update', onPress: () => applyLeafTrailForCard(value) },
            ],
        );
    };

    const onPlantStatusSelect = (value) => {
        setPlantSheetVisible(false);
        const option = plantStatusSheetOptions.find((o) => o.value === value);
        const label = option?.label || formatStatusLabel(value);
        const useLeafTrail = receivingPlantStatusUsesLeafTrail(value, plantStatusSheetOptions);
        Alert.alert(
            'Update plant status',
            `Set this plant to "${label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: () =>
                        useLeafTrail
                            ? applyLeafTrailForCard(value)
                            : applyPlantStatusForCard(value),
                },
            ],
        );
    };

    const renderPlantActionOverlays = useCallback(
        (embedded = false) => (
            <>
                <OrderSummaryStatusSheet
                    visible={leafSheetVisible}
                    title="Change leaf trail status"
                    options={LEAF_TRAIL_STATUS_OPTIONS}
                    onClose={() => setLeafSheetVisible(false)}
                    onSelect={onLeafTrailStatusSelect}
                    embedded={embedded}
                />
                <OrderSummaryStatusSheet
                    visible={plantSheetVisible}
                    title="Change plant status"
                    options={plantStatusSheetOptions}
                    onClose={() => setPlantSheetVisible(false)}
                    onSelect={onPlantStatusSelect}
                    embedded={embedded}
                />
                <TagAsOptions
                    visible={isTagAsVisible}
                    showStatusActions={supportsStatusActions}
                    onLeafTrailStatusPress={openLeafTrailSheetFromCardMenu}
                    onPlantStatusPress={openPlantSheetFromCardMenu}
                    onClose={() => setTagAsVisible(false)}
                    embedded={embedded}
                />
            </>
        ),
        [
            leafSheetVisible,
            plantSheetVisible,
            plantStatusSheetOptions,
            isTagAsVisible,
            supportsStatusActions,
            onLeafTrailStatusSelect,
            onPlantStatusSelect,
            openLeafTrailSheetFromCardMenu,
            openPlantSheetFromCardMenu,
        ],
    );

    const renderScene = useCallback(({ route }) => {
        switch (route.key) {
            case 'forReceiving':
                return <ForReceivingTab 
                    openTagAs={openTagAs} 
                    onFilterChange={onFilterChange} 
                    data={receivingData?.forReceiving || {}} 
                    adminFilters={adminFiltersForActiveTab}
                    showCheckbox={showPlantCheckboxes}
                    selectionStore={selectionStore}
                    trail1IntakeMode={trail1IntakeMode}
                />;
            case 'inventoryForHub':
                return <InventoryForHubTab 
                    openTagAs={openTagAs} 
                    onFilterChange={onFilterChange} 
                    data={receivingData?.inventoryForHub || {}} 
                    adminFilters={adminFiltersForActiveTab}
                    showCheckbox={showPlantCheckboxes}
                    selectionStore={selectionStore}
                />;
            case 'received':
                return (
                    <ReceivedTab
                        openTagAs={openTagAs}
                        onFilterChange={onFilterChange}
                        receivingData={receivingData}
                        adminFilters={adminFiltersForActiveTab}
                        onBoxDetailOpenChange={handleReceiverBoxDetailOpenChange}
                        renderPlantActionOverlays={renderPlantActionOverlays}
                        onPrintBoxPlants={handlePrintReceivedBox}
                        printBusy={isLoading}
                    />
                );
            case 'missing':
                return (
                    <MissingTab
                        openTagAs={openTagAs}
                        onFilterChange={onFilterChange}
                        data={receivingData?.missing || {}}
                        adminFilters={adminFiltersForActiveTab}
                        hubSpecEnabled={hubSpecEnabled}
                    />
                );
            case 'damaged':
                return (
                    <DamagedTab
                        openTagAs={openTagAs}
                        onFilterChange={onFilterChange}
                        data={receivingData?.damaged || {}}
                        adminFilters={adminFiltersForActiveTab}
                        hubSpecEnabled={hubSpecEnabled}
                    />
                );
            case 'needsToStay':
                return (
                    <NeedsToStayTab
                        openTagAs={openTagAs}
                        onFilterChange={onFilterChange}
                        data={receivingData?.needsToStay || {}}
                        adminFilters={adminFiltersForActiveTab}
                    />
                );
            case 'others':
                return (
                    <OthersTab
                        openTagAs={openTagAs}
                        onFilterChange={onFilterChange}
                        data={receivingData?.others || {}}
                        adminFilters={adminFiltersForActiveTab}
                    />
                );
            default:
                return null;
        }
    }, [
        openTagAs,
        onFilterChange,
        receivingData,
        adminFiltersForActiveTab,
        showPlantCheckboxes,
        selectionStore,
        trail1IntakeMode,
        hubSpecEnabled,
        handleReceiverBoxDetailOpenChange,
        renderPlantActionOverlays,
        handlePrintReceivedBox,
        isLoading,
    ]);

    const hubExportLines = getCurrentTabData()?.data || [];
    const activeLoadingContextLabel =
        activeTabKey === 'received' ? 'Received' : activeTabKey === 'forReceiving' ? 'For Receiving' : 'Receiving';
    const activeLoadingTitle =
        activeTabKey === 'received' ? 'Preparing receiver boxes' : 'Fetching incoming plants';
    const hubPrintOnHeader =
        hubSpecEnabled &&
        (activeTabKey === 'forReceiving' ||
            activeTabKey === 'received' ||
            (!trail1IntakeMode && activeTabKey === 'inventoryForHub'));
    const hubHeaderActions = useLeafTrailHubActions({
        exportLines: hubSpecEnabled ? hubExportLines : [],
        exportStageLabel: activeTabKey,
        onPrintPress: handlePrint,
        printDisabled: !hubPrintOnHeader,
        exportDisabled: !hubSpecEnabled,
        emptyPrintMessage:
            'Print is available on For Receiving, Inventory for Hub, and Received tabs.',
        emptyExportMessage: 'No plants to export on this tab. Try another tab or adjust filters.',
    });

    const downloadAllLabels = async () => {
        try {
            setLoadingMessage('Preparing your labels for download, please wait...');
            setIsLoading(true);
            const result = await shareThermalLabels(generatedLabels);
            if (result?.ok) {
                Alert.alert('Success', 'Labels shared. Save them to your preferred location.', [{ text: 'OK' }]);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to save labels. ' + (error?.message || ''));
        } finally {
            setIsLoading(false);
        }
    };

    const saveLabelsToGallery = async () => {
        try {
            setLoadingMessage('Saving labels to your gallery, please wait...');
            setIsLoading(true);
            await saveThermalLabelsToGallery(generatedLabels);
        } catch (error) {
            console.error('Gallery save error:', error);
            Alert.alert('Error', error.message || 'Failed to save labels to gallery.');
        } finally {
            setIsLoading(false);
        }
    };

    const sendViaEmail = async () => {
        try {
            setLoadingMessage('Sending your labels via email, please wait...');
            setIsLoading(true);
            // Get the order IDs from the generated labels
            const orderIds = generatedLabels.map(label => label.orderId);
            
            const response = await emailThermalLabels(orderIds);
            
            if (response.success) {
                Alert.alert('Success', `Thermal labels have been sent to your email (${response.details?.sentTo || 'your registered email'}).`);
                // Close the label viewer
                setShowLabelViewer(false);
            } else {
                Alert.alert('Error', response.message || 'Failed to send labels via email');
            }
        } catch (error) {
            console.error('Email error:', error);
            Alert.alert('Error', error.message || 'Failed to send labels via email');
        } finally {
            setIsLoading(false);
        }
    };

    const isLabelPrintLoading =
        isLoading &&
        !showLabelViewer &&
        /generating.*label|label.*generating/i.test(String(loadingMessage || ''));

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screenContainer} edges={['left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                {isLabelPrintLoading ? (
                    <LeafTrailLabelGeneratingOverlay
                        visible
                        message={loadingMessage}
                    />
                ) : (isLoading && !showLabelViewer) ? (
                        <Modal
                          transparent
                          visible
                          animationType="fade"
                          onRequestClose={() => {}}
                          statusBarTranslucent={Platform.OS === 'android'}
                          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}>
                          <ReceivingLoadingOverlay
                              message={loadingMessage}
                              contextLabel={activeLoadingContextLabel}
                              title={activeLoadingTitle}
                          />
                        </Modal>
                      ) : null}
                
                {/* Label Viewer Modal */}
                <Modal
                    visible={showLabelViewer}
                    animationType="slide"
                    transparent={false}
                >
                    <View style={styles.labelViewerContainer}>
                        <View style={styles.labelViewerHeader}>
                            <TouchableOpacity 
                                onPress={() => setShowLabelViewer(false)}
                                style={styles.backButton}
                            >
                                <BackIcon width={24} height={24} />
                            </TouchableOpacity>
                            <Text style={styles.labelViewerTitle}>
                                Generated Labels ({generatedLabels.length})
                            </Text>
                            <View style={styles.headerSpacer} />
                        </View>
                        
                        <View style={styles.printerControls}>
                            <TouchableOpacity 
                                style={[styles.galleryButton, isLoading && styles.buttonDisabled]}
                                onPress={saveLabelsToGallery}
                                disabled={isLoading}
                            >
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>
                                        Save to Gallery
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.downloadButton, isLoading && styles.buttonDisabled]}
                                onPress={downloadAllLabels}
                                disabled={isLoading}
                            >
                                <View style={styles.buttonContent}>
                                    <DownloadIcon width={20} height={20} />
                                    <Text style={styles.buttonText}>
                                        Share
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.emailButton, isLoading && styles.buttonDisabled]}
                                onPress={sendViaEmail}
                                disabled={isLoading}
                            >
                                <View style={styles.buttonContent}>
                                    <Text style={styles.emailButtonText}>
                                        Send via Email
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={generatedLabels}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={2}
                            contentContainerStyle={styles.labelGridContainer}
                            renderItem={({ item, index }) => (
                                <View style={styles.labelPreview}>
                                    <Text style={styles.labelInfo}>
                                        {item.plantCode || `Label ${index + 1}`}
                                    </Text>
                                    <Image
                                        source={{ uri: `data:image/png;base64,${item.base64}` }}
                                        style={styles.labelImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                        />
                        
                        {/* Loading Modal - inside Label Viewer */}
                        {isLoading && (
                            <ReceivingLoadingOverlay
                                message={loadingMessage}
                                contextLabel={activeLoadingContextLabel}
                                title={activeLoadingTitle}
                            />
                        )}
                    </View>
                </Modal>
                <ScreenHeader 
                    navigation={navigation} 
                    printButton={
                        hubSpecEnabled
                            ? true
                            : !trail1IntakeMode &&
                              (activeTabKey === 'forReceiving' ||
                                  activeTabKey === 'inventoryForHub' ||
                                  activeTabKey === 'received')
                    }
                    onPrint={hubSpecEnabled ? hubHeaderActions.onPrint : handlePrint}
                    downloadCsv={!!hubSpecEnabled}
                    onDownloadCsv={handleExportSelected}
                    downloadLoading={exportBusy}
                    scarQr={
                        hubSpecEnabled ||
                        (!trail1IntakeMode && (index === 0 || index === 1))
                    }
                    onScanPress={hubSpecEnabled ? handleScanPress : handleScanPress}
                    scanQrParams={hubSpecEnabled ? undefined : LEAF_TRAIL_SCAN_PARAMS.receiving}
                    title="Receiving of Plants"
                />
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={(newIndex) => {
                        setIndex(newIndex);
                        tabChange(newIndex);
                        clearSelectedItems();
                    }}
                    renderTabBar={routes.length > 1 ? renderTabBar : () => null}
                />

            </SafeAreaView>

            {!receiverBoxDetailOpen ? renderPlantActionOverlays(false) : null}
        </SafeAreaProvider>
    );
}

export default ReceivingScreen;

// --- STYLES ---
const styles = StyleSheet.create({
    fullScreenImageContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    fullScreenImageCloseButton: {
        position: 'absolute',
        top: 50, // Using a value that works well with safe areas
        right: 20,
        zIndex: 10, // Increased zIndex to ensure it's on top
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 20, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    loadingCard: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 22,
        paddingHorizontal: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDEDE2',
        shadowColor: '#0F1D15',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 9,
    },
    loadingTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
        backgroundColor: '#EAF7EF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2F8C4F',
    },
    loadingTagText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F6F3D',
        letterSpacing: 0.2,
    },
    loadingSpinnerWrap: {
        marginTop: 6,
        marginBottom: 8,
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F3FBF6',
        borderWidth: 1,
        borderColor: '#DCEFE3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingTitle: {
        marginTop: 4,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E2A22',
        textAlign: 'center',
    },
    loadingMessage: {
        marginTop: 7,
        fontSize: 13,
        lineHeight: 19,
        color: '#5E6A62',
        textAlign: 'center',
    },
    loadingProgressTrack: {
        marginTop: 14,
        width: '100%',
        height: 6,
        borderRadius: 999,
        backgroundColor: '#EAF3ED',
        overflow: 'hidden',
    },
    loadingProgressFill: {
        width: '68%',
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#2F8C4F',
    },
    // Tab Bar
    tabBar: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        // borderBottomWidth: 1,
        borderColor: '#CDD3D4',
    },
    tabIndicator: {
        backgroundColor: '#202325',
        height: 3,
    },
    tabLabel: {
        zIndex: 1,
        fontSize: 16,
        textTransform: 'none',
    },
    // List
    listContentContainer: {
        paddingHorizontal: 15,
        paddingBottom: 40
    },
    forReceivingListContent: {
        paddingHorizontal: 12,
        paddingBottom: 40,
        paddingTop: 4,
    },
    countText: {
        textAlign: 'right',
        color: '#647276',
        fontSize: 14,
        paddingVertical: 8,
    },
    receivedSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receivedSummaryPill: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2F8C4F',
        backgroundColor: '#EAF7EF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    receiverBoxesRow: {
        gap: 10,
        marginBottom: 10,
        alignItems: 'stretch',
    },
    receiverBoxCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DFEAE2',
        padding: 12,
        minHeight: 190,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 7,
        elevation: 3,
        overflow: 'hidden',
    },
    receiverBoxTopAccent: {
        height: 4,
        borderRadius: 999,
        backgroundColor: '#2F8C4F',
        marginBottom: 8,
    },
    receiverBoxNumberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    receiverBoxNumberBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2F8C4F',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    receiverBoxNumberText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    receiverBoxTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2A23',
    },
    receiverBoxUsername: {
        marginTop: 2,
        fontSize: 13,
        fontWeight: '600',
        color: '#647276',
    },
    receiverBoxSubtitle: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '600',
        color: '#7A8680',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    receiverBoxDivider: {
        height: 1,
        backgroundColor: '#ECF0EE',
        marginVertical: 8,
    },
    receiverBoxCount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#202325',
    },
    receiverBoxStatusRow: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    receiverBoxStatusChip: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    receiverBoxScannedChip: {
        backgroundColor: '#EAF8EE',
    },
    receiverBoxUnscannedChip: {
        backgroundColor: '#FDECEA',
    },
    receiverBoxStatusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    receiverBoxScannedText: {
        color: '#1F7A45',
    },
    receiverBoxUnscannedText: {
        color: '#B2422E',
    },
    receiverBoxJoinersLabel: {
        marginTop: 10,
        fontSize: 11,
        fontWeight: '700',
        color: '#5E6A62',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    receiverBoxJoiners: {
        marginTop: 2,
        fontSize: 12,
        color: '#38423D',
        lineHeight: 18,
        minHeight: 36,
    },
    receiverBoxHint: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: '600',
        color: '#2F8C4F',
    },
    receiverBoxModalRoot: {
        flex: 1,
        backgroundColor: '#F5F7F8',
    },
    receiverBoxModalContainer: {
        flex: 1,
        backgroundColor: '#F5F7F8',
    },
    receiverBoxModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E3E9E5',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    receiverBoxModalBack: {
        width: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    receiverBoxModalTitleWrap: {
        flex: 1,
        marginLeft: 6,
    },
    receiverBoxModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2A23',
    },
    receiverBoxModalUsername: {
        marginTop: 2,
        fontSize: 13,
        fontWeight: '600',
        color: '#647276',
    },
    receiverBoxModalMeta: {
        marginTop: 2,
        fontSize: 12,
        color: '#5E6A62',
    },
    receiverBoxModalPrint: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F5F6F6',
        borderWidth: 1,
        borderColor: '#E3E7E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    receiverBoxModalList: {
        flex: 1,
    },
    receiverBoxModalListContent: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        paddingBottom: 30,
    },
    // List Item
    listItemOuterContainer: {
        backgroundColor: '#F5F6F6',
        padding: 12,
        borderRadius: 0, // No border radius as per design
        gap: 12,
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        gap: 12,
        overflow: 'hidden',
    },
    checkboxButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 8,
    },
    uncheckedBox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#CDD3D4',
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
    },
    plantImage: {
        width: 96,
        height: 128,
        borderRadius: 8,
    },
    plantImageColumn: {
        width: 96,
        flexShrink: 0,
        alignItems: 'center',
    },
    plantImageWrap: {
        position: 'relative',
        alignSelf: 'center',
    },
    imageCheckbox: {
        position: 'absolute',
        top: 4,
        left: 4,
        zIndex: 2,
    },
    plantImageTouchable: {
        alignSelf: 'center',
    },
    dateOrderedCaption: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 17,
        color: '#2F3436',
        fontWeight: '400',
        textAlign: 'center',
        width: '100%',
    },
    cardDetails: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'space-between',
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // gap: 6,
    },
    plantCode: {
        flexShrink: 1,
        fontSize: 14,
        color: '#647276',
    },
    countryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#556065',
    },
    plantGenus: {
        fontSize: 16,
        fontWeight: '700',
        color: '#202325',
        marginTop: 4,
    },
    plantVariegation: {
        fontSize: 16,
        color: '#647276',
    },
    typeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listingTypeChip: {
        backgroundColor: '#202325',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    listingTypeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#393D40',
    },
    flightDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        gap: 6,
    },
    flightDateText: {
        fontSize: 16,
        color: '#556065',
    },
    // Specific styles for Received Tab
    receivedUserDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 6,
    },
    receivedUserAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#539461',
    },
    receivedUserName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202325',
    },
    receivedUserHandle: {
        fontSize: 14,
        color: '#647276',
    },
    // Specific styles for Missing Tab
    missingStatusContainer: {
        paddingHorizontal: 6,
    },
    missingStatusText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E7522F',
    },
    needsToStayStatusText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#B7791F',
    },
    othersStatusText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#647276',
    },
    scannedStatusText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#539461',
    },
    unscannedStatusText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E7522F',
    },
    // Label Viewer Modal Styles
    labelViewerContainer: {
        flex: 1,
        backgroundColor: '#F5F7F8',
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
    },
    labelViewerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9EB',
    },
    labelViewerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#202325',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 8,
        width: 40,
    },
    headerSpacer: {
        width: 40,
    },
    closeButton: {
        padding: 8,
    },
    printerControls: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9EB',
    },
    galleryButton: {
        flexGrow: 1,
        flexBasis: '30%',
        backgroundColor: '#539461',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadButton: {
        flexGrow: 1,
        flexBasis: '30%',
        backgroundColor: '#4A90E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emailButton: {
        flexGrow: 1,
        flexBasis: '30%',
        backgroundColor: '#23C16B',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    emailButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    labelGridContainer: {
        padding: 12,
    },
    labelPreview: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        margin: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    labelInfo: {
        fontSize: 12,
        fontWeight: '600',
        color: '#202325',
        marginBottom: 8,
        textAlign: 'center',
    },
    labelImage: {
        width: 120,
        height: 200,
        borderWidth: 1,
        borderColor: '#E5E9EB',
    },
});