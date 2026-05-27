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
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import ImageZoom from 'react-native-image-pan-zoom';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar, TabView } from 'react-native-tab-view';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import Options from '../../../../assets/admin-icons/options.svg';
import QuestionMarkIcon from '../../../../assets/admin-icons/question-mark.svg';
import ReceivedIcon from '../../../../assets/admin-icons/received.svg';
import CheckedBoxIcon from '../../../../assets/admin-icons/checked-box.svg';
import DownloadIcon from '../../../../assets/admin-icons/download.svg';
import FilterBar from '../../../../components/Admin/filter';
import LeafTrailHubToolbar from '../../../../components/Admin/LeafTrailHubToolbar';
import ScreenHeader from '../../../../components/Admin/header';
import { isLeafTrailHubSpecEnabled, isTrail1ForReceivingEnabled } from '../../../../config/featureFlags';
import { getAdminLeafTrailFilters, getAdminLeafTrailReceiving, updateLeafTrailStatus, generateThermalLabels, emailThermalLabels } from '../../../../components/Api/getAdminLeafTrail';
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
import { LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';

/** getAdminFilters `statuses` query per Receiving tab (JSON string). */
const ADMIN_FILTER_STATUSES_BY_TAB = {
  forReceiving: '["forReceiving"]',
  inventoryForHub: '["forReceiving"]',
  received: '["received"]',
  missing: '["missing"]',
  damaged: '["damaged"]',
};

/** Seller / buyer / order-receiver lists match For Receiving on every Receiving sub-tab. */
const ADMIN_FILTER_STATUSES_FOR_SELLER_BUYER = '["forReceiving"]';

// A single card in the list
const PlantListItem = ({ item, type, openTagAs, selectionMode, isSelected, onToggleSelect }) => {
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
        let status = {isMissing: true, isDamaged: true};
        if (item.leafTrailStatus === "missing") {
        status = {isDamaged: true, forShipping: true}
        } else if (item.leafTrailStatus === "damaged") {
        status = {isMissing: true, forShipping: true}
        }
        openTagAs(status, item.id)
    }

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
            transparent={true}
            onRequestClose={() => setImageModalVisible(false)}
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
             <TouchableOpacity
                  style={styles.plantImageTouchable}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                  activeOpacity={0.8}>
                    <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
            </TouchableOpacity>
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
                        {selectionMode ? (
                            <TouchableOpacity 
                                onPress={() => onToggleSelect(item.id)}
                                style={styles.checkboxButton}
                            >
                                {isSelected ? (
                                    <CheckedBoxIcon width={24} height={24} />
                                ) : (
                                    <View style={styles.uncheckedBox} />
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={setTags}>
                               <Options style={{paddingRight: 10}} />
                            </TouchableOpacity>
                        )}
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

const ForReceivingTab = ({
    data,
    onFilterChange,
    adminFilters,
    openTagAs,
    selectionMode,
    selectedItems,
    onToggleSelect,
    trail1IntakeMode,
    hubSpecEnabled,
}) => {
    const listHeaderPrefix = (
        <>
            {hubSpecEnabled ? (
                <LeafTrailHubToolbar
                    adminFilters={adminFilters}
                    onFilterChange={onFilterChange}
                    showReceiptStatus={!trail1IntakeMode}
                />
            ) : (
                <FilterBar showScan={!trail1IntakeMode} onFilterChange={onFilterChange} adminFilters={adminFilters} />
            )}
            <Text style={styles.countText}>{data?.total ?? 0} plant(s)</Text>
        </>
    );

    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={listHeaderPrefix}
                    ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                    contentContainerStyle={styles.listContentContainer}
                    ListFooterComponent={
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{fontSize: 16, color: '#647276'}}>No For Receiving plants found.</Text>
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
                    <ForReceivingPlantCard
                        openTagAs={openTagAs}
                        item={item}
                        selectionMode={selectionMode}
                        isSelected={(selectedItems || []).includes(item.id)}
                        onToggleSelect={onToggleSelect}
                        compact={trail1IntakeMode}
                    />
                )}
                ListHeaderComponent={listHeaderPrefix}
                ItemSeparatorComponent={() => <View style={{height: 10}} />}
                contentContainerStyle={styles.forReceivingListContent}
            />
)};

