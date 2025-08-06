/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../auth/AuthProvider';
import {useFilters} from '../../../context/FilterContext';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import PriceDropIcon from '../../../assets/buyer-icons/price-drop-icons.svg';
import NewArrivalsIcon from '../../../assets/buyer-icons/megaphone.svg';
import PromoBadge from '../../../components/PromoBadge/PromoBadge';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import GrowersIcon from '../../../assets/buyer-icons/growers-choice-icon.svg';
import WholesaleIcon from '../../../assets/buyer-icons/wholesale-plants-icon.svg';
import PhilippinesIcon from '../../../assets/buyer-icons/philippines-flag.svg';
import ThailandIcon from '../../../assets/buyer-icons/thailand-flag.svg';
import IndonesiaIcon from '../../../assets/buyer-icons/indonesia-flag.svg';
import DropDownIcon from '../../../assets/buyer-icons/drop-down.svg';
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

// Import genus images from assets/images
import alocasiaImage from '../../../assets/images/alocasia.png';
import anthuriumImage from '../../../assets/images/anthurium.png';
import begoniaImage from '../../../assets/images/begonia.png';
import hoyaImage from '../../../assets/images/hoya.png';
import monsteraImage from '../../../assets/images/monstera.png';
import scindapsusImage from '../../../assets/images/scindapsus.png';
import syngoniumImage from '../../../assets/images/syngonium.png';
import philodendronImage from '../../../assets/images/philodendron.png';
import othersImage from '../../../assets/images/others.png';

