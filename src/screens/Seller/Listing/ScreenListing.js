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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import {globalStyles} from '../../../assets/styles/styles';
import TabFilter from '../../../components/TabFilter/TabFilter';
import ListingTable from './components/ListingTable';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import ListingActionSheet from './components/ListingActionSheetEdit';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {InputBox} from '../../../components/Input';
import {InputGroupAddon} from '../../../components/InputGroupAddon';

import LiveIcon from '../../../assets/images/live.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
import DollarIcon from '../../../assets/icons/greylight/dollar.svg';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const FilterTabs = [
  {
    filterKey: 'All',
    badgeCount: '',
  },
  {
    filterKey: 'Active',
    badgeCount: '',
  },
  {
    filterKey: 'InActive',
    badgeCount: '',
  },
  {
    filterKey: 'Discount',
    badgeCount: '',
  },
  {
    filterKey: 'Scheduled',
    badgeCount: '20',
  },
  {
    filterKey: 'Expired',
    badgeCount: '',
  },
  {
    filterKey: 'Out of Stock',
    badgeCount: '',
  },
];

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
const dataTable = [
  {
    id: 1,
    image: '',
    plantName: 'Ficus Iyrata',
    subPlantName: 'Ficus Iyrata',
    isPin: 1,
    status: '',
    statusCode: 'LS1',
    listingCode: 'L1',
    listingType: '',
    potSize: ['2"'],
    price: '$14',
    discountPrice: '',
    discountPercentage: '',
    quantity: '1',
  },
  {
    id: 2,
    image: '',
    plantName: 'Monstera deliciosa',
    subPlantName: 'Albo Variegata',
    isPin: 0,
    status: '',
    statusCode: 'LS2',
    listingCode: 'L2',
    listingType: "Grower's choice",
    potSize: ['2"-4"', '5"-8"'],
    price: '$14',
    discountPrice: '$7',
    discountPercentage: '15% OFF',
    quantity: '1',
  },
  {
    id: 3,
    image: '',
    plantName: 'Ficus Iyrata',
    subPlantName: 'Ficus Iyrata',
    isPin: 1,
    status: '',
    statusCode: 'LS3',
    listingCode: 'L3',
    listingType: 'Wholesale',
    potSize: ['2"-4"', '5"-8"'],
    price: '$14',
    discountPrice: '',
    discountPercentage: '',
    quantity: '1',
  },
];

const ScreenListing = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('All');
  const [activeFilterShow, setActiveFilterShow] = useState('');

  useFocusEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#fff');
  });

  // const onPressItem = ({data}) => {
  //   navigation.navigate('ScreenMyStoreDetail', data);
  // };

  const onTabPressItem = ({pressTab}) => {
    setActiveTab(pressTab);
  };

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const [actionSheetCode, setActionSheetCode] = useState(null);
  const [showActionSheet, setActionShowSheet] = useState(false);

  const [selectedItemStockUpdate, setselectedItemStockUpdate] = useState(false);

  const onEditPressFilter = ({pressCode, id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setActionSheetCode(pressCode);
    setActionShowSheet(true);
  };

  const [showSheetUpdateStocks, setShowSheetUpdateStocks] = useState(false);

  const onPressUpdateStockShow = () => {
    setShowSheetUpdateStocks(!showSheetUpdateStocks);
  };

  const [showSheetDiscount, setShowSheetDiscount] = useState(false);

  const onPressDiscount = ({id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setShowSheetDiscount(!showSheetDiscount);
  };

  const [discountPercentageSheet, setDiscountPercentageSheet] = useState(false);
  const [discountPriceSheet, setDiscountPriceSheet] = useState(false);

  const onPressCheck = () => {
    navigation.navigate('ScreenListingAction', {dataTable: dataTable});
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
          <View style={styles.header}>
            <View style={{flex: 1}}>
              <InputGroupLeftIcon
                IconLeftComponent={SearchIcon}
                placeholder={'Search'}
              />
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
                {/* <Text style={styles.liveTag}>LIVE</Text> */}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    borderWidth: 1,
                    borderColor: '#CDD3D4',
                    padding: 10,
                    borderRadius: 10,
                  },
                ]}>
                <PinIcon width={20} height={20} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Filter Tabs */}
          <TabFilter
            tabFilters={FilterTabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onPressTab={onTabPressItem}
          />
          {/* Filter Tabs */}
        </View>
        {/* Search and Icons */}

        <View
          style={{
            backgroundColor: '#fff',
            minHeight: screenHeight * 0.9,
          }}>
          {/* Filter Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{flexGrow: 0, paddingVertical: 20, paddingHorizontal: 20}} // ✅ prevents extra vertical space
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            <TouchableOpacity onPress={() => onPressFilter('SORT')}>
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
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onPressFilter('GENUS')}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <Text>Genus</Text>
                <DownIcon width={20} height={20}></DownIcon>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onPressFilter('VARIEGATION')}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <Text>Variegation</Text>
                <DownIcon width={20} height={20}></DownIcon>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onPressFilter('LISTINGTYPE')}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 10,
                  flexDirection: 'row',
                  marginRight: 30,
                }}>
                <Text>Listing Type</Text>
                <DownIcon width={20} height={20}></DownIcon>
              </View>
            </TouchableOpacity>
          </ScrollView>
          {/* Filter Cards */}
          {/* Contents */}
          <View style={styles.contents}>
            <ListingTable
              headers={headers}
              data={dataTable}
              onEditPressFilter={onEditPressFilter}
              onPressDiscount={onPressDiscount}
              module={'MAIN'}
              navigateToListAction={onPressCheck}
              style={{}}
            />
          </View>

          <ReusableActionSheet
            code={code}
            visible={showSheet}
            onClose={() => setShowSheet(false)}
          />
          <ListingActionSheet
            code={actionSheetCode}
            visible={showActionSheet}
            onClose={() => setActionSheetCode(false)}
            onPressUpdateStockShow={onPressUpdateStockShow}
            showSheetUpdateStocks={showSheetUpdateStocks}
          />

          <ActionSheet
            visible={showSheetUpdateStocks}
            onClose={() => setShowSheetUpdateStocks(false)}
            heightPercent={'50%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Update Stocks</Text>
              <TouchableOpacity onPress={() => setShowSheetUpdateStocks(false)}>
                <ExIcon width={20} height={20} />
              </TouchableOpacity>
            </View>

            <View style={{paddingHorizontal: 20}}>
              {selectedItemStockUpdate &&
                selectedItemStockUpdate.potSize.map(
                  (selectedItemStockUpdateParse, index) => (
                    <View key={index} style={{marginTop: 10}}>
                      <Text
                        style={[
                          globalStyles.textLGGreyDark,
                          {paddingBottom: 10},
                        ]}>
                        Pot size: {selectedItemStockUpdateParse}
                      </Text>
                      <Text
                        style={[
                          globalStyles.textLGGreyDark,
                          {paddingBottom: 10},
                        ]}>
                        Current Quantity
                      </Text>
                      <InputBox placeholder={'Quantity'} />
                    </View>
                  ),
                )}
            </View>
          </ActionSheet>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreenListing;

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
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  stickyHeader: {
    backgroundColor: '#fff',
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
});
