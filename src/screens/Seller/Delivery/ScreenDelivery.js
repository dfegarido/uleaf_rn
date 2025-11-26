/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
import OrderActionSheet from '../Order/components/OrderActionSheet';

import {
  getDeliveryExportApi,
  getListingTypeApi,
  getOrderListingApi,
  getSortApi,
  postDeliverToHubApi,
} from '../../../components/Api';

import ShareIcon from '../../../assets/icons/accent/share-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import LiveIcon from '../../../assets/images/live.svg';

import DeliverActionSheetEdit from './components/DeliverActionSheetEdit';
import DeliverTableList from './components/DeliverTableList';
import DeliverTableSkeleton from './components/DeliverTableSkeleton';

// Export modal icons
import ExportPdfIcon from '../../../assets/export/export-pdf.svg';
import ExportXlsIcon from '../../../assets/export/export-xls.svg';

const screenHeight = Dimensions.get('window').height;
const SELLER_DELIVERY_PAGE_SIZE = 20;

const headers = [
  'For Delivery',
  'Transaction # & Date(s)',
  'Plant Code',
  'Plant Name',
  'Listing Type',
  'Pot Size',
  'Quantity',
  'Total Price',
];

const dateOptions = [
  {label: 'All', value: 'All'},
  {label: 'This Week', value: 'This Week'},
  {label: 'Last Week', value: 'Last Week'},
  {label: 'This Month', value: 'This Month'},
];

