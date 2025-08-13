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
  Image,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../auth/AuthProvider';
import {useFilters} from '../../../context/FilterContext';
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
  searchPlantsApi,
} from '../../../components/Api';
import {
  getCountryApi,
  getListingTypeApi,
  getShippingIndexApi,
  getAcclimationIndexApi,
} from '../../../components/Api/dropdownApi';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {
  setCacheData,
  getCacheData,
  CACHE_KEYS,
} from '../../../utils/dropdownCache';
import PromoBadgeList from '../../../components/PromoBadgeList';

const GenusHeader = ({
  genus,
  navigation,
  searchTerm,
  setSearchTerm,
  setIsSearchFocused,
}) => {
  return (
    <View style={styles.stickyHeader}>
    <View style={styles.header}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <BackIcon width={24} height={24} />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <View style={styles.searchField}>
          <View style={styles.textField}>
            <SearchIcon width={24} height={24} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search iLeafU"
              placeholderTextColor="#647276"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Close search results when input loses focus
                setTimeout(() => {
                  setIsSearchFocused(false);
                }, 150); // Small delay to allow for result tap
              }}
              multiline={false}
              numberOfLines={1}
              // Disable native autocomplete and suggestions
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              textContentType="none"
              dataDetectorTypes="none"
              keyboardType="default"
            />
          </View>
        </View>
      </View>

      <View style={styles.headerIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            // Wishlist feature temporarily disabled
            console.log('Wishlist feature is temporarily disabled');
          }}>
          <Wishicon width={40} height={40} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('ScreenProfile')}>
          <AvatarIcon width={40} height={40} />
        </TouchableOpacity>
      </View>
    </View>
    
    <PromoBadgeList navigation={navigation} />
    </View>
  );
};

