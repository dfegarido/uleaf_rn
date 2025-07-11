import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  RefreshControl,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import BadgeWithTransparentNotch from '../../../components/DiscountBadge/BadgeWithTransparentNotch ';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {useIsFocused} from '@react-navigation/native';

import LiveIcon from '../../../assets/images/live.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import PinAccentIcon from '../../../assets/icons/accent/pin.svg';
import HeartIcon from '../../../assets/icons/greydark/heart-solid.svg';

import {
  getSortApi,
  getGenusApi,
  getVariegationApi,
  getListingTypeApi,
  getManageListingApi,
} from '../../../components/Api';

const screenHeight = Dimensions.get('window').height;

const data = [
  {
    id: 1,
    image: '',
    plantName: 'Ficus Irata',
    subPlantName: 'Albo Variegata',
    listingCode: 'L1',
    listingType: 'Single Plant',
    potSize: ['2"'],
    price: '$299',
    discountPercent: '',
    discountPrice: '',
    heartCount: '5.3k',
    isPin: 1,
  },
  {
    id: 2,
    image: '',
    plantName: 'Aloe vera',
    subPlantName: 'Albo Variegata',
    listingCode: 'L2',
    listingType: "Grower's choice",
    potSize: ['2"-4"', '5"-8"'],
    price: '$299',
    discountPercent: '15% OFF',
    discountPrice: '$24',
    heartCount: '5.3k',
    isPin: 0,
  },
  {
    id: 3,
    image: '',
    plantName: 'Aloe vera ',
    subPlantName: 'Albo Variegata',
    listingCode: 'L3',
    listingType: 'Wholesale',
    potSize: ['2"-4"', '5"-8"'],
    price: '$299',
    discountPercent: '',
    discountPrice: '',
    heartCount: '5.3k',
    isPin: 0,
  },
];

const ScreenMyStore = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const onPressItem = ({data}) => {
    navigation.navigate('ScreenMyStoreDetail', data);
  };

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const [dataTable, setDataTable] = useState([]);
  const [loading, setLoading] = useState(false);

  // For reusable action sheet
  const [reusableSort, setReusableSort] = useState('');
  const [reusableGenus, setReusableGenus] = useState([]);
  const [reusableVariegation, setReusableVariegation] = useState([]);
  const [reusableListingType, setReusableListingType] = useState([]);
  const handleFilterView = () => {
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };
  // For reusable action sheet

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
      status,
      discount,
      limit,
      plant,
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
    // console.log(dataTable);
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
        'Active',
        false,
        10,
        search,
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

  // For dropdown
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={[styles.stickyHeader]}>
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
                style={[
                  styles.iconButton,
                  {
                    borderWidth: 1,
                    borderColor: '#CDD3D4',
                    padding: 10,
                    borderRadius: 10,
                  },
                ]}>
                <PinIcon width={20} height={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#fff',
            minHeight: screenHeight * 0.9,
          }}>
          {/* Filter Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{flexGrow: 0, paddingVertical: 10, paddingHorizontal: 20}} // ✅ prevents extra vertical space
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
          {/* Filter Cards */}
          {/* Contents */}
          <View style={styles.contents}>
            <View style={{paddingBottom: 10}}>
              <Text
                style={[globalStyles.textSMGreyLight, {textAlign: 'right'}]}>
                632 plant(s)
              </Text>

              {/* List */}
              <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                {data.map((dataparse, index) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'column',
                      padding: 5,
                      width: '50%',
                    }}
                    onPress={() => onPressItem({data: dataparse})}
                    key={index}>
                    <View>
                      <View>
                        <Image
                          style={styles.image}
                          source={{
                            uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                          }}
                        />
                        {dataparse.discountPercent != '' && (
                          <View style={{position: 'absolute', bottom: 10}}>
                            <View style={{backgroundColor: 'transparent'}}>
                              <BadgeWithTransparentNotch
                                borderRadius={10}
                                text={dataparse.discountPercent}
                                height={30}
                                width={80}
                              />
                            </View>
                          </View>
                        )}
                        <View
                          style={{position: 'absolute', bottom: 10, right: 5}}>
                          <View
                            style={{
                              backgroundColor: '#F5F6F6',
                              padding: 5,
                              borderRadius: 10,
                              flexDirection: 'row',
                            }}>
                            <HeartIcon width={20} height={20}></HeartIcon>
                            <Text style={globalStyles.textSMGreyDark}>
                              {dataparse.heartCount}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}>
                        <View style={{width: '50%'}}>
                          <Text style={globalStyles.textMDGreyDark}>
                            {dataparse.plantName}
                          </Text>
                        </View>

                        <TouchableOpacity>
                          {dataparse.isPin == 1 ? (
                            <PinAccentIcon width={20} height={20} />
                          ) : (
                            <PinIcon width={20} height={20} />
                          )}
                        </TouchableOpacity>
                      </View>

                      <Text
                        style={[
                          globalStyles.textMDGreyLight,
                          {paddingTop: 10},
                        ]}>
                        {dataparse.subPlantName}
                      </Text>
                      <View style={{flexDirection: 'row', paddingTop: 10}}>
                        {dataparse.potSize.map((parsePotSize, index2) => (
                          <View
                            style={[styles.badgeContainer]}
                            key={index + index2}>
                            <Text
                              style={[
                                styles.badge,
                                globalStyles.textMDGreyDark,
                                {
                                  backgroundColor: '#E4E7E9',
                                },
                              ]}>
                              {parsePotSize}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={{flexDirection: 'row'}}>
                        {dataparse.discountPrice != '' ? (
                          <Text
                            style={[
                              globalStyles.textMDAccent,
                              {
                                paddingTop: 10,
                                paddingRight: 10,
                                fontWeight: 'bold',
                              },
                            ]}>
                            {dataparse.price}
                          </Text>
                        ) : (
                          <Text
                            style={[
                              globalStyles.textMDGreyDark,
                              {
                                paddingTop: 10,
                                paddingRight: 10,
                                fontWeight: 'bold',
                              },
                            ]}>
                            {dataparse.price}
                          </Text>
                        )}

                        <Text
                          style={[
                            globalStyles.textMDGreyDark,
                            styles.strikeText,
                            {paddingTop: 10},
                          ]}>
                          {dataparse.discountPrice}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreenMyStore;

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
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    minHeight: screenHeight,
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
});
