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

// Custom Header with Centered Title and Seller Dropdown
const GenerateQRHeader = ({ navigation, selectedSeller, onSellerPress }) => {
  const sellerName = selectedSeller 
    ? (selectedSeller.name || `${selectedSeller.firstName || ''} ${selectedSeller.lastName || ''}`.trim() || selectedSeller.email || 'All Sellers')
    : 'All Sellers';

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
  const [qrCodeData, setQrCodeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  // Function to handle email sending
  const handleSendEmail = async () => {
    try {
      setDownloading(true);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build URL with seller filter if selected
      let url = API_ENDPOINTS.QR_GENERATOR;
      if (selectedSeller && selectedSeller.uid) {
        url += `?sellerUid=${encodeURIComponent(selectedSeller.uid)}`;
      }

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
          console.log(`✅ Loaded ${sellerResults.length} sellers`);
        }
      }
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoadingSellers(false);
    }
  };

  // Function to fetch QR code data from API
  const fetchQRCodeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build URL with seller filter if selected
      let url = API_ENDPOINTS.QR_GENERATOR_ORDERS;
      if (selectedSeller && selectedSeller.uid) {
        url += `?sellerUid=${encodeURIComponent(selectedSeller.uid)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
      
      // Check if API response indicates no orders
      if (!data.success && data.error && data.error.includes('No orders found')) {
        setQrCodeData([]);
        setError('No QR codes found for the current period.');
        return; // Don't show alert, just set the error state
      }
      
      // Transform API data to match the expected format
      const transformedData = transformApiData(data);
      
      // Check if no orders were found after transformation
      if (transformedData.length === 0) {
        setQrCodeData([]);
        setError('No QR codes found for the current period.');
      } else {
        setQrCodeData(transformedData);
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
  };

  // Transform API data to match the UI structure
  const transformApiData = (apiData) => {
    // Check if the API returns data in 'data' key instead of 'orders'
    const ordersArray = apiData?.data || apiData?.orders || apiData;
    
    if (!ordersArray || !Array.isArray(ordersArray)) {
      return [];
    }

    // Helper function to parse date from various formats (Firestore Timestamp, ISO string, etc.)
    const parseDate = (dateInput) => {
      if (!dateInput) return new Date();
      
      try {
        // Handle Firestore Timestamp objects
        if (dateInput && typeof dateInput === 'object') {
          // Check if it's a Firestore Timestamp (has toDate method)
          if (dateInput.toDate && typeof dateInput.toDate === 'function') {
            return dateInput.toDate();
          }
          // Check if it has seconds property (Firestore Timestamp format)
          else if (dateInput.seconds) {
            return new Date(dateInput.seconds * 1000);
          }
          // Check if it has _seconds property
          else if (dateInput._seconds) {
            return new Date(dateInput._seconds * 1000);
          }
        }
        // Handle ISO strings or other date strings
        else if (typeof dateInput === 'string') {
          return new Date(dateInput);
        }
        // Handle numeric timestamps
        else if (typeof dateInput === 'number') {
          // If it's in seconds (less than year 2100 in milliseconds)
          if (dateInput < 4102444800000) {
            return new Date(dateInput * 1000);
          } else {
            return new Date(dateInput);
          }
        }
        
        return new Date(dateInput);
      } catch (error) {
        console.warn('Date parsing error:', error, dateInput);
        return new Date();
      }
    };

    // Collect all QR codes into a single flat array (no grouping by date)
    const allQRCodes = [];
    let earliestDate = null; // Track earliest date for "Date generated" display
    
    ordersArray.forEach((order, orderIndex) => {
      // Add QR code from the order (note: it's qrCode, not qrCodes)
      if (order.qrCode && order.qrCode.content) {
        const qrContent = order.qrCode.content;
        
        // Use QR code generatedAt if available, otherwise use order createdAt
        const displayDate = order.qrCode.generatedAt || order.createdAt || order.orderDate;
        
        // Track earliest date for "Date generated" display
        if (displayDate) {
          try {
            const parsedDate = parseDate(displayDate);
            if (!earliestDate || parsedDate < earliestDate) {
              earliestDate = parsedDate;
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
          createdAt: displayDate, // Use the properly parsed date
        });
      } else if (order.qrCode) {
        // Fallback for older format without content wrapper
        const displayDate = order.qrCode.generatedAt || order.createdAt || order.orderDate;
        
        // Track earliest date for "Date generated" display
        if (displayDate) {
          try {
            const parsedDate = parseDate(displayDate);
            if (!earliestDate || parsedDate < earliestDate) {
              earliestDate = parsedDate;
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
      
      // Use earliest date for all pages, or current date as fallback
      const pageDate = earliestDate ? earliestDate.toISOString() : new Date().toISOString();
      
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

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#fff');
      }
      
      // Fetch sellers when screen comes into focus
      fetchSellers();
    }, [])
  );

  // Refetch QR codes when seller changes (only if seller is selected)
  React.useEffect(() => {
    if (selectedSeller) {
      fetchQRCodeData();
    } else {
      // Clear QR codes when no seller is selected
      setQrCodeData([]);
      setError(null);
      setLoading(false);
    }
  }, [selectedSeller]);

  const formatGeneratedDate = (dateInput) => {
    if (!dateInput) return 'Unknown';
    
    try {
      let date;
      
      // Handle Firestore Timestamp objects
      if (dateInput && typeof dateInput === 'object') {
        // Check if it's a Firestore Timestamp (has toDate method)
        if (dateInput.toDate && typeof dateInput.toDate === 'function') {
          date = dateInput.toDate();
        }
        // Check if it has seconds property (Firestore Timestamp format)
        else if (dateInput.seconds) {
          date = new Date(dateInput.seconds * 1000);
        }
        // Check if it has _seconds property
        else if (dateInput._seconds) {
          date = new Date(dateInput._seconds * 1000);
        }
        else {
          date = new Date(dateInput);
        }
      }
      // Handle ISO strings or other date strings
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      }
      // Handle numeric timestamps
      else if (typeof dateInput === 'number') {
        // If it's in seconds (less than year 2100 in milliseconds)
        if (dateInput < 4102444800000) {
          date = new Date(dateInput * 1000);
        } else {
          date = new Date(dateInput);
        }
      }
      else {
        date = new Date(dateInput);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
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

  // Show message when no seller is selected
  if (!selectedSeller) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateQRHeader navigation={navigation} selectedSeller={selectedSeller} onSellerPress={() => setShowSellerModal(true)} />
        
        {/* Seller Selection Dropdown */}
        <View style={styles.sellerDropdownContainer}>
          <TouchableOpacity 
            style={styles.sellerDropdown}
            onPress={() => setShowSellerModal(true)}
          >
            <Text style={styles.sellerDropdownText} numberOfLines={1}>
              Select Seller
            </Text>
            <ArrowDownIcon width={20} height={20} fill="#647276" />
          </TouchableOpacity>
        </View>

        {/* Seller Selection Modal */}
        <SellerSelectionModal
          isVisible={showSellerModal}
          onClose={() => setShowSellerModal(false)}
          onSelectSeller={handleSelectSeller}
          sellers={sellers}
          loading={loadingSellers}
        />

        <View style={styles.selectSellerContainer}>
          <Text style={styles.selectSellerText}>Select a seller to generate QR codes</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateQRHeader navigation={navigation} selectedSeller={selectedSeller} onSellerPress={() => setShowSellerModal(true)} />
        
        {/* Seller Selection Dropdown */}
        <View style={styles.sellerDropdownContainer}>
          <TouchableOpacity 
            style={styles.sellerDropdown}
            onPress={() => setShowSellerModal(true)}
          >
            <Text style={styles.sellerDropdownText} numberOfLines={1}>
              {selectedSeller 
                ? (selectedSeller.name || `${selectedSeller.firstName || ''} ${selectedSeller.lastName || ''}`.trim() || selectedSeller.email || 'Selected Seller')
                : 'Select Seller'}
            </Text>
            <ArrowDownIcon width={20} height={20} fill="#647276" />
          </TouchableOpacity>
          {selectedSeller && (
            <TouchableOpacity 
              style={styles.clearSellerButton}
              onPress={handleClearSeller}
            >
              <Text style={styles.clearSellerText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seller Selection Modal */}
        <SellerSelectionModal
          isVisible={showSellerModal}
          onClose={() => setShowSellerModal(false)}
          onSelectSeller={handleSelectSeller}
          sellers={sellers}
          loading={loadingSellers}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading QR codes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || qrCodeData.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateQRHeader navigation={navigation} selectedSeller={selectedSeller} onSellerPress={() => setShowSellerModal(true)} />
        
        {/* Seller Selection Dropdown */}
        <View style={styles.sellerDropdownContainer}>
          <TouchableOpacity 
            style={styles.sellerDropdown}
            onPress={() => setShowSellerModal(true)}
          >
            <Text style={styles.sellerDropdownText} numberOfLines={1}>
              {selectedSeller 
                ? (selectedSeller.name || `${selectedSeller.firstName || ''} ${selectedSeller.lastName || ''}`.trim() || selectedSeller.email || 'Selected Seller')
                : 'Select Seller'}
            </Text>
            <ArrowDownIcon width={20} height={20} fill="#647276" />
          </TouchableOpacity>
          {selectedSeller && (
            <TouchableOpacity 
              style={styles.clearSellerButton}
              onPress={handleClearSeller}
            >
              <Text style={styles.clearSellerText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seller Selection Modal */}
        <SellerSelectionModal
          isVisible={showSellerModal}
          onClose={() => setShowSellerModal(false)}
          onSelectSeller={handleSelectSeller}
          sellers={sellers}
          loading={loadingSellers}
        />

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error || 'No QR codes available for this period'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQRCodeData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sendEmailButton, (!selectedSeller || downloading) && styles.sendEmailButtonDisabled]} 
            onPress={handleSendEmail}
            disabled={!selectedSeller || downloading}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GenerateQRHeader navigation={navigation} selectedSeller={selectedSeller} onSellerPress={() => setShowSellerModal(true)} />
      
      {/* Seller Selection Dropdown */}
      <View style={styles.sellerDropdownContainer}>
        <TouchableOpacity 
          style={styles.sellerDropdown}
          onPress={() => setShowSellerModal(true)}
        >
          <Text style={styles.sellerDropdownText} numberOfLines={1}>
            {selectedSeller 
              ? (selectedSeller.name || `${selectedSeller.firstName || ''} ${selectedSeller.lastName || ''}`.trim() || selectedSeller.email || 'Selected Seller')
              : 'All Sellers'}
          </Text>
          <ArrowDownIcon width={20} height={20} fill="#647276" />
        </TouchableOpacity>
        {selectedSeller && (
          <TouchableOpacity 
            style={styles.clearSellerButton}
            onPress={handleClearSeller}
          >
            <Text style={styles.clearSellerText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Seller Selection Modal */}
      <SellerSelectionModal
        isVisible={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        onSelectSeller={handleSelectSeller}
        sellers={sellers}
        loading={loadingSellers}
      />
      
      {/* Send Email Button */}
      <View style={styles.emailButtonContainer}>
        <TouchableOpacity 
          style={[styles.sendEmailButton, (!selectedSeller || downloading) && styles.sendEmailButtonDisabled]} 
          onPress={handleSendEmail}
          disabled={!selectedSeller || downloading}
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

      {/* Date Generated - Single display at top */}
      {qrCodeData.length > 0 && qrCodeData[0] && (
        <View style={styles.topDateContainer}>
          <Text style={styles.dateLabel}>Date generated:</Text>
          <Text style={styles.dateText}>
            {formatGeneratedDate(qrCodeData[0].createdAt)}
          </Text>
        </View>
      )}

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
                            <Text style={styles.plantCode} numberOfLines={2}>
                              {item.plantCode || 'N/A'}
                            </Text>
                            {item.createdAt && (
                              <Text style={styles.orderDate} numberOfLines={1}>
                                {(() => {
                                  try {
                                    let date;
                                    if (item.createdAt && typeof item.createdAt === 'object') {
                                      if (item.createdAt.toDate && typeof item.createdAt.toDate === 'function') {
                                        date = item.createdAt.toDate();
                                      } else if (item.createdAt.seconds) {
                                        date = new Date(item.createdAt.seconds * 1000);
                                      } else if (item.createdAt._seconds) {
                                        date = new Date(item.createdAt._seconds * 1000);
                                      } else {
                                        date = new Date(item.createdAt);
                                      }
                                    } else if (typeof item.createdAt === 'string') {
                                      date = new Date(item.createdAt);
                                    } else if (typeof item.createdAt === 'number') {
                                      date = new Date(item.createdAt < 4102444800000 ? item.createdAt * 1000 : item.createdAt);
                                    }
                                    return date && !isNaN(date.getTime())
                                      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                      : '';
                                  } catch (e) {
                                    return '';
                                  }
                                })()}
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
                            {item.sellerName && (
                              <Text style={styles.seller} numberOfLines={1}>
                                {item.sellerName}
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
  emailButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  topDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  dateLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    marginRight: 4,
  },
  dateText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
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
});
