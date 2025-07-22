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
  Modal,
  ActivityIndicator,
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
import {InputSearch} from '../../../components/InputGroup/Left';

import LiveIcon from '../../../assets/images/live.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import PinAccentIcon from '../../../assets/icons/accent/pin.svg';
import HeartIcon from '../../../assets/icons/greydark/heart-solid.svg';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

import {
  getSortApi,
  getGenusApi,
  getVariegationApi,
  getListingTypeApi,
  getManageListingApi,
  postListingPinActionApi,
  getSortStoreApi,
} from '../../../components/Api';

const screenHeight = Dimensions.get('window').height;

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
  const [totalDataCount, setTotalDataCount] = useState(0);

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
      status,
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
    setTotalDataCount(getManageListingApiData?.total);
    // setDataTable(getManageListingApiData?.listings || []);
    setDataTable(
      prev =>
        nextTokenParam
          ? [...prev, ...(getManageListingApiData?.listings || [])] // append
          : getManageListingApiData?.listings || [], // replace
    );
    console.log(dataTable?.variations);
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
      console.log('click more');
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

    const res = await retryAsync(() => getSortStoreApi(), 3, 1000);

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

  // Pin Action
  const onPressTableListPin = async (plantCode, pinTag) => {
    setLoading(true);
    try {
      const updatedPinTag = !pinTag;

      const response = await postListingPinActionApi(plantCode, updatedPinTag);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

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
  // Pin Action

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
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true} // shows an 'X' icon to clear
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
      </View>
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
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View
          style={{
            backgroundColor: '#fff',
            minHeight: screenHeight * 0.9,
          }}>
          {/* Contents */}
          <View style={styles.contents}>
            <View style={{paddingBottom: 10}}>
              <Text
                style={[globalStyles.textSMGreyLight, {textAlign: 'right'}]}>
                {totalDataCount} plant(s)
              </Text>

              {/* List */}
              <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                {dataTable.map((dataparse, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      flexDirection: 'column',
                      padding: 5,
                      width: '50%',
                    }}
                    onPress={() => onPressItem({data: dataparse})}>
                    <View>
                      {/* Image + Discount + Heart */}
                      <View style={{position: 'relative'}}>
                        <Image
                          style={styles.image}
                          source={{
                            uri:
                              dataparse.imagePrimary ||
                              'https://via.placeholder.com/350x150.png?text=No+Image',
                          }}
                          resizeMode="cover"
                        />

                        {/* Discount Badge */}
                        {dataparse.discountPercent ? (
                          <View
                            style={{position: 'absolute', bottom: 10, left: 5}}>
                            <BadgeWithTransparentNotch
                              borderRadius={10}
                              text={dataparse.discountPercent + '% OFF'}
                              height={30}
                              width={80}
                            />
                          </View>
                        ) : null}

                        {/* Heart Count */}
                        <View
                          style={{position: 'absolute', bottom: 10, right: 5}}>
                          <View
                            style={{
                              backgroundColor: '#F5F6F6',
                              padding: 5,
                              borderRadius: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}>
                            <HeartIcon width={20} height={20} />
                            <Text style={globalStyles.textSMGreyDark}>
                              {dataparse.wishListCount ?? 0}
                            </Text>
                          </View>
                        </View>

                        {/* Listing Type */}
                        {dataparse.listingType != 'Single Plant' ? (
                          <View
                            style={{position: 'absolute', top: 10, left: 5}}>
                            <View
                              style={{
                                backgroundColor: '#202325',
                                padding: 5,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                              <Text style={globalStyles.textSMWhite}>
                                {dataparse.listingType ?? ''}
                              </Text>
                            </View>
                          </View>
                        ) : null}
                      </View>

                      {/* Plant Name + Pin */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 8,
                        }}>
                        <Text style={[globalStyles.textMDGreyDark, {flex: 1}]}>
                          {`${dataparse.genus ?? ''} ${
                            dataparse.species ?? ''
                          }`}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            onPressTableListPin(
                              dataparse.plantCode,
                              dataparse.pinTag,
                            )
                          }>
                          {dataparse.pinTag ? (
                            <PinAccentIcon width={20} height={20} />
                          ) : (
                            <PinIcon width={20} height={20} />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Sub Plant Name */}
                      <Text
                        style={[globalStyles.textMDGreyLight, {paddingTop: 4}]}>
                        {dataparse.variegation || dataparse.mutation || ''}
                      </Text>

                      {/* Pot Sizes */}
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          marginTop: 6,
                        }}>
                        {(() => {
                          // Initialize an empty array
                          let finalPotSizes = [];

                          // Priority 1: Try from variations
                          if (
                            Array.isArray(dataparse.variations) &&
                            dataparse.variations.length > 0
                          ) {
                            const variation = dataparse.variations[0];

                            if (Array.isArray(variation.potSize)) {
                              finalPotSizes = variation.potSize;
                            } else if (typeof variation.potSize === 'string') {
                              finalPotSizes = [variation.potSize];
                            }
                          }

                          // Priority 2: Fallback to dataparse.potSize
                          if (
                            finalPotSizes.length === 0 &&
                            (Array.isArray(dataparse.potSize) ||
                              typeof dataparse.potSize === 'string')
                          ) {
                            finalPotSizes = Array.isArray(dataparse.potSize)
                              ? dataparse.potSize
                              : [dataparse.potSize];
                          }

                          return finalPotSizes.map((parsePotSize, index2) => (
                            <View
                              key={`${index}-${index2}`}
                              style={[
                                styles.badgeContainer,
                                {marginRight: 4, marginBottom: 4},
                              ]}>
                              <Text
                                style={[
                                  styles.badge,
                                  globalStyles.textMDGreyDark,
                                  {backgroundColor: '#E4E7E9'},
                                ]}>
                                {parsePotSize}
                              </Text>
                            </View>
                          ));
                        })()}
                      </View>

                      {/* Price + Strike-through if discounted */}

                      {(() => {
                        let totalLocalPrice = 0;
                        let totalLocalPriceNew = 0;
                        let hasNewPrice = false;
                        let finalCurrencySymbol =
                          dataparse?.localCurrencySymbol || '';

                        const parseSafeFloat = val => {
                          const num = parseFloat(val);
                          return isNaN(num) ? 0 : num;
                        };

                        const isNonEmpty = val =>
                          val !== null &&
                          val !== undefined &&
                          (typeof val === 'number' ||
                            (typeof val === 'string' && val.trim() !== ''));

                        if (
                          Array.isArray(dataparse?.variations) &&
                          dataparse?.variations.length > 0
                        ) {
                          dataparse?.variations.forEach(variation => {
                            const localPrice = parseSafeFloat(
                              variation.localPrice,
                            );
                            const localPriceNew = isNonEmpty(
                              variation.localPriceNew,
                            )
                              ? parseSafeFloat(variation.localPriceNew) !=
                                parseSafeFloat(variation.localPrice)
                                ? parseSafeFloat(variation.localPriceNew)
                                : 0
                              : 0;
                            console.log(variation);
                            totalLocalPrice += localPrice;
                            if (localPriceNew > 0) {
                              totalLocalPriceNew += localPriceNew;
                              hasNewPrice = true;
                            } else {
                              totalLocalPriceNew += localPrice;
                            }

                            if (variation.localCurrencySymbol) {
                              finalCurrencySymbol =
                                variation.localCurrencySymbol;
                            }
                          });
                        } else {
                          const localPrice = parseSafeFloat(
                            dataparse?.localPrice,
                          );
                          const localPriceNew = isNonEmpty(
                            dataparse?.localPriceNew,
                          )
                            ? parseSafeFloat(dataparse?.localPriceNew)
                            : 0;

                          totalLocalPrice = localPrice;
                          totalLocalPriceNew = localPriceNew;
                          localPriceNew > 0 ? localPriceNew : localPrice;
                          hasNewPrice = localPriceNew > 0;

                          if (dataparse?.localCurrencySymbol) {
                            finalCurrencySymbol =
                              dataparse?.localCurrencySymbol;
                          }
                        }

                        return (
                          <View style={[styles.cell, {flexDirection: 'row'}]}>
                            {hasNewPrice ? (
                              <>
                                <Text
                                  style={[
                                    globalStyles.textMDAccent,
                                    {paddingRight: 10},
                                  ]}>
                                  {finalCurrencySymbol}
                                  {totalLocalPriceNew.toFixed(2)}
                                </Text>
                                <Text
                                  style={[
                                    styles.strikeText,
                                    globalStyles.textMDGreyLight,
                                  ]}>
                                  {finalCurrencySymbol}
                                  {totalLocalPrice.toFixed(2)}
                                </Text>
                              </>
                            ) : (
                              <Text style={globalStyles.textMDGreyLight}>
                                {finalCurrencySymbol}
                                {totalLocalPrice.toFixed(2)}
                              </Text>
                            )}
                          </View>
                        );
                      })()}

                      {/* <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={[
                            dataparse.discountPrice
                              ? globalStyles.textMDAccent
                              : globalStyles.textMDGreyDark,
                            {
                              paddingRight: 10,
                              fontWeight: 'bold',
                            },
                          ]}>
                          {dataparse.localCurrencySymbol}
                          {dataparse.localPrice?.toFixed(2) ?? '0.00'}
                        </Text>

                        {!isNaN(parseFloat(dataparse.discountPrice)) ? (
                          <Text
                            style={[
                              globalStyles.textMDGreyDark,
                              styles.strikeText,
                            ]}>
                            {dataparse.localCurrencySymbol}
                            {parseFloat(dataparse.discountPrice).toFixed(2)}
                          </Text>
                        ) : null}
                      </View> */}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
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

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
