import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar, TabView } from 'react-native-tab-view';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import ScanQrIcon from '../../../../assets/admin-icons/qr.svg';
import QuestionMarkIcon from '../../../../assets/admin-icons/question-mark.svg';
import ReceivedIcon from '../../../../assets/admin-icons/received.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import SortIcon from '../../../../assets/icons/greylight/sort-arrow-regular.svg';
import { getAdminLeafTrailReceiving } from '../../../../components/Api/getAdminLeafTrail';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';

// --- REUSABLE COMPONENTS ---

// Horizontal filter bar shown on each tab
const FilterBar = () => (
  <View style={styles.filterContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity style={styles.filterButton}>
        <SortIcon />
        <Text style={styles.filterButtonText}>Sort</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Plant Flight</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Country </Text>
        <DownIcon />
      </TouchableOpacity>
       <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Garden</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Seller</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Buyer</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Receiver</Text>
        <DownIcon />
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// A single card in the list
const PlantListItem = ({ item, type }) => (
    <View style={styles.listItemOuterContainer}>
        {type === 'missing' && (
             <View style={styles.missingStatusContainer}>
                <Text style={styles.missingStatusText}>Missing</Text>
            </View>
        )}
        <View style={styles.flightDetailsRow}>
             <AirplaneIcon width={20} height={20} color="#556065"/>
             <Text style={styles.flightDateText}>Plant Flight <Text style={{ fontWeight: 'bold' }}>{item.flightDate}</Text></Text>
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
                    </View>
                    <Text style={styles.plantGenus}>{item.genus} {item.species}</Text>
                    <Text style={styles.plantVariegation}>{item.variegation} • {item.size}</Text>
                </View>
                <View style={styles.typeRow}>
                    {(item.listingType && type === 'received') && <View style={styles.listingTypeChip}><Text style={styles.listingTypeText}>{item.listingType}</Text></View>}
                    {!(type === 'received') && <View style={{flex: 1}} />}
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
            </View>
        </View>
    </View>
);


// --- TAB SCREENS ---

const ForReceivingTab = ({data}) => (
    <FlatList
        data={data.data}
        keyExtractor={item => item.key}
        renderItem={({ item }) => <PlantListItem item={item} type="forReceiving" />}
        ListHeaderComponent={<><FilterBar /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
);

const ReceivedTab = ({data}) => (
    <FlatList
        data={data.data}
        keyExtractor={item => item.key}
        renderItem={({ item }) => <PlantListItem item={item} type="received" />}
        ListHeaderComponent={<><FilterBar /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
);

const MissingTab = ({data}) => (
    <FlatList
        data={data.data}
        keyExtractor={item => item.key}
        renderItem={({ item }) => <PlantListItem item={item} type="missing" />}
        ListHeaderComponent={<><FilterBar /><Text style={styles.countText}>{data.total} plant(s)</Text></>}
        ItemSeparatorComponent={() => <View style={{height: 6}}/>}
        contentContainerStyle={styles.listContentContainer}
    />
);


// --- MAIN SCREEN & HEADER ---

const ScreenHeader = ({navigation}) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackSolidIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Receiving of Plants</Text>
            <TouchableOpacity style={styles.headerAction}>
                <ScanQrIcon />
            </TouchableOpacity>
        </View>
    );
};

const ReceivingScreen = ({navigation}) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'forReceiving', title: 'For Receiving' },
        { key: 'received', title: 'Received' },
        { key: 'missing', title: 'Missing' },
    ]);
    const [receivingData, setReceivingData] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);
    // const [error, setError] = useState(null);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
        try {
            const response = await getAdminLeafTrailReceiving();
            
            setReceivingData(response);
        } catch (e) {
            setError(e);
            console.error("Failed to fetch plant data:", e);
        } finally {
            setIsLoading(false);
        }
        };

        fetchData();
    }, []); // The empty array ensures this effect runs only once

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'forReceiving':
                return <ForReceivingTab data={receivingData?.forReceiving || {}} />;
            case 'received':
                return <ReceivedTab data={receivingData?.received || {}} />;
            case 'missing':
                return <MissingTab data={receivingData?.missing || {}} />;
            default:
                return null;
        }
    };

    const renderTabBar = props => (
        <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor="#202325"
            inactiveColor="#647276"
        />
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screenContainer} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <ScreenHeader navigation={navigation}/>
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    renderTabBar={renderTabBar}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

export default ReceivingScreen;

// --- STYLES ---
const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        height: 58,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202325',
    },
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CDD3D4',
        borderRadius: 12,
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
    // Filter Bar
    filterContainer: {
        paddingVertical: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CDD3D4',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        gap: 4,
    },
    filterButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#393D40',
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
        gap: 6,
    },
    plantCode: {
        fontSize: 16,
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