import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {numberToCurrency} from '../../../utils/numberToCurrency';

import {
  getListingDetails,
  postListingPinActionApi,
} from '../../../components/Api';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import HeartIcon from '../../../assets/icons/greylight/heart-regular.svg';
import HeartListIcon from '../../../assets/icons/greylight/list-heart.svg';
import QuestionIcon from '../../../assets/icons/greylight/question-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin-light.svg';
import InchesIcon from '../../../assets/icons/greylight/inches.svg';
import CopyIcon from '../../../assets/icons/greylight/copy-regular.svg';
import PinAccentIcon from '../../../assets/icons/accent/pin.svg';

import BackgroundCarousel from '../../../components/BackgroundCarousel';

import {globalStyles} from '../../../assets/styles/styles';

const images = [
  require('../../../assets/images/bigplant.png'),
  require('../../../assets/images/bigplant.png'),
  require('../../../assets/images/bigplant.png'),
];

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenMyStoreDetail = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [listingData, setListingData] = useState(null);

  const {plantCode} = route.params;

  // ✅ Fetch on mount
  const isFocused = useIsFocused();
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData(plantCode);
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [plantCode, isFocused]);

  const loadListingData = async plantCode => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log(plantCode);

    const res = await retryAsync(() => getListingDetails(plantCode), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    console.log(res.data);
    setListingData(res.data);
  };
  // ✅ Fetch on mount

  // Pin Action
  const onPressTableListPin = async (plantCode, pinTag) => {
    setLoading(true);
    try {
      const updatedPinTag = !pinTag;

      const response = await postListingPinActionApi(plantCode, updatedPinTag);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

      await loadListingData(plantCode);
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

      {/* Fullscreen Background Carousel */}
      <View style={StyleSheet.absoluteFill}>
        <BackgroundCarousel
          images={listingData?.imageCollection}
          width={screenWidth}
          height={screenHeight * 0.5}
        />
      </View>
      {/* Fullscreen Background Carousel */}

      {/* Foreground ScrollView Content */}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top, marginBottom: 55}]}
        stickyHeaderIndices={[0]}>
        {/* Sticky Header */}
        <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.iconButton,
                {
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 5,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                },
              ]}>
              <LeftIcon width={30} height={30} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Top blocker area — allows carousel to be visible */}
        <View style={{height: screenHeight * 0.38}} />

        {/* Foreground Content */}
        <View style={styles.contents}>
          {/* Main Information */}
          <View
            style={{
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingBottom: 20,
            }}>
            <View style={[{flexDirection: 'column'}, {paddingHorizontal: 20}]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={globalStyles.textXLGreyDark}>
                  {listingData?.genus} {listingData?.species}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={globalStyles.textMDGreyDark}>
                  {listingData?.variegation}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View style={[{flexDirection: 'row'}]}>
                  <Text style={[globalStyles.textMDGreyLight]}>Code: </Text>
                  <Text style={globalStyles.textMDGreyDark}>
                    {listingData?.plantCode}
                  </Text>
                  <CopyIcon width={20} height={20} />
                </View>
                {listingData?.listingType != 'Single Plant' && (
                  <View
                    style={{
                      backgroundColor: '#202325',
                      padding: 5,
                      borderRadius: 10,
                    }}>
                    <Text style={{color: '#fff'}}>
                      {listingData?.listingType}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {/* Main Information */}

          {/* Count Information */}
          <View
            style={{
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingVertical: 10,
            }}>
            <View
              style={[
                {
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              ]}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <HeartIcon
                  widht={30}
                  height={30}
                  style={{marginRight: 5}}></HeartIcon>
                <Text
                  style={[globalStyles.textMDGreyLight, {paddingRight: 20}]}>
                  {listingData?.loveCount ?? 0}
                </Text>
                <HeartListIcon
                  widht={25}
                  height={25}
                  style={{marginRight: 2}}></HeartListIcon>
                <Text
                  style={[globalStyles.textMDGreyLight, {paddingRight: 10}]}>
                  {listingData?.wishListCount ?? 0}
                </Text>
                <QuestionIcon widht={30} height={30}></QuestionIcon>
              </View>
              <TouchableOpacity
                style={{flexDirection: 'row'}}
                onPress={() =>
                  onPressTableListPin(listingData.plantCode, listingData.pinTag)
                }>
                {listingData?.pinTag ? (
                  <PinAccentIcon width={25} height={25} />
                ) : (
                  <PinIcon width={25} height={25} />
                )}
                <Text
                  style={[
                    globalStyles.textMDGreyLight,
                    {paddingLeft: 5, paddingRight: 10},
                  ]}>
                  Pin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Count Information */}

          {/* Price + Strike-through if discounted */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 20,
              paddingHorizontal: 20,
            }}>
            {/* <Text
              style={[
                listingData?.discountPrice
                  ? globalStyles.textXXLGAccent
                  : globalStyles.textXXLGreyDark,
                {
                  paddingRight: 10,
                  fontWeight: 'bold',
                },
              ]}>
              {listingData?.localCurrencySymbol}
              {listingData?.localPrice?.toFixed(2) ?? '0.00'}
            </Text>

            {!isNaN(parseFloat(listingData?.discountPrice ?? '')) &&
            listingData.discountPrice ? (
              <Text style={[globalStyles.textXXLGreyDark, styles.strikeText]}>
                {listingData?.localCurrencySymbol}
                {parseFloat(listingData?.discountPrice).toFixed(2)}
              </Text>
            ) : null} */}

            {(() => {
              let totalLocalPrice = 0;
              let totalLocalPriceNew = 0;
              let hasNewPrice = false;
              let finalCurrencySymbol = listingData?.localCurrencySymbol || '';

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
                Array.isArray(listingData?.variations) &&
                listingData?.variations.length > 0
              ) {
                listingData?.variations.forEach(variation => {
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
                const localPrice = parseSafeFloat(listingData?.localPrice);
                const localPriceNew = isNonEmpty(listingData?.localPriceNew)
                  ? parseSafeFloat(listingData.localPriceNew) !=
                    parseSafeFloat(listingData.localPrice)
                    ? parseSafeFloat(listingData.localPriceNew)
                    : 0
                  : 0;
                // console.log('Single: ' + JSON.stringify(listingData?));
                totalLocalPrice = localPrice;
                totalLocalPriceNew = localPriceNew;
                localPriceNew > 0 ? localPriceNew : localPrice;
                hasNewPrice = localPriceNew > 0;

                if (listingData?.localCurrencySymbol) {
                  finalCurrencySymbol = listingData?.localCurrencySymbol;
                }
              }

              return (
                <View style={[styles.cell, {flexDirection: 'row'}]}>
                  {hasNewPrice ? (
                    <>
                      <Text
                        style={[globalStyles.textLGAccent, {paddingRight: 10}]}>
                        {finalCurrencySymbol}
                        {numberToCurrency(totalLocalPriceNew.toFixed(2))}
                      </Text>
                      <Text
                        style={[
                          styles.strikeText,
                          globalStyles.textLGGreyLight,
                        ]}>
                        {finalCurrencySymbol}
                        {numberToCurrency(totalLocalPrice.toFixed(2))}
                      </Text>
                    </>
                  ) : (
                    <Text style={globalStyles.textLGGreyLight}>
                      {finalCurrencySymbol}
                      {numberToCurrency(totalLocalPrice.toFixed(2))}
                    </Text>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Pot size Information */}
          {listingData?.potSize ? (
            <View
              style={{
                borderBottomColor: '#E4E7E9',
                borderBottomWidth: 1,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Pot Size
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#E4E7E9',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 10,
                    marginBottom: 10,
                  },
                ]}>
                <Text style={{color: '#000'}}>{listingData.potSize}</Text>
              </View>
            </View>
          ) : null}

          {Array.isArray(listingData?.variations) &&
            listingData.variations.length > 0 && (
              <View
                style={{
                  borderBottomColor: '#E4E7E9',
                  borderBottomWidth: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}>
                <Text
                  style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                  Pot Size
                </Text>

                {listingData?.variations.map((item, index) => {
                  const potSize = item.potSize || 'No Pot Size';
                  const price =
                    item?.localCurrencySymbol + ' ' + item?.localPrice;

                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        borderWidth: 1,
                        borderRadius: 10,
                        borderColor: '#CDD3D4',
                        marginBottom: 10,
                        padding: 10,
                      }}>
                      <Image
                        style={styles.image}
                        source={{
                          uri:
                            item.imagePrimary ||
                            'https://via.placeholder.com/350x150.png?text=No+Image',
                        }}
                        resizeMode="cover"
                      />
                      <View
                        style={[
                          styles.badgeContainer,
                          {
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingLeft: 10,
                          },
                        ]}>
                        <View style={{flexDirection: 'column'}}>
                          <Text style={globalStyles.textMDGreyDark}>
                            {potSize}
                          </Text>
                          <Text style={globalStyles.textMDGreyDark}>
                            {item?.availableQty} in stock
                          </Text>
                        </View>

                        <Text style={globalStyles.textMDGreyDark}>
                          {numberToCurrency(price)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          {/* Pot size Information */}

          {/* Approximate Height Information */}
          {Array.isArray(listingData?.variations) &&
            listingData.variations.length > 0 && (
              <View
                style={{
                  borderBottomColor: '#E4E7E9',
                  borderBottomWidth: 1,
                  paddingTop: 10,
                  paddingHorizontal: 20,
                }}>
                <Text
                  style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                  Approximate Height
                </Text>
                {listingData.variations.map((item, index) => {
                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        marginBottom: 10,
                        padding: 10,
                      }}>
                      <InchesIcon width={20} height={20} />
                      <View>
                        <Text
                          style={[
                            globalStyles.textMDGreyDark,
                            {paddingLeft: 10},
                          ]}>
                          {item?.approximateHeight}
                        </Text>
                        <Text
                          style={[
                            globalStyles.textMDGreyLight,
                            {paddingLeft: 10},
                          ]}>
                          {item?.potSize}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          {/* Approximate Height Information */}
        </View>
        {/* Foreground Content */}
      </ScrollView>
      {/* Foreground ScrollView Content */}

      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
          position: 'absolute',
          bottom: 10,
          width: '100%',
        }}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ScreenListingDetail', {
              plantCode: plantCode,
            })
          }
          style={{
            paddingHorizontal: 20,
            alignSelf: 'stretch',
            width: '100%',
          }}>
          <View style={globalStyles.primaryButton}>
            <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
              Manage Listing
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stickyHeader: {
    backgroundColor: 'transparent',
    zIndex: 10,
    paddingTop: 12,
    // marginBottom: 20,
  },
  contents: {
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: screenHeight * 0.6,
  },
  strikeText: {
    textDecorationLine: 'line-through', // This adds the line in the middle
    // color: 'black',
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
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ScreenMyStoreDetail;