const ReceivedTab = ({
    data,
    onFilterChange,
    adminFilters,
    openTagAs,
    hubSpecEnabled,
}) => {
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
    
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={
                        <>
                            {hubSpecEnabled ? (
                                <LeafTrailHubToolbar
                                    adminFilters={sortedAdminFilters}
                                    onFilterChange={onFilterChange}
                                    showReceiptStatus
                                />
                            ) : (
                                <FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={sortedAdminFilters} />
                            )}
                            <Text style={styles.countText}>{data.total} plant(s)</Text>
                        </>
                    }
                    ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                    contentContainerStyle={styles.listContentContainer}
                    ListFooterComponent={
                         <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 16, color: '#647276'}}>No received plants found.</Text>
                        </View>}
                />
            </>
        )
     }

    return (
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="received" />}
        ListHeaderComponent={
            <>
                {hubSpecEnabled ? (
                    <LeafTrailHubToolbar
                        adminFilters={sortedAdminFilters}
                        onFilterChange={onFilterChange}
                        showReceiptStatus
                    />
                ) : (
                    <FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={sortedAdminFilters} />
                )}
                <Text style={styles.countText}>{data.total} plant(s)</Text>
            </>
        }
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

const ReceivingTabListHeader = ({
    hubSpecEnabled,
    onFilterChange,
    adminFilters,
    showLegacyScan,
    total,
}) => (
    <>
        {hubSpecEnabled ? (
            <LeafTrailHubToolbar
                adminFilters={adminFilters}
                onFilterChange={onFilterChange}
                showReceiptStatus={showLegacyScan}
            />
        ) : (
            <FilterBar showScan={showLegacyScan} onFilterChange={onFilterChange} adminFilters={adminFilters} />
        )}
        <Text style={styles.countText}>{total ?? 0} plant(s)</Text>
    </>
);

const InventoryForHubTab = ({
    data,
    onFilterChange,
    adminFilters,
    openTagAs,
    selectionMode,
    selectedItems,
    onToggleSelect,
    hubSpecEnabled,
}) => {
    
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
                    contentContainerStyle={styles.listContentContainer}
                    ListFooterComponent={
                         <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 16, color: '#647276'}}>No For Inventory Hub plants found.</Text>
                        </View>}
                />
            </>
        )
     }

    return(
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <PlantListItem 
                openTagAs={openTagAs} 
                item={item} 
                type="forInventoryHub"
                selectionMode={selectionMode}
                isSelected={(selectedItems || []).includes(item.id)}
                onToggleSelect={onToggleSelect}
            />
        )}
        ListHeaderComponent={
            <ReceivingTabListHeader
                hubSpecEnabled={hubSpecEnabled}
                onFilterChange={onFilterChange}
                adminFilters={adminFilters}
                total={data.total}
            />
        }
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

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
                    contentContainerStyle={styles.listContentContainer}
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
        renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="missing" />}
        ListHeaderComponent={
            <ReceivingTabListHeader
                hubSpecEnabled={hubSpecEnabled}
                onFilterChange={onFilterChange}
                adminFilters={adminFilters}
                total={data.total}
            />
        }
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
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
                    contentContainerStyle={styles.listContentContainer}
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
        renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="damaged" />}
        ListHeaderComponent={
            <ReceivingTabListHeader
                hubSpecEnabled={hubSpecEnabled}
                onFilterChange={onFilterChange}
                adminFilters={adminFilters}
                total={data.total}
            />
        }
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

const DEFAULT_RECEIVING_ROUTES = [
    { key: 'forReceiving', title: 'For Receiving' },
    { key: 'inventoryForHub', title: ' Inventory for Hub' },
    { key: 'received', title: 'Received' },
    { key: 'missing', title: 'Missing' },
    { key: 'damaged', title: 'Damaged' },
];

