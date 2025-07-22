/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Animated,
  Alert,
  PermissionsAndroid,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useIsFocused} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import PushNotification from 'react-native-push-notification';
import FileViewer from 'react-native-file-viewer';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import OrderActionSheet from '../Order/components/OrderActionSheet';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {InputSearch} from '../../../components/InputGroup/Left';

import {
  getOrderListingApi,
  getSortApi,
  getListingTypeApi,
  getDeliveryExportApi,
  postDeliverToHubApi,
} from '../../../components/Api';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import ShareIcon from '../../../assets/icons/accent/share-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import ArrowDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';

import DeliverTableList from './components/DeliverTableList';
import DeliverActionSheetEdit from './components/DeliverActionSheetEdit';

// Export modal icons
import ExportPdfIcon from '../../../assets/export/export-pdf.svg';
import ExportXlsIcon from '../../../assets/export/export-xls.svg';

const screenHeight = Dimensions.get('window').height;

const headers = [
  'For Delivery',
  'Transaction # & Date(s)',
  'Plant Code',
  'Plant Name',
  'Listing Type',
  'Pot Size',
  'Quantity',
  'Total Price',
];

const dateOptions = [
  {label: 'All', value: 'All'},
  {label: 'This Week', value: 'This Week'},
  {label: 'Last Week', value: 'Last Week'},
  {label: 'This Month', value: 'This Month'},
];

