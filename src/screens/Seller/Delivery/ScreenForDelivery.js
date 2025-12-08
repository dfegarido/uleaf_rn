/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../../../assets/styles/styles';
import { AuthContext } from '../../../auth/AuthProvider';
import { InputSearch } from '../../../components/InputGroup/Left';
import { retryAsync } from '../../../utils/utils';
import OrderActionSheet from '../Order/components/OrderActionSheet';

import {
  getListingTypeApi,
  getSortApi
} from '../../../components/Api';

import { getOrderForReceiving } from '../../../components/Api/sellerOrderApi';
import { updateLeafTrailStatus } from '../../../components/Api/getAdminLeafTrail';


import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';

import Options from '../../../assets/admin-icons/options.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';
import TagAsOptions from './TagAs';

const PlantCard = ({ orderType, plant, index, openTagAs }) => {
  let leafTrailStatus = plant.leafTrailStatus;

  if (leafTrailStatus === 'forReceiving') {
    leafTrailStatus = 'forDelivery';
  }

  const setTags = () => {
    openTagAs(plant.id)
  }
  console.log();

  const formatCamelCase = (camelCaseString) => {
    if (!camelCaseString) return '';

    const spacedString = camelCaseString.replace(/([A-Z])/g, ' $1');

    return spacedString.charAt(0).toUpperCase() + spacedString.slice(1);
  }
  
  return (
  <View style={styles.plantCardContainer}>
    <Text style={styles.countryText}>{index + 1}.</Text>
    <View style={styles.plantCard}>
      <View>
        <Image source={{ uri: plant.plantImage }} style={styles.plantImage} />
        {orderType === 'allOrders' && (
          <Text style={styles.plantCode}>{formatCamelCase(leafTrailStatus)}</Text>)}
      </View>
      <View style={styles.plantDetails}>
        <View>
          <View style={styles.plantHeader}>
            <View style={styles.plantCodeContainer}>
              <Text style={styles.plantCode}>{plant.plantCode}</Text>
            </View>
            <View style={styles.countryContainer}>
              <Text style={styles.countryText}>{plant.country}</Text>
              <CountryFlagIcon code={plant.country} width={24} height={16} />
              <TouchableOpacity onPress={setTags}>
                 <Options style={{paddingRight: 10}} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
          <Text style={styles.plantSubtext}>{plant.variegation} • {plant.size}</Text>
        </View>
        <View style={styles.plantFooter}>
          {plant.listingType && (
            <View style={styles.typeChip}>
              <Text style={styles.typeText}>{plant.listingType}</Text>
            </View>
          )}
          <Text style={styles.quantity}>{plant.quantity}X</Text>
        </View>
      </View>
    </View>
  </View>
)};

const ListFooter = ({ isLoadingMore, hasMore, noPlants }) => {
  if (noPlants) {
    return null;
  }
  if (isLoadingMore) {
    return (
      <>
        <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#556065' }}>Loading more...</Text>
        <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#699E73" />
      </>
    );
  }
  if (!hasMore) {
    return <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#556065' }}>You have reached the end of the list.</Text>;
  }
  return null;
};