const ReceivingLoadingOverlay = ({ message }) => (
    <View style={styles.loadingOverlay}>
        <View style={styles.loadingCard}>
            <View style={styles.loadingTopRow}>
                <View style={styles.loadingDot} />
                <Text style={styles.loadingTagText}>For Receiving</Text>
            </View>
            <ActivityIndicator size="large" color="#2F8C4F" />
            <Text style={styles.loadingTitle}>Fetching incoming plants</Text>
            <Text style={styles.loadingMessage}>{message}</Text>
        </View>
    </View>
);

const ReceivingScreen = ({navigation}) => {
    const hubSpecEnabled = isLeafTrailHubSpecEnabled();
    const trail1IntakeMode = isTrail1ForReceivingEnabled();
    const [index, setIndex] = useState(0);
    const routes = useMemo(
        () => (trail1IntakeMode ? [DEFAULT_RECEIVING_ROUTES[0]] : DEFAULT_RECEIVING_ROUTES),
        [trail1IntakeMode],
    );
    const [receivingData, setReceivingData] = useState(null);
    const [adminFilters, setAdminFilters] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Preparing For Receiving data...');
    const [error, setError] = useState(null);
    const [isTagAsVisible, setTagAsVisible] = useState(false);
    const [isMissing, setIsMissing] = useState(false);
    const [isDamaged, setIsDamaged] = useState(false);
    const [forShipping, setForShipping] = useState(false);
    const [orderId, setOrderId] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [generatedLabels, setGeneratedLabels] = useState([]);
    const [showLabelViewer, setShowLabelViewer] = useState(false);
    const lastReceivingFiltersRef = useRef(undefined);
    const tabStatusesRef = useRef(ADMIN_FILTER_STATUSES_BY_TAB.forReceiving);

    const openTagAs = (status, id) => {
        setIsMissing(status.isMissing);
        setIsDamaged(status.isDamaged);
        setForShipping(status.forShipping);
        setTagAsVisible(!isTagAsVisible);
        setOrderId(id)
    }

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

                setReceivingData(response);
                await refreshAdminFilters(tabStatusesRef.current, { withPageLoader: false });
                
            } catch (e) {
                setIsLoading(false);
                setError(e);
                console.error("Failed to fetch plant data:", e);
            } finally {
                setIsLoading(false);
            }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, []),
    );

    const openLeafTrailScan = useCallback(() => {
        const params = trail1IntakeMode
            ? LEAF_TRAIL_SCAN_PARAMS.receivingIntake
            : LEAF_TRAIL_SCAN_PARAMS.receiving;
        navigation.navigate('LeafTrailScanQRAdminScreen', params);
    }, [navigation, trail1IntakeMode]);

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

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'forReceiving':
                return <ForReceivingTab 
                    openTagAs={openTagAs} 
                    onFilterChange={onFilterChange} 
                    data={receivingData?.forReceiving || {}} 
                    adminFilters={adminFiltersForActiveTab}
                    selectionMode={trail1IntakeMode ? false : selectionMode}
                    selectedItems={selectedItems}
                    onToggleSelect={handleToggleSelect}
                    trail1IntakeMode={trail1IntakeMode}
                    hubSpecEnabled={hubSpecEnabled}
                />;
            case 'inventoryForHub':
                return <InventoryForHubTab 
                    openTagAs={openTagAs} 
                    onFilterChange={onFilterChange} 
                    data={receivingData?.inventoryForHub || {}} 
                    adminFilters={adminFiltersForActiveTab}
                    selectionMode={selectionMode}
                    selectedItems={selectedItems}
                    onToggleSelect={handleToggleSelect}
                    hubSpecEnabled={hubSpecEnabled}
                />;
            case 'received':
                return (
                    <ReceivedTab
                        openTagAs={openTagAs}
                        onFilterChange={onFilterChange}
                        data={receivingData?.received || {}}
                        adminFilters={adminFiltersForActiveTab}
                        hubSpecEnabled={hubSpecEnabled}
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
            default:
                return null;
        }
    };

    const setTagAs = async (status) => {
        setIsLoading(true);
        setTagAsVisible(!isTagAsVisible);
        const response = await updateLeafTrailStatus(orderId, status);
        if (response.success) {
          await fetchData();
          setIsLoading(false)
          Alert.alert('Success', 'Order status updated successfully!');
        } else {
          setIsLoading(false)
          Alert.alert('Error', error.message);
        }
    }

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

    const handlePrint = async () => {
        if (trail1IntakeMode && routes[index]?.key === 'forReceiving') {
            const ids = (getCurrentTabData()?.data || []).map((p) => p.id).filter(Boolean);
            if (!ids.length) {
                Alert.alert('No plants', 'There are no plants in this list to print.');
                return;
            }
            try {
                setLoadingMessage('Generating your labels, please wait...');
                setIsLoading(true);
                const response = await generateThermalLabels(ids);
                if (response.success && response.labels) {
                    setGeneratedLabels(response.labels);
                    setShowLabelViewer(true);
                } else {
                    Alert.alert('Error', response.message || 'Failed to generate thermal labels');
                }
            } catch (error) {
                console.error('Error generating thermal labels:', error);
                Alert.alert('Error', error.message || 'Failed to generate thermal labels');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (selectionMode) {
            // Generate thermal labels for selected items
            if (selectedItems.length > 0) {
                try {
                    setLoadingMessage('Generating your labels, please wait...');
                    setIsLoading(true);
                    const response = await generateThermalLabels(selectedItems);
                    
                    if (response.success && response.labels) {
                        // Store generated labels and show viewer
                        setGeneratedLabels(response.labels);
                        setShowLabelViewer(true);
                        // Exit selection mode
                        setSelectionMode(false);
                        setSelectedItems([]);
                    } else {
                        Alert.alert('Error', response.message || 'Failed to generate thermal labels');
                    }
                } catch (error) {
                    console.error('Error generating thermal labels:', error);
                    Alert.alert('Error', error.message || 'Failed to generate thermal labels');
                } finally {
                    setIsLoading(false);
                }
            } else {
                Alert.alert('No Selection', 'Please select at least one item to print labels for.');
            }
        } else {
            // Enter selection mode
            setSelectionMode(true);
        }
    }

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelectedItems([]);
    }

    const handleToggleSelect = (itemId) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleSelectAll = () => {
        // Get all items from the current tab
        const currentTabData = getCurrentTabData();
        const allItemIds = currentTabData?.data?.map(item => item.id) || [];
        
        // If all items are already selected, deselect all. Otherwise, select all.
        if (selectedItems.length === allItemIds.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allItemIds);
        }
    };

    const getCurrentTabData = () => {
        switch (routes[index].key) {
            case 'forReceiving':
                return receivingData?.forReceiving || {};
            case 'inventoryForHub':
                return receivingData?.inventoryForHub || {};
            case 'received':
                return receivingData?.received || {};
            case 'missing':
                return receivingData?.missing || {};
            case 'damaged':
                return receivingData?.damaged || {};
            default:
                return {};
        }
    };

    const getTotalItemsCount = () => {
        const currentTabData = getCurrentTabData();
        return currentTabData?.data?.length || 0;
    };

    const hubExportLines = getCurrentTabData()?.data || [];
    const hubTabKey = routes[index]?.key || 'forReceiving';
    const hubPrintOnHeader =
        hubSpecEnabled &&
        (trail1IntakeMode ? index === 0 : index === 0 || index === 1);
    const hubHeaderActions = useLeafTrailHubActions({
        exportLines: hubSpecEnabled ? hubExportLines : [],
        exportStageLabel: hubTabKey,
        onPrintPress: handlePrint,
        printDisabled: !hubPrintOnHeader,
        exportDisabled: !hubSpecEnabled,
        emptyPrintMessage:
            'Print is available on For Receiving and Received tabs, or open a plant list with plants.',
        emptyExportMessage: 'No plants to export on this tab. Try another tab or adjust filters.',
    });

    const downloadAllLabels = async () => {
        try {
            setLoadingMessage('Preparing your labels for download, please wait...');
            setIsLoading(true);
            const timestamp = Date.now();
            const tempDir = `${RNFS.CachesDirectoryPath}/qr-labels-${timestamp}`;
            await RNFS.mkdir(tempDir);

            const filePaths = [];
            for (const label of generatedLabels) {
                const filename = `label-${label.plantCode}.png`;
                const filepath = `${tempDir}/${filename}`;
                await RNFS.writeFile(filepath, label.base64, 'base64');
                filePaths.push(`file://${filepath}`);
            }

            await Share.open({
                urls: filePaths,
                title: 'QR Labels',
                message: `${generatedLabels.length} QR label(s) - save to Files, Photos, or Downloads`,
            });
            Alert.alert('Success', 'Labels shared. Save them to your preferred location.', [{ text: 'OK' }]);
        } catch (error) {
            if (error?.message !== 'User did not share') {
                console.error('Download error:', error);
                Alert.alert('Error', 'Failed to save labels. ' + (error?.message || ''));
            }
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

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screenContainer} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                {isLoading && !showLabelViewer && (
                        <Modal transparent animationType="fade">
                          <ReceivingLoadingOverlay message={loadingMessage} />
                        </Modal>
                      )}
                
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
                                style={[styles.downloadButton, isLoading && styles.buttonDisabled]}
                                onPress={downloadAllLabels}
                                disabled={isLoading}
                            >
                                <View style={styles.buttonContent}>
                                    <DownloadIcon width={20} height={20} />
                                    <Text style={styles.buttonText}>
                                        Download All
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
                            <ReceivingLoadingOverlay message={loadingMessage} />
                        )}
                    </View>
                </Modal>
                <ScreenHeader 
                    navigation={navigation} 
                    printButton={
                        hubSpecEnabled
                            ? true
                            : !trail1IntakeMode && (index === 0 || index === 1)
                    }
                    onPrint={hubSpecEnabled ? hubHeaderActions.onPrint : handlePrint}
                    downloadCsv={!!hubSpecEnabled}
                    onDownloadCsv={hubHeaderActions.onExport}
                    downloadLoading={hubHeaderActions.exportLoading}
                    scarQr={!selectionMode}
                    onScanPress={hubSpecEnabled ? openLeafTrailScan : undefined}
                    scanQrParams={hubSpecEnabled ? undefined : LEAF_TRAIL_SCAN_PARAMS.receiving}
                    title={trail1IntakeMode ? 'For Receiving' : 'Receiving of Plants'}
                    selectionMode={selectionMode}
                    onCancelSelection={handleCancelSelection}
                    selectedCount={selectedItems.length}
                    onSelectAll={selectionMode ? handleSelectAll : null}
                    totalItemsCount={getTotalItemsCount()}
                />
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={(newIndex) => {
                        setIndex(newIndex);
                        if (!trail1IntakeMode) {
                            tabChange(newIndex);
                        }
                        // Clear selection mode when switching tabs
                        if (selectionMode) {
                            handleCancelSelection();
                        }
                    }}
                    renderTabBar={trail1IntakeMode ? () => null : renderTabBar}
                />
            </SafeAreaView>

            <TagAsOptions visible={isTagAsVisible}
                setTagAs={setTagAs}
                isMissing={isMissing}
                isDamaged={isDamaged}
                forShipping={forShipping}
                onClose={() => setTagAsVisible(false)}/>
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
        backgroundColor: 'rgba(17, 24, 20, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    loadingCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1EEE5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    loadingTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2F8C4F',
    },
    loadingTagText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2B6E42',
    },
    loadingTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E2A22',
        textAlign: 'center',
    },
    loadingMessage: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: '#5E6A62',
        textAlign: 'center',
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
        width: 200,
        flexShrink: 0,
        alignItems: 'center',
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
        justifyContent: 'space-between',
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // gap: 6,
    },
    plantCode: {
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
        padding: 12,
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9EB',
    },
    downloadButton: {
        flex: 1,
        backgroundColor: '#4A90E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emailButton: {
        flex: 1,
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