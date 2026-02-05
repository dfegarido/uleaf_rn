import moment from 'moment';
import React, { useEffect, useState, useRef } from 'react';
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
import ScreenHeader from '../../../../components/Admin/header';
import { getAdminLeafTrailFilters, getAdminLeafTrailReceiving, updateLeafTrailStatus, generateThermalLabels, emailThermalLabels } from '../../../../components/Api/getAdminLeafTrail';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import TagAsOptions from './TagAs';
import CloseIcon from '../../../../assets/icons/white/x-regular.svg';
import BackIcon from '../../../../assets/admin-icons/back.svg';
import LoadingModal from '../../../../components/LoadingModal/LoadingModal';

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
             <Text style={styles.flightDateText}>Plant Flight <Text style={{ fontWeight: 'bold' }}>{moment(item.flightDate).isValid() ? moment(item.flightDate).format('MMM-DD-YYYY') : item.flightDate}</Text></Text>
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
             <TouchableOpacity
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                  activeOpacity={0.8}>
                    <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
            </TouchableOpacity>
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

const ForReceivingTab = ({data, onFilterChange, adminFilters, openTagAs, selectionMode, selectedItems, onToggleSelect}) => {
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={
                    <>
                        <FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={adminFilters}/>
                        <Text style={styles.countText}>{data.total} plant(s)</Text>
                    </>}
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
                    <PlantListItem 
                        openTagAs={openTagAs} 
                        item={item} 
                        type="forReceiving"
                        selectionMode={selectionMode}
                        isSelected={(selectedItems || []).includes(item.id)}
                        onToggleSelect={onToggleSelect}
                    />
                )}
                ListHeaderComponent={
                <>
                    <FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={adminFilters}/>
                    <Text style={styles.countText}>{data.total} plant(s)</Text>
                </>}
                ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                contentContainerStyle={styles.listContentContainer}
            />
)};

const ReceivedTab = ({data, onFilterChange, adminFilters, openTagAs}) => {
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={<><FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
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
        ListHeaderComponent={<><FilterBar showScan={true} onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

const InventoryForHubTab = ({data, onFilterChange, adminFilters, openTagAs, selectionMode, selectedItems, onToggleSelect}) => {
    
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
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
        ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

const MissingTab = ({data, onFilterChange, adminFilters, openTagAs}) => {
    
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
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
        ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

const DamagedTab = ({data, onFilterChange, adminFilters, openTagAs}) => {
    if (!(data?.data) || data.data.length === 0) {   
        return (
            <>
                <FlatList
                    ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
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
        ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
)};

const ReceivingScreen = ({navigation}) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'forReceiving', title: 'For Receiving' },
        { key: 'inventoryForHub', title: ' Inventory for Hub' },
        { key: 'received', title: 'Received' },
        { key: 'missing', title: 'Missing' },
        { key: 'damaged', title: 'Damaged' },
    ]);
    const [receivingData, setReceivingData] = useState(null);
    const [adminFilters, setAdminFilters] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Growing your plants, please wait...');
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

    const openTagAs = (status, id) => {
        setIsMissing(status.isMissing);
        setIsDamaged(status.isDamaged);
        setForShipping(status.forShipping);
        setTagAsVisible(!isTagAsVisible);
        setOrderId(id)
    }

    const getFilters = async (statuses = null) => {
        setIsLoading(true);
        const adminFilter = await getAdminLeafTrailFilters(statuses);
        setAdminFilters(adminFilter);
        setIsLoading(false);
    }

    const fetchData = async (filters) => {
            try {
                setIsLoading(true);
                const response = await getAdminLeafTrailReceiving(filters);
                
                setReceivingData(response);
                await getFilters('["forReceiving"]');
                
            } catch (e) {
                setIsLoading(false);
                setError(e);
                console.error("Failed to fetch plant data:", e);
            } finally {
                setIsLoading(false);
            }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onFilterChange = (filters) => {
         fetchData(filters);
    }

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'forReceiving':
                return <ForReceivingTab 
                    openTagAs={openTagAs} 
                    onFilterChange={onFilterChange} 
                    data={receivingData?.forReceiving || {}} 
                    adminFilters={adminFilters}
                    selectionMode={selectionMode}
                    selectedItems={selectedItems}
                    onToggleSelect={handleToggleSelect}
                />;
            case 'inventoryForHub':
                return <InventoryForHubTab 
                    openTagAs={openTagAs} 
                    onFilterChange={onFilterChange} 
                    data={receivingData?.inventoryForHub || {}} 
                    adminFilters={adminFilters}
                    selectionMode={selectionMode}
                    selectedItems={selectedItems}
                    onToggleSelect={handleToggleSelect}
                />;
            case 'received':
                return <ReceivedTab openTagAs={openTagAs} onFilterChange={onFilterChange} data={receivingData?.received || {}} adminFilters={adminFilters} />;
            case 'missing':
                return <MissingTab openTagAs={openTagAs} onFilterChange={onFilterChange} data={receivingData?.missing || {}} adminFilters={adminFilters} />;
            case 'damaged':
                return <DamagedTab openTagAs={openTagAs} onFilterChange={onFilterChange} data={receivingData?.damaged || {}} adminFilters={adminFilters} />;
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

    const tabChange = async () => {
        if (index === 0) {
            await getFilters('["forReceiving"]');
        }
        if (index === 1) {
            await getFilters('["forReceiving"]');
        }
        if (index === 1) {
            await getFilters('["received"]');
        }
        if (index === 2) {
            await getFilters('["missing"]');
        }
        if (index === 3) {
            await getFilters('["damaged"]');
        }
    }

    const handlePrint = async () => {
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
                          <LoadingModal 
                            message={loadingMessage} 
                          />
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
                            <LoadingModal 
                                message={loadingMessage} 
                            />
                        )}
                    </View>
                </Modal>
                <ScreenHeader 
                    navigation={navigation} 
                    printButton={index === 0 || index === 1} 
                    onPrint={handlePrint} 
                    scarQr={!selectionMode} 
                    title={'Receiving of Plants'}
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
                        // Clear selection mode when switching tabs
                        if (selectionMode) {
                            handleCancelSelection();
                        }
                    }}
                    renderTabBar={renderTabBar}
                    onTabSelect={tabChange}
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