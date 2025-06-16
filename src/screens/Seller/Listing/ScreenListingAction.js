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
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import TabFilter from '../../../components/TabFilter/TabFilter';
import ListingTable from './components/ListingTableAction';
import ListingActionSheet from './components/ListingActionSheetEdit';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {InputBox, InputCheckBox} from '../../../components/Input';
import {InputGroupAddon} from '../../../components/InputGroupAddon';
import ConfirmRemoveDiscount from './components/ConfirmRemoveDiscount';
import ConfirmPublishNow from './components/ConfirmPublishNow';
import ConfirmRenew from './components/ConfirmRenew';
import NetInfo from '@react-native-community/netinfo';

import {
  postListingDeactivateActionApi,
  postListingActivateActionApi,
  postListingRemoveDiscountActionApi,
  postListingPublishNowActionApi,
  postListingApplyDiscountActionApi,
} from '../../../components/Api';

import BackIcon from '../../../assets/icons/white/caret-left-regular.svg';
import CheckIcon from '../../../assets/icons/white/check-circle.svg';
import ExCircleIcon from '../../../assets/icons/white/x-circle.svg';
import DiscountIcon from '../../../assets/icons/white/discount.svg';
import PublishIcon from '../../../assets/icons/white/publish.svg';
import RenewIcon from '../../../assets/icons/white/renew.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const headers = [
  'Listing',
  'Plant Name & Status',
  'Pin',
  'Listing Type',
  'Pot Size',
  'Price',
  'Quantity',
  'Discount',
];

