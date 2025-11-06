import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../config/apiConfig';

// Import icons - using a placeholder for the back arrow and email icon
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../../assets/icons/accent/download.svg'; // Using download icon for email

const ScreenExportQR = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [qrCodeData, setQrCodeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Function to handle email sending
  const handleSendEmail = async () => {
    try {
      setDownloading(true);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(API_ENDPOINTS.QR_GENERATOR, {
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

      const response = await fetch(API_ENDPOINTS.QR_GENERATOR_ORDERS, {
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

    // Group orders by date and organize into pages
    const groupedByDate = {};
    
    ordersArray.forEach((order, orderIndex) => {
      // Parse createdAt date from various formats
      const createdAtDate = parseDate(order.createdAt || order.orderDate);
      
      const date = createdAtDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
      });
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }

      // Add QR code from the order (note: it's qrCode, not qrCodes)
      if (order.qrCode && order.qrCode.content) {
        const qrContent = order.qrCode.content;
        
        // Use QR code generatedAt if available, otherwise use order createdAt
        const displayDate = order.qrCode.generatedAt || order.createdAt || order.orderDate;
        
        // Format flight date
        const formatFlightDate = (flightDate) => {
          if (!flightDate) return null;
          try {
            const date = parseDate(flightDate);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (e) {
            return flightDate;
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
          flightDate = flightDate || firstProduct.flightDate || firstProduct.flightDateFormatted || null;
        }
        
        groupedByDate[date].push({
          id: order.qrCode.id || order.qrCode.qrCodeId || qrContent.orderId,
          plantCode: plantCode,
          trxNumber: order.trxNumber || qrContent.trxNumber,
          orderId: order.id || qrContent.orderId,
          genus: genus,
          species: species,
          variegation: order.variegation || qrContent.variegation || '',
          flightDate: flightDate,
          flightDateFormatted: formatFlightDate(flightDate),
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
        
        // Format flight date
        const formatFlightDate = (flightDate) => {
          if (!flightDate) return null;
          try {
            const date = parseDate(flightDate);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (e) {
            return flightDate;
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
          flightDate = flightDate || firstProduct.flightDate || firstProduct.flightDateFormatted || null;
        }
        
        groupedByDate[date].push({
          id: order.qrCode.id || order.qrCode.qrCodeId,
          plantCode: plantCode,
          trxNumber: order.trxNumber || order.transactionNumber || order.orderId,
          genus: genus,
          species: species,
          variegation: order.variegation || '',
          flightDate: flightDate,
          flightDateFormatted: formatFlightDate(flightDate),
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
      } else {
        // No QR codes found in this order
      }
    });

    // Convert to pages with pagination (20 items per page)
    const pages = [];
    const itemsPerPage = 20;
    
    Object.entries(groupedByDate).forEach(([date, items], pageIndex) => {
      // Split items into chunks of 20
      for (let i = 0; i < items.length; i += itemsPerPage) {
        const chunk = items.slice(i, i + itemsPerPage);
        const pageNumber = Math.floor(i / itemsPerPage) + 1;
        const totalPages = Math.ceil(items.length / itemsPerPage);
        
        // Use the QR code's generatedAt if available, otherwise use the first item's createdAt
        const firstItem = chunk[0];
        let pageDate = new Date().toISOString(); // Default fallback
        
        if (firstItem) {
          // Prefer generatedAt from QR code, then createdAt
          const dateSource = firstItem.generatedAt || firstItem.createdAt;
          if (dateSource) {
            try {
              const parsedDate = parseDate(dateSource);
              if (!isNaN(parsedDate.getTime())) {
                pageDate = parsedDate.toISOString();
              }
            } catch (e) {
              console.warn('Error parsing page date:', e);
            }
          }
        }
        
        pages.push({
          date: date,
          page: `${pageNumber} of ${totalPages}`,
          qrcodes: chunk,
          createdAt: pageDate,
        });
      }
    });

    return pages;
  };

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#fff');
      }
      
      // Fetch data when screen comes into focus
      fetchQRCodeData();
    }, [])
  );

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Export QR Code</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading QR codes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || qrCodeData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Export QR Code</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error || 'No QR codes available for this period'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQRCodeData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.content}>
        <View style={styles.controls}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>

          {/* Navbar Right */}
          <View style={styles.navbarRight}>
            {/* Search - Hidden by default */}
            <View style={[styles.searchButton, {display: 'none'}]}>
              {/* Search icon would go here */}
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton,
                downloading && styles.actionButtonDisabled
              ]}
              onPress={handleSendEmail}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <DownloadIcon width={24} height={24} />
              )}
            </TouchableOpacity>

            {/* Profile - Hidden by default */}
            <View style={[styles.profileButton, {display: 'none'}]}>
              {/* Profile content would go here */}
            </View>

            {/* Page - Hidden by default */}
            <View style={[styles.pageButton, {display: 'none'}]}>
              {/* Page content would go here */}
            </View>

            {/* Link - Hidden by default */}
            <View style={[styles.linkButton, {display: 'none'}]}>
              {/* Link content would go here */}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Export QR Code</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <FlatList
          data={qrCodeData}
          keyExtractor={(item, index) => `page-${index}`}
          renderItem={({item: pageData}) => (
            <View style={styles.pageContainer}>
              <View style={styles.contentWrapper}>
                <View style={styles.detailsContainer}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>Date generated:</Text>
                    <Text style={styles.dateText}>{formatGeneratedDate(pageData.createdAt)}</Text>
                  </View>
                  <View style={styles.pageInfoContainer}>
                    <Text style={styles.pageText}>Page {pageData.page}</Text>
                  </View>
                </View>
                <View style={styles.qrListContainer}>
                  {pageData.qrcodes.map((item, index) => {
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    // Calculate positions based on available width
                    const containerWidth = Dimensions.get('window').width - 48; // Account for padding
                    const itemWidth = 80;
                    const spacing = (containerWidth - (itemWidth * 4)) / 3; // Space between items
                    const left = col * (itemWidth + spacing);
                    const top = row * (itemWidth + 90); // Reduced spacing to match reduced height
                    
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
                            {(item.genus || item.species) && (
                              <Text style={styles.genusSpecies} numberOfLines={3}>
                                {item.genus || ''} {item.species || ''}
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
                                Flight Date: {item.flightDateFormatted}
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
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default ScreenExportQR;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: Dimensions.get('window').width,
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: Dimensions.get('window').width,
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
    position: 'relative',
  },
  backButton: {
    width: 24,
    height: 24,
    zIndex: 0,
  },
  navbarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 319,
    height: 40,
    flex: 1,
    zIndex: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
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
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 40,
  },
  pageButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    width: 33,
    height: 32,
    minHeight: 32,
    borderRadius: 1000,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    width: 54,
    height: 22,
  },
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: Dimensions.get('window').width / 2 - 240 / 2 + 0.5,
    top: 14,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    zIndex: 2,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 16,
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
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 12,
    width: '100%',
    height: 48,
    flex: 0,
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
    width: 280.5,
    height: 12,
    flex: 0,
    order: 0,
  },
  dateLabel: {
    width: 78,
    height: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    flex: 0,
    order: 0,
  },
  dateText: {
    width: 110,
    height: 12,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    flex: 0,
    order: 1,
  },
  pageInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 10,
    width: 280.5,
    height: 12,
    flex: 1,
    order: 1,
  },
  pageText: {
    width: 32,
    height: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    textAlign: 'right',
    flex: 0,
    order: 0,
  },
  qrList: {
    width: '100%',
    alignSelf: 'stretch',
    flex: 0,
  },
  qrListContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 700, // Increased to accommodate taller items
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
    height: '65%',
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
  flightDate: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.5,
    lineHeight: 7,
    textAlign: 'center',
    color: '#666666',
    alignSelf: 'stretch',
    flex: 0,
    marginTop: 0, // No top margin
    marginBottom: 0, // No bottom margin
    paddingHorizontal: 1, // Small padding to prevent edge cutoff
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
  trxNumber: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 7, // Slightly smaller than plant code
    lineHeight: 9,
    textAlign: 'center',
    color: '#666666', // Lighter color to differentiate from plant code
    alignSelf: 'stretch',
    flex: 0,
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
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
