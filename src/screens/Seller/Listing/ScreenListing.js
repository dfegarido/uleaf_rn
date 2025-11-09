import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../../../assets/styles/styles';
import { AuthContext } from '../../../auth/AuthProvider';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {
  getAllPlantGenusApi,
  getListingTypeApi,
  getManageListingApi,
  getSortApi,
  getVariegationApi,
  postListingApplyDiscountActionApi,
  postListingDeleteApi,
  postListingPinActionApi,
  postListingRemoveDiscountActionApi,
  postListingUpdateStockActionApi,
} from '../../../components/Api';
import { setLiveListingActiveApi } from '../../../components/Api/agoraLiveApi';
import { InputBox } from '../../../components/Input';
import { InputSearch } from '../../../components/InputGroup/Left';
import { InputGroupAddon } from '../../../components/InputGroupAddon';
import { ReusableActionSheet } from '../../../components/ReusableActionSheet';
import TabFilter from '../../../components/TabFilter/TabFilter';
import { retryAsync } from '../../../utils/utils';
import ConfirmDelete from './components/ConfirmDelete';
import ListingActionSheet from './components/ListingActionSheetEdit';
import ListingTable from './components/ListingTable';
import ListingTableSkeleton from './components/ListingTableSkeleton';

import PinAccentIcon from '../../../assets/icons/accent/pin.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
import Purge from '../../../assets/live-icon/purge.svg';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const FilterTabs = [
  {
    filterKey: 'All',
    badgeCount: '',
  },
  {
    filterKey: 'Active',
    badgeCount: '',
  },
  {
    filterKey: 'Inactive',
    badgeCount: '',
  },
  {
    filterKey: 'Discounted',
    badgeCount: '',
  },
  {
    filterKey: 'Scheduled',
    badgeCount: '20',
  },
  {
    filterKey: 'Expired',
    badgeCount: '',
  },
  {
    filterKey: 'Out of Stock',
    badgeCount: '',
  },
];

const FilterLiveTabs = [
  {
    filterKey: 'All',
    badgeCount: '',
  },
  {
    filterKey: 'Active',
    badgeCount: '',
  },
  {
    filterKey: 'Live',
    badgeCount: '',
  },
  {
    filterKey: 'Inactive',
    badgeCount: '',
  },
  {
    filterKey: 'Discounted',
    badgeCount: '',
  },
  {
    filterKey: 'Scheduled',
    badgeCount: '20',
  },
  {
    filterKey: 'Expired',
    badgeCount: '',
  },
  {
    filterKey: 'Out of Stock',
    badgeCount: '',
  },
];

const headers = [
  'Listings',
  'Plant Name & Status',
  'Pin',
  'Listing Type',
  'Pot Size',
  'Price',
  'Quantity',
  'Expiration Date',
  'Discount',
];

const imageMap = {
  all: require('../../../assets/images/manage-all.png'),
  active: require('../../../assets/images/manage-active.png'),
  inactive: require('../../../assets/images/manage-inactive.png'),
  discounted: require('../../../assets/images/manage-discounted.png'),
  scheduled: require('../../../assets/images/manage-scheduled.png'),
  expired: require('../../../assets/images/manage-expired.png'),
  outofstock: require('../../../assets/images/manage-out_of_stock.png'),
};

