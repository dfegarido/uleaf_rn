/* eslint-disable react-native/no-inline-styles */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react'; // keep hook imports grouped
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../../auth/AuthProvider';
import {useFilters} from '../../../context/FilterContext';
import SearchHeader from '../../../components/Header/SearchHeader';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import PromoBadgeList from '../../../components/PromoBadgeList';
import GrowersIcon from '../../../assets/buyer-icons/growers-choice-icon.svg';
import IndonesiaIcon from '../../../assets/buyer-icons/indonesia-flag.svg';
import PhilippinesIcon from '../../../assets/buyer-icons/philippines-flag.svg';
import {
  genus1,
  genus2
} from '../../../assets/buyer-icons/png';
import ThailandIcon from '../../../assets/buyer-icons/thailand-flag.svg';
import WholesaleIcon from '../../../assets/buyer-icons/wholesale-plants-icon.svg';
import BrowseMorePlants from '../../../components/BrowseMorePlants';

// Import genus images from assets/buyer-icons/png
import alocasiaImage from '../../../assets/buyer-icons/png/alocasia.jpg';
import anthuriumImage from '../../../assets/buyer-icons/png/anthurium.jpg';
import begoniaImage from '../../../assets/buyer-icons/png/begonia.jpg';
import hoyaImage from '../../../assets/buyer-icons/png/hoya.jpg';
import monsteraImage from '../../../assets/buyer-icons/png/monstera.jpg';
import othersImage from '../../../assets/buyer-icons/png/others.jpg';
import philodendronImage from '../../../assets/buyer-icons/png/philodendron.jpg';
import scindapsusImage from '../../../assets/buyer-icons/png/scindapsus.jpg';
import syngoniumImage from '../../../assets/buyer-icons/png/syngonium.jpg';

