import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {InputSearch} from '../../../components/InputGroup/Left';
import NetInfo from '@react-native-community/netinfo';
import StatusBadge from './components/ListingStatusBadge';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

import {getManageListingApi} from '../../../components/Api';
import {globalStyles} from '../../../assets/styles/styles';
import {AuthContext} from '../../../auth/AuthProvider';

const ScreenSearchListing = ({navigation}) => {
  const {userInfo} = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [nextToken, setNextToken] = useState('');
  const [nextTokenParam, setNextTokenParam] = useState('');
  const [dataTable, setDataTable] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (
    filterMine,
    sortBy,
    genus,
    variegation,
    listingType,
    status,
    discount,
    limit,
    plant,
    pinTag,
    nextPageToken,
  ) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const getManageListingApiData = await getManageListingApi(
      filterMine,
      sortBy,
      genus,
      variegation,
      listingType,
      status,
      discount,
      limit,
      plant,
      pinTag,
      nextPageToken,
    );

    if (!getManageListingApiData?.success) {
      throw new Error(
        getManageListingApiData?.message || 'Login verification failed.',
      );
    }

    console.log(getManageListingApiData.listings);
    setNextToken(getManageListingApiData?.nextPageToken);
    setDataTable(
      prev =>
        nextTokenParam
          ? [...prev, ...(getManageListingApiData?.listings || [])] // append
          : getManageListingApiData?.listings || [], // replace
    );
  };

  const fetchData = async () => {
    try {
      // setErrorMessage('');
      await loadData(
        true,
        '',
        '',
        '',
        '',
        'All',
        false,
        10,
        search,
        false,
        nextTokenParam,
      );
    } catch (error) {
      console.log('Error in fetchData:', error.message);

      Alert.alert('Listing', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch all listings on mount
  useEffect(() => {
    setLoading(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime search as user types (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setNextToken('');
      setNextTokenParam('');
      setLoading(true);
      fetchData();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onPressItem = ({data}) => {
    navigation.navigate('ScreenMyStoreDetail', data);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}

      {/* Header */}
      <View style={[styles.header, {paddingTop: 12}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}>
          <LeftIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.searchField}>
          <InputSearch
            placeholder="Search listings..."
            value={search}
            onChangeText={setSearch}
            showClear={true}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {dataTable.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={globalStyles.textLGGreyLight}>No Data</Text>
          </View>
        )}

        <View style={styles.resultsContainer}>
          {dataTable.map((dataparse, index) => {
            const plantName = `${dataparse.genus ?? ''} ${dataparse.species ?? ''}`.trim() || 'Unknown Plant';
            const price = dataparse.localPrice || 0;
            const currencySymbol = userInfo?.currencySymbol || '$';

            return (
              <TouchableOpacity
                key={index}
                style={styles.resultRow}
                onPress={() => onPressItem({data: dataparse})}
                activeOpacity={0.7}>
                <View style={styles.resultLeft}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {plantName}
                  </Text>
                  <Text style={styles.resultPrice}>
                    {currencySymbol}{parseFloat(price).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.resultRight}>
                  <StatusBadge statusCode={dataparse.status} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{height: insets.bottom + 20}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchField: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultLeft: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#539461',
  },
  resultRight: {
    flexShrink: 0,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenSearchListing;
