import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Dimensions,
  Image,
  Alert,
  KeyboardAvoidingView,
  InteractionManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import NetInfo from '@react-native-community/netinfo';
import { getListingTypeApi } from '../../../components/Api/getListingTypeApi';
import { getCountryApi } from '../../../components/Api/dropdownApi';
import { getAllUsersApi } from '../../../components/Api/getAllUsersApi';
import { searchBuyersApi } from '../../../components/Api/searchBuyersApi';
import FlagTH from '../../../assets/country-flags/TH.svg';
import FlagID from '../../../assets/country-flags/ID.svg';
import FlagPH from '../../../assets/country-flags/PH.svg';
import { getAllPlantGenusApi } from '../../../components/Api/dropdownApi';
import { getSpeciesFromListingsApi } from '../../../components/Api/getSpeciesFromListingsApi';
import { updateDiscountApi, getDiscountApi, deleteDiscountApi } from '../../../components/Api/discountApi';

const countryNameToCode = {
  Thailand: 'TH',
  Indonesia: 'ID',
  Philippines: 'PH',
};

const getCountryCode = (label) => {
  const text = (label || '').trim();
  if (/^[A-Z]{2}$/.test(text)) return text;
  return countryNameToCode[text] || null;
};

const renderFlag = (code) => {
  switch (code) {
    case 'TH':
      return <FlagTH width={24} height={16} />;
    case 'ID':
      return <FlagID width={24} height={16} />;
    case 'PH':
      return <FlagPH width={24} height={16} />;
    default:
      return <View style={{width: 24, height: 16, borderRadius: 2, backgroundColor: '#F0F0F0'}} />;
  }
};