const ScreenDelivery = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState('option1');
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const {userInfo} = useContext(AuthContext);

  // Animation values
  const [backgroundOpacity] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(300));

  const isActive = key => active === key;
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [dataTable, setDataTable] = useState([]);

  // Pagination state (similar to Orders)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTokens, setPageTokens] = useState(['']);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshing, setRefreshing] = useState(false);

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

    const effectiveLimit = SELLER_DELIVERY_PAGE_SIZE;
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
          'delivery', // Pass 'delivery' to distinguish from Orders screen
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
          'For Delivery',
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

      // For Delivery screen, backend now returns accurate total count
      // Use backend total if available, otherwise calculate from pages
      let computedTotal = totalOrders; // Keep existing total by default
      
      if (desiredPage === 1 || totalOrders === 0) {
        // Check if backend provided a total count (for Delivery screen)
        if (typeof response?.total === 'number' && response.total > 0) {
          // Use backend total if available (for Delivery screen with sellerName/gardenOrCompanyName filters)
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

                console.log(`🔍 Delivery counting: Fetched page ${countSafety + 2}, got ${additionalOrders.length} orders, total so far: ${totalFilteredCount}`);

                if (additionalResponse?.nextPageToken) {
                  countToken = additionalResponse.nextPageToken;
                } else {
                  countToken = null;
                  console.log(`✅ Delivery counting: Reached end, final count: ${totalFilteredCount}`);
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
      setSummaryCount(response?.deliveryStatusSummary || summaryCount);
      setTotalOrders(computedTotal);
      setTotalPages(Math.max(1, Math.ceil(computedTotal / SELLER_DELIVERY_PAGE_SIZE)));
      setHasMorePages(Boolean(nextToken));
      setCurrentPage(desiredPage);
    } catch (error) {
      console.log('Error in fetchOrdersPage:', error.message);
      Alert.alert('Delivery Listing', error.message);
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

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    resetPaginationState();
    const fetchData = async () => {
      try {
        await fetchOrdersPage(1);
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchData();
  };

  // Function to open modal with animations
  const openModal = () => {
    setIsExportModalVisible(true);
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Function to close modal with animations
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnimation, {
        toValue: 300,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExportModalVisible(false);
    });
  };

  // Function to download Excel file
  const downloadExcelFile = async () => {
    try {
      setExportLoading(true);

      const response = await getDeliveryExportApi();

      if (!response?.success) {
        throw new Error(response?.message || 'Export failed.');
      }

      Alert.alert(
        'Export Successful',
        'Your delivery details Excel file has been sent to your email. Please check your inbox.',
        [{text: 'OK'}]
      );
    } catch (error) {
      console.log('Export:', error.message);
      Alert.alert(
        'Export Failed',
        error.message.includes('404')
          ? 'No orders found with status "Ready to Fly".'
          : 'Failed to export delivery details. Please try again.',
        [{text: 'OK'}]
      );
    } finally {
      setExportLoading(false);
    }
  };

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  // ✅ Fetch on mount
  const [summaryCount, setSummaryCount] = useState({
    Casualty: 0,
    'Deliver to Hub': 0,
    'For Delivery': 0,
    Missing: 0,
    Received: 0,
  });
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();
  const [search, setSearch] = useState('');

  // ✅ Fetch on mount
  useEffect(() => {
    if (isFocused) {
      resetPaginationState();
      fetchOrdersPage(1);
    }
  }, [isFocused, isInitialFetchRefresh]);

  // Filters Action Sheet
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
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleSearchSubmitRange = (startDate, endDate) => {
    const formattedStart = startDate
      ? new Date(startDate).toISOString().slice(0, 10)
      : '';
    const formattedEnd = endDate
      ? new Date(endDate).toISOString().slice(0, 10)
      : '';

    console.log(formattedStart, formattedEnd);
    setReusableStartDate(formattedStart);
    setReusableEndDate(formattedEnd);
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('Searching for:', searchText);
    // trigger your search logic here

    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };
  // Filters Action Sheet

  // Load more - REMOVED (replaced with pagination)

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
    // console.log(localListingTypeData);
    setListingTypeOptions(localListingTypeData);
  };
  // For dropdown

  // Export
  const onPressExport = async () => {
    setLoading(true);
    try {
      const response = await getDeliveryExportApi();

      if (!response?.success) {
        throw new Error(response?.message || 'Export failed.');
      }

      Alert.alert('Export', 'Excel file sent to your email');
    } catch (error) {
      console.log('Export:', error.message);
      Alert.alert('Export', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Export

  const onPressCheck = () => {
    navigation.navigate('ScreenDeliveryAction', {
      onGoBack: setIsInitialFetchRefresh(prev => !prev),
      dataTable: dataTable,
    });
  };

  // Delivery to hub
  const onPressDeliverToHub = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log('Deliver to Hub:', selectedItemToUpdate?.trxNumber ?? '');
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        [selectedItemToUpdate?.trxNumber ?? ''],
        'Deliver to Hub',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post deliver to hub failed.');
      }
      resetPaginationState();
      setIsInitialFetchRefresh(!isInitialFetchRefresh);
      setActionShowSheet(false);
      setSelectedItemToUpdate({});
    } catch (error) {
      console.log('Deliver to hub action:', error.message);
      Alert.alert('Deliver to hub', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Delivery to hub

  // Missing
  const onPressMissing = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log('Missing:', selectedItemToUpdate?.trxNumber ?? '');
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        [selectedItemToUpdate?.trxNumber ?? ''],
        'Missing',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post missing failed.');
      }
      resetPaginationState();
      setIsInitialFetchRefresh(!isInitialFetchRefresh);
      setActionShowSheet(false);
      setSelectedItemToUpdate({});
    } catch (error) {
      console.log('Tag as missing action:', error.message);
      Alert.alert('Tag as missing', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Missing

  // Casualty
  const onPressCasualty = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log('Missing:', selectedItemToUpdate?.trxNumber ?? '');
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        [selectedItemToUpdate?.trxNumber ?? ''],
        'Casualty',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post casualty failed.');
      }
      resetPaginationState();
      setIsInitialFetchRefresh(!isInitialFetchRefresh);
      setActionShowSheet(false);
      setSelectedItemToUpdate({});
    } catch (error) {
      console.log('Tag as casualty action:', error.message);
      Alert.alert('Tag as casualty', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Casualty

  // Action Sheet
  const [showActionSheet, setActionShowSheet] = useState(false);

  const [selectedItemToUpdate, setSelectedItemToUpdate] = useState(false);

  const onEditPressFilter = ({trxNumber, id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    // console.log(selectedItem.trxNumber);
    setSelectedItemToUpdate(selectedItem);
    console.log(showActionSheet);
    setActionShowSheet(true);
  };
  // Action Sheet

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: insets.top,
      }}>
      {exportLoading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#699E73" />
              <Text style={styles.loadingText}>
                Exporting delivery details...
              </Text>
              <Text style={styles.loadingSubtext}>
                Please wait while we generate your Excel file
              </Text>
            </View>
          </View>
        </Modal>
      )}
      {/* Search and Icons */}
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true} // shows an 'X' icon to clear
            />
          </View>
          <View style={styles.headerIcons}>
            {userInfo?.liveFlag != 'No' && (
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

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 0, // Remove padding since pagination footer is outside
        }}
        style={[styles.container]}>
        <View
          style={{
            backgroundColor: '#fff',
            minHeight: dataTable.length != 0 && screenHeight * 0.9,
            paddingHorizontal: 20,
          }}>
          <View
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#CDD3D4',
              padding: 20,
              flexDirection: 'column',
              marginBottom: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderBottomColor: '#CDD3D4',
                borderBottomWidth: 1,
                paddingBottom: 10,
              }}>
              <View style={{flexDirection: 'column'}}>
                <Text style={{color: '#202325', fontSize: 16}}>
                  For Delivery
                </Text>
                <Text style={{color: '#202325', fontSize: 28}}>
                  {totalOrders}
                </Text>
              </View>
              <TouchableOpacity
                onPress={openModal}
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <ShareIcon width={20} height={20}></ShareIcon>
                <Text style={{color: '#539461', fontSize: 16, paddingLeft: 5}}>
                  Export
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                borderBottomColor: '#CDD3D4',
                borderBottomWidth: 1,
              }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryHub')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  borderColor: '#CDD3D4',
                  borderRightWidth: 1,
                  paddingVertical: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>
                  Deliver to Hub
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#202325', fontSize: 28}}>
                    {summaryCount['Deliver to Hub']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryReceived')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  paddingVertical: 10,
                  paddingLeft: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>Received</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#539461', fontSize: 28}}>
                    {summaryCount['Received']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryMissing')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  borderColor: '#CDD3D4',
                  borderRightWidth: 1,
                  paddingVertical: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>Missing</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#FF5247', fontSize: 28}}>
                    {summaryCount['Missing']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryCasualty')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  paddingVertical: 10,
                  paddingLeft: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>Casualty</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#000', fontSize: 28}}>
                    {summaryCount['Casualty']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {loading && dataTable.length === 0 ? (
            <View>
              <DeliverTableSkeleton rowCount={5} />
            </View>
          ) : dataTable.length == 0 ? (
            <View
              style={{
                flex: 1,
                paddingTop: 30,
                alignItems: 'center',
              }}>
              <Image
                source={require('../../../assets/images/for_delivery_empty.png')}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          ) : (
            <>
              <View>
                <DeliverTableList
                  headers={headers}
                  orders={dataTable}
                  module={'MAIN'}
                  navigateToListAction={onPressCheck}
                  onEditPressFilter={onEditPressFilter}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  style={{}}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

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

      {/* Export Modal */}
      <Modal
        transparent={true}
        visible={isExportModalVisible}
        onRequestClose={closeModal}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: backgroundOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
              }),
            },
          ]}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{translateY: slideAnimation}],
              },
            ]}>
            {/* Modal Indicator */}
            <View style={styles.modalIndicatorContainer}>
              <View style={styles.modalIndicator} />
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {/* Export QR Code Option */}
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  // Navigate to Export QR Code screen
                  closeModal();
                  navigation.navigate('ScreenExportQR');
                }}>
                <View style={styles.exportIcon}>
                  <ExportPdfIcon width={48} height={48} />
                </View>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportTitle}>Export QR Code</Text>
                  <Text style={styles.exportSubtitle}>PDF File</Text>
                </View>
              </TouchableOpacity>

              {/* Export Delivery Details Option */}
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  // Close modal instantly without animation for immediate feedback
                  setIsExportModalVisible(false);
                  downloadExcelFile();
                }}>
                <View style={styles.exportIcon}>
                  <ExportXlsIcon width={48} height={48} />
                </View>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportTitle}>
                    Export Delivery Details
                  </Text>
                  <Text style={styles.exportSubtitle}>Spreadsheet File</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

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

      <DeliverActionSheetEdit
        visible={showActionSheet}
        onClose={() => setActionShowSheet(false)}
        onPressDeliverToHub={onPressDeliverToHub}
        onPressMissing={onPressMissing}
        onPressCasualty={onPressCasualty}
      />
    </SafeAreaView>
  );
};

export default ScreenDelivery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
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
  containerTab: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    // marginTop: 20,
  },
  buttonActive: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  buttonInactive: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: Dimensions.get('window').width,
    height: 254,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
  },
  modalIndicatorContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalIndicator: {
    position: 'absolute',
    width: 48,
    height: 4,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    top: '33.33%',
  },
  modalContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    height: 196,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: '100%',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  exportIcon: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    height: 43,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: '#202325',
    alignSelf: 'stretch',
  },
  exportSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: '#647276',
    alignSelf: 'stretch',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    paddingBottom: 12,
    marginTop: 8,
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