const ScreenDelivery = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState('option1');
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  // Animation values
  const [backgroundOpacity] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(300));

  const isActive = key => active === key;
  const [loading, setLoading] = useState(false);
  const [dataTable, setDataTable] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setNextToken('');
    setNextTokenParam('');
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchData();
  };

  // Function to open modal with animations
  const openModal = () => {
    setIsExportModalVisible(true);
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Function to close modal with animations
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnimation, {
        toValue: 300,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExportModalVisible(false);
    });
  };

  // Function to request storage permission (Android only)
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to download files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Function to download Excel file
  const downloadExcelFile = async () => {
    try {
      // Request storage permission if needed
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to download files.',
        );
        return;
      }

      // Get auth token
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        Alert.alert(
          'Error',
          'Authentication token not found. Please log in again.',
        );
        return;
      }

      // Show loading alert
      Alert.alert(
        'Downloading...',
        'Please wait while we prepare your Excel file.',
      );

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `delivery-details-${timestamp}.xlsx`;

      // Define download path
      const downloadPath =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${fileName}`
          : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Download file directly using RNFS
      const downloadResult = await RNFS.downloadFile({
        fromUrl:
          'https://us-central1-i-leaf-u.cloudfunctions.net/qrGenerator/export/excel',
        toFile: downloadPath,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Show success notification
        PushNotification.localNotification({
          channelId: 'ileafu_channel',
          title: 'Download Complete',
          message: `Excel file saved: ${fileName}`,
          userInfo: {filePath: downloadPath},
          actions: ['Open File'],
          invokeApp: true,
          group: 'file_download',
          importance: 'high',
          vibrate: true,
          playSound: true,
        });

        // Show success alert with option to open file
        Alert.alert(
          'Download Complete',
          `Excel file has been saved to your Downloads folder: ${fileName}`,
          [
            {text: 'OK', style: 'default'},
            {
              text: 'Open File',
              style: 'default',
              onPress: () => {
                FileViewer.open(downloadPath).catch(error => {
                  Alert.alert('Error', 'Could not open the file.');
                });
              },
            },
          ],
        );
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.statusCode}`,
        );
      }
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download Excel file. Please try again.',
      );
    }
  };

  // Function to open file
  const openFile = filePath => {
    console.log('Opening file:', filePath);
    FileViewer.open(filePath)
      .then(() => {
        console.log('File opened successfully');
      })
      .catch(error => {
        console.error('Error opening file:', error);
        Alert.alert(
          'Error',
          'Could not open the file. Please check your file manager.',
        );
      });
  };

  // Configure push notifications
  const configurePushNotifications = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },

      onNotification: function (notification) {
        console.log('Notification received:', notification);
        console.log('User interaction:', notification.userInteraction);
        console.log('Action:', notification.action);
        console.log('UserInfo:', notification.userInfo);
        console.log('Data:', notification.data);

        // Handle notification tap
        if (notification.userInteraction) {
          // Get file path from either userInfo or data
          const filePath =
            notification.userInfo?.filePath ||
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
        console.log('ACTION notification:', notification);

        if (notification.action === 'Open File') {
          const filePath =
            notification.userInfo?.filePath ||
            notification.data?.filePath ||
            notification.filePath;

          console.log('Action: Opening file from path:', filePath);

          if (filePath) {
            setTimeout(() => {
              openFile(filePath);
            }, 500);
          }
        }
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
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
        created => console.log(`createChannel returned '${created}'`),
      );
    }
  };

  useEffect(() => {
    configurePushNotifications();
  }, []);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  // ✅ Fetch on mount
  const [summaryCount, setSummaryCount] = useState({
    Casualty: 0,
    'Deliver to Hub': 0,
    'For Delivery': 0,
    Missing: 0,
    Received: 0,
  });
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();
  const [dataCount, setDataCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
      } catch (error) {
        Alert.alert('Delivery Listing:', error.message);
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused, isInitialFetchRefresh]);

  const loadListingData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(
      () =>
        getOrderListingApi(
          10,
          reusableSort,
          reusableDate,
          'For Delivery',
          reusableListingType,
          nextTokenParam,
          reusableStartDate,
          reusableEndDate,
          search,
        ),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    // console.log(res);
    setSummaryCount(res?.deliveryStatusSummary);
    setNextToken(res.nextPageToken);
    setDataCount(res.count);
    setDataTable(
      prev =>
        nextTokenParam
          ? [...prev, ...(res?.orders || [])] // append
          : res?.orders || [], // replace
    );
  };
  // ✅ Fetch on mount

  // Filters Action Sheet
  const [nextToken, setNextToken] = useState('');
  const [nextTokenParam, setNextTokenParam] = useState('');
  const [sortOptions, setSortOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  const [reusableSort, setReusableSort] = useState('');
  const [reusableDate, setReusableDate] = useState('');
  const [reusableListingType, setReusableListingType] = useState([]);
  const [reusableStartDate, setReusableStartDate] = useState([]);
  const [reusableEndDate, setReusableEndDate] = useState([]);

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const handleFilterView = () => {
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleSearchSubmitRange = (startDate, endDate) => {
    const formattedStart = startDate
      ? new Date(startDate).toISOString().slice(0, 10)
      : '';
    const formattedEnd = endDate
      ? new Date(endDate).toISOString().slice(0, 10)
      : '';

    console.log(formattedStart, formattedEnd);
    setReusableStartDate(formattedStart);
    setReusableEndDate(formattedEnd);
    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    console.log('Searching for:', searchText);
    // trigger your search logic here

    setNextToken('');
    setNextTokenParam('');
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };
  // Filters Action Sheet

  // Load more
  useEffect(() => {
    if (nextTokenParam) {
      setLoading(true);
      loadListingData();
      setTimeout(() => {
        setLoading(false); // or setLoading(false)
      }, 500);
    }
  }, [nextTokenParam]);

  const onPressLoadMore = () => {
    if (nextToken != nextTokenParam) {
      setNextTokenParam(nextToken);
    }
  };
  // Load more

  // For dropdown
  useEffect(() => {
    const fetchDataDropdown = async () => {
      try {
        // Then fetch main data (if it depends on the above)
        // Parallel fetches
        await Promise.all([loadSortByData(), loadListingTypeData()]);
      } catch (error) {
        console.log('Error in dropdown:', error);
      }
    };

    fetchDataDropdown();
  }, []);

  const loadSortByData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getSortApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    let localSortData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    setSortOptions(localSortData);
  };

  const loadListingTypeData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load listing type api');
    }

    let localListingTypeData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));
    // console.log(localListingTypeData);
    setListingTypeOptions(localListingTypeData);
  };
  // For dropdown

  // Export
  const onPressExport = async () => {
    setLoading(true);
    try {
      const response = await getDeliveryExportApi();

      if (!response?.success) {
        throw new Error(response?.message || 'Export failed.');
      }

      Alert.alert('Export', 'Delivery list exported successfully!');
    } catch (error) {
      console.log('Export:', error.message);
      Alert.alert('Export', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Export

  const onPressCheck = () => {
    navigation.navigate('ScreenDeliveryAction', {
      onGoBack: setIsInitialFetchRefresh(prev => !prev),
      dataTable: dataTable,
    });
  };

  // Delivery to hub
  const onPressDeliverToHub = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log('Deliver to Hub:', selectedItemToUpdate?.trxNumber ?? '');
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        [selectedItemToUpdate?.trxNumber ?? ''],
        'Deliver to Hub',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post deliver to hub failed.');
      }
      setNextToken('');
      setNextTokenParam('');
      setIsInitialFetchRefresh(!isInitialFetchRefresh);
      setActionShowSheet(false);
      setSelectedItemToUpdate({});
    } catch (error) {
      console.log('Deliver to hub action:', error.message);
      Alert.alert('Deliver to hub', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Delivery to hub

  // Missing
  const onPressMissing = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log('Missing:', selectedItemToUpdate?.trxNumber ?? '');
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        [selectedItemToUpdate?.trxNumber ?? ''],
        'Missing',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post missing failed.');
      }
      setNextToken('');
      setNextTokenParam('');
      setIsInitialFetchRefresh(!isInitialFetchRefresh);
      setActionShowSheet(false);
      setSelectedItemToUpdate({});
    } catch (error) {
      console.log('Tag as missing action:', error.message);
      Alert.alert('Tag as missing', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Missing

  // Casualty
  const onPressCasualty = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log('Missing:', selectedItemToUpdate?.trxNumber ?? '');
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        [selectedItemToUpdate?.trxNumber ?? ''],
        'Casualty',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post casualty failed.');
      }
      setNextToken('');
      setNextTokenParam('');
      setIsInitialFetchRefresh(!isInitialFetchRefresh);
      setActionShowSheet(false);
      setSelectedItemToUpdate({});
    } catch (error) {
      console.log('Tag as casualty action:', error.message);
      Alert.alert('Tag as casualty', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Casualty

  // Action Sheet
  const [showActionSheet, setActionShowSheet] = useState(false);

  const [selectedItemToUpdate, setSelectedItemToUpdate] = useState(false);

  const onEditPressFilter = ({trxNumber, id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    // console.log(selectedItem.trxNumber);
    setSelectedItemToUpdate(selectedItem);
    console.log(showActionSheet);
    setActionShowSheet(true);
  };
  // Action Sheet

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      {/* Search and Icons */}
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true} // shows an 'X' icon to clear
            />
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <LiveIcon width={40} height={40} />
              {/* <Text style={styles.liveTag}>LIVE</Text> */}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              <AvatarIcon width={40} height={40} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Filter Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
          paddingVertical: 10,
          paddingLeft: 10,
          backgroundColor: '#fff',
        }} // ✅ prevents extra vertical space
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
        }}>
        <TouchableOpacity
          onPress={() => onPressFilter('SORT')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
          }}>
          <SortIcon width={20} height={20}></SortIcon>
          <Text style={globalStyles.textSMGreyDark}>Sort</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressFilter('DATE')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
          }}>
          <Text style={globalStyles.textSMGreyDark}>Date</Text>
          <DownIcon width={20} height={20}></DownIcon>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressFilter('DATERANGE')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
          }}>
          <Text style={globalStyles.textSMGreyDark}>Date Range</Text>
          <DownIcon width={20} height={20}></DownIcon>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressFilter('LISTINGTYPE')}
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#CDD3D4',
            padding: 10,
            flexDirection: 'row',
            marginRight: 30,
          }}>
          <Text style={globalStyles.textSMGreyDark}>Listing Type</Text>
          <DownIcon width={20} height={20}></DownIcon>
        </TouchableOpacity>
      </ScrollView>
      {/* Filter Cards */}

      <ScrollView
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        style={[styles.container, {paddingTop: insets.top}]}>
        <View
          style={{
            backgroundColor: '#fff',
            minHeight: dataTable.length != 0 && screenHeight * 0.9,
            paddingHorizontal: 20,
          }}>
          <View
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#CDD3D4',
              padding: 20,
              flexDirection: 'column',
              marginBottom: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderBottomColor: '#CDD3D4',
                borderBottomWidth: 1,
                paddingBottom: 10,
              }}>
              <View style={{flexDirection: 'column'}}>
                <Text style={{color: '#202325', fontSize: 16}}>
                  For Delivery
                </Text>
                <Text style={{color: '#202325', fontSize: 28}}>
                  {summaryCount['For Delivery']}
                </Text>
              </View>
              <TouchableOpacity
                onPress={openModal}
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <ShareIcon width={20} height={20}></ShareIcon>
                <Text style={{color: '#539461', fontSize: 16, paddingLeft: 5}}>
                  Export
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                borderBottomColor: '#CDD3D4',
                borderBottomWidth: 1,
              }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryHub')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  borderColor: '#CDD3D4',
                  borderRightWidth: 1,
                  paddingVertical: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>
                  Deliver to Hub
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#202325', fontSize: 28}}>
                    {summaryCount['Deliver to Hub']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryReceived')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  paddingVertical: 10,
                  paddingLeft: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>Received</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#539461', fontSize: 28}}>
                    {summaryCount['Received']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryMissing')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  borderColor: '#CDD3D4',
                  borderRightWidth: 1,
                  paddingVertical: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>Missing</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#FF5247', fontSize: 28}}>
                    {summaryCount['Missing']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenDeliveryCasualty')}
                style={{
                  flexDirection: 'column',
                  width: '50%',
                  paddingVertical: 10,
                  paddingLeft: 10,
                }}>
                <Text style={{color: '#202325', fontSize: 16}}>Casualty</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#000', fontSize: 28}}>
                    {summaryCount['Casualty']}
                  </Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* {dataTable.length == 0 ? (
            <View
              style={{
                flex: 1,
                paddingTop: 60,
                alignItems: 'center',
              }}>
              <Image
                source={require('../../../assets/images/orders-delivered.png')}
                style={{width: 300, height: 300, resizeMode: 'contain'}}
              />
            </View>
          ) : ( */}
          <>
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }>
              <DeliverTableList
                headers={headers}
                orders={dataTable}
                module={'MAIN'}
                navigateToListAction={onPressCheck}
                onEditPressFilter={onEditPressFilter}
                style={{}}
              />
            </ScrollView>
            {dataCount >= 10 && (
              <TouchableOpacity
                onPress={() => onPressLoadMore()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: 300,
                  marginBottom: 50,
                }}>
                <Text style={globalStyles.textLGAccent}>Load More</Text>
                <ArrowDownIcon width={25} height={20} />
              </TouchableOpacity>
            )}
          </>
          {/* )} */}
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        transparent={true}
        visible={isExportModalVisible}
        onRequestClose={closeModal}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: backgroundOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
              }),
            },
          ]}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{translateY: slideAnimation}],
              },
            ]}>
            {/* Modal Indicator */}
            <View style={styles.modalIndicatorContainer}>
              <View style={styles.modalIndicator} />
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {/* Export QR Code Option */}
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  // Navigate to Export QR Code screen
                  closeModal();
                  navigation.navigate('ScreenExportQR');
                }}>
                <View style={styles.exportIcon}>
                  <ExportPdfIcon width={48} height={48} />
                </View>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportTitle}>Export QR Code</Text>
                  <Text style={styles.exportSubtitle}>PDF File</Text>
                </View>
              </TouchableOpacity>

              {/* Export Delivery Details Option */}
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  closeModal();
                  downloadExcelFile();
                }}>
                <View style={styles.exportIcon}>
                  <ExportXlsIcon width={48} height={48} />
                </View>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportTitle}>
                    Export Delivery Details
                  </Text>
                  <Text style={styles.exportSubtitle}>Spreadsheet File</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <OrderActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        dateOptions={dateOptions}
        listingTypeOptions={listingTypeOptions}
        sortValue={reusableSort}
        dateValue={reusableDate}
        sortChange={setReusableSort}
        dateChange={setReusableDate}
        listingTypeValue={reusableListingType}
        listingTypeChange={setReusableListingType}
        handleSearchSubmit={handleFilterView}
        handleSearchSubmitRange={handleSearchSubmitRange}
      />

      <DeliverActionSheetEdit
        visible={showActionSheet}
        onClose={() => setActionShowSheet(false)}
        onPressDeliverToHub={onPressDeliverToHub}
        onPressMissing={onPressMissing}
        onPressCasualty={onPressCasualty}
      />
    </SafeAreaView>
  );
};

export default ScreenDelivery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  containerTab: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    // marginTop: 20,
  },
  buttonActive: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  buttonInactive: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: Dimensions.get('window').width,
    height: 254,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
  },
  modalIndicatorContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalIndicator: {
    position: 'absolute',
    width: 48,
    height: 4,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    top: '33.33%',
  },
  modalContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    height: 196,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: '100%',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  exportIcon: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    height: 43,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: '#202325',
    alignSelf: 'stretch',
  },
  exportSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: '#647276',
    alignSelf: 'stretch',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
