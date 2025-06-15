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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DiscountBadge from '../../../components/DiscountBadge/DiscountBadge';
import {getListingDetails} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {CustomSwitch} from '../../../components/Switch';
import ConfirmRenew from './components/ConfirmRenew';

import {
  postListingPublishNowActionApi,
  postListingActivateActionApi,
  postListingDeactivateActionApi,
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

import BackgroundCarousel from '../../../components/BackgroundCarousel';

import {globalStyles} from '../../../assets/styles/styles';

const images = [
  require('../../../assets/images/bigplant.png'),
  require('../../../assets/images/bigplant.png'),
  require('../../../assets/images/bigplant.png'),
];

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenListingDetail = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [listingData, setListingData] = useState(null);

  const {plantCode} = route.params;

  // ✅ Fetch on mount
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
  }, [plantCode]);

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

  // Confirm

  // Publish now action
  const onPressPublishNow = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    setLoading(true);

    try {
      const response = await postListingPublishNowActionApi([plantCode]);

      if (!response?.success) {
        throw new Error(response?.message || 'Post publish now failed.');
      }
    } catch (error) {
      console.log('Error publish now action:', error.message);
      Alert.alert('Publish now', error.message);
    }
    setLoading(false);
    // Proceed with API call or action here
  };
  // Publish now action

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
    } catch (error) {
      console.log('Error activate action:', error.message);
      Alert.alert('Activate', error.message);
    }
  };
  // Deactive action

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
        style={[styles.container, {paddingTop: insets.top}]}
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
                      });
                    }
                    if (listingData?.listingType == 'Wholesale') {
                      navigation.navigate('ScreenWholesaleSell', {
                        plantCode: listingData?.plantCode,
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
              <View style={{flexDirection: 'row'}}>
                <PinIcon widht={25} height={25}></PinIcon>
                <Text
                  style={[globalStyles.textMDGreyLight, {paddingRight: 10}]}>
                  Pin
                </Text>
              </View>
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
                {listingData?.createdAt ?? 'No Data'}
              </Text>
            </View>
            <View>
              <Text style={globalStyles.textSMGreyLight}>Published</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {listingData?.publishDate ?? 'No Data'}
              </Text>
            </View>
            <View>
              <Text style={globalStyles.textSMGreyLight}>Modified</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {listingData?.updatedAt ?? 'No Data'}
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
                        Published
                      </Text>
                    </View>
                  </View>

                  <View style={{flexDirection: 'row', paddingTop: 10}}>
                    <CalendarIcon width={25} height={25} />
                    <View>
                      <Text
                        style={[globalStyles.textMDGreyDark, {paddingLeft: 5}]}>
                        {listingData?.expirationDate ?? 'No Data'}
                      </Text>
                      <Text
                        style={[
                          globalStyles.textMDGreyLight,
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
                    <View>
                      <CustomSwitch
                        label=""
                        value={switchActive}
                        onValueChange={toggleSwitch}
                        labelPosition="left"
                      />
                    </View>
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
                {listingData.variations.map((item, index) => {
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
                        <Text style={globalStyles.textMDGreyDark}>
                          {potSize}
                        </Text>
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

      <ConfirmRenew
        visible={renewModalVisible}
        onPublishNow={onPressPublishNow}
        onPublishNurseryDrop={onPressPublishNow}
        onCancel={() => setRenewModalVisible(false)}
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
});

export default ScreenListingDetail;
