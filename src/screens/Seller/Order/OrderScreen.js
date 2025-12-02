import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarIcon from '../../../assets/images/avatar.svg';
import LiveIcon from '../../../assets/images/live.svg';
import { globalStyles } from '../../../assets/styles/styles';
import OrderActionSheet from './components/OrderActionSheet';

import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';

import NetInfo from '@react-native-community/netinfo';
import moment from 'moment';
import { AuthContext } from '../../../auth/AuthProvider';
import { getListingTypeApi, getSortApi } from '../../../components/Api';
import { getOrderForReceiving } from '../../../components/Api/sellerOrderApi';
import { InputSearch } from '../../../components/InputGroup/Left';
import { retryAsync } from '../../../utils/utils';


// Mock function for fetching data. Replace with your actual API call.
// const getOrderForReceiving = async (filters) => {
//   console.log('Fetching orders with filters:', filters);
//   // Simulate API call
//   await new Promise(resolve => setTimeout(resolve, 1000));

//   // Mock response structure
//   const newItems = Array.from({ length: 10 }).map((_, index) => ({
//     id: `id_${Date.now()}_${index}`,
//     plantImage: 'https://via.placeholder.com/100',
//     transactionNumber: `TRN-${Math.floor(Math.random() * 9000) + 1000}`,
//     plantCode: `PC-00${index + 1}`,
//     plantName: `Monstera Deliciosa ${index + 1}`,
//     listingType: filters.listingType?.split(',')[0] || 'Auction',
//     potsize: '14cm',
//     quantity: Math.floor(Math.random() * 10) + 1, 
//     localPrice: (Math.random() * 100).toFixed(2),
//     localPriceCurrencySymbol: '$',
//     createdAt: new Date().toISOString(),
//     flightDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
//     country: 'Netherlands',
//   }));

//   return {
//     data: newItems,
//     lastDoc: `last_doc_${Date.now()}`, // Mock last document for pagination
//   };
// };

const TABS = {
  allOrders: 'All Orders',
  forDelivery: 'For Delivery',
  inventoryForHub: 'Inventory For Hub',
  receivedScanned: 'Received Scanned',
  receivedUnscanned: 'Received Unscanned',
  missing: 'Missing',
  damaged: 'Damaged',
};

const PlantCard = React.memo(({ item, index, activeTab }) => {
  console.log('activeTab', activeTab);
  
  let leafTrailStatus = item.leafTrailStatus;

  if (leafTrailStatus === 'forReceiving') {
    leafTrailStatus = 'forDelivery';
  }

  const formatCamelCase = (camelCaseString) => {
    if (!camelCaseString) return '';

    const spacedString = camelCaseString.replace(/([A-Z])/g, ' $1');

    return spacedString.charAt(0).toUpperCase() + spacedString.slice(1);
  }
  return (
  <View style={styles.card}>
    <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
    <View style={styles.cardContent}>
      <Text style={styles.cardText}>{index + 1}.{activeTab === 'allOrders' && (
             <Text style={styles.bold}>{formatCamelCase(leafTrailStatus)}</Text>)}
      </Text>
      <Text style={styles.plantName} numberOfLines={5}>{item.genus} {item.species}</Text>
      <Text style={styles.cardText}><Text style={styles.bold}>Trx #:</Text> {item.transactionNumber}</Text>
      <Text style={styles.cardText}><Text style={styles.bold}>Code:</Text> {item.plantCode}</Text>
      <Text style={styles.cardText}><Text style={styles.bold}></Text>{item.variegation} • {item.size}</Text>
      <Text style={styles.cardText}><Text style={styles.bold}>Qty:</Text> {item.quantity}</Text>
      <Text style={styles.price}>{item.localPriceCurrencySymbol}{item.localPrice}</Text>
      <View style={styles.chipContainer}>
        <View style={styles.typeChip}><Text style={styles.typeText}>{item.listingType}</Text></View>
      </View>
      <Text style={styles.dateText}><Text style={styles.bold}>Order:</Text> {moment(item.createdAt._seconds * 1000).format('MMM DD, YYYY')}</Text>
      <Text style={styles.dateText}><Text style={styles.bold}>Flight:</Text> {moment(item.flightDate).isValid() ? moment(item.flightDate).format('MMM DD, YYYY') : '' }</Text>
      <Text style={styles.cardText}><Text style={styles.bold}>Country:</Text> {item.country}</Text>
    </View>
  </View>
)});

