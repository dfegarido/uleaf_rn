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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../../auth/AuthProvider';
import {useFilters} from '../../../context/FilterContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Avatar from '../../../components/Avatar/Avatar';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {PlantItemCard} from '../../../components/PlantItemCard';
import {
  getBuyerListingsApi,
  addToCartApi,
  searchPlantsApi,
} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import PromoBadgeList from '../../../components/PromoBadgeList';

const GenusHeader = ({
  genus,
  navigation,
  searchTerm,
  setSearchTerm,
  setIsSearchFocused,
  insets,
  onBadgePress, // handler passed from parent to handle badge clicks in-place
  profilePhotoUri,
}) => {
  return (
    <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
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
              placeholder="Search ileafU "
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
          }}>
          <Wishicon width={40} height={40} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('ScreenProfile')}>
          {profilePhotoUri ? (
            <Avatar 
              source={{ uri: profilePhotoUri }} 
              style={styles.avatar} 
              size={40}
            />
          ) : (
            <AvatarIcon width={40} height={40} />
          )}
        </TouchableOpacity>
      </View>
    </View>
    
  <PromoBadgeList navigation={navigation} onBadgePress={onBadgePress} />
    </View>
  );
};

const ScreenGenusPlants = ({navigation, route}) => {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  const {genus, filterType, filterValue, fromFilter, filter, fromBadge} = route.params || {};
  const {
    globalFilters,
    appliedFilters,
    updateFilters,
    applyFilters,
    buildFilterParams,
    hasAppliedFilters
  } = useFilters();
  const justFiltered = React.useRef(false);

  // Plants data state
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 10; // Standardized to 20 per requirement
  
  // Track active badge for pagination
  const [activeBadge, setActiveBadge] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Profile photo state
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  
  // Load profile photo from AsyncStorage
  useFocusEffect(
    React.useCallback(() => {
      const loadProfilePhoto = async () => {
        try {
          const photoUrl = await AsyncStorage.getItem('profilePhotoUrlWithTimestamp') || 
                           await AsyncStorage.getItem('profilePhotoUrl');
          if (photoUrl) {
            setProfilePhotoUri(photoUrl);
          }
        } catch (error) {
          console.warn('Failed to load profile photo from AsyncStorage:', error);
        }
      };
      
      loadProfilePhoto();
    }, [])
  );

  // Debounced search effect - triggers after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
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

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const searchParams = {
        query: searchTerm,
        limit: 20,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      const res = await searchPlantsApi(searchParams);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search plants.');
      }

      const plants = res.data?.plants || [];
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

  // Load plants on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if this is a special badge navigation (from ScreenShop)
        if (fromBadge && filter) {
          setActiveBadge(filter);
          justFiltered.current = true;
          
          // Call the appropriate load function based on the filter
          switch (filter) {
            case 'Unicorn':
              loadUnicornPlants();
              break;
            case 'Top 5 Buyer Wish List':
              loadTop5WishListPlants();
              break;
            case 'Below $20':
              loadBelow20Plants();
              break;
            case 'Latest Nursery Drop':
              loadLatestNurseryDropPlants();
              break;
            case 'New Arrivals':
              loadNewArrivalsPlants();
              break;
            case 'Price Drop':
              loadPriceDropPlants();
              break;
            default:
              // Unknown badge, load plants normally
              loadPlants(true);
          }
        } else {
          // Load plants using global filters if available, otherwise load all plants
          loadPlants(true);
        }
      } catch (error) {
        console.log('Error loading initial data:', error);
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
      } else if (hasAppliedFilters()) {
        // Only reload if there are applied filters from another screen
        loadPlants(true);
      }
      // If no applied filters, don't auto-reload to prevent unnecessary API calls
    }, [appliedFilters]),
  );

  // Handle route parameters (like wholesale filter from shop screen)
  const routeFilterApplied = React.useRef(false);
  
  useEffect(() => {
    if (filterType && filterValue && !routeFilterApplied.current) {
      
      // Apply the filter based on filterType
      if (filterType === 'listingType' && filterValue === 'Wholesale') {
        // Set local filters to include wholesale
        setLocalFilters(prev => ({
          ...prev,
          listingType: ['Wholesale']
        }));
        
        // Also apply to global filters so it gets used in API calls
        updateFilters({
          ...globalFilters,
          listingType: ['Wholesale']
        });
        
        
        // Mark as applied to prevent infinite loop
        routeFilterApplied.current = true;
        
        // Load plants with the wholesale filter
        setTimeout(() => {
          loadPlants(true);
        }, 100); // Small delay to ensure filters are set
      }
    }
  }, [filterType, filterValue, updateFilters]);

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

      // Handle genus parameter with proper priority:
      // 1. If coming from filter sheet (fromFilter=true), ALWAYS use FilterContext genus
      // 2. If FilterContext has genus filters, those take priority
      // 3. Otherwise, use route genus parameter (from clicking genus cards)
      const hasFilterContextGenus = appliedFilters?.genus && appliedFilters.genus.length > 0;
      
      if (fromFilter) {
        // Came from filter sheet - FilterContext is the source of truth
        // buildFilterParams will handle adding genus from FilterContext
      } else if (!hasFilterContextGenus && genus && genus !== 'All') {
        // Direct genus navigation (clicked genus card), no filter context
        baseParams.genus = genus.toLowerCase();
      } else if (hasFilterContextGenus) {
      }

      // Use buildFilterParams to construct all filter parameters
      // This will add genus from FilterContext if available
      const params = buildFilterParams(baseParams);

      const res = await retryAsync(() => getBuyerListingsApi(params), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plants');
      }

      // Debug: Log prices to verify sort order from API
      if (res.data?.listings && res.data.listings.length > 0) {
        const prices = res.data.listings.slice(0, 10).map(p => ({
          plantCode: p.plantCode,
          usdPrice: p.usdPrice,
          finalPrice: p.finalPrice,
          loveCount: p.loveCount
        }));
      }

      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        // Ensure webp field present for UI preference
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as BrowseMorePlants and ScreenPlantDetail)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {

        }
        
        return isValid;
      });
      
      
      if (refresh) {
        setPlants(newPlants);
        // For refresh, set offset exactly to the number returned (avoids double-refresh accumulating)
        setOffset(newPlants.length);
      } else {
        // Filter out duplicates before appending new plants
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
        // Increment offset by the page size (use limit for consistency)
        setOffset(prev => prev + newPlants.length);
      }

      // Check if there are more plants to load using API response
      setHasMore(res.data?.hasNextPage || false);

    } catch (error) {
      console.error('Error loading plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants for Top 5 Buyer Wish List badge with specific parameters
  const loadTop5WishListPlants = async () => {
    setLoading(true);
    setPlants([]);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Specific parameters for Top 5 Buyer Wish List badge - no additional params
      const top5WishListParams = {
        limit: 5,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };


      const res = await retryAsync(() => getBuyerListingsApi(top5WishListParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Top 5 Buyer Wish List plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as other loading functions)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {

        }
        
        return isValid;
      });
      
      
      setPlants(newPlants);
      setOffset(newPlants.length);

      // For Top 5 Buyer Wish List, only show top 5 items - no pagination
      setHasMore(false);

    } catch (error) {
      console.error('Error loading Top 5 Buyer Wish List plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants for Unicorn badge with specific parameters
  const loadUnicornPlants = async () => {
    setLoading(true);
    setPlants([]);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Specific parameters for Unicorn badge - show ALL items over $2000 without limit
      const unicornParams = {
        minPrice: 2000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };


      const res = await retryAsync(() => getBuyerListingsApi(unicornParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Unicorn plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as other loading functions)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {
        }
        
        return isValid;
      });
      
      
      setPlants(newPlants);
      setOffset(newPlants.length);

      // For Unicorn category, load all items at once - no pagination needed
      setHasMore(false);
      

    } catch (error) {
      console.error('🦄 Error loading Unicorn plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants for Below $20 badge with specific parameters
  const loadBelow20Plants = async () => {
    setLoading(true);
    setPlants([]);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Specific parameters for Below $20 badge - show ALL items under $20
      const below20Params = {
        maxPrice: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };


      const res = await retryAsync(() => getBuyerListingsApi(below20Params), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Below $20 plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as other loading functions)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {
        }
        
        return isValid;
      });
      
      
      setPlants(newPlants);
      setOffset(newPlants.length);

      // For Below $20, load all items at once - no pagination needed
      setHasMore(false);

    } catch (error) {
      console.error('Error loading Below $20 plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants for Latest Nursery Drop badge with specific parameters
  const loadLatestNurseryDropPlants = async () => {
    setLoading(true);
    setPlants([]);
    
    try {
      // Since "Publish to Nursery Drop" is not yet working on seller side,
      // return empty results for this filter
      
      setPlants([]);
      setOffset(0);
      setHasMore(false);

    } catch (error) {
      console.error('Error loading Latest Nursery Drop plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants for New Arrivals badge with specific parameters
  const loadNewArrivalsPlants = async () => {
    setLoading(true);
    setPlants([]);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Specific parameters for New Arrivals badge - limit to 50 most recent items
      const newArrivalsParams = {
        limit: 50,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };


      const res = await retryAsync(() => getBuyerListingsApi(newArrivalsParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load New Arrivals plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as other loading functions)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {
        }
        
        return isValid;
      });
      
      
      setPlants(newPlants);
      setOffset(newPlants.length);

      // For New Arrivals, show up to 50 items with pagination if more are available
      setHasMore(res.data?.hasNextPage || false);

    } catch (error) {
      console.error('Error loading New Arrivals plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants for Price Drop badge with specific parameters
  const loadPriceDropPlants = async () => {
    setLoading(true);
    setPlants([]);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Specific parameters for Price Drop badge - show ALL price drop items
      const priceDropParams = {
        maxPrice: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };


      const res = await retryAsync(() => getBuyerListingsApi(priceDropParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Price Drop plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as other loading functions)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {
        }
        
        return isValid;
      });
      
      
      setPlants(newPlants);
      setOffset(newPlants.length);

      // For Price Drop, load all items at once - no pagination needed
      setHasMore(false);

    } catch (error) {
      console.error('Error loading Price Drop plants:', error);
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
        baseParams.genus = genus.toLowerCase();
      }

      // Build filter parameters manually with the provided filters
      
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


      const res = await retryAsync(() => getBuyerListingsApi(baseParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data (same logic as BrowseMorePlants and ScreenPlantDetail)
      const newPlants = rawPlants.filter(plant => {
        // Ensure plant has required fields and they are strings
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        
        const isValid = hasPlantCode && hasTitle && hasSubtitle;
        
        if (!isValid) {
        }
        
        return isValid;
      });
      
      
      if (refresh) {
        setPlants(newPlants);
        setOffset(newPlants.length);
      } else {
        // Filter out duplicates before appending new plants
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
        setOffset(prev => prev + newPlants.length);
      }

      // Check if there are more plants to load using API response
      setHasMore(res.data?.hasNextPage || false);

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

  // Map PromoBadge labels to filter changes
  const BADGE_LABEL_TO_FILTER = {
    'Price Drop': { price: ['$0 - $20'] },
    'New Arrivals': { sort: ['Newest to Oldest'] },
    'Latest Nursery Drop': { listingType: ['Latest Nursery Drop'] },
    'Below $20': { price: ['$0 - $20'] },
    'Unicorn': { listingType: ['Unicorn'] },
    'Top 5 Buyer Wish List': { listingType: ['Top 5 Buyer Wish List'] },
  };

  // Handler for PromoBadge clicks in genus screen — apply the badge's filter locally and reload
  const handleBadgePress = (badge) => {
    try {
      const label = badge?.label;
      if (!label) return;

      // Special handling for Price Drop badge with specific API parameters
      if (label === 'Price Drop') {
        setActiveBadge('Price Drop');
        justFiltered.current = true;
        loadPriceDropPlants();
        return;
      }

      // Special handling for New Arrivals badge with specific API parameters
      if (label === 'New Arrivals') {
        setActiveBadge('New Arrivals');
        justFiltered.current = true;
        loadNewArrivalsPlants();
        return;
      }

      // Special handling for Latest Nursery Drop badge with specific API parameters
      if (label === 'Latest Nursery Drop') {
        setActiveBadge('Latest Nursery Drop');
        justFiltered.current = true;
        loadLatestNurseryDropPlants();
        return;
      }

      // Special handling for Below $20 badge with specific API parameters
      if (label === 'Below $20') {
        setActiveBadge('Below $20');
        justFiltered.current = true;
        loadBelow20Plants();
        return;
      }

      // Special handling for Unicorn badge with specific API parameters
      if (label === 'Unicorn') {
        setActiveBadge('Unicorn');
        justFiltered.current = true;
        loadUnicornPlants();
        return;
      }

      // Special handling for Top 5 Buyer Wish List badge with specific API parameters
      if (label === 'Top 5 Buyer Wish List') {
        setActiveBadge('Top 5 Buyer Wish List');
        justFiltered.current = true;
        loadTop5WishListPlants();
        return;
      }

      // Determine filter mapping for other badges
      const mapped = BADGE_LABEL_TO_FILTER[label] || { listingType: [label] };

      // Clear existing local filters and apply the mapped filter so badge acts as a single-filter
      const newLocalFilters = {
        sort: [],
        price: [],
        genus: [],
        variegation: [],
        country: [],
        listingType: [],
        shippingIndex: [],
        acclimationIndex: [],
        ...mapped,
      };

      setLocalFilters(newLocalFilters);

      // Clear active badge for regular filter-based badges
      setActiveBadge(null);
      
      // Apply immediately (in-place) and reload plants with the new local filters
      setLoading(true);
      setPlants([]);
      justFiltered.current = true;
      loadPlantsWithFilters(newLocalFilters, true);
    } catch (e) {
      console.error('Error handling badge press:', e);
    }
  };

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

  // Load more plants for Unicorn category with pagination support
  // Load more plants for Unicorn category - NOTE: This function is not used anymore
  // because Unicorn now loads all items at once without pagination
  const loadMoreUnicornPlants = async () => {
    // Unicorn category loads all items at once, so this function should not be called
    return;
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      // Use specific load more function based on active badge
      if (activeBadge === 'Unicorn') {
        loadMoreUnicornPlants();
      } else {
        loadPlants(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GenusHeader
        genus={genus}
        navigation={navigation}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setIsSearchFocused={setIsSearchFocused}
        insets={insets}
        onBadgePress={handleBadgePress}
        profilePhotoUri={profilePhotoUri}
      />

      {/* Search Results - Positioned outside header to appear above content */}
      {isSearchFocused && searchTerm.trim().length >= 2 && (
        <View style={[styles.searchResultsContainer, {top: insets.top + 58}]}>
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
                    {plant.title && !plant.title.includes('Choose the most suitable variegation') 
                      ? plant.title 
                      : `${plant.genus} ${plant.species}${plant.variegation && plant.variegation !== 'Choose the most suitable variegation.' ? ' ' + plant.variegation : ''}`}
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

      {/* Plants Grid */}
      <ScrollView
        style={[styles.plantsContainer, {paddingTop: insets.top + 120}]}
        contentContainerStyle={[styles.plantsGrid, {paddingBottom: totalBottomPadding}]}
        scrollEventThrottle={400}
        refreshing={refreshing}
        onRefresh={() => loadPlants(true)}
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 400; // Trigger when 400px from bottom
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
          
          if (isCloseToBottom && hasMore && !loadingMore) {
            handleLoadMore();
          }
        }}>
        
        {plants.length > 0 ? (
          <View style={styles.plantsGridContainer}>
            {plants.map((plant, idx) => {
              // Additional safety check before rendering
              if (!plant || 
                  !plant.plantCode || 
                  typeof plant.plantCode !== 'string' ||
                  plant.plantCode.trim() === '') {
                return null;
              }
              
              // Ensure title and subtitle are safe
              const hasValidTitle = (plant.genus && typeof plant.genus === 'string') || 
                                   (plant.plantName && typeof plant.plantName === 'string');
              const hasValidSubtitle = (plant.species && typeof plant.species === 'string') || 
                                      (plant.variegation && typeof plant.variegation === 'string');
              
              if (!hasValidTitle || !hasValidSubtitle) {
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
                    cardStyle={{ height: 220, margin: 8}}
                    onPress={() => {
                      // TODO: Navigate to plant detail screen
                      // navigation.navigate('PlantDetail', {plantCode: plant.plantCode});
                    }}
                    onAddToCart={() => handleAddToCart(plant)}
                  />
                </View>
              );
            }).filter(Boolean)}
            
            {/* Loading Indicator for Infinite Scroll */}
            {loadingMore && plants.length > 0 && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="large" color="#539461" />
                <Text style={styles.loadingMoreText}>Loading more plants...</Text>
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
            {(() => {
              const isFromBrowseGenus = !!route?.params?.genus && !route?.params?.filter && !route?.params?.filterType && !route?.params?.filterValue;
              // Use activeBadge if set, otherwise fall back to route params
              const label = activeBadge || (route?.params?.filter || route?.params?.filterValue || route?.params?.genus || '').toString();
              return (
                <>
                  {/* Browse Genus: show logo only */}
                  {isFromBrowseGenus && (
                    <Image 
                      source={require('../../../assets/images/no-genus.jpg')}
                      style={styles.emptyImage}
                      resizeMode="contain"
                    />
                  )}
                  {/* Other modules (badges/filters): show text only, hide logo */}
                  {!isFromBrowseGenus && (
                    <Text style={styles.emptyText}>
                      {label && label !== 'All' 
                        ? `No ${label} plants available at the moment.`
                        : 'No plants available at the moment.'}
                    </Text>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#E5E8EA',
    minHeight: 32,
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
    backgroundColor: '#fff',
  },
  plantsContainer: {
    flex: 1,
  },
  plantsGrid: {
    // paddingBottom handled dynamically based on safe area
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
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadMoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 375,
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  loadMoreText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
    textAlign: 'center',
  },
  loadMoreTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    height: 16,
  },
  loadMoreIcon: {
    width: 24,
    height: 24,
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
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
    width: '100%'
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#539461',
    textAlign: 'center',
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
