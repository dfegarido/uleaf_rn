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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import ShareIcon from '../../../assets/icons/accent/share-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';

// Export modal icons
import ExportPdfIcon from '../../../assets/export/export-pdf.svg';
import ExportXlsIcon from '../../../assets/export/export-xls.svg';

import OrderTableList from '../Order/components/OrderTableList';
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
const data = [
  {
    image: '',
    transNo: 'BB######',
    ordered: 'Apr-23-2025',
    plantCode: 'AA#####',
    plantName: 'Zamioculcas zamiifolia',
    subPlantName: 'Albo Variegata',
    listingType: 'Single Plant',
    potSize: '2" - 4"',
    quantity: '1',
    totalPrice: '$1,238',
  },
  {
    image: '',
    transNo: 'BB######',
    ordered: 'Apr-23-2025',
    plantCode: 'AA#####',
    plantName: 'Zamioculcas zamiifolia',
    subPlantName: 'Albo Variegata',
    listingType: 'Single Plant',
    potSize: '2" - 4"',
    quantity: '1',
    totalPrice: '$1,238',
  },
  {
    image: '',
    transNo: 'BB######',
    ordered: 'Apr-23-2025',
    plantCode: 'AA#####',
    plantName: 'Zamioculcas zamiifolia',
    subPlantName: 'Albo Variegata',
    listingType: 'Single Plant',
    potSize: '2" - 4"',
    quantity: '1',
    totalPrice: '$1,238',
  },
];

const ScreenDelivery = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState('option1');
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  
  // Animation values
  const [backgroundOpacity] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(300));
  
  const isActive = key => active === key;

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

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <View style={{flex: 1}}>
              <InputGroupLeftIcon
                IconLeftComponent={SearchIcon}
                placeholder={'Search I Leaf U'}
              />
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
                {/* <Text style={styles.liveTag}>LIVE</Text> */}
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <AvatarIcon width={40} height={40} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#fff',
            minHeight: screenHeight * 0.9,
            paddingHorizontal: 20,
          }}>
          {/* Filter Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{flexGrow: 0, paddingVertical: 10}} // ✅ prevents extra vertical space
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <SortIcon width={20} height={20}></SortIcon>
              <Text>Sort</Text>
            </View>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <Text>Date</Text>
              <DownIcon width={20} height={20}></DownIcon>
            </View>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <Text>Date Range</Text>
              <DownIcon width={20} height={20}></DownIcon>
            </View>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 10,
                flexDirection: 'row',
              }}>
              <Text>Listing Type</Text>
              <DownIcon width={20} height={20}></DownIcon>
            </View>
          </ScrollView>

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
                <Text style={{color: '#202325', fontSize: 28}}>235</Text>
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
                  <Text style={{color: '#202325', fontSize: 28}}>76</Text>
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
                  <Text style={{color: '#539461', fontSize: 28}}>124</Text>
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
                  <Text style={{color: '#FF5247', fontSize: 28}}>4</Text>
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
                  <Text style={{color: '#000', fontSize: 28}}>0</Text>
                  <RightIcon
                    width={20}
                    height={20}
                    style={{marginTop: 10, marginRight: 10}}></RightIcon>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <OrderTableList headers={headers} data={data} style={{}} />
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
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={closeModal}
          />
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnimation }],
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
                  // Handle delivery details export
                  console.log('Export Delivery Details');
                  closeModal();
                }}>
                <View style={styles.exportIcon}>
                  <ExportXlsIcon width={48} height={48} />
                </View>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportTitle}>Export Delivery Details</Text>
                  <Text style={styles.exportSubtitle}>Spreadsheet File</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

export default ScreenDelivery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#DFECDF',
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
});
