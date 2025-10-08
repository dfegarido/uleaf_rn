import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../../assets/styles/styles';
import PayoutCard from './components/PayoutCard';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

import {getHomePayoutListingApi} from '../../../components/Api';
import {getStoredAuthToken} from '../../../utils/getStoredAuthToken';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

const ScreenPayout = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const isFocused = useIsFocused();

  const [data, setData] = useState([]);
  const [totalReceivables, setTotalReceivables] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [nextToken, setNextToken] = useState('');
  const [nextTokenParam, setNextTokenParam] = useState('');

  useEffect(() => {
    console.log('💰 Payouts useEffect Triggered:', {
      isFocused,
      isInitialFetchRefresh,
      currentDataLength: data.length
    });
    
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('💰 Payouts Fetch Error:', {
          error: error.message,
          stack: error.stack
        });
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused, isInitialFetchRefresh]);

  const loadListingData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    // 💰 PAYOUTS API CALL LOGGING
    const authToken = await getStoredAuthToken();
    console.log('💰 Payouts API Call:', {
      endpoint: 'https://listpayout-nstilwgvua-uc.a.run.app',
      nextPageToken: nextTokenParam,
      networkConnected: netState.isConnected,
      networkReachable: netState.isInternetReachable,
      hasAuthToken: !!authToken,
      authTokenLength: authToken?.length || 0
    });

    const res = await retryAsync(
      () => getHomePayoutListingApi(nextTokenParam),
      3,
      1000,
    );

    // 💰 PAYOUTS API RESPONSE LOGGING
    console.log('💰 Payouts API Full Response:', JSON.stringify(res, null, 2));
    console.log('💰 Payouts API Response Analysis:', {
      success: res?.success,
      hasData: !!res?.data,
      dataArray: res?.data,
      dataLength: res?.data?.length || 0,
      totalReceivable: res?.totalReceivable,
      nextPageToken: res?.nextPageToken,
      message: res?.message,
      responseKeys: Object.keys(res || {})
    });

    if (!res?.success) {
      console.log('💰 Payouts API Error:', res?.message || 'Failed to load payout data');
      throw new Error(res?.message || 'Failed to load payout data');
    }

    setNextToken(res?.nextPageToken);
    setTotalReceivables(res?.totalReceivable);
    setDataCount(res?.data?.length || 0);
    
    const newData = res?.data || [];
    console.log('💰 Payouts Data Setting:', {
      newDataLength: newData.length,
      isAppending: !!nextTokenParam,
      currentDataLength: data.length,
      dataCount: res?.data?.length || 0
    });
    
    setData(
      prev =>
        nextTokenParam
          ? [...prev, ...newData] // append
          : newData, // replace
    );
  };

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };


  // ✅ Pull-to-refresh

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
    if (nextToken != nextTokenParam) {
      setNextTokenParam(nextToken);
    }
  };
  // Load more

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
      {/* Search and Icons */}
      <View style={styles.stickyHeader}>
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
            <Text
              style={[
                globalStyles.textLGGreyDark,
                {textAlign: 'center', paddingRight: 20},
              ]}>
              Payouts
            </Text>
          </View>
        </View>
      </View>
      {/* Search and Icons */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // style={[styles.container, {paddingTop: insets.top}]}
        style={[styles.container]}
        // stickyHeaderIndices={[0]}
      >
        {/* Main Content */}
        <View style={{marginHorizontal: 20}}>
          <View
            style={{
              backgroundColor: '#202325',
              padding: 20,
              borderRadius: 10,
              flexDirection: 'column',
              marginBottom: 20,
            }}>
            <Text style={globalStyles.textMDWhite}>Total Receivables</Text>

            <Text style={[globalStyles.textXLWhite, {paddingTop: 10}]}>
              {data.length > 0 ? data[0]?.totalReceivableAmountCurrencySymbol : '$'} {totalReceivables || '0.00'}
            </Text>
          </View>

          {data.length === 0 && !loading ? (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60,
              backgroundColor: '#f9f9f9',
              borderRadius: 10,
              marginVertical: 20
            }}>
              <Text style={[globalStyles.textLGGreyLight, {marginBottom: 10}]}>
                No Payouts Available
              </Text>
              <Text style={[globalStyles.textMDGreyLight, {textAlign: 'center', paddingHorizontal: 20}]}>
                Your payout history will appear here once you make sales
              </Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => {
                console.log(`💰 Rendering Payout Item ${index}:`, item);
                return (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ScreenPayoutDetails', item)
                    }>
                    <PayoutCard item={item} />
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{paddingBottom: 20}}
            />
          )}
          {data.length == 10 && (
            <TouchableOpacity
              onPress={() => onPressLoadMore()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                marginTop: 300,
                marginBottom: 50,
              }}>
              <Text style={globalStyles.textLGAccent}>Load More</Text>
              <ArrowDownIcon width={25} height={20} />
            </TouchableOpacity>
          )}
        </View>
        {/* Main Content */}
      </ScrollView>
      {/* Button always at the bottom */}
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenPayout;
