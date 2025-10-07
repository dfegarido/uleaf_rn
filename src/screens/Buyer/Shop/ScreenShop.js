/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef, useEffect} from 'react'; // keep hook imports grouped
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../../auth/AuthProvider';
import {useFilters} from '../../../context/FilterContext';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import PromoBadgeList from '../../../components/PromoBadgeList';
import GrowersIcon from '../../../assets/buyer-icons/growers-choice-icon.svg';
import WholesaleIcon from '../../../assets/buyer-icons/wholesale-plants-icon.svg';
import PhilippinesIcon from '../../../assets/buyer-icons/philippines-flag.svg';
import ThailandIcon from '../../../assets/buyer-icons/thailand-flag.svg';
import IndonesiaIcon from '../../../assets/buyer-icons/indonesia-flag.svg';
import DropDownIcon from '../../../assets/buyer-icons/drop-down.svg';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import {
  genus1,
  genus2,
  genus3,
  genus4,
  genus5,
  genus6,
  genus7,
  genus8,
  event1,
  event2,
} from '../../../assets/buyer-icons/png';

// Import genus images from assets/buyer-icons/png
import alocasiaImage from '../../../assets/buyer-icons/png/alocasia.jpg';
import anthuriumImage from '../../../assets/buyer-icons/png/anthurium.jpg';
import begoniaImage from '../../../assets/buyer-icons/png/begonia.jpg';
import hoyaImage from '../../../assets/buyer-icons/png/hoya.jpg';
import monsteraImage from '../../../assets/buyer-icons/png/monstera.jpg';
import scindapsusImage from '../../../assets/buyer-icons/png/scindapsus.jpg';
import syngoniumImage from '../../../assets/buyer-icons/png/syngonium.jpg';
import philodendronImage from '../../../assets/buyer-icons/png/philodendron.jpg';
import othersImage from '../../../assets/buyer-icons/png/others.jpg';

