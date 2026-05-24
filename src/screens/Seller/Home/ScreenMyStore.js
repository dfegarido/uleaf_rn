import React, {useCallback, useEffect, useState, useContext, useRef} from 'react';
import { View,
  Text,
  RefreshControl,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
  Modal,
  ActivityIndicator} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import BadgeWithTransparentNotch from '../../../components/DiscountBadge/BadgeWithTransparentNotch ';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {useIsFocused} from '@react-navigation/native';
import {InputSearch} from '../../../components/InputGroup/Left';
import {AuthContext} from '../../../auth/AuthProvider';
import {numberToCurrency} from '../../../utils/numberToCurrency';

import LiveIcon from '../../../assets/images/live.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import PinAccentIcon from '../../../assets/icons/accent/pin.svg';

import { getGenusApi,
  getVariegationApi,
  getListingTypeApi,
  getSortStoreApi,
} from '../../../components/Api';
import {auth} from '../../../../firebase';
import {
  fetchSellerListingsFromFirestore,
  getListingPriceInfo,
  getListingTypeDisplayLabel,
  isListingPinned,
  prepareMyStoreActiveListings,
} from '../../../utils/fetchSellerListingsFromFirestore';

const screenHeight = Dimensions.get('window').height;
const PAGE_SIZE = 10;

const CARD_GRADIENT_OPACITIES = [0, 0.08, 0.18, 0.32, 0.48, 0.62];

const CardBottomGradient = () => (
  <View style={{height: 56}}>
    {CARD_GRADIENT_OPACITIES.map((opacity, index) => (
      <View
        key={index}
        style={{flex: 1, backgroundColor: `rgba(0,0,0,${opacity})`}}
      />
    ))}
  </View>
);

