import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import TabFilter from '../../../components/TabFilter/TabFilter';
import ListingTable from './components/ListingTable';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import ListingActionSheet from './components/ListingActionSheetEdit';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {InputBox} from '../../../components/Input';
import {InputGroupAddon} from '../../../components/InputGroupAddon';
import {
  getManageListingApi,
  postListingPinActionApi,
  getSortApi,
  getGenusApi,
  getVariegationApi,
  getListingTypeApi,
  postListingUpdateStockActionApi,
  postListingApplyDiscountActionApi,
  postListingRemoveDiscountActionApi,
  postListingDeleteApi,
} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {InputSearch} from '../../../components/InputGroup/Left';
import {AuthContext} from '../../../auth/AuthProvider';
import ConfirmDelete from './components/ConfirmDelete';

import LiveIcon from '../../../assets/images/live.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
import DollarIcon from '../../../assets/icons/greylight/dollar.svg';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';
import PinAccentIcon from '../../../assets/icons/accent/pin.svg';

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

const headers = [
  'Listings',
  'Plant Name & Status',
  'Pin',
  'Listing Type',
  'Pot Size',
  'Price',
  'Quantity',
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

    const getManageListingApiData = await getManageListingApi(
      filterMine,
      sortBy,
      genus,
      variegation,
      listingType,
      status == 'Discounted' ? 'All' : status,
      discount,
      limit,
      plant,
      pinTag,
      nextPageToken,
    );

    if (!getManageListingApiData?.success) {
      throw new Error(
        getManageListingApiData?.message || 'Login verification failed.',
      );
    }

    // console.log(getManageListingApiData.listings[0]);
    // console.log(getManageListingApiData?.nextPageToken);
    setNextToken(getManageListingApiData?.nextPageToken);
    // setDataTable(getManageListingApiData?.listings || []);
    setDataTable(
      prev =>
        nextTokenParam
          ? [...prev, ...(getManageListingApiData?.listings || [])] // append
          : getManageListingApiData?.listings || [], // replace
    );
    // console.log(JSON.stringify(dataTable));
  };

  // ✅ Error-handling wrapper
  const fetchData = async () => {
    try {
      // setErrorMessage('');
      await loadData(
        true,
        reusableSort,
        reusableGenus,
        reusableVariegation,
        reusableListingType,
        activeTab,
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
    }
  };

  // ✅ Fetch on mount
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchData();
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [isInitialFetchRefresh, isFocused]);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setNextToken('');
    setNextTokenParam('');
    fetchData();
  };
  // List table

  // Pin search
  const [pinSearch, setPinSearch] = useState(false);

  const onPressPinSearch = paramPinSearch => {
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
    console.log('Searching for:', searchText);
    // trigger your search logic here

    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleFilterView = () => {
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };
  // Search

  // Load more
  useEffect(() => {
    if (nextTokenParam) {
      setLoading(true);
      fetchData();
      setTimeout(() => {
        setLoading(false); // or setLoading(false)
      }, 500);
    }
  }, [nextTokenParam]);

  const onPressLoadMore = () => {
    if (nextToken != nextTokenParam) {
      setNextTokenParam(nextToken);
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

    const res = await retryAsync(() => getGenusApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load genus api');
    }

    let localGenusData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

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
    // console.log(pressTab);
    setActiveTab(pressTab);
    setIsDiscounted(false);
    setNextToken('');
    setNextTokenParam('');
    if (pressTab == 'Discounted') setIsDiscounted(true);
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const onPressFilter = pressCode => {
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
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setShowSheetUpdateStocks(!showSheetUpdateStocks);
  };

  const onPressUpdateStockPost = async () => {
    setLoading(true);
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
    } catch (error) {
      console.log('Error updating stock:', error.message);
      Alert.alert('Update stocks', error.message);
    } finally {
      setLoading(false);
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
    try {
      let plantCode = selectedItemStockUpdate?.plantCode;
      const response = await postListingDeleteApi(plantCode);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

      setNextToken('');
      setNextTokenParam('');
      fetchData();
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
    setDeleteModalVisible(true);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
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
            {userInfo.liveFlag != 'No' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('LiveBroadcastScreen')}
                style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
                {/* <Text style={styles.liveTag}>LIVE</Text> */}
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
          tabFilters={FilterTabs}
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
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <SortIcon width={20} height={20}></SortIcon>
              <Text style={globalStyles.textSMGreyDark}>Sort</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('GENUS')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <Text style={globalStyles.textSMGreyDark}>Genus</Text>
              <DownIcon width={20} height={20}></DownIcon>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('VARIEGATION')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <Text style={globalStyles.textSMGreyDark}>Variegation</Text>
              <DownIcon width={20} height={20}></DownIcon>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('LISTINGTYPE')}>
            <View
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
        // stickyHeaderIndices={[0]}
      >
        {loading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}

        <View
          style={{
            backgroundColor: '#fff',
            minHeight: dataTable.length != 0 && screenHeight * 0.9,
          }}>
          {dataTable && dataTable.length > 0 ? (
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
                />
                <TouchableOpacity
                  onPress={() => onPressLoadMore()}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    marginTop: 10,
                    marginBottom: 50,
                  }}>
                  <Text style={globalStyles.textLGAccent}>Load More</Text>
                  <ArrowDownIcon width={25} height={20} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{alignItems: 'center', paddingTop: 80, flex: 1}}>
              <Image
                source={imageMap[normalizeKey(activeTab)]}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          )}

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
            onPressUpdateStockShow={setShowSheetUpdateStocks}
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
                      style={[
                        globalStyles.textLGGreyDark,
                        {paddingBottom: 10},
                      ]}>
                      Pot size: {variation.potSize || 'N/A'}
                    </Text>
                    <Text
                      style={[
                        globalStyles.textLGGreyDark,
                        {paddingBottom: 10},
                      ]}>
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
                  <Text
                    style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                    Pot size: {selectedItemStockUpdate.potSize}
                  </Text>
                  <Text
                    style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
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
              <ScrollView style={{marginHorizontal: 20}}>
                <View>
                  <Text
                    style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
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
                  <Text
                    style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
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
                        style={[
                          globalStyles.textMDWhite,
                          {textAlign: 'center'},
                        ]}>
                        Apply Discount
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </ActionSheet>
        </View>
      </ScrollView>
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
    zIndex: 10,
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
