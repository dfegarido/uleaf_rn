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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {globalStyles} from '../../../assets/styles/styles';
import PayoutPlantCard from './components/PayoutPlantCard';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {getHomePayoutDetailsApi} from '../../../components/Api';

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
    setListingData(res?.data);
  };

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
              paddingVertical: 20,
              paddingHorizontal: 10,
              borderRadius: 10,
              flexDirection: 'column',
              marginBottom: 20,
              marginHorizontal: 20,
            }}>
            <Text style={globalStyles.textMDGreyDark}>Total Receivable</Text>
            <Text style={[globalStyles.textXXLGreyDark, {paddingTop: 10}]}>
              {totalReceivables}
            </Text>
            <View
              style={[styles.statusTag, statusStyles[status], {marginTop: 10}]}>
              <Text style={styles.statusText}>{status}</Text>
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
                  ? new Date(
                      listingData[0].details[0].payoutDate,
                    ).toDateString()
                  : 'N/A'}
              </Text>
            </View>
            <View style={{flexDirection: 'column', width: '70%'}}>
              <Text style={globalStyles.textSMGreyLight}>Sales period</Text>
              <Text style={globalStyles.textMDGreyDark}>
                Jun-22-2025 to Jun-28-2025
              </Text>
            </View>
          </View>

          <View style={{marginHorizontal: 20, marginVertical: 20}}>
            <Text style={globalStyles.textMDGreyDark}>Order Summary</Text>
          </View>

          <FlatList
            scrollEnabled={false}
            data={listingData?.[0]?.details || []}
            keyExtractor={(item, index) => `${item.trxNumber}-${index}`}
            renderItem={({item}) => (
              <PayoutPlantCard
                plant={{
                  id: item.trxNumber,
                  image: item.imagePrimary,
                  price: item.localPrice,
                  quantity: item.orderQty,
                  code: item.plantCode,
                  size: item.potSizeVariation + '"',
                  tag: item.listingType,
                }}
              />
            )}
          />
        </View>
      </ScrollView>
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
});

export default ScreenPayoutDetails;
