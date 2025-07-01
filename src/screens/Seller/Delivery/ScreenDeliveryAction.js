import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../../assets/styles/styles';
import DeliverTableList from './components/DeliverTableList';
import {InputCheckBox} from '../../../components/Input';
import NetInfo from '@react-native-community/netinfo';

import {postDeliverToHubApi} from '../../../components/Api';

import BackIcon from '../../../assets/icons/white/caret-left-regular.svg';
import ExCircleIcon from '../../../assets/icons/white/x-circle.svg';
import BoxIcon from '../../../assets/icons/white/box.svg';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

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

const ScreenDeliveryAction = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {dataTable} = route.params;
  const {activeTab} = route.params;
  const [loading, setLoading] = useState(false);
  // console.log(dataTable[0]);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#202325');
    }
  });

  // Select
  const [selectedIds, setSelectedIds] = useState([]);
  const allIds = dataTable.map(item => item.id);
  const isAllSelected =
    allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(allIds); // Select all
    }
  };
  // Select

  // Delivery to hub
  const onPressDeliverToHub = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.trxNumber ?? item.id,
    );

    console.log('Deliver to Hub:', selectedPlantCodes);
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        selectedPlantCodes,
        'Deliver to Hub',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post deliver to hub failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error remove discount action:', error.message);
      Alert.alert('Remove Discount', error.message);
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

    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.trxNumber ?? item.id,
    );

    console.log('Missing:', selectedPlantCodes);
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(selectedPlantCodes, 'Missing');

      if (!response?.success) {
        throw new Error(response?.message || 'Post missing failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error post missing action:', error.message);
      Alert.alert('Tag as missing', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Missing

  // Casuality
  const onPressCasualty = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.trxNumber ?? item.id,
    );

    console.log('Casualty:', selectedPlantCodes);
    setLoading(true);
    try {
      const response = await postDeliverToHubApi(
        selectedPlantCodes,
        'Casualty',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post casualty failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error post missing action:', error.message);
      Alert.alert('Tag as missing', error.message);
    } finally {
      setLoading(false);
    }

    // Proceed with API call or action here
  };
  // Casuality

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#202325'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.iconButton,
                {
                  borderRadius: 10,
                  backgroundColor: 'transparent',
                },
              ]}>
              <BackIcon width={30} height={30} />
            </TouchableOpacity>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{backgroundColor: 'transparent'}}>
                <InputCheckBox
                  label=""
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
              </View>

              <Text style={[globalStyles.textMDWhite, {paddingLeft: 5}]}>
                Select All
              </Text>
            </View>
          </View>
          {/* Filter Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              flexGrow: 0,
              paddingVertical: 20,
              paddingHorizontal: 20,
            }}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            {/* Deliver Hub */}
            <TouchableOpacity onPress={() => onPressDeliverToHub()}>
              <View style={{padding: 10, flexDirection: 'row'}}>
                <BoxIcon width={20} height={20} />
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Deliver to hub
                </Text>
              </View>
            </TouchableOpacity>

            {/* Missing */}
            <TouchableOpacity onPress={() => onPressMissing()}>
              <View style={{padding: 10, flexDirection: 'row'}}>
                <ExCircleIcon width={20} height={20} />
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Tag as missing
                </Text>
              </View>
            </TouchableOpacity>

            {/* Casualty */}
            <TouchableOpacity onPress={() => onPressCasualty()}>
              <View
                style={{padding: 10, paddingRight: 50, flexDirection: 'row'}}>
                <ExCircleIcon width={20} height={20} />
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Tag as casualty
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
          {/* Filter Cards */}
        </View>
        {/* Search and Icons */}

        <View
          style={{
            backgroundColor: '#fff',
            minHeight: screenHeight * 0.9,
          }}>
          {/* Contents */}
          <View style={styles.contents}>
            <DeliverTableList
              headers={headers}
              orders={dataTable}
              module={'ACTION'}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              style={{}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreenDeliveryAction;

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
    paddingLeft: 10,
    paddingRight: 20,
  },
  search: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
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
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  stickyHeader: {
    backgroundColor: '#202325',
    zIndex: 10,
    paddingTop: 12,
  },
  contents: {
    // paddingHorizontal: 20,
    backgroundColor: '#fff',
    minHeight: screenHeight,
  },
  image: {
    width: 166,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    padding: 5,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
  },
  strikeText: {
    textDecorationLine: 'line-through', // This adds the line in the middle
    color: 'black',
  },
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
