import NetInfo from '@react-native-community/netinfo';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator,
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
import CarouselSell from './components/CarouselSell';

import { getSellMostLove, getSupplierInfoApi, getManageListingApi } from '../../../components/Api';

import GrowerPlantIcon from '../../../assets/sellicon/growers.svg';
import SinglePlantIcon from '../../../assets/sellicon/single.svg';
import WholeSalePlantIcon from '../../../assets/sellicon/wholesale.svg';
import { useFocusEffect } from '@react-navigation/native';
import DraftIcon from '../../../assets/images/draft.svg';
import DuplicateIcon from '../../../assets/images/duplicate.svg';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import BatchUploadIcon from '../../../assets/icons/greydark/batch-upload.svg';
import NoteEditIcon from '../../../assets/icons/greydark/note-edit.svg';
import CaretRightIcon from '../../../assets/icons/greydark/caret-right-regular.svg';
import { AuthContext } from '../../../auth/AuthProvider';
import { accountClassFromUserInfo, isUsBusinessUser } from '../../../utils/b2bShell';
import { isIleafuInhouseAccountClass } from '../../../utils/b2bCountries';
const screenWidth = Dimensions.get('window').width;

const ScreenSell = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const {userInfo} = useContext(AuthContext);

  if (__DEV__) {
    console.log('[ScreenSell] userInfo.liveFlag =', userInfo?.liveFlag);
    console.log('[ScreenSell] userInfo keys =', userInfo ? Object.keys(userInfo) : 'null');
  }

  // Handle different userInfo shapes (top-level, nested user/data) and
  // normalize case/whitespace to avoid false negatives in feature gating.
  const resolvedLiveFlagRaw =
    userInfo?.liveFlag ??
    userInfo?.user?.liveFlag ??
    userInfo?.data?.liveFlag ??
    null;
  const resolvedUid =
    userInfo?.uid ||
    userInfo?.id ||
    userInfo?.user?.uid ||
    userInfo?.user?.id ||
    userInfo?.data?.uid ||
    userInfo?.data?.id ||
    null;
  const [liveFlagResolved, setLiveFlagResolved] = useState(resolvedLiveFlagRaw);
  const inhouseOnly = isIleafuInhouseAccountClass(accountClassFromUserInfo(userInfo));
  const canUseLiveSale =
    (typeof liveFlagResolved === 'string' &&
      liveFlagResolved.trim().toLowerCase() === 'yes') ||
    isUsBusinessUser(userInfo) ||
    inhouseOnly;

  useEffect(() => {
    let cancelled = false;

    const resolveLiveFlag = async () => {
      // Prefer liveFlag from AuthContext payload when present.
      if (resolvedLiveFlagRaw !== undefined && resolvedLiveFlagRaw !== null) {
        setLiveFlagResolved(resolvedLiveFlagRaw);
        return;
      }

      // Fallback: load liveFlag directly from supplier profile document.
      if (!resolvedUid) {
        setLiveFlagResolved(null);
        return;
      }

      try {
        const supplierData = await getSupplierInfoApi();
        if (!cancelled && supplierData?.success) {
          setLiveFlagResolved(supplierData?.liveFlag ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[ScreenSell] Failed to resolve liveFlag from supplier info:', e?.message);
          setLiveFlagResolved(null);
        }
      }
    };

    resolveLiveFlag();
    return () => {
      cancelled = true;
    };
  }, [resolvedLiveFlagRaw, resolvedUid]);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
    }
  });

  const [showSheet, setShowSheet] = useState(false);
  const [showLiveSaleSheet, setShowLiveSaleSheet] = useState(false);
  const [liveSaleExistingCount, setLiveSaleExistingCount] = useState(0);

  const openSheet = sheetOpen => {
    setShowSheet(!sheetOpen);
  };

  const liveSellerUid =
    userInfo?.uid ||
    userInfo?.id ||
    userInfo?.user?.uid ||
    userInfo?.user?.id;

  const fetchExistingLiveListingCount = useCallback(async () => {
    let existingLiveCount = 0;
    if (liveSellerUid) {
      try {
        // Count the seller's Live listings via the search-listing edge fn.
        const res = await retryAsync(
          () => getManageListingApi(true, '', [], [], [], 'Live', '', 1000, '', false, ''),
          3,
          1000,
        );
        existingLiveCount = res?.total || 0;
      } catch (e) {
        console.warn('Failed to fetch live listing count:', e?.message);
      }
    }
    return existingLiveCount;
  }, [liveSellerUid]);

  // Warm count while Sell is visible so the Live Sale sheet can open instantly.
  useEffect(() => {
    if (!isFocused || userInfo?.liveFlag !== 'Yes') {
      return;
    }
    let cancelled = false;
    fetchExistingLiveListingCount().then((n) => {
      if (!cancelled) {
        setLiveSaleExistingCount(n);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isFocused, userInfo?.liveFlag, fetchExistingLiveListingCount]);

  // Refresh count when the sheet opens (keeps IG index accurate without delaying open).
  useEffect(() => {
    if (!showLiveSaleSheet) {
      return;
    }
    let cancelled = false;
    fetchExistingLiveListingCount().then((n) => {
      if (!cancelled) {
        setLiveSaleExistingCount(n);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showLiveSaleSheet, fetchExistingLiveListingCount]);

  const handlePressLiveSaleCard = () => {
    setShowLiveSaleSheet(true);
  };

  const handleLiveSaleExcel = () => {
    setShowLiveSaleSheet(false);
    navigation.navigate('LiveSaleExcelUploadScreen', {
      existingLiveCount: liveSaleExistingCount,
    });
  };

  const handleLiveSaleManual = () => {
    setShowLiveSaleSheet(false);
    navigation.navigate('BatchUploadScreen', {
      existingLiveCount: liveSaleExistingCount,
    });
  };

  const handlePressSingle = () => {
    navigation.navigate('ScreenSingleSell');
  };
  const handlePressWholesale = () => {
    navigation.navigate('ScreenWholesaleSell');
  };
  const handlePressGrowers = () => {
    navigation.navigate('ScreenGrowersSell');
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
      <View style={styles.mainContainer}>
        <View style={styles.topContainer}>
          <Text
            style={[
              globalStyles.textXLGreyDark,
              {textAlign: 'left', paddingTop: 5, fontWeight: '800'},
            ]}>
            Sell a Plant
          </Text>
          <TouchableOpacity onPress={() => openSheet(showSheet)}>
            <Text style={globalStyles.textMDAccent}>Existing Listing</Text>
          </TouchableOpacity>
        </View>

        <View style={{paddingTop: 30}}>
          <Text style={globalStyles.textMDGreyDark}>
            Start from scratch
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
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
            <View style={[globalStyles.cardLightAccent, styles.cardMenu]}>
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
            </View>
          </View>
          <View
            style={[
              globalStyles.cardLightAccent,
              styles.cardMenuFull,
              {marginTop: 10, justifyContent: 'center', alignItems: 'center'},
            ]}>
            <TouchableOpacity onPress={handlePressWholesale}>
              <WholeSalePlantIcon></WholeSalePlantIcon>
              <Text
                style={[
                  globalStyles.textMDAccentDark,
                  {paddingTop: 10, textAlign: 'center', fontWeight: '800'},
                ]}>
                Wholesale
              </Text>
              <Text
                style={[
                  globalStyles.textMDAccent,
                  {paddingTop: 10, textAlign: 'center'},
                ]}>
                1 order = 10 plants
              </Text>
            </TouchableOpacity>
          </View>
          {canUseLiveSale && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 20,
              }}>
              <View style={[globalStyles.cardLightAccent, styles.cardMenu]}>
                <TouchableOpacity
                  onPress={handlePressLiveSaleCard}
                  style={{
                    marginTop: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <SinglePlantIcon width={42} height={52} />
                  <Text
                    style={[
                      globalStyles.textMDAccentDark,
                      {paddingTop: 10, fontWeight: '800'},
                    ]}>
                    Live Sale
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
          visible={showLiveSaleSheet}
          onClose={() => setShowLiveSaleSheet(false)}
          heightPercent={'35%'}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Live Sale</Text>
            <TouchableOpacity
              onPress={() => setShowLiveSaleSheet(false)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <CloseIcon width={22} height={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            <TouchableOpacity
              style={styles.sheetRow}
              activeOpacity={0.7}
              onPress={handleLiveSaleExcel}>
              <View style={styles.sheetRowIcon}>
                <BatchUploadIcon width={22} height={22} />
              </View>
              <View style={styles.sheetRowText}>
                <Text style={styles.sheetRowTitle}>Excel upload</Text>
                <Text style={styles.sheetRowSubtitle}>
                  Download a template. Quantity 6 = 6 identical listings.
                  Uploading again appends.
                </Text>
              </View>
              <CaretRightIcon width={18} height={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetRow, styles.sheetRowDivided]}
              activeOpacity={0.7}
              onPress={handleLiveSaleManual}>
              <View style={styles.sheetRowIcon}>
                <NoteEditIcon width={22} height={22} />
              </View>
              <View style={styles.sheetRowText}>
                <Text style={styles.sheetRowTitle}>Manual input</Text>
                <Text style={styles.sheetRowSubtitle}>
                  Enter listings. You can add another batch anytime without
                  replacing.
                </Text>
              </View>
              <CaretRightIcon width={18} height={18} />
            </TouchableOpacity>
          </View>
        </ActionSheet>

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
      </View>
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

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
    fontWeight: '600',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetRowDivided: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F1',
  },
  sheetRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetRowText: {
    flex: 1,
    paddingRight: 12,
  },
  sheetRowTitle: {
    color: '#202325',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetRowSubtitle: {
    color: '#7F8D91',
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 3,
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenSell;