const ScreenForDelivery = ({navigation, route}) => {
  const { orderType = 'forDelivery'} = route.params;
  
  const insets = useSafeAreaInsets();
  const {userInfo} = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [search, setSearch] = useState('');

  // Filters Action Sheet
  const [sortOptions, setSortOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  const [reusableSort, setReusableSort] = useState('');
  const [reusableDate, setReusableDate] = useState('');
  const [reusableListingType, setReusableListingType] = useState([]);
  const [reusableStartDate, setReusableStartDate] = useState('');
  const [reusableEndDate, setReusableEndDate] = useState('');

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const applyFilters = () => {
    setLastDocument(null); // Reset pagination
    setForDeliveryData([]); // Clear current data
    fetchForDelivery(true); // Fetch with new filters
  };

  const handleFilterView = () => {
    applyFilters();
    onClose();
  };

  const handleSearchSubmitRange = (startDate, endDate) => {
    const formattedStart = startDate
      ? new Date(startDate).toISOString().slice(0, 10)
      : '';
    const formattedEnd = endDate
      ? new Date(endDate).toISOString().slice(0, 10)
      : '';

    setReusableStartDate(formattedStart);
    setReusableEndDate(formattedEnd);
    applyFilters();
    onClose();
  };

  // For dropdown
  useEffect(() => {
    const fetchDataDropdown = async () => {
      try {
        await Promise.all([loadSortByData(), loadListingTypeData()]);
      } catch (error) {
        console.log('Error in dropdown:', error);
      }
    };

    fetchDataDropdown();
  }, []);

  const loadSortByData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getSortApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    let localSortData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    setSortOptions(localSortData);
  };

  const loadListingTypeData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load listing type api');
    }

    let localListingTypeData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));
    setListingTypeOptions(localListingTypeData);
  };

  const [error, setError] = useState(null);
  const [forDeliveryData, setForDeliveryData] = useState([]);
  const [lastDocument, setLastDocument] = useState(null);
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [isTagAsVisible, setTagAsVisible] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const setTagAs = async (status) => {
      console.log('status', status);
      console.log('orderId', orderId);
      setLoading(true);
        setTagAsVisible(!isTagAsVisible);
        const response = await updateLeafTrailStatus(orderId, status);
        console.log('response', response);
        if (response.success) {
          setLoading(false)
          Alert.alert('Success', 'Order status updated successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          setLoading(false)
          Alert.alert('Error', error.message);
        }  
  }

  const openTagAs = (id) => {
      console.log('id', id);
        setTagAsVisible(!isTagAsVisible);
        setOrderId(id)
  }

  const fetchForDelivery = async (isNewSearch = false, lastDoc = null) => {
    if (!isNewSearch && isLoadingMore) return; // Prevent multiple loads

    if (isNewSearch) {
      setLoading(true); // Show full-screen loader for new searches/filters
    } else {
      setIsLoadingMore(true);
    }

    try {
      let filters = {
        orderType,
        listingType: reusableListingType.join(','),
        startDate: reusableStartDate,
        endDate: reusableEndDate,
        lastDocument: isNewSearch ? null : lastDoc, // Use lastDoc for pagination
      };
      if (search) { filters.search = search;}
      if (reusableSort) { filters.sort = reusableSort === 'Oldest' ? 'asc' : 'desc';}
      if (reusableListingType.length === 0) { delete filters.listingType; }
      if (!reusableStartDate) { delete filters.startDate; }
      if (!reusableEndDate) { delete filters.endDate; }
      if (!filters.lastDocument) { delete filters.lastDocument; }

      console.log('filters', filters);

      const response = await getOrderForReceiving(filters);

      if (response.data) {
        setForDeliveryData(prevData => isNewSearch ? response.data : [...prevData, ...response.data]);
        setLastDocument(response.lastDocument || null);
        console.log('lastDocument', lastDocument);
        
        setHasMore(!!response.lastDocument);
      } else {
        if (isNewSearch) setForDeliveryData([]);
        setHasMore(false);
      }
      
      if (isNewSearch) {
        setTotalDataCount(response.total || 0);
      }

    } catch (e) {
        setError(e);
        console.error("Failed to fetch 'For Delivery' data:", e);
        Alert.alert("Error", "Failed to fetch data. Please try again.");
    } finally {
        if (isNewSearch) {
          setLoading(false);
        } else {
          setIsLoadingMore(false);
        }
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && lastDocument) {
      fetchForDelivery(false, lastDocument); // Pass the lastDocument to the fetch function
    }
  };

  const handleSearchSubmit = () => {
    applyFilters();
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const onClose = () => {
    setShowSheet(false);
  };

  useEffect(() => {
    fetchForDelivery(true);
  }, []);

  const formatCamelCase = (camelCaseString) => {
    if (!camelCaseString) return '';

    const spacedString = camelCaseString.replace(/([A-Z])/g, ' $1');

    return spacedString.charAt(0).toUpperCase() + spacedString.slice(1);
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: insets.top,
      }}>
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
          <TouchableOpacity style={styles.headerIcons} onPress={() => navigation.goBack()}>
                <LeftIcon width={30} hegiht={30} />
                 <Text style={styles.screenTitle}>Back to Delivery</Text>
            </TouchableOpacity>
          <View style={{flex: 1}} >
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true}
            />
          </View>
        </View>
      </View>
      
      {/* Filter Cards */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => onPressFilter('SORT')}
            style={styles.filterButton}>
            <SortIcon width={20} height={20}></SortIcon>
            <Text style={globalStyles.textSMGreyDark}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPressFilter('DATERANGE')}
            style={styles.filterButton}>
            <Text style={globalStyles.textSMGreyDark}>Date Range</Text>
            <DownIcon width={20} height={20}></DownIcon>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPressFilter('LISTINGTYPE')}
            style={styles.filterButton}>
            <Text style={globalStyles.textSMGreyDark}>Listing Type</Text>
            <DownIcon width={20} height={20}></DownIcon>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={forDeliveryData}
        renderItem={({ item, index }) => <PlantCard orderType={orderType} openTagAs={openTagAs} plant={item} index={index} />}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        ListHeaderComponent={
          <View style={styles.listHeaderTitleContainer}>
            <Text style={styles.listHeaderTitle}>{formatCamelCase(orderType)}:</Text>
            <View style={styles.listHeader}>
              <Text style={styles.totalCountText}>{totalDataCount} plant(s)</Text>
            </View>
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={<ListFooter noPlants={forDeliveryData.length === 0}isLoadingMore={isLoadingMore} hasMore={hasMore} />}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No plants found for: "{formatCamelCase(orderType)}".</Text>
            </View>
          )
        }
      />

      <OrderActionSheet
        code={code}
        visible={showSheet}
        onClose={onClose}
        sortOptions={sortOptions}
        listingTypeOptions={listingTypeOptions}
        sortValue={reusableSort}
        dateValue={reusableDate}
        sortChange={setReusableSort}
        dateChange={setReusableDate}
        listingTypeValue={reusableListingType}
        listingTypeChange={setReusableListingType}
        handleSearchSubmit={handleFilterView}
        handleSearchSubmitRange={handleSearchSubmitRange}
      />
      <TagAsOptions visible={isTagAsVisible}
        setTagAs={setTagAs}
        isMissing={orderType === 'missing'}
        isDamaged={orderType === 'damaged'}
        forShipping={orderType !== 'missing' && orderType !== 'damaged'}
        onClose={() => setTagAsVisible(false)}/>
    </SafeAreaView>
  );
};

