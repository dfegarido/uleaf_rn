import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../config/apiConfig';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../../assets/icons/accent/download.svg';
import SearchIcon from '../../../assets/admin-icons/search.svg';
import CloseIcon from '../../../assets/admin-icons/x.svg';
import ArrowDownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import DateRangeFilter from '../../../components/Admin/dateRangeFilter';
import BuyerFilter from '../../../components/Admin/buyerFilter';
import JoinerFilter from '../../../components/Admin/joinerFilter';
import PlantFlightFilter from '../../../components/Admin/plantFlightFilter';
import TransactionFilter from '../../../components/Admin/transactionFilter';
import SellerNameFilter from '../../../components/Admin/sellerNameFilter';

// Skeleton loader component for QR codes
const QRCodeSkeleton = () => {
  const itemWidth = 80;
  const itemHeight = 170;
  const rowSpacing = 10;
  const numItems = 16; // 4x4 grid
  const containerWidth = Dimensions.get('window').width - 48;
  const spacing = (containerWidth - (itemWidth * 4)) / 3;

  return (
    <View style={styles.pageContainer}>
      <View style={styles.contentWrapper}>
        <View style={[styles.qrListContainer, { height: (4 * itemHeight) + (3 * rowSpacing) + 10 }]}>
          {Array.from({ length: numItems }).map((_, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const left = col * (itemWidth + spacing);
            const top = row * (itemHeight + rowSpacing);
            
            return (
              <View 
                key={index}
                style={[
                  styles.qrItemContainer,
                  {
                    left: left,
                    top: top,
                    height: itemHeight,
                  }
                ]}
              >
                <View style={styles.skeletonItem}>
                  <View style={styles.skeletonQR} />
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonLineShort} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Seller Selection Modal Component
const SellerSelectionModal = ({ isVisible, onClose, onSelectSeller, sellers, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sellers based on the search query
  const filteredSellers = sellers.filter(seller => {
    const name = seller.name || seller.firstName + ' ' + seller.lastName || '';
    const email = seller.email || '';
    const searchLower = searchQuery.toLowerCase();
    return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower);
  });

  const handleSelect = (seller) => {
    onSelectSeller(seller);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <SafeAreaView>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Select Seller</Text>
                  <TouchableOpacity onPress={onClose}>
                    <CloseIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View style={styles.modalContentContainer}>
                  {/* Search Bar */}
                  <View style={styles.searchFieldContainer}>
                    <SearchIcon width={20} height={20} />
                    <TextInput
                      style={styles.searchTextInput}
                      placeholder="Search seller..."
                      placeholderTextColor="#647276"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Scrollable List of Sellers */}
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#539461" />
                      <Text style={styles.loadingText}>Loading sellers...</Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.sellerListContainer} showsVerticalScrollIndicator={false}>
                      {filteredSellers.length === 0 ? (
                        <View style={styles.emptySellerContainer}>
                          <Text style={styles.emptySellerText}>
                            {searchQuery ? 'No sellers found' : 'No sellers available'}
                          </Text>
                        </View>
                      ) : (
                        filteredSellers.map((seller, index) => {
                          const sellerName = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email || 'Unknown';
                          const avatarUrl = seller.profileImage || seller.avatar || '';
                          return (
                            <View key={seller.id || seller.uid || index}>
                              <TouchableOpacity 
                                style={styles.sellerItemContainer} 
                                onPress={() => handleSelect(seller)}
                              >
                                {avatarUrl ? (
                                  <Image source={{ uri: avatarUrl }} style={styles.sellerAvatar} />
                                ) : (
                                  <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                                    <Text style={styles.sellerAvatarText}>
                                      {sellerName.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.sellerInfo}>
                                  <Text style={styles.sellerName}>{sellerName}</Text>
                                  {seller.email && (
                                    <Text style={styles.sellerEmail}>{seller.email}</Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                              {index < filteredSellers.length - 1 && <View style={styles.divider} />}
                            </View>
                          );
                        })
                      )}
                    </ScrollView>
                  )}
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Custom Header with Centered Title
const GenerateQRHeader = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Generate QR</Text>
      <View style={styles.backButton} />
    </View>
  );
};

const GenerateQR = ({navigation}) => {
  // Enable debug logs for QR date parsing
  const DEBUG_QR_DATE_PARSING = true;
  const [qrCodeData, setQrCodeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sortOrder] = useState('newest'); // Always sort newest first

  // Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    sellerName: null, // Seller name
    buyer: null,
    createdDate: null, // Date range for created date
    flightDate: [], // Array of flight dates
    transaction: null, // Transaction number (string)
    joiner: null,
  });

  // Filter modal states
  const [sellerNameModalVisible, setSellerNameModalVisible] = useState(false);
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [createdDateModalVisible, setCreatedDateModalVisible] = useState(false);
  const [flightDateModalVisible, setFlightDateModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [joinerModalVisible, setJoinerModalVisible] = useState(false);

  // Filter options from API response
  const [sellerNameOptions, setSellerNameOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [allBuyerOptions, setAllBuyerOptions] = useState([]); // Keep original full list
  const [joinerOptions, setJoinerOptions] = useState([]);
  const [flightDateOptions, setFlightDateOptions] = useState([]);

  // Debug: Track modal state changes (disabled to prevent infinite loops)
  // React.useEffect(() => {
  //   console.log('[GenerateQR] Modal states:', {
  //     sellerName: sellerNameModalVisible,
  //     buyer: buyerModalVisible,
  //     createdDate: createdDateModalVisible,
  //     flightDate: flightDateModalVisible,
  //     transaction: transactionModalVisible,
  //     joiner: joinerModalVisible,
  //   });
  // }, [sellerNameModalVisible, buyerModalVisible, createdDateModalVisible, flightDateModalVisible, transactionModalVisible, joinerModalVisible]);

  // Debug: Track filter options (disabled to prevent infinite loops)
  // React.useEffect(() => {
  //   console.log('[GenerateQR] Filter options updated:', {
  //     buyers: buyerOptions.length,
  //     joiners: joinerOptions.length,
  //     flightDates: flightDateOptions.length,
  //     sellers: sellers.length,
  //   });
  // }, [buyerOptions, joinerOptions, flightDateOptions, sellers]);

  // Function to handle email sending
  const handleSendEmail = async () => {
    try {
      setDownloading(true);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build URL with filters
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      if (selectedFilters.sellerName) {
        queryParams.append('sellerName', selectedFilters.sellerName);
      }
      if (selectedFilters.buyer) {
        queryParams.append('buyer', selectedFilters.buyer);
      }
      if (selectedFilters.createdDate) {
        if (selectedFilters.createdDate.from) {
          // Set time to start of day (00:00:00)
          const fromDate = new Date(selectedFilters.createdDate.from);
          fromDate.setHours(0, 0, 0, 0);
          queryParams.append('createdDateFrom', fromDate.toISOString());
        }
        if (selectedFilters.createdDate.to) {
          // Set time to end of day (23:59:59)
          const toDate = new Date(selectedFilters.createdDate.to);
          toDate.setHours(23, 59, 59, 999);
          queryParams.append('createdDateTo', toDate.toISOString());
        }
      }
      if (selectedFilters.flightDate && Array.isArray(selectedFilters.flightDate) && selectedFilters.flightDate.length > 0) {
        queryParams.append('flightDate', selectedFilters.flightDate.join(','));
      }
      if (selectedFilters.transaction) {
        queryParams.append('transaction', selectedFilters.transaction);
      }
      if (selectedFilters.joiner) {
        queryParams.append('joiner', selectedFilters.joiner);
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `${API_ENDPOINTS.QR_GENERATOR}?${queryString}` : API_ENDPOINTS.QR_GENERATOR;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle different HTTP status codes with user-friendly messages
        if (response.status === 404) {
          throw new Error('No QR codes available for email at this time.');
        } else if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to access QR codes.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Unable to send QR codes email. Please try again.');
        }
      }

      const data = await response.json();
      
      // Check if the response indicates no orders found
      if (!data.success || data.error) {
        if (data.error && data.error.includes('No orders found')) {
          throw new Error('No QR codes available for email at this time.');
        } else {
          throw new Error(data.error || 'Unable to send QR codes email. Please try again.');
        }
      }

      // If we get here, the API call was successful
      Alert.alert('Success', 'QR codes PDF has been sent to your email address. Please check your inbox.');
      
    } catch (err) {
      console.error('Error sending QR codes email:', err);
      
      // Provide user-friendly error messages
      let userFriendlyMessage;
      
      if (err.message.includes('No authentication token')) {
        userFriendlyMessage = 'Please log in again to send QR codes email.';
      } else if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
        userFriendlyMessage = 'No internet connection. Please check your network and try again.';
      } else if (err.message.startsWith('No QR codes available') || 
                 err.message.startsWith('Your session has expired') ||
                 err.message.startsWith('You do not have permission') ||
                 err.message.startsWith('Server error') ||
                 err.message.startsWith('Unable to send')) {
        // These are already user-friendly messages
        userFriendlyMessage = err.message;
      } else {
        userFriendlyMessage = 'Unable to send QR codes email. Please try again.';
      }

      Alert.alert('Email Failed', userFriendlyMessage);
    } finally {
      setDownloading(false);
    }
  };

  // Function to fetch sellers from API
  const fetchSellers = async () => {
    try {
      setLoadingSellers(true);
      const authToken = await getStoredAuthToken();
      
      if (!authToken) {
        console.warn('No auth token for fetching sellers');
        return;
      }

      // Fetch suppliers (sellers) using SEARCH_USER API
      const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=&userType=supplier&limit=100&offset=0`;
      
      const supplierResponse = await fetch(supplierUrl, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (supplierResponse.ok) {
        const supplierData = await supplierResponse.json();
        if (supplierData && supplierData.success && supplierData.results) {
          const sellerResults = supplierData.results.map(user => ({
            id: user.id || user.uid,
            uid: user.uid || user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            profileImage: user.profileImage || '',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
            userType: 'supplier'
          }));
          setSellers(sellerResults);
          setSellerNameOptions(sellerResults); // Also set sellerNameOptions for the filter
          console.log(`✅ Loaded ${sellerResults.length} sellers`);
          console.log('[GenerateQR] Sellers sample:', sellerResults.slice(0, 3).map(s => ({
            name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            email: s.email
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoadingSellers(false);
    }
  };

  // Function to fetch QR code data from API
  const fetchQRCodeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build URL with filters
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      if (selectedFilters.sellerName) {
        queryParams.append('sellerName', selectedFilters.sellerName);
      }
      if (selectedFilters.buyer) {
        queryParams.append('buyer', selectedFilters.buyer);
      }
      if (selectedFilters.createdDate) {
        if (selectedFilters.createdDate.from) {
          // Set time to start of day (00:00:00)
          const fromDate = new Date(selectedFilters.createdDate.from);
          fromDate.setHours(0, 0, 0, 0);
          const dateFrom = fromDate.toISOString();
          queryParams.append('createdDateFrom', dateFrom);
          console.log('📅 QR Generator - Date From:', dateFrom, 'Original:', selectedFilters.createdDate.from);
        }
        if (selectedFilters.createdDate.to) {
          // Set time to end of day (23:59:59)
          const toDate = new Date(selectedFilters.createdDate.to);
          toDate.setHours(23, 59, 59, 999);
          const dateTo = toDate.toISOString();
          queryParams.append('createdDateTo', dateTo);
          console.log('📅 QR Generator - Date To:', dateTo, 'Original:', selectedFilters.createdDate.to);
        }
      }
      if (selectedFilters.flightDate && Array.isArray(selectedFilters.flightDate) && selectedFilters.flightDate.length > 0) {
        queryParams.append('flightDate', selectedFilters.flightDate.join(','));
      }
      if (selectedFilters.transaction) {
        queryParams.append('transaction', selectedFilters.transaction);
      }
      if (selectedFilters.joiner) {
        queryParams.append('joiner', selectedFilters.joiner);
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `${API_ENDPOINTS.QR_GENERATOR_ORDERS}?${queryString}` : API_ENDPOINTS.QR_GENERATOR_ORDERS;
      console.log('🌐 QR Generator - Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 QR Generator - Response status:', response.status);

      if (!response.ok) {
        // Handle 404 specifically for no orders found
        if (response.status === 404) {
          setQrCodeData([]);
          setError('No QR codes found for the current period.');
          return; // Don't show alert for 404, just set the error state
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 QR Generator - API Response:', {
        ordersCount: data?.data?.length || data?.orders?.length || 0,
        hasData: !!data,
        filters: selectedFilters
      });
      
      // Check if API response indicates no orders
      if (!data.success && data.error && data.error.includes('No orders found')) {
        setQrCodeData([]);
        setError('No QR codes found for the current period.');
        return; // Don't show alert, just set the error state
      }
      
      // Extract filter options from API response
      if (data.buyers && Array.isArray(data.buyers)) {
        console.log('[GenerateQR] Buyer options loaded:', data.buyers.length, 'buyers');
        setBuyerOptions(data.buyers);
      } else {
        console.log('[GenerateQR] No buyer data in API response');
      }
      if (data.joiners && Array.isArray(data.joiners)) {
        console.log('[GenerateQR] Joiner options loaded:', data.joiners.length, 'joiners');
        setJoinerOptions(data.joiners);
      }
      // Refresh flight schedules from schedule API (Saturdays only, excluding canceled)
      const activeSaturdays = await fetchFlightSchedules();
      if (activeSaturdays.length > 0) {
        console.log('[GenerateQR] Flight date options refreshed from schedule:', activeSaturdays.length, 'dates', activeSaturdays);
        setFlightDateOptions(activeSaturdays);
      } else {
        console.warn('[GenerateQR] No active Saturday flight dates found after refresh');
      }

      // Transform API data to match the expected format
      const transformedData = transformApiData(data);

      // Check if no orders were found after transformation
      if (transformedData.length === 0) {
        setQrCodeData([]);
        setError('No QR codes found for the current period.');
      } else {
        // Apply current sort order to the fetched data
        const sortedData = sortQRCodesByDate(transformedData, sortOrder);
        setQrCodeData(sortedData);
        setError(null); // Clear any previous errors
      }
      
    } catch (err) {
      console.error('Error fetching QR code data:', err);
      
      // Provide user-friendly error messages instead of raw API responses
      let userFriendlyMessage;
      
      if (err.message.includes('No authentication token')) {
        userFriendlyMessage = 'Please log in again to view QR codes.';
      } else if (err.message.includes('HTTP error! status: 401')) {
        userFriendlyMessage = 'Your session has expired. Please log in again.';
      } else if (err.message.includes('HTTP error! status: 403')) {
        userFriendlyMessage = 'You do not have permission to view QR codes.';
      } else if (err.message.includes('HTTP error! status: 404')) {
        userFriendlyMessage = 'No QR codes found for your account.';
      } else if (err.message.includes('HTTP error! status: 500')) {
        userFriendlyMessage = 'Server error. Please try again later.';
      } else if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
        userFriendlyMessage = 'No internet connection. Please check your network and try again.';
      } else {
        userFriendlyMessage = 'Unable to load QR codes. Please try again.';
      }
      
      setError(userFriendlyMessage);
      // Only show alert for actual errors, not for "no orders found" scenarios
      if (!err.message.includes('HTTP error! status: 404')) {
        Alert.alert('Error', userFriendlyMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSeller, selectedFilters, sortOrder, sortQRCodesByDate, fetchFlightSchedules]);

  // Transform API data to match the UI structure
  const transformApiData = (apiData) => {
    // Check if the API returns data in 'data' key instead of 'orders'
    const ordersArray = apiData?.data || apiData?.orders || apiData;
    
    if (!ordersArray || !Array.isArray(ordersArray)) {
      return [];
    }

    // Helper function to parse date from various formats (Firestore Timestamp, ISO string, etc.)
    const parseDate = (dateInput) => {
      if (!dateInput) return null;

      try {
        // Handle Firestore Timestamp objects
        if (dateInput && typeof dateInput === 'object') {
          if (dateInput.toDate && typeof dateInput.toDate === 'function') {
            const res = dateInput.toDate();
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate input(object).toDate ->', dateInput, '->', res);
            return res;
          }
          if (dateInput.seconds) {
            const res = new Date(dateInput.seconds * 1000);
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate input(seconds) ->', dateInput.seconds, '->', res);
            return res;
          }
          if (dateInput._seconds) {
            const res = new Date(dateInput._seconds * 1000);
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate input(_seconds) ->', dateInput._seconds, '->', res);
            return res;
          }
        }

        // Strings - attempt robust parsing for formats like
        // "November 19, 2025 at 10:31:12 AM UTC+8" (may contain NBSP)
        if (typeof dateInput === 'string') {
          let s = String(dateInput).replace(/\u202f|\u00A0/g, ' ');
          const original = s;
          s = s.replace(/\s+at\s+/i, ' ');
          if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate rawString ->', original, 'normalized ->', s);

          // Try Date.parse directly
          let ts = Date.parse(s);
          if (!isNaN(ts)) {
            const res = new Date(ts);
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate parsed direct ->', res);
            return res;
          }

          // Remove timezone suffix like 'UTC+8' or 'GMT+8' and try again
          const noTz = s.replace(/\bUTC.*$|\bGMT.*$|\b[+-]\d{1,4}(:?\d{2})?$/i, '').trim();
          if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate noTz ->', noTz);
          ts = Date.parse(noTz);
          if (!isNaN(ts)) {
            const res = new Date(ts);
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate parsed noTz ->', res);
            return res;
          }

          // Last resort: remove commas
          const cleaned = noTz.replace(/,/g, '');
          if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate cleaned ->', cleaned);
          ts = Date.parse(cleaned);
          if (!isNaN(ts)) {
            const res = new Date(ts);
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin parseDate parsed cleaned ->', res);
            return res;
          }

          return null;
        }

        // Numeric timestamps
        if (typeof dateInput === 'number') {
          const ms = dateInput < 4102444800000 ? dateInput * 1000 : dateInput;
          const parsed = new Date(ms);
          if (isNaN(parsed.getTime())) return null;
          return parsed;
        }

        // Fallback: try constructing a Date
        const parsed = new Date(dateInput);
        if (isNaN(parsed.getTime())) return null;
        return parsed;
      } catch (error) {
        console.warn('Date parsing error:', error, dateInput);
        return null;
      }
    };

    // Collect all QR codes into a single flat array (no grouping by date)
    const allQRCodes = [];
    let earliestDate = null; // Track earliest date for "Date generated" display
    
    ordersArray.forEach((order, orderIndex) => {
      // Add QR code from the order (note: it's qrCode, not qrCodes)
      if (order.qrCode && order.qrCode.content) {
        const qrContent = order.qrCode.content;
        
        // Prefer `orderDate` (the actual order date) when present, then `dateCreated`/`createdAt`,
        // otherwise fall back to QR generation time (`qrCode.generatedAt`).
        const displayDate = order.orderDate || order.dateCreated || order.createdAt || (order.qrCode && order.qrCode.generatedAt);

        if (DEBUG_QR_DATE_PARSING) {
          console.log('[QR DATE DEBUG] admin rawDates for order=', order.id || order.orderId, {
            orderDate: order.orderDate,
            dateCreated: order.dateCreated,
            createdAt: order.createdAt,
            qrCodeGeneratedAt: order.qrCode && order.qrCode.generatedAt,
            chosenDisplayDate: displayDate,
          });
        }
        
        // Track earliest date for "Date generated" display
        if (displayDate) {
          try {
            const parsedDate = parseDate(displayDate);
            // Debug log
            if (DEBUG_QR_DATE_PARSING) {
              console.log('[QR DATE DEBUG] admin order=', order.id || order.orderId, 'rawDisplayDate=', displayDate, 'parsedDate=', parsedDate);
            }
            // Only accept valid parsed dates (non-null and valid)
            if (parsedDate && parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
              if (!earliestDate || parsedDate < earliestDate) {
                earliestDate = parsedDate;
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // Format flight date with validation
        const formatFlightDate = (flightDate) => {
          if (!flightDate) return null;
          try {
            let date = parseDate(flightDate);
            
            // Handle partial dates like "Nov 15", "Dec 6" - add year if missing
            if (date && !isNaN(date.getTime())) {
              const year = date.getFullYear();
              // If year is 1900 or 2001 (common defaults for partial dates), try to infer correct year
              if (year < 2000 || year === 2001) {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth(); // 0-11
                
                // Try parsing as "Month Day" format
                const monthDayMatch = String(flightDate).match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)$/i);
                if (monthDayMatch) {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthDayMatch[1].toLowerCase());
                  const day = parseInt(monthDayMatch[2], 10);
                  
                  if (monthIndex !== -1 && day >= 1 && day <= 31) {
                    // Assume current year, or next year if month has passed
                    let inferredYear = currentYear;
                    if (monthIndex < currentMonth) {
                      inferredYear = currentYear + 1; // Next year if month has passed
                    }
                    
                    date = new Date(inferredYear, monthIndex, day);
                  }
                }
              }
            }
            
            // Validate that the date is actually valid
            if (!date || isNaN(date.getTime())) {
              return null; // Invalid date, return null instead of original value
            }
            
            // Check if date is reasonable (not too far in past or future)
            const year = date.getFullYear();
            // Reject dates before 2000 or after 2100
            if (year < 2000 || year > 2100) {
              return null;
            }
            
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (e) {
            console.warn('Error formatting flight date:', e, flightDate);
            return null; // Return null for invalid dates instead of original value
          }
        };
        
        // Extract genus/species from products array if not at root level
        let genus = order.genus || '';
        let species = order.species || '';
        let plantCode = order.plantCode || qrContent.plantCode || '';
        let flightDate = order.flightDate || order.flightDateFormatted || order.cargoDate || null;
        
        if ((!genus || !plantCode) && order.products && Array.isArray(order.products) && order.products.length > 0) {
          const firstProduct = order.products[0];
          genus = genus || firstProduct.genus || '';
          species = species || firstProduct.species || '';
          plantCode = plantCode || firstProduct.plantCode || '';
          const productFlightDate = firstProduct.flightDate || firstProduct.flightDateFormatted || null;
          
          if (productFlightDate && !flightDate) {
            flightDate = productFlightDate;
          }
        }
        
        // Validate and format flight date - only store if valid
        const formattedFlightDate = formatFlightDate(flightDate);
        // Only store flightDate if it's valid, otherwise set to null
        const validFlightDate = formattedFlightDate ? flightDate : null;
        
        allQRCodes.push({
          id: order.qrCode.id || order.qrCode.qrCodeId || qrContent.orderId,
          plantCode: plantCode,
          trxNumber: order.trxNumber || qrContent.trxNumber,
          orderId: order.id || qrContent.orderId,
          genus: genus,
          species: species,
          variegation: order.variegation || qrContent.variegation || '',
          flightDate: validFlightDate,
          flightDateFormatted: formattedFlightDate,
          receiverInfo: order.receiverInfo || null,
          joinerInfo: order.joinerInfo || (order.isJoinerOrder ? {
            firstName: order.joinerInfo?.firstName || order.joinerInfo?.joinerFirstName || '',
            lastName: order.joinerInfo?.lastName || order.joinerInfo?.joinerLastName || '',
            username: order.joinerInfo?.username || order.joinerInfo?.joinerUsername || '',
          } : null),
          gardenOrCompanyName: order.gardenOrCompanyName || qrContent.gardenOrCompanyName,
          sellerName: order.sellerName || qrContent.sellerName,
          orderQty: order.orderQty || qrContent.orderQty,
          localPrice: order.localPrice || qrContent.localPrice,
          localPriceCurrency: order.localPriceCurrency || qrContent.localPriceCurrency,
          deliveryStatus: order.deliveryStatus || qrContent.deliveryStatus,
          generatedAt: order.qrCode.generatedAt || qrContent.generatedAt,
          dataUrl: order.qrCode.dataUrl, // QR code image data URL
          orderStatus: order.status,
          orderDate: order.orderDate, // Preserve orderDate for sorting
          createdAt: displayDate, // Use the properly parsed date
        });
      } else if (order.qrCode) {
        // Fallback for older format without content wrapper
        const displayDate = order.dateCreated || order.createdAt || (order.qrCode && order.qrCode.generatedAt) || order.orderDate;
        if (DEBUG_QR_DATE_PARSING) {
          console.log('[QR DATE DEBUG] admin fallback rawDates for order=', order.id || order.orderId, {
            dateCreated: order.dateCreated,
            createdAt: order.createdAt,
            qrCodeGeneratedAt: order.qrCode && order.qrCode.generatedAt,
            orderDate: order.orderDate,
            chosenDisplayDate: displayDate,
          });
        }

        // Track earliest date for "Date generated" display
        if (displayDate) {
          try {
            const parsedDate = parseDate(displayDate);
            if (DEBUG_QR_DATE_PARSING) console.log('[QR DATE DEBUG] admin fallback parsedDate=', parsedDate);
            if (parsedDate && parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
              if (!earliestDate || parsedDate < earliestDate) {
                earliestDate = parsedDate;
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // Format flight date with validation
        const formatFlightDate = (flightDate) => {
          if (!flightDate) return null;
          try {
            let date = parseDate(flightDate);
            
            // Handle partial dates like "Nov 15", "Dec 6" - add year if missing
            if (date && !isNaN(date.getTime())) {
              const year = date.getFullYear();
              // If year is 1900 or 2001 (common defaults for partial dates), try to infer correct year
              if (year < 2000 || year === 2001) {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth(); // 0-11
                
                // Try parsing as "Month Day" format
                const monthDayMatch = String(flightDate).match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)$/i);
                if (monthDayMatch) {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthDayMatch[1].toLowerCase());
                  const day = parseInt(monthDayMatch[2], 10);
                  
                  if (monthIndex !== -1 && day >= 1 && day <= 31) {
                    // Assume current year, or next year if month has passed
                    let inferredYear = currentYear;
                    if (monthIndex < currentMonth) {
                      inferredYear = currentYear + 1; // Next year if month has passed
                    }
                    
                    date = new Date(inferredYear, monthIndex, day);
                  }
                }
              }
            }
            
            // Validate that the date is actually valid
            if (!date || isNaN(date.getTime())) {
              return null; // Invalid date, return null instead of original value
            }
            
            // Check if date is reasonable (not too far in past or future)
            const year = date.getFullYear();
            // Reject dates before 2000 or after 2100
            if (year < 2000 || year > 2100) {
              return null;
            }
            
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (e) {
            console.warn('Error formatting flight date:', e, flightDate);
            return null; // Return null for invalid dates instead of original value
          }
        };
        
        // Extract genus/species from products array if not at root level
        let genus = order.genus || '';
        let species = order.species || '';
        let plantCode = order.plantCode || order.qrCode.plantCode || order.qrCode.code || order.qrCode.qrCodeId;
        let flightDate = order.flightDate || order.flightDateFormatted || order.cargoDate || null;
        
        if ((!genus || !plantCode) && order.products && Array.isArray(order.products) && order.products.length > 0) {
          const firstProduct = order.products[0];
          genus = genus || firstProduct.genus || '';
          species = species || firstProduct.species || '';
          plantCode = plantCode || firstProduct.plantCode || '';
          const productFlightDate = firstProduct.flightDate || firstProduct.flightDateFormatted || null;
          
          if (productFlightDate && !flightDate) {
            flightDate = productFlightDate;
          }
        }
        
        // Validate and format flight date - only store if valid
        const formattedFlightDate = formatFlightDate(flightDate);
        // Only store flightDate if it's valid, otherwise set to null
        const validFlightDate = formattedFlightDate ? flightDate : null;
        
        allQRCodes.push({
          id: order.qrCode.id || order.qrCode.qrCodeId,
          plantCode: plantCode,
          trxNumber: order.trxNumber || order.transactionNumber || order.orderId,
          genus: genus,
          species: species,
          variegation: order.variegation || '',
          flightDate: validFlightDate,
          flightDateFormatted: formattedFlightDate,
          receiverInfo: order.receiverInfo || null,
          joinerInfo: order.joinerInfo || (order.isJoinerOrder ? {
            firstName: order.joinerInfo?.firstName || order.joinerInfo?.joinerFirstName || '',
            lastName: order.joinerInfo?.lastName || order.joinerInfo?.joinerLastName || '',
            username: order.joinerInfo?.username || order.joinerInfo?.joinerUsername || '',
          } : null),
          dataUrl: order.qrCode.dataUrl,
          orderId: order.id || order.orderId,
          orderStatus: order.status,
          orderDate: order.orderDate, // Preserve orderDate for sorting
          createdAt: displayDate, // Use the properly parsed date
        });
      }
    });

    // If there are QR codes without flight date, use the most common flight date from others
    if (allQRCodes.length > 0) {
      const qrCodesWithFlightDate = allQRCodes.filter(qr => qr.flightDateFormatted).length;
      const qrCodesWithoutFlightDate = allQRCodes.filter(qr => !qr.flightDateFormatted).length;
      
      if (qrCodesWithoutFlightDate > 0 && qrCodesWithFlightDate > 0) {
        // Find the most common flight date
        const flightDateCounts = {};
        allQRCodes.forEach(qr => {
          if (qr.flightDateFormatted) {
            flightDateCounts[qr.flightDateFormatted] = (flightDateCounts[qr.flightDateFormatted] || 0) + 1;
          }
        });
        
        // Get the most common flight date
        const mostCommonFlightDate = Object.keys(flightDateCounts).reduce((a, b) => 
          flightDateCounts[a] > flightDateCounts[b] ? a : b
        );
        
        // Also get the raw flight date for the most common one
        const mostCommonRawFlightDate = allQRCodes.find(qr => qr.flightDateFormatted === mostCommonFlightDate)?.flightDate;
        
        // Apply the most common flight date to QR codes without flight date
        allQRCodes.forEach(qr => {
          if (!qr.flightDateFormatted) {
            qr.flightDateFormatted = mostCommonFlightDate;
            qr.flightDate = mostCommonRawFlightDate || null;
          }
        });
      }
    }
    
    // Convert to pages with pagination (16 items per page for 4x4 grid)
    const pages = [];
    const itemsPerPage = 16; // 4x4 grid = 16 items per page
    
    // Split all QR codes into chunks of 16 (no grouping by date)
    for (let i = 0; i < allQRCodes.length; i += itemsPerPage) {
      const chunk = allQRCodes.slice(i, i + itemsPerPage);
      const pageNumber = Math.floor(i / itemsPerPage) + 1;
      const totalPages = Math.ceil(allQRCodes.length / itemsPerPage);
      
      // Use earliest date for all pages, or null as fallback (so UI shows Unknown)
      const pageDate = earliestDate ? earliestDate.toISOString() : null;
      
      pages.push({
        qrcodes: chunk,
        createdAt: pageDate,
      });
    }

    return pages;
  };

  const handleSelectSeller = useCallback((seller) => {
    setSelectedSeller(seller);
  }, []);

  const handleClearSeller = useCallback(() => {
    setSelectedSeller(null);
  }, []);

  // Filter handlers
  const handleSellerNameSelect = useCallback((sellerName) => {
    setSelectedFilters((prev) => ({ ...prev, sellerName }));
    setSellerNameModalVisible(false);
  }, []);

  const handleSellerSearch = useCallback(async (searchQuery) => {
    try {
      // If search query is empty or cleared, restore full list
      if (!searchQuery || searchQuery.trim().length < 2) {
        console.log('[GenerateQR] Seller search query empty/cleared, restoring full seller list');
        // Restore from initial sellers if available
        if (sellers.length > 0) {
          setSellerNameOptions(sellers);
        }
        return;
      }
      
      console.log('[GenerateQR] Searching sellers by name/email:', searchQuery);
      
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.warn('[GenerateQR] No auth token found');
        return;
      }

      // Call search user API with supplier userType
      // This will search across name and email fields
      const url = `${API_ENDPOINTS.SEARCH_USER}?query=${encodeURIComponent(searchQuery)}&userType=supplier&limit=5`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[GenerateQR] Seller search failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('[GenerateQR] Seller search response:', data);

      // Update seller options with search results
      if (data && data.success && data.results && Array.isArray(data.results)) {
        // Transform to match expected seller format
        const sellerResults = data.results.map(user => ({
          id: user.id || user.uid,
          uid: user.uid || user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          profileImage: user.profileImage || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
          userType: 'supplier'
        }));
        console.log('[GenerateQR] Transformed sellers:', sellerResults.length);
        setSellerNameOptions(sellerResults);
      } else if (data && data.users && Array.isArray(data.users)) {
        // Handle alternative response format
        const sellerResults = data.users.map(user => ({
          id: user.id || user.uid,
          uid: user.uid || user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          profileImage: user.profileImage || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
          userType: 'supplier'
        }));
        console.log('[GenerateQR] Transformed sellers (alt format):', sellerResults.length);
        setSellerNameOptions(sellerResults);
      } else {
        console.warn('[GenerateQR] No seller data in search response');
        setSellerNameOptions([]);
      }
    } catch (error) {
      console.error('[GenerateQR] Error searching sellers:', error);
    }
  }, [sellers]);

  const handleBuyerSearch = useCallback(async (searchQuery) => {
    try {
      // If search query is empty or cleared, restore full list
      if (!searchQuery || searchQuery.trim().length < 2) {
        console.log('[GenerateQR] Search query empty/cleared, restoring full buyer list:', allBuyerOptions.length);
        setBuyerOptions(allBuyerOptions);
        return;
      }
      
      console.log('[GenerateQR] Searching buyers by name/email/username:', searchQuery);
      
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.warn('[GenerateQR] No auth token found');
        return;
      }

      // Call search user API with buyer role
      // This will search across name, email, and username fields
      const url = `${API_ENDPOINTS.SEARCH_USER}?query=${encodeURIComponent(searchQuery)}&role=buyer&limit=5`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[GenerateQR] Buyer search failed:', response.status);
        // Restore full list on error
        setBuyerOptions(allBuyerOptions);
        return;
      }

      const data = await response.json();
      console.log('[GenerateQR] Buyer search results:', data.users ? data.users.length : 0);

      // Update buyer options with search results (but keep allBuyerOptions intact)
      if (data.users && Array.isArray(data.users)) {
        // Transform to match expected buyer format
        const buyers = data.users.map(user => ({
          id: user.uid || user.id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          username: user.username,
          avatar: user.profileImage || user.avatar,
        }));
        console.log('[GenerateQR] Transformed buyers with email/username:', buyers.map(b => ({ name: b.name, email: b.email, username: b.username })));
        setBuyerOptions(buyers); // Only update buyerOptions, not allBuyerOptions
      } else {
        // If no results, restore full list
        setBuyerOptions(allBuyerOptions);
      }
    } catch (error) {
      console.error('[GenerateQR] Error searching buyers:', error);
      // Restore full list on error
      setBuyerOptions(allBuyerOptions);
    }
  }, [allBuyerOptions]);

  const handleBuyerSelect = useCallback((buyerId) => {
    setSelectedFilters((prev) => ({ ...prev, buyer: buyerId }));
    setBuyerModalVisible(false);
  }, []);

  // Restore full buyer list when modal opens
  React.useEffect(() => {
    if (buyerModalVisible) {
      if (allBuyerOptions.length > 0) {
        console.log('[GenerateQR] Buyer modal opened, restoring full buyer list:', allBuyerOptions.length);
        setBuyerOptions(allBuyerOptions);
      } else {
        console.warn('[GenerateQR] Buyer modal opened but allBuyerOptions is empty! Buyers might not be loaded yet.');
      }
    }
  }, [buyerModalVisible, allBuyerOptions.length]); // Trigger when modal opens or allBuyerOptions length changes

  // Restore full seller list when modal opens
  React.useEffect(() => {
    if (sellerNameModalVisible) {
      if (sellers.length > 0) {
        console.log('[GenerateQR] Seller modal opened, restoring full seller list:', sellers.length);
        setSellerNameOptions(sellers);
      } else {
        console.warn('[GenerateQR] Seller modal opened but sellers is empty! Sellers might not be loaded yet.');
        // Try to fetch sellers if not loaded
        fetchSellers();
      }
    }
  }, [sellerNameModalVisible, sellers.length]); // Trigger when modal opens or sellers length changes

  const handleCreatedDateSelect = useCallback((dateRange) => {
    setSelectedFilters((prev) => ({ ...prev, createdDate: dateRange }));
    setCreatedDateModalVisible(false);
  }, []);

  const handleFlightDateSelect = useCallback((flightDates) => {
    console.log('[GenerateQR] Flight dates selected:', flightDates);
    setSelectedFilters((prev) => ({ ...prev, flightDate: flightDates }));
    setFlightDateModalVisible(false);
  }, []);

  // Debug: Log when flight date modal opens and what dates are available
  React.useEffect(() => {
    if (flightDateModalVisible) {
      console.log('[GenerateQR] 📅 Flight Date modal opened');
      console.log('[GenerateQR] Available flight dates:', flightDateOptions.length, flightDateOptions);
      const hasFeb28 = flightDateOptions.some(date => date.includes('-02-28'));
      if (hasFeb28) {
        console.log('[GenerateQR] ✅ Feb 28 is in flightDateOptions');
      } else {
        console.warn('[GenerateQR] ⚠️ Feb 28 is NOT in flightDateOptions!');
        console.log('[GenerateQR] All available dates:', flightDateOptions);
      }
    }
  }, [flightDateModalVisible, flightDateOptions]);

  // Debug: Log when flight date modal opens (disabled to prevent infinite loops)
  // React.useEffect(() => {
  //   if (flightDateModalVisible) {
  //     console.log('[GenerateQR] 📅 Flight Date modal opened with options:', flightDateOptions.length, flightDateOptions);
  //   }
  // }, [flightDateModalVisible, flightDateOptions]);

  const handleTransactionSelect = useCallback((transaction) => {
    setSelectedFilters((prev) => ({ ...prev, transaction }));
    setTransactionModalVisible(false);
  }, []);

  const handleJoinerSelect = useCallback((joinerId) => {
    setSelectedFilters((prev) => ({ ...prev, joiner: joinerId }));
    setJoinerModalVisible(false);
  }, []);

  // Helper to check if filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Seller Name':
        return selectedFilters.sellerName !== null;
      case 'Buyer':
        return selectedFilters.buyer !== null;
      case 'Created Date':
        return selectedFilters.createdDate !== null;
      case 'Flight Date':
        return selectedFilters.flightDate !== null && selectedFilters.flightDate.length > 0;
      case 'Transaction':
        return selectedFilters.transaction !== null && selectedFilters.transaction.trim() !== '';
      case 'Joiner':
        return selectedFilters.joiner !== null;
      default:
        return false;
    }
  };

  // Helper to check if any filter is selected
  const hasAnyFilterSelected = () => {
    return (
      selectedFilters.sellerName !== null ||
      selectedFilters.buyer !== null ||
      selectedFilters.createdDate !== null ||
      (selectedFilters.flightDate !== null && selectedFilters.flightDate.length > 0) ||
      (selectedFilters.transaction !== null && selectedFilters.transaction.trim() !== '') ||
      selectedFilters.joiner !== null
    );
  };

  // Filter tabs configuration
  const filterTabs = [
    { label: 'Seller Name', rightIcon: DownIcon },
    { label: 'Buyer', rightIcon: DownIcon },
    { label: 'Created Date', leftIcon: SortIcon, rightIcon: DownIcon },
    { label: 'Flight Date', rightIcon: DownIcon },
    { label: 'Transaction', rightIcon: DownIcon },
    { label: 'Joiner', rightIcon: DownIcon },
  ];

  // Filter Tab component
  const FilterTab = ({ filter }) => {
    const isActive = isFilterActive(filter.label);
    
    // Get display label with active filter value
    const getDisplayLabel = () => {
      const baseLabel = filter.label;
      
      if (!isActive) return baseLabel;
      
      switch (filter.label) {
        case 'Seller Name':
          return selectedFilters.sellerName ? `${baseLabel}: ${selectedFilters.sellerName}` : baseLabel;
        case 'Transaction':
          return selectedFilters.transaction ? `${baseLabel}: ${selectedFilters.transaction}` : baseLabel;
        default:
          return baseLabel;
      }
    };
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('[FilterTab] Clicked filter:', filter.label);
          if (filter.label === 'Seller Name') {
            console.log('[FilterTab] Opening Seller Name modal');
            setSellerNameModalVisible(true);
          } else if (filter.label === 'Buyer') {
            console.log('[FilterTab] Opening Buyer modal');
            setBuyerModalVisible(true);
          } else if (filter.label === 'Created Date') {
            console.log('[FilterTab] Opening Created Date modal');
            setCreatedDateModalVisible(true);
          } else if (filter.label === 'Flight Date') {
            console.log('[FilterTab] Opening Flight Date modal');
            setFlightDateModalVisible(true);
          } else if (filter.label === 'Transaction') {
            console.log('[FilterTab] Opening Transaction modal');
            setTransactionModalVisible(true);
          } else if (filter.label === 'Joiner') {
            console.log('[FilterTab] Opening Joiner modal');
            setJoinerModalVisible(true);
          }
        }}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isActive ? '#23C16B' : '#CDD3D4',
          backgroundColor: isActive ? '#E8F5E9' : '#FFFFFF',
          padding: 8,
          marginTop: 5,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        activeOpacity={0.7}
      >
        {filter.leftIcon && (
          <filter.leftIcon
            width={20}
            height={20}
            style={{ marginRight: 4 }}
          />
        )}
        <Text 
          style={{
            fontSize: 14,
            fontWeight: isActive ? '600' : '500',
            color: isActive ? '#23C16B' : '#393D40'
          }}
          numberOfLines={1}
        >
          {getDisplayLabel()}
        </Text>
        {filter.rightIcon && (
          <filter.rightIcon
            width={20}
            height={20}
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Function to sort QR codes by order date
  const sortQRCodesByDate = useCallback((pages, order) => {
    if (!pages || pages.length === 0) return pages;

    // Helper function to parse date for sorting
    const parseDateForSort = (dateInput) => {
      if (!dateInput) return 0;

      try {
        // Handle Firestore Timestamp objects
        if (dateInput && typeof dateInput === 'object') {
          if (dateInput.toDate && typeof dateInput.toDate === 'function') {
            return dateInput.toDate().getTime();
          }
          if (dateInput.seconds) {
            return dateInput.seconds * 1000;
          }
          if (dateInput._seconds) {
            return dateInput._seconds * 1000;
          }
        }

        // Handle strings
        if (typeof dateInput === 'string') {
          let s = String(dateInput).replace(/\u202f|\u00A0/g, ' ').replace(/\s+at\s+/i, ' ');
          let ts = Date.parse(s);
          if (!isNaN(ts)) return ts;

          const noTz = s.replace(/\bUTC.*$|\bGMT.*$|\b[+-]\d{1,4}(:?\d{2})?$/i, '').trim();
          ts = Date.parse(noTz);
          if (!isNaN(ts)) return ts;

          const cleaned = noTz.replace(/,/g, '');
          ts = Date.parse(cleaned);
          if (!isNaN(ts)) return ts;
        }

        // Handle numeric timestamps
        if (typeof dateInput === 'number') {
          const ms = dateInput < 4102444800000 ? dateInput * 1000 : dateInput;
          return ms;
        }

        const parsed = new Date(dateInput);
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      } catch (error) {
        return 0;
      }
    };

    // Flatten all QR codes from all pages
    const allQRCodes = pages.flatMap(page => page.qrcodes || []);

    // Sort all QR codes by date
    const sortedQRCodes = [...allQRCodes].sort((a, b) => {
      const dateA = parseDateForSort(a.orderDate || a.createdAt);
      const dateB = parseDateForSort(b.orderDate || b.createdAt);

      if (order === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    // Debug: Log first and last QR code dates with plant codes for verification
    if (sortedQRCodes.length > 0) {
      const first = sortedQRCodes[0];
      const last = sortedQRCodes[sortedQRCodes.length - 1];
      const firstDate = first.orderDate || first.createdAt;
      const lastDate = last.orderDate || last.createdAt;
      console.log(`[GenerateQR] Sorted ${sortedQRCodes.length} QR codes. Order: ${order}`);
      console.log(`[GenerateQR] First: ${first.plantCode} - ${firstDate} (orderDate: ${first.orderDate}, createdAt: ${first.createdAt})`);
      console.log(`[GenerateQR] Last: ${last.plantCode} - ${lastDate} (orderDate: ${last.orderDate}, createdAt: ${last.createdAt})`);
    }

    // Re-paginate the sorted QR codes (16 items per page for 4x4 grid)
    const itemsPerPage = 16;
    const newPages = [];

    for (let i = 0; i < sortedQRCodes.length; i += itemsPerPage) {
      const chunk = sortedQRCodes.slice(i, i + itemsPerPage);
      // Use the createdAt from the first page (earliest date)
      const pageDate = pages[0]?.createdAt || null;

      newPages.push({
        qrcodes: chunk,
        createdAt: pageDate,
      });
    }

    return newPages;
  }, []);

  // Function to fetch active flight schedules (Saturdays only, excluding canceled)
  const fetchFlightSchedules = useCallback(async () => {
    try {
      console.log('[GenerateQR] Fetching flight schedules...');
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.warn('[GenerateQR] No auth token found');
        return [];
      }

      const url = API_ENDPOINTS.GET_FLIGHT_SCHEDULE;
      console.log('[GenerateQR] Flight schedule URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[GenerateQR] Failed to fetch flight schedules:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('[GenerateQR] Flight schedules API response received');

      // Get schedule data array (response structure: { success: true, data: [...] })
      const schedules = data.data || data;
      
      if (!Array.isArray(schedules)) {
        console.warn('[GenerateQR] Schedules is not an array:', typeof schedules);
        return [];
      }

      console.log('[GenerateQR] Total schedules received:', schedules.length);

      // Filter for active Saturdays only (exclude canceled)
      const activeSaturdays = schedules
        .map((day, index) => {
          // Extract date first to check if it's Feb 28
          let dateStr = day.date;
          if (!dateStr && day.events && day.events.length > 0) {
            dateStr = day.events[0].flightDate;
          }
          
          let dateObj = null;
          let dateKey = null;
          if (dateStr) {
            try {
              dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                dateKey = dateObj.toISOString().split('T')[0];
                // Check if this is Feb 28
                const isFeb28 = dateKey.includes('-02-28');
                if (isFeb28) {
                  console.log(`[GenerateQR] 🔍 Found Feb 28 schedule at index ${index}:`, {
                    date: dateKey,
                    dayOfWeek: day.dayOfWeek,
                    events: day.events,
                    eventsCount: day.events?.length || 0
                  });
                }
              }
            } catch (e) {
              console.warn('[GenerateQR] Error parsing date:', dateStr, e);
            }
          }

          // Check if day has events and if any event is active (not canceled)
          if (!day.events || !Array.isArray(day.events) || day.events.length === 0) {
            if (dateKey && dateKey.includes('-02-28')) {
              console.log(`[GenerateQR] ❌ Feb 28 excluded: No events`);
            }
            return null;
          }

          // Check if any event is not canceled
          const hasActiveEvent = day.events.some(event => {
            const status = (event.status || '').toString().toLowerCase();
            const isActive = event.isActive !== false; // Default to true
            const notCanceled = status !== 'canceled' && status !== 'cancelled';
            const result = notCanceled && isActive;
            
            if (dateKey && dateKey.includes('-02-28')) {
              console.log(`[GenerateQR] 🔍 Feb 28 event check:`, {
                status,
                isActive,
                notCanceled,
                result
              });
            }
            
            return result;
          });

          // Verify it's a Saturday - check multiple formats and also verify by date
          let isSaturday = false;
          if (day.dayOfWeek) {
            const dayOfWeekLower = day.dayOfWeek.toString().toLowerCase();
            isSaturday = dayOfWeekLower.includes('saturday') || dayOfWeekLower.includes('sat');
          }
          
          // Double-check by calculating day of week from date
          if (dateObj && !isNaN(dateObj.getTime())) {
            const calculatedDay = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
            if (calculatedDay === 6) {
              isSaturday = true;
            } else if (isSaturday && calculatedDay !== 6) {
              console.warn(`[GenerateQR] ⚠️ DayOfWeek mismatch for ${dateKey}: dayOfWeek says Saturday but date is day ${calculatedDay}`);
            }
          }
          
          if (dateKey && dateKey.includes('-02-28')) {
            console.log(`[GenerateQR] 🔍 Feb 28 Saturday check:`, {
              dayOfWeek: day.dayOfWeek,
              isSaturday,
              hasActiveEvent,
              willInclude: hasActiveEvent && isSaturday
            });
          }
          
          if (!hasActiveEvent || !isSaturday) {
            return null;
          }

          return dateKey;
        })
        .filter(date => date !== null)
        .sort(); // Sort dates chronologically

      // Check if Feb 28 is in the final list
      const hasFeb28 = activeSaturdays.some(date => date.includes('-02-28'));
      if (hasFeb28) {
        console.log(`[GenerateQR] ✅ Feb 28 is included in active Saturdays`);
      } else {
        console.warn(`[GenerateQR] ⚠️ Feb 28 is NOT in the final list!`);
        console.log(`[GenerateQR] All active Saturdays:`, activeSaturdays);
      }

      console.log('[GenerateQR] ✅ Active Saturday flight dates (excluding canceled):', activeSaturdays.length, activeSaturdays);
      return activeSaturdays;
    } catch (error) {
      console.error('[GenerateQR] ❌ Error fetching flight schedules:', error);
      return [];
    }
  }, []);

  // Function to fetch filter options without loading QR codes
  const fetchFilterOptions = useCallback(async () => {
    try {
      console.log('[GenerateQR] Fetching filter options...');
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.warn('[GenerateQR] No auth token found');
        return;
      }

      // Fetch active flight schedules (Saturdays only, excluding canceled) from schedule API
      const activeSaturdays = await fetchFlightSchedules();
      if (activeSaturdays.length > 0) {
        setFlightDateOptions(activeSaturdays);
      } else {
        console.warn('[GenerateQR] No active Saturday flight dates found from schedule');
        setFlightDateOptions([]);
      }

      // Call API to get filter options (buyers, joiners) from orders
      // Add filterOptionsOnly parameter to skip heavy order processing
      const url = `${API_ENDPOINTS.QR_GENERATOR_ORDERS}?filterOptionsOnly=true`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[GenerateQR] Failed to fetch filter options:', response.status);
        return;
      }

      const data = await response.json();
      console.log('[GenerateQR] Filter options API response received');

      // Extract and set filter options
      if (data.buyers && Array.isArray(data.buyers)) {
        console.log('[GenerateQR] Buyer options loaded:', data.buyers.length, 'buyers');
        setAllBuyerOptions(data.buyers); // Store full list
        setBuyerOptions(data.buyers); // Set current options
      } else {
        console.log('[GenerateQR] No buyer data in API response');
      }
      if (data.joiners && Array.isArray(data.joiners)) {
        console.log('[GenerateQR] Joiner options loaded:', data.joiners.length, 'joiners');
        setJoinerOptions(data.joiners);
      }
    } catch (error) {
      console.error('[GenerateQR] Error fetching filter options:', error);
    }
  }, [fetchFlightSchedules]);

  // Track if initial load has been done to prevent infinite loops
  const hasInitialized = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#fff');
      }
      
      // Only initialize once when screen first mounts
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        
        const initializeScreen = async () => {
          try {
            console.log('[GenerateQR] Initializing screen (first time only)...');
            
            // Fetch sellers when screen comes into focus
            fetchSellers();
            
            // Fetch filter options (buyers, joiners, flight dates) without showing loading state
            await fetchFilterOptions();
            
            // Set initial state to show empty screen with filters available
            setLoading(false);
            setQrCodeData([]);
            
            console.log('[GenerateQR] Screen initialization complete');
          } catch (error) {
            console.error('[GenerateQR] Error initializing screen:', error);
            hasInitialized.current = false; // Reset on error so it can retry
          }
        };

        initializeScreen();
      } else {
        console.log('[GenerateQR] Screen already initialized, skipping...');
      }
    }, []) // Empty deps - only run once
  );

  // Handle Submit button click - manually trigger QR code generation
  const handleSubmit = useCallback(async () => {
    await fetchQRCodeData();
  }, [fetchQRCodeData]);

  // Handle Reset All Filters button click - clear all filters and QR codes
  const handleResetAllFilters = useCallback(() => {
    setSelectedFilters({
      sellerName: null,
      buyer: null,
      createdDate: null,
      flightDate: [],
      transaction: null,
      joiner: null,
    });
    setQrCodeData([]);
    setError(null);
    console.log('[GenerateQR] All filters reset');
  }, []);

  // Removed auto-loading - QR codes now only load when Submit button is clicked

  const formatGeneratedDate = (dateInput) => {
    if (!dateInput) return 'Unknown';

    try {
      let date = null;

      // Object-like Firestore Timestamp
      if (dateInput && typeof dateInput === 'object') {
        if (dateInput.toDate && typeof dateInput.toDate === 'function') {
          date = dateInput.toDate();
        } else if (dateInput.seconds) {
          date = new Date(dateInput.seconds * 1000);
        } else if (dateInput._seconds) {
          date = new Date(dateInput._seconds * 1000);
        } else {
          date = new Date(dateInput);
        }
      } else if (typeof dateInput === 'string') {
        // Normalize NBSP and ' at ' and try parsing with and without timezone
        let s = String(dateInput).replace(/\u202f|\u00A0/g, ' ').replace(/\s+at\s+/i, ' ');
        let ts = Date.parse(s);
        if (!isNaN(ts)) date = new Date(ts);
        if (!date) {
          const noTz = s.replace(/\bUTC.*$|\bGMT.*$|\b[+-]\d{1,4}(:?\d{2})?$/i, '').trim();
          ts = Date.parse(noTz);
          if (!isNaN(ts)) date = new Date(ts);
        }
        if (!date) {
          const cleaned = (s.replace(/\bUTC.*$|\bGMT.*$|\b[+-]\d{1,4}(:?\d{2})?$/i, '').trim()).replace(/,/g, '');
          ts = Date.parse(cleaned);
          if (!isNaN(ts)) date = new Date(ts);
        }
      } else if (typeof dateInput === 'number') {
        const ms = dateInput < 4102444800000 ? dateInput * 1000 : dateInput;
        date = new Date(ms);
      } else {
        date = new Date(dateInput);
      }

      if (!date || isNaN(date.getTime())) return 'Unknown';

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateInput);
      return 'Unknown';
    }
  };

  // Seller selection is now optional - removed blocking UI

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateQRHeader navigation={navigation} />

        {/* Filter Tabs */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            {filterTabs.map((filter) => (
              <FilterTab key={filter.label} filter={filter} />
            ))}
          </ScrollView>
          
          {/* Reset All Filters Button */}
          <TouchableOpacity
            onPress={handleResetAllFilters}
            style={[styles.resetButton, styles.resetButtonDisabled]}
            activeOpacity={0.7}
            disabled={true}
          >
            <Text style={[styles.resetButtonText, styles.resetButtonTextDisabled]}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity style={[styles.submitButton, styles.submitButtonDisabled]} disabled={true}>
            <Text style={styles.submitButtonText}>Loading...</Text>
          </TouchableOpacity>
        </View>

        {/* Skeleton Loader - Only show if filters are selected */}
        {hasAnyFilterSelected() && (
          <View style={styles.mainContent}>
            <ScrollView contentContainerStyle={styles.flatListContent}>
              <QRCodeSkeleton />
            </ScrollView>
          </View>
        )}

        {/* Empty State - Show if no filters selected */}
        {!hasAnyFilterSelected() && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No filters selected. Apply filters and click "Generate QR Codes" to start.
            </Text>
          </View>
        )}

        {/* Filter Modals */}
        <SellerNameFilter
          isVisible={sellerNameModalVisible}
          onClose={() => setSellerNameModalVisible(false)}
          onSelectSellerName={handleSellerNameSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, sellerName: null }));
            setSellerNameModalVisible(false);
          }}
          currentSellerName={selectedFilters.sellerName || ''}
          sellers={sellerNameOptions}
          onSearch={handleSellerSearch}
        />

        <DateRangeFilter
          isVisible={createdDateModalVisible}
          onClose={() => setCreatedDateModalVisible(false)}
          onSelectDateRange={handleCreatedDateSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, createdDate: null }));
            setCreatedDateModalVisible(false);
          }}
        />

        <PlantFlightFilter
          isVisible={flightDateModalVisible}
          onClose={() => setFlightDateModalVisible(false)}
          flightDates={flightDateOptions}
          selectedValues={selectedFilters.flightDate || []}
          onSelectFlight={handleFlightDateSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, flightDate: [] }));
            setFlightDateModalVisible(false);
          }}
        />

        <BuyerFilter
          isVisible={buyerModalVisible}
          onClose={() => setBuyerModalVisible(false)}
          onSelectBuyer={handleBuyerSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, buyer: null }));
            setBuyerModalVisible(false);
          }}
          buyers={buyerOptions}
          onSearch={handleBuyerSearch}
        />

        <TransactionFilter
          isVisible={transactionModalVisible}
          onClose={() => setTransactionModalVisible(false)}
          onSelectTransaction={handleTransactionSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, transaction: null }));
            setTransactionModalVisible(false);
          }}
          currentTransaction={selectedFilters.transaction || ''}
        />

        <JoinerFilter
          isVisible={joinerModalVisible}
          onClose={() => setJoinerModalVisible(false)}
          onSelectJoiner={handleJoinerSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, joiner: null }));
            setJoinerModalVisible(false);
          }}
          joiners={joinerOptions}
        />
      </SafeAreaView>
    );
  }

  if (error || qrCodeData.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateQRHeader navigation={navigation} />

        {/* Filter Tabs */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            {filterTabs.map((filter) => (
              <FilterTab key={filter.label} filter={filter} />
            ))}
          </ScrollView>
          
          {/* Reset All Filters Button */}
          <TouchableOpacity
            onPress={handleResetAllFilters}
            style={styles.resetButton}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Generate QR Codes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error || 'No QR codes generated yet. Apply filters and click "Generate QR Codes" to start.'}
          </Text>
          {error && (
            <TouchableOpacity style={styles.retryButton} onPress={handleSubmit}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          {qrCodeData.length > 0 && (
            <TouchableOpacity 
              style={[styles.sendEmailButton, downloading && styles.sendEmailButtonDisabled]} 
              onPress={handleSendEmail}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <DownloadIcon width={20} height={20} fill="#FFFFFF" />
                  <Text style={styles.sendEmailButtonText}>Send QR Codes via Email</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Modals */}
        <SellerNameFilter
          isVisible={sellerNameModalVisible}
          onClose={() => setSellerNameModalVisible(false)}
          onSelectSellerName={handleSellerNameSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, sellerName: null }));
            setSellerNameModalVisible(false);
          }}
          currentSellerName={selectedFilters.sellerName || ''}
          sellers={sellerNameOptions}
          onSearch={handleSellerSearch}
        />

        <DateRangeFilter
          isVisible={createdDateModalVisible}
          onClose={() => setCreatedDateModalVisible(false)}
          onSelectDateRange={handleCreatedDateSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, createdDate: null }));
            setCreatedDateModalVisible(false);
          }}
        />

        <PlantFlightFilter
          isVisible={flightDateModalVisible}
          onClose={() => setFlightDateModalVisible(false)}
          flightDates={flightDateOptions}
          selectedValues={selectedFilters.flightDate || []}
          onSelectFlight={handleFlightDateSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, flightDate: [] }));
            setFlightDateModalVisible(false);
          }}
        />

        <BuyerFilter
          isVisible={buyerModalVisible}
          onClose={() => setBuyerModalVisible(false)}
          onSelectBuyer={handleBuyerSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, buyer: null }));
            setBuyerModalVisible(false);
          }}
          buyers={buyerOptions}
          onSearch={handleBuyerSearch}
        />

        <TransactionFilter
          isVisible={transactionModalVisible}
          onClose={() => setTransactionModalVisible(false)}
          onSelectTransaction={handleTransactionSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, transaction: null }));
            setTransactionModalVisible(false);
          }}
          currentTransaction={selectedFilters.transaction || ''}
        />

        <JoinerFilter
          isVisible={joinerModalVisible}
          onClose={() => setJoinerModalVisible(false)}
          onSelectJoiner={handleJoinerSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, joiner: null }));
            setJoinerModalVisible(false);
          }}
          joiners={joinerOptions}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GenerateQRHeader navigation={navigation} />

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          {filterTabs.map((filter) => (
            <FilterTab key={filter.label} filter={filter} />
          ))}
        </ScrollView>
        
        {/* Reset All Filters Button */}
        <TouchableOpacity
          onPress={handleResetAllFilters}
          style={styles.resetButton}
          activeOpacity={0.7}
        >
          <Text style={styles.resetButtonText}>Reset All Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Loading...' : 'Generate QR Codes'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Send Email Button */}
      <View style={styles.emailButtonContainer}>
        <TouchableOpacity 
          style={[styles.sendEmailButton, downloading && styles.sendEmailButtonDisabled]} 
          onPress={handleSendEmail}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <DownloadIcon width={20} height={20} fill="#FFFFFF" />
              <Text style={styles.sendEmailButtonText}>Send QR Codes via Email</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <FlatList
          data={qrCodeData}
          keyExtractor={(item, index) => `page-${index}`}
          contentContainerStyle={styles.flatListContent}
          renderItem={({item: pageData}) => {
            // Calculate dynamic container height based on actual number of items
            const itemWidth = 80;
            const itemHeight = 170;
            const rowSpacing = 10; // Reduced spacing between rows
            const numRows = Math.ceil(pageData.qrcodes.length / 4);
            const containerHeight = (numRows * itemHeight) + ((numRows - 1) * rowSpacing) + 10; // Add small padding at bottom
            
            return (
              <View style={styles.pageContainer}>
              <View style={styles.contentWrapper}>
                <View style={[styles.qrListContainer, { height: containerHeight }]}>
                  {pageData.qrcodes.map((item, index) => {
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    // Calculate positions based on available width
                    const containerWidth = Dimensions.get('window').width - 48; // Account for padding
                    const spacing = (containerWidth - (itemWidth * 4)) / 3; // Space between items
                    const left = col * (itemWidth + spacing);
                    const top = row * (itemHeight + rowSpacing); // Use itemHeight + rowSpacing for consistent spacing
                    
                    return (
                      <View 
                        key={item.id}
                          style={[
                          styles.qrItemContainer,
                          {
                            left: left,
                            top: top,
                            height: 170, // Further reduced height to minimize bottom gap
                          }
                        ]}
                      >
                        <View style={styles.qrItemContent}>
                          <View style={styles.qrContentInner}>
                            <Image
                              source={
                                item.dataUrl 
                                  ? { uri: item.dataUrl }
                                  : require('../../../assets/images/qr-code.png')
                              }
                              style={styles.qrCodeImage}
                            />
                            {item.createdAt && (
                              <Text style={styles.orderDate} numberOfLines={1}>
                                {formatGeneratedDate(item.createdAt)}
                              </Text>
                            )}
                            {item.plantCode && (
                              <Text style={styles.plantCode} numberOfLines={1}>
                                {item.plantCode}
                              </Text>
                            )}
                            {(item.genus || item.species) && (
                              <Text style={styles.genusSpecies} numberOfLines={3}>
                                {item.genus || ''} {item.species || ''}
                              </Text>
                            )}
                            {item.gardenOrCompanyName && (
                              <Text style={styles.garden} numberOfLines={1}>
                                {item.gardenOrCompanyName}
                              </Text>
                            )}
                            {item.receiverInfo && (
                              <Text style={styles.receiver} numberOfLines={1}>
                                {item.receiverInfo.firstName || ''} {item.receiverInfo.lastName || ''}
                              </Text>
                            )}
                            {item.joinerInfo && (
                              <Text style={styles.joiner} numberOfLines={1}>
                                {item.joinerInfo.firstName || ''} {item.joinerInfo.lastName || ''}
                              </Text>
                            )}
                            {item.flightDateFormatted && (
                              <Text style={styles.flightDate} numberOfLines={2}>
                                Flight: {item.flightDateFormatted}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
            );
          }}
        />
      </View>

      {/* Filter Modals */}
      <SellerNameFilter
        isVisible={sellerNameModalVisible}
        onClose={() => setSellerNameModalVisible(false)}
        onSelectSellerName={handleSellerNameSelect}
        onReset={() => {
          setSelectedFilters((prev) => ({ ...prev, sellerName: null }));
          setSellerNameModalVisible(false);
        }}
        currentSellerName={selectedFilters.sellerName || ''}
        sellers={sellers}
      />

      <DateRangeFilter
        isVisible={createdDateModalVisible}
        onClose={() => setCreatedDateModalVisible(false)}
        onSelectDateRange={handleCreatedDateSelect}
        onReset={() => {
          setSelectedFilters((prev) => ({ ...prev, createdDate: null }));
          setCreatedDateModalVisible(false);
        }}
      />

      <PlantFlightFilter
        isVisible={flightDateModalVisible}
        onClose={() => setFlightDateModalVisible(false)}
        flightDates={flightDateOptions}
        selectedValues={selectedFilters.flightDate || []}
        onSelectFlight={handleFlightDateSelect}
        onReset={() => {
          setSelectedFilters((prev) => ({ ...prev, flightDate: [] }));
          setFlightDateModalVisible(false);
        }}
      />

      <BuyerFilter
        isVisible={buyerModalVisible}
        onClose={() => setBuyerModalVisible(false)}
        onSelectBuyer={handleBuyerSelect}
        onReset={() => {
          setSelectedFilters((prev) => ({ ...prev, buyer: null }));
          setBuyerModalVisible(false);
        }}
        buyers={buyerOptions}
      />

      <TransactionFilter
        isVisible={transactionModalVisible}
        onClose={() => setTransactionModalVisible(false)}
        onSelectTransaction={handleTransactionSelect}
        onReset={() => {
          setSelectedFilters((prev) => ({ ...prev, transaction: null }));
          setTransactionModalVisible(false);
        }}
        currentTransaction={selectedFilters.transaction || ''}
      />

      <JoinerFilter
        isVisible={joinerModalVisible}
        onClose={() => setJoinerModalVisible(false)}
        onSelectJoiner={handleJoinerSelect}
        onReset={() => {
          setSelectedFilters((prev) => ({ ...prev, joiner: null }));
          setJoinerModalVisible(false);
        }}
        joiners={joinerOptions}
      />
    </SafeAreaView>
  );
};

export default GenerateQR;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    height: 58,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    flex: 1,
  },
  submitButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23C16B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#CDD3D4',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#647276',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonTextDisabled: {
    color: '#CDD3D4',
  },
  emailButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sendEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#539461',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  sendEmailButtonDisabled: {
    opacity: 0.6,
  },
  sendEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    width: '100%',
  },
  flatListContent: {
    paddingBottom: 20, // Ensure last page has space at bottom
  },
  pageContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 0,
    width: Dimensions.get('window').width - 32, // Fit screen with padding
    backgroundColor: '#FFFFFF',
    flex: 0,
    marginBottom: 20,
  },
  contentWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 8,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  qrListContainer: {
    position: 'relative',
    width: '100%',
    // Height will be set dynamically based on number of items
  },
  qrItemContainer: {
    position: 'absolute',
    width: 80, // Scaled for mobile
    height: 170, // Further reduced height to minimize bottom gap
  },
  qrItemContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 0, // Minimal bottom padding
    gap: 1, // Reduced gap between elements
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    width: '100%',
    height: '95%',
  },
  qrContentInner: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0, // No bottom padding
    gap: 1, // Reduced gap
    width: '100%',
    flexShrink: 0, // Don't shrink, just fit content
  },
  qrCodeImage: {
    width: 50, // QR code size
    height: 50, // QR code size
    flex: 0,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 6.5, // Slightly smaller to fit better
    lineHeight: 8,
    textAlign: 'center',
    color: '#202325',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 1, // Reduced top margin
    paddingHorizontal: 1, // Small padding to prevent edge cutoff
  },
  orderDate: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#202325',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0,
    paddingHorizontal: 1,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#FF6B35',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0,
    paddingHorizontal: 1,
  },
  genusSpecies: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5, // Smaller font to fit more text
    lineHeight: 7,
    textAlign: 'center',
    color: '#666666',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0, // No top margin
    paddingHorizontal: 1, // Small padding to prevent edge cutoff
  },
  garden: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#8B4513',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0,
    paddingHorizontal: 1,
  },
  seller: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#6A5ACD',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0,
    paddingHorizontal: 1,
  },
  receiver: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#4CAF50',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0, // No top margin
    paddingHorizontal: 1, // Small padding to prevent edge cutoff
  },
  joiner: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#FF9800',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0, // No top margin
    paddingHorizontal: 1, // Small padding to prevent edge cutoff
  },
  flightDate: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#666666',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  sellerDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  sellerDropdownText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    marginRight: 8,
  },
  clearSellerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F7F3',
  },
  clearSellerText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#539461',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 569,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  modalHeaderTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  sellerListContainer: {
    height: 343,
    marginTop: 16,
  },
  sellerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#CDD3D4',
  },
  sellerAvatarText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  sellerInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  sellerEmail: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 4,
  },
  emptySellerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySellerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  selectSellerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectSellerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
  },
  // Skeleton loader styles
  skeletonItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 0,
    gap: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    height: '95%',
    borderRadius: 4,
  },
  skeletonQR: {
    width: 50,
    height: 50,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonLine: {
    width: '80%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 2,
  },
  skeletonLineShort: {
    width: '60%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 2,
  },
});
