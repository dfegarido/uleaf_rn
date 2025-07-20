import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {globalStyles} from '../../../assets/styles/styles';
import PayoutPlantCard from './components/PayoutPlantCard';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {
  getHomePayoutDetailsApi,
  postPayoutExportApi,
} from '../../../components/Api';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

const ScreenPayoutDetails = ({navigation, route}) => {
  const statusStyles = {
    Receivable: styles.receivable,
    Paid: styles.paid,
  };
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [loading, setLoading] = useState(false);
  const [listingData, setListingData] = useState(null);
  const [totalReceivables, setTotalReceivables] = useState('');
  const [totalReceivableAmountCurrency, setTotalReceivableAmountCurrency] =
    useState('');
  const [totalQuantity, setTotalQuantity] = useState(0);

  const {workWeek, status} = route.params;
  const isFocused = useIsFocused();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData(workWeek);
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workWeek, isFocused]);

  const loadListingData = async workWeek => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(
      () => getHomePayoutDetailsApi(workWeek),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    console.log(JSON.stringify(res.data));
    setTotalReceivables(res?.data[0]?.totalReceivableAmountLocal);
    setTotalReceivableAmountCurrency(
      res?.data[0]?.totalReceivableAmountCurrencySymbol,
    );
    setListingData(res?.data);
  };

  // Export
  const onPressExport = async () => {
    setLoading(true);
    try {
      const response = await postPayoutExportApi(workWeek);

      if (!response?.success) {
        throw new Error(response?.message || 'Export failed.');
      }

      Alert.alert('Export', 'Payout list exported successfully!');
    } catch (error) {
      console.log('Export:', error.message);
      Alert.alert('Export', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Export

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} height={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Payout Details
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View>
          <View
            style={{
              backgroundColor: '#fff',
              paddingTop: 20,
              paddingHorizontal: 10,
              borderRadius: 10,
              flexDirection: 'column',
              marginHorizontal: 20,
            }}>
            <Text style={globalStyles.textMDGreyDark}>
              {status == 'Paid'
                ? 'Total Receivable Amount'
                : 'Total Receivable'}
            </Text>
            <Text style={[globalStyles.textXXLGreyDark, {paddingTop: 10}]}>
              {totalReceivableAmountCurrency} {totalReceivables}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
              }}>
              <View style={[styles.statusTag, statusStyles[status]]}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
              <View>
                <Text style={globalStyles.textMDGreyLight}>
                  REF #: {listingData?.[0]?.details?.[0]?.trxNumber ?? ''}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#F5F6F6',
              padding: 20,
              flexDirection: 'row',
            }}>
            <View style={{flexDirection: 'column', width: '30%'}}>
              <Text style={globalStyles.textSMGreyLight}>Payout date</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {listingData?.[0]?.details?.[0]?.payoutDate
                  ? (() => {
                      const dateStr =
                        listingData[0].details[0].payoutDate.split('T')[0]; // '2025-02-01'
                      const [year, month, day] = dateStr.split('-');
                      const date = new Date(`${year}-${month}-${day}`);
                      const shortMonth = date.toLocaleString('en-US', {
                        month: 'short',
                      }); // 'Feb'
                      return `${shortMonth} ${day}, ${year}`;
                    })()
                  : 'N/A'}
              </Text>
            </View>
            <View style={{flexDirection: 'column', width: '70%'}}>
              <Text style={globalStyles.textSMGreyLight}>Sales period</Text>
              <Text style={globalStyles.textMDGreyDark}>
                {listingData?.[0]?.salesPeriod ?? ''}
              </Text>
            </View>
          </View>

          <FlatList
            scrollEnabled={false}
            data={listingData?.[0]?.details || []}
            keyExtractor={(item, index) => `${item.trxNumber}-${index}`}
            renderItem={({item}) => (
              <PayoutPlantCard
                plant={{
                  id: item?.trxNumber,
                  image: item?.imagePrimary,
                  price: item?.localPrice,
                  quantity:
                    item?.orderQty +
                    'x' +
                    (item?.listingType == 'Wholesale' ? '10' : ''),
                  code: item?.plantCode,
                  size: item?.potSizeVariation + '"',
                  tag: item?.listingType,
                  currencySymbol: item?.localPriceCurrencySymbol,
                  genus: item?.genus ?? '',
                  species: item?.species ?? '',
                }}
              />
            )}
          />

          <View style={{marginHorizontal: 20, marginTop: 20, marginBottom: 10}}>
            <Text style={globalStyles.textLGGreyDark}>Order Summary</Text>
          </View>

          <View
            style={{
              marginHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 5,
            }}>
            <Text style={globalStyles.textSMGreyLight}>Quantity</Text>
            <Text style={globalStyles.textSMGreyDark}>
              {listingData?.[0].totalQty}
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text style={globalStyles.textMDGreyDark}>Total Amount</Text>
            <Text style={globalStyles.textSMGreyDark}>
              {listingData?.[0].totalAmountCurrencySymbol}
              {listingData?.[0].totalAmountLocal}
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* Button always at the bottom */}
      <View style={{padding: 20, backgroundColor: '#fff'}}>
        <TouchableOpacity
          style={[globalStyles.primaryButton]}
          onPress={() => onPressExport()}>
          <Text style={styles.buttonText}>Export</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  receivable: {
    backgroundColor: '#E0F0FF',
  },
  paid: {
    backgroundColor: '#D1FAD7',
  },
  statusText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ScreenPayoutDetails;