const ScreenGenusPlants = ({navigation, route}) => {
  const {user} = useAuth();
  const {genus} = route.params || {};
  const {
    globalFilters,
    appliedFilters,
    updateFilters,
    buildFilterParams,
    hasAppliedFilters
  } = useFilters();
  const justFiltered = React.useRef(false);

  // Filter modal state
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  // Price filter state
  const [priceOptions, setPriceOptions] = useState([
    {label: '$0 - $20', value: '$0 - $20'},
    {label: '$21 - $50', value: '$21 - $50'},
    {label: '$51 - $100', value: '$51 - $100'},
    {label: '$101 - $200', value: '$101 - $200'},
    {label: '$201 - $500', value: '$201 - $500'},
    {label: '$501 +', value: '$501 +'},
  ]);

  // Additional filter options - will be loaded from APIs
  const [countryOptions, setCountryOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);
  const [shippingIndexOptions, setShippingIndexOptions] = useState([]);
  const [acclimationIndexOptions, setAcclimationIndexOptions] = useState([]);

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
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Debounced search effect - triggers after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        console.log('🔍 Genus screen search triggered for:', searchTerm);
        performSearch(searchTerm.trim());
      } else if (searchTerm.trim().length === 0) {
        setSearchResults([]);
        setLoadingSearch(false);
      }
    }, 800); // 800ms delay for "finished typing" detection

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);
      console.log('🔍 Starting genus screen search for:', searchTerm);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const searchParams = {
        query: searchTerm,
        limit: 4,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      const res = await searchPlantsApi(searchParams);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search plants.');
      }

      const plants = res.data?.plants || [];
      console.log(`✅ Genus screen search completed: found ${plants.length} plants for "${searchTerm}"`);
      console.log('📋 First plant data:', plants[0]); // Debug plant structure
      setSearchResults(plants);
      
    } catch (error) {
      console.error('❌ Error performing genus screen search:', error);
      setSearchResults([]);
      
      Alert.alert(
        'Search Error',
        'Could not search for plants. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  // Load filter options on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load all dropdown data in parallel
        // Data will be served from cache if available, otherwise fetched from API and cached
        await Promise.all([
          loadSortByData(),
          loadGenusData(),
          loadVariegationData(),
          loadCountryData(),
          loadListingTypeData(),
          loadShippingIndexData(),
          loadAcclimationIndexData(),
        ]);
        console.log('All dropdown data loaded successfully');
        
        // Load plants using global filters if available, otherwise load all plants
        loadPlants(true);
      } catch (error) {
        console.log('Error loading filter data:', error);
      }
    };

    fetchData();
  }, []); // Only run on mount

  // Load plants when screen comes into focus - but only if filters were applied from another screen
  useFocusEffect(
    React.useCallback(() => {
      if (justFiltered.current) {
        // Don't reload if we just applied filters
        justFiltered.current = false;
      } else if (hasAppliedFilters) {
        // Only reload if there are applied filters from another screen
        console.log('Loading plants with applied filters from another screen:', appliedFilters);
        loadPlants(true);
      }
      // If no applied filters, don't auto-reload to prevent unnecessary API calls
    }, [appliedFilters, hasAppliedFilters]),
  );

  const loadSortByData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.SORT);
      if (cachedData) {
        setSortOptions(cachedData);
        return;
      }

      // For buyer genus screen, use sort options that match ScreenShop
      const buyerSortOptions = [
        {label: 'Newest to Oldest', value: 'Newest to Oldest'},
        {label: 'Price Low to High', value: 'Price Low to High'},
        {label: 'Price High to Low', value: 'Price High to Low'},
        {label: 'Most Loved', value: 'Most Loved'},
      ];

      setSortOptions(buyerSortOptions);
      
      // Cache the data
      await setCacheData(CACHE_KEYS.SORT, buyerSortOptions);
    } catch (error) {
      console.log('Error loading sort data:', error);
    }
  };

  const loadGenusData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.GENUS);
      if (cachedData) {
        setGenusOptions(cachedData);
        return;
      }

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
      
      // Cache the data
      await setCacheData(CACHE_KEYS.GENUS, localGenusData);
    } catch (error) {
      console.log('Error loading genus data:', error);
    }
  };

  const loadVariegationData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.VARIEGATION);
      if (cachedData) {
        setVariegationOptions(cachedData);
        return;
      }

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
      
      // Cache the data
      await setCacheData(CACHE_KEYS.VARIEGATION, localVariegationData);
    } catch (error) {
      console.log('Error loading variegation data:', error);
    }
  };

  const loadCountryData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.COUNTRY);
      if (cachedData) {
        setCountryOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getCountryApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load country api');
      }

      let localCountryData = res.data.map(item => ({
        label: item.name || item.country,
        value: item.name || item.country,
      }));

      setCountryOptions(localCountryData);
      
      // Cache the data
      await setCacheData(CACHE_KEYS.COUNTRY, localCountryData);
    } catch (error) {
      console.log('Error loading country data:', error);
    }
  };

  const loadListingTypeData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.LISTING_TYPE);
      if (cachedData) {
        setListingTypeOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load listing type api');
      }

      let localListingTypeData = res.data.map(item => ({
        label: item.name || item.listingType,
        value: item.name || item.listingType,
      }));

      setListingTypeOptions(localListingTypeData);
      
      // Cache the data
      await setCacheData(CACHE_KEYS.LISTING_TYPE, localListingTypeData);
    } catch (error) {
      console.log('Error loading listing type data:', error);
    }
  };

  const loadShippingIndexData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.SHIPPING_INDEX);
      if (cachedData) {
        setShippingIndexOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getShippingIndexApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load shipping index api');
      }

      let localShippingIndexData = res.data.map(item => ({
        label: item.name || item.shippingIndex,
        value: item.name || item.shippingIndex,
      }));

      setShippingIndexOptions(localShippingIndexData);
      
      // Cache the data
      await setCacheData(CACHE_KEYS.SHIPPING_INDEX, localShippingIndexData);
    } catch (error) {
      console.log('Error loading shipping index data:', error);
    }
  };

  const loadAcclimationIndexData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.ACCLIMATION_INDEX);
      if (cachedData) {
        setAcclimationIndexOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getAcclimationIndexApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load acclimation index api');
      }

      let localAcclimationIndexData = res.data.map(item => ({
        label: item.name || item.acclimationIndex,
        value: item.name || item.acclimationIndex,
      }));

      setAcclimationIndexOptions(localAcclimationIndexData);
      
      // Cache the data
      await setCacheData(CACHE_KEYS.ACCLIMATION_INDEX, localAcclimationIndexData);
    } catch (error) {
      console.log('Error loading acclimation index data:', error);
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

      const baseParams = {
        limit,
        offset: refresh ? 0 : offset,
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        baseParams.plant = searchTerm.trim();
      }

      // Add genus from route params if available and no genus filter is applied
      if (genus && genus !== 'All' && (!appliedFilters?.genus || appliedFilters.genus.length === 0)) {
        baseParams.genus = genus.toUpperCase(); // Ensure genus is uppercase as expected by API
        console.log('Setting genus parameter:', genus.toUpperCase());
      }

      // Use buildFilterParams to construct all filter parameters
      const params = buildFilterParams(baseParams);

      console.log('Loading plants with params:', params);
      console.log('Applied filters:', appliedFilters);
      console.log('Has applied filters:', hasAppliedFilters);

      const res = await retryAsync(() => getBuyerListingsApi(params), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plants');
      }

      console.log('Plants loaded successfully:', res.data?.listings?.length || 0);

      const rawPlants = res.data?.listings || [];
      
      // Filter out plants with invalid data (same logic as BrowseMorePlants and ScreenPlantDetail)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        // Check if plant has a valid price (greater than 0)
        const hasValidPrice = (plant.finalPrice && plant.finalPrice > 0) ||
                             (plant.usdPriceNew && plant.usdPriceNew > 0) ||
                             (plant.usdPrice && plant.usdPrice > 0) ||
                             (plant.localPriceNew && plant.localPriceNew > 0) ||
                             (plant.localPrice && plant.localPrice > 0);
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle && hasValidPrice;
        
        if (!isValid) {
          console.log('Filtering out invalid genus plant:', {
            plantCode: plant?.plantCode,
            genus: plant?.genus,
            species: plant?.species,
            variegation: plant?.variegation,
            plantName: plant?.plantName,
            finalPrice: plant?.finalPrice,
            usdPrice: plant?.usdPrice,
            hasValidPrice: hasValidPrice
          });
        }
        
        return isValid;
      });
      
      console.log(`Filtered ${rawPlants.length} genus plants down to ${newPlants.length} valid plants`);
      
      if (refresh) {
        setPlants(newPlants);
      } else {
        // Filter out duplicates before appending new plants
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
      }

      // Check if there are more plants to load
      setHasMore(newPlants.length === limit);

      setOffset(prev => prev + (newPlants.length || 0));

    } catch (error) {
      console.error('Error loading plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants with specific filters (used when applying filters to avoid timing issues)
  const loadPlantsWithFilters = async (filters, refresh = false) => {
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

      const baseParams = {
        limit,
        offset: refresh ? 0 : offset,
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        baseParams.plant = searchTerm.trim();
      }

      // Add genus from route params if available and no genus filter is applied
      if (genus && genus !== 'All' && (!filters.genus || filters.genus.length === 0)) {
        baseParams.genus = genus;
      }

      // Build filter parameters manually with the provided filters
      console.log('Building filter params with local filters:', filters);
      
      // Apply sort filter
      if (filters.sort && filters.sort.length > 0) {
        const sortValue = Array.isArray(filters.sort) ? filters.sort[0] : filters.sort;
        if (sortValue === 'Newest to Oldest') {
          baseParams.sortBy = 'createdAt';
          baseParams.sortOrder = 'desc';
        } else if (sortValue === 'Price Low to High') {
          baseParams.sortBy = 'price';
          baseParams.sortOrder = 'asc';
        } else if (sortValue === 'Price High to Low') {
          baseParams.sortBy = 'price';
          baseParams.sortOrder = 'desc';
        } else if (sortValue === 'Most Loved') {
          baseParams.sortBy = 'loveCount';
          baseParams.sortOrder = 'desc';
        }
      } else {
        // Default sort
        baseParams.sortBy = 'createdAt';
        baseParams.sortOrder = 'desc';
      }

      // Apply other filters
      if (filters.listingType && filters.listingType.length > 0) {
        baseParams.listingType = Array.isArray(filters.listingType) ? filters.listingType.join(',') : filters.listingType;
      }
      
      if (filters.genus && filters.genus.length > 0) {
        baseParams.genus = Array.isArray(filters.genus) ? filters.genus.join(',') : filters.genus;
      }
      
      if (filters.variegation && filters.variegation.length > 0) {
        baseParams.variegation = Array.isArray(filters.variegation) ? filters.variegation.join(',') : filters.variegation;
      }
      
      if (filters.country && filters.country.length > 0) {
        baseParams.country = Array.isArray(filters.country) ? filters.country.join(',') : filters.country;
      }
      
      if (filters.shippingIndex && filters.shippingIndex.length > 0) {
        baseParams.shippingIndex = Array.isArray(filters.shippingIndex) ? filters.shippingIndex.join(',') : filters.shippingIndex;
      }
      
      if (filters.acclimationIndex && filters.acclimationIndex.length > 0) {
        baseParams.acclimationIndex = Array.isArray(filters.acclimationIndex) ? filters.acclimationIndex.join(',') : filters.acclimationIndex;
      }

      // Apply price filter
      if (filters.price && filters.price.length > 0) {
        const priceValue = Array.isArray(filters.price) ? filters.price[0] : filters.price;
        if (priceValue === '$0 - $20') {
          baseParams.minPrice = 0;
          baseParams.maxPrice = 20;
        } else if (priceValue === '$21 - $50') {
          baseParams.minPrice = 21;
          baseParams.maxPrice = 50;
        } else if (priceValue === '$51 - $100') {
          baseParams.minPrice = 51;
          baseParams.maxPrice = 100;
        } else if (priceValue === '$101 - $200') {
          baseParams.minPrice = 101;
          baseParams.maxPrice = 200;
        } else if (priceValue === '$201 - $500') {
          baseParams.minPrice = 201;
          baseParams.maxPrice = 500;
        } else if (priceValue === '$501 +') {
          baseParams.minPrice = 501;
        }
      }

      console.log('Loading plants with local filter params:', baseParams);

      const res = await retryAsync(() => getBuyerListingsApi(baseParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plants');
      }

      console.log('Plants loaded successfully with local filters:', res.data?.listings?.length || 0);

      const rawPlants = res.data?.listings || [];
      
      // Filter out plants with invalid data (same logic as BrowseMorePlants and ScreenPlantDetail)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        // Check if plant has a valid price (greater than 0)
        const hasValidPrice = (plant.finalPrice && plant.finalPrice > 0) ||
                             (plant.usdPriceNew && plant.usdPriceNew > 0) ||
                             (plant.usdPrice && plant.usdPrice > 0) ||
                             (plant.localPriceNew && plant.localPriceNew > 0) ||
                             (plant.localPrice && plant.localPrice > 0);
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle && hasValidPrice;
        
        if (!isValid) {
          console.log('Filtering out invalid genus plant (local filters):', {
            plantCode: plant?.plantCode,
            genus: plant?.genus,
            species: plant?.species,
            variegation: plant?.variegation,
            plantName: plant?.plantName,
            finalPrice: plant?.finalPrice,
            usdPrice: plant?.usdPrice,
            hasValidPrice: hasValidPrice
          });
        }
        
        return isValid;
      });
      
      console.log(`Filtered ${rawPlants.length} genus plants (local filters) down to ${newPlants.length} valid plants`);
      
      if (refresh) {
        setPlants(newPlants);
      } else {
        // Filter out duplicates before appending new plants
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
      }

      // Check if there are more plants to load
      setHasMore(newPlants.length === limit);

      setOffset(prev => prev + (newPlants.length || 0));

    } catch (error) {
      console.error('Error loading plants with filters:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Local filter state - separate from global state until "View" is clicked
  const [localFilters, setLocalFilters] = useState({
    sort: globalFilters.sort || [],
    price: globalFilters.price || [],
    genus: globalFilters.genus || [],
    variegation: globalFilters.variegation || [],
    country: globalFilters.country || [],
    listingType: globalFilters.listingType || [],
    shippingIndex: globalFilters.shippingIndex || [],
    acclimationIndex: globalFilters.acclimationIndex || [],
  });

  // Update local filters when global filters change (e.g., from another screen)
  useEffect(() => {
    setLocalFilters({
      sort: globalFilters.sort || [],
      price: globalFilters.price || [],
      genus: globalFilters.genus || [],
      variegation: globalFilters.variegation || [],
      country: globalFilters.country || [],
      listingType: globalFilters.listingType || [],
      shippingIndex: globalFilters.shippingIndex || [],
      acclimationIndex: globalFilters.acclimationIndex || [],
    });
  }, [globalFilters]);

  // Filter update functions that update LOCAL state only (not global state until "View" is clicked)
  const handleSortChange = (value) => {
    setLocalFilters(prev => ({ ...prev, sort: value }));
  };

  const handlePriceChange = (value) => {
    setLocalFilters(prev => ({ ...prev, price: value }));
  };

  const handleGenusChange = (value) => {
    setLocalFilters(prev => ({ ...prev, genus: value }));
  };

  const handleVariegationChange = (value) => {
    setLocalFilters(prev => ({ ...prev, variegation: value }));
  };

  const handleCountryChange = (value) => {
    setLocalFilters(prev => ({ ...prev, country: value }));
  };

  const handleListingTypeChange = (value) => {
    setLocalFilters(prev => ({ ...prev, listingType: value }));
  };

  const handleShippingIndexChange = (value) => {
    setLocalFilters(prev => ({ ...prev, shippingIndex: value }));
  };

  const handleAcclimationIndexChange = (value) => {
    setLocalFilters(prev => ({ ...prev, acclimationIndex: value }));
  };

  const handleFilterView = () => {
    console.log('Applying local filters to global state:', localFilters);
    
    // Update global filters with local filter selections
    updateFilters({
      sort: localFilters.sort,
      price: localFilters.price,
      genus: localFilters.genus,
      variegation: localFilters.variegation,
      country: localFilters.country,
      listingType: localFilters.listingType,
      shippingIndex: localFilters.shippingIndex,
      acclimationIndex: localFilters.acclimationIndex,
    });
    
    setShowSheet(false);
    
    // Show skeleton loading while applying filters
    setLoading(true);
    setPlants([]); // Clear current plants to show skeleton
    
    // Apply filters and load new data
    justFiltered.current = true;
    
    // Call loadPlants directly with local filters to avoid timing issues
    loadPlantsWithFilters(localFilters, true);
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

  return (
    <View style={styles.container}>
      <GenusHeader
        genus={genus}
        navigation={navigation}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setIsSearchFocused={setIsSearchFocused}
      />

      {/* Search Results - Positioned outside header to appear above content */}
      {isSearchFocused && searchTerm.trim().length >= 2 && (
        <View style={styles.searchResultsContainer}>
          {loadingSearch ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching plants...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsList}>
              {searchResults.map((plant, index) => (
                <TouchableOpacity
                  key={`${plant.id}_${index}`}
                  style={styles.searchResultItem}
                  onPress={() => {
                    if (plant.plantCode) {
                      navigation.navigate('ScreenPlantDetail', {
                        plantCode: plant.plantCode,
                      });
                    } else {
                      console.error('❌ Missing plantCode for plant:', plant);
                      Alert.alert(
                        'Error',
                        'Unable to view plant details. Missing plant code.',
                      );
                    }
                  }}>
                  <Text style={styles.searchResultName} numberOfLines={2}>
                    {plant.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No plants found for "{searchTerm}"
              </Text>
            </View>
          )}
        </View>
      )}

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
              } else if (option.label === 'Country') {
                onPressFilter('COUNTRY');
              } else if (option.label === 'Shipping Index') {
                onPressFilter('SHIPPING_INDEX');
              } else if (option.label === 'Acclimation Index') {
                onPressFilter('ACCLIMATION_INDEX');
              } else if (option.label === 'Listing Type') {
                onPressFilter('LISTING_TYPE');
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
          <View style={styles.plantsGridContainer}>
            {plants.map((plant, idx) => {
              // Additional safety check before rendering
              if (!plant || 
                  !plant.plantCode || 
                  typeof plant.plantCode !== 'string' ||
                  plant.plantCode.trim() === '') {
                console.log('Skipping invalid genus plant at render:', plant);
                return null;
              }
              
              // Ensure title and subtitle are safe
              const hasValidTitle = (plant.genus && typeof plant.genus === 'string') || 
                                   (plant.plantName && typeof plant.plantName === 'string');
              const hasValidSubtitle = (plant.species && typeof plant.species === 'string') || 
                                      (plant.variegation && typeof plant.variegation === 'string');
              
              if (!hasValidTitle || !hasValidSubtitle) {
                console.log('Skipping genus plant with invalid text fields:', plant);
                return null;
              }
              
              return (
                <View 
                  key={plant.plantCode || `genus-plant-${idx}`} 
                  style={[
                    styles.plantCardWrapper,
                    // Remove right margin for every second item (right column) or if it's the last item
                    (idx + 1) % 2 === 0 || idx === plants.length - 1 ? { marginRight: 0 } : {}
                  ]}
                >
                  <PlantItemCard
                    data={plant}
                    onPress={() => {
                      console.log('Navigate to plant detail:', plant.plantCode);
                      // TODO: Navigate to plant detail screen
                      // navigation.navigate('PlantDetail', {plantCode: plant.plantCode});
                    }}
                    onAddToCart={() => handleAddToCart(plant)}
                  />
                </View>
              );
            }).filter(Boolean)}
            
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
          </View>
        ) : loading ? (
          // Loading state with skeleton placeholders
          <View style={styles.plantsGridContainer}>
            {Array.from({length: 6}).map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.plantCardWrapper,
                  (idx + 1) % 2 === 0 || idx === 5 ? { marginRight: 0 } : {}
                ]}
              >
                <View style={styles.skeletonCard}>
                  <View style={styles.skeletonImage} />
                  <View style={styles.skeletonTextLarge} />
                  <View style={styles.skeletonTextSmall} />
                  <View style={styles.skeletonPrice} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../../../assets/images/no-genus.jpg')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
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
        countryOptions={countryOptions}
        listingTypeOptions={listingTypeOptions}
        shippingIndexOptions={shippingIndexOptions}
        acclimationIndexOptions={acclimationIndexOptions}
        sortValue={localFilters.sort}
        sortChange={handleSortChange}
        genusValue={localFilters.genus}
        genusChange={handleGenusChange}
        variegationValue={localFilters.variegation}
        variegationChange={handleVariegationChange}
        priceValue={localFilters.price}
        priceChange={handlePriceChange}
        countryValue={localFilters.country}
        countryChange={handleCountryChange}
        listingTypeValue={localFilters.listingType}
        listingTypeChange={handleListingTypeChange}
        shippingIndexValue={localFilters.shippingIndex}
        shippingIndexChange={handleShippingIndexChange}
        acclimationIndexValue={localFilters.acclimationIndex}
        acclimationIndexChange={handleAcclimationIndexChange}
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
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingBottom: 12,
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 12,
    backgroundColor: '#fff',
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
    paddingTop: 120,
  },
  plantsGrid: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  plantsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Align items to the left
    alignItems: 'flex-start',
    marginTop: 0,
    paddingHorizontal: 0,
  },
  plantCardWrapper: {
    // Equal width for two columns with equal spacing
    width: '45%', // 45% width for each card
    marginBottom: 16,
    marginRight: '10%', // 10% margin on the right for spacing
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 0,
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
  emptyImage: {
    width: 1000,
    height: 500,
    maxWidth: '90%',
    maxHeight: '70%',
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
  skeletonCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3E6E8',
  },
  skeletonImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTextLarge: {
    width: '80%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonTextSmall: {
    width: '60%',
    height: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    width: '40%',
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  // Search Results Styles
  searchResultsContainer: {
    position: 'absolute',
    top: 58, // Position below the controls
    left: 56, // Account for back button width + gap
    right: 80, // Account for wishlist and profile buttons
    backgroundColor: '#FFFFFF',
    borderWidth: 2, // Thicker border for better definition
    borderColor: '#d1d5db', // Slightly darker border
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 9999, // Ensure it appears on top of everything
    elevation: 15, // Higher elevation for Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25, // Stronger shadow for better visibility
    shadowRadius: 8,
    // Ensure completely opaque background
    opacity: 1,
    // Additional properties to ensure visibility
    borderStyle: 'solid',
    overflow: 'hidden', // Ensure content doesn't bleed
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
  searchResultsList: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#FFFFFF', // Ensure solid background for each item
    // Additional properties for visibility
    opacity: 1,
    borderStyle: 'solid',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Inter',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
});

export default ScreenGenusPlants;
