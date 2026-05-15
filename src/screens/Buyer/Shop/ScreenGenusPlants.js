/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../../auth/AuthProvider';
import {useFilters} from '../../../context/FilterContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Avatar from '../../../components/Avatar/Avatar';
import SearchHeader from '../../../components/Header/SearchHeader';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {PlantItemCard} from '../../../components/PlantItemCard';
import { getBuyerListingsApi,
  getPriceDropBadgeListingsApi,
  addToCartApi,
  searchPlantsApi,
} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import PromoBadgeList from '../../../components/PromoBadgeList';

const GenusHeader = ({
  navigation,
  insets,
  onBadgePress,
  profilePhotoUri,
  activeBadge,
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
        <SearchHeader
          placeholder="Search plants..."
          readOnly
          onPress={() => navigation.navigate('ScreenSearch')}
        />
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

  <PromoBadgeList navigation={navigation} onBadgePress={onBadgePress} activeBadge={activeBadge} />
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
  
  const {genus, filterType, filterValue, fromFilter, filter, fromBadge, searchQuery, fromSearch} = route.params || {};
  const {
    globalFilters,
    appliedFilters,
    updateFilters,
    applyFilters,
    buildFilterParams,
    hasAppliedFilters
  } = useFilters();
  const justFiltered = React.useRef(false);
  const initialLoadComplete = React.useRef(false); // Track if initial load is done
  const isLoadingRef = React.useRef(false); // Prevent concurrent loadPlants calls

  // Plants data state
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination (cursor-based for Firestore)
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 10;
  // Offset only for Price Drop badge (getPriceDropBadgeListingsApi still uses offset)
  const [offset, setOffset] = useState(0);
  
  // Track active badge for pagination
  const [activeBadge, setActiveBadge] = useState(null);
  // Ref to track active badge immediately (prevents race conditions with async state updates)
  const activeBadgeRef = React.useRef(null);

  // Search state - initialize with searchQuery if provided
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  // Track if we're currently in search mode (have an active search query)
  const [isSearchMode, setIsSearchMode] = useState(false);
  
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

  // Helper function to load plants with explicit search query
  const loadPlantsWithSearch = async (searchQueryParam, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setNextPageToken(null);
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
        ...(refresh ? {} : { nextPageToken }),
      };

      // Use searchPlants API for faster search results when there's a search query
      if (searchQueryParam && searchQueryParam.trim()) {
        setIsSearchMode(true); // Mark that we're in search mode
        console.log('🔍 [ScreenGenusPlants] Loading plants with search query:', searchQueryParam.trim());
        console.log('🔍 [ScreenGenusPlants] Refresh:', refresh, 'Page token:', nextPageToken ? 'yes' : 'no');

        // Use searchPlants API for faster search results
        const searchParams = {
          query: searchQueryParam.trim(),
          limit: limit,
          offset: refresh ? 0 : (plants.length || 0),
          sortBy: 'relevance',
          sortOrder: 'desc',
        };

        // Apply additional filters if available
        const filterParams = buildFilterParams({});
        if (filterParams.genus) searchParams.genus = filterParams.genus;
        if (filterParams.variegation) searchParams.variegation = filterParams.variegation;
        if (filterParams.listingType) searchParams.listingType = filterParams.listingType;
        if (filterParams.minPrice) searchParams.minPrice = filterParams.minPrice;
        if (filterParams.maxPrice) searchParams.maxPrice = filterParams.maxPrice;
        if (filterParams.country) searchParams.country = filterParams.country;

        console.log('🔍 [ScreenGenusPlants] Using searchPlants API with params:', JSON.stringify(searchParams));
        const res = await retryAsync(() => searchPlantsApi(searchParams), 3, 1000);

        if (!res?.success) {
          throw new Error(res?.error || 'Failed to load plants');
        }

        // Transform searchPlants API response to match expected format
        // The searchPlants API returns plants with: id, plantCode, genus, species, variegation, title, price, finalPrice, etc.
        const rawPlants = (res.data?.plants || []).map(p => ({
        id: p.id,
        plantCode: p.plantCode,
        genus: p.genus || '',
        species: p.species || '',
        variegation: p.variegation || '',
        plantName: p.title || `${p.genus} ${p.species}${p.variegation ? ' ' + p.variegation : ''}`,
        imagePrimary: p.image || null,
        imagePrimaryWebp: p.image || null,
        imageCollection: p.images || [],
        imageCollectionWebp: p.images || [],
        usdPrice: p.price || 0,
        localPrice: p.localPrice || 0,
        finalPrice: p.finalPrice || p.price || 0,
        originalPrice: p.price || 0,
        discountPrice: p.discountPrice || null,
        hasDiscount: p.discountPercentage ? true : false,
        discountAmount: p.discountPercentage ? ((p.price - p.finalPrice) || 0) : 0,
        listingType: p.listingType || 'Single Plant',
        availableQty: p.availableQuantity || 0,
        country: p.country || '',
        shippingIndex: p.shippingIndex || null,
        acclimationIndex: p.acclimationIndex || null,
        sellerName: p.supplierName || '',
        localCurrency: p.currency || 'USD',
        plantFlightDate: p.plantFlightDate || null,
        createdAt: p.createdAt || null,
        updatedAt: p.updatedAt || null,
        description: p.description || '',
        potSize: p.potSizes && p.potSizes.length > 0 ? p.potSizes[0] : null,
      }));
      
      const newPlants = rawPlants.filter(plant => {
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        return hasPlantCode && hasTitle && hasSubtitle;
      });
      
      if (refresh) {
        setPlants(newPlants);
      } else {
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
      }

        // Use pagination from searchPlants API response
        const pagination = res.data?.pagination || {};
        const hasMorePagination = pagination.hasMore || false;
        setHasMore(hasMorePagination);
        console.log('✅ [ScreenGenusPlants] Loaded', newPlants.length, 'plants from search (using searchPlants API)');
        console.log('✅ [ScreenGenusPlants] hasMore:', hasMorePagination, 'Total results:', pagination.total || newPlants.length);
      } else {
        // No search query - use getBuyerListings API (fallback to original behavior)
        setIsSearchMode(false);
        baseParams.plant = null;
        const params = buildFilterParams(baseParams);
        const res = await retryAsync(() => getBuyerListingsApi(params), 3, 1000);

        if (!res?.success) {
          throw new Error(res?.error || 'Failed to load plants');
        }

        const rawPlants = (res.data?.listings || []).map(p => ({
          ...p,
          imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
          imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
        }));
        
        const newPlants = rawPlants.filter(plant => {
          const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
          const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                          (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
          const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                             (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
          return hasPlantCode && hasTitle && hasSubtitle;
        });
        
        if (refresh) {
          setPlants(newPlants);
          setNextPageToken(res.data?.nextPageToken || null);
        } else {
          setPlants(prev => {
            const existingPlantCodes = new Set(prev.map(p => p.plantCode));
            const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
            return [...prev, ...uniqueNewPlants];
          });
          setNextPageToken(res.data?.nextPageToken || null);
        }

        setHasMore(res.data?.hasNextPage || false);
        console.log('✅ [ScreenGenusPlants] Loaded', newPlants.length, 'plants from getBuyerListings');
        console.log('✅ [ScreenGenusPlants] hasMore:', res.data?.hasNextPage || false);
      }

    } catch (error) {
      console.error('❌ [ScreenGenusPlants] Error loading plants with search:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load plants on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 [ScreenGenusPlants] Initial mount - starting data load');
        // If coming from search, set search term and load plants immediately
        if (fromSearch && searchQuery) {
          console.log('🔍 [ScreenGenusPlants] Loading from search:', searchQuery);
          setSearchTerm(searchQuery);
          setIsSearchMode(true); // Mark that we're in search mode
          // Load plants with search query immediately
          await loadPlantsWithSearch(searchQuery, true);
        } else if (fromBadge && filter) {
          // Check if this is a special badge navigation (from ScreenShop)
          activeBadgeRef.current = filter; // Set ref immediately
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
        // Mark initial load as complete
        initialLoadComplete.current = true;
        console.log('✅ [ScreenGenusPlants] Initial data load complete');
      } catch (error) {
        console.log('Error loading initial data:', error);
        initialLoadComplete.current = true; // Mark as complete even on error
      }
    };

    fetchData();
  }, []); // Only run on mount

  // Reload plants when search term changes (for search within genus plants screen)
  useEffect(() => {
    // Only reload if search term is 2+ characters and we're not coming from initial search navigation
    if (searchTerm.trim().length >= 2 && !(fromSearch && searchQuery)) {
      console.log('🔍 [ScreenGenusPlants] Search term changed, reloading:', searchTerm);
      setIsSearchMode(true); // Mark that we're in search mode
      const timeoutId = setTimeout(() => {
        loadPlantsWithSearch(searchTerm.trim(), true);
      }, 800); // Debounce search
      return () => clearTimeout(timeoutId);
    } else if (searchTerm.trim().length === 0) {
      // Check ref first (immediate) then state (for consistency)
      const currentBadge = activeBadgeRef.current || activeBadge;
      if (!currentBadge) {
        // Clear results when search is cleared - but ONLY if no badge is active
        console.log('🔍 [ScreenGenusPlants] Search cleared, reloading all plants');
        setIsSearchMode(false); // Clear search mode
        loadPlants(true);
      } else {
        // Search cleared but badge is active - just clear search mode, keep badge results
        console.log('🔍 [ScreenGenusPlants] Search cleared, keeping badge results:', currentBadge);
        setIsSearchMode(false);
      }
    }
  }, [searchTerm, activeBadge]);

  // Track last loaded search query to prevent duplicate loads
  const lastSearchQueryRef = React.useRef(null);

  // Load plants when screen comes into focus - handle search query from navigation
  useFocusEffect(
    React.useCallback(() => {
      // Skip if initial load hasn't completed yet (prevents duplicate calls on mount)
      if (!initialLoadComplete.current) {
        console.log('⏭️ [ScreenGenusPlants] Focus effect skipped - initial load not complete');
        return;
      }
      
      console.log('👁️ [ScreenGenusPlants] Focus effect triggered');
      
      // Check for search query from navigation
      const currentSearchQuery = route.params?.searchQuery;
      const currentFromSearch = route.params?.fromSearch;
      
      // If we have a search query and it's different from the last one, load it
      if (currentFromSearch && currentSearchQuery) {
        const searchQueryTrimmed = currentSearchQuery.trim();
        if (searchQueryTrimmed && lastSearchQueryRef.current !== searchQueryTrimmed) {
          console.log('🔍 [ScreenGenusPlants] Focus effect - loading search:', searchQueryTrimmed);
          setSearchTerm(searchQueryTrimmed);
          setIsSearchMode(true); // Mark that we're in search mode
          loadPlantsWithSearch(searchQueryTrimmed, true);
          lastSearchQueryRef.current = searchQueryTrimmed;
          return;
        }
      }
      
      // Reset last search query if not from search
      if (!currentFromSearch) {
        lastSearchQueryRef.current = null;
        setIsSearchMode(false); // Clear search mode
      }
      
      // Don't reload if a special badge is active
      // Check ref first (immediate) then state (for consistency)
      const specialBadges = ['Price Drop', 'New Arrivals', 'Latest Nursery Drop', 'Below $20', 'Unicorn', 'Top 5 Buyer Wish List'];
      const currentBadge = activeBadgeRef.current || activeBadge;
      if (specialBadges.includes(currentBadge)) {
        console.log('⏭️ [ScreenGenusPlants] Focus effect - skipping, badge active:', currentBadge);
        return;
      }
      
      if (justFiltered.current) {
        // Don't reload if we just applied filters
        justFiltered.current = false;
        console.log('⏭️ [ScreenGenusPlants] Focus effect - just filtered, skip');
      } else if (hasAppliedFilters()) {
        // Only reload if there are applied filters from another screen
        console.log('🔄 [ScreenGenusPlants] Focus effect - reloading with applied filters');
        loadPlants(true);
      } else {
        console.log('⏭️ [ScreenGenusPlants] Focus effect - no action needed');
      }
      // If no applied filters, don't auto-reload to prevent unnecessary API calls
    }, [appliedFilters, route.params, activeBadge]),
  );

  // Handle route parameters (like wholesale filter from shop screen)
  const routeFilterApplied = React.useRef(false);
  
  useEffect(() => {
    if (filterType && filterValue && !routeFilterApplied.current) {
      
      // Apply the filter based on filterType
      if (filterType === 'listingType' && filterValue === 'Wholesale') {
        setLocalFilters(prev => ({
          ...prev,
          listingType: ['Wholesale']
        }));
        
        updateFilters({
          ...globalFilters,
          listingType: ['Wholesale']
        });
        
        routeFilterApplied.current = true;
        
        const specialBadges = ['Price Drop', 'New Arrivals', 'Latest Nursery Drop', 'Below $20', 'Unicorn', 'Top 5 Buyer Wish List'];
        const currentBadge = activeBadgeRef.current || activeBadge;
        if (!specialBadges.includes(currentBadge)) {
          setTimeout(() => {
            loadPlants(true);
          }, 100);
        } else {
          console.log('⏭️ [Wholesale filter] Skipping loadPlants - badge active:', currentBadge);
        }
      } else if (filterType === 'country' && filterValue) {
        setLocalFilters(prev => ({
          ...prev,
          country: [filterValue]
        }));
        
        applyFilters({
          ...globalFilters,
          country: [filterValue]
        });
        
        routeFilterApplied.current = true;
        
        setTimeout(() => {
          loadPlants(true);
        }, 100);
      }
    }
  }, [filterType, filterValue, updateFilters]);

  const loadPlants = async (refresh = false) => {
    // Prevent concurrent calls — ref is synchronous unlike state
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      // Don't load regular plants if a special badge is active
      // Check ref first (immediate) then state (for consistency)
      const specialBadges = ['Price Drop', 'New Arrivals', 'Latest Nursery Drop', 'Below $20', 'Unicorn', 'Top 5 Buyer Wish List'];
      const currentBadge = activeBadgeRef.current || activeBadge;
      if (specialBadges.includes(currentBadge)) {
        console.log('⏭️ [loadPlants] Skipping - special badge active:', currentBadge);
        return;
      }
      
      if (refresh) {
        setRefreshing(true);
        setNextPageToken(null);
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
        ...(refresh ? {} : { nextPageToken }),
      };

      // Inject country from route params directly as a failsafe
      if (filterType === 'country' && filterValue) {
        baseParams.country = filterValue;
      }

      // Add search term if provided (prioritize route param if from search, otherwise use state)
      const activeSearchTerm = (fromSearch && searchQuery) ? searchQuery.trim() : searchTerm.trim();
      if (activeSearchTerm) {
        baseParams.plant = activeSearchTerm;
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
        // Deduplicate by plantCode — safety net against concurrent calls
        const seen = new Set();
        const deduped = newPlants.filter(p => {
          if (seen.has(p.plantCode)) return false;
          seen.add(p.plantCode);
          return true;
        });
        setPlants(deduped);
        setNextPageToken(res.data?.nextPageToken || null);
      } else {
        // Filter out duplicates before appending new plants
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
        setNextPageToken(res.data?.nextPageToken || null);
      }

      // Check if there are more plants to load using API response
      setHasMore(res.data?.hasNextPage || false);

    } catch (error) {
      console.error('Error loading plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      isLoadingRef.current = false;
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
      setNextPageToken(null);

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

      // Specific parameters for Unicorn badge - show ALL items over $2000
      // Sort by finalPrice desc to prioritize expensive plants
      const unicornParams = {
        minPrice: 2000,
        limit: 500, // Increased limit to fetch more unicorn plants
        sortBy: 'finalPrice', // Sort by price to find expensive plants faster
        sortOrder: 'desc',
      };

      console.log('🦄 Loading Unicorn plants with params:', unicornParams);
      const res = await retryAsync(() => getBuyerListingsApi(unicornParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Unicorn plants');
      }

      console.log('🦄 Received', res.data?.listings?.length || 0, 'listings from API');
      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Log price information for debugging
      if (rawPlants.length > 0) {
        console.log('🦄 First few plants finalPrice:', rawPlants.slice(0, 5).map(p => ({
          plantCode: p.plantCode,
          finalPrice: p.finalPrice,
          usdPrice: p.usdPrice,
          originalPrice: p.originalPrice
        })));
      }
      
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
          console.log('🦄 Filtered out invalid plant:', {
            plantCode: plant?.plantCode,
            hasPlantCode,
            hasTitle,
            hasSubtitle
          });
        }

        return isValid;
      });
      
      console.log('🦄 Filtered to', newPlants.length, 'valid plants');
      setPlants(newPlants);
      setNextPageToken(res.data?.nextPageToken || null);

      // For Unicorn category, check if there are more results available
      setHasMore(res.data?.hasNextPage || false);
      

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
      setNextPageToken(null);

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
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Specific parameters for Latest Nursery Drop badge - query published nursery drop listings
      const nurseryDropParams = {
        limit: 10,
        nurseryDrop: 'true', // Filter for published nursery drop listings
        sortBy: 'nurseryDropDate', // Sort by nursery drop date (most recent first)
        sortOrder: 'desc',
      };

      const res = await retryAsync(() => getBuyerListingsApi(nurseryDropParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Latest Nursery Drop plants');
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
      setNextPageToken(res.data?.nextPageToken || null);

      // Enable pagination - check if there are more items
      setHasMore(res.data?.hasNextPage || false);

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
      setNextPageToken(res.data?.nextPageToken || null);

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

      // Use dedicated Price Drop badge API for efficient discounted item retrieval
      const priceDropParams = {
        limit: 10, // Load 10 items per page
        offset: 0, // Start from beginning
      };

      const res = await retryAsync(() => getPriceDropBadgeListingsApi(priceDropParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load Price Drop plants');
      }


      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      console.log('🔍 Price Drop rawPlants received:', rawPlants.length);
      if (rawPlants.length > 0) {
        console.log('🔍 First plant data:', {
          plantCode: rawPlants[0].plantCode,
          genus: rawPlants[0].genus,
          species: rawPlants[0].species,
          variegation: rawPlants[0].variegation,
          plantName: rawPlants[0].plantName
        });
      }
      
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
          console.log('❌ Filtered out plant:', {
            plantCode: plant.plantCode,
            hasPlantCode,
            hasTitle,
            hasSubtitle,
            species: plant.species,
            variegation: plant.variegation
          });
        }
        
        return isValid;
      });
      
      console.log('✅ Price Drop newPlants after filter:', newPlants.length);
      
      
      setPlants(newPlants);
      setOffset(newPlants.length);

      // Enable pagination - check if there are more items
      setHasMore(res.data?.hasMore || false);

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
        setNextPageToken(null);
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
        ...(refresh ? {} : { nextPageToken }),
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
        setNextPageToken(res.data?.nextPageToken || null);
      } else {
        // Filter out duplicates before appending new plants
        setPlants(prev => {
          const existingPlantCodes = new Set(prev.map(p => p.plantCode));
          const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
          return [...prev, ...uniqueNewPlants];
        });
        setNextPageToken(res.data?.nextPageToken || null);
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

      // Check if this badge is already active - if so, clear it
      const isCurrentlyActive = activeBadge === label;
      
      if (isCurrentlyActive) {
        // Clear the active badge and reset to normal plants
        activeBadgeRef.current = null; // Clear ref immediately
        setActiveBadge(null);
        setLoading(true);
        setPlants([]);
        justFiltered.current = true;
        loadPlants(true);
        return;
      }

      // Special handling for Price Drop badge with specific API parameters
      if (label === 'Price Drop') {
        activeBadgeRef.current = 'Price Drop'; // Set ref immediately (synchronous)
        setActiveBadge('Price Drop');          // Set state (asynchronous)
        setLoading(true);      // Show loading state
        setPlants([]);         // Clear old data immediately
        setOffset(0);          // Reset offset
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
        activeBadgeRef.current = 'Latest Nursery Drop'; // Set ref immediately (synchronous)
        setActiveBadge('Latest Nursery Drop');          // Set state (asynchronous)
        setLoading(true);      // Show loading state
        setPlants([]);         // Clear old data immediately
        setNextPageToken(null); // Reset cursor for new badge load
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

  // Load more plants for Price Drop with pagination
  const loadMorePriceDropPlants = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const priceDropParams = {
        limit: 10,
        offset: offset, // Use current offset for pagination
      };
      const res = await retryAsync(() => getPriceDropBadgeListingsApi(priceDropParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load more Price Drop plants');
      }

      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data
      const newPlants = rawPlants.filter(plant => {
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        return hasPlantCode && hasTitle && hasSubtitle;
      });
      
      // Append to existing plants
      setPlants(prev => [...prev, ...newPlants]);
      setOffset(prev => prev + newPlants.length);
      setHasMore(res.data?.hasMore || false);

    } catch (error) {
      console.error('Error loading more Price Drop plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more plants for Latest Nursery Drop with pagination
  const loadMoreNurseryDropPlants = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const nurseryDropParams = {
        limit: 10,
        nurseryDrop: 'true',
        sortBy: 'nurseryDropDate',
        sortOrder: 'desc',
        ...(nextPageToken ? { nextPageToken } : {}),
      };
      const res = await retryAsync(() => getBuyerListingsApi(nurseryDropParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load more Nursery Drop plants');
      }

      const rawPlants = (res.data?.listings || []).map(p => ({
        ...p,
        imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
        imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
      }));
      
      // Filter out plants with invalid data
      const newPlants = rawPlants.filter(plant => {
        const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
        const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                        (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
        const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                           (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
        return hasPlantCode && hasTitle && hasSubtitle;
      });
      
      // Append to existing plants, filtering out duplicates
      setPlants(prev => {
        const existingPlantCodes = new Set(prev.map(p => p.plantCode));
        const uniqueNewPlants = newPlants.filter(p => !existingPlantCodes.has(p.plantCode));
        return [...prev, ...uniqueNewPlants];
      });
      setNextPageToken(res.data?.nextPageToken || null);
      setHasMore(res.data?.hasNextPage || false);

    } catch (error) {
      console.error('Error loading more Nursery Drop plants:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      // Use specific load more function based on active badge
      if (activeBadge === 'Unicorn') {
        loadMoreUnicornPlants();
      } else if (activeBadge === 'Price Drop') {
        loadMorePriceDropPlants();
      } else if (activeBadge === 'Latest Nursery Drop') {
        loadMoreNurseryDropPlants();
      } else if (isSearchMode && searchTerm.trim()) {
        // If we're in search mode, use loadPlantsWithSearch
        loadPlantsWithSearch(searchTerm.trim(), false);
      } else {
        loadPlants(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GenusHeader
        navigation={navigation}
        insets={insets}
        onBadgePress={handleBadgePress}
        profilePhotoUri={profilePhotoUri}
        activeBadge={activeBadge}
      />

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
              
              // Ensure title is safe
              const hasValidTitle =
                (plant.genus && typeof plant.genus === 'string' && plant.genus.trim() !== '') ||
                (plant.plantName && typeof plant.plantName === 'string' && plant.plantName.trim() !== '');

              if (!hasValidTitle) {
                return null;
              }

              const transformedPlant = {
                ...plant,
              };

              if (
                (!plant.species || typeof plant.species !== 'string' || plant.species.trim() === '') &&
                (!plant.variegation || typeof plant.variegation !== 'string' || plant.variegation.trim() === '')
              ) {
                transformedPlant.variegation = 'Plant Details';
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
                    data={transformedPlant}
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
    zIndex: 10001,
    elevation: 10001,
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
    zIndex: 10000,
    elevation: 10000,
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
    elevation: 10,
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
  loadMoreContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter',
  },
});

export default ScreenGenusPlants;
