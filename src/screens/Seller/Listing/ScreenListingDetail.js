import React, {useEffect, useRef, useState, useContext} from 'react';
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
import DiscountBadge from '../../../components/DiscountBadge/DiscountBadge';
import {getListingDetails} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {AuthContext} from '../../../auth/AuthProvider';
import {retryAsync} from '../../../utils/utils';
import {CustomSwitch} from '../../../components/Switch';
import ConfirmRenew from './components/ConfirmRenew';
import ConfirmPublishNow from './components/ConfirmPublishNow';
import ConfirmPublishNursery from './components/ConfirmPublishNursery';
import ListingActionSheet from './components/ListingActionSheetEdit';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {InputBox} from '../../../components/Input';
import {formatDateMonthDayYear, testDateFormatting} from '../../../utils/formatDateMonthDayYear';
import {Platform} from 'react-native';
import ConfirmDelete from './components/ConfirmDelete';
import {numberToCurrency} from '../../../utils/numberToCurrency';

import {
  postListingPublishNowActionApi,
  postListingPublishNurseryDropActionApi,
  postListingActivateActionApi,
  postListingDeactivateActionApi,
  postListingUpdateStockActionApi,
  postListingDeleteApi,
  postListingPinActionApi,
} from '../../../components/Api';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import HeartIcon from '../../../assets/icons/greylight/heart-regular.svg';
import HeartListIcon from '../../../assets/icons/greylight/list-heart.svg';
import QuestionIcon from '../../../assets/icons/greylight/question-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin-light.svg';
import InchesIcon from '../../../assets/icons/greylight/inches.svg';
import CopyIcon from '../../../assets/icons/greylight/copy-regular.svg';
import IconMenu from '../../../assets/icons/greydark/dots-three-vertical-regular.svg';
import PlantIcon from '../../../assets/icons/greylight/plant-regular.svg';
import StoreIcon from '../../../assets/icons/greylight/storefront-regular.svg';
import CalendarIcon from '../../../assets/icons/greylight/calendar-blank-regular.svg';
import EditIcon from '../../../assets/icons/greydark/note-edit.svg';
import RenewIcon from '../../../assets/icons/accent/arrow-clockwise-regular.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
import PublishIcon from '../../../assets/icons/accent/box-arrow-up-regular.svg';
import EditNoteIcon from '../../../assets/icons/accent/note-edit.svg';
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

import {useNavigationState} from '@react-navigation/native';

// Helper function to calculate expiration date (+14 days from publish or modification date)
const calculateExpirationDate = (listingData) => {
  try {
    // Determine which date to use (updatedAt if exists, otherwise publishDate)
    // Try formatted fields first, then raw timestamps
    const baseDateFormatted = listingData?.updatedAtFormatted || listingData?.publishDateFormatted;
    const baseDateRaw = listingData?.updatedAt || listingData?.publishDate;
    
    let dateObj;
    
    // Priority 1: Use formatted date string if available
    if (baseDateFormatted) {
      dateObj = new Date(baseDateFormatted);
    }
    // Priority 2: Use raw Firestore timestamp
    else if (baseDateRaw) {
      if (baseDateRaw.toDate && typeof baseDateRaw.toDate === 'function') {
        // Firestore Timestamp object
        dateObj = baseDateRaw.toDate();
      } else if (baseDateRaw.seconds) {
        // Firestore Timestamp-like object
        dateObj = new Date(baseDateRaw.seconds * 1000);
      } else if (baseDateRaw instanceof Date) {
        dateObj = baseDateRaw;
      } else {
        dateObj = new Date(baseDateRaw);
      }
    } else {
      return 'No Data';
    }
    
    // Add 14 days
    const expirationDate = new Date(dateObj);
    expirationDate.setDate(expirationDate.getDate() + 14);
    
    // Format using the existing formatDateMonthDayYear utility
    // Convert to ISO string format which the utility function expects
    const result = formatDateMonthDayYear(expirationDate.toISOString());
    
    console.log('📅 Expiration Calculation:', {
      baseDateFormatted,
      baseDateRaw,
      dateObj: dateObj.toISOString(),
      expirationDate: expirationDate.toISOString(),
      result
    });
    
    return result;
  } catch (error) {
    console.error('Error calculating expiration date:', error);
    return 'No Data';
  }
};

