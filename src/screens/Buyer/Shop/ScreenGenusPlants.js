/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../auth/AuthProvider';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {PlantItemCard} from '../../../components/PlantItemCard';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import {
  getSortApi,
  getGenusApi,
  getVariegationApi,
  getBuyerListingsApi,
  addToCartApi,
} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import NewArrivalsIcon from '../../../assets/buyer-icons/megaphone.svg';
import PriceDropIcon from '../../../assets/buyer-icons/price-drop-icons.svg';
import PromoBadge from '../../../components/PromoBadge/PromoBadge';

const GenusHeader = ({genus, navigation}) => {
  const [searchText, setSearchText] = useState('');
  
  return (
    <View style={styles.header}>
      <View style={styles.controls}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${genus || 'plants'}...`}
                placeholderTextColor="#647276"
                value={searchText}
                onChangeText={setSearchText}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>

        {/* Wishlist Action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScreenWishlist')}>
          <Wishicon width={24} height={24} />
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity 
          style={styles.profileContainer}
          onPress={() => navigation.navigate('ScreenProfile')}>
          <View style={styles.avatar}>
            <AvatarIcon width={32} height={32} />
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ScreenGenusPlants = ({navigation, route}) => {
  const {user} = useAuth();
  const {genus} = route.params || {};

  // Filter modal state
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [reusableSort, setReusableSort] = useState('createdAt');
  const [reusableGenus, setReusableGenus] = useState([]);
  const [reusableVariegation, setReusableVariegation] = useState([]);
  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  // Price filter state
  const [priceOptions, setPriceOptions] = useState([
    {label: '$0 - $20', value: '0-20'},
    {label: '$21 - $50', value: '21-50'},
    {label: '$51 - $100', value: '51-100'},
    {label: '$101 - $200', value: '101-200'},
    {label: '$201 - $500', value: '201-500'},
    {label: '$501 +', value: '501+'},
  ]);
  const [reusablePrice, setReusablePrice] = useState('');

  // Plants data state
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Load filter options on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          loadSortByData(),
          loadGenusData(),
          loadVariegationData(),
        ]);
      } catch (error) {
        console.log('Error loading filter data:', error);
      }
    };

    fetchData();
  }, []);

  // Load plants when screen comes into focus or genus changes
  useFocusEffect(
    React.useCallback(() => {
      loadPlants(true);
    }, [genus, reusableSort, reusableVariegation, reusablePrice, searchTerm]),
  );

  const loadSortByData = async () => {
    const buyerSortOptions = [
      {label: 'Newest to Oldest', value: 'createdAt'},
      {label: 'Price Low to High', value: 'usdPrice'},
      {label: 'Price High to Low', value: 'usdPrice'},
      {label: 'Most Loved', value: 'loveCount'},
    ];

    setSortOptions(buyerSortOptions);
  };

  const loadGenusData = async () => {
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getGenusApi(), 10, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load genus api');
      }

      let localGenusData = res.data.map(item => ({
        label: item.name,
        value: item.name,
      }));

      setGenusOptions(localGenusData);
    } catch (error) {
      console.log('Error loading genus data:', error);
    }
  };

  const loadVariegationData = async () => {
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getVariegationApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load variegation api');
      }

      let localVariegationData = res.data.map(item => ({
        label: item.name,
        value: item.name,
      }));

      setVariegationOptions(localVariegationData);
    } catch (error) {
      console.log('Error loading variegation data:', error);
    }
  };

  const loadPlants = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Parse price range
      let minPrice, maxPrice;
      if (reusablePrice) {
        const [min, max] = reusablePrice.split('-');
        minPrice = min;
        maxPrice = max === '+' ? undefined : max;
      }

      // Determine sort order
      const sortOrder = 
        reusableSort === 'usdPrice' && !refresh ? 'asc' : 
        reusableSort === 'usdPrice' ? 'desc' : 'desc';

      const params = {
        limit,
        offset: refresh ? 0 : offset,
        genus,
        sortBy: reusableSort,
        sortOrder,
        variegation: reusableVariegation.length > 0 ? reusableVariegation.join(',') : undefined,
        minPrice,
        maxPrice,
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.plant = searchTerm.trim();
      }

      console.log('Loading plants with params:', params);

      const res = await retryAsync(() => getBuyerListingsApi(params), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plants');
      }

      console.log('Plants loaded successfully:', res.data?.listings?.length || 0);

      const newPlants = res.data?.listings || [];
      
      if (refresh) {
        setPlants(newPlants);
        setOffset(limit);
      } else {
        setPlants(prev => [...prev, ...newPlants]);
        setOffset(prev => prev + limit);
      }

      // Check if there are more plants to load
      setHasMore(newPlants.length === limit);

    } catch (error) {
      console.error('Error loading plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleFilterView = () => {
    // Handle filter application here
    if (code === 'SORT') {
      console.log('Applied sort filter:', reusableSort);
    } else if (code === 'PRICE') {
      console.log('Applied price filter:', reusablePrice);
    } else if (code === 'GENUS') {
      console.log('Applied genus filter:', reusableGenus);
    } else if (code === 'VARIEGATION') {
      console.log('Applied variegation filter:', reusableVariegation);
    }
    setShowSheet(false);
    loadPlants(true);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const handleAddToCart = async (plant) => {
    try {
      if (!plant.plantCode) {
        Alert.alert('Error', 'Plant code is missing');
        return;
      }

      // For single plants, use the first available pot size
      // For wholesale/grower's choice, you might want to show a selection modal
      const potSize = plant.potSize || (plant.variations && plant.variations[0]?.potSize) || 'Standard';
      
      const params = {
        plantCode: plant.plantCode,
        potSize: potSize,
        quantity: 1,
      };

      const res = await retryAsync(() => addToCartApi(params), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to add to cart');
      }

      Alert.alert('Success', 'Plant added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPlants(false);
    }
  };

  const filterOptions = [
    {label: 'Sort', leftIcon: SortIcon},
    {label: 'Price', rightIcon: DownIcon},
    {label: 'Genus', rightIcon: DownIcon},
    {label: 'Variegation', rightIcon: DownIcon},
    {label: 'Country', rightIcon: DownIcon},
    {label: 'Shipping Index', rightIcon: DownIcon},
    {label: 'Acclimation Index', rightIcon: DownIcon},
    {label: 'Listing Type', rightIcon: DownIcon},
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <GenusHeader genus={genus} navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading plants...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GenusHeader genus={genus} navigation={navigation} />

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}>
        {filterOptions.map((option, idx) => (
          <TouchableOpacity
            key={option.label}
            onPress={() => {
              if (option.label === 'Sort') {
                onPressFilter('SORT');
              } else if (option.label === 'Price') {
                onPressFilter('PRICE');
              } else if (option.label === 'Genus') {
                onPressFilter('GENUS');
              } else if (option.label === 'Variegation') {
                onPressFilter('VARIEGATION');
              }
            }}
            style={styles.filterButton}>
            {option.leftIcon && (
              <option.leftIcon
                width={20}
                height={20}
                style={{marginRight: 4}}
              />
            )}
            <Text style={styles.filterButtonText}>{option.label}</Text>
            {option.rightIcon && (
              <option.rightIcon
                width={20}
                height={20}
                style={{marginLeft: 4}}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plants Grid */}
      <ScrollView
        style={styles.plantsContainer}
        contentContainerStyle={styles.plantsGrid}
        onScroll={({nativeEvent}) => {
          const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
        refreshing={refreshing}
        onRefresh={() => loadPlants(true)}>
        
        {plants.length > 0 ? (
          <>
            {plants.map((plant, idx) => (
              <PlantItemCard
                key={plant.plantCode || idx}
                data={plant}
                onPress={() => {
                  console.log('Navigate to plant detail:', plant.plantCode);
                  // TODO: Navigate to plant detail screen
                  // navigation.navigate('PlantDetail', {plantCode: plant.plantCode});
                }}
                onAddToCart={() => handleAddToCart(plant)}
                style={styles.plantCard}
              />
            ))}
            
            {/* Load More Indicator */}
            {loadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#539461" />
                <Text style={styles.loadMoreText}>Loading more plants...</Text>
              </View>
            )}
            
            {!hasMore && plants.length > 0 && (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>
                  You've reached the end of {genus || 'plants'} collection
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No {genus} plants found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <ReusableActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        genusOptions={genusOptions}
        variegationOptions={variegationOptions}
        priceOptions={priceOptions}
        sortValue={reusableSort}
        sortChange={setReusableSort}
        genusValue={reusableGenus}
        genusChange={setReusableGenus}
        variegationValue={reusableVariegation}
        variegationChange={setReusableVariegation}
        priceValue={reusablePrice}
        priceChange={setReusablePrice}
        handleSearchSubmit={handleFilterView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    height: 100,
    marginBottom: -40,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
    width: '100%',
    height: 58,
  },
  backButton: {
    width: 24,
    height: 24,
    flex: 0,
  },
  searchContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 209,
    height: 40,
    flex: 1,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 40,
    flex: 0,
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    height: 40,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
  },
  searchInput: {
    width: 145,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 40,
    flex: 0,
  },
  avatar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 32,
    minWidth: 32,
    height: 32,
    minHeight: 32,
    borderRadius: 1000,
    position: 'relative',
    flex: 0,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
    zIndex: 1,
  },
  badgeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    left: 1,
    top: 1,
    backgroundColor: '#E7522F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
  },
  filterBar: {
    flexGrow: 0,
    paddingTop: 0,
    paddingBottom: 8,
  },
  filterBarContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  filterButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    padding: 8,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#393D40',
  },
  plantsContainer: {
    flex: 1,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    padding: 15,
    gap: 13,
    paddingBottom: 100,
  },
  plantCard: {
    width: 166,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadMoreContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  endOfListContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#393D40',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ScreenGenusPlants;