export default ScreenForDelivery;

const styles = StyleSheet.create({
  listHeaderTitle: { 
    fontFamily: 'Inter', 
    fontWeight: '700',
    fontSize: 15, 
    color: '#202325', 
    marginRight: 10
  },
  listHeaderTitleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10 
  },
  screenTitle: { 
    fontFamily: 'Inter', 
    fontWeight: '700',
    fontSize: 15, 
    color: '#202325', 
    marginRight: 10
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  image: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
  filterScrollView: {
    flexGrow: 0,
    paddingVertical: 10,
    paddingLeft: 10,
    backgroundColor: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingRight: 30,
  },
  filterButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  totalCountText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantCardContainer: { 
    backgroundColor: '#F5F6F6', 
    paddingHorizontal: 12, 
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plantCard: { 
    flex: 1,
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    flexDirection: 'row', 
    gap: 12 
  },
  plantImage: { 
    width: 96, 
    height: 128, 
    borderRadius: 8 
  },
  plantDetails: { 
    flex: 1, 
    justifyContent: 'space-between', 
    gap: 8 
  },
  plantHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  plantCodeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  plantCode: { 
    fontFamily: 'Inter', 
    fontSize: 16, 
    color: '#647276' 
  },
  countryContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    marginLeft: 10
  },
  countryText: { 
    fontFamily: 'Inter', 
    fontWeight: '600', 
    fontSize: 16, 
    color: '#556065' 
  },
  plantName: { 
    fontFamily: 'Inter', 
    fontWeight: '700', 
    fontSize: 16, 
    color: '#202325', 
    marginVertical: 4 
  },
  plantSubtext: { 
    fontFamily: 'Inter', 
    fontSize: 16, 
    color: '#647276' 
  },
  plantFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  typeChip: { 
    backgroundColor: '#202325', 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 2 
  },
  typeText: { 
    color: '#FFFFFF', 
    fontFamily: 'Inter', 
    fontWeight: '600', 
    fontSize: 12 
  },
  quantity: { 
    fontFamily: 'Inter', 
    fontWeight: '600', 
    fontSize: 16, 
    color: '#393D40' 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: Dimensions.get('window').height * 0.5,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
  },
});