const OrderScreen = ({navigation}) => {
  const {userInfo} = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('forDelivery');
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCounts, setTotalCounts] = useState(0);

  // Filter and search states
  const [search, setSearch] = useState('');
  const [reusableSort, setReusableSort] = useState(''); // 'Newest' or 'Oldest'
  const [reusableListingType, setReusableListingType] = useState([]); // e.g., ['Auction', 'Retail']
  const [reusableStartDate, setReusableStartDate] = useState('');
  const [reusableEndDate, setReusableEndDate] = useState('');

  // Action Sheet state
  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sortOptions, setSortOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  const applyFilters = () => {
    setLastDoc(null);
    setOrders([]);
    fetchOrders(true);
  };

  const handleFilterView = () => {
    applyFilters();
    setShowSheet(false);
  };

  const handleSearchSubmitRange = (startDate, endDate) => {
    const formattedStart = startDate ? new Date(startDate).toISOString().slice(0, 10) : '';
    const formattedEnd = endDate ? new Date(endDate).toISOString().slice(0, 10) : '';
    setReusableStartDate(formattedStart);
    setReusableEndDate(formattedEnd);
    applyFilters();
    setShowSheet(false);
  };

  const handleSearchSubmit = () => {
    applyFilters();
  };

  const onPressFilter = (pressCode) => {
    setCode(pressCode);
    setShowSheet(true);
  };

  useEffect(() => {
    const fetchDataDropdown = async () => {
      try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) {
          throw new Error('No internet connection.');
        }

        const [sortRes, listingTypeRes] = await Promise.all([
          retryAsync(() => getSortApi(), 3, 1000),
          retryAsync(() => getListingTypeApi(), 3, 1000),
        ]);

        if (sortRes?.success) {
          setSortOptions(sortRes.data.map(item => ({ label: item.name, value: item.name })));
        }

        if (listingTypeRes?.success) {
          setListingTypeOptions(listingTypeRes.data.map(item => ({ label: item.name, value: item.name })));
        }
      } catch (error) {
        console.log('Error fetching dropdown data:', error);
      }
    };

    fetchDataDropdown();
  }, []);


  const fetchOrders = useCallback(async (isNewSearch = false) => {
    if (loading || (loadingMore && !isNewSearch)) return;

    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    // This is the filter logic you provided
    let filters = {
      orderType: activeTab,
      listingType: reusableListingType.join(','),
      startDate: reusableStartDate,
      endDate: reusableEndDate,
      lastDocument: isNewSearch ? null : lastDoc,
    };

    if (search) {
      filters.search = search;
    }
    if (reusableSort) {
      filters.sort = reusableSort === 'Oldest' ? 'asc' : 'desc';
    }
    if (reusableListingType.length === 0) {
      delete filters.listingType;
    }
    if (!reusableStartDate) {
      delete filters.startDate;
    }
    if (!reusableEndDate) {
      delete filters.endDate;
    }
    if (!filters.lastDocument) {
      delete filters.lastDocument;
    }

    try {
      const response = await getOrderForReceiving(filters);
      if (response && response.data) {
        setOrders(prevOrders => isNewSearch ? response.data : [...prevOrders, ...response.data]);
        setLastDoc(response.lastDocument);
        setTotalCounts(response.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      // You might want to set an error state here
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, search, reusableSort, reusableListingType, reusableStartDate, reusableEndDate, lastDoc, loading, loadingMore]);
  
  // Fetch orders when tab or filters change
  useEffect(() => {
    applyFilters();
  }, [activeTab]);

  const handleLoadMore = () => {
    if (!loadingMore && lastDoc) {
      fetchOrders(false); // `false` indicates we are loading more (paginating)
    }
  };

  const renderFooter = () => {
    if (orders.length === 0) return null;
    if (!loadingMore) return <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#556065' }}>You have reached the end of the list.</Text>;
    return (
          <>
            <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#556065' }}>Loading more...</Text>
            <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#699E73" />
          </>
        );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return <Text style={styles.emptyText}>No orders found.</Text>;
  };

  const renderHeader = () => (
    <View >
      <View style={styles.controlsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => onPressFilter('SORT')}
            style={styles.filterButton}>
            <SortIcon width={20} height={20}></SortIcon>
            <Text style={globalStyles.textSMGreyDark}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPressFilter('DATERANGE')}
            style={styles.filterButton}>
            <Text style={globalStyles.textSMGreyDark}>Date Range</Text>
            <DownIcon width={20} height={20}></DownIcon>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPressFilter('LISTINGTYPE')}
            style={styles.filterButton}>
            <Text style={globalStyles.textSMGreyDark}>Listing Type</Text>
            <DownIcon width={20} height={20}></DownIcon>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.tabScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}>
          {Object.keys(TABS).map(tabKey => (
            <TouchableOpacity
              key={tabKey}
              onPress={() => setActiveTab(tabKey)}
              style={styles.tabButton}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tabKey && styles.activeTabText,
                ]}>
                {TABS[tabKey]} 
                {activeTab === tabKey && (
                  <Text> {totalCounts} plant(s)</Text>
                )}
              </Text>
              {activeTab === tabKey && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
            <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            {/* <InputGroupLeftIcon
              IconLeftComponent={SearchIcon}
              placeholder={'Search I Leaf U'}
            /> */}
            <InputSearch
              placeholder="Search transaction number"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true} // shows an 'X' icon to clear
            />
          </View>
          <View style={styles.headerIcons}>
            {userInfo.liveFlag != 'No' && (
              <TouchableOpacity
                onPress={() => {}}
                style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
                {/* <Text style={styles.liveTag}>LIVE</Text> */}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              {userInfo.profileImage != '' ? (
                <Image
                  source={{uri: userInfo.profileImage}}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <AvatarIcon width={40} height={40} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <FlatList
        data={orders}
        renderItem={({ item, index }) => <PlantCard item={item} index={index} activeTab={activeTab} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContentContainer}
        stickyHeaderIndices={[0]} // Makes the header (including tabs) sticky
      />
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <OrderActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        listingTypeOptions={listingTypeOptions}
        sortValue={reusableSort}
        sortChange={setReusableSort}
        listingTypeValue={reusableListingType}
        listingTypeChange={setReusableListingType}
        handleSearchSubmit={handleFilterView}
        handleSearchSubmitRange={handleSearchSubmitRange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  search: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  liveTag: {
    color: 'red',
    fontSize: 10,
    marginTop: -4,
  },

  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', 
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  controlsContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    fontFamily: 'Inter',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10, 
    backgroundColor: '#fff',
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  filterButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, 
  },
  tabScrollContainer: {
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative', 
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  activeTabText: {
    color: '#202325',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#202325',
    borderRadius: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
  },
  plantImage: {
    width: 110,
    height: '50%',
    borderRadius: 8,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  plantName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#202325',
  },
  cardText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  bold: {
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#539461',
    marginTop: 4,
  },
  dateText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeChip: {
    backgroundColor: '#202325',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center', 
  },
  emptyText: {
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});
export default OrderScreen;
