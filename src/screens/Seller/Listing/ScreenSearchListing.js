import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  RefreshControl,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {InputSearch} from '../../../components/InputGroup/Left';
import NetInfo from '@react-native-community/netinfo';
import StatusBadge from './components/ListingStatusBadge';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

import {getManageListingApi} from '../../../components/Api';
import {globalStyles} from '../../../assets/styles/styles';

const ScreenSearchListing = ({navigation}) => {
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

  // Search
  const handleSearchSubmit = e => {
    if (search == '') {
      Alert.alert('Validation', 'Search is required');
      setDataTable([]);
      return;
    }
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('Searching for:', searchText);
    // trigger your search logic here

    setNextToken('');
    setNextTokenParam('');
    setLoading(true);
    fetchData();
  };
  // Search

  const onPressItem = ({data}) => {
    navigation.navigate('ScreenMyStoreDetail', data);
  };

  return (
    <SafeAreaView style={[styles.mainContent, {paddingTop: insets.top}]}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      {/* Search and Icons */}
      <View style={[styles.stickyHeader]}>
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
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true} // shows an 'X' icon to clear
            />
          </View>
        </View>
      </View>
      {/* Search and Icons */}
      <ScrollView contentContainerStyle={{flex: 1}}>
        {dataTable.length === 0 && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={globalStyles.textLGGreyLight}>No Data</Text>
          </View>
        )}

        {dataTable.map((dataparse, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexDirection: 'column',
              padding: 10,
              marginHorizontal: 20,
              marginTop: 10,
              borderBottomColor: '#eee',
              borderBottomWidth: 1,
            }}
            onPress={() => onPressItem({data: dataparse})}>
            <View style={{flexDirection: 'row'}}>
              <Image
                style={styles.image}
                source={{
                  uri:
                    dataparse.imagePrimary ||
                    'https://via.placeholder.com/350x150.png?text=No+Image',
                }}
                resizeMode="cover"
              />
              <View style={{flexDirection: 'column'}}>
                <Text
                  style={[
                    globalStyles.textMDGreyDark,
                    {paddingLeft: 10, paddingBottom: 5},
                  ]}>
                  {`${dataparse.genus ?? ''} ${dataparse.species ?? ''}`}
                </Text>
                <View style={{paddingLeft: 10}}>
                  <StatusBadge statusCode={dataparse.status} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 20,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenSearchListing;