import {InfoCard} from '../../../components/InfoCards';
import ScreenWishlist from './ScreenWishlist';
import {PlantItemCard} from '../../../components/PlantItemCard';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import {
  getSortApi,
  getGenusApi,
  getVariegationApi,
  getBrowsePlantByGenusApi,
  getBuyerEventsApi,
  searchListingApi,
  getBuyerListingsApi,
  addToCartApi,
  getCartItemsApi,
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
  const {
    globalFilters,
    updateFilters,
    applyFilters,
    buildFilterParams,
    hasAppliedFilters
  } = useFilters();

  // Log auth token and user info when Shop tab is accessed
  useFocusEffect(
    React.useCallback(() => {
      const logAuthInfo = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          console.log('=== SHOP TAB ACCESS ===');
          console.log('Auth Token:', token);
          console.log('Firebase User:', user);
          console.log('Global Filters:', globalFilters);
          console.log('========================');
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      };

      logAuthInfo();
    }, [user, globalFilters]),
  );

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
  
  // Search results state
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length > 2) {
        performSearch(searchTerm.trim());
      } else if (searchTerm.trim().length === 0) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Load sort, genus, and variegation options on component mount
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
          loadBrowseMorePlants(),
        ]);
      } catch (error) {
        console.log('Error loading filter data:', error);
      }
    };

    fetchData();
  }, []);

  // Reload genus data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const reloadGenusData = async () => {
        try {
          await loadBrowseGenusData();
        } catch (error) {
          console.log('Error reloading genus data on focus:', error);
        }
      };

      reloadGenusData();
    }, []),
  );

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

  const loadBrowseGenusData = async () => {
    try {
      setLoadingGenusData(true);
      console.log('Starting to load browse genus data...');

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }
      console.log('Network connection verified');

      // Call the browse plants by genus API to get all genera with representative images
      const browseRes = await retryAsync(
        () => getBrowsePlantByGenusApi(),
        3,
        1000,
      );
      console.log('Browse plants API response received:', browseRes);

      if (!browseRes?.success) {
        throw new Error(
          browseRes?.message || 'Failed to load browse genus data',
        );
      }

      // Ensure we have genus groups data from the API
      if (
        !browseRes.genusGroups ||
        !Array.isArray(browseRes.genusGroups) ||
        browseRes.genusGroups.length === 0
      ) {
        throw new Error('No genus groups data received from API');
      }

      console.log('Raw genus groups data:', browseRes.genusGroups);

      // Create genus image mapping
      const genusImageMap = {
        'alocasia': alocasiaImage,
        'anthurium': anthuriumImage,
        'begonia': begoniaImage,
        'hoya': hoyaImage,
        'monstera': monsteraImage,
        'scindapsus': scindapsusImage,
        'syngonium': syngoniumImage,
        'philodendron': philodendronImage,
        'others': othersImage,
      };

      // Fallback images array for any unmapped genera
      // const genusImages = [
      //   genus1,
      //   genus2,
      //   genus3,
      //   genus4,
      //   genus5,
      //   genus6,
      //   genus7,
      //   genus8,
      // ];

      const mappedGenusData = browseRes.genusGroups.map((genusGroup, index) => {
        // Get the correct genus name from representativePlant.originalGenus
        const correctGenusName = genusGroup.representativePlant?.originalGenus || genusGroup.genus;
        
        // First try to get the specific image for this genus
        let imageSource = genusImageMap[genusGroup.genus.toLowerCase()];
        
        // If no specific image found, try using representative image from API
        if (!imageSource && genusGroup.representativeImage) {
          imageSource = {uri: genusGroup.representativeImage};
        }
        
        // // Final fallback to generic images
        if (!imageSource) {
          imageSource = genusImages[index % genusImages.length];
        }

        return {
          src: imageSource,
          label: genusGroup.genus,
          genusName: correctGenusName,
          plantCount: genusGroup.plantCount,
          speciesCount: genusGroup.speciesCount,
          priceRange: genusGroup.priceRange,
        };
      });

      // Sort the data to ensure "others" appears last
      const sortedGenusData = mappedGenusData.sort((a, b) => {
        const aIsOthers = a.genusName.toLowerCase() === 'others';
        const bIsOthers = b.genusName.toLowerCase() === 'others';
        
        if (aIsOthers && !bIsOthers) return 1; // a goes to end
        if (!aIsOthers && bIsOthers) return -1; // b goes to end
        return 0; // maintain original order for non-others items
      });

      console.log(
        'Successfully loaded dynamic genus data:',
        sortedGenusData.length,
        'items',
      );
      console.log('Mapped genus data:', sortedGenusData);
      setDynamicGenusData(sortedGenusData);
    } catch (error) {
      console.error('Error loading browse genus data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      // Don't fallback to static data - keep loading state or show error
      setDynamicGenusData([]);
      // You could show a user-friendly error message here
    } finally {
      setLoadingGenusData(false);
    }
  };

  const loadEventsData = async () => {
    try {
      setLoadingEventsData(true);
      console.log('Starting to load events data...');

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getBuyerEventsApi(), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load events API.');
      }

      console.log('Events data loaded successfully:', res.data);
      setEventsData(res.data || []);
    } catch (error) {
      console.error('Error loading events data:', error);
      // Set fallback data or empty array on error
      setEventsData([]);
    } finally {
      setLoadingEventsData(false);
    }
  };

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);
      console.log('Starting search for:', searchTerm);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const baseSearchParams = {
        plant: searchTerm,
        limit: 20
      };

      const searchFilterParams = buildFilterParams(baseSearchParams);
      console.log('Search filter params:', searchFilterParams);

      const res = await retryAsync(() => searchListingApi(searchFilterParams), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to search listings.');
      }

      console.log('Search results loaded successfully:', res.data);
      setSearchResults(res.data?.listings || []);
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Filter update functions that sync with global state
  const handleSortChange = (value) => {
    updateFilters({ sort: value });
  };

  const handlePriceChange = (value) => {
    updateFilters({ price: value });
  };

  const handleGenusChange = (value) => {
    updateFilters({ genus: value });
  };

  const handleVariegationChange = (value) => {
    updateFilters({ variegation: value });
  };

  const handleCountryChange = (value) => {
    updateFilters({ country: value });
  };

  const handleListingTypeChange = (value) => {
    updateFilters({ listingType: value });
  };

  const handleShippingIndexChange = (value) => {
    updateFilters({ shippingIndex: value });
  };

  const handleAcclimationIndexChange = (value) => {
    updateFilters({ acclimationIndex: value });
  };

  const handleFilterView = async () => {
    try {
      // Apply filters to global state
      applyFilters(globalFilters);
      
      console.log('Applying filters to global state:', globalFilters);
      
      // Build filter parameters for API call using global context
      const baseParams = {
        offset: 0,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      
      const filterParams = buildFilterParams(baseParams);
      console.log('Filter params for API call:', filterParams);
      
      // Call buyer listings API with applied filters
      const response = await getBuyerListingsApi(filterParams);
      console.log('Buyer listings API response:', response);
      
      setShowSheet(false);
      
      // Navigate to ScreenGenusPlants - the global state will handle the filters
      // If a specific genus is selected, use it; otherwise navigate to a general filtered view
      const targetGenus = globalFilters.genus && globalFilters.genus.length > 0 ? globalFilters.genus[0] : 'All';
      
      navigation.navigate('ScreenGenusPlants', {
        genus: targetGenus,
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      setShowSheet(false);
      
      // Still navigate even if API call fails
      const targetGenus = globalFilters.genus && globalFilters.genus.length > 0 ? globalFilters.genus[0] : 'All';
      
      navigation.navigate('ScreenGenusPlants', {
        genus: targetGenus,
      });
    }
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const onGenusPress = async genusName => {
    console.log('Genus pressed:', genusName);
    // Navigate to the genus plants screen
    navigation.navigate('ScreenGenusPlants', {
      genus: genusName,
    });
  };

  const retryLoadGenusData = () => {
    console.log('Retrying to load genus data...');
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

  const promoBadges = [
    {label: 'Price Drop', icon: PriceDropIcon},
    {label: 'New Arrivals', icon: NewArrivalsIcon},
    {label: 'Latest Nursery Drop', icon: LeavesIcon},
    {label: 'Below $20', icon: PriceTagIcon},
    {label: 'Unicorn', icon: UnicornIcon},
    {label: 'Top 5 Buyer Wish List', icon: Top5Icon},
  ];

  const onGrowersPress = () => {
    console.log('Growers Pressed');
  };
  const onWholesalePress = () => {
    console.log('Wholesale Pressed');
  };

  const loadBrowseMorePlants = async () => {
    try {
      setLoadingBrowseMorePlants(true);
      console.log('Loading browse more plants...');
      
      const baseParams = {
        offset: 0,
        limit: 6, // Same as static data count
        sortBy: 'loveCount',
        sortOrder: 'desc',
      };
      
      const filterParams = buildFilterParams(baseParams);
      console.log('Browse more plants filter params:', filterParams);
      
      const response = await getBuyerListingsApi(filterParams);
      console.log('Browse more plants API response:', response);
      
      if (response.success && response.data?.listings) {
        setBrowseMorePlants(response.data.listings);
      } else {
        console.error('Failed to load browse more plants:', response.message);
        setBrowseMorePlants([]);
      }
    } catch (error) {
      console.error('Error loading browse more plants:', error);
      setBrowseMorePlants([]);
    } finally {
      setLoadingBrowseMorePlants(false);
    }
  };

  const handleAddToCartFromBrowseMore = async (plant) => {
    try {
      console.log('Adding plant to cart from browse more:', plant.plantCode);
      
      const params = {
        plantCode: plant.plantCode,
        quantity: 1,
      };
      
      const response = await addToCartApi(params);
      console.log('Add to cart response:', response);
      
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

  const scrollViewRef = useRef(null);

  const [browseMorePlants, setBrowseMorePlants] = useState([]);
  const [loadingBrowseMorePlants, setLoadingBrowseMorePlants] = useState(true);

  const [searchText, setSearchText] = useState('');

  return (
    <>
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ileafU"
                placeholderTextColor="#647276"
                value={searchText}
                onChangeText={setSearchText}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenWishlist')}>
              <Wishicon width={40} height={40} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              <AvatarIcon width={40} height={40} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
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
                borderColor: '#CDD3D4',
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
              <Text style={{fontSize: 14, fontWeight: '500', color: '#393D40'}}>
                {option.label}
              </Text>
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
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.body, {paddingTop: HEADER_HEIGHT}]}
        contentContainerStyle={{paddingBottom: 170}}>
        
        {/* Search Results Section */}
        {searchTerm.trim().length > 2 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: '#393D40',
              }}>
              Search Results for "{searchTerm}"
            </Text>
            {loadingSearch ? (
              <View style={{paddingHorizontal: 12, paddingVertical: 20}}>
                <Text style={{color: '#666', textAlign: 'center'}}>
                  Searching...
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
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
                {searchResults.slice(0, 10).map((item, idx) => (
                  <PlantItemCard
                    key={item.plantCode || idx}
                    data={item}
                    onPress={() => {
                      console.log('Navigate to plant detail:', item.plantCode);
                    }}
                    onAddToCart={() => {
                      console.log('Add to cart:', item.plantCode);
                    }}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={{paddingHorizontal: 12, paddingVertical: 20}}>
                <Text style={{color: '#666', textAlign: 'center'}}>
                  No plants found for "{searchTerm}"
                </Text>
              </View>
            )}
            <View style={{height: 20}} />
          </>
        )}
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0, paddingVertical: 1}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 6,
            alignItems: 'flex-start',
            paddingHorizontal: 9,
          }}>
          {promoBadges.map(badge => (
            <PromoBadge
              key={badge.label}
              icon={badge.icon}
              label={badge.label}
              style={{marginRight: 5}}
            />
          ))}
        </ScrollView>
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
            eventsData.map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                style={{width: 275}}
                onPress={() => {
                  // Handle link navigation if item has a link
                  if (item.link) {
                    Linking.openURL(item.link).catch(err => 
                      console.error('Failed to open link:', err)
                    );
                  }
                }}>
                <Image
                  source={{uri: item.image}}
                  style={{width: 260, height: 120, borderRadius: 16}}
                  resizeMode="cover"
                />
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
            ))
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
            // Show dynamic data from API
            dynamicGenusData.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  width: '30%',
                  marginBottom: 18,
                  alignItems: 'center',
                }}
                onPress={() => onGenusPress(item.genusName)}>
                <Image
                  source={item.src}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    marginBottom: 6,
                  }}
                  resizeMode="cover"
                  onError={() => {
                    console.log(`Failed to load image for ${item.label}`);
                  }}
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
              onPress={() => console.log(item.label)}
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
                }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '900',
            color: '#393D40',
            marginTop: 15,
            marginLeft: 12,
          }}>
          Browse More Plants
        </Text>
        
        {loadingBrowseMorePlants ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
              paddingVertical: 20,
            }}>
            <ActivityIndicator size="large" color="#22B14C" />
          </View>
        ) : browseMorePlants.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
            }}>
            {browseMorePlants.map((plant, idx) => (
              <PlantItemCard
                key={plant.plantCode || plant.id}
                data={plant}
                onAddToCart={() => handleAddToCartFromBrowseMore(plant)}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
              paddingVertical: 20,
            }}>
            <Text style={{color: '#666', textAlign: 'center'}}>
              No recommendations available
            </Text>
          </View>
        )}
        <View style={{width: '100%', alignItems: 'center', marginTop: 15}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.loadMoreText}>Load More</Text>
            <DropDownIcon width={16.5} height={9} />
          </View>
        </View>
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
      />
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingTop: 12,
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
});
export default ScreenShop;