const ScreenListing = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [dataTable, setDataTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const {userInfo} = useContext(AuthContext);

  const normalizeKey = key => key.toLowerCase().replace(/\s+/g, '');

  // List table
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Your loadData (unchanged)
  const [nextToken, setNextToken] = useState('');
  const [nextTokenParam, setNextTokenParam] = useState('');
  const loadData = async (
    filterMine,
    sortBy,
    genus,
    variegation,
    listingType,
    status,
    discount,
    limit,
    plant,
    pinTag,
    nextPageToken,
  ) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    // Convert discount boolean to string 'true' or 'false' for API
    const discountParam = discount === true ? 'true' : (discount === false ? 'false' : '');
    
    // Map tab names to API status values (exact match required by backend)
    // Ensure status is a valid string and map correctly
    let apiStatus = status || 'All';
    
    // Handle status mapping - ensure 'All' is passed correctly
    if (status === 'All' || !status || status === '') {
      apiStatus = 'All'; // Show all statuses
    } else if (status === 'Discounted') {
      apiStatus = 'All'; // Discounted uses 'All' status with discount=true
    } else if (status === 'Out of Stock') {
      apiStatus = 'Out of Stock'; // Ensure exact match with space
    } else if (status === 'Active') {
      apiStatus = 'Active'; // Explicitly set Active status
    } else if (status === 'Inactive') {
      apiStatus = 'Inactive';
    } else if (status === 'Scheduled') {
      apiStatus = 'Scheduled';
    } else if (status === 'Expired') {
      apiStatus = 'Expired';
    }
    
    console.log('📊 Status mapping:', { 
      originalStatus: status, 
      mappedStatus: apiStatus,
      isAll: apiStatus === 'All'
    });
    
    // Normalize sortBy to match backend expectations (case-sensitive)
    // Backend expects: 'Price Low To High', 'Price High To Low', 'Most Loved', or empty/default
    let normalizedSortBy = sortBy || '';
    if (sortBy) {
      const sortTrimmed = sortBy.trim();
      const sortLower = sortTrimmed.toLowerCase();
      
      // Check for exact matches first (most common case)
      if (sortTrimmed === 'Price Low To High' || sortTrimmed === 'Price Low to High') {
        normalizedSortBy = 'Price Low To High';
      } else if (sortTrimmed === 'Price High To Low' || sortTrimmed === 'Price High to Low') {
        normalizedSortBy = 'Price High To Low';
      } else if (sortTrimmed === 'Most Loved') {
        normalizedSortBy = 'Most Loved';
      } else if (sortTrimmed === 'Newest to Oldest' || sortTrimmed === 'Newest To Oldest') {
        normalizedSortBy = 'Newest to Oldest';
      } else if (sortTrimmed === 'Oldest to Newest' || sortTrimmed === 'Oldest To Newest') {
        normalizedSortBy = 'Oldest to Newest';
      } else {
        // Fallback: try to match by keywords
        if (sortLower.includes('price') && sortLower.includes('low') && sortLower.includes('high')) {
          normalizedSortBy = 'Price Low To High';
        } else if (sortLower.includes('price') && sortLower.includes('high') && sortLower.includes('low')) {
          normalizedSortBy = 'Price High To Low';
        } else if (sortLower.includes('most') && sortLower.includes('loved')) {
          normalizedSortBy = 'Most Loved';
        } else if (sortLower.includes('newest') && sortLower.includes('oldest')) {
          // "Newest to Oldest" - newest first
          normalizedSortBy = 'Newest to Oldest';
        } else if (sortLower.includes('oldest') && sortLower.includes('newest')) {
          // "Oldest to Newest" - oldest first
          normalizedSortBy = 'Oldest to Newest';
        } else if (sortLower.includes('newest')) {
          // Just "Newest" - default to newest first
          normalizedSortBy = 'Newest to Oldest';
        } else if (sortLower.includes('oldest')) {
          // Just "Oldest" - default to oldest first
          normalizedSortBy = 'Oldest to Newest';
        } else {
          // Keep original if it matches expected format
          normalizedSortBy = sortTrimmed;
        }
      }
    }
    
    console.log('📊 Sort mapping:', { originalSort: sortBy, normalizedSort: normalizedSortBy });
    
    // Extract values from filter objects (genus, variegation, listingType may be arrays of objects)
    const extractValues = (filterArray) => {
      if (!filterArray || !Array.isArray(filterArray)) return [];
      return filterArray.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.value || item.label || item.name || '';
        return String(item);
      }).filter(Boolean);
    };

    const genusValues = extractValues(genus);
    const variegationValues = extractValues(variegation);
    const listingTypeValues = extractValues(listingType);

    console.log('🔍 API Call Parameters:', {
      filterMine,
      sortBy: normalizedSortBy,
      genus: genusValues,
      variegation: variegationValues,
      listingType: listingTypeValues,
      status: apiStatus,
      discount: discountParam,
      limit,
      plant,
      pinTag,
      nextPageToken,
    });
    
    const getManageListingApiData = await getManageListingApi(
      filterMine,
      normalizedSortBy, // Use normalized sort value
      genusValues, // Pass extracted values
      variegationValues, // Pass extracted values
      listingTypeValues, // Pass extracted values
      apiStatus,
      discountParam,
      limit,
      plant,
      pinTag,
      nextPageToken,
    );

    console.log('📦 API Response:', {
      success: getManageListingApiData?.success,
      listingsCount: getManageListingApiData?.listings?.length || 0,
      hasListings: !!getManageListingApiData?.listings,
      message: getManageListingApiData?.message,
      nextPageToken: getManageListingApiData?.nextPageToken,
    });

    if (!getManageListingApiData?.success) {
      throw new Error(
        getManageListingApiData?.message || 'Login verification failed.',
      );
    }

    // Ensure we have a valid listings array
    const listings = Array.isArray(getManageListingApiData?.listings) 
      ? getManageListingApiData.listings 
      : [];
    
    console.log('📋 Setting dataTable with', listings.length, 'listings');
    
    setNextToken(getManageListingApiData?.nextPageToken || '');
    setDataTable(
      prev =>
        nextTokenParam
          ? [...prev, ...listings] // append
          : listings, // replace
    );
  };

  // ✅ Error-handling wrapper
  const fetchData = async () => {
    try {
      // setErrorMessage('');
      console.log('🔄 fetchData called with:', {
        activeTab,
        isDiscounted,
        reusableSort,
        reusableGenus,
        reusableVariegation,
        reusableListingType,
      });
      await loadData(
        true,
        reusableSort,
        reusableGenus,
        reusableVariegation,
        reusableListingType,
        activeTab, // This should be 'Active', 'Inactive', 'Scheduled', 'Expired', 'Out of Stock', 'Discounted', or 'All'
        isDiscounted,
        10,
        search,
        pinSearch,
        nextTokenParam,
      );
    } catch (error) {
      console.log('Error in fetchData:', error.message);

      Alert.alert('Listing', error.message);
    } finally {
      setRefreshing(false);
      setLoading(false); // Set loading to false after fetch completes (success or error)
    }
  };

  // ✅ Fetch on mount
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchData(); // fetchData will set loading to false in finally block
    }
  }, [isInitialFetchRefresh, isFocused]);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true); // Show skeleton while refreshing
    setNextToken('');
    setNextTokenParam('');
    fetchData(); // fetchData will set loading to false in finally block
  };
  // List table

  // Pin search
  const [pinSearch, setPinSearch] = useState(false);

  const onPressPinSearch = paramPinSearch => {
    console.log('🔵 Pin Search Toggle:', paramPinSearch);
    setPinSearch(paramPinSearch);
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };
  // Pin search

  // Search
  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('🔍 Plant Search:', searchText);
    // trigger your search logic here
    setLoading(true); // Show skeleton while searching
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleFilterView = () => {
    console.log('🔽 Filter Applied:', {
      sort: reusableSort,
      genus: reusableGenus,
      variegation: reusableVariegation,
      listingType: reusableListingType,
    });
    
    // Verify sort value format matches backend expectations
    if (reusableSort) {
      console.log('🔍 Sort value before normalization:', reusableSort);
    }
    
    setLoading(true); // Show skeleton while applying filters
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
    // Close the modal after applying filters
    setShowSheet(false);
  };
  // Search

  // Load more
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  useEffect(() => {
    if (nextTokenParam) {
      setIsLoadingMore(true);
      fetchData();
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 500);
    }
  }, [nextTokenParam]);

  const onPressLoadMore = () => {
    if (nextToken && nextToken != nextTokenParam && !isLoadingMore) {
      setNextTokenParam(nextToken);
    }
  };

  // Infinite scroll handler
  const handleScroll = (event) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const paddingToBottom = 100; // Trigger when 100px from bottom
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      // User has scrolled near the bottom
      if (nextToken && nextToken != nextTokenParam && !isLoadingMore && !loading) {
        onPressLoadMore();
      }
    }
  };
  // Load more

  // For dropdown
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  useEffect(() => {
    const fetchDataDropdown = async () => {
      try {
        // Then fetch main data (if it depends on the above)
        // Parallel fetches
        await Promise.all([
          loadSortByData(),
          loadGenusData(),
          loadVariegationData(),
          loadListingTypeData(),
        ]);
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

  const loadGenusData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getAllPlantGenusApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load genus api');
    }

    // Handle different response formats like other screens
    // 1. { success: true, data: ['genus1', 'genus2', ...] } - array of strings
    // 2. { success: true, data: [{ name: 'genus1' }, ...] } - array of objects
    let localGenusData = [];
    if (Array.isArray(res.data)) {
      localGenusData = res.data.map(item => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        } else if (item && typeof item === 'object') {
          const name = item.name || item.genus_name || item.genusName || item.genus || '';
          return { label: name, value: name };
        }
        return null;
      }).filter(Boolean);
    } else if (res.data && typeof res.data === 'object') {
      // Handle case where data might be an object with a name property
      const name = res.data.name || res.data.genus_name || res.data.genusName || res.data.genus || '';
      if (name) {
        localGenusData = [{ label: name, value: name }];
      }
    }

    console.log('✅ Loaded genus options:', localGenusData.length);
    setGenusOptions(localGenusData);
  };

  const loadVariegationData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getVariegationApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load variegation api');
    }

    let localVariegationData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    setVariegationOptions(localVariegationData);
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

  // For reusable action sheet
  const [reusableSort, setReusableSort] = useState('');
  const [reusableGenus, setReusableGenus] = useState([]);
  const [reusableVariegation, setReusableVariegation] = useState([]);
  const [reusableListingType, setReusableListingType] = useState([]);
  // For reusable action sheet

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  // const onPressItem = ({data}) => {
  //   navigation.navigate('ScreenMyStoreDetail', data);
  // };

  const [activeTab, setActiveTab] = useState('All');
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [activeFilterShow, setActiveFilterShow] = useState('');

  const onTabPressItem = ({pressTab}) => {
    console.log('📋 Status Tab Changed:', pressTab);
    setActiveTab(pressTab);
    setIsDiscounted(false);
    setNextToken('');
    setNextTokenParam('');
    setLoading(true); // Show skeleton while fetching with new tab filter
    
    // Handle Discounted tab - set discount flag and reset status
    if (pressTab === 'Discounted') {
      setIsDiscounted(true);
      console.log('💰 Discount Filter Activated');
    } else {
      setIsDiscounted(false);
    }
    
    // Trigger refresh to apply new filter
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  // Check if a filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        return reusableSort && reusableSort !== '';
      case 'Genus':
        return Array.isArray(reusableGenus) && reusableGenus.length > 0;
      case 'Variegation':
        return Array.isArray(reusableVariegation) && reusableVariegation.length > 0;
      case 'Listing Type':
        return Array.isArray(reusableListingType) && reusableListingType.length > 0;
      default:
        return false;
    }
  };

  // Clear a specific filter
  const clearSpecificFilter = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        setReusableSort('');
        break;
      case 'Genus':
        setReusableGenus([]);
        break;
      case 'Variegation':
        setReusableVariegation([]);
        break;
      case 'Listing Type':
        setReusableListingType([]);
        break;
      default:
        return;
    }
    // Refresh listings after clearing filter
    setLoading(true); // Show skeleton while clearing filter and refetching
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    // Map pressCode to filter label
    const filterLabelMap = {
      'SORT': 'Sort',
      'GENUS': 'Genus',
      'VARIEGATION': 'Variegation',
      'LISTINGTYPE': 'Listing Type',
    };
    
    const filterLabel = filterLabelMap[pressCode];
    
    // If filter is active, clear it instead of opening the modal
    if (filterLabel && isFilterActive(filterLabel)) {
      clearSpecificFilter(filterLabel);
      return;
    }
    
    // Otherwise, open the filter modal as usual
    setCode(pressCode);
    setShowSheet(true);
  };

  const [actionSheetCode, setActionSheetCode] = useState(null);
  const [showActionSheet, setActionShowSheet] = useState(false);

  const [selectedItemStockUpdate, setselectedItemStockUpdate] = useState(false);

  const onEditPressFilter = ({pressCode, id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    // console.log(selectedItem);
    setselectedItemStockUpdate(selectedItem);
    setActionSheetCode(pressCode);
    setActionShowSheet(true);
  };

  // Add stocks
  const [quantities, setQuantities] = useState({});
  useEffect(() => {
    if (Array.isArray(selectedItemStockUpdate?.variations)) {
      const initialQuantities = {};
      selectedItemStockUpdate.variations.forEach(variation => {
        initialQuantities[variation.id] =
          variation.availableQty?.toString() || '';
      });
      setQuantities(initialQuantities);
    } else if (selectedItemStockUpdate?.potSize) {
      setQuantities({
        single: selectedItemStockUpdate.availableQty?.toString() || '',
      });
    }
  }, [selectedItemStockUpdate]);

  const [showSheetUpdateStocks, setShowSheetUpdateStocks] = useState(false);

  const onPressUpdateStockShow = ({id}) => {
    setActionShowSheet(false);
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setShowSheetUpdateStocks(!showSheetUpdateStocks);
  };

  const onPressUpdateStockPost = async () => {
    setActionShowSheet(false);
    setShowSheetUpdateStocks(false);
    // setLoading(true);
    try {
      const {variations, plantCode} = selectedItemStockUpdate;

      // Extract pot sizes and map their IDs to corresponding quantities from qtyMap
      const potSizes = variations.map(variation => variation.potSize);
      const selectedQuantity = variations.map(
        variation => quantities[variation.id]?.toString() || '0', // default to '0' if missing
      );

      const response = await postListingUpdateStockActionApi(
        plantCode,
        potSizes,
        selectedQuantity,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post stock update failed.');
      }
      setNextToken('');
      setNextTokenParam('');
      fetchData();
      Alert.alert('Update Listing', 'Listing stocks updated successfully!');
    } catch (error) {
      console.log('Error updating stock:', error.message);
      Alert.alert('Update stocks', error.message);
    } finally {
      // setLoading(false);
    }
  };
  // Add stocks

  // Apply discount
  const [discountPercentageSheet, setDiscountPercentageSheet] = useState();
  const [discountPriceSheet, setDiscountPriceSheet] = useState();
  const [showSheetDiscount, setShowSheetDiscount] = useState(false);

  const onPressDiscount = ({id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setShowSheetDiscount(!showSheetDiscount);
  };

  const onPressUpdateApplyDiscountPost = async () => {
    // Validation: only one of the two should be filled
    const isPriceFilled =
      discountPriceSheet !== undefined &&
      discountPriceSheet !== '' &&
      discountPriceSheet !== null;
    const isPercentageFilled =
      discountPercentageSheet !== undefined &&
      discountPercentageSheet !== null &&
      discountPercentageSheet !== '';

    if (
      (isPriceFilled && isPercentageFilled) ||
      (!isPriceFilled && !isPercentageFilled)
    ) {
      Alert.alert(
        'Invalid Input',
        'Please fill **either** Discount Price or Discount Percentage, not both or none.',
      );
      return;
    }

    setLoading(true);
    try {
      const {plantCode} = selectedItemStockUpdate;

      const response = await postListingApplyDiscountActionApi(
        [plantCode],
        discountPriceSheet,
        discountPercentageSheet,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post stock update failed.');
      }

      setDiscountPercentageSheet('');
      setDiscountPriceSheet('');
      setShowSheetDiscount(!showSheetDiscount);
      setNextToken('');
      setNextTokenParam('');
      fetchData();
    } catch (error) {
      console.log('Error updating discount:', error.message);
      Alert.alert('Update Discount', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onPressRemoveDiscountPost = async plantCode => {
    setLoading(true);
    try {
      const response = await postListingRemoveDiscountActionApi([plantCode]);

      if (!response?.success) {
        throw new Error(response?.message || 'Post stock update failed.');
      }
      setNextToken('');
      setNextTokenParam('');
      fetchData();
    } catch (error) {
      console.log('Error remove discount:', error.message);
      Alert.alert('Remove discount', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Apply discount

  const onPressCheck = () => {
    // navigation.navigate('ScreenListingAction', {
    //   dataTable: dataTable,
    //   activeTab: activeTab,
    // });

    navigation.navigate('ScreenListingAction', {
      onGoBack: setIsInitialFetchRefresh(prev => !prev),
      dataTable: dataTable,
      activeTab: activeTab,
    });
  };

  const onNavigateToDetail = plantCode => {
    navigation.navigate('ScreenListingDetail', {
      onGoBack: setIsInitialFetchRefresh(prev => !prev),
      plantCode: plantCode,
    });
  };

  const onPressSetToActive = async (plantCode) => {
    setLoading(true);
    try {
      const response = await setLiveListingActiveApi({
        plantCode: plantCode,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Active listing has been updated.');
        setNextToken('');
        setNextTokenParam('');
        fetchData();
      } else {
        throw new Error(response.message || 'Failed to set active listing.');
      }
    } catch (error) {
      console.log('Error action:', error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onPressTableListPin = async (plantCode, pinTag) => {
    setLoading(true);
    try {
      const updatedPinTag = !pinTag;

      const response = await postListingPinActionApi(plantCode, updatedPinTag);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

      // setDataTable(prev =>
      //   prev.map(item =>
      //     item.plantCode === plantCode
      //       ? {...item, pinTag: updatedPinTag}
      //       : item,
      //   ),
      // );
      setNextToken('');
      setNextTokenParam('');
      fetchData();
    } catch (error) {
      console.log('Error pin table action:', error.message);
      Alert.alert('Pin item', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Item
  const onPressDelete = async () => {
    setLoading(true);
    setActionShowSheet(false);
    setDeleteModalVisible(false);
    try {
      let plantCode = selectedItemStockUpdate?.plantCode;
      const response = await postListingDeleteApi(plantCode);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

      setNextToken('');
      setNextTokenParam('');
      fetchData();
      setActionShowSheet(false);
      setDeleteModalVisible(false);
      Alert.alert('Delete Listing', 'Listing deleted successfully!');
    } catch (error) {
      console.log('Error pin table action:', error.message);
      Alert.alert('Delete item', error.message);
    } finally {
      setActionShowSheet(false);
      setDeleteModalVisible(false);
      setLoading(false);
    }
  };
  // Delete Item

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const onPressDeleteConfirm = () => {
    setActionShowSheet(false);
    setDeleteModalVisible(true);
  };

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingTop: insets.top}}>
      {/* Search and Icons */}
      <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
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
                onPress={() => navigation.navigate('ScreenMyPurges')}
                style={styles.iconButton}>
                  
                {/* <LiveIcon width={40} height={40} />
                <Text style={styles.liveTag}>LIVE</Text> */}
                <Purge />
                {/* <Image source={require('../../../assets/live-icon/purge.png')} style={{width: 40, height: 40}} /> */}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 10,
                  borderRadius: 10,
                },
              ]}
              onPress={() => onPressPinSearch(!pinSearch)}>
              {pinSearch ? (
                <PinAccentIcon width={20} height={20} />
              ) : (
                <PinIcon width={20} height={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Filter Tabs */}
        <TabFilter
          tabFilters={userInfo?.liveFlag != 'No' ? FilterLiveTabs : FilterTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onPressTab={onTabPressItem}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexGrow: 0,
            paddingVertical: 20,
            paddingHorizontal: 20,
          }} // ✅ prevents extra vertical space
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}>
          <TouchableOpacity onPress={() => onPressFilter('SORT')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Sort') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Sort') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
              <SortIcon width={20} height={20} />
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Sort') && { color: '#23C16B', fontWeight: '600' }
              ]}>Sort</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('GENUS')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Genus') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Genus') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Genus') && { color: '#23C16B', fontWeight: '600' }
              ]}>Genus</Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('VARIEGATION')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Variegation') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Variegation') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Variegation') && { color: '#23C16B', fontWeight: '600' }
              ]}>Variegation</Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('LISTINGTYPE')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Listing Type') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Listing Type') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginRight: 30,
              }}>
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Listing Type') && { color: '#23C16B', fontWeight: '600' }
              ]}>Listing Type</Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>
        </ScrollView>
        {/* Filter Tabs */}
      </View>
      {/* Search and Icons */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={[styles.container]}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        // stickyHeaderIndices={[0]}
      >
        <View
          style={{
            backgroundColor: '#fff',
            minHeight: dataTable.length != 0 && screenHeight * 0.9,
          }}>
          {loading && dataTable.length === 0 ? (
            <View style={styles.contents}>
              <ListingTableSkeleton rowCount={8} />
            </View>
          ) : dataTable && dataTable.length > 0 ? (
            <>
              <View style={styles.contents}>
                <ListingTable
                  headers={headers}
                  data={dataTable}
                  onEditPressFilter={onEditPressFilter}
                  onPressDiscount={onPressDiscount}
                  onPressUpdateStock={onPressUpdateStockShow}
                  module={'MAIN'}
                  navigateToListAction={onPressCheck}
                  style={{}}
                  onPressTableListPin={onPressTableListPin}
                  onPressRemoveDiscountPost={onPressRemoveDiscountPost}
                  onNavigateToDetail={onNavigateToDetail}
                  activeTab={activeTab}
                  onPressSetToActive={onPressSetToActive}
                />
                {/* Show loading indicator when fetching more data */}
                {isLoadingMore && nextToken && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 20,
                    marginBottom: 30,
                  }}>
                    <ActivityIndicator size="small" color="#699E73" />
                    <Text style={[globalStyles.textMDGreyLight, {marginLeft: 10}]}>
                      Loading more...
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : !loading ? (
            <View style={{alignItems: 'center', paddingTop: 80, flex: 1}}>
              <Image
                source={imageMap[normalizeKey(activeTab)]}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ReusableActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        genusOptions={genusOptions}
        variegationOptions={variegationOptions}
        listingTypeOptions={listingTypeOptions}
        sortValue={reusableSort}
        sortChange={setReusableSort}
        genusValue={reusableGenus}
        genusChange={setReusableGenus}
        variegationValue={reusableVariegation}
        variegationChange={setReusableVariegation}
        listingTypeValue={reusableListingType}
        listingTypeChange={setReusableListingType}
        handleSearchSubmit={handleFilterView}
      />
      <ListingActionSheet
        code={actionSheetCode}
        visible={showActionSheet}
        onClose={() => setActionShowSheet(false)}
        onPressUpdateStockShow={() => {
          setActionShowSheet(false);
          setShowSheetUpdateStocks(true);
        }}
        onPressEdit={() =>
          navigation.navigate('ScreenListingDetail', {
            onGoBack: setIsInitialFetchRefresh(prev => !prev),
            plantCode: selectedItemStockUpdate.plantCode,
          })
        }
        onPressDelete={onPressDeleteConfirm}
      />

      <ActionSheet
        visible={showSheetUpdateStocks}
        onClose={() => setShowSheetUpdateStocks(false)}
        heightPercent={'50%'}>
        <View style={styles.sheetTitleContainer}>
          <Text style={styles.sheetTitle}>Update Stocks</Text>
          <TouchableOpacity onPress={() => setShowSheetUpdateStocks(false)}>
            <ExIcon width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={{paddingHorizontal: 20}}>
          {Array.isArray(selectedItemStockUpdate.variations) &&
          selectedItemStockUpdate.variations.length > 0 ? (
            selectedItemStockUpdate.variations.map((variation, index) => (
              <View key={variation.id || index} style={{marginTop: 10}}>
                <Text
                  style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                  Pot size: {variation.potSize || 'N/A'}
                </Text>
                <Text
                  style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                  Current Quantity
                </Text>
                <InputBox
                  placeholder="Quantity"
                  value={quantities[variation.id] || ''}
                  setValue={text =>
                    setQuantities(prev => ({...prev, [variation.id]: text}))
                  }
                />
              </View>
            ))
          ) : selectedItemStockUpdate.potSize ? (
            <View style={{marginTop: 10}}>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Pot size: {selectedItemStockUpdate.potSize}
              </Text>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Current Quantity
              </Text>
              <InputBox
                placeholder="Quantity"
                value={quantities.single || ''}
                setValue={text =>
                  setQuantities(prev => ({...prev, single: text}))
                }
              />
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => onPressUpdateStockPost()}
          style={{
            position: 'absolute',
            bottom: 0,
            paddingHorizontal: 20,
            width: '100%',
            paddingBottom: 10,
          }}>
          <View style={globalStyles.primaryButton}>
            <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
              Update Stocks
            </Text>
          </View>
        </TouchableOpacity>
      </ActionSheet>

      <ActionSheet
        visible={showSheetDiscount}
        onClose={() => setShowSheetDiscount(false)}
        heightPercent={'40%'}>
        <View style={{height: '100%'}}>
          <View style={styles.sheetTitleContainer}>
            <Text style={styles.sheetTitle}>Apply Discount</Text>
            <TouchableOpacity onPress={() => setShowSheetDiscount(false)}>
              <ExIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={{marginHorizontal: 20}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{paddingBottom: 20}}>
            <View>
              <Text style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
                Discount price
              </Text>
              <InputGroupAddon
                addonText={userInfo?.currencySymbol ?? ''}
                position="left"
                value={discountPriceSheet}
                onChangeText={setDiscountPriceSheet}
                placeholder="Enter price"
              />
            </View>
            <View style={{paddingTop: 20}}>
              <Text style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
                or discount on percentage
              </Text>
              <InputGroupAddon
                addonText="% OFF"
                position="right"
                value={discountPercentageSheet}
                onChangeText={setDiscountPercentageSheet}
                placeholder="Enter percentage"
              />
            </View>
            <View style={{paddingTop: 20}}>
              <TouchableOpacity
                style={{
                  // position: 'absolute',
                  // bottom: 0,
                  width: '100%',
                }}
                onPress={onPressUpdateApplyDiscountPost}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    Apply Discount
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ActionSheet>

      <ConfirmDelete
        visible={deleteModalVisible}
        onDelete={onPressDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ScreenListing;

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
    paddingLeft: 10,
    paddingRight: 20,
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
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    // zIndex: 10,
    paddingTop: 12,
  },
  contents: {
    // paddingHorizontal: 20,
    backgroundColor: '#fff',
    // minHeight: screenHeight,
  },
  image: {
    width: 166,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    padding: 5,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
  },
  strikeText: {
    textDecorationLine: 'line-through', // This adds the line in the middle
    color: 'black',
  },
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
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
});
