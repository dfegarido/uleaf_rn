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
import ShareIcon from '../../../assets/icons/accent/share-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

import DeliverTableList from './components/DeliverTableList';
const screenHeight = Dimensions.get('window').height;

const headers = [
  'Casualty',
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

const ScreenDeliveryCasualty = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState('option1');
  const isActive = key => active === key;
  const [loading, setLoading] = useState(false);
  const [dataTable, setDataTable] = useState([]);
  const {userInfo} = useContext(AuthContext);

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
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();
  const [dataCount, setDataCount] = useState(0);
  const [search, setSearch] = useState('');

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
          'Casualty',
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

    console.log(res);
    setNextToken(res.nextPageToken);
    setDataCount(res?.count);
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

  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('Searching for:', searchText);
    // trigger your search logic here

    setNextToken('');
    setNextTokenParam('');
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              // padding: 5,
              // backgroundColor: '#fff',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}>
            <LeftIcon width={30} hegiht={30} />
          </TouchableOpacity>
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
          {dataTable.length == 0 ? (
            <View
              style={{
                flex: 1,
                paddingTop: 60,
                alignItems: 'center',
              }}>
              <Image
                source={require('../../../assets/images/delivery-casualty.png')}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          ) : (
            <>
              <View>
                <DeliverTableList
                  headers={headers}
                  orders={dataTable}
                  module={'NOACTION'}
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

export default ScreenDeliveryCasualty;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#FFF',
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
  image: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
});