import NetInfo from '@react-native-community/netinfo';
import {
  addToCartApi,
  getBuyerEventsApi,
  getBuyerListingsApi,
  getGenusApi,
  getVariegationApi,
  searchPlantsApi,
} from '../../../components/Api';
import {
  getAcclimationIndexApi,
  getCountryApi,
  getListingTypeApi,
  getShippingIndexApi,
} from '../../../components/Api/dropdownApi';
import { InfoCard } from '../../../components/InfoCards';
import { ReusableActionSheet } from '../../../components/ReusableActionSheet';
import {
  CACHE_KEYS,
  getCacheData,
  setCacheData,
} from '../../../utils/dropdownCache';
import {
  CACHE_CONFIGS,
  getCachedImageUri,
  setCachedImageUri
} from '../../../utils/imageCache';
import { retryAsync } from '../../../utils/utils';

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
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNavigatingFromSearch, setIsNavigatingFromSearch] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Browse plants state persistence to prevent unnecessary reloading
  const [browseMorePlantsKey, setBrowseMorePlantsKey] = useState(1);
  const [browseMorePlantsComponent, setBrowseMorePlantsComponent] = useState(null);
  // (Removed) recommendations state – replaced by BrowseMorePlants component elsewhere

  // Log auth token and user info when Shop tab is accessed
  useFocusEffect(
    React.useCallback(() => {
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
      // Always fetch fresh data - no caching for country dropdown
      // Skip network check - let the API call handle connectivity issues
      const res = await retryAsync(() => getCountryApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load country api');
      }

      let localCountryData = res.data.map(item => ({
        label: item.name || item.country,
        value: item.name || item.country,
      }));

      setCountryOptions(localCountryData);
    } catch (error) {
      console.error('❌ Error loading country data:', error);
    }
  };

  const loadListingTypeData = async () => {
    try {
      // Always fetch fresh data - no caching for listing type dropdown
      // Skip network check - let the API call handle connectivity issues
      const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load listing type api');
      }

      let localListingTypeData = res.data.map(item => ({
        label: item.name || item.listingType,
        value: item.name || item.listingType,
      }));

      setListingTypeOptions(localListingTypeData);
    } catch (error) {
      console.error('❌ Error loading listing type data:', error);
    }
  };

  const loadShippingIndexData = async () => {
    try {
      // Always fetch fresh data - no caching for shipping index dropdown
      // Skip network check - let the API call handle connectivity issues
      const res = await retryAsync(() => getShippingIndexApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load shipping index api');
      }

      let localShippingIndexData = res.data.map(item => ({
        label: item.name || item.shippingIndex,
        value: item.name || item.shippingIndex,
      }));

      setShippingIndexOptions(localShippingIndexData);
    } catch (error) {
      console.error('❌ Error loading shipping index data:', error);
    }
  };

  const loadAcclimationIndexData = async () => {
    try {
      // Always fetch fresh data - no caching for acclimation index dropdown
      // Skip network check - let the API call handle connectivity issues
      const res = await retryAsync(() => getAcclimationIndexApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load acclimation index api');
      }

      let localAcclimationIndexData = res.data.map(item => ({
        label: item.name || item.acclimationIndex,
        value: item.name || item.acclimationIndex,
      }));

      setAcclimationIndexOptions(localAcclimationIndexData);
    } catch (error) {
      console.error('❌ Error loading acclimation index data:', error);
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

  // Custom render function for search results (simpler text display)
  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      activeOpacity={0.7}
      onPress={() => {
        if (item.plantCode) {
          // Set flag to prevent blur from closing dropdown
          setIsNavigatingFromSearch(true);
          // Navigate immediately
          navigation.navigate('ScreenPlantDetail', {
            plantCode: item.plantCode
          });
          // Close dropdown and reset flag after navigation
          setIsSearchFocused(false);
          setTimeout(() => {
            setIsNavigatingFromSearch(false);
          }, 100);
        } else {
          console.error('❌ Missing plantCode for plant:', item);
          Alert.alert('Error', 'Unable to view plant details. Missing plant code.');
          setIsNavigatingFromSearch(false);
        }
      }}
    >
      <Text style={styles.searchResultName} numberOfLines={2}>
        {item.title && !item.title.includes('Choose the most suitable variegation') 
          ? item.title 
          : `${item.genus} ${item.species}${item.variegation && item.variegation !== 'Choose the most suitable variegation.' ? ' ' + item.variegation : ''}`}
      </Text>
    </TouchableOpacity>
  );

  // Handle plant selection from search
  const handlePlantSelect = (plant) => {
    if (plant.plantCode) {
      setIsNavigatingFromSearch(true);
      navigation.navigate('ScreenPlantDetail', {
        plantCode: plant.plantCode
      });
      setIsSearchFocused(false);
      setTimeout(() => {
        setIsNavigatingFromSearch(false);
      }, 100);
    }
  };

  // Filter update functions that sync with global state
  const handleSortChange = (value) => {
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
    
    // Apply filters to global state
    applyFilters(globalFilters);
    
    // Close the filter sheet immediately
    setShowSheet(false);
    
    // Navigate to ScreenGenusPlants
    // If genus filter is applied, use first genus for route param (for display purposes)
    // Otherwise use 'All' to indicate no specific genus
    const targetGenus = globalFilters.genus && globalFilters.genus.length > 0 
      ? globalFilters.genus[0] 
      : 'All';
    
    navigation.navigate('ScreenGenusPlants', {
      genus: targetGenus,
      fromFilter: true, // Flag to indicate this came from filter sheet
    });
    
    // Call API in background (no await, no blocking)
    const callFilterApi = async () => {
      try {
        const baseParams = {
          offset: 0,
          limit: 4, // standardized
          // Note: sortBy and sortOrder are intentionally not set here
          // They will be determined by buildFilterParams based on the applied filters
        };
        
        const filterParams = buildFilterParams(baseParams);

        
        // Call buyer listings API with applied filters (in background)
        await getBuyerListingsApi(filterParams);
      } catch (error) {
        console.error('Error in background filter API call:', error);
      }
    };
    
    // Start background API call
    callFilterApi();
  };

  // Function to clear a specific filter
  const clearSpecificFilter = (filterLabel) => {
    let filterUpdate = {};
    
    switch (filterLabel) {
      case 'Sort':
        filterUpdate = { sort: 'Newest to Oldest' };
        break;
      case 'Price':
        filterUpdate = { price: '' };
        break;
      case 'Genus':
        filterUpdate = { genus: [] };
        break;
      case 'Variegation':
        filterUpdate = { variegation: [] };
        break;
      case 'Country':
        filterUpdate = { country: [] };
        break;
      case 'Listing Type':
        filterUpdate = { listingType: [] };
        break;
      case 'Shipping Index':
        filterUpdate = { shippingIndex: [] };
        break;
      case 'Acclimation Index':
        filterUpdate = { acclimationIndex: [] };
        break;
      default:
        return;
    }
    
    // Update and apply the cleared filter
    const updatedFilters = { ...globalFilters, ...filterUpdate };
    updateFilters(filterUpdate);
    applyFilters(updatedFilters);
  };

  const onPressFilter = pressCode => {
    // Map pressCode to filter label
    const filterLabelMap = {
      'SORT': 'Sort',
      'PRICE': 'Price',
      'GENUS': 'Genus',
      'VARIEGATION': 'Variegation',
      'COUNTRY': 'Country',
      'LISTING_TYPE': 'Listing Type',
      'SHIPPING_INDEX': 'Shipping Index',
      'ACCLIMATION_INDEX': 'Acclimation Index',
    };
    
    const filterLabel = filterLabelMap[pressCode];
    
    // If filter is active, clear it instead of opening the modal
    if (filterLabel && isFilterActive(filterLabel)) {
      clearSpecificFilter(filterLabel);
      return;
    }
    
    // Otherwise, open the filter modal as usual
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
        return globalFilters.country && globalFilters.country.length > 0;
      case 'Listing Type':
        return globalFilters.listingType && globalFilters.listingType.length > 0;
      case 'Shipping Index':
        return globalFilters.shippingIndex && globalFilters.shippingIndex.length > 0;
      case 'Acclimation Index':
        return globalFilters.acclimationIndex && globalFilters.acclimationIndex.length > 0;
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
      case 'Country':
        return globalFilters.country?.length || 0;
      case 'Shipping Index':
        return globalFilters.shippingIndex?.length || 0;
      case 'Acclimation Index':
        return globalFilters.acclimationIndex?.length || 0;
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
    <SafeAreaView style={{flex: 1}} edges={[]}>
      <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <SearchHeader
              searchText={searchTerm}
              onSearchTextChange={setSearchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Handled by SearchHeader component
              }}
              isNavigatingFromSearch={isNavigatingFromSearch}
              setIsNavigatingFromSearch={setIsNavigatingFromSearch}
              onPlantSelect={handlePlantSelect}
              renderResultItem={renderSearchResult}
              searchApiWrapper={retryAsync}
              navigation={navigation}
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

      </View>
      <ScrollView
        ref={mainScrollRef}
        style={[styles.body, {paddingTop: HEADER_HEIGHT + insets.top}]}
        contentContainerStyle={{paddingBottom: totalBottomPadding}}
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 400; // Trigger when 400px from bottom
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
          
          if (isCloseToBottom && browseMorePlantsComponent) {
            // Trigger load more in BrowseMorePlants component
            browseMorePlantsComponent.handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
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
          ref={setBrowseMorePlantsComponent}
          key={`browse-more-${browseMorePlantsKey}`}
          title="More from our Jungle"
          initialLimit={8}
          loadMoreLimit={8}
          showLoadMore={false}
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
    </SafeAreaView>
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
    zIndex: 10001,
    elevation: 10001,
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
    zIndex: 10000,
    elevation: 10000,
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
    elevation: 10,
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
    height: 400, // Fixed height for scrollable results
    maxHeight: 400, // Maximum height constraint
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
    flex: 1,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  searchResultsListContent: {
    paddingVertical: 8,
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
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
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