const ScreenMyStore = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const {userInfo} = useContext(AuthContext);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const [dataTable, setDataTable] = useState([]);
  const [loading, setLoading] = useState(false);

  // For reusable action sheet
  const [reusableSort, setReusableSort] = useState('');
  const [reusableGenus, setReusableGenus] = useState([]);
  const [reusableVariegation, setReusableVariegation] = useState([]);
  const [reusableListingType, setReusableListingType] = useState([]);
  // List table
  const [refreshing, setRefreshing] = useState(false);
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const allListingsRef = useRef([]);
  const displayListingsRef = useRef([]);
  const [pinSearch, setPinSearch] = useState(false);

  const getSellerUid = () =>
    userInfo?.uid ||
    userInfo?.id ||
    userInfo?.user?.uid ||
    userInfo?.user?.id ||
    auth.currentUser?.uid;

  const applyFilteredListings = prepared => {
    displayListingsRef.current = prepared;
    setTotalDataCount(prepared.length);
    setDataTable(prepared.slice(0, PAGE_SIZE));
    setHasMore(prepared.length > PAGE_SIZE);
  };

  const applyFiltersFromCache = useCallback(
    (overrides = {}) => {
      const prepared = prepareMyStoreActiveListings(allListingsRef.current, {
        sortBy:
          overrides.sortBy !== undefined ? overrides.sortBy : reusableSort,
        genus: overrides.genus !== undefined ? overrides.genus : reusableGenus,
        variegation:
          overrides.variegation !== undefined
            ? overrides.variegation
            : reusableVariegation,
        listingType:
          overrides.listingType !== undefined
            ? overrides.listingType
            : reusableListingType,
        search: overrides.search !== undefined ? overrides.search : search,
        pinOnly:
          overrides.pinOnly !== undefined ? overrides.pinOnly : pinSearch,
      });
      applyFilteredListings(prepared);
    },
    [
      reusableSort,
      reusableGenus,
      reusableVariegation,
      reusableListingType,
      search,
      pinSearch,
    ],
  );

  const fetchData = useCallback(
    async ({forceRefresh = false, filterOverrides = {}} = {}) => {
      try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) {
          throw new Error('No internet connection.');
        }

        const uid = getSellerUid();
        if (!uid) {
          allListingsRef.current = [];
          applyFilteredListings([]);
          return;
        }

        if (forceRefresh || allListingsRef.current.length === 0) {
          const {listings} = await fetchSellerListingsFromFirestore(uid);
          allListingsRef.current = listings;
        }

        applyFiltersFromCache(filterOverrides);
      } catch (error) {
        console.log('Error in fetchData:', error.message);
        Alert.alert('Listing', error.message);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [applyFiltersFromCache],
  );

  const isFilterActive = filterLabel => {
    switch (filterLabel) {
      case 'Sort':
        return Boolean(reusableSort && String(reusableSort).trim());
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

  const clearSpecificFilter = filterLabel => {
    switch (filterLabel) {
      case 'Sort':
        setReusableSort('');
        applyFiltersFromCache({sortBy: ''});
        break;
      case 'Genus':
        setReusableGenus([]);
        applyFiltersFromCache({genus: []});
        break;
      case 'Variegation':
        setReusableVariegation([]);
        applyFiltersFromCache({variegation: []});
        break;
      case 'Listing Type':
        setReusableListingType([]);
        applyFiltersFromCache({listingType: []});
        break;
      default:
        break;
    }
  };

  const handleModalReset = () => {
    switch (code) {
      case 'SORT':
        setReusableSort('');
        applyFiltersFromCache({sortBy: ''});
        break;
      case 'GENUS':
        setReusableGenus([]);
        applyFiltersFromCache({genus: []});
        break;
      case 'VARIEGATION':
        setReusableVariegation([]);
        applyFiltersFromCache({variegation: []});
        break;
      case 'LISTINGTYPE':
        setReusableListingType([]);
        applyFiltersFromCache({listingType: []});
        break;
      default:
        break;
    }
    setShowSheet(false);
  };

  const onPressFilter = pressCode => {
    const filterLabelMap = {
      SORT: 'Sort',
      GENUS: 'Genus',
      VARIEGATION: 'Variegation',
      LISTINGTYPE: 'Listing Type',
    };
    const filterLabel = filterLabelMap[pressCode];

    if (filterLabel && isFilterActive(filterLabel)) {
      clearSpecificFilter(filterLabel);
      return;
    }

    setCode(pressCode);
    setShowSheet(true);
  };

  const handleListingPress = useCallback(
    data => {
      const plantCode = data?.plantCode || data?.id;
      if (!plantCode) {
        Alert.alert('Listing', 'This listing is missing a plant code.');
        return;
      }
      navigation.navigate('ScreenListingDetail', {
        plantCode,
        onGoBack: () => {
          allListingsRef.current = [];
          setIsInitialFetchRefresh(prev => !prev);
        },
      });
    },
    [navigation],
  );

  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    setLoading(true);
    fetchData();
  }, [isInitialFetchRefresh, isFocused, fetchData]);

  useEffect(() => {
    if (!isFocused || allListingsRef.current.length === 0) return;
    applyFiltersFromCache();
  }, [isFocused, applyFiltersFromCache]);

  const onRefresh = () => {
    setRefreshing(true);
    allListingsRef.current = [];
    fetchData({forceRefresh: true});
  };

  const handleFilterView = () => {
    setShowSheet(false);
    if (allListingsRef.current.length > 0) {
      applyFiltersFromCache();
      return;
    }
    setIsInitialFetchRefresh(prev => !prev);
  };

  const onPressPinSearch = paramPinSearch => {
    setPinSearch(paramPinSearch);
    const pinOverride = {pinOnly: paramPinSearch};
    if (allListingsRef.current.length > 0) {
      applyFiltersFromCache(pinOverride);
      return;
    }
    setLoading(true);
    fetchData({forceRefresh: true, filterOverrides: pinOverride});
  };

  const handleSearchSubmit = e => {
    const searchText =
      typeof e?.nativeEvent?.text === 'string' ? e.nativeEvent.text : search;
    setSearch(searchText);
    if (allListingsRef.current.length > 0) {
      applyFiltersFromCache({search: searchText});
    } else {
      setIsInitialFetchRefresh(prev => !prev);
    }
  };

  const handleSearchChange = text => {
    setSearch(text);
    if (text === '' && allListingsRef.current.length > 0) {
      applyFiltersFromCache({search: ''});
    }
  };

  const loadMoreListings = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setDataTable(prev => {
      const next = displayListingsRef.current.slice(0, prev.length + PAGE_SIZE);
      setTimeout(() => {
        setHasMore(next.length < displayListingsRef.current.length);
        setLoadingMore(false);
      }, 0);
      return next;
    });
  }, [hasMore, loadingMore]);

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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}

      <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <LeftIcon width={30} height={30} />
          </TouchableOpacity>

          <View style={styles.searchField}>
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              showClear={true}
            />
          </View>

          <View style={styles.headerIcons}>
            {userInfo?.liveFlag != 'No' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('LiveSellerScreen')}
                style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.iconButton,
                styles.pinButton,
                pinSearch && styles.pinButtonActive,
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}>
          <TouchableOpacity onPress={() => onPressFilter('SORT')}>
            <View
              style={[
                styles.filterChip,
                isFilterActive('Sort') && styles.filterChipActive,
              ]}>
              <SortIcon width={20} height={20} />
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  isFilterActive('Sort') && styles.filterChipTextActive,
                ]}>
                Sort
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('GENUS')}>
            <View
              style={[
                styles.filterChip,
                isFilterActive('Genus') && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  isFilterActive('Genus') && styles.filterChipTextActive,
                ]}>
                Genus
              </Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('VARIEGATION')}>
            <View
              style={[
                styles.filterChip,
                isFilterActive('Variegation') && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  isFilterActive('Variegation') && styles.filterChipTextActive,
                ]}>
                Variegation
              </Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('LISTINGTYPE')}>
            <View
              style={[
                styles.filterChip,
                styles.filterChipLast,
                isFilterActive('Listing Type') && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  isFilterActive('Listing Type') && styles.filterChipTextActive,
                ]}>
                Listing Type
              </Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contents */}
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{
          marginBottom: insets.bottom + 30,
        }}
        scrollEventThrottle={400}
        onScroll={({nativeEvent}) => {
          const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 200 &&
            hasMore &&
            !loadingMore
          ) {
            loadMoreListings();
          }
        }}
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
              {dataTable.length == 0 && (
                <View style={{alignItems: 'center', paddingTop: 80, flex: 1}}>
                  <Image
                    source={require('../../../assets/images/mystore-empty.png')}
                    style={{width: 300, height: 300, resizeMode: 'contain'}}
                  />
                </View>
              )}

              <View style={styles.cardGrid}>
                {dataTable.map((dataparse, index) => {
                  const plantTitle =
                    `${dataparse.genus ?? ''} ${dataparse.species ?? ''}`.trim() ||
                    'Unknown Plant';
                  const plantSubtitle =
                    dataparse.variegation || dataparse.mutation || '';
                  const {
                    totalLocalPrice,
                    totalLocalPriceNew,
                    hasNewPrice,
                    finalCurrencySymbol,
                  } = getListingPriceInfo(dataparse);
                  const listingTypeLabel = getListingTypeDisplayLabel(dataparse);

                  return (
                    <TouchableOpacity
                      key={dataparse.plantCode || dataparse.id || String(index)}
                      style={styles.cardWrapper}
                      activeOpacity={0.85}
                      onPress={() => handleListingPress(dataparse)}>
                      <View style={styles.card}>
                        <Image
                          style={styles.cardImage}
                          source={{
                            uri:
                              dataparse.imagePrimary ||
                              'https://via.placeholder.com/350x150.png?text=No+Image',
                          }}
                          resizeMode="cover"
                        />

                        <View style={styles.cardTopOverlay}>
                          <View style={styles.cardTopOverlayLeft}>
                            {isListingPinned(dataparse) ? (
                              <View style={styles.pinnedBadge}>
                                <PinAccentIcon width={16} height={16} />
                              </View>
                            ) : null}
                            <View style={styles.listingTypeBadge}>
                              <Text
                                style={styles.listingTypeBadgeText}
                                numberOfLines={1}>
                                {listingTypeLabel}
                              </Text>
                            </View>
                          </View>
                          {dataparse.discountPercent ? (
                            <BadgeWithTransparentNotch
                              borderRadius={10}
                              text={dataparse.discountPercent + '% OFF'}
                              height={30}
                              width={80}
                            />
                          ) : (
                            <View />
                          )}
                        </View>

                        <View style={styles.cardBottomOverlay}>
                          <CardBottomGradient />
                          <View style={styles.cardDetailsContent}>
                            <Text style={styles.overlayTitle} numberOfLines={2}>
                              {plantTitle}
                            </Text>
                            {plantSubtitle ? (
                              <Text
                                style={styles.overlaySubtitle}
                                numberOfLines={1}>
                                {plantSubtitle}
                              </Text>
                            ) : null}
                            <View style={styles.overlayPriceRow}>
                              {hasNewPrice ? (
                                <>
                                  <Text
                                    style={[
                                      globalStyles.textMDAccent,
                                      styles.overlayPrice,
                                    ]}>
                                    {finalCurrencySymbol}
                                    {numberToCurrency(
                                      totalLocalPriceNew.toFixed(2),
                                    )}
                                  </Text>
                                  <Text style={styles.overlayStrikeText}>
                                    {finalCurrencySymbol}
                                    {numberToCurrency(totalLocalPrice.toFixed(2))}
                                  </Text>
                                </>
                              ) : (
                                <Text
                                  style={[
                                    globalStyles.textMDAccent,
                                    styles.overlayPrice,
                                  ]}>
                                  {finalCurrencySymbol}
                                  {numberToCurrency(totalLocalPrice.toFixed(2))}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
          {loadingMore && (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color="#699E73" />
            </View>
          )}
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
        clearFilters={handleModalReset}
      />
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
  backButton: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    marginRight: 8,
  },
  pinButton: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    padding: 10,
    borderRadius: 10,
  },
  pinButtonActive: {
    borderColor: '#23C16B',
    backgroundColor: '#E8F5E9',
  },
  cardTopOverlayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pinnedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    padding: 4,
  },
  filterScroll: {
    flexGrow: 0,
    paddingTop: 8,
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterChipActive: {
    borderColor: '#23C16B',
    backgroundColor: '#E8F5E9',
  },
  filterChipTextActive: {
    color: '#23C16B',
    fontWeight: '600',
  },
  filterChipLast: {
    marginRight: 30,
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
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    minHeight: screenHeight,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#E4E7E9',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#E4E7E9',
  },
  cardTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 8,
    zIndex: 2,
  },
  listingTypeBadge: {
    backgroundColor: 'rgba(32, 35, 37, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '70%',
  },
  listingTypeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  cardDetailsContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  overlaySubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  overlayPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  overlayPrice: {
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  overlayStrikeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    textDecorationLine: 'line-through',
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
