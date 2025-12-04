import NetInfo from '@react-native-community/netinfo';
import { useIsFocused } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../../../assets/styles/styles';
import { AuthContext } from '../../../auth/AuthProvider';
import { InputSearch } from '../../../components/InputGroup/Left';
import { retryAsync } from '../../../utils/utils';
import OrderActionSheet from './components/OrderActionSheet';

import {
  getListingTypeApi,
  getOrderListingApi,
  getSortApi,
} from '../../../components/Api';

import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import LiveIcon from '../../../assets/images/live.svg';

import OrderTableList from './components/OrderTableList';
import OrderTableSkeleton from './components/OrderTableSkeleton';

const screenHeight = Dimensions.get('window').height;
const SELLER_ORDERS_PAGE_SIZE = 20;

const headers = [
  'Orders',
  'Transaction # & Date(s)',
  'Plant Code',
  'Plant Name',
  'Listing Type',
  'Pot Size',
  'Quantity',
  'Total Price',
];
const imageMap = {
  fordelivery: require('../../../assets/images/orders-delivered.png'),
  delivered: require('../../../assets/images/orders-for_delivery.png'),
};

const dateOptions = [
  {label: 'All', value: 'All'},
  {label: 'This Week', value: 'This Week'},
  {label: 'Last Week', value: 'Last Week'},
  {label: 'This Month', value: 'This Month'},
];

