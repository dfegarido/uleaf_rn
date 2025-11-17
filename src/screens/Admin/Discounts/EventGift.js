import React, {useEffect, useState} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Dimensions, KeyboardAvoidingView, Platform, Alert, Keyboard, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import NetInfo from '@react-native-community/netinfo';
import { getListingTypeApi } from '../../../components/Api/getListingTypeApi';
import { getCountryApi } from '../../../components/Api/dropdownApi';
import { getAllUsersApi } from '../../../components/Api/getAllUsersApi';
import { searchBuyersApi } from '../../../components/Api/searchBuyersApi';
import { createDiscountApi } from '../../../components/Api/discountApi';
import FlagTH from '../../../assets/country-flags/TH.svg';
import FlagID from '../../../assets/country-flags/ID.svg';
import FlagPH from '../../../assets/country-flags/PH.svg';
import { getAllPlantGenusApi } from '../../../components/Api/dropdownApi';

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

const EventGift = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const isFixed = false;
  const [code, setCode] = useState('');
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
  
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
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
  const [buyerKeyboardOffset, setBuyerKeyboardOffset] = useState(0);
  const [timeKeyboardOffset, setTimeKeyboardOffset] = useState(0);

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
  const [eligibility, setEligibility] = useState('All customers');
  const [minRequirement, setMinRequirement] = useState('No minimum requirements');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [minPurchaseQuantity, setMinPurchaseQuantity] = useState('');
  const [discountType, setDiscountType] = useState(isFixed ? 'Fixed amount' : 'Percentage');
  // Starts date controls
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00 AM');
  const [showStartDateSheet, setShowStartDateSheet] = useState(false);
  const [showStartTimeSheet, setShowStartTimeSheet] = useState(false);
  const [tempHour, setTempHour] = useState('00');
  const [tempMinute, setTempMinute] = useState('00');
  const [tempAmPm, setTempAmPm] = useState('AM');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  // Maximum discount uses
  const [limitTotalEnabled, setLimitTotalEnabled] = useState(true);
  const [limitPerCustomerEnabled, setLimitPerCustomerEnabled] = useState(false);
  const [maxUsesTotal, setMaxUsesTotal] = useState('');
  // End date controls
  const [endDateEnabled, setEndDateEnabled] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('00:00 AM');
  const [showEndDateSheet, setShowEndDateSheet] = useState(false);
  const [showEndTimeSheet, setShowEndTimeSheet] = useState(false);
  const [tempEndHour, setTempEndHour] = useState('00');
  const [tempEndMinute, setTempEndMinute] = useState('00');
  const [tempEndAmPm, setTempEndAmPm] = useState('AM');
  const [endCalendarMonth, setEndCalendarMonth] = useState(() => new Date());
  const [endTimeKeyboardOffset, setEndTimeKeyboardOffset] = useState(0);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [typeSheetTop, setTypeSheetTop] = useState(0);
  const [appliesSheetTop, setAppliesSheetTop] = useState(0);
  const dropdownRef = React.useRef(null);
  const appliesRef = React.useRef(null);
  const [isCreating, setIsCreating] = useState(false);
  // Event detail checkboxes
  const [freeUpsShipping, setFreeUpsShipping] = useState(false);
  const [freeAirCargo, setFreeAirCargo] = useState(false);

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
        // silent fail; keep list empty
      }
    };
    loadListingTypes();
  }, []);

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
    const loadCountries = async () => {
      if (!showCountrySheet) return;
      try {
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) return;
        const res = await getCountryApi();
        if (res?.success && Array.isArray(res.data)) {
          // normalize: array of objects with name field
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
        
        // Convert map to array and sort
        const gardenArray = Array.from(gardenMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        setGardenOptions(gardenArray);
      } catch (e) {
        setGardenOptions([]);
      } finally {
        setGardenLoading(false);
      }
    };
    loadGardens();
  }, [showGardenSheet, gardenOptions.length]);

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

  useEffect(() => {
    const loadBuyers = async () => {
      if (!showBuyerSheet) return;
      try {
        setBuyerLoading(true);
        // Reset search when modal opens
        setBuyerSearch('');
        
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
        setBuyerOptions(uniqueBuyers);
      } catch (e) {
        console.error('Failed to load buyers:', e);
        setBuyerOptions([]);
      } finally {
        setBuyerLoading(false);
      }
    };
    loadBuyers();
  }, [showBuyerSheet]);

  // Subtle upward shift of buyer sheet when keyboard is visible
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e) => {
      const kbHeight = e?.endCoordinates?.height || 0;
      const capped = Math.min(kbHeight, 220); // move a little, not full height
      setBuyerKeyboardOffset(capped);
    };
    const onHide = () => setBuyerKeyboardOffset(0);

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow?.remove?.();
      subHide?.remove?.();
    };
  }, []);

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

  useEffect(() => {
    if (!showBuyerSheet) {
      // Clear search when modal closes
      setBuyerSearch('');
      return;
    }
    const q = buyerSearch.trim();
    
    // Don't run search effect if search is empty and we haven't loaded initial data yet
    // This prevents clearing the list when modal first opens
    if (q.length === 0 && buyerOptions.length === 0) {
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
          setBuyerOptions(normalized);
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
          setBuyerOptions(normalized);
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
    }, 800);
    return () => {
      if (buyerSearchDebounceRef.current) {
        clearTimeout(buyerSearchDebounceRef.current);
      }
    };
  }, [buyerSearch, showBuyerSheet, buyerOptions.length]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
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
        <Text style={styles.headerTitle}>Event Gift</Text>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 24}} showsVerticalScrollIndicator={false}>
        {/* Code */}
        <View style={styles.sectionPad}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Discount code<Text style={styles.reqAsterisk}>*</Text></Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter code (e.g. SUMMER25)"
                placeholderTextColor="#647276"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.helper}>This is the code buyers will enter at checkout</Text>
          </View>
        </View>
        <View style={styles.dividerStrip} />

        {/* Event detail */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Event detail</Text>
          <TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setFreeUpsShipping(prev => !prev)}>
            <View style={[styles.checkboxSquare, freeUpsShipping ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
              {freeUpsShipping && (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.optionText}>Free UPS shipping</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setFreeAirCargo(prev => !prev)}>
            <View style={[styles.checkboxSquare, freeAirCargo ? styles.checkboxSquareSelected : styles.checkboxSquareDefault]}>
              {freeAirCargo && (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.optionText}>Free air cargo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dividerStrip} />

        {/* Type */}
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
                    const maxTop = SCREEN.height - 121 - 16; // panel height + bottom margin
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

        {/* Discount percent */}
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
              <View style={[styles.suffixBox]}> 
                <Text style={styles.suffixText}>{isFixed ? '$OFF' : '%OFF'}</Text>
              </View>
            </View>
          </View>
        </View>
        {!isFixed && (
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

        {/* Applies */}
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
                  {appliesText === 'Specific genus' ? 'Add genus' : appliesText === 'Specific country' ? 'Add country' : appliesText === 'Specific garden' ? 'Add garden' : appliesText === 'Specific listing' ? 'Add listing' : 'Add listing type'}
                </Text>
              </TouchableOpacity>
          </View>
        </View>
        {!!selectedListingTypes.length && appliesText !== 'Specific genus' && (
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
        {!!selectedGardens.length && appliesText === 'Specific garden' && (
          <View style={styles.appliesListWrap}>
            {selectedGardens.map((garden, idx) => {
              const gardenName = typeof garden === 'string' ? garden : (garden?.name || '');
              const gardenSellerName = typeof garden === 'object' ? (garden?.sellerName || '') : '';
              const gardenSellerAvatar = typeof garden === 'object' ? (garden?.sellerAvatar || '') : '';
              return (
                <View key={`${gardenName}-${idx}`} style={[styles.appliesCard, selectedGardens.length > 1 && idx < selectedGardens.length - 1 && {marginBottom: 8}]}>
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
                  <TouchableOpacity onPress={() => setSelectedGardens(prev => prev.filter(item => (typeof item === 'string' ? item !== gardenName : item.name !== gardenName)))}>
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
              // Handle seller data - can be string or object
              const sellerData = listing.seller || listing.sellerInfo || listing.user || {};
              let sellerName = '';
              let sellerUsername = '';
              let sellerAvatar = '';
              
              if (typeof sellerData === 'string') {
                sellerName = sellerData;
                sellerUsername = listing.sellerUsername || listing.sellerEmail || listing.username || '';
              } else if (sellerData && typeof sellerData === 'object' && !Array.isArray(sellerData)) {
                sellerName = sellerData.name || 
                            sellerData.firstName || 
                            sellerData.fullName || 
                            (sellerData.firstName && sellerData.lastName ? `${sellerData.firstName} ${sellerData.lastName}` : '') ||
                            listing.sellerName || 
                            listing.gardenOrCompanyName ||
                            '';
                sellerUsername = sellerData.username || 
                                sellerData.email || 
                                listing.sellerUsername || 
                                listing.sellerEmail ||
                                listing.username ||
                                '';
                sellerAvatar = sellerData.avatar || 
                              sellerData.profileImage || 
                              sellerData.profilePicture ||
                              listing.sellerAvatar ||
                              '';
              } else {
                sellerName = listing.sellerName || listing.gardenOrCompanyName || listing.garden || '';
                sellerUsername = listing.sellerUsername || listing.sellerEmail || listing.username || '';
                sellerAvatar = listing.sellerAvatar || '';
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
          {['No minimum requirements', 'Minimum purchase amount ($)', 'Minimum quantity of plants'].map((label, idx) => {
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
          {minRequirement === 'Minimum purchase amount ($)' && (
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
          {minRequirement === 'Minimum quantity of plants' && (
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
          {/* First checkbox: Limit number of times this discount can be used in total */}
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

          {/* Second checkbox: Limit to one use of customer */}
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
        

        {/* Start date (same as base screen) */}
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

        {/* End date toggle */}
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

        {/* Summary */}
        <View style={styles.boxSpecs}> 
          <Text style={styles.boxTitle}>Discount Summary</Text>
          <View style={styles.boxDetails}>
            <View style={styles.boxRow}><Text style={styles.boxLabel}>Code</Text><Text style={styles.boxValue}>{code || '—'}</Text></View>
            <View style={styles.boxRow}><Text style={styles.boxLabel}>Type</Text><Text style={styles.boxValue}>Event Gift</Text></View>
            <View style={styles.boxRow}>
              <Text style={styles.boxLabel}>Event detail</Text>
              <Text style={styles.boxValue}>
                {(() => {
                  if (freeUpsShipping && freeAirCargo) {
                    return 'Free UPS shipping & air cargo';
                  } else if (freeUpsShipping) {
                    return 'Free UPS shipping';
                  } else if (freeAirCargo) {
                    return 'Free air cargo';
                  }
                  return '—';
                })()}
              </Text>
            </View>
            <View style={styles.boxRow}><Text style={styles.boxLabel}>Applies to</Text><Text style={styles.boxValue}>{appliesText}</Text></View>
          </View>
          <View style={styles.boxDivider} />
          <Text style={styles.sectionTitle}>Details</Text>
          {isFixed ? (
            <View style={styles.boxList}>
              <Text style={styles.boxListItem}>{'\u2022'} For specific customer(s)</Text>
              <Text style={styles.boxListItem}>{'\u2022'} Minimum quantity of 10 plants</Text>
              <Text style={styles.boxListItem}>{'\u2022'} Limited to one use per customer</Text>
            </View>
          ) : (
            <View style={styles.boxList}>
              <Text style={styles.boxListItem}>{'\u2022'} For {eligibility.toLowerCase()}</Text>
              <Text style={styles.boxListItem}>{'\u2022'} {minRequirement === 'Minimum purchase amount ($)' && minPurchaseAmount ? `Minimum purchase amount of $${minPurchaseAmount}` : minRequirement === 'Minimum quantity of plants' && minPurchaseQuantity ? `Minimum quantity of ${minPurchaseQuantity} plants` : minRequirement}</Text>
              <Text style={styles.boxListItem}>{'\u2022'} Limited to {maxUsesTotal || '100'} total of use</Text>
            </View>
          )}
        </View>

        {/* Action */}
        <View style={styles.actionWrap}>
          <TouchableOpacity 
            style={[styles.primaryBtn, isCreating && { opacity: 0.6 }]}
            onPress={async () => {
              // Validate required fields
              if (!code.trim()) {
                Alert.alert('Error', 'Please enter a discount code');
                return;
              }
              if (!discountPercent) {
                Alert.alert('Error', 'Please enter a discount percentage');
                return;
              }
              if (!startDate || !startTime) {
                Alert.alert('Error', 'Please select a start date and time');
                return;
              }

              setIsCreating(true);

              try {
                // Prepare discount data
                const discountData = {
                  code: code.trim(),
                  type: 'eventGift',
                  discountPercent: parseFloat(discountPercent),
                  maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
                  startDate,
                  startTime,
                  endDate: endDateEnabled ? endDate : undefined,
                  endTime: endDateEnabled ? endTime : undefined,
                  appliesText,
                  selectedListingTypes,
                  selectedGenus,
                  selectedCountries,
                  selectedGardens,
                  selectedListings: selectedListings.map(l => l.id),
                  eligibility,
                  minRequirement,
                  limitTotalEnabled,
                  limitPerCustomerEnabled,
                  maxUsesTotal: limitTotalEnabled ? maxUsesTotal : undefined,
                  selectedBuyers: eligibility === 'Specific customers' ? selectedBuyers.map(b => b.id) : undefined,
                };

                console.log('Create Event Gift Discount:', discountData);
                
                const result = await createDiscountApi(discountData);
                
                if (result.success) {
                  Alert.alert('Success', 'Discount code created successfully!', [
                    { text: 'OK', onPress: () => {
                      // Navigate back to AdminDiscounts screen with refresh flag
                      navigation.navigate('AdminDiscounts', { refresh: true });
                    }}
                  ]);
                } else {
                  Alert.alert('Error', result.error || 'Failed to create discount code');
                }
              } catch (error) {
                console.error('Error creating discount:', error);
                Alert.alert('Error', error.message || 'An unexpected error occurred');
              } finally {
                setIsCreating(false);
              }
            }}
            activeOpacity={0.8}
            disabled={isCreating}
          >
            <Text style={styles.primaryBtnText}>
              {isCreating ? 'Saving...' : 'Save discount'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Discount type modal */}
      <Modal transparent visible={showTypeSheet} onRequestClose={() => setShowTypeSheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowTypeSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.typeSheetContainer, {position: 'absolute', left: (SCREEN.width - 340) / 2, top: typeSheetTop}] }>
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { 
                    setDiscountType('Percentage'); 
                    setShowTypeSheet(false); 
                  }}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path fillRule="evenodd" clipRule="evenodd" d="M10.1242 4.41999C9.84532 4.66024 9.51249 4.91023 9.12843 5.06922L9.12833 5.06926C8.74966 5.22595 8.34051 5.2791 7.98032 5.30245C7.74519 5.3177 7.48258 5.32176 7.24307 5.32547C7.12848 5.32724 7.01917 5.32893 6.92069 5.33173C6.19853 5.35223 5.83088 5.44103 5.63595 5.63595C5.44103 5.83088 5.35223 6.19853 5.33173 6.92069C5.32893 7.01917 5.32724 7.12848 5.32547 7.24307C5.32176 7.48258 5.3177 7.74519 5.30245 7.98032C5.2791 8.34051 5.22595 8.74966 5.06926 9.12833L5.06879 9.12948C4.9097 9.51213 4.65971 9.84419 4.41979 10.1224C4.25548 10.313 4.06592 10.5108 3.89398 10.6903C3.82159 10.7659 3.75231 10.8382 3.68936 10.9053C3.45757 11.1525 3.2784 11.3623 3.15646 11.56C3.03755 11.7528 3 11.8915 3 12C3 12.1085 3.03755 12.2472 3.15646 12.44C3.2784 12.6377 3.45757 12.8475 3.68936 13.0947C3.75231 13.1618 3.82159 13.2341 3.89398 13.3097C4.06592 13.4892 4.25548 13.687 4.41979 13.8776C4.65971 14.1558 4.9097 14.4879 5.06879 14.8705L5.06935 14.8719C5.22595 15.2507 5.2791 15.6598 5.30245 16.0201C5.3177 16.2552 5.32176 16.5178 5.32547 16.7573C5.32724 16.8719 5.32893 16.9812 5.33173 17.0797C5.35222 17.8016 5.44101 18.1691 5.63595 18.364C5.83088 18.559 6.19853 18.6478 6.92069 18.6683C7.01917 18.6711 7.12847 18.6728 7.24305 18.6745C7.48257 18.6782 7.74518 18.6823 7.98032 18.6975C8.34051 18.7209 8.74966 18.774 9.12833 18.9307L9.12948 18.9312C9.51213 19.0903 9.84419 19.3403 10.1224 19.5802C10.313 19.7445 10.5108 19.9341 10.6903 20.106C10.7659 20.1784 10.8382 20.2477 10.9053 20.3106C11.1525 20.5424 11.3623 20.7216 11.56 20.8435C11.7528 20.9625 11.8915 21 12 21C12.1085 21 12.2472 20.9625 12.44 20.8435C12.6377 20.7216 12.8475 20.5424 13.0947 20.3106C13.1618 20.2477 13.2341 20.1784 13.3097 20.106C13.4892 19.9341 13.687 19.7445 13.8776 19.5802C14.1558 19.3403 14.4879 19.0903 14.8705 18.9312L14.8719 18.9306C15.2507 18.774 15.6598 18.7209 16.0201 18.6975C16.2552 18.6823 16.5178 18.6782 16.7573 18.6745C16.8719 18.6728 16.9812 18.6711 17.0797 18.6683C17.8016 18.6478 18.1691 18.559 18.364 18.364C18.559 18.1691 18.6478 17.8016 18.6683 17.0797C18.6711 16.9812 18.6728 16.8719 18.6745 16.7573C18.6782 16.5178 18.6823 16.2552 18.6975 16.0201C18.7209 15.6598 18.774 15.2507 18.9306 14.8719L18.9312 14.8705C19.0903 14.4879 19.3403 14.1558 19.5802 13.8776C19.7445 13.687 19.9341 13.4892 20.106 13.3097C20.1784 13.2341 20.2477 13.1618 20.3106 13.0947C20.5424 12.8475 20.7216 12.6377 20.8435 12.44C20.9625 12.2472 21 12.1085 21 12C21 11.8916 20.9625 11.7533 20.8438 11.5611C20.7219 11.3638 20.5429 11.1544 20.3109 10.9074C20.2487 10.8411 20.1803 10.7698 20.1089 10.6953C19.9361 10.5151 19.7455 10.3162 19.58 10.1242C19.3398 9.84532 19.0898 9.51249 18.9308 9.12843L18.9306 9.12811C18.774 8.74933 18.7209 8.34019 18.6975 7.97992C18.6823 7.74477 18.6782 7.48218 18.6745 7.24269C18.6728 7.12811 18.6711 7.01881 18.6683 6.92034C18.6478 6.19838 18.559 5.8309 18.364 5.63595C18.1691 5.44101 17.8016 5.35222 17.0797 5.33173C16.9812 5.32893 16.8719 5.32724 16.7573 5.32547C16.5178 5.32176 16.2552 5.3177 16.0201 5.30245C15.6598 5.2791 15.2507 5.22595 14.8719 5.06935L14.8705 5.06879C14.4879 4.9097 14.1558 4.65971 13.8776 4.41979C13.687 4.25548 13.4892 4.06592 13.3097 3.89398C13.2341 3.82159 13.1618 3.75231 13.0947 3.68936C12.8475 3.45757 12.6377 3.2784 12.44 3.15646C12.2472 3.03755 12.1085 3 12 3C11.8916 3 11.7533 3.03746 11.5611 3.15622C11.3638 3.27808 11.1544 3.45714 10.9074 3.68906C10.8411 3.75131 10.7698 3.81969 10.6953 3.89113C10.5151 4.06385 10.3162 4.25452 10.1242 4.41999ZM10.7727 1.88009C11.1106 1.67136 11.5225 1.5 12 1.5C12.4774 1.5 12.8895 1.67128 13.2276 1.87985C13.5607 2.08539 13.8618 2.35235 14.1207 2.59517C14.2143 2.68291 14.3007 2.76578 14.3833 2.845C14.5476 3.00246 14.6968 3.14552 14.8572 3.28383C15.0905 3.48502 15.2805 3.61464 15.4457 3.68344C15.5975 3.74605 15.8126 3.78586 16.1171 3.80559C16.3181 3.81862 16.5114 3.82144 16.7248 3.82456C16.8487 3.82637 16.9793 3.82828 17.1222 3.83233C17.7873 3.85121 18.7572 3.90774 19.4247 4.57529C20.0923 5.24285 20.1488 6.21271 20.1677 6.87778C20.1717 7.02069 20.1736 7.15133 20.1754 7.27517C20.1786 7.48865 20.1814 7.6819 20.1944 7.88288C20.2142 8.18761 20.254 8.40287 20.3167 8.55469C20.3855 8.72095 20.5152 8.91159 20.7164 9.14505C20.8553 9.30622 20.9992 9.45628 21.1578 9.62153C21.2361 9.70317 21.318 9.78851 21.4045 9.88073C21.6472 10.1392 21.9143 10.4399 22.1199 10.7727C22.3286 11.1106 22.5 11.5225 22.5 12C22.5 12.4774 22.3287 12.8895 22.1202 13.2276C21.9146 13.5607 21.6476 13.8618 21.4048 14.1207C21.3171 14.2143 21.2342 14.3007 21.155 14.3833C20.9975 14.5476 20.8545 14.6968 20.7162 14.8572C20.5149 15.0905 20.3853 15.2806 20.3165 15.4458C20.2539 15.5976 20.2141 15.8127 20.1944 16.1171C20.1814 16.3181 20.1786 16.5113 20.1754 16.7248C20.1736 16.8487 20.1717 16.9793 20.1677 17.1222C20.0923 17.7873 20.0923 18.7572 19.4247 19.4247C18.7572 20.0923 17.7873 20.1488 17.1222 20.1677C16.9793 20.1717 16.8487 20.1736 16.7248 20.1754C16.5113 20.1786 16.3181 20.1814 16.1171 20.1944C15.8127 20.2141 15.5976 20.2539 15.4458 20.3165C15.2806 20.3853 15.0905 20.5149 14.8572 20.7162C14.6968 20.8545 14.5476 20.9975 14.3833 21.155C14.3007 21.2342 14.2143 21.3171 14.1207 21.4048C13.8618 21.6476 13.5607 21.9146 13.2276 22.1202C12.8895 22.3287 12.4774 22.5 12 22.5C11.5226 22.5 11.1105 22.3287 10.7724 22.1202C10.4393 21.9146 10.1382 21.6476 9.87929 21.4048C9.78572 21.3171 9.69929 21.2342 9.61667 21.155C9.45243 20.9975 9.30322 20.8545 9.14283 20.7162C8.90954 20.515 8.71951 20.3854 8.55436 20.3166C8.4029 20.254 8.18791 20.2142 7.88327 20.1944C7.68231 20.1814 7.48904 20.1786 7.27553 20.1754C7.15169 20.1736 7.02104 20.1717 6.87813 20.1677C6.21303 20.1488 5.24287 20.0923 4.57529 19.4247C3.90774 18.7572 3.85121 17.7873 3.83233 17.1222C3.82828 16.9793 3.82637 16.8487 3.82456 16.7248C3.82144 16.5114 3.81862 16.3181 3.80559 16.1171C3.78586 15.8126 3.74605 15.5975 3.68344 15.4457C3.61464 15.2805 3.48502 15.0905 3.28383 14.8572C3.14552 14.6968 3.00246 14.5476 2.845 14.3833C2.76578 14.3007 2.68291 14.2143 2.59517 14.1207C2.35235 13.8618 2.08539 13.5607 1.87985 13.2276C1.67128 12.8895 1.5 12.4774 1.5 12C1.5 11.5226 1.67128 11.1105 1.87985 10.7724C2.08539 10.4393 2.35235 10.1382 2.59517 9.87929C2.68291 9.78572 2.76578 9.69929 2.845 9.61666C3.00246 9.45242 3.14552 9.30321 3.28383 9.14283C3.48505 8.90948 3.61468 8.71941 3.68347 8.55424C3.74602 8.40278 3.78585 8.18782 3.80559 7.88327C3.81862 7.68232 3.82144 7.48906 3.82456 7.27555C3.82637 7.15171 3.82828 7.02105 3.83233 6.87814C3.85121 6.21303 3.90772 5.24287 4.57529 4.57529C5.24287 3.90772 6.21303 3.85121 6.87814 3.83233C7.02105 3.82828 7.15171 3.82637 7.27555 3.82456C7.48906 3.82144 7.68232 3.81862 7.88327 3.80559C8.18813 3.78583 8.40321 3.74594 8.55469 3.68328M10.7727 1.88009C10.4399 2.08571 10.1392 2.35278 9.88073 2.59547L10.7727 1.88009ZM9.88073 2.59547C9.78851 2.68204 9.70317 2.76391 9.62155 2.84223L9.88073 2.59547ZM9.62155 2.84223C9.45628 3.00078 9.30623 3.14475 9.14505 3.28362L9.62155 2.84223ZM9.14505 3.28362C8.91164 3.48472 8.72103 3.6144 8.5548 3.68324L9.14505 3.28362Z" fill="#556065"/>
                      <Path fillRule="evenodd" clipRule="evenodd" d="M9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25ZM6.75 9C6.75 7.75736 7.75736 6.75 9 6.75C10.2426 6.75 11.25 7.75736 11.25 9C11.25 10.2426 10.2426 11.25 9 11.25C7.75736 11.25 6.75 10.2426 6.75 9Z" fill="#556065"/>
                      <Path fillRule="evenodd" clipRule="evenodd" d="M15 14.25C14.5858 14.25 14.25 14.5858 14.25 15C14.25 15.4142 14.5858 15.75 15 15.75C15.4142 15.75 15.75 15.4142 15.75 15C15.75 14.5858 15.4142 14.25 15 14.25ZM12.75 15C12.75 13.7574 13.7574 12.75 15 12.75C16.2426 12.75 17.25 13.7574 17.25 15C17.25 16.2426 16.2426 17.25 15 17.25C13.7574 17.25 12.75 16.2426 12.75 15Z" fill="#556065"/>
                      <Path fillRule="evenodd" clipRule="evenodd" d="M16.2803 7.71967C16.5732 8.01256 16.5732 8.48744 16.2803 8.78033L8.78033 16.2803C8.48744 16.5732 8.01256 16.5732 7.71967 16.2803C7.42678 15.9874 7.42678 15.5126 7.71967 15.2197L15.2197 7.71967C15.5126 7.42678 15.9874 7.42678 16.2803 7.71967Z" fill="#556065"/>
                    </Svg>
                    <Text style={styles.typeRowText}>Percentage</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeDivider} />
                <View style={styles.typeRowWrapper}>
                  <TouchableOpacity style={styles.typeRowLeft} onPress={() => { 
                    setDiscountType('Fixed amount'); 
                    setShowTypeSheet(false); 
                    navigation.replace('AdminDiscountEventGiftFixed');
                  }}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path d="M21 8.25041C21.4142 8.25041 21.75 8.58619 21.75 9.00041C21.75 9.41462 21.4142 9.75041 21 9.75041H4.5C4.08579 9.75041 3.75 9.41462 3.75 9.00041C3.75 8.58619 4.08579 8.25041 4.5 8.25041H21Z" fill="#556065"/>
                      <Path d="M15.7617 3.61662C15.8358 3.20923 16.2264 2.9383 16.6338 3.01213C17.0412 3.0862 17.3121 3.47682 17.2383 3.8842L14.2383 20.3842C14.1642 20.7916 13.7736 21.0625 13.3662 20.9887C12.9588 20.9146 12.6879 20.524 12.7617 20.1166L15.7617 3.61662Z" fill="#556065"/>
                      <Path d="M9.76172 3.61662C9.83579 3.20923 10.2264 2.9383 10.6338 3.01213C11.0412 3.0862 11.3121 3.47682 11.2383 3.8842L8.23828 20.3842C8.16421 20.7916 7.77359 21.0625 7.36621 20.9887C6.95882 20.9146 6.68789 20.524 6.76172 20.1166L9.76172 3.61662Z" fill="#556065"/>
                      <Path d="M19.5 14.2504C19.9142 14.2504 20.25 14.5862 20.25 15.0004C20.25 15.4146 19.9142 15.7504 19.5 15.7504H3C2.58579 15.7504 2.25 15.4146 2.25 15.0004C2.25 14.5862 2.58579 14.2504 3 14.2504H19.5Z" fill="#556065"/>
                    </Svg>
                    <Text style={styles.typeRowText}>Fixed amount</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Start Date modal (bottom sheet) */}
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

      {/* Start Time modal (bottom sheet) */}
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
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (numericText === '' || (parseInt(numericText) >= 1 && parseInt(numericText) <= 12)) {
                              setTempHour(numericText);
                            }
                          }}
                          onFocus={() => {
                            if (tempHour === '00') {
                              setTempHour('');
                            }
                          }}
                          onBlur={() => {
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
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (numericText === '' || (parseInt(numericText) >= 0 && parseInt(numericText) <= 59)) {
                              setTempMinute(numericText);
                            }
                          }}
                          onFocus={() => {
                            if (tempMinute === '00') {
                              setTempMinute('');
                            }
                          }}
                          onBlur={() => {
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
      {/* Garden modal (bottom sheet) */}
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
                          .filter(garden => (garden?.name || '').toLowerCase().includes(gardenSearch.toLowerCase()))
                          .map((garden, idx, filteredList) => {
                            const isSelected = selectedGardens.some(g => (typeof g === 'string' ? g === garden.name : g.name === garden.name));
                            return (
                              <View key={`${garden.name}-${idx}`}>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  delayPressIn={200}
                                  onPress={() => {
                                    setSelectedGardens(prev => isSelected ? prev.filter(g => (typeof g === 'string' ? g !== garden.name : g.name !== garden.name)) : [...prev, garden]);
                                  }}
                                  style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 39}}
                                >
                                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                    {garden.sellerAvatar ? (
                                      <Image source={{uri: garden.sellerAvatar}} style={{width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#539461'}} />
                                    ) : (
                                      <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#48A7F8', borderWidth: 1, borderColor: '#539461', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF'}}>
                                          {(garden.sellerName || garden.name || 'U').charAt(0).toUpperCase()}
                                        </Text>
                          </View>
                                    )}
                                    <View style={{flex: 1, marginLeft: 8}}>
                                      <Text style={[styles.typeRowText, {fontWeight: '700', color: '#202325'}]} numberOfLines={1}>{garden.name}</Text>
                                      {garden.sellerName && (
                                        <Text style={[styles.typeRowText, {fontSize: 12, color: '#647276', marginTop: 2}]} numberOfLines={1}>{garden.sellerName}</Text>
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
                                {idx < filteredList.length - 1 && <View style={styles.listDivider} />}
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
      {/* Applies to modal */}
      <Modal transparent visible={showAppliesSheet} onRequestClose={() => setShowAppliesSheet(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAppliesSheet(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.appliesSheetContainer, {position: 'absolute', left: (SCREEN.width - 340) / 2, top: appliesSheetTop}] }>
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
      {/* Listing Type modal (centered) */}
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
      {/* Country modal (centered, 340x170) */}
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
      {/* Buyer modal (bottom sheet) */}
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
      {/* Genus modal (bottom sheet) */}
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

      {/* End Date modal (bottom sheet) */}
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

      {/* End Time modal (bottom sheet) */}
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
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (numericText === '' || (parseInt(numericText) >= 1 && parseInt(numericText) <= 12)) {
                              setTempEndHour(numericText);
                            }
                          }}
                          onFocus={() => {
                            if (tempEndHour === '00') {
                              setTempEndHour('');
                            }
                          }}
                          onBlur={() => {
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
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (numericText === '' || (parseInt(numericText) >= 0 && parseInt(numericText) <= 59)) {
                              setTempEndMinute(numericText);
                            }
                          }}
                          onFocus={() => {
                            if (tempEndMinute === '00') {
                              setTempEndMinute('');
                            }
                          }}
                          onBlur={() => {
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

    </SafeAreaView>
  );
};

export default EventGift;

const styles = StyleSheet.create({
  header: {
    height: 58,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
    fontFamily: 'Inter', fontWeight: '700', fontSize: 18, lineHeight: 24, color: '#202325',
  },

  sectionPad: { paddingHorizontal: 24, paddingVertical: 12 },
  fieldGroup: { },
  label: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#393D40' },
  inputRow: {
    minHeight: 48, height: 48, borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  input: { flex: 1, fontFamily: 'Inter', fontWeight: '500', fontSize: 16, color: '#202325' },
  inputValue: { flex: 1, fontFamily: 'Inter', fontWeight: '500', fontSize: 16, color: '#202325' },
  helper: { fontFamily: 'Inter', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#647276' },
  reqAsterisk: { color: '#E7522F' },
  dividerStrip: { height: 12, backgroundColor: '#F5F6F6' },

  sectionTitle: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, lineHeight: 22, color: '#393D40' },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  radioOuter: { width: 24, height: 24, borderRadius: 1000, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { backgroundColor: '#539461' },
  radioOuterDefault: { borderWidth: 1, borderColor: '#647276', backgroundColor: '#FFFFFF' },
  radioInner: { width: 8, height: 8, borderRadius: 100, backgroundColor: '#FFFFFF' },
  optionText: { flex: 1, fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#393D40' },

  prefixBox: {
    minHeight: 48, height: 48, borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12,
    borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6F6'
  },
  suffixBox: {
    minHeight: 48, height: 48, borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6F6'
  },
  suffixText: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, color: '#647276' },

  appliesListWrap: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#F5F6F6' },
  appliesListWrapListings: { paddingVertical: 12, backgroundColor: '#F5F6F6', width: '100%' },
  appliesCard: { backgroundColor: '#FFFFFF', height: 48, borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  appliesCardText: { fontFamily: 'Inter', fontWeight: '700', fontSize: 16, color: '#202325' },

  // Full listing card styles
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

  switchTrack: { width: 44, height: 24, borderRadius: 32, backgroundColor: '#7F8D91', padding: 2, justifyContent: 'center' },
  switchKnob: { width: 20, height: 20, borderRadius: 1000, backgroundColor: '#FFFFFF' },

  boxSpecs: { paddingHorizontal: 15, paddingVertical: 16 },
  boxTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 18, lineHeight: 24, color: '#202325' },
  boxDetails: { paddingTop: 0 },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  boxLabel: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#647276' },
  boxValue: { fontFamily: 'Inter', fontWeight: '700', fontSize: 16, lineHeight: 22, color: '#202325' },
  boxDivider: { height: 1, backgroundColor: '#E4E7E9', marginVertical: 8 },
  boxPolicy: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#393D40' },
  boxList: { paddingTop: 4 },
  boxListItem: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#393D40' },

  actionWrap: { paddingHorizontal: 15, paddingTop: 24, paddingBottom: 12 },
  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#539461', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 16, lineHeight: 16 },
  secondaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#414649', alignItems: 'center', justifyContent: 'center', marginTop: 12, flexDirection: 'row', paddingHorizontal: 16 },
  secondaryBtnText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 16 },
  listingTypeSheetContainer: { width: 340, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden' },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  buyerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  typeRowWrapper: { height: 48, width: 340, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  typeRowLeft: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, height: 48, width: 324 },
  typeRowText: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#393D40' },
  typeDivider: { width: 340, height: 1, backgroundColor: '#E4E7E9' },
  typeSheetContainer: { width: 340, height: 121, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden' },
  appliesSheetContainer: { width: 340, height: 268, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden' },
  countrySheetContainer: { width: 340, height: 170, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', alignSelf: 'center' },
  // Genus bottom sheet
  genusSheetWrapper: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: 620, height: '80%', width: '100%' },
  genusSheetContainer: { width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: 0, flexDirection: 'column', overflow: 'hidden' },
  genusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  genusTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 18, lineHeight: 24, color: '#202325' },
  genusContentContainer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0, flex: 1 },
  genusListContainer: { flex: 1, marginTop: 16 },
  genusListContentContainer: { paddingHorizontal: 24, paddingBottom: 8 },
  genusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingLeft: 0, paddingRight: 0 },
  genusRowLeft: { flexDirection: 'row', alignItems: 'center' },
  genusRowRight: { flexDirection: 'row', alignItems: 'center' },
  genusHint: { fontFamily: 'Inter', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#647276', marginRight: 8 },
  checkboxSquare: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxSquareSelected: { backgroundColor: '#539461' },
  checkboxSquareDefault: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#647276' },
  genusActions: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 12, gap: 12, backgroundColor: '#FFFFFF' },
  genusClearBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F2F7F3', alignItems: 'center', justifyContent: 'center' },
  genusClearText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#539461' },
  genusApplyBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#539461', alignItems: 'center', justifyContent: 'center' },
  genusApplyText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#FFFFFF' },
  buyerSheetContainer: { width: '100%', height: 569, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: 0 },
  listDivider: { height: 1, backgroundColor: '#E4E7E9', marginVertical: 8, width: '100%' },
  // Buyer modal skeletons
  skeletonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 39 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E9ECEF', borderWidth: 1, borderColor: '#E4E7E9' },
  skeletonNameBar: { flex: 1, height: 16, backgroundColor: '#E9ECEF', borderRadius: 8, marginLeft: 8 },
  genusSkeletonText: { width: 120, height: 16, backgroundColor: '#E9ECEF', borderRadius: 8 },
  genusSkeletonCheckbox: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#E9ECEF', borderWidth: 1, borderColor: '#E4E7E9' },
});


