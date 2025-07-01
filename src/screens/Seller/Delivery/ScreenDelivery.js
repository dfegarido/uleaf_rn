import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useIsFocused} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import OrderActionSheet from '../Order/components/OrderActionSheet';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

import {
  getOrderListingApi,
  getSortApi,
  getListingTypeApi,
  getDeliveryExportApi,
  postDeliverToHubApi,
} from '../../../components/Api';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import ShareIcon from '../../../assets/icons/accent/share-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

import DeliverTableList from './components/DeliverTableList';
import DeliverActionSheetEdit from './components/DeliverActionSheetEdit';

const screenHeight = Dimensions.get('window').height;

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
  const isActive = key => active === key;
  const [loading, setLoading] = useState(false);
  const [dataTable, setDataTable] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setNextToken('');
    setNextTokenParam('');
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchData();
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
  const [dataCount, setDataCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        Alert.alert('Delivery Listing:', error.message);
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused, isInitialFetchRefresh]);

  const loadListingData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(
      () =>
        getOrderListingApi(
          10,
          reusableSort,
          reusableDate,
          'For Delivery',
          reusableListingType,
          nextTokenParam,
          reusableStartDate,
          reusableEndDate,
        ),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    // console.log(res);
    setSummaryCount(res?.deliveryStatusSummary);
    setNextToken(res.nextPageToken);
    setDataCount(res.count);
    setDataTable(
      prev =>
        nextTokenParam
          ? [...prev, ...(res?.orders || [])] // append
          : res?.orders || [], // replace
    );
  };
  // ✅ Fetch on mount

  // Filters Action Sheet
  const [nextToken, setNextToken] = useState('');
  const [nextTokenParam, setNextTokenParam] = useState('');
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
    setNextToken('');
    setNextTokenParam('');
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
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };
  // Filters Action Sheet

  // Load more
  useEffect(() => {
    if (nextTokenParam) {
      setLoading(true);
      loadListingData();
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

      Alert.alert('Export', 'Delivery list exported successfully!');
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
      setNextToken('');
      setNextTokenParam('');
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
      setNextToken('');
      setNextTokenParam('');
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
      setNextToken('');
      setNextTokenParam('');
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
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
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
            <InputGroupLeftIcon
              IconLeftComponent={SearchIcon}
              placeholder={'Search I Leaf U'}
            />
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <LiveIcon width={40} height={40} />
              {/* <Text style={styles.liveTag}>LIVE</Text> */}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              <AvatarIcon width={40} height={40} />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={[styles.container, {paddingTop: insets.top}]}>
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
                  {summaryCount['For Delivery']}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onPressExport()}
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

          {/* {dataTable.length == 0 ? (
            <View
              style={{
                flex: 1,
                paddingTop: 60,
                alignItems: 'center',
              }}>
              <Image
                source={require('../../../assets/images/orders-delivered.png')}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          ) : ( */}
          <>
            <View>
              <DeliverTableList
                headers={headers}
                orders={dataTable}
                module={'MAIN'}
                navigateToListAction={onPressCheck}
                onEditPressFilter={onEditPressFilter}
                style={{}}
              />
            </View>
            {dataCount >= 10 && (
              <TouchableOpacity
                onPress={() => onPressLoadMore()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: 300,
                  marginBottom: 50,
                }}>
                <Text style={globalStyles.textLGAccent}>Load More</Text>
                <ArrowDownIcon width={25} height={20} />
              </TouchableOpacity>
            )}
          </>
          {/* )} */}
        </View>
      </ScrollView>

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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
