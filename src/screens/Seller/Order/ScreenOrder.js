import React, {useEffect, useState, useContext} from 'react';
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
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {globalStyles} from '../../../assets/styles/styles';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import OrderActionSheet from './components/OrderActionSheet';
import {InputSearch} from '../../../components/InputGroup/Left';
import {AuthContext} from '../../../auth/AuthProvider';

import {
  getOrderListingApi,
  getSortApi,
  getListingTypeApi,
} from '../../../components/Api';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

import OrderTableList from './components/OrderTableList';

const screenHeight = Dimensions.get('window').height;

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

  // ✅ Fetch on mount
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();
  const [dataCount, setDataCount] = useState(0);
  const [search, setSearch] = useState('');

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setRefreshing(false);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
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
          active,
          reusableListingType,
          nextTokenParam,
          reusableStartDate,
          reusableEndDate,
          search,
        ),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    console.log(res.orders);
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

  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('Searching for:', searchText);
    // trigger your search logic here

    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const onPressFilterTabs = pressCode => {
    setActive(pressCode);
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
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
            {/* <InputGroupLeftIcon
              IconLeftComponent={SearchIcon}
              placeholder={'Search I Leaf U'}
            /> */}
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
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              {userInfo.profileImage != '' ? (
                <Image
                  source={{uri: userInfo.profileImage}}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <AvatarIcon width={40} height={40} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.containerTab}>
        <TouchableOpacity
          style={
            isActive('For Delivery')
              ? styles.buttonActive
              : styles.buttonInactive
          }
          onPress={() => onPressFilterTabs('For Delivery')}>
          <Text style={globalStyles.textSMGreyDark}>For Delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            isActive('Delivered') ? styles.buttonActive : styles.buttonInactive
          }
          onPress={() => onPressFilterTabs('Delivered')}>
          <Text style={globalStyles.textSMGreyDark}>Delivered</Text>
        </TouchableOpacity>
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
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        <View
          style={{
            backgroundColor: '#fff',
            minHeight: dataTable.length != 0 && screenHeight * 0.9,
            // paddingHorizontal: 20,
          }}>
          {dataTable.length == 0 ? (
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
          ) : (
            <>
              <View>
                <OrderTableList
                  headers={headers}
                  orders={dataTable}
                  style={{backgroundColor: 'red'}}
                />
              </View>
              {dataCount == 10 && (
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
          )}
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
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
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