const ScreenListingDetail = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [listingData, setListingData] = useState(null);
  const {userInfo} = useContext(AuthContext);

  const {plantCode, onGoBack} = route.params;

  const routes = useNavigationState(state => state.routes);
  const previousRoute = routes[routes.length - 2]; // Previous screen
  // console.log('Previous Route Here: ', previousRoute.name);

  // ✅ Fetch on mount
  const isFocused = useIsFocused();
  useEffect(() => {
    // 🧪 Run cross-platform date formatting test
    testDateFormatting();
    
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

    // console.log(res.data);
    console.log('📅 Listing Data - publishDate:', res.data?.publishDate);
    console.log('📅 Listing Data - publishDateFormatted:', res.data?.publishDateFormatted);
    console.log('📅 Listing Data - updatedAt:', res.data?.updatedAt);
    console.log('📅 Listing Data - updatedAtFormatted:', res.data?.updatedAtFormatted);
    console.log('📅 Calculated Expiration:', calculateExpirationDate(res.data));
    console.log('🔧 Variations:', res.data?.variations);
    console.log('🔧 Variations Count:', res.data?.variations?.length);
    console.log('💰 Currency Info - userInfo:', userInfo);
    console.log('💰 Currency Symbol:', userInfo?.currencySymbol);
    console.log('💰 Listing Currency Symbol:', res.data?.localCurrencySymbol);
    setSwitchActive(res.data.status == 'Active' ? true : false);
    setListingData(res.data);
  };
  // ✅ Fetch on mount

  // Inactive and Active
  const [switchActive, setSwitchActive] = useState(
    listingData?.active == 'Active' ? true : false,
  );

  const toggleSwitch = () => {
    setSwitchActive(previousState => !previousState);
    if (switchActive == true) {
      deactivateAction();
    } else {
      activeAction();
    }

    // Do something on change
    console.log('Switch is now:', !switchActive);
  };
  // Inactive and Active

  // Confirm
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [publishNowModalVisible, setPublishNowModalVisible] = useState(false);
  const [publishNurseryModalVisible, setPublishNurseryModalVisible] =
    useState(false);
  // Confirm

  // Publish now action
  const onPressPublishNow = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    setLoading(true);
    let localPlantCode = [plantCode];
    // console.log([plantCode]);
    try {
      const response = await postListingPublishNowActionApi(localPlantCode);

      if (!response?.success) {
        throw new Error(response?.message || 'Post publish now failed.');
      }

      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
      
      Alert.alert('Publish Now', 'Listing published now successfully!');
    } catch (error) {
      console.log('Error publish now action:', error.message);
      Alert.alert('Publish now', error.message);
    } finally {
      setLoading(false);
      navigation.goBack();
    }
    // Proceed with API call or action here
  };
  // Publish now action

  // Publish nursery action
  const onPressPublishNursery = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    setLoading(true);
    let localPlantCode = [plantCode];
    // console.log([plantCode]);
    try {
      const response = await postListingPublishNurseryDropActionApi(
        localPlantCode,
      );

      if (!response?.success) {
        throw new Error(
          response?.message || 'Post publish in nursery drop failed.',
        );
      }

      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
      
      Alert.alert(
        'Publish in Nursery Drop',
        'Listing published in nursery drop successfully!',
      );
    } catch (error) {
      console.log('Error publish in nursery drop action:', error.message);
      Alert.alert('Publish in nursery drop', error.message);
    } finally {
      setLoading(false);
      navigation.goBack();
    }
    // Proceed with API call or action here
  };
  // Publish nursery action

  // Active action
  const activeAction = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }
    try {
      const response = await postListingActivateActionApi([plantCode]);

      if (!response?.success) {
        throw new Error(response?.message || 'Post activate failed.');
      }
      
      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
    } catch (error) {
      console.log('Error activate action:', error.message);
      Alert.alert('Activate', error.message);
    }
  };
  // Active action

  // Deactive action
  const deactivateAction = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    try {
      const response = await postListingDeactivateActionApi([plantCode]);

      if (!response?.success) {
        throw new Error(response?.message || 'Post activate failed.');
      }
      
      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
    } catch (error) {
      console.log('Error activate action:', error.message);
      Alert.alert('Activate', error.message);
    }
  };
  // Deactive action

  const [showActionSheet, setActionShowSheet] = useState(false);

  // Update stocks
  const [showSheetUpdateStocks, setShowSheetUpdateStocks] = useState(false);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (!listingData) return;

    if (
      Array.isArray(listingData.variations) &&
      listingData.variations.length > 0
    ) {
      const initialQuantities = {};
      listingData.variations.forEach(variation => {
        initialQuantities[variation.id] =
          variation.availableQty?.toString() || '';
      });
      setQuantities(initialQuantities);
    } else if (listingData.potSize) {
      setQuantities({
        single: listingData.availableQty?.toString() || '',
      });
    }
  }, [listingData]); // <-- include this if you want it to re-run when listingData changes

  const onPressUpdateStockPost = async () => {
    setActionShowSheet(false);
    setShowSheetUpdateStocks(false);
    // setLoading(true);
    try {
      // Extract pot sizes and map their IDs to corresponding quantities from qtyMap
      const potSizes = listingData?.variations.map(
        variation => variation.potSize,
      );
      const selectedQuantity = listingData?.variations.map(
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

      await loadListingData(plantCode);
      
      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
    } catch (error) {
      console.log('Error updating stock:', error.message);
      Alert.alert('Update stocks', error.message);
    } finally {
      // setLoading(false);
      setActionShowSheet(false);
      setShowSheetUpdateStocks(false);
    }
  };
  // Update stocks

  // Delete Item
  const onPressDelete = async () => {
    setLoading(true);
    try {
      const response = await postListingDeleteApi(plantCode);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
      
      Alert.alert('Delete Listing', 'Listing deleted successfully!');
      setActionShowSheet(false);
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.log('Error pin table action:', error.message);
      Alert.alert('Delete item', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Delete Item

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const onPressDeleteConfirm = () => {
    setActionShowSheet(false);
    setDeleteModalVisible(true);
  };

  // Pin Item
  const onPressTableListPin = async (plantCode, pinTag) => {
    setLoading(true);
    try {
      const updatedPinTag = !pinTag;

      const response = await postListingPinActionApi(plantCode, updatedPinTag);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }

      // Reload listing data to reflect the pin status change
      await loadListingData(plantCode);
      
      // Trigger refresh of the listing table when going back
      if (onGoBack && typeof onGoBack === 'function') {
        onGoBack();
      }
      
      Alert.alert('Pin Status', `Listing ${updatedPinTag ? 'pinned' : 'unpinned'} successfully!`);
    } catch (error) {
      console.log('Error pin table action:', error.message);
      Alert.alert('Pin item', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Pin Item

  // Handle edit callback - refresh detail screen and trigger parent refresh
  const handleEditCallback = async () => {
    // Reload the listing detail data
    await loadListingData(plantCode);
    
    // Trigger refresh of the listing table for when user goes back
    if (onGoBack && typeof onGoBack === 'function') {
      onGoBack();
    }
  };
  // Handle edit callback

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingTop: insets.top}}>
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
        style={[styles.container]}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}>
        {/* Sticky Header */}
        <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
          <View style={styles.header}>
            <TouchableOpacity
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
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

            <TouchableOpacity
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              onPress={() => setActionShowSheet(true)}
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
              <IconMenu width={30} height={30} />
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

                <TouchableOpacity
                  onPress={() => {
                    if (listingData?.listingType == 'Single Plant') {
                      navigation.navigate('ScreenSingleSell', {
                        plantCode: listingData?.plantCode,
                        onGoBack: handleEditCallback,
                      });
                    }
                    if (listingData?.listingType == 'Wholesale') {
                      navigation.navigate('ScreenWholesaleSell', {
                        plantCode: listingData?.plantCode,
                        onGoBack: handleEditCallback,
                      });
                    }
                    if (listingData?.listingType == "Grower's Choice") {
                      navigation.navigate('ScreenGrowersSell', {
                        plantCode: listingData?.plantCode,
                        onGoBack: handleEditCallback,
                      });
                    }
                  }}>
                  <EditIcon width={20} height={20} />
                </TouchableOpacity>
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

          {/* Date Information */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: '#F5F6F6',
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingVertical: 10,
              paddingHorizontal: 20,
            }}>
            <View>
              <Text style={globalStyles.textSMGreyLight}>Created</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {(() => {
                  const formatted = listingData?.createdAtFormatted
                    ? formatDateMonthDayYear(listingData.createdAtFormatted)
                    : 'No Data';
                  console.log('📅 iOS/Android Date Check - Created:', {
                    platform: Platform.OS,
                    raw: listingData?.createdAtFormatted,
                    formatted: formatted,
                    isExpectedFormat: /^[A-Z][a-z]{2} \d{2}, \d{4}$/.test(formatted)
                  });
                  return formatted;
                })()}
              </Text>
            </View>
            <View>
              <Text style={globalStyles.textSMGreyLight}>Published</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {(() => {
                  const formatted = listingData?.publishDateFormatted
                    ? formatDateMonthDayYear(listingData.publishDateFormatted)
                    : 'No Data';
                  console.log('📅 iOS/Android Date Check - Published:', {
                    platform: Platform.OS,
                    raw: listingData?.publishDateFormatted,
                    formatted: formatted,
                    isExpectedFormat: /^[A-Z][a-z]{2} \d{2}, \d{4}$/.test(formatted)
                  });
                  return formatted;
                })()}
              </Text>
            </View>
            <View>
              <Text style={globalStyles.textSMGreyLight}>Modified</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {(() => {
                  const formatted = listingData?.updatedAtFormatted
                    ? formatDateMonthDayYear(listingData.updatedAtFormatted)
                    : 'No Data';
                  console.log('📅 iOS/Android Date Check - Modified:', {
                    platform: Platform.OS,
                    raw: listingData?.updatedAtFormatted,
                    formatted: formatted,
                    isExpectedFormat: /^[A-Z][a-z]{2} \d{2}, \d{4}$/.test(formatted)
                  });
                  return formatted;
                })()}
              </Text>
            </View>
          </View>
          {/* Date Information */}

          {/* Status Information */}
          <View
            style={{
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingVertical: 10,
            }}>
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: 'column',
              }}>
              <Text style={globalStyles.textLGGreyDark}>Listing Status</Text>
              <View
                style={{flexDirection: 'row', width: '100%', marginTop: 10}}>
                {/* First Column */}
                <View
                  style={{
                    flexDirection: 'column',
                    marginBottom: 10,
                    width: '50%',
                  }}>
                  {listingData?.status && listingData?.status == 'Active' && (
                    <View style={{flexDirection: 'row'}}>
                      <PlantIcon width={25} height={25} />
                      <View>
                        <Text
                          style={[
                            globalStyles.textMDAccentDark,
                            {paddingLeft: 5},
                          ]}>
                          {listingData?.status ?? 'No Data'}
                        </Text>
                        <Text
                          style={[
                            globalStyles.textMDGreyLight,
                            {paddingLeft: 5},
                          ]}>
                          Listing visibility
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={{flexDirection: 'row', paddingTop: 10}}>
                    <StoreIcon width={25} height={25} />
                    <View>
                      <Text
                        style={[globalStyles.textMDGreyDark, {paddingLeft: 5}]}>
                        {listingData?.status && listingData?.status == 'Active'
                          ? 'Published'
                          : listingData?.status}
                      </Text>
                      <Text
                        style={[
                          globalStyles.textXSGreyLight,
                          {paddingLeft: 5},
                        ]}>
                        {listingData?.status && listingData?.status == 'Active'
                          ? ''
                          : listingData?.publishType}
                      </Text>
                    </View>
                  </View>

                  <View style={{flexDirection: 'row', paddingTop: 10}}>
                    <CalendarIcon width={25} height={25} />
                    <View>
                      <Text
                        style={[globalStyles.textMDGreyDark, {paddingLeft: 5}]}>
                        {calculateExpirationDate(listingData)}
                      </Text>
                      <Text
                        style={[
                          globalStyles.textXSGreyLight,
                          {paddingLeft: 5},
                        ]}>
                        Expiration Date
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Second Column */}
                <View
                  style={{
                    flexDirection: 'column',
                    width: '50%',
                    alignItems: 'flex-end',
                  }}>
                  {listingData?.status && listingData?.status == 'Active' && (
                    <>
                      <View>
                        <CustomSwitch
                          label=""
                          value={switchActive}
                          onValueChange={toggleSwitch}
                          labelPosition="left"
                        />
                      </View>

                      <TouchableOpacity
                        style={{flexDirection: 'row', paddingTop: 25}}
                        onPress={() =>
                          setPublishNurseryModalVisible(
                            !publishNurseryModalVisible,
                          )
                        }>
                        <EditNoteIcon width={20} height={20} />
                        <Text
                          style={[globalStyles.textMDAccent, {paddingLeft: 5}]}>
                          Update
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {listingData?.status &&
                    listingData?.status == 'Scheduled' && (
                      <TouchableOpacity
                        style={{flexDirection: 'row', paddingTop: 10}}
                        onPress={() =>
                          setPublishNowModalVisible(!publishNowModalVisible)
                        }>
                        <PublishIcon width={25} height={25} />
                        <Text
                          style={[globalStyles.textMDAccent, {paddingLeft: 5}]}>
                          Publish
                        </Text>
                      </TouchableOpacity>
                    )}

                  {listingData?.status && listingData?.status == 'Expired' && (
                    <TouchableOpacity
                      style={{flexDirection: 'row', paddingTop: 10}}
                      onPress={() => setRenewModalVisible(!renewModalVisible)}>
                      <RenewIcon width={25} height={25} />
                      <Text
                        style={[globalStyles.textMDAccent, {paddingLeft: 5}]}>
                        Renew
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
          {/* Status Information */}

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

          {/* Approximate Height Section */}
          {listingData?.approximateHeight ? (
            <View
              style={{
                borderBottomColor: '#E4E7E9',
                borderBottomWidth: 1,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Approximate Height
              </Text>
              <View
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
                    style={[globalStyles.textMDGreyDark, {paddingLeft: 10}]}>
                    {listingData.approximateHeight}
                  </Text>
                  <Text
                    style={[globalStyles.textMDGreyLight, {paddingLeft: 10}]}>
                    {listingData.potSize}
                  </Text>
                </View>
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
                  
                  // Get currency symbol with better fallback logic
                  // Try to find a currency symbol from any variation if current one doesn't have it
                  const fallbackCurrencySymbol = listingData.variations.find(v => v.localCurrencySymbol)?.localCurrencySymbol;
                  const currencySymbol = item?.localCurrencySymbol || fallbackCurrencySymbol || listingData?.localCurrencySymbol || userInfo?.currencySymbol || '$';
                  
                  // Debug log to see what currency values we have for ALL variations
                  console.log(`💰 Variation ${index} Currency:`, item?.localCurrencySymbol, '- Pot Size:', potSize, '- Using:', currencySymbol);
                  
                  const price =
                    currencySymbol +
                    ' ' +
                    numberToCurrency(item?.localPrice);

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

                        <Text style={globalStyles.textMDGreyDark}>{price}</Text>
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
                  paddingVertical: 10,
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

      <ConfirmPublishNow
        visible={publishNowModalVisible}
        onConfirm={onPressPublishNow}
        onCancel={() => setPublishNowModalVisible(false)}
      />

      <ConfirmPublishNursery
        visible={publishNurseryModalVisible}
        onConfirm={onPressPublishNursery}
        onCancel={() => setPublishNurseryModalVisible(false)}
      />

      <ConfirmRenew
        visible={renewModalVisible}
        onPublishNow={onPressPublishNow}
        onPublishNurseryDrop={onPressPublishNursery}
        onCancel={() => setRenewModalVisible(false)}
      />

      <ListingActionSheet
        code={listingData?.listingType}
        visible={showActionSheet}
        onClose={() => setActionShowSheet(false)}
        onPressUpdateStockShow={() => {
          setActionShowSheet(false);
          setShowSheetUpdateStocks(true);
        }}
        // onPressUpdateStockShow={setShowSheetUpdateStocks}
        // showSheetUpdateStocks={showSheetUpdateStocks}
        onPressEdit={() => {
          if (listingData?.listingType == 'Single Plant') {
            navigation.navigate('ScreenSingleSell', {
              plantCode: listingData?.plantCode,
              onGoBack: handleEditCallback,
            });
          }
          if (listingData?.listingType == 'Wholesale') {
            navigation.navigate('ScreenWholesaleSell', {
              plantCode: listingData?.plantCode,
              onGoBack: handleEditCallback,
            });
          }
          if (listingData?.listingType == "Grower's Choice") {
            navigation.navigate('ScreenGrowersSell', {
              plantCode: listingData?.plantCode,
              onGoBack: handleEditCallback,
            });
          }
        }}
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
          {Array.isArray(listingData?.variations) &&
          listingData?.variations.length > 0 ? (
            listingData?.variations.map((variation, index) => (
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
          ) : listingData?.potSize ? (
            <View style={{marginTop: 10}}>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Pot size: {listingData?.potSize}
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
      <ConfirmDelete
        visible={deleteModalVisible}
        onDelete={onPressDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
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
    minHeight: screenHeight * 0.9,
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

export default ScreenListingDetail;
