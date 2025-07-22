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
  Linking,
  PermissionsAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import PushNotification from 'react-native-push-notification';
import FileViewer from 'react-native-file-viewer';

// Import icons - using a placeholder for the back arrow and action icon
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../../assets/icons/accent/download.svg';

const ScreenExportQR = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [qrCodeData, setQrCodeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Function to request storage permission (Android)
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to storage to download files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Function to configure push notifications
  const configurePushNotifications = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      
      onNotification: function(notification) {
        console.log('Notification received:', notification);
        console.log('User interaction:', notification.userInteraction);
        console.log('Action:', notification.action);
        console.log('UserInfo:', notification.userInfo);
        console.log('Data:', notification.data);
        
        // Handle notification tap
        if (notification.userInteraction) {
          // Get file path from either userInfo or data
          const filePath = notification.userInfo?.filePath || 
                           notification.data?.filePath || 
                           notification.filePath;
          
          console.log('Extracted file path:', filePath);
          
          if (filePath) {
            console.log('Opening file from notification:', filePath);
            // Small delay to ensure app is in foreground
            setTimeout(() => {
              openFile(filePath);
            }, 500);
          } else {
            console.log('No file path found in notification');
          }
        }
        
        // Required for iOS to complete the notification processing
        if (notification.finish && typeof notification.finish === 'function') {
          notification.finish('noData');
        }
      },
      
      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
        
        // Handle action button clicks
        if (notification.action === 'Open') {
          const filePath = notification.userInfo?.filePath || notification.data?.filePath;
          if (filePath) {
            console.log('Opening file from action:', filePath);
            openFile(filePath);
          }
        }
      },
      
      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onRegistrationError: function(err) {
        console.error(err.message, err);
      },
      
      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      
      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,
      
      // (optional) default: true
      // - Specified if permissions (ios) and token (android and ios) will requested or not,
      // - if not, you must call PushNotification.requestPermissions() later
      // - if you are not using remote notification or do not have Firebase installed, use this:
      //     requestPermissions: Platform.OS === 'ios'
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'ileafu_channel',
          channelName: 'iLeafU Notifications',
          channelDescription: 'Notifications for iLeafU app',
          playSound: false,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`createChannel returned '${created}'`)
      );
    }
  };

  // Function to open file safely
  const openFile = async (filePath) => {
    try {
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        Alert.alert('File Not Found', 'The downloaded file could not be found.');
        return;
      }

      console.log('Opening file:', filePath);

      // Try using FileViewer first (better cross-platform support)
      try {
        await FileViewer.open(filePath, {
          displayName: 'QR Codes PDF',
          showOpenWithDialog: true,
          showAppsSuggestions: true,
        });
      } catch (fileViewerError) {
        console.log('FileViewer failed, trying alternative methods:', fileViewerError);
        
        // Fallback to platform-specific methods
        if (Platform.OS === 'android') {
          // For Android, try using intent to open PDF
          const intent = `content://com.android.externalstorage.documents/document/primary:Download/${filePath.split('/').pop()}`;
          Linking.openURL(intent).catch(() => {
            // Fallback to file:// protocol
            Linking.openURL(`file://${filePath}`).catch(() => {
              Alert.alert(
                'Cannot Open File', 
                'Unable to open the PDF file. Please use a file manager to locate and open the file.',
                [
                  {
                    text: 'Open File Manager',
                    onPress: () => Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download'),
                  },
                  {
                    text: 'OK',
                    style: 'cancel'
                  }
                ]
              );
            });
          });
        } else {
          // For iOS
          Linking.openURL(`file://${filePath}`).catch(() => {
            Alert.alert('Cannot Open File', 'Unable to open the PDF file.');
          });
        }
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open the file.');
    }
  };

  // Initialize notifications on component mount
  useEffect(() => {
    configurePushNotifications();
  }, []);

  // Function to handle download
  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://us-central1-i-leaf-u.cloudfunctions.net/qrGenerator', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle different HTTP status codes with user-friendly messages
        if (response.status === 404) {
          throw new Error('No QR codes available for download at this time.');
        } else if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to download QR codes.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Unable to download QR codes. Please try again.');
        }
      }

      const data = await response.json();
      
      // Check if the response indicates no orders found
      if (!data.success || data.error) {
        if (data.error && data.error.includes('No orders found')) {
          throw new Error('No QR codes available for download at this time.');
        } else {
          throw new Error(data.error || 'Unable to download QR codes. Please try again.');
        }
      }

      // If we get here, the API call was successful
      Alert.alert('Success', 'QR codes PDF sent to your email');
      
    } catch (err) {
      console.error('Error downloading QR codes:', err);
      
      // Provide user-friendly error messages
      let userFriendlyMessage;
      
      if (err.message.includes('No authentication token')) {
        userFriendlyMessage = 'Please log in again to download QR codes.';
      } else if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
        userFriendlyMessage = 'No internet connection. Please check your network and try again.';
      } else if (err.message.startsWith('No QR codes available') || 
                 err.message.startsWith('Your session has expired') ||
                 err.message.startsWith('You do not have permission') ||
                 err.message.startsWith('Server error') ||
                 err.message.startsWith('Unable to download')) {
        // These are already user-friendly messages
        userFriendlyMessage = err.message;
      } else {
        userFriendlyMessage = 'Unable to download QR codes. Please try again.';
      }

      Alert.alert('Download Failed', userFriendlyMessage);
    } finally {
      setDownloading(false);
    }
  };

  // Function to handle successful download
  const handleDownloadSuccess = async (downloadPath, fileName) => {
    try {
      // Verify file exists
      const fileExists = await RNFS.exists(downloadPath);
      if (!fileExists) {
        throw new Error('File was not saved properly');
      }

      // Get file stats to verify it's not empty
      const fileStat = await RNFS.stat(downloadPath);
      if (fileStat.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      console.log(`File downloaded successfully: ${downloadPath}, Size: ${fileStat.size} bytes`);

      // Show push notification
      PushNotification.localNotification({
        channelId: 'ileafu_channel',
        title: 'Download Complete',
        message: `QR Codes PDF downloaded successfully. Tap to open.`,
        subText: `File saved to: ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder`,
        bigText: `QR Codes PDF has been downloaded successfully.\nFile saved to: ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder\nTap this notification to open the file.`,
        largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
        smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
        color: '#539461', // (optional) default: system default
        vibrate: true, // (optional) default: true
        vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
        tag: 'pdf_download', // (optional) add tag to message
        group: 'downloads', // (optional) add group to message
        ongoing: false, // (optional) set whether this is an "ongoing" notification
        priority: 'high', // (optional) set notification priority, default: high
        visibility: 'public', // (optional) set notification visibility, default: private
        importance: 'high', // (optional) set notification importance, default: high
        autoCancel: true, // (optional) default: true
        invokeApp: true, // (optional) This enable click on notification to bring back the application to foreground or stay in background, default: true
        userInfo: { 
          filePath: downloadPath,
          action: 'download_complete'
        },
        data: {
          filePath: downloadPath,
          action: 'download_complete'
        }
      });

      Alert.alert(
        'Download Complete',
        `PDF file has been saved to your ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder\n\nFile: ${fileName}`,
        [
          {
            text: 'Open File',
            onPress: () => openFile(downloadPath),
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    } catch (error) {
      console.error('Error verifying download:', error);
      throw error;
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

      const response = await fetch('https://us-central1-i-leaf-u.cloudfunctions.net/qrGenerator/orders', {
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

    // Group orders by date and organize into pages
    const groupedByDate = {};
    
    ordersArray.forEach((order, orderIndex) => {
      
      const date = new Date(order.createdAt).toLocaleDateString('en-US', {
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
        
        groupedByDate[date].push({
          id: order.qrCode.id || order.qrCode.qrCodeId || qrContent.orderId,
          plantCode: qrContent.plantCode,
          trxNumber: qrContent.trxNumber,
          orderId: qrContent.orderId,
          genus: qrContent.genus,
          species: qrContent.species,
          variegation: qrContent.variegation,
          gardenOrCompanyName: qrContent.gardenOrCompanyName,
          sellerName: qrContent.sellerName,
          orderQty: qrContent.orderQty,
          localPrice: qrContent.localPrice,
          localPriceCurrency: qrContent.localPriceCurrency,
          deliveryStatus: qrContent.deliveryStatus,
          generatedAt: qrContent.generatedAt,
          dataUrl: order.qrCode.dataUrl, // QR code image data URL
          orderStatus: order.status,
          createdAt: order.createdAt,
        });
      } else if (order.qrCode) {
        // Fallback for older format without content wrapper
        groupedByDate[date].push({
          id: order.qrCode.id || order.qrCode.qrCodeId,
          plantCode: order.qrCode.plantCode || order.qrCode.code || order.qrCode.qrCodeId,
          trxNumber: order.trxNumber || order.transactionNumber || order.orderId,
          dataUrl: order.qrCode.dataUrl,
          orderId: order.orderId,
          orderStatus: order.status,
          createdAt: order.createdAt,
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
        
        pages.push({
          date: date,
          page: `${pageNumber} of ${totalPages}`,
          qrcodes: chunk,
          createdAt: chunk[0]?.createdAt || new Date().toISOString(),
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

  const formatGeneratedDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
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
              onPress={handleDownload}
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
                    const top = row * itemWidth; // No vertical spacing between rows
                    
                    return (
                      <View 
                        key={item.id}
                        style={[
                          styles.qrItemContainer,
                          {
                            left: left,
                            top: top,
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
                            <Text style={styles.plantCode}>{item.plantCode}</Text>
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
    minHeight: 400,
  },
  qrItemContainer: {
    position: 'absolute',
    width: 80, // Scaled for mobile
    height: 80, // Scaled for mobile
  },
  qrItemContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8, // Scaled for mobile
    gap: 4, // Scaled for mobile
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    width: '100%',
    height: '100%',
  },
  qrContentInner: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4, // Scaled for mobile
    width: '100%',
    flex: 1,
  },
  qrCodeImage: {
    width: 50, // Slightly smaller to fit both text lines
    height: 50, // Slightly smaller to fit both text lines
    flex: 0,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 8, // Scaled for mobile
    lineHeight: 10, // Scaled for mobile
    textAlign: 'center',
    color: '#202325',
    alignSelf: 'stretch',
    flex: 0,
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