const ScreenListingAction = ({navigation, route}) => {
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

  // Active action
  const onPressActivate = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    // Step 1: Validation
    const notInactiveItems = selectedItems.filter(
      item => item.status.toLowerCase() !== 'inactive',
    );

    if (notInactiveItems.length > 0) {
      Alert.alert('Validation', 'Some selected listings are not inactive.');
      setLoading(false);
      return;
    }

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      setLoading(false);
      return;
    }

    // Step 2: Proceed with plantCodes
    const selectedPlantCodes = selectedItems.map(
      item => item.plantCode ?? item.id,
    );

    try {
      const response = await postListingActivateActionApi(selectedPlantCodes);

      if (!response?.success) {
        throw new Error(response?.message || 'Post activate failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error activate action:', error.message);
      Alert.alert('Activate', error.message);
    }
  };
  // Active action

  // Deactivate action
  const onPressDeactivate = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    // Step 1: Validation - ensure all are currently active
    const notActiveItems = selectedItems.filter(
      item => item.status.toLowerCase() !== 'active',
    );

    if (notActiveItems.length > 0) {
      Alert.alert('Validation', 'Some selected listings are not active.');
      setLoading(false);
      return;
    }

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      setLoading(false);
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.plantCode ?? item.id,
    );

    console.log('Deactivating listings with codes:', selectedPlantCodes);

    try {
      const response = await postListingDeactivateActionApi(selectedPlantCodes);

      if (!response?.success) {
        throw new Error(response?.message || 'Post deactivate failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error deactivate action:', error.message);
      Alert.alert('Deactivate', error.message);
    }

    // Proceed with API call or action here
  };
  // Deactivate action

  // Remove discount action
  const onPressRemoveDiscount = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    // Step 1: Validation - ensure all are currently active
    const notActiveItems = selectedItems.filter(
      item => item.discountPrice == '' || item.discountPrice == null,
    );

    if (notActiveItems.length > 0) {
      Alert.alert('Validation', 'Some selected listings not discounted.');
      setLoading(false);
      return;
    }

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      setLoading(false);
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.plantCode ?? item.id,
    );

    console.log('Remove discount listings with codes:', selectedPlantCodes);

    try {
      const response = await postListingRemoveDiscountActionApi(
        selectedPlantCodes,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post remove discount failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error remove discount action:', error.message);
      Alert.alert('Remove Discount', error.message);
    }

    // Proceed with API call or action here
  };
  // Remove discount action

  // Publish now action
  const onPressPublishNow = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    setLoading(true);
    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    // Step 1: Validation - ensure all are currently active
    const notActiveItems = selectedItems.filter(
      item => item.status.toLowerCase() !== 'scheduled',
    );

    // if (notActiveItems.length > 0) {
    //   Alert.alert('Validation', 'Some selected listings are not scheduled');
    //  setLoading(false);
    //   return;
    // }

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      setLoading(false);
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.plantCode ?? item.id,
    );

    console.log('Publish now listings with codes:', selectedPlantCodes);

    try {
      const response = await postListingPublishNowActionApi(selectedPlantCodes);

      if (!response?.success) {
        throw new Error(response?.message || 'Post publish now failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error publish now action:', error.message);
      Alert.alert('Publish now', error.message);
    }
    setLoading(false);
    // Proceed with API call or action here
  };
  // Publish now action

  // Apply discount action
  const [showSheetDiscount, setShowSheetDiscount] = useState(false);
  const [discountPercentageSheet, setDiscountPercentageSheet] = useState(false);
  const [discountPriceSheet, setDiscountPriceSheet] = useState(false);

  const onPressApplyDiscount = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    setLoading(true);
    const selectedItems = dataTable.filter(item =>
      selectedIds.includes(item.id),
    );

    if (selectedItems.length == 0) {
      Alert.alert('Validation', 'No plant/s selected');
      setLoading(false);
      return;
    }

    // Step 2: Collect the plantCodes (or use id if not present)
    const selectedPlantCodes = selectedItems.map(
      item => item.plantCode ?? item.id,
    );

    console.log('Apply discount listings with codes:', selectedPlantCodes);

    try {
      const response = await postListingApplyDiscountActionApi(
        selectedPlantCodes,
        discountPriceSheet,
        discountPercentageSheet,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post apply discount failed.');
      }

      // Navigate back
      route.params?.onGoBack?.();
      navigation.goBack();
    } catch (error) {
      console.log('Error apply discount action:', error.message);
      Alert.alert('Apply discount', error.message);
    }
    setLoading(false);
    // Proceed with API call or action here
  };
  // Apply discount action

  // For confirm
  const [removeDiscountModalVisible, setRemoveDiscountModalVisible] =
    useState(false);

  const [publishNowModalVisible, setPublishNowModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  // For confirm

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
            {/* Activate */}
            {(activeTab === 'All' || activeTab === 'Inactive') && (
              <TouchableOpacity onPress={onPressActivate}>
                <View style={{padding: 10, flexDirection: 'row'}}>
                  <CheckIcon width={20} height={20} />
                  <Text style={{marginHorizontal: 5, color: '#fff'}}>
                    Activate
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Deactivate */}
            {(activeTab === 'All' || activeTab === 'Active') && (
              <TouchableOpacity onPress={onPressDeactivate}>
                <View style={{padding: 10, flexDirection: 'row'}}>
                  <ExCircleIcon width={20} height={20} />
                  <Text style={{marginHorizontal: 5, color: '#fff'}}>
                    Deactivate
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Apply Discount */}
            {(activeTab === 'All' || activeTab === 'Active') && (
              <TouchableOpacity onPress={() => setShowSheetDiscount(true)}>
                <View style={{padding: 10, flexDirection: 'row'}}>
                  <DiscountIcon width={20} height={20} />
                  <Text style={{marginHorizontal: 5, color: '#fff'}}>
                    Discount
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Remove Discount */}
            {activeTab === 'Discounted' && (
              <TouchableOpacity
                onPress={() =>
                  setRemoveDiscountModalVisible(!removeDiscountModalVisible)
                }>
                <View style={{padding: 10, flexDirection: 'row'}}>
                  <DiscountIcon width={20} height={20} />
                  <Text style={{marginHorizontal: 5, color: '#fff'}}>
                    Remove Discount
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Publish now */}
            {activeTab === 'Scheduled' && (
              <TouchableOpacity
                onPress={() =>
                  setPublishNowModalVisible(!publishNowModalVisible)
                }>
                <View style={{padding: 10, flexDirection: 'row'}}>
                  <PublishIcon width={20} height={20} />
                  <Text style={{marginHorizontal: 5, color: '#fff'}}>
                    Publish
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Renew */}
            {activeTab === 'Expired' && (
              <TouchableOpacity
                onPress={() => setRenewModalVisible(!renewModalVisible)}>
                <View
                  style={{padding: 10, flexDirection: 'row', marginRight: 20}}>
                  <RenewIcon width={20} height={20} />
                  <Text style={{marginHorizontal: 5, color: '#fff'}}>
                    Renew
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
            <ListingTable
              headers={headers}
              data={dataTable}
              style={{}}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          </View>

          <ActionSheet
            visible={showSheetDiscount}
            onClose={() => setShowSheetDiscount(false)}
            heightPercent={'40%'}>
            <View style={{height: '100%'}}>
              <View style={styles.sheetTitleContainer}>
                <Text style={styles.sheetTitle}>Apply Discount</Text>
                <TouchableOpacity onPress={() => setShowSheetDiscount(false)}>
                  <ExIcon width={20} height={20} />
                </TouchableOpacity>
              </View>
              <View style={{marginHorizontal: 20}}>
                <View>
                  <Text
                    style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
                    Discount price
                  </Text>
                  <InputGroupAddon
                    addonText="USD"
                    position="left"
                    value={discountPriceSheet}
                    onChangeText={setDiscountPriceSheet}
                    placeholder="Enter price"
                  />
                </View>
                <View style={{paddingTop: 20}}>
                  <Text
                    style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
                    or discount on percentage
                  </Text>
                  <InputGroupAddon
                    addonText="% OFF"
                    position="right"
                    value={discountPercentageSheet}
                    onChangeText={setDiscountPercentageSheet}
                    placeholder="Enter percentage"
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => onPressApplyDiscount()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  paddingHorizontal: 20,
                  width: '100%',
                }}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    Apply Discount
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>

          <ConfirmRemoveDiscount
            visible={removeDiscountModalVisible}
            onConfirm={onPressRemoveDiscount}
            onCancel={() => setRemoveDiscountModalVisible(false)}
          />

          <ConfirmPublishNow
            visible={publishNowModalVisible}
            onConfirm={onPressPublishNow}
            onCancel={() => setPublishNowModalVisible(false)}
          />

          <ConfirmRenew
            visible={renewModalVisible}
            onPublishNow={onPressPublishNow}
            onPublishNurseryDrop={onPressPublishNow}
            onCancel={() => setRenewModalVisible(false)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreenListingAction;

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
