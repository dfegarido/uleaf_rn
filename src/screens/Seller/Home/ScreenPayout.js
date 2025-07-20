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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../../assets/styles/styles';
import PayoutCard from './components/PayoutCard';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

import {getHomePayoutListingApi} from '../../../components/Api';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

const ScreenPayout = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  useFocusEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#fff');
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
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('Fetching details:', error);
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

    const res = await retryAsync(
      () => getHomePayoutListingApi(nextTokenParam),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    console.log(res);
    setNextToken(res?.nextPageToken);
    setTotalReceivables(res?.totalReceivable);
    setData(
      prev =>
        nextTokenParam
          ? [...prev, ...(res?.data || [])] // append
          : res?.data || [], // replace
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
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
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
              {data[0]?.totalReceivableAmountCurrencySymbol} {totalReceivables}
            </Text>
          </View>

          <FlatList
            scrollEnabled={false}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ScreenPayoutDetails', item)
                }>
                <PayoutCard item={item} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{paddingBottom: 20}}
          />
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
});

export default ScreenPayout;