import {InfoCard} from '../../../components/InfoCards';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import {
  getGenusApi,
  getVariegationApi,
  getBuyerEventsApi,
  searchPlantsApi,
  getBuyerListingsApi,
  addToCartApi,
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
import { getIndexOptions } from '../../../utils/indexConverters';
import {
  getCachedImageUri,
  setCachedImageUri,
  CACHE_CONFIGS
} from '../../../utils/imageCache';

const countryData = [
  {
    src: ThailandIcon,
    label: 'Thailand',
  },
  {
    src: IndonesiaIcon,
    label: 'Indonesia',
  },
  {
    src: PhilippinesIcon,
    label: 'Philippines',
  },
];

const ScreenShop = ({navigation}) => {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  const {
    globalFilters,
    updateFilters,
    applyFilters,
    buildFilterParams,
    hasAppliedFilters,
    clearFilters
  } = useFilters();

  // (Moved) Effects defined after state declarations to keep hook order stable

  // Filter modal state
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [shippingIndexOptions, setShippingIndexOptions] = useState([]);
  const [acclimationIndexOptions, setAcclimationIndexOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);
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

  // Dynamic genus data state
  const [dynamicGenusData, setDynamicGenusData] = useState([]);
  const [loadingGenusData, setLoadingGenusData] = useState(true);
  
  // Events data state
  const [eventsData, setEventsData] = useState([]);
  const [loadingEventsData, setLoadingEventsData] = useState(true);
  
  // Events image cache state
  const [eventImageCache, setEventImageCache] = useState({});
  const [eventImageLoading, setEventImageLoading] = useState({});
  
  // (Removed) genus image cache state – no longer needed with static local images
  
  // Search results state
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Browse plants state persistence to prevent unnecessary reloading
  const [browseMorePlantsKey, setBrowseMorePlantsKey] = useState(1);
  // (Removed) recommendations state – replaced by BrowseMorePlants component elsewhere
  
  // ----------------------
  // Hooks (Effects)
  // ----------------------
  // Component mount/unmount debugging (moved below state declarations to avoid hook order shift on hot reload)
  useEffect(() => {
    console.log('🏪 ScreenShop: Component mounted');
    return () => {
      console.log('🏪 ScreenShop: Component unmounted');
    };
  }, []);

  // Log auth token and user info when Shop tab is accessed
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏪 ScreenShop: Screen focused');
      const logAuthInfo = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          // Load cached profile photo URL for header avatar
          try {
            const cached = await AsyncStorage.getItem('profilePhotoUrl');
            if (cached) setProfilePhotoUrl(cached);
          } catch (e) {
            console.warn('Failed to read cached profilePhotoUrl in ScreenShop:', e?.message || e);
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      };
      logAuthInfo();
    }, [user, globalFilters]),
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
    }, 800); // Increased delay to 800ms for better "finished typing" detection

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial data load effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          loadSortByData(),
          loadGenusData(),
          loadVariegationData(),
          loadCountryData(),
          loadListingTypeData(),
          loadShippingIndexData(),
          loadAcclimationIndexData(),
          loadBrowseGenusData(),
          loadEventsData(),
        ]);
      } catch (error) {
      }
    };
    fetchData();
  }, []);

  // Load genus data only if not already loaded
  useFocusEffect(
    React.useCallback(() => {
      const reloadGenusData = async () => {
        try {
          // Only load if data is not already loaded
          if (dynamicGenusData.length === 0) {
            await loadBrowseGenusData();
          }
        } catch (error) {
        }
      };

      reloadGenusData();
    }, [dynamicGenusData.length]),
  );

  // Pull to refresh function
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload all data when refreshing
      await Promise.all([
        loadSortByData(),
        loadGenusData(),
        loadVariegationData(),
        loadCountryData(),
        loadListingTypeData(),
        loadShippingIndexData(),
        loadAcclimationIndexData(),
        loadBrowseGenusData(),
        loadEventsData(),
      ]);
      
      // Force BrowseMorePlants to reload by changing its key
      setBrowseMorePlantsKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Optionally show user-friendly error message
      Alert.alert(
        'Refresh Error',
        'Could not refresh data. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadSortByData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.SORT);
      if (cachedData) {
        setSortOptions(cachedData);
        return;
      }

      // For buyer shop, use hardcoded sort options that match the UI requirements
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
        genusName: item.name,
        src: genus2,
        id: item.id,
        isWishlisted: false,
        isLiked: false,
        isViewed: false,
        isAddedToCart: false,
        isAddedToWishlist: false,
      }));

      setGenusOptions(localGenusData);
      
      // Cache the data
      await setCacheData(CACHE_KEYS.GENUS, localGenusData);
    } catch (error) {
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
    }
  };

  const loadCountryData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.COUNTRY);
      if (cachedData && cachedData.length > 0) {
        setCountryOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getCountryApi(), 3, 1000);

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        let localCountryData = res.data.map(item => ({
          label: item.name || item.country,
          value: item.name || item.country,
        }));

        setCountryOptions(localCountryData);
        // Cache the data
        await setCacheData(CACHE_KEYS.COUNTRY, localCountryData);
      } else {
        // Fallback to popular countries used in app if API is unavailable
        const fallback = [
          { label: 'Thailand', value: 'Thailand' },
          { label: 'Indonesia', value: 'Indonesia' },
          { label: 'Philippines', value: 'Philippines' },
        ];
        setCountryOptions(fallback);
        await setCacheData(CACHE_KEYS.COUNTRY, fallback);
      }
    } catch (error) {
      // On error, set fallback minimal options so the modal isn't empty
      const fallback = [
        { label: 'Thailand', value: 'Thailand' },
        { label: 'Indonesia', value: 'Indonesia' },
        { label: 'Philippines', value: 'Philippines' },
      ];
      setCountryOptions(fallback);
      try { await setCacheData(CACHE_KEYS.COUNTRY, fallback); } catch (e) {}
    }
  };

  const loadListingTypeData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.LISTING_TYPE);
      if (cachedData && cachedData.length > 0) {
        setListingTypeOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        let localListingTypeData = res.data.map(item => ({
          label: item.name || item.listingType,
          value: item.name || item.listingType,
        }));

        setListingTypeOptions(localListingTypeData);
        // Cache the data
        await setCacheData(CACHE_KEYS.LISTING_TYPE, localListingTypeData);
      } else {
        const fallback = ['Single Plant', "Grower's Choice", 'Wholesale']
          .map(n => ({ label: n, value: n }));
        setListingTypeOptions(fallback);
        await setCacheData(CACHE_KEYS.LISTING_TYPE, fallback);
      }
    } catch (error) {
      const fallback = ['Single Plant', "Grower's Choice", 'Wholesale']
        .map(n => ({ label: n, value: n }));
      setListingTypeOptions(fallback);
      try { await setCacheData(CACHE_KEYS.LISTING_TYPE, fallback); } catch (e) {}
    }
  };

  const loadShippingIndexData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.SHIPPING_INDEX);
      if (cachedData && cachedData.length > 0) {
        setShippingIndexOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getShippingIndexApi(), 3, 1000);

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        let localShippingIndexData = res.data.map(item => ({
          label: item.name || item.shippingIndex,
          value: item.name || item.shippingIndex,
        }));

        setShippingIndexOptions(localShippingIndexData);
        // Cache the data
        await setCacheData(CACHE_KEYS.SHIPPING_INDEX, localShippingIndexData);
      } else {
        const idx = getIndexOptions().map(i => ({ label: i.name, value: i.name }));
        setShippingIndexOptions(idx);
        await setCacheData(CACHE_KEYS.SHIPPING_INDEX, idx);
      }
    } catch (error) {
      const idx = getIndexOptions().map(i => ({ label: i.name, value: i.name }));
      setShippingIndexOptions(idx);
      try { await setCacheData(CACHE_KEYS.SHIPPING_INDEX, idx); } catch (e) {}
    }
  };

  const loadAcclimationIndexData = async () => {
    try {
      // Try to get from cache first
      const cachedData = await getCacheData(CACHE_KEYS.ACCLIMATION_INDEX);
      if (cachedData && cachedData.length > 0) {
        setAcclimationIndexOptions(cachedData);
        return;
      }

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getAcclimationIndexApi(), 3, 1000);

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        let localAcclimationIndexData = res.data.map(item => ({
          label: item.name || item.acclimationIndex,
          value: item.name || item.acclimationIndex,
        }));

        setAcclimationIndexOptions(localAcclimationIndexData);
        // Cache the data
        await setCacheData(CACHE_KEYS.ACCLIMATION_INDEX, localAcclimationIndexData);
      } else {
        const idx = getIndexOptions().map(i => ({ label: i.name, value: i.name }));
        setAcclimationIndexOptions(idx);
        await setCacheData(CACHE_KEYS.ACCLIMATION_INDEX, idx);
      }
    } catch (error) {
      const idx = getIndexOptions().map(i => ({ label: i.name, value: i.name }));
      setAcclimationIndexOptions(idx);
      try { await setCacheData(CACHE_KEYS.ACCLIMATION_INDEX, idx); } catch (e) {}
    }
  };

  const loadBrowseGenusData = async () => {
    // Local, static genus set (no API).
    try {
      setLoadingGenusData(true);
      const staticGenus = [
        { key: 'alocasia', label: 'Alocasia', src: alocasiaImage },
        { key: 'anthurium', label: 'Anthurium', src: anthuriumImage },
        { key: 'begonia', label: 'Begonia', src: begoniaImage },
        { key: 'hoya', label: 'Hoya', src: hoyaImage },
        { key: 'monstera', label: 'Monstera', src: monsteraImage },
        { key: 'scindapsus', label: 'Scindapsus', src: scindapsusImage },
        { key: 'syngonium', label: 'Syngonium', src: syngoniumImage },
        { key: 'philodendron', label: 'Philodendron', src: philodendronImage },
        { key: 'others', label: 'Others', src: othersImage },
      ];

      // Map to dynamicGenusData shape expected by UI (omit API-only fields)
      const mapped = staticGenus.map(g => ({
        src: g.src,
        label: g.label,
        genusName: g.label,
        plantCount: null,
        speciesCount: null,
        priceRange: null,
        representativeImage: null,
        representativeImageWebp: null,
      }));

      // Ensure Others last
      const sorted = mapped.sort((a,b)=>{
        const ao = a.label.toLowerCase()==='others';
        const bo = b.label.toLowerCase()==='others';
        if (ao && !bo) return 1; if (!ao && bo) return -1; return 0;
      });
      setDynamicGenusData(sorted);
    } finally {
      setLoadingGenusData(false);
    }
  };

  const loadEventsData = async () => {
    try {
      setLoadingEventsData(true);

      // Robust network check: NetInfo.isInternetReachable can be null on some
      // platforms (meaning "unknown"). Only treat it as offline when it's
      // explicitly false. If NetInfo.fetch() itself fails, log and proceed
      // with the network request (the fetch will surface any real errors).
      let netState;
      try {
        netState = await NetInfo.fetch();
      } catch (netErr) {
        console.warn('NetInfo.fetch failed, proceeding to call events API', netErr);
        netState = { isConnected: true, isInternetReachable: null };
      }

      if (netState.isConnected === false || netState.isInternetReachable === false) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getBuyerEventsApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load events API.');
      }

      const events = res.data || [];
      setEventsData(events);
      
      // Load cached images for events
      await loadCachedEventsImages(events);
    } catch (error) {
      console.error('Error loading events data:', error);
      // Set fallback data or empty array on error
      setEventsData([]);
    } finally {
      setLoadingEventsData(false);
    }
  };

  // Load cached images for events
  const loadCachedEventsImages = async (events) => {
    const cache = {};
    const loadingState = {};
    
    for (const event of events) {
      if (event.image) {
        const eventId = event.id || event.image;
        loadingState[eventId] = false;
        
        try {
          const cachedUri = await getCachedImageUri(event.image, CACHE_CONFIGS.EVENTS_IMAGES.expiryDays);
          if (cachedUri) {
            cache[eventId] = cachedUri;
          }
        } catch (error) {
        }
      }
    }
    
    setEventImageCache(cache);
    setEventImageLoading(loadingState);
  };

  // Handle events image caching on load
  const handleEventsImageLoad = async (event, eventUri) => {
    const eventId = event.id || event.image;
    
    try {
      // Update loading state
      setEventImageLoading(prev => ({
        ...prev,
        [eventId]: false
      }));
      
      // Cache the image if not already cached
      if (!eventImageCache[eventId] && event.image) {
        await setCachedImageUri(eventUri, event.image, CACHE_CONFIGS.EVENTS_IMAGES.expiryDays);
        setEventImageCache(prev => ({
          ...prev,
          [eventId]: eventUri
        }));
      }
    } catch (error) {
    }
  };

  const handleEventsImageLoadStart = (event) => {
    const eventId = event.id || event.image;
    
    // Only show loading if not cached
    if (!eventImageCache[eventId]) {
      setEventImageLoading(prev => ({
        ...prev,
        [eventId]: true
      }));
    }
  };

  // (Removed) genus image caching helpers – static local images render instantly

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);

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

      const res = await retryAsync(() => searchPlantsApi(searchParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search plants.');
      }

      const plants = res.data?.plants || [];
      setSearchResults(plants);
      
      // Show search results in a separate section or update the main plant list
      
    } catch (error) {
      console.error('❌ Error performing search:', error);
      setSearchResults([]);
      
      // Optionally show user-friendly error message
      Alert.alert(
        'Search Error',
        'Could not search for plants. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  // Filter update functions that sync with global state
  const handleSortChange = (value) => {
    console.log('🔀 Sort changed to:', value);
    // Sort is a single selection - update only sort, keep other filters
    updateFilters({ sort: value });
  };

  const handlePriceChange = (value) => {
    // Price is a single selection - update only price, keep other filters
    updateFilters({ price: value });
  };

  const handleGenusChange = (value) => {
    // Genus is multi-select - update only genus, keep other filters
    updateFilters({ genus: value });
  };

  const handleVariegationChange = (value) => {
    // Variegation is multi-select - update only variegation, keep other filters
    console.log('🌿 Variegation changed to:', value);
    console.log('🌿 Variegation value type:', Array.isArray(value) ? 'array' : typeof value);
    updateFilters({ variegation: value });
  };

  const handleCountryChange = (value) => {
    // Country is a single selection - update only country, keep other filters
    updateFilters({ country: value });
  };

  const handleListingTypeChange = (value) => {
    // Listing Type is multi-select - update only listingType, keep other filters
    updateFilters({ listingType: value });
  };

  const handleShippingIndexChange = (value) => {
    // Shipping Index is a single selection - update only shippingIndex, keep other filters
    updateFilters({ shippingIndex: value });
  };

  const handleAcclimationIndexChange = (value) => {
    // Acclimation Index is a single selection - update only acclimationIndex, keep other filters
    updateFilters({ acclimationIndex: value });
  };

  const handleFilterView = () => {
    console.log('🔍 handleFilterView called with globalFilters:', globalFilters);
    
    // Capture current filters to avoid stale closure
    const filtersToApply = {...globalFilters};
    
    // Apply filters to global state
    applyFilters(filtersToApply);
    
    // Close the filter sheet immediately
    setShowSheet(false);
    
    // Navigate to ScreenGenusPlants
    // If genus filter is applied, use first genus for route param (for display purposes)
    // Otherwise use 'All' to indicate no specific genus
    const targetGenus = filtersToApply.genus && filtersToApply.genus.length > 0 
      ? filtersToApply.genus[0] 
      : 'All';
    
    console.log('🎯 Navigating to ScreenGenusPlants with genus:', targetGenus, 'and filters:', filtersToApply);
    
    navigation.navigate('ScreenGenusPlants', {
      genus: targetGenus,
      fromFilter: true, // Flag to indicate this came from filter sheet
      appliedFilters: filtersToApply, // Pass filters directly to avoid race condition
    });
    
    // Call API in background (no await, no blocking)
    // Use captured filtersToApply to avoid stale state
    const callFilterApi = async () => {
      try {
        const baseParams = {
          offset: 0,
          limit: 4, // standardized
          // Note: sortBy and sortOrder are intentionally not set here
          // They will be determined by buildFilterParams based on the applied filters
        };
        
        console.log('🔍 Background call - about to build params');
        console.log('🔍 Background call - using filters:', JSON.stringify(filtersToApply));
        
        // Manually build params using captured filters to avoid race condition
        const params = { ...baseParams };
        
        // Apply sort
        if (filtersToApply.sort) {
          switch (filtersToApply.sort) {
            case 'Newest to Oldest':
              params.sortBy = 'createdAt';
              params.sortOrder = 'desc';
              break;
            case 'Price Low to High':
              params.sortBy = 'usdPrice';
              params.sortOrder = 'asc';
              break;
            case 'Price High to Low':
              params.sortBy = 'usdPrice';
              params.sortOrder = 'desc';
              break;
            case 'Most Loved':
              params.sortBy = 'loveCount';
              params.sortOrder = 'desc';
              break;
            default:
              params.sortBy = 'createdAt';
              params.sortOrder = 'desc';
          }
        }
        
        // Apply genus filter
        if (filtersToApply.genus && filtersToApply.genus.length > 0) {
          const lowercaseGenus = filtersToApply.genus.map(g => g.toLowerCase());
          params.genus = lowercaseGenus.join(',');
        }
        
        // Apply variegation filter - FIX: use captured filters
        if (filtersToApply.variegation && filtersToApply.variegation.length > 0) {
          params.variegation = filtersToApply.variegation.join(',');
          console.log('🔍 Applied variegation filter in background call:', params.variegation);
        }
        
        // Apply price filter
        if (filtersToApply.price) {
          const priceRange = filtersToApply.price;
          if (priceRange === '$0 - $20') {
            params.minPrice = 0;
            params.maxPrice = 20;
          } else if (priceRange === '$21 - $50') {
            params.minPrice = 21;
            params.maxPrice = 50;
          } else if (priceRange === '$51 - $100') {
            params.minPrice = 51;
            params.maxPrice = 100;
          } else if (priceRange === '$101 - $200') {
            params.minPrice = 101;
            params.maxPrice = 200;
          } else if (priceRange === '$201 - $500') {
            params.minPrice = 201;
            params.maxPrice = 500;
          } else if (priceRange === '$501 +') {
            params.minPrice = 501;
          }
        }
        
        // Apply country filter
        if (filtersToApply.country) {
          params.country = filtersToApply.country;
        }
        
        // Apply listing type filter
        if (filtersToApply.listingType && filtersToApply.listingType.length > 0) {
          params.listingType = filtersToApply.listingType.join(',');
        }
        
        // Apply shipping index filter
        if (filtersToApply.shippingIndex) {
          params.shippingIndex = filtersToApply.shippingIndex;
        }
        
        // Apply acclimation index filter
        if (filtersToApply.acclimationIndex) {
          params.acclimationIndex = filtersToApply.acclimationIndex;
        }
        
        console.log('🔍 Background API call with params:', params);
        
        // Call buyer listings API with applied filters (in background)
        await getBuyerListingsApi(params);
        console.log('🔍 Filter API call completed in background');
      } catch (error) {
        console.error('Error in background filter API call:', error);
      }
    };
    
    // Start background API call
    callFilterApi();
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const onGenusPress = async genusName => {
    
    // Clear FilterContext state
    clearFilters();
    
    // Clear filter-related AsyncStorage when browsing genus plants
    try {
      await AsyncStorage.multiRemove([
        'shop_filters',
        'applied_filters', 
        'global_filters',
        'filter_preferences',
        'buyer_filters',
        'plant_filters'
      ]);
    } catch (error) {
    }
    
    // Navigate to the genus plants screen
    navigation.navigate('ScreenGenusPlants', {
      genus: genusName,
    });
  };

  const retryLoadGenusData = () => {
    loadBrowseGenusData();
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

  const onGrowersPress = () => {
    // Clear all filters first, then apply only Grower's Choice filter
    clearFilters();
    updateFilters({ listingType: ["Grower's Choice"] });
    
    // Navigate to genus plants screen with Grower's Choice filter
    navigation.navigate('ScreenGenusPlants', {
      genus: 'All',
      filterType: 'listingType',
      filterValue: "Grower's Choice"
    });
  };
  
  const onWholesalePress = () => {
    // Clear all filters first, then apply only Wholesale filter
    clearFilters();
    updateFilters({ listingType: ["Wholesale"] });
    
    // Navigate to genus plants screen with Wholesale filter
    navigation.navigate('ScreenGenusPlants', {
      genus: 'All',
      filterType: 'listingType',
      filterValue: 'Wholesale'
    });
  };

  // Helper function to check if a filter is currently active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        return globalFilters.sort && globalFilters.sort !== 'Newest to Oldest';
      case 'Price':
        return globalFilters.price && globalFilters.price !== '';
      case 'Genus':
        return globalFilters.genus && globalFilters.genus.length > 0;
      case 'Variegation':
        return globalFilters.variegation && globalFilters.variegation.length > 0;
      case 'Country':
        return globalFilters.country && globalFilters.country !== '';
      case 'Listing Type':
        return globalFilters.listingType && globalFilters.listingType.length > 0;
      case 'Shipping Index':
        return globalFilters.shippingIndex && globalFilters.shippingIndex !== '';
      case 'Acclimation Index':
        return globalFilters.acclimationIndex && globalFilters.acclimationIndex !== '';
      default:
        return false;
    }
  };

  // Helper function to get active filter count for multi-select filters
  const getFilterCount = (filterLabel) => {
    switch (filterLabel) {
      case 'Genus':
        return globalFilters.genus?.length || 0;
      case 'Variegation':
        return globalFilters.variegation?.length || 0;
      case 'Listing Type':
        return globalFilters.listingType?.length || 0;
      default:
        return 0;
    }
  };

  const handleAddToCartFromBrowseMore = async (plant) => {
    try {
      
      const params = {
        plantCode: plant.plantCode,
        quantity: 1,
      };
      
      const response = await addToCartApi(params);
      
      if (response.success) {
        Alert.alert('Success', 'Plant added to cart successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to add plant to cart');
      }
    } catch (error) {
      console.error('Error adding plant to cart:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const HEADER_HEIGHT = 110;

  const headerScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
  // Local import of reusable Avatar component to avoid modifying top-level imports
  const Avatar = require('../../../components/Avatar/Avatar').default;

  return (
    <>
      <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
        <View style={styles.header}>
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
                {loadingSearch && (
                  <ActivityIndicator size="small" color="#647276" style={{marginLeft: 8}} />
                )}
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
              {/* Reusable Avatar component will show cached profilePhotoUrl or fallback icon */}
              <Avatar size={40} imageUri={profilePhotoUrl} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={headerScrollRef}
          style={{flexGrow: 0, paddingVertical: 4}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            paddingHorizontal: 10,
          }}>
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
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isFilterActive(option.label) ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive(option.label) ? '#E8F5E9' : '#FFFFFF',
                padding: 8,
                marginTop: 5,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              {option.leftIcon && (
                <option.leftIcon
                  width={20}
                  height={20}
                  style={{marginRight: 4}}
                />
              )}
              <Text style={{
                fontSize: 14, 
                fontWeight: isFilterActive(option.label) ? '600' : '500', 
                color: isFilterActive(option.label) ? '#23C16B' : '#393D40'
              }}>
                {option.label}
              </Text>
              {getFilterCount(option.label) > 0 && (
                <View style={{
                  backgroundColor: '#23C16B',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 6,
                  paddingHorizontal: 6,
                }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {getFilterCount(option.label)}
                  </Text>
                </View>
              )}
              {option.rightIcon && !getFilterCount(option.label) && (
                <option.rightIcon
                  width={20}
                  height={20}
                  style={{marginLeft: 4}}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchTerm.trim().length >= 2 && (
          <View style={[styles.searchResultsContainer, {top: insets.top + 52}]}>
            {loadingSearch ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#10b981" />
                <Text style={styles.loadingText}>Searching plants...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {searchResults.slice(0, 8).map((plant, index) => (
                  <TouchableOpacity
                    key={`${plant.id}_${index}`}
                    style={styles.searchResultItem}
                    onPress={() => {
                      if (plant.plantCode) {
                        navigation.navigate('ScreenPlantDetail', {
                          plantCode: plant.plantCode
                        });
                      } else {
                        console.error('❌ Missing plantCode for plant:', plant);
                        Alert.alert('Error', 'Unable to view plant details. Missing plant code.');
                      }
                    }}
                  >
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
      </View>
      <ScrollView
        ref={mainScrollRef}
        style={[styles.body, {paddingTop: HEADER_HEIGHT + insets.top}]}
        contentContainerStyle={{paddingBottom: totalBottomPadding}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7CBD58']} // Android
            tintColor="#7CBD58" // iOS
          />
        }>
        
        <PromoBadgeList navigation={navigation} />
        
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 8,
            paddingVertical: 10,
          }}>
          <InfoCard
            title={"Grower's\nChoice"}
            subtitle="Explore"
            IconComponent={GrowersIcon}
            backgroundColor="#C9F0FF"
            onPress={onGrowersPress}
          />
          <InfoCard
            title={'Wholesale\nPlants'}
            subtitle="Browse"
            IconComponent={WholesaleIcon}
            backgroundColor="#ECFCE5"
            onPress={onWholesalePress}
          />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#393D40',
          }}>
          Deals, Rewards & Latest News
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            paddingHorizontal: 10,
          }}
          style={{flexGrow: 0}}>
          {loadingEventsData ? (
            // Loading state
            Array.from({length: 2}).map((_, idx) => (
              <View key={idx} style={{width: 275}}>
                <View
                  style={{
                    width: 260,
                    height: 120,
                    borderRadius: 16,
                    backgroundColor: '#f0f0f0',
                  }}
                />
                <View
                  style={{
                    width: 150,
                    height: 16,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                    marginTop: 4,
                    marginHorizontal: 5,
                  }}
                />
              </View>
            ))
          ) : eventsData.length > 0 ? (
            eventsData.map((item, idx) => {
              const eventId = item.id || item.image;
              const cachedImageUri = eventImageCache[eventId];
              const isImageLoading = eventImageLoading[eventId];
              
              // Determine which image to display
              const displayImage = cachedImageUri ? { uri: cachedImageUri } : { uri: item.image };
              
              return (
                <TouchableOpacity
                  key={item.id || idx}
                  style={{width: 275, position: 'relative'}}
                  onPress={() => {
                    // Handle link navigation if item has a link
                    if (item.link) {
                      Linking.openURL(item.link).catch(err => 
                        console.error('Failed to open link:', err)
                      );
                    }
                  }}>
                  <Image
                    source={displayImage}
                    style={{width: 260, height: 120, borderRadius: 16}}
                    resizeMode="cover"
                    onLoadStart={() => handleEventsImageLoadStart(item)}
                    onLoad={(event) => {
                      handleEventsImageLoad(item, event.nativeEvent.source?.uri);
                    }}
                    onError={(error) => {
                      setEventImageLoading(prev => ({
                        ...prev,
                        [eventId]: false
                      }));
                    }}
                    key={`event-${eventId}-${cachedImageUri ? 'cached' : 'original'}`}
                  />
                  
                  {/* Loading overlay for events images */}
                  {isImageLoading && (
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 260,
                      height: 120,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <ActivityIndicator size="small" color="#7CBD58" />
                    </View>
                  )}
                  
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '900',
                      color: '#393D40',
                      marginTop: 4,
                      textAlign: 'left',
                      paddingHorizontal: 5,
                    }}>
                    {item.name || item.label || 'Deals, Rewards & News'}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            // Fallback when no events data
            <View style={{width: 275}}>
              <View
                style={{
                  width: 260,
                  height: 120,
                  borderRadius: 16,
                  backgroundColor: '#f5f5f5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={{color: '#888', fontSize: 14}}>
                  No events available
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#393D40',
            marginTop: 10,
          }}>
          Browse Plants by Genus
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            marginTop: 10,
          }}>
          {loadingGenusData ? (
            // Loading state
            Array.from({length: 9}).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: '30%',
                  marginBottom: 18,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    marginBottom: 6,
                    backgroundColor: '#f0f0f0',
                  }}
                />
                <View
                  style={{
                    width: 60,
                    height: 14,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                  }}
                />
              </View>
            ))
          ) : dynamicGenusData.length > 0 ? (
            // Static local genus data
            dynamicGenusData.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  width: '30%',
                  marginBottom: 18,
                  alignItems: 'center',
                  position: 'relative',
                }}
                onPress={() => onGenusPress(item.genusName)}>
                <Image
                  source={item.src || genus1}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    marginBottom: 6,
                  }}
                  resizeMode="cover"
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: '#393D40',
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            // Show error state when no data is available
            <View
              style={{
                width: '100%',
                padding: 20,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  color: '#666',
                  textAlign: 'center',
                  marginBottom: 15,
                }}>
                Unable to load genus data. Please check your connection and try
                again.
              </Text>
              <TouchableOpacity
                onPress={retryLoadGenusData}
                style={{
                  backgroundColor: '#539461',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#393D40',
            marginTop: 10,
          }}>
          Explore Plants by Country
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            gap: 5,
            paddingHorizontal: 12,
            marginTop: 8,
          }}>
          {countryData.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                // Clear all filters first, then apply only country filter
                clearFilters();
                updateFilters({ country: [item.label] });
                
                // Navigate to genus plants screen with country filter
                navigation.navigate('ScreenGenusPlants', {
                  genus: 'All',
                  filterType: 'country',
                  filterValue: item.label
                });
              }}
              style={{
                width: 110,
                height: 79,
                borderWidth: 1,
                borderColor: '#E3E6E8',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginRight: 10,
                backgroundColor: '#fff',
              }}>
              <item.src width={40} height={40} resizeMode="cover" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '900',
                  color: '#393D40',
                  width: '100%'
                }}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse More Plants Component */}
        <BrowseMorePlants
          key={`browse-more-${browseMorePlantsKey}`}
          title="More from our Jungle"
          initialLimit={4}
          loadMoreLimit={4}
          showLoadMore={true}
          autoLoad={true}
          forceRefresh={refreshing} // Force refresh when user pulls to refresh
          onAddToCart={handleAddToCartFromBrowseMore}
        />
      </ScrollView>

      {/* Sort Filter Modal */}
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
        sortValue={globalFilters.sort}
        sortChange={handleSortChange}
        genusValue={globalFilters.genus}
        genusChange={handleGenusChange}
        variegationValue={globalFilters.variegation}
        variegationChange={handleVariegationChange}
        priceValue={globalFilters.price}
        priceChange={handlePriceChange}
        countryValue={globalFilters.country}
        countryChange={handleCountryChange}
        listingTypeValue={globalFilters.listingType}
        listingTypeChange={handleListingTypeChange}
        shippingIndexValue={globalFilters.shippingIndex}
        shippingIndexChange={handleShippingIndexChange}
        acclimationIndexValue={globalFilters.acclimationIndex}
        acclimationIndexChange={handleAcclimationIndexChange}
        handleSearchSubmit={handleFilterView}
        clearFilters={clearFilters}
      />
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#DFECDF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  search: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  liveTag: {
    color: 'red',
    fontSize: 10,
    marginTop: -4,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  topNavItem: {
    backgroundColor: '#fff',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    height: 80,
  },
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  msgIcon: {
    position: 'relative',
  },
  msgBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  msgBadgeText: {
    fontSize: 10,
    color: '#fff',
  },
  cardBlack: {
    height: 135,
    width: 224,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 16,
    flex: 1,
    marginRight: 8,
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
  cardWhite: {
    backgroundColor: '#f7f7f7',
    borderColor: '#CDD3D4',
    borderWidth: 1,
    height: 135,
    width: 224,
    borderRadius: 10,
    padding: 16,
    flex: 1,
  },
  greenTag: {
    backgroundColor: '#23C16B',
    position: 'absolute',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    fontSize: 14,
    marginTop: 8,
    right: 10,
  },
  redPercentTag: {
    backgroundColor: '#FF5247',
    position: 'absolute',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    fontSize: 14,
    marginTop: 8,
    right: 10,
  },
  redTag: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#fff',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  filterButtonText: {
    color: '#393D40',
    fontSize: 15,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#539461',
    marginRight: 8,
  },
  // Search Results Styles
  searchResultsContainer: {
    position: 'absolute',
    top: 52, // Position below the search input field
    left: 13, // Match header paddingHorizontal
    right: 53, // Account for header icons width
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
export default ScreenShop;