const EditDiscount = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const SCREEN = Dimensions.get('window');
  
  // Normalize garden names to avoid duplicates (handles case, spaces, apostrophes)
  const normalizeGardenName = (s) => {
    if (!s && s !== 0) return null;
    try {
      const str = String(s).trim();
      return str.replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'").replace(/\s+/g, ' ').normalize('NFC').toLowerCase();
    } catch (e) {
      return String(s).toLowerCase();
    }
  };
  
  // Get discount type from route params - support: 'buyXGetY', 'amountOffPlantsPercentage', 'eventGift', 'eventGiftFixed', 'freeShipping'
  // Use state so it can be updated when discount data loads
  const [discountTypeParam, setDiscountTypeParam] = React.useState(
    () => route?.params?.discountType || route?.params?.type || 'buyXGetY'
  );
  const [isFixed, setIsFixed] = React.useState(() => route?.params?.mode === 'fixed');
  
  // Store discountId in state to persist even if route params are cleared
  const [storedDiscountId, setStoredDiscountId] = React.useState(() => {
    const initialId = route?.params?.discountId || route?.params?.id;
    console.log('🔍 EditDiscount - Initial discountId from params:', initialId);
    return initialId;
  });
  
  // Update stored discountId when route params change
  React.useEffect(() => {
    const newDiscountId = route?.params?.discountId || route?.params?.id;
    if (newDiscountId && newDiscountId !== storedDiscountId) {
      console.log('🔍 EditDiscount - Updating stored discountId:', newDiscountId);
      setStoredDiscountId(newDiscountId);
    }
    
    if (route?.params && Object.keys(route.params).length > 0) {
      console.log('🔍 EditDiscount - Route params:', JSON.stringify(route.params, null, 2));
    }
  }, [route?.params?.discountId, route?.params?.id]);
  
  // Use stored discountId as the primary source
  const discountId = storedDiscountId;
  
  const [code, setCode] = useState(route?.params?.code || '');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00 AM');
  const [showStartDateSheet, setShowStartDateSheet] = useState(false);
  const [showStartTimeSheet, setShowStartTimeSheet] = useState(false);
  const [tempHour, setTempHour] = useState('00');
  const [tempMinute, setTempMinute] = useState('00');
  const [tempAmPm, setTempAmPm] = useState('AM');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [endDateEnabled, setEndDateEnabled] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('00:00 AM');
  const [showEndDateSheet, setShowEndDateSheet] = useState(false);
  const [showEndTimeSheet, setShowEndTimeSheet] = useState(false);
  const [tempEndHour, setTempEndHour] = useState('00');
  const [tempEndMinute, setTempEndMinute] = useState('00');
  const [tempEndAmPm, setTempEndAmPm] = useState('AM');
  const [endCalendarMonth, setEndCalendarMonth] = useState(() => new Date());
  const [timeKeyboardOffset, setTimeKeyboardOffset] = useState(0);
  const [endTimeKeyboardOffset, setEndTimeKeyboardOffset] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // BuyXGetY specific state
  const [buyQuantity, setBuyQuantity] = useState('');
  const [getQuantity, setGetQuantity] = useState('');
  
  // AmountOffPlantsPercentage specific state
  const [discountType, setDiscountType] = useState(isFixed ? 'Fixed amount' : 'Percentage');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');

  // FreeShipping specific state
  const [freeUpsShipping, setFreeUpsShipping] = useState(false);
  const [freeAirCargo, setFreeAirCargo] = useState(false);

  // Common discount state (Applies to, Eligibility, etc.)
  const [appliesText, setAppliesText] = useState('Specific listing type');
  const [listingTypes, setListingTypes] = useState([]);
  const [selectedListingTypes, setSelectedListingTypes] = useState([]);
  const [showListingTypeSheet, setShowListingTypeSheet] = useState(false);
  const [showAppliesSheet, setShowAppliesSheet] = useState(false);
  const [showGenusSheet, setShowGenusSheet] = useState(false);
  const [genusOptions, setGenusOptions] = useState([]);
  const [selectedGenus, setSelectedGenus] = useState([]);
  const [genusSearch, setGenusSearch] = useState('');
  const [genusLoading, setGenusLoading] = useState(false);
  const [showSpeciesSheet, setShowSpeciesSheet] = useState(false);
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [speciesLoading, setSpeciesLoading] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [countryOptions, setCountryOptions] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [showGardenSheet, setShowGardenSheet] = useState(false);
  const [gardenOptions, setGardenOptions] = useState([]);
  const [gardenSearch, setGardenSearch] = useState('');
  const [selectedGardens, setSelectedGardens] = useState([]);
  const [gardenLoading, setGardenLoading] = useState(false);
  const [selectedListings, setSelectedListings] = useState([]);
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const [showBuyerSheet, setShowBuyerSheet] = useState(false);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [buyerSearch, setBuyerSearch] = useState('');
  const [selectedBuyers, setSelectedBuyers] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const buyerSearchDebounceRef = React.useRef(null);
  const [eligibility, setEligibility] = useState('All customers');
  const [minRequirement, setMinRequirement] = useState('No minimum order requirements');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [minPurchaseQuantity, setMinPurchaseQuantity] = useState('');
  const [limitTotalEnabled, setLimitTotalEnabled] = useState(true);
  const [limitPerCustomerEnabled, setLimitPerCustomerEnabled] = useState(false);
  const [maxUsesTotal, setMaxUsesTotal] = useState('');
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [typeSheetTop, setTypeSheetTop] = useState(0);
  const [appliesSheetTop, setAppliesSheetTop] = useState(0);
  const dropdownRef = React.useRef(null);
  const appliesRef = React.useRef(null);
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(false);

  // Load discount data when component mounts or discountId changes
  useEffect(() => {
    const loadDiscountData = async () => {
      if (!discountId) {
        console.log('⚠️ EditDiscount - No discountId, skipping data load');
        return;
      }

      console.log('📥 EditDiscount - Loading discount data for ID:', discountId);
      setIsLoadingDiscount(true);

      try {
        const result = await getDiscountApi(discountId);
        
        if (!result.success || !result.data) {
          console.error('❌ EditDiscount - Failed to load discount:', result.error);
          Alert.alert('Error', `Failed to load discount: ${result.error || 'Unknown error'}`);
          return;
        }

        const discountData = result.data;
        console.log('✅ EditDiscount - Loaded discount data:', JSON.stringify(discountData, null, 2));

        // Update discount type from loaded data (this ensures correct conditional rendering)
        if (discountData.type) {
          setDiscountTypeParam(discountData.type);
          console.log('📝 EditDiscount - Updated discountTypeParam to:', discountData.type);
          
          // Determine if it's fixed amount based on type
          if (discountData.type === 'amountOffPlantsFixed' || discountData.type === 'eventGiftFixed') {
            setIsFixed(true);
          } else if (discountData.type === 'amountOffPlantsPercentage' || discountData.type === 'eventGift') {
            setIsFixed(false);
          }
        }

        // Populate all fields with loaded data
        setCode(discountData.code || '');
        
        // Start date and time
        if (discountData.startDate) {
          setStartDate(discountData.startDate);
        }
        if (discountData.startTime) {
          setStartTime(discountData.startTime);
          // Parse time to populate tempHour, tempMinute, tempAmPm
          const timeMatch = discountData.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            setTempHour(timeMatch[1].padStart(2, '0'));
            setTempMinute(timeMatch[2]);
            setTempAmPm(timeMatch[3].toUpperCase());
          }
        }
        
        // End date and time
        if (discountData.endDate && discountData.endTime) {
          setEndDateEnabled(true);
          setEndDate(discountData.endDate);
          setEndTime(discountData.endTime);
          const endTimeMatch = discountData.endTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (endTimeMatch) {
            setTempEndHour(endTimeMatch[1].padStart(2, '0'));
            setTempEndMinute(endTimeMatch[2]);
            setTempEndAmPm(endTimeMatch[3].toUpperCase());
          }
        }

        // Discount type specific fields
        console.log('📝 EditDiscount - Setting discount type specific fields. Type:', discountData.type);
        
        if (discountData.type === 'buyXGetY') {
          console.log('📝 EditDiscount - Buy X Get Y:', { buyQuantity: discountData.buyQuantity, getQuantity: discountData.getQuantity });
          if (discountData.buyQuantity !== null && discountData.buyQuantity !== undefined) {
            setBuyQuantity(discountData.buyQuantity.toString());
          }
          if (discountData.getQuantity !== null && discountData.getQuantity !== undefined) {
            setGetQuantity(discountData.getQuantity.toString());
          }
        } else if (discountData.type === 'amountOffPlantsPercentage' || discountData.type === 'amountOffPlantsFixed') {
          console.log('📝 EditDiscount - Amount Off Plants:', { 
            discountPercent: discountData.discountPercent, 
            discountAmount: discountData.discountAmount,
            maxDiscount: discountData.maxDiscount 
          });
          
          if (discountData.type === 'amountOffPlantsFixed') {
            // Fixed amount
            setDiscountType('Fixed amount');
            if (discountData.discountAmount !== null && discountData.discountAmount !== undefined) {
              setDiscountPercent(discountData.discountAmount.toString());
              console.log('📝 EditDiscount - Set discountPercent (fixed amount):', discountData.discountAmount.toString());
            } else if (discountData.discountPercent !== null && discountData.discountPercent !== undefined) {
              // Fallback: if discountAmount is missing but discountPercent exists, use it
              setDiscountPercent(discountData.discountPercent.toString());
              console.log('📝 EditDiscount - Set discountPercent (fallback for fixed):', discountData.discountPercent.toString());
            }
          } else {
            // Percentage
            setDiscountType('Percentage');
            if (discountData.discountPercent !== null && discountData.discountPercent !== undefined) {
              setDiscountPercent(discountData.discountPercent.toString());
              console.log('📝 EditDiscount - Set discountPercent (percentage):', discountData.discountPercent.toString());
            }
          }
          
          if (discountData.maxDiscount !== null && discountData.maxDiscount !== undefined) {
            setMaxDiscount(discountData.maxDiscount.toString());
            console.log('📝 EditDiscount - Set maxDiscount:', discountData.maxDiscount.toString());
          }
        } else if (discountData.type === 'eventGift' || discountData.type === 'eventGiftFixed') {
          console.log('📝 EditDiscount - Event Gift:', { 
            type: discountData.type,
            discountPercent: discountData.discountPercent,
            discountAmount: discountData.discountAmount,
            maxDiscount: discountData.maxDiscount 
          });
          
          if (discountData.type === 'eventGiftFixed') {
            // Fixed amount
            setDiscountType('Fixed amount');
            if (discountData.discountAmount !== null && discountData.discountAmount !== undefined) {
              setDiscountPercent(discountData.discountAmount.toString());
              console.log('📝 EditDiscount - Set discountPercent (event gift fixed amount):', discountData.discountAmount.toString());
            } else if (discountData.discountPercent !== null && discountData.discountPercent !== undefined) {
              // Fallback: if discountAmount is missing but discountPercent exists, use it
              setDiscountPercent(discountData.discountPercent.toString());
              console.log('📝 EditDiscount - Set discountPercent (fallback for event gift fixed):', discountData.discountPercent.toString());
            }
          } else {
            // Percentage
            setDiscountType('Percentage');
            if (discountData.discountPercent !== null && discountData.discountPercent !== undefined) {
              setDiscountPercent(discountData.discountPercent.toString());
              console.log('📝 EditDiscount - Set discountPercent (event gift percentage):', discountData.discountPercent.toString());
            }
          }
          
          if (discountData.maxDiscount !== null && discountData.maxDiscount !== undefined) {
            setMaxDiscount(discountData.maxDiscount.toString());
            console.log('📝 EditDiscount - Set maxDiscount (event gift):', discountData.maxDiscount.toString());
          }
        }

        // Applies to
        if (discountData.appliesTo) {
          setAppliesText(discountData.appliesTo);
          
          if (discountData.appliesTo === 'Specific listing type' && discountData.listingTypes) {
            setSelectedListingTypes(discountData.listingTypes || []);
          }
          if (discountData.appliesTo === 'Specific genus' && discountData.genus) {
            setSelectedGenus(discountData.genus || []);
          }
          if (discountData.appliesTo === 'Specific specie' && discountData.species) {
            setSelectedSpecies(discountData.species || []);
            console.log('✅ EditDiscount - Loaded species:', discountData.species);
          }
          if (discountData.appliesTo === 'Specific country' && discountData.countries) {
            setSelectedCountries(discountData.countries || []);
          }
          if (discountData.appliesTo === 'Specific garden' && discountData.gardens) {
            // Gardens might be IDs or null, filter out nulls and convert to array format if needed
            const validGardens = discountData.gardens
              .filter(g => g != null) // Filter out null/undefined values
              .map(g => typeof g === 'string' ? { id: g, name: g } : (g && typeof g === 'object' ? g : { id: g, name: String(g) }));
            setSelectedGardens(validGardens);
            console.log('✅ EditDiscount - Loaded gardens:', validGardens);
          }
          if (discountData.appliesTo === 'Specific listing' && discountData.listingIds) {
            // Listing IDs, convert to array format if needed
            setSelectedListings(discountData.listingIds.map(id => typeof id === 'string' ? { id } : id) || []);
          }
        }

        // Eligibility
        if (discountData.eligibility) {
          setEligibility(discountData.eligibility);
          if (discountData.eligibility === 'Specific customers' && discountData.buyerIds) {
            // Load buyer IDs - we'll need to fetch buyer details separately if needed
            setSelectedBuyers(discountData.buyerIds.map(id => typeof id === 'string' ? { id } : id) || []);
          }
        }

        // Minimum requirement
        if (discountData.minRequirement) {
          setMinRequirement(discountData.minRequirement);
          
          // Extract values from minRequirement if it contains them
          // Check if minRequirement contains an amount (e.g., "Minimum purchase amount of $50.00")
          if (discountData.minRequirement.includes('Minimum purchase amount')) {
            const amountMatch = discountData.minRequirement.match(/\$([\d.]+)/);
            if (amountMatch && amountMatch[1]) {
              setMinPurchaseAmount(amountMatch[1]);
            }
          }
          // Check if minRequirement contains a quantity (e.g., "Minimum quantity of 10 plants")
          if (discountData.minRequirement.includes('Minimum quantity of plants')) {
            const quantityMatch = discountData.minRequirement.match(/(\d+)\s*plants?/i);
            if (quantityMatch && quantityMatch[1]) {
              setMinPurchaseQuantity(quantityMatch[1]);
            }
          }
        }
        
        // Also check for separate fields if they exist in the future
        if (discountData.minPurchaseAmount !== null && discountData.minPurchaseAmount !== undefined) {
          setMinPurchaseAmount(discountData.minPurchaseAmount.toString());
        }
        if (discountData.minPurchaseQuantity !== null && discountData.minPurchaseQuantity !== undefined) {
          setMinPurchaseQuantity(discountData.minPurchaseQuantity.toString());
        }

        // Usage limits
        if (discountData.limitTotal !== undefined) {
          setLimitTotalEnabled(discountData.limitTotal);
        }
        if (discountData.limitPerCustomer !== undefined) {
          setLimitPerCustomerEnabled(discountData.limitPerCustomer);
        }
        if (discountData.maxUsesTotal !== null && discountData.maxUsesTotal !== undefined) {
          setMaxUsesTotal(discountData.maxUsesTotal.toString());
        }

        console.log('✅ EditDiscount - All fields populated successfully');
      } catch (error) {
        console.error('❌ EditDiscount - Error loading discount:', error);
        Alert.alert('Error', `Failed to load discount: ${error.message}`);
      } finally {
        setIsLoadingDiscount(false);
      }
    };

    loadDiscountData();
  }, [discountId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      if (!showStartTimeSheet) return;
      const kbHeight = e?.endCoordinates?.height || 0;
      setTimeKeyboardOffset(Math.min(kbHeight, 260));
    };
    const onHide = () => setTimeKeyboardOffset(0);
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow?.remove?.();
      subHide?.remove?.();
    };
  }, [showStartTimeSheet]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      if (!showEndTimeSheet) return;
      const kbHeight = e?.endCoordinates?.height || 0;
      setEndTimeKeyboardOffset(Math.min(kbHeight, 260));
    };
    const onHide = () => setEndTimeKeyboardOffset(0);
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow?.remove?.();
      subHide?.remove?.();
    };
  }, [showEndTimeSheet]);

  // Listen for selected listings when returning from SelectListingScreen
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params;
      if (params?.selectedListingsResult) {
        setSelectedListings(params.selectedListingsResult);
        // Clear the result to prevent re-applying on next focus
        navigation.setParams({ selectedListingsResult: undefined });
      }
    }, [route.params, navigation])
  );

  // Load listing types
  useEffect(() => {
    const loadListingTypes = async () => {
      try {
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) return;
        const res = await getListingTypeApi();
        if (res?.success && Array.isArray(res.data)) {
          setListingTypes(res.data.map(item => item.name).filter(Boolean));
        }
      } catch (e) {
        // silent fail
      }
    };
    loadListingTypes();
  }, []);

  // Load genus when sheet opens
  useEffect(() => {
    const loadGenus = async () => {
      if (!showGenusSheet) return;
      try {
        setGenusLoading(true);
        // Reset search when modal opens
        setGenusSearch('');
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) {
          setGenusLoading(false);
          return;
        }
        const res = await getAllPlantGenusApi();
        // Handle different response formats:
        // 1. { success: true, data: ['genus1', 'genus2', ...] } - array of strings
        // 2. { success: true, data: [{ name: 'genus1' }, ...] } - array of objects
        if (res?.success && Array.isArray(res.data)) {
          const genusList = res.data.map(item => {
            if (typeof item === 'string') {
              return item;
            } else if (item && typeof item === 'object') {
              return item.name || item.genus_name || item.genusName || item.genus || '';
            }
            return '';
          }).filter(Boolean);
          setGenusOptions(genusList.sort((a, b) => a.localeCompare(b)));
        } else {
          setGenusOptions([]);
        }
      } catch (e) {
        console.error('Failed to load genus:', e);
        setGenusOptions([]);
      } finally {
        setGenusLoading(false);
      }
    };
    loadGenus();
  }, [showGenusSheet]);

  useEffect(() => {
    if (!showSpeciesSheet) return;
    
    // Reset search immediately when modal opens
    setSpeciesSearch('');
    
    // Defer API call to allow modal to render first
    const interaction = InteractionManager.runAfterInteractions(() => {
      const loadSpecies = async () => {
        try {
          setSpeciesLoading(true);
          const net = await NetInfo.fetch();
          if (!net.isConnected || !net.isInternetReachable) {
            setSpeciesLoading(false);
            return;
          }
          const res = await getSpeciesFromListingsApi();
          if (res?.success && Array.isArray(res.data)) {
            // The new API returns a simple array of species names (already deduplicated)
            // Just filter out empty strings and sort
            const speciesList = res.data
              .filter(s => s && typeof s === 'string' && s.trim().length > 0)
              .map(s => s.trim());
            setSpeciesOptions(speciesList.sort((a, b) => a.localeCompare(b)));
          } else {
            setSpeciesOptions([]);
          }
        } catch (e) {
          console.error('Failed to load species:', e);
          setSpeciesOptions([]);
        } finally {
          setSpeciesLoading(false);
        }
      };
      loadSpecies();
    });
    
    return () => {
      interaction.cancel();
    };
  }, [showSpeciesSheet]);

  // Load countries when sheet opens
  useEffect(() => {
    const loadCountries = async () => {
      if (!showCountrySheet) return;
      try {
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) return;
        const res = await getCountryApi();
        if (res?.success && Array.isArray(res.data)) {
          const names = res.data
            .map(item => (typeof item === 'string' ? item : item?.name))
            .filter(Boolean);
          setCountryOptions(names);
        } else {
          setCountryOptions([]);
        }
      } catch (e) {
        setCountryOptions([]);
      }
    };
    loadCountries();
  }, [showCountrySheet]);

  // Load gardens when sheet opens
  useEffect(() => {
    const loadGardens = async () => {
      if (!showGardenSheet) return;
      
      // If gardens are already loaded, don't reload
      if (gardenOptions.length > 0) {
        return;
      }
      
      try {
        setGardenLoading(true);
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) return;
        
        // Create a map to store unique gardens with their seller info (using normalized keys)
        const gardenMap = new Map();
        
        // FIRST: Fetch all suppliers to get gardens with complete seller info
        try {
          let allSuppliers = [];
          let currentPage = 1;
          let hasMore = true;
          
          while (hasMore) {
            const suppliersResp = await getAllUsersApi({ role: 'supplier', limit: 100, page: currentPage });
            const suppliers = suppliersResp?.data?.users || suppliersResp?.users || [];
            allSuppliers.push(...suppliers);
            
            // Check if there are more pages
            const pagination = suppliersResp?.data?.pagination;
            hasMore = pagination && currentPage < pagination.totalPages;
            
            if (hasMore) {
              currentPage++;
            }
          }
          
          // Build garden map from suppliers (primary source with complete seller info)
          // First pass: add all unique gardens
          allSuppliers.forEach(supplier => {
            const gardenName = supplier?.gardenOrCompanyName || supplier?.gardenName || supplier?.companyName;
            if (!gardenName) return;
            
            const normalizedName = normalizeGardenName(gardenName);
            if (normalizedName && !gardenMap.has(normalizedName)) {
              const sellerName = `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim();
              const sellerUsername = supplier.email || supplier.username || '';
              const sellerAvatar = supplier.profileImage || supplier.avatar || '';
              
              gardenMap.set(normalizedName, {
                name: String(gardenName),
                sellerName: sellerName || 'Unknown Seller',
                sellerUsername: sellerUsername,
                sellerAvatar: sellerAvatar,
              });
            }
          });
          
          // Second pass: fill in missing profile images or seller info
          allSuppliers.forEach(supplier => {
            const gardenName = supplier?.gardenOrCompanyName || supplier?.gardenName || supplier?.companyName;
            if (!gardenName) return;
            
            const normalizedName = normalizeGardenName(gardenName);
            if (!normalizedName || !gardenMap.has(normalizedName)) return;
            
            const existing = gardenMap.get(normalizedName);
            const sellerAvatar = supplier.profileImage || supplier.avatar || '';
            
            // Update if we have a profile image but existing doesn't
            if (sellerAvatar && !existing.sellerAvatar) {
              const sellerName = `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim();
              const sellerUsername = supplier.email || supplier.username || '';
              
              gardenMap.set(normalizedName, {
                ...existing,
                sellerName: sellerName || existing.sellerName || 'Unknown Seller',
                sellerUsername: sellerUsername || existing.sellerUsername,
                sellerAvatar: sellerAvatar,
              });
            }
          });
        } catch (supplierError) {
          console.warn('Failed to fetch suppliers:', supplierError);
        }
        
        setGardenOptions(Array.from(gardenMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) {
        setGardenOptions([]);
      } finally {
        setGardenLoading(false);
      }
    };
    loadGardens();
  }, [showGardenSheet, gardenOptions.length]);

  // Initial buyer load when modal opens
  useEffect(() => {
    const loadBuyers = async () => {
    if (!showBuyerSheet) return;
      try {
        setBuyerLoading(true);
        // Clear search when modal opens (only if it was previously set)
        if (buyerSearch.trim().length > 0) {
          setBuyerSearch('');
        }
        
        // Fetch all buyers using pagination
        let allBuyers = [];
        let page = 1;
        const limit = 100; // Max limit per API
        let hasMore = true;
        
        while (hasMore) {
          // Try fetching buyers directly; fallback to all users and filter locally
          const res = await getAllUsersApi({ role: 'buyer', limit, page });
          const list =
            (Array.isArray(res?.data?.users) && res.data.users) ||
            (Array.isArray(res?.data) && res.data) ||
            (Array.isArray(res?.results) && res.results) ||
            (Array.isArray(res?.users) && res.users) ||
            [];
          
          if (list.length === 0 && page === 1) {
            // If no results with role filter on first page, try without role filter
            // Continue fetching all pages without role filter and filter locally
            let allPage = 1;
            let allHasMore = true;
            
            while (allHasMore) {
              const resAll = await getAllUsersApi({ limit, page: allPage });
              const listAll =
                (Array.isArray(resAll?.data?.users) && resAll.data.users) ||
                (Array.isArray(resAll?.data) && resAll.data) ||
                (Array.isArray(resAll?.results) && resAll.results) ||
                (Array.isArray(resAll?.users) && resAll.users) ||
                [];
              
              const normalized = listAll.map(b => ({
                id: b.id || b.userId || b.uid,
                name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
                firstName: b.firstName || '',
                lastName: b.lastName || '',
                username: b.username || b.email || '',
                avatar: b.profileImage || b.avatarUrl || null,
                rawRole: (b.role || b.rawRole || '').toString().toLowerCase(),
              })).filter(x => x.id && (x.rawRole === 'buyer' || x.rawRole === 'buyers'));
              
              allBuyers.push(...normalized);
              
              // Check if there are more pages
              const pagination = resAll?.data?.pagination || resAll?.pagination;
              allHasMore = pagination ? allPage < pagination.totalPages : listAll.length === limit;
              
              if (allHasMore) {
                allPage++;
              }
            }
            hasMore = false; // Stop the main loop since we've fetched all
          } else if (list.length === 0) {
            hasMore = false; // No more results
          } else {
            const normalized = list.map(b => ({
              id: b.id || b.userId || b.uid,
              name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
              firstName: b.firstName || '',
              lastName: b.lastName || '',
              username: b.username || b.email || '',
              avatar: b.profileImage || b.avatarUrl || null,
              rawRole: (b.role || b.rawRole || '').toString().toLowerCase(),
            })).filter(x => x.id);
            
            allBuyers.push(...normalized);
            
            // Check if there are more pages
            const pagination = res?.data?.pagination || res?.pagination;
            hasMore = pagination ? page < pagination.totalPages : list.length === limit;
          }
          
          if (hasMore) {
            page++;
          }
        }
        
        // Remove duplicates based on ID
        const uniqueBuyers = Array.from(new Map(allBuyers.map(b => [b.id, b])).values());
        // Sort buyers alphabetically by name (firstName + lastName, or name, or username)
        const sortedBuyers = uniqueBuyers.sort((a, b) => {
          const nameA = (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.name || a.username || '').toLowerCase();
          const nameB = (b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : b.name || b.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setBuyerOptions(sortedBuyers);
      } catch (e) {
        console.error('Failed to load buyers:', e);
        setBuyerOptions([]);
      } finally {
        setBuyerLoading(false);
      }
    };
    loadBuyers();
  }, [showBuyerSheet]);

  // Buyer search with debounce
  useEffect(() => {
    if (!showBuyerSheet) {
      // Clear search when modal closes
      setBuyerSearch('');
      return;
    }
    const q = buyerSearch.trim();
    
    // Don't run search effect if search is empty and we haven't loaded initial data yet
    // This prevents clearing the list when modal first opens
    // Also skip if we're still loading (initial load might be in progress)
    if (q.length === 0 && (buyerOptions.length === 0 || buyerLoading)) {
      return;
    }
    
    if (buyerSearchDebounceRef.current) {
      clearTimeout(buyerSearchDebounceRef.current);
    }
    buyerSearchDebounceRef.current = setTimeout(async () => {
      try {
        if (q.length >= 2) {
          setBuyerLoading(true);
          const net = await NetInfo.fetch();
          if (!net.isConnected || !net.isInternetReachable) {
            throw new Error('No internet connection.');
          }
          const res = await searchBuyersApi({ query: q, limit: 50, offset: 0 });
          if (!res?.success) {
            throw new Error(res?.error || 'Failed to search buyers.');
          }
          const buyers = res.data?.buyers || [];
          const normalized = buyers.map(b => ({
            id: b.id || b.userId || b.uid,
            name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
            firstName: b.firstName || '',
            lastName: b.lastName || '',
            username: b.username || b.email || '',
            avatar: b.profileImage || b.avatarUrl || null,
          }));
          // Sort buyers alphabetically by name
          const sortedBuyers = normalized.sort((a, b) => {
            const nameA = (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.name || a.username || '').toLowerCase();
            const nameB = (b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : b.name || b.username || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setBuyerOptions(sortedBuyers);
        } else if (q.length === 0) {
          // When search is cleared, reload the initial buyer list
          setBuyerLoading(true);
          const res = await getAllUsersApi({ role: 'buyer', limit: 50 });
          const list =
            (Array.isArray(res?.data?.users) && res.data.users) ||
            (Array.isArray(res?.data) && res.data) ||
            (Array.isArray(res?.results) && res.results) ||
            (Array.isArray(res?.users) && res.users) ||
            [];
          let normalized = list.map(b => ({
            id: b.id || b.userId || b.uid,
            name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
            firstName: b.firstName || '',
            lastName: b.lastName || '',
            username: b.username || b.email || '',
            avatar: b.profileImage || b.avatarUrl || null,
            rawRole: (b.role || b.rawRole || '').toString().toLowerCase(),
          })).filter(x => x.id);
          // If API didn't filter by role server-side, enforce buyer-only here
          if (!normalized.length) {
            const resAll = await getAllUsersApi({ limit: 50 });
            const listAll =
              (Array.isArray(resAll?.data?.users) && resAll.data.users) ||
              (Array.isArray(resAll?.data) && resAll.data) ||
              (Array.isArray(resAll?.results) && resAll.results) ||
              (Array.isArray(resAll?.users) && resAll.users) ||
              [];
            normalized = listAll.map(b => ({
              id: b.id || b.userId || b.uid,
              name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
              firstName: b.firstName || '',
              lastName: b.lastName || '',
              username: b.username || b.email || '',
              avatar: b.profileImage || b.avatarUrl || null,
              rawRole: (b.role || b.rawRole || '').toString().toLowerCase(),
            })).filter(x => x.id && (x.rawRole === 'buyer' || x.rawRole === 'buyers'));
          }
          // Sort buyers alphabetically by name
          const sortedBuyers = normalized.sort((a, b) => {
            const nameA = (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.name || a.username || '').toLowerCase();
            const nameB = (b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : b.name || b.username || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setBuyerOptions(sortedBuyers);
          setBuyerLoading(false);
        }
      } catch (error) {
        console.error('Buyer search error:', error);
        // Don't clear options on error, keep existing list
        setBuyerLoading(false);
      } finally {
        if (q.length >= 2) {
        setBuyerLoading(false);
        }
      }
    }, 300);
    return () => {
      if (buyerSearchDebounceRef.current) {
        clearTimeout(buyerSearchDebounceRef.current);
      }
    };
  }, [buyerSearch, showBuyerSheet, buyerOptions.length]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed');
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              console.warn('Cannot go back - navigating to AdminDiscounts');
              navigation.navigate('AdminDiscounts');
            }
          }} 
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.5303 3.96967C15.8232 4.26256 15.8232 4.73744 15.5303 5.03033L8.56066 12L15.5303 18.9697C15.8232 19.2626 15.8232 19.7374 15.5303 20.0303C15.2374 20.3232 14.7626 20.3232 14.4697 20.0303L6.96967 12.5303C6.67678 12.2374 6.67678 11.7626 6.96967 11.4697L14.4697 3.96967C14.7626 3.67678 15.2374 3.67678 15.5303 3.96967Z"
              fill="#393D40"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Discount</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteModal(true)}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.15901 2.15901C8.58097 1.73705 9.15326 1.5 9.75 1.5H14.25C14.8467 1.5 15.419 1.73705 15.841 2.15901C16.2629 2.58097 16.5 3.15326 16.5 3.75V4.5H20.25C20.6642 4.5 21 4.83579 21 5.25C21 5.66421 20.6642 6 20.25 6H19.5V19.5C19.5 19.8978 19.342 20.2794 19.0607 20.5607C18.7794 20.842 18.3978 21 18 21H6C5.60218 21 5.22065 20.842 4.93934 20.5607C4.65804 20.2794 4.5 19.8978 4.5 19.5V6H3.75C3.33579 6 3 5.66421 3 5.25C3 4.83579 3.33579 4.5 3.75 4.5H7.5V3.75C7.5 3.15326 7.73705 2.58097 8.15901 2.15901ZM6 6V19.5H18V6H6ZM15 4.5H9V3.75C9 3.55109 9.07902 3.36032 9.21967 3.21967C9.36032 3.07902 9.55109 3 9.75 3H14.25C14.4489 3 14.6397 3.07902 14.7803 3.21967C14.921 3.36032 15 3.55109 15 3.75V4.5ZM9.75 9C10.1642 9 10.5 9.33579 10.5 9.75V15.75C10.5 16.1642 10.1642 16.5 9.75 16.5C9.33579 16.5 9 16.1642 9 15.75V9.75C9 9.33579 9.33579 9 9.75 9ZM13.5 9.75C13.5 9.33579 13.8358 9 14.25 9C14.6642 9 15 9.33579 15 9.75V15.75C15 16.1642 14.6642 16.5 14.25 16.5C13.8358 16.5 13.5 16.1642 13.5 15.75V9.75Z"
                fill="#556065"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Code */}
        <View style={styles.codeSection}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Discount code<Text style={styles.reqAsterisk}>*</Text></Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor="#647276"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.helper}>This is the code buyers will enter at checkout</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerStrip}>
          <View style={styles.divider} />
        </View>

        {/* Discount Type Specific Content */}
        {discountTypeParam === 'buyXGetY' && (
          <>
            {/* Buy quantity */}
            <View style={styles.sectionPad}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Customer spends<Text style={styles.reqAsterisk}>*</Text></Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    placeholderTextColor="#647276"
                    keyboardType="number-pad"
                    value={buyQuantity}
                    onChangeText={setBuyQuantity}
                  />
                </View>
                <Text style={styles.helper}>Minimum quantity of plants</Text>
              </View>
            </View>
            
            {/* Get quantity */}
            <View style={styles.sectionPad}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Customer gets<Text style={styles.reqAsterisk}>*</Text></Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1"
                    placeholderTextColor="#647276"
                    keyboardType="number-pad"
                    value={getQuantity}
                    onChangeText={setGetQuantity}
                  />
                </View>
                <Text style={styles.helper}>Quantity of plants</Text>
              </View>
            </View>
            <View style={styles.dividerStrip} />
          </>
        )}

        {(discountTypeParam === 'amountOffPlantsPercentage' || discountTypeParam === 'amountOffPlantsFixed' || discountTypeParam === 'eventGift' || discountTypeParam === 'eventGiftFixed') && (
          <>
            {/* Discount type */}
            <View style={styles.sectionPad}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Discount type<Text style={styles.reqAsterisk}>*</Text></Text>
                <TouchableOpacity
                  ref={dropdownRef}
                  style={[styles.inputRow, {borderColor: '#647276'}]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (dropdownRef.current && dropdownRef.current.measureInWindow) {
                      dropdownRef.current.measureInWindow((x, y, w, h) => {
                        const desiredTop = y + h + 6;
                        const maxTop = SCREEN.height - 121 - 16;
                        setTypeSheetTop(Math.min(desiredTop, maxTop));
                        setShowTypeSheet(true);
                      });
                    } else {
                      setShowTypeSheet(true);
                    }
                  }}>
                  <Text style={[styles.inputValue, !discountType && {color: '#647276'}]}>{discountType || 'Select...'}</Text>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M5.46967 9.46967C5.76256 9.17678 6.23744 9.17678 6.53033 9.46967L12 14.9393L17.4697 9.46967C17.7626 9.17678 18.2376 9.17678 18.5305 9.46967C18.8233 9.76256 18.8233 10.2374 18.5305 10.5303L12.5305 16.5303C12.2376 16.8232 11.7628 16.8232 11.4699 16.5303L5.46967 10.5303C5.17678 10.2374 5.17678 9.76256 5.46967 9.46967Z" fill="#202325"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.dividerStrip} />

            {/* Discount value */}
            <View style={styles.sectionPad}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Discount value<Text style={styles.reqAsterisk}>*</Text></Text>
                <View style={{flexDirection: 'row'}}>
                  <View style={[styles.inputRow, {flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0}]}> 
                    <TextInput
                      style={styles.input}
                      placeholder="00"
                      placeholderTextColor="#647276"
                      keyboardType="numeric"
                      value={discountPercent}
                      onChangeText={setDiscountPercent}
                    />
                  </View>
                  <View style={styles.suffixBox}> 
                    <Text style={styles.suffixText}>{discountType === 'Fixed amount' ? '$OFF' : '%OFF'}</Text>
                  </View>
                </View>
              </View>
            </View>
            {discountType === 'Percentage' && (
              <View style={styles.sectionPad}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Maximum discount value<Text style={styles.reqAsterisk}>*</Text></Text>
                  <View style={{flexDirection: 'row'}}>
                    <View style={styles.prefixBox}><Text style={styles.suffixText}>$</Text></View>
                    <View style={[styles.inputRow, {flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0}]}> 
                      <TextInput
                        style={styles.input}
                        placeholder="00"
                        placeholderTextColor="#647276"
                        keyboardType="numeric"
                        value={maxDiscount}
                        onChangeText={setMaxDiscount}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
            <View style={styles.dividerStrip} />
          </>
        )}
        
        {/* Applies to - Common for all types */}
        <View style={styles.sectionPad}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Applies to<Text style={styles.reqAsterisk}>*</Text></Text>
            <TouchableOpacity
              ref={appliesRef}
              style={[styles.inputRow, {borderColor: '#647276'}]}
              activeOpacity={0.7}
              onPress={() => {
                if (appliesRef.current && appliesRef.current.measureInWindow) {
                  appliesRef.current.measureInWindow((x, y, w, h) => {
                    const desiredTop = y + h + 6;
                    const maxTop = SCREEN.height - 268 - 16;
                    setAppliesSheetTop(Math.min(desiredTop, maxTop));
                    setShowAppliesSheet(true);
                  });
                } else {
                  setShowAppliesSheet(true);
                }
              }}>
              <Text style={styles.inputValue}>{appliesText}</Text>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path fillRule="evenodd" clipRule="evenodd" d="M5.46967 9.46967C5.76256 9.17678 6.23744 9.17678 6.53033 9.46967L12 14.9393L17.4697 9.46967C17.7626 9.17678 18.2376 9.17678 18.5305 9.46967C18.8233 9.76256 18.8233 10.2374 18.5305 10.5303L12.5305 16.5303C12.2376 16.8232 11.7628 16.8232 11.4699 16.5303L5.46967 10.5303C5.17678 10.2374 5.17678 9.76256 5.46967 9.46967Z" fill="#202325"/>
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                if (appliesText === 'Specific genus') setShowGenusSheet(true);
                else if (appliesText === 'Specific specie') setShowSpeciesSheet(true);
                else if (appliesText === 'Specific country') setShowCountrySheet(true);
                else if (appliesText === 'Specific garden') setShowGardenSheet(true);
                else if (appliesText === 'Specific listing') {
                  navigation.navigate('AdminDiscountSelectListing', {
                    selectedListings,
                    returnScreenName: route.name,
                  });
                } else setShowListingTypeSheet(true);
              }}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path fillRule="evenodd" clipRule="evenodd" d="M12 3C12.4142 3 12.75 3.33579 12.75 3.75V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H12.75V20.25C12.75 20.6642 12.4142 21 12 21C11.5858 21 11.25 20.6642 11.25 20.25V12.75H3.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25H11.25V3.75C11.25 3.33579 11.5858 3 12 3Z" fill="#FFFFFF"/>
              </Svg>
              <Text style={styles.secondaryBtnText}>
                {appliesText === 'Specific genus' ? 'Add genus' : appliesText === 'Specific specie' ? 'Add specie' : appliesText === 'Specific country' ? 'Add country' : appliesText === 'Specific garden' ? 'Add garden' : appliesText === 'Specific listing' ? 'Add listing' : 'Add listing type'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {!!selectedListingTypes.length && appliesText === 'Specific listing type' && (
          <View style={styles.appliesListWrap}>
            {selectedListingTypes.map((lt, idx) => (
              <View key={`${lt}-${idx}`} style={styles.appliesCard}>
                <Text style={styles.appliesCardText}>{lt}</Text>
                <TouchableOpacity onPress={() => setSelectedListingTypes(prev => prev.filter(item => item !== lt))}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {!!selectedGenus.length && appliesText === 'Specific genus' && (
          <View style={styles.appliesListWrap}>
            {selectedGenus.map((g, idx) => (
              <View key={`${g}-${idx}`} style={styles.appliesCard}>
                <Text style={styles.appliesCardText}>{g}</Text>
                <TouchableOpacity onPress={() => setSelectedGenus(prev => prev.filter(item => item !== g))}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {!!selectedSpecies.length && appliesText === 'Specific specie' && (
          <View style={styles.appliesListWrap}>
            {selectedSpecies.map((s, idx) => (
              <View key={`${s}-${idx}`} style={styles.appliesCard}>
                <Text style={styles.appliesCardText}>{s}</Text>
                <TouchableOpacity onPress={() => setSelectedSpecies(prev => prev.filter(item => item !== s))}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {!!selectedGardens.length && appliesText === 'Specific garden' && (
          <View style={styles.appliesListWrap}>
            {selectedGardens
              .filter(garden => garden != null) // Filter out any null values
              .map((garden, idx, filteredList) => {
                // Ensure garden has required properties
                const gardenName = garden?.name || garden?.id || 'Unknown Garden';
                const gardenSellerName = garden?.sellerName || '';
                const gardenSellerAvatar = garden?.sellerAvatar || '';
                
                return (
                  <View key={`${gardenName}-${idx}`} style={[styles.appliesCard, filteredList.length > 1 && idx < filteredList.length - 1 && {marginBottom: 8}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                      {gardenSellerAvatar ? (
                        <Image source={{uri: gardenSellerAvatar}} style={{width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#539461', marginRight: 8}} />
                      ) : (
                        <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#48A7F8', borderWidth: 1, borderColor: '#539461', alignItems: 'center', justifyContent: 'center', marginRight: 8}}>
                          <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF'}}>
                            {(gardenSellerName || gardenName || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{flex: 1}}>
                        <Text style={styles.appliesCardText}>{gardenName}</Text>
                        {gardenSellerName && (
                          <Text style={{fontFamily: 'Inter', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#647276', marginTop: 2}}>{gardenSellerName}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedGardens(prev => prev.filter(item => (item?.name || item?.id) !== (garden?.name || garden?.id)))}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                      </Svg>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}
        {!!selectedCountries.length && appliesText === 'Specific country' && (
          <View style={styles.appliesListWrap}>
            {selectedCountries.map((c, idx) => (
              <View key={`${c}-${idx}`} style={styles.appliesCard}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  {renderFlag(getCountryCode(c))}
                  <Text style={styles.appliesCardText}>{c}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCountries(prev => prev.filter(item => item !== c))}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {!!selectedListings.length && appliesText === 'Specific listing' && (
          <View style={styles.appliesListWrapListings}>
            {selectedListings.map((listing, idx) => {
              // Handle case where listing might only be an ID (from loaded discount data)
              if (!listing || (listing.id && typeof listing === 'object' && Object.keys(listing).length === 1)) {
                // Listing has only ID, show minimal info
                return (
                  <View key={`${listing?.id || idx}-${idx}`} style={styles.listingCardFull}>
                    <Text style={styles.plantCodeFull}>
                      {listing?.id ? `Listing ID: ${listing.id}` : 'Loading listing details...'}
                    </Text>
                  </View>
                );
              }

              const v0 = listing.variations && listing.variations.length ? listing.variations[0] : {};
              const imageUri = listing.imagePrimary || listing.image || v0.imagePrimary || v0.image;
              const plantCode = listing.plantCode || '';
              const countryCode = listing.country || v0.country || '';
              const genus = listing.genus || '';
              const species = listing.species || '';
              const variegation = listing.variegation || v0.variegation || '';
              const size = listing.potSize || v0.potSize || '';
              const listingType = listing.listingType || v0.listingType || '';
              const discountPercent = listing.discountPercent || v0.discountPercent;
              const price = listing.usdPrice ?? v0.usdPrice ?? 0;
              const originalPrice = listing.originalPrice || v0.originalPrice;
              // Handle seller data - can be string or object, but may be null
              const sellerData = listing.seller || listing.sellerInfo || listing.user || null;
              let sellerName = '';
              let sellerUsername = '';
              let sellerAvatar = '';
              
              if (typeof sellerData === 'string') {
                sellerName = sellerData;
                sellerUsername = (listing && listing.sellerUsername) ? listing.sellerUsername : (listing && listing.sellerEmail) ? listing.sellerEmail : (listing && listing.username) ? listing.username : '';
              } else if (sellerData && typeof sellerData === 'object' && !Array.isArray(sellerData)) {
                sellerName = sellerData.name || 
                            sellerData.firstName || 
                            sellerData.fullName || 
                            (sellerData.firstName && sellerData.lastName ? `${sellerData.firstName} ${sellerData.lastName}` : '') ||
                            (listing && listing.sellerName) ? listing.sellerName : '' || 
                            (listing && listing.gardenOrCompanyName) ? listing.gardenOrCompanyName : '' ||
                            '';
                sellerUsername = sellerData.username || 
                                sellerData.email || 
                                (listing && listing.sellerUsername) ? listing.sellerUsername : '' || 
                                (listing && listing.sellerEmail) ? listing.sellerEmail : '' ||
                                (listing && listing.username) ? listing.username : '' ||
                                '';
                sellerAvatar = sellerData.avatar || 
                              sellerData.profileImage || 
                              sellerData.profilePicture ||
                              (listing && listing.sellerAvatar) ? listing.sellerAvatar : '' ||
                              '';
              } else {
                sellerName = (listing && listing.sellerName) ? listing.sellerName : '' || (listing && listing.gardenOrCompanyName) ? listing.gardenOrCompanyName : '' || (listing && listing.garden) ? listing.garden : '';
                sellerUsername = (listing && listing.sellerUsername) ? listing.sellerUsername : '' || (listing && listing.sellerEmail) ? listing.sellerEmail : '' || (listing && listing.username) ? listing.username : '';
                sellerAvatar = (listing && listing.sellerAvatar) ? listing.sellerAvatar : '';
              }
              
              if (!sellerName && listing.seller && typeof listing.seller === 'string') {
                sellerName = listing.seller;
              }
              
              if (!sellerName) {
                sellerName = listing.gardenOrCompanyName || listing.garden || 'Unknown Seller';
              }

              return (
                <View key={`${listing.id}-${idx}`} style={styles.listingCardFull}>
                  {/* Plant Card */}
                  <View style={styles.plantCardFull}>
                    {/* Image */}
                    <View style={styles.imageContainerFull}>
                      {imageUri ? (
                        <Image source={{uri: imageUri}} style={styles.imageFull} resizeMode="cover" />
                      ) : (
                        <View style={[styles.imageFull, {backgroundColor: '#E4E7E9'}]} />
                      )}
                    </View>
                    
                    {/* Details */}
                    <View style={styles.detailsContainerFull}>
                      {/* Name Section */}
                      <View style={styles.nameSectionFull}>
                        {/* Code + Country */}
                        <View style={styles.codeRowFull}>
                          <View style={styles.codeContainerFull}>
                            <Text style={styles.plantCodeFull}>{plantCode}</Text>
                            <View style={styles.tooltipContainerFull}>
                              <TouchableOpacity 
                                style={styles.helpIconContainerFull}
                                onPress={() => setTooltipVisible(tooltipVisible === listing.id ? null : listing.id)}
                              >
                                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                                  <Path d="M10 15.3125C10.6904 15.3125 11.25 14.7529 11.25 14.0625C11.25 13.3721 10.6904 12.8125 10 12.8125C9.30964 12.8125 8.75 13.3721 8.75 14.0625C8.75 14.7529 9.30964 15.3125 10 15.3125Z" fill="#7F8D91"/>
                                  <Path fillRule="evenodd" clipRule="evenodd" d="M10 3.4375C6.37563 3.4375 3.4375 6.37563 3.4375 10C3.4375 13.6244 6.37563 16.5625 10 16.5625C13.6244 16.5625 16.5625 13.6244 16.5625 10C16.5625 6.37563 13.6244 3.4375 10 3.4375ZM1.5625 10C1.5625 5.3401 5.3401 1.5625 10 1.5625C14.6599 1.5625 18.4375 5.3401 18.4375 10C18.4375 14.6599 14.6599 18.4375 10 18.4375C5.3401 18.4375 1.5625 14.6599 1.5625 10ZM6.5625 8.125C6.5625 6.28577 8.22324 5 10 5C11.7768 5 13.4375 6.28577 13.4375 8.125C13.4375 9.64136 12.3087 10.7815 10.9166 11.1351C10.8259 11.558 10.45 11.875 10 11.875C9.48223 11.875 9.0625 11.4553 9.0625 10.9375V10.3125C9.0625 9.79473 9.48223 9.375 10 9.375C10.9842 9.375 11.5625 8.7014 11.5625 8.125C11.5625 7.5486 10.9842 6.875 10 6.875C9.01582 6.875 8.4375 7.5486 8.4375 8.125V8.4375C8.4375 8.95527 8.01777 9.375 7.5 9.375C6.98223 9.375 6.5625 8.95527 6.5625 8.4375V8.125Z" fill="#7F8D91"/>
                                </Svg>
                              </TouchableOpacity>
                              {tooltipVisible === listing.id && (
                                <View style={styles.tooltipFull}>
                                  <Text style={styles.tooltipTextFull}>Plant code</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.countryContainerFull}>
                            <Text style={styles.countryTextFull}>{countryCode}</Text>
                            {renderFlag(getCountryCode(countryCode))}
                          </View>
                          <TouchableOpacity 
                            style={styles.listingRemoveButtonInline}
                            onPress={() => setSelectedListings(prev => prev.filter(item => item.id !== listing.id))}
                          >
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                              <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                            </Svg>
                          </TouchableOpacity>
                        </View>
                        
                        {/* Genus + Species */}
                        <Text style={styles.genusSpeciesFull} numberOfLines={2}>
                          {genus} {species}
                        </Text>
                        
                        {/* Variegation + Size */}
                        <View style={styles.variegationRowFull}>
                          <Text style={styles.variegationTextFull}>{variegation}</Text>
                          <View style={styles.dividerDotFull} />
                          <Text style={styles.sizeTextFull}>{size}</Text>
                        </View>
                      </View>
                      
                      {/* Type + Discount */}
                      <View style={styles.badgeRowFull}>
                        {listingType && (
                          <View style={styles.listingTypeBadgeFull}>
                            <Text style={styles.listingTypeTextFull}>{listingType}</Text>
                          </View>
                        )}
                        {discountPercent && (
                          <View style={styles.discountBadgeFull}>
                            <Text style={styles.discountPercentTextFull}>{discountPercent}%</Text>
                            <Text style={styles.discountOffTextFull}>OFF</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Price */}
                      <View style={styles.priceRowFull}>
                        <Text style={styles.priceTextFull}>${price}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Details Section (Seller Info) */}
                  <View style={styles.detailsSectionFull}>
                    <View style={styles.userContainerFull}>
                      {sellerAvatar ? (
                        <Image source={{uri: sellerAvatar}} style={styles.avatarFull} />
                      ) : (
                        <View style={[styles.avatarFull, styles.avatarPlaceholderFull]}>
                          <Text style={styles.avatarTextFull}>
                            {sellerName.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userContentFull}>
                        <View style={styles.sellerNameRowFull}>
                          {sellerName ? (
                            <Text style={styles.sellerNameFull}>{sellerName}</Text>
                          ) : null}
                          {sellerUsername ? (
                            <Text style={styles.sellerUsernameFull}>@{sellerUsername}</Text>
                          ) : null}
                        </View>
                        <View style={styles.roleRowFull}>
                          <Text style={styles.sellerRoleFull}>Seller</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.dividerStrip} />

        {/* Eligibility */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Eligibility<Text style={styles.reqAsterisk}>*</Text></Text>
          {['All customers', 'VIP customers', 'Specific customers'].map((label, idx) => {
            const selected = eligibility === label;
            return (
              <TouchableOpacity key={idx} style={styles.optionRow} activeOpacity={0.7} onPress={() => setEligibility(label)}>
                <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : styles.radioOuterDefault]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
          {eligibility === 'Specific customers' && (
            <>
              <TouchableOpacity style={[styles.secondaryBtn, {marginTop: 8}]} onPress={() => setShowBuyerSheet(true)}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path fillRule="evenodd" clipRule="evenodd" d="M12 3C12.4142 3 12.75 3.33579 12.75 3.75V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H12.75V20.25C12.75 20.6642 12.4142 21 12 21C11.5858 21 11.25 20.6642 11.25 20.25V12.75H3.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25H11.25V3.75C11.25 3.33579 11.5858 3 12 3Z" fill="#FFFFFF"/>
                </Svg>
                <Text style={styles.secondaryBtnText}>Add buyer</Text>
              </TouchableOpacity>
              {!!selectedBuyers.length && (
                <View style={[styles.appliesListWrap, {marginTop: 8, marginHorizontal: -24}]}> 
                  {selectedBuyers.map((b, idx) => (
                    <View key={`${b.id}-${idx}`} style={[styles.appliesCard, selectedBuyers.length > 1 && idx < selectedBuyers.length - 1 && {marginBottom: 8}]}>
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        {b.avatar ? (
                          <Image source={{uri: b.avatar}} style={{width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#539461', marginRight: 8}} />
                        ) : (
                          <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#48A7F8', borderWidth: 1, borderColor: '#539461', alignItems: 'center', justifyContent: 'center', marginRight: 8}}>
                            <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF'}}>
                              {(b.firstName || b.name || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{flex: 1}}>
                          {(b.firstName || b.lastName) ? (
                            <Text style={styles.appliesCardText}>{[b.firstName, b.lastName].filter(Boolean).join(' ')}</Text>
                          ) : (
                            <Text style={styles.appliesCardText}>{b.name}</Text>
                          )}
                          {b.username && (
                            <Text style={{fontFamily: 'Inter', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#647276', marginTop: 2}}>@{b.username}</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedBuyers(prev => prev.filter(x => x.id !== b.id))}>
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
        <View style={styles.dividerStrip} />

        {/* Minimum purchase requirements */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Minimum purchase requirements<Text style={styles.reqAsterisk}>*</Text></Text>
          {['No minimum order requirements', 'Minimum purchase amount ($)', 'Minimum quantity of plants'].map((label, idx) => {
            const selected = minRequirement === label;
            return (
              <TouchableOpacity key={idx} style={styles.optionRow} activeOpacity={0.7} onPress={() => setMinRequirement(label)}>
                <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : styles.radioOuterDefault]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
          {(minRequirement === 'Minimum purchase amount ($)' || (minRequirement && minRequirement.includes('Minimum purchase amount'))) && (
            <View style={{marginTop: 8}}>
              <View style={{flexDirection: 'row'}}>
                <View style={styles.prefixBox}><Text style={styles.suffixText}>$</Text></View>
                <View style={[styles.inputRow, {flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0}]}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#647276"
                    keyboardType="numeric"
                    value={minPurchaseAmount}
                    onChangeText={setMinPurchaseAmount}
                  />
                </View>
              </View>
            </View>
          )}
          {(minRequirement === 'Minimum quantity of plants' || (minRequirement && minRequirement.includes('Minimum quantity of plants'))) && (
            <View style={{marginTop: 8}}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#647276"
                  keyboardType="numeric"
                  value={minPurchaseQuantity}
                  onChangeText={setMinPurchaseQuantity}
                />
              </View>
            </View>
          )}
        </View>
        <View style={styles.dividerStrip} />

        {/* Maximum discount uses */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Maximum discount uses</Text>
          <TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setLimitTotalEnabled(prev => !prev)}>
            <View style={[styles.checkboxSquare, limitTotalEnabled ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
              {limitTotalEnabled && (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.optionText}>Limit number of times this discount can be used in total</Text>
          </TouchableOpacity>
          {limitTotalEnabled && (
            <View style={{marginTop: 8}}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#647276"
                  keyboardType="numeric"
                  value={maxUsesTotal}
                  onChangeText={setMaxUsesTotal}
                />
              </View>
            </View>
          )}
          <TouchableOpacity style={[styles.optionRow, {marginTop: 8}]} activeOpacity={0.7} onPress={() => setLimitPerCustomerEnabled(prev => !prev)}>
            <View style={[styles.checkboxSquare, limitPerCustomerEnabled ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
              {limitPerCustomerEnabled && (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.optionText}>Limit to one use of customer</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dividerStrip} />

        {/* Divider */}
        <View style={styles.dividerStrip}>
          <View style={styles.divider} />
        </View>

        {/* Start Date */}
        <View style={[styles.sectionPad, {flexDirection: 'row'}]}>
          <View style={[styles.fieldGroup, {width: 199}]}>
            <Text style={styles.label}>Starts date<Text style={styles.reqAsterisk}>*</Text></Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowStartDateSheet(true)}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#647276"
                  value={startDate}
                  editable={false}
                  pointerEvents="none"
                />
              </View>
            </TouchableOpacity>
          </View>
          <View style={[styles.fieldGroup, {width: 120}]}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                try {
                  const m = (startTime || '00:00 AM').match(/(\d{2}):(\d{2})\s*(AM|PM)/i);
                  if (m) { setTempHour(m[1]); setTempMinute(m[2]); setTempAmPm(m[3].toUpperCase()); }
                } catch (e) {}
                setShowStartTimeSheet(true);
              }}
            >
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="00:00 AM"
                  placeholderTextColor="#647276"
                  value={startTime}
                  editable={false}
                  pointerEvents="none"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Date Toggle */}
        <View style={{paddingHorizontal: 24, paddingVertical: 12}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={styles.label}>End date</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setEndDateEnabled(prev => !prev)}
              style={[styles.switchTrack, endDateEnabled ? { backgroundColor: '#539461', alignItems: 'flex-end' } : { backgroundColor: '#7F8D91', alignItems: 'flex-start' }]}
            >
              <View style={styles.switchKnob} />
            </TouchableOpacity>
          </View>
          {endDateEnabled && (
            <View style={{flexDirection: 'row', marginTop: 12}}>
              <View style={[styles.fieldGroup, {width: 199}]}>
                <Text style={styles.label}>End date<Text style={styles.reqAsterisk}>*</Text></Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowEndDateSheet(true)}>
                  <View style={[styles.inputRow, showEndDateSheet ? {borderColor: 'transparent'} : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="#647276"
                      value={endDate}
                      editable={false}
                      pointerEvents="none"
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.fieldGroup, {width: 170}]}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      const m = (endTime || '00:00 AM').match(/(\d{2}):(\d{2})\s*(AM|PM)/i);
                      if (m) { setTempEndHour(m[1]); setTempEndMinute(m[2]); setTempEndAmPm(m[3].toUpperCase()); }
                    } catch (e) {}
                    setShowEndTimeSheet(true);
                  }}
                >
                  <View style={[styles.inputRow, showEndTimeSheet ? {borderColor: 'transparent'} : null]}>
                    <TextInput
                      style={[styles.input, {paddingVertical: 12, lineHeight: 22}]}
                      placeholder="00:00 AM"
                      placeholderTextColor="#647276"
                      value={endTime}
                      editable={false}
                      pointerEvents="none"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.saveBtn, isUpdating && { opacity: 0.6 }]}
            onPress={async () => {
              // Validate required fields
              if (!code.trim()) {
                Alert.alert('Error', 'Please enter a discount code');
                return;
              }

              // Validate based on discount type
              if (discountTypeParam === 'buyXGetY') {
                if (!buyQuantity || !getQuantity) {
                  Alert.alert('Error', 'Please enter buy and get quantities');
                  return;
                }
              } else if (discountTypeParam === 'amountOffPlantsPercentage' || discountTypeParam === 'amountOffPlantsFixed' || discountTypeParam === 'eventGift' || discountTypeParam === 'eventGiftFixed') {
                if (!discountPercent) {
                  Alert.alert('Error', 'Please enter a discount percentage');
                  return;
                }
              }

              if (!startDate || !startTime) {
                Alert.alert('Error', 'Please select a start date and time');
                return;
              }

              // Validate appliesTo selections
              if (appliesText === 'Specific listing type' && (!selectedListingTypes || selectedListingTypes.length === 0)) {
                Alert.alert('Error', 'Please select at least one listing type');
                return;
              }
              if (appliesText === 'Specific genus' && (!selectedGenus || selectedGenus.length === 0)) {
                Alert.alert('Error', 'Please select at least one genus');
                return;
              }
              if (appliesText === 'Specific specie' && (!selectedSpecies || selectedSpecies.length === 0)) {
                Alert.alert('Error', 'Please select at least one specie');
                return;
              }
              if (appliesText === 'Specific country' && (!selectedCountries || selectedCountries.length === 0)) {
                Alert.alert('Error', 'Please select at least one country');
                return;
              }
              if (appliesText === 'Specific garden' && (!selectedGardens || selectedGardens.length === 0)) {
                Alert.alert('Error', 'Please select at least one garden');
                return;
              }
              if (appliesText === 'Specific listing' && (!selectedListings || selectedListings.length === 0)) {
                Alert.alert('Error', 'Please select at least one listing');
                return;
              }

              // Validate eligibility selections
              if (eligibility === 'Specific customers' && (!selectedBuyers || selectedBuyers.length === 0)) {
                Alert.alert('Error', 'Please select at least one buyer for specific customers eligibility');
                return;
              }

              // Final check for discountId - use stored discountId as primary source
              const finalDiscountId = discountId || route?.params?.discountId || route?.params?.id;
              console.log('📝 Update Discount - Checking discountId:', {
                storedDiscountId: discountId,
                routeParamsDiscountId: route?.params?.discountId,
                routeParamsId: route?.params?.id,
                finalDiscountId
              });
              
              if (!finalDiscountId) {
                console.error('❌ Update Discount - Missing discountId. Route params:', JSON.stringify(route?.params || {}, null, 2));
                console.error('❌ Update Discount - Stored discountId:', discountId);
                Alert.alert(
                  'Error', 
                  'Discount ID is missing. Cannot update discount.\n\nPlease go back and try again.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                return;
              }

              setIsUpdating(true);

              try {
                // Use finalDiscountId for the API call
                const discountIdForUpdate = finalDiscountId;
                console.log('📝 Update Discount - Using discountId:', discountIdForUpdate);
                
                // Prepare discount data based on type
                console.log('📝 Update Discount - discountTypeParam:', discountTypeParam, 'discountType:', discountType);
                let discountData;
                
                if (discountTypeParam === 'buyXGetY') {
                  discountData = {
                    code: code.trim(),
                    type: 'buyXGetY',
                    buyQuantity: parseInt(buyQuantity, 10),
                    getQuantity: parseInt(getQuantity, 10),
                    startDate,
                    startTime,
                    endDate: endDateEnabled ? endDate : undefined,
                    endTime: endDateEnabled ? endTime : undefined,
                    appliesText,
                    selectedListingTypes,
                    selectedGenus,
                    selectedSpecies,
                    selectedCountries,
                    selectedGardens,
                    selectedListings: selectedListings.map(l => typeof l === 'object' ? l.id : l),
                    eligibility,
                    minRequirement: minRequirement === 'Minimum purchase amount ($)' && minPurchaseAmount 
                      ? `Minimum purchase amount of $${minPurchaseAmount}` 
                      : minRequirement === 'Minimum quantity of plants' && minPurchaseQuantity 
                      ? `Minimum quantity of ${minPurchaseQuantity} plants` 
                      : minRequirement,
                    limitTotalEnabled,
                    limitPerCustomerEnabled,
                    maxUsesTotal: maxUsesTotal && limitTotalEnabled ? parseInt(maxUsesTotal, 10) : undefined,
                    selectedBuyers: eligibility === 'Specific customers' ? (selectedBuyers?.map(b => typeof b === 'object' ? b.id : b) || []) : undefined,
                  };
                } else if (discountTypeParam === 'amountOffPlantsPercentage' || discountTypeParam === 'amountOffPlantsFixed') {
                  discountData = {
                    code: code.trim(),
                    type: discountType === 'Fixed amount' ? 'amountOffPlantsFixed' : 'amountOffPlantsPercentage',
                    discountPercent: discountType === 'Percentage' ? parseFloat(discountPercent) : undefined,
                    discountAmount: discountType === 'Fixed amount' ? parseFloat(discountPercent) : undefined,
                    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
                    startDate,
                    startTime,
                    endDate: endDateEnabled ? endDate : undefined,
                    endTime: endDateEnabled ? endTime : undefined,
                    appliesText,
                    selectedListingTypes,
                    selectedGenus,
                    selectedSpecies,
                    selectedCountries,
                    selectedGardens,
                    selectedListings: selectedListings.map(l => typeof l === 'object' ? l.id : l),
                    eligibility,
                    minRequirement: minRequirement === 'Minimum purchase amount ($)' && minPurchaseAmount 
                      ? `Minimum purchase amount of $${minPurchaseAmount}` 
                      : minRequirement === 'Minimum quantity of plants' && minPurchaseQuantity 
                      ? `Minimum quantity of ${minPurchaseQuantity} plants` 
                      : minRequirement,
                    limitTotalEnabled,
                    limitPerCustomerEnabled,
                    maxUsesTotal: maxUsesTotal && limitTotalEnabled ? parseInt(maxUsesTotal, 10) : undefined,
                    selectedBuyers: eligibility === 'Specific customers' ? (selectedBuyers?.map(b => typeof b === 'object' ? b.id : b) || []) : undefined,
                  };
                } else if (discountTypeParam === 'eventGift' || discountTypeParam === 'eventGiftFixed') {
                  discountData = {
                    code: code.trim(),
                    type: discountType === 'Fixed amount' ? 'eventGiftFixed' : 'eventGift',
                    discountPercent: discountType === 'Percentage' ? parseFloat(discountPercent) : undefined,
                    discountAmount: discountType === 'Fixed amount' ? parseFloat(discountPercent) : undefined,
                    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
                    startDate,
                    startTime,
                    endDate: endDateEnabled ? endDate : undefined,
                    endTime: endDateEnabled ? endTime : undefined,
                    appliesText,
                    selectedListingTypes,
                    selectedGenus,
                    selectedSpecies,
                    selectedCountries,
                    selectedGardens,
                    selectedListings: selectedListings.map(l => typeof l === 'object' ? l.id : l),
                    eligibility,
                    minRequirement: minRequirement === 'Minimum purchase amount ($)' && minPurchaseAmount 
                      ? `Minimum purchase amount of $${minPurchaseAmount}` 
                      : minRequirement === 'Minimum quantity of plants' && minPurchaseQuantity 
                      ? `Minimum quantity of ${minPurchaseQuantity} plants` 
                      : minRequirement,
                    limitTotalEnabled,
                    limitPerCustomerEnabled,
                    maxUsesTotal: maxUsesTotal && limitTotalEnabled ? parseInt(maxUsesTotal, 10) : undefined,
                    selectedBuyers: eligibility === 'Specific customers' ? (selectedBuyers?.map(b => typeof b === 'object' ? b.id : b) || []) : undefined,
                  };
                } else {
                  console.error('❌ Update Discount - Invalid discountTypeParam:', discountTypeParam);
                  Alert.alert('Error', `Invalid discount type: ${discountTypeParam || 'undefined'}. Please refresh and try again.`);
                  setIsUpdating(false);
                  return;
                }

                console.log('Update Discount:', discountData);
                
                const result = await updateDiscountApi(discountIdForUpdate, discountData);
                
                if (result.success) {
                  // Navigate back immediately with refresh flag - don't wait for alert
                  // The alert will still show, but navigation happens first
                  navigation.navigate('AdminDiscounts', { refresh: true });
                  
                  Alert.alert('Success', 'Discount code updated successfully!', [
                    { text: 'OK' }
                  ]);
                } else {
                  Alert.alert('Error', result.error || 'Failed to update discount code');
                }
              } catch (error) {
                console.error('Error updating discount:', error);
                Alert.alert('Error', error.message || 'An unexpected error occurred');
              } finally {
                setIsUpdating(false);
              }
            }}
            activeOpacity={0.8}
            disabled={isUpdating}
          >
            <Text style={styles.saveBtnText}>
              {isUpdating ? 'Updating...' : 'Update Discount'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Start Date modal */}
      <Modal transparent visible={showStartDateSheet} onRequestClose={() => setShowStartDateSheet(false)} animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setShowStartDateSheet(false)}>
          <View style={styles.buyerOverlay}>
            <TouchableWithoutFeedback>
              <View style={{ width: '100%', height: 582, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: insets.bottom }}>
                <View style={styles.genusHeader}>
                  <Text style={styles.genusTitle}>Select date</Text>
                  <TouchableOpacity onPress={() => setShowStartDateSheet(false)}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
                <View style={{paddingHorizontal: 24, paddingVertical: 8}}>
                  <View style={{height: 428, borderRadius: 12, padding: 12}}>
                    {/* Month header */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8}}>
                      <TouchableOpacity
                        onPress={() => {
                          const d = new Date(calendarMonth);
                          d.setMonth(d.getMonth() - 1);
                          setCalendarMonth(d);
                        }}
                        style={{borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12, padding: 12}}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path fillRule="evenodd" clipRule="evenodd" d="M15.5303 3.96967C15.8232 4.26256 15.8232 4.73744 15.5303 5.03033L8.56066 12L15.5303 18.9697C15.8232 19.2626 15.8232 19.7374 15.5303 20.0303C15.2374 20.3232 14.7626 20.3232 14.4697 20.0303L6.96967 12.5303C6.67678 12.2374 6.67678 11.7626 6.96967 11.4697L14.4697 3.96967C14.7626 3.67678 15.2374 3.67678 15.5303 3.96967Z" fill="#202325"/>
                        </Svg>
                      </TouchableOpacity>
                      <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 20, color: '#393D40'}}>
                        {calendarMonth.toLocaleString('default', { month: 'long' })}, {calendarMonth.getFullYear()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const d = new Date(calendarMonth);
                          d.setMonth(d.getMonth() + 1);
                          setCalendarMonth(d);
                        }}
                        style={{borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12, padding: 12}}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path fillRule="evenodd" clipRule="evenodd" d="M8.46967 3.96967C8.76256 3.67678 9.23744 3.67678 9.53033 3.96967L17.0303 11.4697C17.3232 11.7626 17.3232 12.2374 17.0303 12.5303L9.53033 20.0303C9.23744 20.3232 8.76256 20.3232 8.46967 20.0303C8.17678 19.7374 8.17678 19.2626 8.46967 18.9697L15.4393 12L8.46967 5.03033C8.17678 4.73744 8.17678 4.26256 8.46967 3.96967Z" fill="#202325"/>
                        </Svg>
                      </TouchableOpacity>
                    </View>
                    {/* Weekday headers */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                        <View key={d} style={{width: 42, alignItems: 'center', marginRight: i < 6 ? 8 : 0}}>
                          <Text style={{fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#539461'}}>{d}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Days grid */}
                    <View style={{marginTop: 8}}>
                      {(() => {
                        const year = calendarMonth.getFullYear();
                        const month = calendarMonth.getMonth();
                        const first = new Date(year, month, 1);
                        const firstDay = first.getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                        const rows = [];
                        const rowCount = Math.ceil(cells.length / 7);
                        for (let r = 0; r < rowCount; r++) {
                          const slice = cells.slice(r * 7, r * 7 + 7);
                          while (slice.length < 7) slice.push(null);
                          rows.push(slice);
                        }
                        const pad2 = (n) => String(n).padStart(2, '0');
                        return rows.map((row, idx) => (
                          <View key={`row-${idx}`} style={{flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8}}>
                            {row.map((val, j) => (
                              <TouchableOpacity
                                key={`cell-${idx}-${j}`}
                                style={{width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: val && startDate === `${pad2(month+1)}/${pad2(val)}/${year}` ? '#539461' : 'transparent', marginRight: j < 6 ? 8 : 0}}
                                disabled={!val}
                                onPress={() => {
                                  const selected = `${pad2(month+1)}/${pad2(val)}/${year}`;
                                  setStartDate(selected);
                                }}
                              >
                                <Text style={{fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 16, color: val ? (startDate === `${pad2(month+1)}/${pad2(val)}/${year}` ? '#FFFFFF' : '#202325') : '#A9B3B7'}}>
                                  {val ? val : ''}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ));
                      })()}
                    </View>
                  </View>
                </View>
                <View style={[styles.genusActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <TouchableOpacity style={styles.genusClearBtn} onPress={() => setShowStartDateSheet(false)}>
                    <Text style={styles.genusClearText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.genusApplyBtn} onPress={() => setShowStartDateSheet(false)}>
                    <Text style={styles.genusApplyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Start Time modal */}
      <Modal transparent visible={showStartTimeSheet} onRequestClose={() => setShowStartTimeSheet(false)} animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setShowStartTimeSheet(false)}>
          <View style={styles.buyerOverlay}>
            <TouchableWithoutFeedback>
              <View style={{ width: '100%', height: 354, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: insets.bottom, transform: timeKeyboardOffset ? [{ translateY: -timeKeyboardOffset }] : [] }}>
                <View style={styles.genusHeader}>
                  <Text style={styles.genusTitle}>Select time</Text>
                  <TouchableOpacity onPress={() => setShowStartTimeSheet(false)}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
                <View style={{paddingHorizontal: 24, flex: 1, justifyContent: 'center'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{width: 120}}>
                      <View style={[styles.inputRow, {height: 72, minHeight: 72}]}>
                        <TextInput
                          style={[styles.input, {textAlign: 'center', fontSize: 36, lineHeight: 40}]}
                          keyboardType="number-pad"
                          maxLength={2}
                          value={tempHour}
                          onChangeText={(text) => {
                            // Only allow numeric input
                            const numericText = text.replace(/[^0-9]/g, '');
                            // Limit to 12 for hours (1-12 format)
                            if (numericText === '' || (parseInt(numericText) >= 1 && parseInt(numericText) <= 12)) {
                              setTempHour(numericText);
                            }
                          }}
                          onFocus={() => {
                            // Clear the field when focused for easier input
                            if (tempHour === '00') {
                              setTempHour('');
                            }
                          }}
                          onBlur={() => {
                            // Pad with zero if empty on blur
                            if (tempHour === '') {
                              setTempHour('00');
                            }
                          }}
                          placeholder="00"
                          placeholderTextColor="#A9B3B7"
                        />
                      </View>
                      <Text style={{marginTop: 4, textAlign: 'center', fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#7F8D91'}}>Hour</Text>
                    </View>
                    <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 24, color: '#202325', marginHorizontal: 8}}>:</Text>
                    <View style={{width: 120, marginRight: 8}}>
                      <View style={[styles.inputRow, {height: 72, minHeight: 72}]}>
                        <TextInput
                          style={[styles.input, {textAlign: 'center', fontSize: 36, lineHeight: 40}]}
                          keyboardType="number-pad"
                          maxLength={2}
                          value={tempMinute}
                          onChangeText={(text) => {
                            // Only allow numeric input
                            const numericText = text.replace(/[^0-9]/g, '');
                            // Limit to 59 for minutes (0-59)
                            if (numericText === '' || (parseInt(numericText) >= 0 && parseInt(numericText) <= 59)) {
                              setTempMinute(numericText);
                            }
                          }}
                          onFocus={() => {
                            // Clear the field when focused for easier input
                            if (tempMinute === '00') {
                              setTempMinute('');
                            }
                          }}
                          onBlur={() => {
                            // Pad with zero if empty on blur
                            if (tempMinute === '') {
                              setTempMinute('00');
                            }
                          }}
                          placeholder="00"
                          placeholderTextColor="#A9B3B7"
                        />
                      </View>
                      <Text style={{marginTop: 4, textAlign: 'center', fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#7F8D91'}}>Minutes</Text>
                    </View>
                    <View style={{width: 59, marginLeft: 4}}>
                      <TouchableOpacity
                        style={[styles.genusApplyBtn, {height: 34, backgroundColor: tempAmPm === 'AM' ? '#539461' : '#FFFFFF', borderWidth: tempAmPm === 'AM' ? 0 : 1, borderColor: '#539461'}]}
                        onPress={() => setTempAmPm('AM')}
                      >
                        <Text style={{color: tempAmPm === 'AM' ? '#FFFFFF' : '#539461', fontFamily: 'Inter', fontWeight: '500', fontSize: 16}}>AM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.genusClearBtn, {height: 34, marginTop: 4, backgroundColor: tempAmPm === 'PM' ? '#539461' : '#FFFFFF', borderWidth: tempAmPm === 'PM' ? 0 : 1, borderColor: '#539461'}]}
                        onPress={() => setTempAmPm('PM')}
                      >
                        <Text style={{color: tempAmPm === 'PM' ? '#FFFFFF' : '#539461', fontFamily: 'Inter', fontWeight: '500', fontSize: 16}}>PM</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={[styles.genusActions, {paddingTop: 24, paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <TouchableOpacity style={styles.genusClearBtn} onPress={() => setShowStartTimeSheet(false)}>
                    <Text style={styles.genusClearText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.genusApplyBtn}
                    onPress={() => {
                      const hh = (tempHour || '00').padStart(2, '0');
                      const mm = (tempMinute || '00').padStart(2, '0');
                      setStartTime(`${hh}:${mm} ${tempAmPm}`);
                      setShowStartTimeSheet(false);
                    }}
                  >
                    <Text style={styles.genusApplyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Species modal (bottom sheet) */}
      <Modal transparent visible={showSpeciesSheet} onRequestClose={() => setShowSpeciesSheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowSpeciesSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.genusSheetWrapper}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} style={{flex: 1}}>
                  <SafeAreaView style={{flex: 1}}>
                    {/* Header */}
                    <View style={styles.genusHeader}>
                      <Text style={styles.genusTitle}>Add Specie</Text>
                      <TouchableOpacity onPress={() => setShowSpeciesSheet(false)}>
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                        </Svg>
                      </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    <View style={styles.genusContentContainer}>
                      {/* Search Bar */}
                      <View style={styles.inputRow}> 
                        <TextInput
                          style={styles.input}
                          placeholder="Search specie"
                          placeholderTextColor="#647276"
                          value={speciesSearch}
                          onChangeText={setSpeciesSearch}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>

                      {/* Scrollable List */}
                      <ScrollView 
                        style={styles.genusListContainer}
                        keyboardShouldPersistTaps="handled"
                      >
                        {speciesLoading && (
                          <>
                            {[...Array(8)].map((_, idx) => (
                              <View key={`species-skel-${idx}`} style={styles.genusRow}>
                                <View style={styles.genusRowLeft}>
                                  <View style={styles.genusSkeletonText} />
                                </View>
                                <View style={styles.genusRowRight}>
                                  <View style={styles.genusSkeletonCheckbox} />
                                </View>
                              </View>
                            ))}
                          </>
                        )}
                        {!speciesLoading && speciesOptions
                          .filter(label => label.toLowerCase().includes(speciesSearch.toLowerCase()))
                          .map((label, idx) => {
                            const selected = selectedSpecies.includes(label);
                            return (
                              <TouchableOpacity
                                key={`${label}-${idx}`}
                                style={styles.genusRow}
                                activeOpacity={0.7}
                                onPress={() => {
                                  setSelectedSpecies(prev => selected ? prev.filter(i => i !== label) : [...prev, label]);
                                }}
                              >
                                <View style={styles.genusRowLeft}>
                                  <Text style={styles.typeRowText} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
                                </View>
                                <View style={styles.genusRowRight}>
                                  <View style={[styles.checkboxSquare, selected ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
                                    {selected && (
                                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                                        <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </Svg>
                                    )}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        {!speciesLoading && speciesOptions.filter(label => label.toLowerCase().includes(speciesSearch.toLowerCase())).length === 0 && (
                          <Text style={{padding: 20, color: '#7F8D91'}}>No results</Text>
                        )}
                      </ScrollView>
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.genusActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                      <TouchableOpacity style={styles.genusClearBtn} onPress={() => setSelectedSpecies([])}>
                        <Text style={styles.genusClearText}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.genusApplyBtn} onPress={() => setShowSpeciesSheet(false)}>
                        <Text style={styles.genusApplyText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* End Date modal */}
      <Modal transparent visible={showEndDateSheet} onRequestClose={() => setShowEndDateSheet(false)} animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setShowEndDateSheet(false)}>
          <View style={styles.buyerOverlay}>
            <TouchableWithoutFeedback>
              <View style={{ width: '100%', height: 582, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: insets.bottom }}>
                <View style={styles.genusHeader}>
                  <Text style={styles.genusTitle}>Select date</Text>
                  <TouchableOpacity onPress={() => setShowEndDateSheet(false)}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
                <View style={{paddingHorizontal: 24, paddingVertical: 8}}>
                  <View style={{height: 428, borderRadius: 12, padding: 12}}>
                    {/* Month header */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8}}>
                      <TouchableOpacity
                        onPress={() => {
                          const d = new Date(endCalendarMonth);
                          d.setMonth(d.getMonth() - 1);
                          setEndCalendarMonth(d);
                        }}
                        style={{borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12, padding: 12}}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path fillRule="evenodd" clipRule="evenodd" d="M15.5303 3.96967C15.8232 4.26256 15.8232 4.73744 15.5303 5.03033L8.56066 12L15.5303 18.9697C15.8232 19.2626 15.8232 19.7374 15.5303 20.0303C15.2374 20.3232 14.7626 20.3232 14.4697 20.0303L6.96967 12.5303C6.67678 12.2374 6.67678 11.7626 6.96967 11.4697L14.4697 3.96967C14.7626 3.67678 15.2374 3.67678 15.5303 3.96967Z" fill="#202325"/>
                        </Svg>
                      </TouchableOpacity>
                      <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 20, color: '#393D40'}}>
                        {endCalendarMonth.toLocaleString('default', { month: 'long' })}, {endCalendarMonth.getFullYear()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const d = new Date(endCalendarMonth);
                          d.setMonth(d.getMonth() + 1);
                          setEndCalendarMonth(d);
                        }}
                        style={{borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12, padding: 12}}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path fillRule="evenodd" clipRule="evenodd" d="M8.46967 3.96967C8.76256 3.67678 9.23744 3.67678 9.53033 3.96967L17.0303 11.4697C17.3232 11.7626 17.3232 12.2374 17.0303 12.5303L9.53033 20.0303C9.23744 20.3232 8.76256 20.3232 8.46967 20.0303C8.17678 19.7374 8.17678 19.2626 8.46967 18.9697L15.4393 12L8.46967 5.03033C8.17678 4.73744 8.17678 4.26256 8.46967 3.96967Z" fill="#202325"/>
                        </Svg>
                      </TouchableOpacity>
                    </View>
                    {/* Weekday headers */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                        <View key={d} style={{width: 42, alignItems: 'center', marginRight: i < 6 ? 8 : 0}}>
                          <Text style={{fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#539461'}}>{d}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Days grid */}
                    <View style={{marginTop: 8}}>
                      {(() => {
                        const year = endCalendarMonth.getFullYear();
                        const month = endCalendarMonth.getMonth();
                        const first = new Date(year, month, 1);
                        const firstDay = first.getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                        const rows = [];
                        const rowCount = Math.ceil(cells.length / 7);
                        for (let r = 0; r < rowCount; r++) {
                          const slice = cells.slice(r * 7, r * 7 + 7);
                          while (slice.length < 7) slice.push(null);
                          rows.push(slice);
                        }
                        const pad2 = (n) => String(n).padStart(2, '0');
                        return rows.map((row, idx) => (
                          <View key={`end-row-${idx}`} style={{flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8}}>
                            {row.map((val, j) => (
                              <TouchableOpacity
                                key={`end-cell-${idx}-${j}`}
                                style={{width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: val && endDate === `${pad2(month+1)}/${pad2(val)}/${year}` ? '#539461' : 'transparent', marginRight: j < 6 ? 8 : 0}}
                                disabled={!val}
                                onPress={() => {
                                  const selected = `${pad2(month+1)}/${pad2(val)}/${year}`;
                                  setEndDate(selected);
                                }}
                              >
                                <Text style={{fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 16, color: val ? (endDate === `${pad2(month+1)}/${pad2(val)}/${year}` ? '#FFFFFF' : '#202325') : '#A9B3B7'}}>
                                  {val ? val : ''}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ));
                      })()}
                    </View>
                  </View>
                </View>
                <View style={[styles.genusActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <TouchableOpacity style={styles.genusClearBtn} onPress={() => setShowEndDateSheet(false)}>
                    <Text style={styles.genusClearText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.genusApplyBtn} onPress={() => setShowEndDateSheet(false)}>
                    <Text style={styles.genusApplyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* End Time modal */}
      <Modal transparent visible={showEndTimeSheet} onRequestClose={() => setShowEndTimeSheet(false)} animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setShowEndTimeSheet(false)}>
          <View style={styles.buyerOverlay}>
            <TouchableWithoutFeedback>
              <View style={{ width: '100%', height: 354, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: insets.bottom, transform: endTimeKeyboardOffset ? [{ translateY: -endTimeKeyboardOffset }] : [] }}>
                <View style={styles.genusHeader}>
                  <Text style={styles.genusTitle}>Select time</Text>
                  <TouchableOpacity onPress={() => setShowEndTimeSheet(false)}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
                <View style={{paddingHorizontal: 24, flex: 1, justifyContent: 'center'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{width: 120}}>
                      <View style={[styles.inputRow, {height: 72, minHeight: 72}]}>
                        <TextInput
                          style={[styles.input, {textAlign: 'center', fontSize: 36, lineHeight: 40}]}
                          keyboardType="number-pad"
                          maxLength={2}
                          value={tempEndHour}
                          onChangeText={(text) => {
                            // Only allow numeric input
                            const numericText = text.replace(/[^0-9]/g, '');
                            // Limit to 12 for hours (1-12 format)
                            if (numericText === '' || (parseInt(numericText) >= 1 && parseInt(numericText) <= 12)) {
                              setTempEndHour(numericText);
                            }
                          }}
                          onFocus={() => {
                            // Clear the field when focused for easier input
                            if (tempEndHour === '00') {
                              setTempEndHour('');
                            }
                          }}
                          onBlur={() => {
                            // Pad with zero if empty on blur
                            if (tempEndHour === '') {
                              setTempEndHour('00');
                            }
                          }}
                          placeholder="00"
                          placeholderTextColor="#A9B3B7"
                        />
                      </View>
                      <Text style={{marginTop: 4, textAlign: 'center', fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#7F8D91'}}>Hour</Text>
                    </View>
                    <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 24, color: '#202325', marginHorizontal: 8}}>:</Text>
                    <View style={{width: 120, marginRight: 8}}>
                      <View style={[styles.inputRow, {height: 72, minHeight: 72}]}>
                        <TextInput
                          style={[styles.input, {textAlign: 'center', fontSize: 36, lineHeight: 40}]}
                          keyboardType="number-pad"
                          maxLength={2}
                          value={tempEndMinute}
                          onChangeText={(text) => {
                            // Only allow numeric input
                            const numericText = text.replace(/[^0-9]/g, '');
                            // Limit to 59 for minutes (0-59)
                            if (numericText === '' || (parseInt(numericText) >= 0 && parseInt(numericText) <= 59)) {
                              setTempEndMinute(numericText);
                            }
                          }}
                          onFocus={() => {
                            // Clear the field when focused for easier input
                            if (tempEndMinute === '00') {
                              setTempEndMinute('');
                            }
                          }}
                          onBlur={() => {
                            // Pad with zero if empty on blur
                            if (tempEndMinute === '') {
                              setTempEndMinute('00');
                            }
                          }}
                          placeholder="00"
                          placeholderTextColor="#A9B3B7"
                        />
                      </View>
                      <Text style={{marginTop: 4, textAlign: 'center', fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#7F8D91'}}>Minutes</Text>
                    </View>
                    <View style={{width: 59, marginLeft: 4}}>
                      <TouchableOpacity
                        style={[{height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: tempEndAmPm === 'AM' ? '#539461' : '#FFFFFF', borderWidth: tempEndAmPm === 'AM' ? 0 : 1, borderColor: '#539461'}]}
                        onPress={() => setTempEndAmPm('AM')}
                      >
                        <Text style={{color: tempEndAmPm === 'AM' ? '#FFFFFF' : '#539461', fontFamily: 'Inter', fontWeight: '500', fontSize: 16}}>AM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[{height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: tempEndAmPm === 'PM' ? '#539461' : '#FFFFFF', borderWidth: tempEndAmPm === 'PM' ? 0 : 1, borderColor: '#539461'}]}
                        onPress={() => setTempEndAmPm('PM')}
                      >
                        <Text style={{color: tempEndAmPm === 'PM' ? '#FFFFFF' : '#539461', fontFamily: 'Inter', fontWeight: '500', fontSize: 16}}>PM</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={{flexDirection: 'row', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 0}}>
                  <TouchableOpacity style={{flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F2F7F3', alignItems: 'center', justifyContent: 'center'}} onPress={() => setShowEndTimeSheet(false)}>
                    <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#539461'}}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{flex: 1, height: 48, borderRadius: 12, backgroundColor: '#539461', alignItems: 'center', justifyContent: 'center'}}
                    onPress={() => {
                      const hh = (tempEndHour || '00').padStart(2, '0');
                      const mm = (tempEndMinute || '00').padStart(2, '0');
                      setEndTime(`${hh}:${mm} ${tempEndAmPm}`);
                      setShowEndTimeSheet(false);
                    }}
                  >
                    <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF'}}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Discount Type Modal */}
      {(discountTypeParam === 'amountOffPlantsPercentage' || discountTypeParam === 'amountOffPlantsFixed' || discountTypeParam === 'eventGift' || discountTypeParam === 'eventGiftFixed') ? (
        <Modal transparent visible={showTypeSheet} onRequestClose={() => setShowTypeSheet(false)} animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowTypeSheet(false)}>
            <View style={styles.fullscreenOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.typeSheetContainer, {position: 'absolute', left: (SCREEN.width - 340) / 2, top: typeSheetTop}]}>
                  <View style={styles.typeRowWrapper}>
                    <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setDiscountType('Percentage'); setShowTypeSheet(false); }}>
                      <Text style={styles.typeRowText}>Percentage</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.typeDivider} />
                  <View style={styles.typeRowWrapper}>
                    <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setDiscountType('Fixed amount'); setShowTypeSheet(false); }}>
                      <Text style={styles.typeRowText}>Fixed amount</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}

      {/* Applies to Modal */}
      <Modal transparent visible={showAppliesSheet} onRequestClose={() => setShowAppliesSheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAppliesSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.appliesSheetContainer, {position: 'absolute', left: (SCREEN.width - 340) / 2, top: appliesSheetTop}]}>
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setAppliesText('Specific listing type'); setShowAppliesSheet(false); }}>
                    <Text style={styles.typeRowText}>Specific listing type</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeDivider} />
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setAppliesText('Specific genus'); setShowAppliesSheet(false); }}>
                    <Text style={styles.typeRowText}>Specific genus</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeDivider} />
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setAppliesText('Specific specie'); setShowAppliesSheet(false); }}>
                    <Text style={styles.typeRowText}>Specific specie</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeDivider} />
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setAppliesText('Specific country'); setShowAppliesSheet(false); }}>
                    <Text style={styles.typeRowText}>Specific country</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeDivider} />
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setAppliesText('Specific garden'); setShowAppliesSheet(false); }}>
                    <Text style={styles.typeRowText}>Specific garden</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeDivider} />
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { setAppliesText('Specific listing'); setShowAppliesSheet(false); }}>
                    <Text style={styles.typeRowText}>Specific listing</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Listing Type Modal */}
      <Modal transparent visible={showListingTypeSheet} onRequestClose={() => setShowListingTypeSheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowListingTypeSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.listingTypeSheetContainer}>
                {(listingTypes.length ? listingTypes : ['Single Plant', 'Wholesale', 'Growers Choice']).map((label, idx, arr) => (
                  <View key={`${label}-${idx}`}>
                    <View style={styles.typeRowWrapper}>
                      <TouchableOpacity
                        style={styles.typeRowLeft}
                        onPress={() => {
                          setSelectedListingTypes(prev => prev.includes(label) ? prev : [...prev, label]);
                          setShowListingTypeSheet(false);
                        }}>
                        <Text style={styles.typeRowText}>{label}</Text>
                      </TouchableOpacity>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.typeDivider} />}
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Genus Modal */}
      <Modal transparent visible={showGenusSheet} onRequestClose={() => setShowGenusSheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowGenusSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.genusSheetWrapper}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} style={{flex: 1}}>
                  <SafeAreaView style={{flex: 1}}>
                    {/* Header */}
                <View style={styles.genusHeader}>
                  <Text style={styles.genusTitle}>Add Genus</Text>
                  <TouchableOpacity onPress={() => setShowGenusSheet(false)}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                    </Svg>
                  </TouchableOpacity>
                </View>

                    {/* Content Area */}
                    <View style={styles.genusContentContainer}>
                      {/* Search Bar */}
                      <View style={styles.inputRow}> 
                    <TextInput
                      style={styles.input}
                      placeholder="Search genus"
                      placeholderTextColor="#647276"
                      value={genusSearch}
                      onChangeText={setGenusSearch}
                          autoCapitalize="none"
                          autoCorrect={false}
                    />
                  </View>

                      {/* Scrollable List */}
                      <ScrollView 
                        style={styles.genusListContainer}
                        keyboardShouldPersistTaps="handled"
                      >
                  {genusLoading && (
                          <>
                            {[...Array(8)].map((_, idx) => (
                              <View key={`genus-skel-${idx}`} style={styles.genusRow}>
                                <View style={styles.genusRowLeft}>
                                  <View style={styles.genusSkeletonText} />
                                </View>
                                <View style={styles.genusRowRight}>
                                  <View style={styles.genusSkeletonCheckbox} />
                                </View>
                              </View>
                            ))}
                          </>
                  )}
                  {!genusLoading && genusOptions
                    .filter(label => label.toLowerCase().includes(genusSearch.toLowerCase()))
                          .map((label, idx) => {
                            const selected = selectedGenus.includes(label);
                            return (
                              <TouchableOpacity
                                key={`${label}-${idx}`}
                                style={styles.genusRow}
                                activeOpacity={0.7}
                                delayPressIn={200}
                                onPress={() => {
                                  setSelectedGenus(prev => selected ? prev.filter(i => i !== label) : [...prev, label]);
                                }}
                                delayLongPress={500}
                              >
                      <View style={styles.genusRowLeft}>
                        <Text style={styles.typeRowText}>{label}</Text>
                      </View>
                      <View style={styles.genusRowRight}>
                                  <View style={[styles.checkboxSquare, selected ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
                                    {selected && (
                              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                                <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            )}
                          </View>
                      </View>
                              </TouchableOpacity>
                            );
                          })}
                  {!genusLoading && genusOptions.filter(label => label.toLowerCase().includes(genusSearch.toLowerCase())).length === 0 && (
                          <Text style={{padding: 20, color: '#7F8D91'}}>No results</Text>
                  )}
                      </ScrollView>
                </View>

                    {/* Action Buttons */}
                    <View style={[styles.genusActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <TouchableOpacity style={styles.genusClearBtn} onPress={() => setSelectedGenus([])}>
                    <Text style={styles.genusClearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.genusApplyBtn} onPress={() => setShowGenusSheet(false)}>
                    <Text style={styles.genusApplyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
                  </SafeAreaView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Country Modal */}
      <Modal transparent visible={showCountrySheet} onRequestClose={() => setShowCountrySheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowCountrySheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.countrySheetContainer}>
                {(countryOptions.length ? countryOptions : ['Thailand','Indonesia','Philippines']).map((label, idx, arr) => (
                  <View key={`${label}-${idx}`}>
                    <View style={styles.typeRowWrapper}>
                      <TouchableOpacity
                        style={[styles.typeRowLeft]}
                        onPress={() => {
                          setSelectedCountries(prev => prev.includes(label) ? prev : [...prev, label]);
                          setShowCountrySheet(false);
                        }}>
                        {renderFlag(getCountryCode(label))}
                        <Text style={styles.typeRowText}>{label}</Text>
                      </TouchableOpacity>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.typeDivider} />}
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Garden Modal */}
      <Modal transparent visible={showGardenSheet} onRequestClose={() => setShowGardenSheet(false)} animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setShowGardenSheet(false)}>
          <View style={styles.buyerOverlay}>
            <TouchableWithoutFeedback>
              <ScrollView
                style={{width: '100%'}}
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.buyerSheetContainer}>
                  <View style={styles.genusHeader}>
                    <Text style={styles.genusTitle}>Garden</Text>
                    <TouchableOpacity onPress={() => setShowGardenSheet(false)}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                      </Svg>
                    </TouchableOpacity>
                  </View>
                  <View style={{paddingHorizontal: 24, paddingBottom: 8}}>
                    <View style={[styles.inputRow]}> 
                      <TextInput
                        style={styles.input}
                        placeholder="Search garden"
                        placeholderTextColor="#647276"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={gardenSearch}
                        onChangeText={setGardenSearch}
                      />
                    </View>
                  </View>
                  <ScrollView
                    style={{flex: 1}}
                    contentContainerStyle={{paddingHorizontal: 24, paddingBottom: 16}}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    nestedScrollEnabled={true}
                  >
                    {gardenLoading && (
                      <>
                        {[...Array(6)].map((_, idx) => (
                          <View key={`garden-skel-${idx}`}>
                            <View style={styles.skeletonRow}>
                              <View style={styles.skeletonAvatar} />
                              <View style={styles.skeletonNameBar} />
                            </View>
                            {idx < 5 && <View style={styles.listDivider} />}
                          </View>
                        ))}
                      </>
                    )}
                    {!gardenLoading && (gardenOptions || [])
                      .filter(garden => garden != null && (garden?.name || '').toLowerCase().includes(gardenSearch.toLowerCase()))
                      .map((garden, idx) => {
                        if (!garden) return null;
                        const gardenName = garden.name || '';
                        const gardenSellerName = garden.sellerName || '';
                        const gardenSellerAvatar = garden.sellerAvatar || '';
                        const isSelected = selectedGardens.some(g => (g?.name || g?.id) === (garden.name || garden.id));
                        return (
                          <View key={`${gardenName}-${idx}`}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              delayPressIn={200}
                              onPress={() => {
                                setSelectedGardens(prev => isSelected ? prev.filter(g => g.name !== garden.name) : [...prev, garden]);
                              }}
                              style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 39}}
                            >
                              <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                {gardenSellerAvatar ? (
                                  <Image source={{uri: gardenSellerAvatar}} style={{width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#539461'}} />
                                ) : (
                                  <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#48A7F8', borderWidth: 1, borderColor: '#539461', alignItems: 'center', justifyContent: 'center'}}>
                                    <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF'}}>
                                      {(gardenSellerName || gardenName || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={{flex: 1, marginLeft: 8}}>
                                  <Text style={[styles.typeRowText, {fontWeight: '700', color: '#202325'}]} numberOfLines={1}>{gardenName}</Text>
                                  {gardenSellerName && (
                                    <Text style={[styles.typeRowText, {fontSize: 12, color: '#647276', marginTop: 2}]} numberOfLines={1}>{gardenSellerName}</Text>
                                  )}
                                </View>
                              </View>
                                <View style={[styles.checkboxSquare, isSelected ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
                                  {isSelected && (
                                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                                      <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </Svg>
                                  )}
                                </View>
                              </TouchableOpacity>
                            {idx < gardenOptions.length - 1 && <View style={styles.listDivider} />}
                          </View>
                        );
                      })}
                    {!gardenLoading && (!gardenOptions || gardenOptions.length === 0) && (
                      <Text style={[styles.genusHint, {marginLeft: 16}]}>No gardens</Text>
                    )}
                  </ScrollView>
                  <View style={[styles.genusActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity style={styles.genusClearBtn} onPress={() => setSelectedGardens([])}>
                      <Text style={styles.genusClearText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.genusApplyBtn} onPress={() => setShowGardenSheet(false)}>
                      <Text style={styles.genusApplyText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Buyer Modal */}
      <Modal transparent visible={showBuyerSheet} onRequestClose={() => setShowBuyerSheet(false)} animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setShowBuyerSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.genusSheetWrapper}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} style={{flex: 1}}>
                  <SafeAreaView style={{flex: 1}}>
                    {/* Header */}
                  <View style={styles.genusHeader}>
                    <Text style={styles.genusTitle}>Buyer</Text>
                    <TouchableOpacity onPress={() => setShowBuyerSheet(false)}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path fillRule="evenodd" clipRule="evenodd" d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z" fill="#7F8D91"/>
                      </Svg>
                    </TouchableOpacity>
                  </View>

                    {/* Content Area */}
                    <View style={styles.genusContentContainer}>
                      {/* Search Bar */}
                      <View style={styles.inputRow}> 
                      <TextInput
                        style={styles.input}
                        placeholder="Search buyer"
                        placeholderTextColor="#647276"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={buyerSearch}
                        onChangeText={setBuyerSearch}
                      />
                    </View>

                      {/* Scrollable List */}
                  <ScrollView
                        style={styles.genusListContainer}
                        contentContainerStyle={styles.genusListContentContainer}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                        bounces={true}
                        showsVerticalScrollIndicator={true}
                  >
                    {buyerLoading && (
                      <>
                        {[...Array(6)].map((_, idx) => (
                          <View key={`buyer-skel-${idx}`}>
                            <View style={styles.skeletonRow}> 
                              <View style={styles.skeletonAvatar} />
                              <View style={styles.skeletonNameBar} />
                            </View>
                            {idx < 5 && <View style={styles.listDivider} />}
                          </View>
                        ))}
                      </>
                    )}
                    {!buyerLoading && buyerOptions.map((buyer, idx) => {
                      const isSelected = selectedBuyers.some(b => b.id === buyer.id);
                      return (
                        <View key={`${buyer.id}-${idx}`}>
                              <TouchableOpacity
                                activeOpacity={0.7}
                                delayPressIn={200}
                                onPress={() => {
                                  setSelectedBuyers(prev => isSelected ? prev.filter(b => b.id !== buyer.id) : [...prev, buyer]);
                                }}
                                style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 39}}
                              >
                            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                              {buyer.avatar ? (
                                <Image source={{uri: buyer.avatar}} style={{width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#539461', marginRight: 8}} />
                              ) : (
                                <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#48A7F8', borderWidth: 1, borderColor: '#539461', alignItems: 'center', justifyContent: 'center', marginRight: 8}}>
                                  <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF'}}>
                                    {(buyer.firstName || buyer.name || 'U').charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View style={{flex: 1}}>
                                {(buyer.firstName || buyer.lastName) ? (
                                  <Text style={[styles.typeRowText, {fontWeight: '700', color: '#202325'}]} numberOfLines={1}>
                                    {[buyer.firstName, buyer.lastName].filter(Boolean).join(' ')}
                                  </Text>
                                ) : (
                                  <Text style={[styles.typeRowText, {fontWeight: '700', color: '#202325'}]} numberOfLines={1}>{buyer.name}</Text>
                                )}
                                {buyer.username && (
                                  <Text style={[styles.typeRowText, {fontSize: 12, color: '#647276', marginTop: 2}]} numberOfLines={1}>@{buyer.username}</Text>
                                )}
                              </View>
                            </View>
                              <View style={[styles.checkboxSquare, isSelected ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
                                {isSelected && (
                                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                                    <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </Svg>
                                )}
                              </View>
                            </TouchableOpacity>
                          {idx < buyerOptions.length - 1 && <View style={styles.listDivider} />}
                        </View>
                      );
                    })}
                        {!buyerLoading && (!buyerOptions || buyerOptions.length === 0) && (
                          <Text style={[styles.genusHint, {marginLeft: 16}]}>No buyers</Text>
                        )}
                  </ScrollView>
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.genusActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity style={styles.genusClearBtn} onPress={() => setSelectedBuyers([])}>
                      <Text style={styles.genusClearText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.genusApplyBtn} onPress={() => setShowBuyerSheet(false)}>
                      <Text style={styles.genusApplyText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  </SafeAreaView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal transparent visible={showDeleteModal} onRequestClose={() => setShowDeleteModal(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteModalContainer}>
                <View style={styles.deleteModalContent}>
                  <View style={styles.deleteModalText}>
                    <Text style={styles.deleteModalTitle}>Delete Discount</Text>
                    <Text style={styles.deleteModalMessage}>Are you sure you want to delete this discount code? This action cannot be undone.</Text>
                  </View>
                  <View style={styles.deleteModalActions}>
                    <TouchableOpacity 
                      style={[styles.deleteModalDeleteBtn, isDeleting && { opacity: 0.6 }]} 
                      onPress={async () => {
                        // Get discountId from state or route params
                        const finalDiscountId = discountId || route?.params?.discountId || route?.params?.id;
                        
                        if (!finalDiscountId) {
                          Alert.alert('Error', 'Discount ID is missing. Cannot delete discount.');
                      setShowDeleteModal(false);
                          return;
                        }

                        setIsDeleting(true);

                        try {
                          console.log('🗑️ Deleting discount:', finalDiscountId);
                          const result = await deleteDiscountApi(finalDiscountId);
                          
                          if (result.success) {
                            // Navigate back immediately with refresh flag
                            navigation.navigate('AdminDiscounts', { refresh: true });
                            
                            Alert.alert('Success', 'Discount code deleted successfully!', [
                              { text: 'OK' }
                            ]);
                            setShowDeleteModal(false);
                          } else {
                            Alert.alert('Error', result.error || 'Failed to delete discount code');
                          }
                        } catch (error) {
                          console.error('Error deleting discount:', error);
                          Alert.alert('Error', error.message || 'An unexpected error occurred while deleting the discount');
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <Text style={styles.deleteModalDeleteText}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteModalCancelBtn, isDeleting && { opacity: 0.6 }]} 
                      onPress={() => {
                        if (!isDeleting) {
                          setShowDeleteModal(false);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <Text style={styles.deleteModalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default EditDiscount;

const styles = StyleSheet.create({
  header: {
    height: 58,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  headerRight: {
    marginLeft: 'auto',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 34,
  },
  codeSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  inputRow: {
    minHeight: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
  },
  helper: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  reqAsterisk: {
    color: '#E7522F',
  },
  dividerStrip: {
    paddingVertical: 8,
    width: '100%',
  },
  divider: {
    width: '100%',
    height: 12,
    backgroundColor: '#F5F6F6',
  },
  sectionPad: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dummySection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dummyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#7F8D91',
  },
  startDateSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    width: '100%',
  },
  endDateSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  actionSection: {
    paddingHorizontal: 15,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 12,
  },
  saveBtn: {
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 32,
    backgroundColor: '#7F8D91',
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 1000,
    backgroundColor: '#FFFFFF',
  },
  buyerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  genusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  genusTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  genusActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingBottom: 0,
  },
  genusClearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genusClearText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#539461',
  },
  genusApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genusApplyText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    width: 340,
    height: 206,
    alignItems: 'flex-start',
  },
  deleteModalContent: {
    width: 340,
    height: 150,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  deleteModalText: {
    width: 340,
    height: 86,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  deleteModalTitle: {
    width: 292,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
  },
  deleteModalMessage: {
    width: 292,
    height: 40,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#647276',
  },
  deleteModalActions: {
    width: 340,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  deleteModalDeleteBtn: {
    width: 340,
    height: 48,
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#CDD3D4',
  },
  deleteModalDeleteText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#E7522F',
  },
  deleteModalCancelBtn: {
    width: 340,
    height: 48,
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
  },
  deleteModalCancelText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  inputValue: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    backgroundColor: '#539461',
  },
  radioOuterDefault: {
    borderWidth: 1,
    borderColor: '#647276',
    backgroundColor: '#FFFFFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  prefixBox: {
    minHeight: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F6',
  },
  suffixBox: {
    minHeight: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F6',
  },
  suffixText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  appliesListWrap: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F5F6F6',
  },
  appliesCard: {
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appliesCardText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#414649',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
  },
  listingTypeSheetContainer: {
    width: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  typeRowWrapper: {
    height: 48,
    width: 340,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  typeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    height: 48,
    width: 324,
    gap: 8,
  },
  typeRowText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  typeDivider: {
    width: 340,
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  typeSheetContainer: {
    width: 340,
    height: 121,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  appliesSheetContainer: {
    width: 340,
    height: 268,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  countrySheetContainer: {
    width: 340,
    height: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  genusSheetWrapper: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: 620, height: '80%', width: '100%' },
  genusSheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  genusContentContainer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0, flex: 1 },
  genusListContainer: { flex: 1, marginTop: 16 },
  genusListContentContainer: { paddingHorizontal: 24, paddingBottom: 8 },
  genusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingLeft: 0,
    paddingRight: 0,
  },
  genusRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    paddingRight: 12,
  },
  genusRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  genusHint: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    marginRight: 8,
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareSelected: {
    backgroundColor: '#539461',
  },
  checkboxSquareDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
  },
  buyerSheetContainer: {
    width: '100%',
    height: 569,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
  },
  listDivider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
    width: '100%',
  },
  genusSkeletonText: { width: 120, height: 16, backgroundColor: '#E9ECEF', borderRadius: 8 },
  genusSkeletonCheckbox: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#E9ECEF', borderWidth: 1, borderColor: '#E4E7E9' },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 39,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  skeletonNameBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    marginLeft: 8,
  },
  
  // Full listing card styles
  appliesListWrapListings: { paddingVertical: 12, backgroundColor: '#F5F6F6', width: '100%' },
  listingCardFull: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    width: '100%',
    marginBottom: 12,
    position: 'relative',
    alignSelf: 'stretch',
  },
  plantCardFull: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    minHeight: 194,
    marginBottom: 12,
    gap: 12,
  },
  imageContainerFull: {
    width: 96,
    height: 128,
    marginRight: 12,
  },
  imageFull: {
    width: 96,
    height: 128,
    borderRadius: 8,
  },
  listingRemoveButtonInline: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailsContainerFull: {
    flex: 1,
    gap: 4,
  },
  nameSectionFull: {
    gap: 4,
    alignSelf: 'stretch',
    width: '100%',
  },
  codeRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: 8,
    alignSelf: 'stretch',
  },
  codeContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  plantCodeFull: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  helpIconContainerFull: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginLeft: 0,
  },
  tooltipContainerFull: {
    position: 'relative',
  },
  tooltipFull: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    backgroundColor: '#539461',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
    minWidth: 80,
  },
  tooltipTextFull: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  countryContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  countryTextFull: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  genusSpeciesFull: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    height: 48,
    alignSelf: 'stretch',
  },
  variegationRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    gap: 6,
    alignSelf: 'stretch',
  },
  variegationTextFull: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  dividerDotFull: {
    width: 4,
    maxWidth: 4,
    height: 4,
    maxHeight: 4,
    borderRadius: 2,
    backgroundColor: '#7F8D91',
    paddingVertical: 4,
  },
  sizeTextFull: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  badgeRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 6,
    alignSelf: 'stretch',
  },
  listingTypeBadgeFull: {
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 1,
    backgroundColor: '#202325',
    borderRadius: 6,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTypeTextFull: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  discountBadgeFull: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  discountPercentTextFull: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  discountOffTextFull: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  priceRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    minHeight: 32,
    gap: 4,
    alignSelf: 'stretch',
  },
  priceTextFull: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
  },
  originalPriceTextFull: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    textDecorationLine: 'line-through',
  },
  detailsSectionFull: {
    paddingHorizontal: 6,
    paddingVertical: 0,
    gap: 8,
    alignSelf: 'stretch',
    minHeight: 44,
  },
  userContainerFull: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    minHeight: 44,
  },
  avatarFull: {
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 8,
  },
  avatarPlaceholderFull: {
    backgroundColor: '#48A7F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarTextFull: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  userContentFull: {
    flex: 1,
    minHeight: 44,
  },
  sellerNameRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    marginBottom: 4,
    alignSelf: 'stretch',
    flexWrap: 'wrap',
  },
  sellerNameFull: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    marginRight: 4,
  },
  sellerUsernameFull: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
  },
  roleRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    alignSelf: 'stretch',
  },
  sellerRoleFull: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
});

