import React, {useEffect, useState, useLayoutEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {globalStyles} from '../../../assets/styles/styles';
import {getSellDraftListingApi} from '../../../components/Api';

import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

const COLUMN_WIDTH = 150;

const headers = [
  'Listing',
  'Plant Name & Status',
  'Listing Type',
  'Pot Size',
  'Price',
  'Quantity',
];

const ScreenDraftSell = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [nextToken, setNextToken] = useState('');
  const [nextTokenParam, setNextTokenParam] = useState('');
  const isFocused = useIsFocused();
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => alert('Edit Profile')}
          style={{
            borderColor: '#ccc',
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
          }}>
          <SearchIcon width={20} height={20} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [isFocused]);

  const loadListingData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(
      () => getSellDraftListingApi(10, nextTokenParam),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load listings');
    }
    // console.log(res);
    setNextToken(res.nextPageToken);
    setData(
      prev =>
        nextTokenParam
          ? [...prev, ...(res?.listings || [])] // append
          : res?.listings || [], // replace
    );
    // setData(res.listings || []);
  };

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
    console.log(nextToken);
    if (nextToken != nextTokenParam) {
      console.log('click more');
      setNextTokenParam(nextToken);
    }
  };
  // Load more

  return (
    <View style={[styles.mainContent, {paddingTop: insets.top}]}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView style={styles.mainContainer}>
        <ScrollView
          horizontal
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View>
            {/* Header */}
            <View style={[styles.row, {backgroundColor: '#E4E7E9'}]}>
              {headers.map((header, index) => (
                <View
                  key={index + header}
                  style={[
                    styles.cell,
                    index === 0 && {width: 120},
                    index === 1 && {width: 150},
                    index === 2 && {width: 150},
                    index === 3 && {width: 100},
                  ]}>
                  <Text
                    style={[
                      globalStyles.textSMGreyDark,
                      index === 0 ? globalStyles.textBold : {},
                    ]}>
                    {header}
                  </Text>
                </View>
              ))}
            </View>

            {/* Rows */}
            {data.map((item, rowIndex) => (
              <TouchableOpacity
                style={styles.row}
                key={rowIndex}
                onPress={() => {
                  if (item?.listingType == 'Single Plant') {
                    navigation.navigate('ScreenSingleSell', {
                      plantCode: item?.plantCode,
                    });
                  }
                  if (item?.listingType == 'Wholesale') {
                    navigation.navigate('ScreenWholesaleSell', {
                      plantCode: item?.plantCode,
                    });
                  }
                  if (item?.listingType == "Grower's Choice") {
                    navigation.navigate('ScreenGrowersSell', {
                      plantCode: item?.plantCode,
                    });
                  }
                }}>
                {/* Image */}
                <View style={[styles.cell, {width: 120}]}>
                  <Image
                    style={styles.image}
                    source={{
                      uri:
                        item.imagePrimary || 'https://via.placeholder.com/80',
                    }}
                  />
                </View>

                {/* Plant Name & Status */}
                <View style={[styles.cell, {width: 150}]}>
                  <Text
                    style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
                    {item.genus} {item.species}
                  </Text>
                  <Text style={globalStyles.textMDGreyLight}>
                    {item.status || '—'}
                  </Text>
                </View>

                {/* Listing Type */}
                <View
                  style={[styles.cell, {width: 150, alignItems: 'flex-start'}]}>
                  <View style={styles.badgeContainer}>
                    {item.listingType != 'Single Plant' && (
                      <Text
                        style={[
                          styles.badge,
                          {color: '#fff', backgroundColor: '#000'},
                        ]}>
                        {item.listingType}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Pot Size */}
                <View
                  style={[styles.cell, {width: 100, alignItems: 'flex-start'}]}>
                  {(() => {
                    // Initialize an empty array
                    let finalPotSizes = [];

                    // Priority 1: Try from variations
                    if (
                      Array.isArray(item.variations) &&
                      item.variations.length > 0
                    ) {
                      const variation = item.variations[0];

                      if (Array.isArray(variation.potSize)) {
                        finalPotSizes = variation.potSize;
                      } else if (typeof variation.potSize === 'string') {
                        finalPotSizes = [variation.potSize];
                      }
                    }

                    // Priority 2: Fallback to item.potSize
                    if (
                      finalPotSizes.length === 0 &&
                      (Array.isArray(item.potSize) ||
                        typeof item.potSize === 'string')
                    ) {
                      finalPotSizes = Array.isArray(item.potSize)
                        ? item.potSize
                        : [item.potSize];
                    }

                    return finalPotSizes.map((parsePotSize, index2) => (
                      <View
                        key={`${rowIndex}-${index2}`}
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

                {/* Price */}
                {/* <View style={[styles.cell, {width: COLUMN_WIDTH}]}>
                  <Text style={globalStyles.textMDGreyDark}>
                    {item.localCurrencySymbol || '₱'}
                    {item.localPrice != null ? item.localPrice : '0'}
                  </Text>
                </View> */}
                {(() => {
                  let totalLocalPrice = 0;
                  let totalLocalPriceNew = 0;
                  let hasNewPrice = false;
                  let finalCurrencySymbol = item?.localCurrencySymbol || '';

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
                    Array.isArray(item?.variations) &&
                    item?.variations.length > 0
                  ) {
                    item?.variations.forEach(variation => {
                      const localPrice = parseSafeFloat(variation.localPrice);
                      const localPriceNew = isNonEmpty(variation.localPriceNew)
                        ? parseSafeFloat(variation.localPriceNew) !=
                          parseSafeFloat(variation.localPrice)
                          ? parseSafeFloat(variation.localPriceNew)
                          : 0
                        : 0;
                      // console.log(variation);
                      totalLocalPrice += localPrice;

                      if (localPriceNew > 0) {
                        totalLocalPriceNew += localPriceNew;
                        hasNewPrice = true;
                      } else {
                        totalLocalPriceNew += localPrice;
                      }

                      if (variation.localCurrencySymbol) {
                        finalCurrencySymbol = variation.localCurrencySymbol;
                      }
                    });
                  } else {
                    const localPrice = parseSafeFloat(item?.localPrice);
                    const localPriceNew = isNonEmpty(item?.localPriceNew)
                      ? parseSafeFloat(item.localPriceNew) !=
                        parseSafeFloat(item.localPrice)
                        ? parseSafeFloat(item.localPriceNew)
                        : 0
                      : 0;
                    // console.log('Single: ' + JSON.stringify(item?));
                    totalLocalPrice = localPrice;
                    totalLocalPriceNew = localPriceNew;
                    localPriceNew > 0 ? localPriceNew : localPrice;
                    hasNewPrice = localPriceNew > 0;

                    if (item?.localCurrencySymbol) {
                      finalCurrencySymbol = item?.localCurrencySymbol;
                    }
                  }

                  return (
                    <View
                      style={[
                        styles.cell,
                        {width: COLUMN_WIDTH, flexDirection: 'row'},
                      ]}>
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

                {/* Quantity */}
                <View style={[styles.cell, {width: COLUMN_WIDTH}]}>
                  <Text style={globalStyles.textMDGreyDark}>
                    {item.availableQty != null ? item.availableQty : '0'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: COLUMN_WIDTH,
    padding: 10,
    borderColor: '#ccc',
    borderBottomWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
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

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  strikeText: {
    textDecorationLine: 'line-through',
    color: 'black',
  },
});

export default ScreenDraftSell;