const ScreenOrder = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState('For Delivery');
  const isActive = key => active === key;
  const [dataTable, setDataTable] = useState([]);
  const {userInfo} = useContext(AuthContext);

  // Pagination state (similar to Listings)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTokens, setPageTokens] = useState(['']);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Fetch on mount
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();
  const [search, setSearch] = useState('');

  const resetPaginationState = () => {
    setPageTokens(['']);
    setCurrentPage(1);
    setHasMorePages(false);
    setTotalOrders(0);
    setTotalPages(1);
  };

  const loadData = async (
    sortBy,
    date,
    deliveryStatus,
    listingType,
    startDate,
    endDate,
    search,
    nextPageToken,
  ) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const effectiveLimit = SELLER_ORDERS_PAGE_SIZE;
    const effectiveToken = nextPageToken || '';

    const response = await retryAsync(
      () =>
        getOrderListingApi(
          effectiveLimit,
          sortBy,
          date,
          deliveryStatus,
          listingType,
          effectiveToken,
          startDate,
          endDate,
          search,
          'orders', // Pass 'orders' to distinguish from Delivery screen
        ),
      3,
      1000,
    );

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to load orders');
    }

    return response;
  };

  const fetchOrdersPage = async (targetPage = 1) => {
    try {
      setLoading(true);
      let desiredPage = Math.max(1, targetPage);

      const tokensCopy = [...pageTokens];
      let response = null;

      const fetchPageWithToken = async (pageToken = '') => {
        return loadData(
          reusableSort,
          reusableDate,
          active,
          reusableListingType,
          reusableStartDate,
          reusableEndDate,
          search,
          pageToken,
        );
      };

      if (tokensCopy[desiredPage - 1] === undefined) {
        let currentIndex = tokensCopy.length - 1;
        let lastToken = tokensCopy[currentIndex] || '';
        while (currentIndex < desiredPage - 1) {
          const interimResponse = await fetchPageWithToken(lastToken);
          const nextToken = interimResponse?.nextPageToken || null;
          tokensCopy[currentIndex + 1] = nextToken;
          lastToken = nextToken || '';
          currentIndex += 1;

          if (currentIndex === desiredPage - 1) {
            response = interimResponse;
            break;
          }

          if (!nextToken) {
            desiredPage = currentIndex;
            response = interimResponse;
            break;
          }
        }

        if (tokensCopy[desiredPage - 1] === undefined) {
          desiredPage = Math.max(1, tokensCopy.length - 1);
        }
      }

      if (!response) {
        const tokenForPage = tokensCopy[desiredPage - 1] || '';
        response = await fetchPageWithToken(tokenForPage);
      }

      const orders = response?.orders || [];
      const nextToken = response?.nextPageToken || null;

      // For Orders screen, backend now returns accurate total count
      // Use backend total if available, otherwise calculate from pages
      let computedTotal = totalOrders; // Keep existing total by default
      
      if (desiredPage === 1 || totalOrders === 0) {
        // Check if backend provided a total count (for Orders screen)
        if (typeof response?.total === 'number' && response.total > 0) {
          // Use backend total if available (for Orders screen with sellerName/gardenOrCompanyName filters)
          computedTotal = response.total;
          console.log(`✅ Using backend total count: ${computedTotal}`);
        } else {
          // Check if we should use backend count or fetch all pages to count
          const hasFilters = search && search.trim() !== '' || 
                            reusableListingType && reusableListingType.length > 0 ||
                            reusableDate && reusableDate !== 'All' ||
                            (reusableStartDate && reusableEndDate);

          if (!hasFilters && typeof response?.count === 'number') {
            // Use backend count when no filters are applied
            computedTotal = response.count;
          } else {
            // For filtered results, fetch all pages to get accurate count
            // Use a separate token chain for counting to avoid affecting pagination
            let totalFilteredCount = orders.length;
            let countToken = nextToken;
            let countSafety = 0;
            const MAX_TOTAL_FETCHES = 50;

            // Continue fetching and counting filtered results until no more pages
            while (countToken && countSafety < MAX_TOTAL_FETCHES) {
              try {
                const additionalResponse = await fetchPageWithToken(countToken);
                const additionalOrders = additionalResponse?.orders || [];
                totalFilteredCount += additionalOrders.length;

                console.log(`🔍 Orders counting: Fetched page ${countSafety + 2}, got ${additionalOrders.length} orders, total so far: ${totalFilteredCount}`);

                if (additionalResponse?.nextPageToken) {
                  countToken = additionalResponse.nextPageToken;
                } else {
                  countToken = null;
                  console.log(`✅ Orders counting: Reached end, final count: ${totalFilteredCount}`);
                  break; // No more pages, we have the accurate total
                }

                countSafety += 1;
              } catch (error) {
                console.error('Error fetching page for total count:', error);
                break; // Stop on error
              }
            }

            computedTotal = totalFilteredCount;
          }
        }
      } else if (typeof response?.total === 'number' && response.total > 0) {
        // For subsequent pages, use backend total if available
        computedTotal = response.total;
      }

      tokensCopy[desiredPage] = nextToken;
      const updatedTokens = tokensCopy.slice(0, desiredPage + 1);

      setPageTokens(updatedTokens);
      setDataTable(orders);
      setTotalOrders(computedTotal);
      setTotalPages(Math.max(1, Math.ceil(computedTotal / SELLER_ORDERS_PAGE_SIZE)));
      setHasMorePages(Boolean(nextToken));
      setCurrentPage(desiredPage);
    } catch (error) {
      console.log('Error in fetchOrdersPage:', error.message);
      Alert.alert('Orders', error.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      fetchOrdersPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if ((currentPage < totalPages || hasMorePages) && !loading) {
      fetchOrdersPage(currentPage + 1);
    }
  };


  // ✅ Fetch on mount
  useEffect(() => {
    if (isFocused) {
      resetPaginationState();
      fetchOrdersPage(1);
    }
  }, [isFocused, isInitialFetchRefresh, active]);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    resetPaginationState();
    fetchOrdersPage(1);
  };
  const [sortOptions, setSortOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  const [reusableSort, setReusableSort] = useState('');
  const [reusableDate, setReusableDate] = useState('');
  const [reusableListingType, setReusableListingType] = useState([]);
  const [reusableStartDate, setReusableStartDate] = useState([]);
  const [reusableEndDate, setReusableEndDate] = useState([]);

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const handleFilterView = () => {
    // If 'All' is selected, clear any explicit start/end date range
    if (reusableDate === 'All') {
      setReusableStartDate('');
      setReusableEndDate('');
    }
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleSearchSubmitRange = (startDate, endDate) => {
    // Fix timezone issue: format date in local timezone, not UTC
    const formatLocalDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedStart = formatLocalDate(startDate);
    const formattedEnd = formatLocalDate(endDate);

    console.log('📦 Orders Date Range Filter Applied:', {
      originalDates: { start: startDate?.toString(), end: endDate?.toString() },
      formattedDates: { start: formattedStart, end: formattedEnd },
      dateRange: formattedStart && formattedEnd ? 
        `${formattedStart} to ${formattedEnd}` : 
        'No range selected'
    });
    setReusableStartDate(formattedStart);
    setReusableEndDate(formattedEnd);
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('📦 Orders Search Applied:', {
      searchTerm: searchText,
      searchLength: searchText.length,
      currentFilters: {
        status: active,
        sort: reusableSort,
        date: reusableDate,
        listingType: reusableListingType
      }
    });

    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const onPressFilterTabs = pressCode => {
    console.log('📦 Orders Status Tab Changed:', {
      from: active,
      to: pressCode,
      availableOptions: ['For Delivery', 'Inventory for Hub', 'Received Seller Scanned', 'Received Seller Unscanned', 'Missing', 'Delivered']
    });
    setActive(pressCode);
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };
  // Filters Action Sheet

  // For dropdown
  useEffect(() => {
    const fetchDataDropdown = async () => {
      try {
        // Then fetch main data (if it depends on the above)
        // Parallel fetches
        await Promise.all([loadSortByData(), loadListingTypeData()]);
      } catch (error) {
        console.log('Error in dropdown:', error);
      }
    };

    fetchDataDropdown();
  }, []);

  const loadSortByData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getSortApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    let localSortData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    console.log('📦 Orders Sort Options Loaded:', {
      count: localSortData.length,
      options: localSortData.map(opt => opt.label)
    });

    setSortOptions(localSortData);
  };

  const loadListingTypeData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load listing type api');
    }

    let localListingTypeData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));
    
    console.log('📦 Orders Listing Type Options Loaded:', {
      count: localListingTypeData.length,
      options: localListingTypeData.map(opt => opt.label)
    });
    setListingTypeOptions(localListingTypeData);
  };
  // For dropdown

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingTop: insets.top}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      {/* Search and Icons */}
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
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 20,
            alignItems: 'flex-start',
            paddingHorizontal: 16,
          }}>
          {[
            {filterKey: 'For Delivery'},
            {filterKey: 'Inventory for Hub'},
            {filterKey: 'Received Seller Scanned'},
            {filterKey: 'Received Seller Unscanned'},
            {filterKey: 'Missing'},
            {filterKey: 'Damaged'},
          ].map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onPressFilterTabs(tab.filterKey)}
              style={[
                styles.tabButton,
                isActive(tab.filterKey) && styles.activeTabButton,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  isActive(tab.filterKey) && styles.activeTabText,
                ]}>
                {tab.filterKey}
              </Text>
              {isActive(tab.filterKey) && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
          paddingVertical: 10,
          paddingLeft: 10,
          backgroundColor: '#fff',
        }} // ✅ prevents extra vertical space
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
        }}>
        <TouchableOpacity
          onPress={() => onPressFilter('SORT')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
          }}>
          <SortIcon width={20} height={20}></SortIcon>
          <Text style={globalStyles.textSMGreyDark}>Sort</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressFilter('DATE')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
          }}>
          <Text style={globalStyles.textSMGreyDark}>Date</Text>
          <DownIcon width={20} height={20}></DownIcon>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressFilter('DATERANGE')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
          }}>
          <Text style={globalStyles.textSMGreyDark}>Date Range</Text>
          <DownIcon width={20} height={20}></DownIcon>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressFilter('LISTINGTYPE')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
            marginRight: 30,
          }}>
          <Text style={globalStyles.textSMGreyDark}>Listing Type</Text>
          <DownIcon width={20} height={20}></DownIcon>
        </TouchableOpacity>
      </ScrollView>
      {/* Filter Cards */}

      <View style={[styles.container]}> 
        <View
          style={{
            backgroundColor: '#fff',
            minHeight: dataTable.length != 0 && screenHeight * 0.9,
          }}>
          {loading ? (
            <View style={styles.contents}>
              <OrderTableSkeleton rowCount={SELLER_ORDERS_PAGE_SIZE} />
            </View>
          ) : dataTable && dataTable.length > 0 ? (
            <>
              <View>
                <OrderTableList
                  headers={headers}
                  orders={dataTable}
                  // keep header fixed; rows scroll within this height
                  rowsHeight={Math.floor(screenHeight * 0.55)}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              </View>
            </>
          ) : !loading ? (
            <View
              style={{
                flex: 1,
                paddingTop: 60,
                alignItems: 'center',
              }}>
              <Image
                source={imageMap[active.toLowerCase().replace(/\s+/g, '')]}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          ) : null}
        </View>
      </View>

      {/* Pagination Controls */}
      <View style={styles.paginationWrapper}>
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              (currentPage <= 1 || loading) && styles.paginationButtonDisabled,
            ]}
            onPress={handlePreviousPage}
            disabled={currentPage <= 1 || loading}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.paginationButtonText,
                (currentPage <= 1 || loading) && styles.paginationButtonTextDisabled,
              ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>
            <Text style={styles.paginationSubtext}>
              {loading ? 'Loading...' : `${totalOrders} total orders`}
            </Text>
              </View>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              ((currentPage >= totalPages && !hasMorePages) || loading) &&
                styles.paginationButtonDisabled,
            ]}
            onPress={handleNextPage}
            disabled={(currentPage >= totalPages && !hasMorePages) || loading}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.paginationButtonText,
                ((currentPage >= totalPages && !hasMorePages) || loading) &&
                  styles.paginationButtonTextDisabled,
              ]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <OrderActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        dateOptions={dateOptions}
        listingTypeOptions={listingTypeOptions}
        sortValue={reusableSort}
        dateValue={reusableDate}
        sortChange={setReusableSort}
        dateChange={setReusableDate}
        listingTypeValue={reusableListingType}
        listingTypeChange={setReusableListingType}
        handleSearchSubmit={handleFilterView}
        handleSearchSubmitRange={handleSearchSubmitRange}
      />
    </SafeAreaView>
  );
};

export default ScreenOrder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#fff',
  },
  contents: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
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
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  topNavItem: {
    backgroundColor: '#fff',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    height: 80,
  },
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  msgIcon: {
    position: 'relative',
  },
  msgBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  msgBadgeText: {
    fontSize: 10,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },

  tabContainer: {
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
  },
  activeTabButton: {
    // Active state styling handled by indicator
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
  paginationWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#23C16B',
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E4E7E9',
  },
  paginationButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3A6',
  },
  paginationInfo: {
    alignItems: 'center',
    marginVertical: 4,
  },
  paginationText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  paginationSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#647276',
  },
});
