import NetInfo from '@react-native-community/netinfo';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../../../assets/styles/styles';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import { retryAsync } from '../../../utils/utils';
import ScreenGrowersSellLive from '../../Seller/Sell/ScreenGrowersSellLive';
import ScreenSingleSellLive from '../../Seller/Sell/ScreenSingleSellLive';
import CarouselSell from './components/CarouselSell';

import { getSellMostLove } from '../../../components/Api';

import SinglePlantIcon from '../../../assets/sellicon/single.svg';

import { useFocusEffect } from '@react-navigation/native';
import DraftIcon from '../../../assets/images/draft.svg';
import DuplicateIcon from '../../../assets/images/duplicate.svg';
const screenWidth = Dimensions.get('window').width;

const ScreenSellLive = ({navigation, goBackButton, backRef, addRef, sessionId, onClose, onListingCreated}) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [showSheet, setShowSheet] = useState(false);
  const [isSinglePlant, setIsSinglePlant] = useState(false);
  const [isGrower, setIsGrower] = useState(false);

  useImperativeHandle(backRef, () => ({
    triggerChildFunction: () => {
      setIsGrower(false);
      setIsSinglePlant(false);
      goBackButton();
    },
  }));

  const childAddRef = useRef(null);
  useImperativeHandle(addRef, () => ({
    triggerChildFunction: () => {
      if (childAddRef.current) {
        childAddRef.current.triggerChildFunction(); // Call the exposed child function
      }
    },
  }));

  const openSheet = sheetOpen => {
    setShowSheet(!sheetOpen);
  };

  const handlePressSingle = () => {
    goBackButton();
    setIsSinglePlant(!isSinglePlant);
    // navigation.navigate('ScreenSingleSell');
  };
  const handlePressGrowers = () => {
    goBackButton();
    setIsGrower(!isGrower);
    // navigation.navigate('ScreenGrowersSell');
  };
  const handlePressDuplicate = () => {
    setShowSheet(false);
    navigation.navigate('ScreenDuplicateSell');
  };
  const handlePressDraft = () => {
    setShowSheet(false);
    navigation.navigate('ScreenDraftSell');
  };

  const [loading, setLoading] = useState(false);

  // Most love
  const [mostLoveData, setMostLoveData] = useState([]);
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('Fetching details:', error);
        Alert.alert('Buyer Wishlist', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused]);

  const loadListingData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getSellMostLove(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }
    const LocalBuyerWishlist = Array.isArray(res.listings)
      ? res.listings.map(item => ({
          uri: item.imagePrimary ?? '',
          title: `${item.genus ?? ''} ${item.species ?? ''}`.trim(),
          description: item.variegation ?? '',
          percentage:
            item.loveCountPercent != null ? `${item.loveCountPercent}%` : '0%',
        }))
      : [];
    console.log(res.listings);
    setMostLoveData(LocalBuyerWishlist);
  };
  // Most love

  return (
    <View style={[styles.mainContent, {paddingTop: insets.top + 10}]}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      
      {isSinglePlant && (<ScreenSingleSellLive onListingCreated={onListingCreated} onClose={onClose} sessionId={sessionId} publishRef={childAddRef} navigation={navigation} />)}
      {isGrower && (<ScreenGrowersSellLive onListingCreated={onListingCreated} onClose={onClose} sessionId={sessionId} publishRef={childAddRef} navigation={navigation} />)}


      {!isGrower && !isSinglePlant && (<View style={styles.mainContainer}>

        <View >
          <Text style={globalStyles.textMDGreyDark}>Start from scratch</Text>
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 20,
              paddingLeft: 50,
            }}>
            <View style={[globalStyles.cardLightAccent, styles.cardMenu]}>
              <TouchableOpacity
                onPress={handlePressSingle}
                style={{
                  marginTop: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <SinglePlantIcon width={42} height={52}></SinglePlantIcon>
                <Text
                  style={[
                    globalStyles.textMDAccentDark,
                    {paddingTop: 10, fontWeight: '800'},
                  ]}>
                  Single Plant
                </Text>
              </TouchableOpacity>
            </View>
            {/* <View style={[globalStyles.cardLightAccent, styles.cardMenu]}>
              <TouchableOpacity
                onPress={handlePressGrowers}
                style={{
                  marginTop: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <GrowerPlantIcon width={42} height={52}></GrowerPlantIcon>
                <Text
                  style={[
                    globalStyles.textMDAccentDark,
                    {
                      paddingTop: 10,
                      fontWeight: '800',
                    },
                  ]}>
                  Grower's Choice
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>

        <View style={{paddingTop: 30}}>
          {mostLoveData.length != 0 && (
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Buyers Wish List
            </Text>
          )}

          <CarouselSell plantItems={mostLoveData} />
        </View>

        <ActionSheet
          visible={showSheet}
          onClose={() => setShowSheet(false)}
          heightPercent={'30%'}>
          <View style={{padding: 20}}>
            <TouchableOpacity onPress={handlePressDraft}>
              <View
                style={{
                  borderColor: '#CDD3D4',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <DraftIcon width={50} height={50}></DraftIcon>
                  <View style={{flexDirection: 'column'}}>
                    <Text
                      style={[globalStyles.textLGGreyDark, {paddingLeft: 4}]}>
                      Edit a draft listing
                    </Text>
                    <Text
                      style={[globalStyles.textMDGreyLight, {paddingLeft: 4}]}>
                      Finalize edit and publish
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePressDuplicate}>
              <View
                style={{
                  borderColor: '#CDD3D4',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 10,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <DuplicateIcon width={50} height={50}></DuplicateIcon>
                  <View style={{flexDirection: 'column'}}>
                    <Text
                      style={[globalStyles.textLGGreyDark, {paddingLeft: 4}]}>
                      Duplicate an existing listing
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        maxWidth: 300,
                      }}>
                      <Text
                        style={[
                          globalStyles.textMDGreyLight,
                          {paddingLeft: 4, flexShrink: 1},
                        ]}>
                        Start with a similar listing to save time
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      </View>)}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardMenu: {padding: 20, width: screenWidth * 0.5 - 25},
  cardMenuFull: {padding: 20},

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenSellLive;
