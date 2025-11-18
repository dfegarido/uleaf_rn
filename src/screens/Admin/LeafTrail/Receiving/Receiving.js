import moment from 'moment';
import React, { useEffect, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar, TabView } from 'react-native-tab-view';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import Options from '../../../../assets/admin-icons/options.svg';
import QuestionMarkIcon from '../../../../assets/admin-icons/question-mark.svg';
import ReceivedIcon from '../../../../assets/admin-icons/received.svg';
import FilterBar from '../../../../components/Admin/filter';
import ScreenHeader from '../../../../components/Admin/header';
import { getAdminLeafTrailFilters, getAdminLeafTrailReceiving, updateLeafTrailStatus } from '../../../../components/Api/getAdminLeafTrail';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import TagAsOptions from './TagAs';

// A single card in the list
const PlantListItem = ({ item, type, openTagAs }) => {
    const setTags = () => {
        console.log('item', item);
        
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
        <View style={styles.cardContainer}>
            <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
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

const ForReceivingTab = ({data, onFilterChange, adminFilters, openTagAs}) => (
            <FlatList
                data={data.data}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="forReceiving" />}
                ListHeaderComponent={
                <>
                    <FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters}/>
                    <Text style={styles.countText}>{data.total} plant(s)</Text>
                </>}
                ItemSeparatorComponent={() => <View style={{height: 6}}/>}
                contentContainerStyle={styles.listContentContainer}
            />
);

const ReceivedTab = ({data, onFilterChange, adminFilters, openTagAs}) => (
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="received" />}
        ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
);

const MissingTab = ({data, onFilterChange, adminFilters, openTagAs}) => (
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="missing" />}
        ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
);

const DamagedTab = ({data, onFilterChange, adminFilters, openTagAs}) => (
    <FlatList
        data={data.data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PlantListItem openTagAs={openTagAs} item={item} type="damaged" />}
        ListHeaderComponent={<><FilterBar onFilterChange={onFilterChange} adminFilters={adminFilters} /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
);

const ReceivingScreen = ({navigation}) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'forReceiving', title: 'For Receiving' },
        { key: 'received', title: 'Received' },
        { key: 'missing', title: 'Missing' },
        { key: 'damaged', title: 'Damaged' },
    ]);
    const [receivingData, setReceivingData] = useState(null);
    const [adminFilters, setAdminFilters] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTagAsVisible, setTagAsVisible] = useState(false);
    const [isMissing, setIsMissing] = useState(false);
    const [isDamaged, setIsDamaged] = useState(false);
    const [forShipping, setForShipping] = useState(false);
    const [orderId, setOrderId] = useState(false);

    const openTagAs = (status, id) => {
        console.log('status', status);
        
        setIsMissing(status.isMissing);
        setIsDamaged(status.isDamaged);
        setForShipping(status.forShipping);
        setTagAsVisible(!isTagAsVisible);
        setOrderId(id)
    }

    const fetchData = async (filters) => {
            try {
                setIsLoading(true);
                const response = await getAdminLeafTrailReceiving(filters);
                
                setReceivingData(response);

                const adminFilter = await getAdminLeafTrailFilters();
                setAdminFilters(adminFilter);
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
                return <ForReceivingTab openTagAs={openTagAs} onFilterChange={onFilterChange} data={receivingData?.forReceiving || {}} adminFilters={adminFilters}  />;
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
        console.log('asdfsadf');
        
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

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screenContainer} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                {isLoading && (
                        <Modal transparent animationType="fade">
                          <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#699E73" />
                          </View>
                        </Modal>
                      )}
                <ScreenHeader navigation={navigation} scarQr={true} title={'Receiving of Plants'}/>
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    renderTabBar={renderTabBar}
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
});