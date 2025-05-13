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
import {InputBox, InputCheckBox} from '../../../components/Input';
import {InputGroupAddon} from '../../../components/InputGroupAddon';

import BackIcon from '../../../assets/icons/white/caret-left-regular.svg';
import CheckIcon from '../../../assets/icons/white/check-circle.svg';
import ExCircleIcon from '../../../assets/icons/white/x-circle.svg';
import DiscountIcon from '../../../assets/icons/white/discount.svg';
import PublishIcon from '../../../assets/icons/white/publish.svg';
import RenewIcon from '../../../assets/icons/white/renew.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';

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

const ScreenListingAction = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {dataTable} = route.params;

  const [isChecked, setIsChecked] = useState(false);

  useFocusEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#202325');
  });

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#202325'}}>
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

            <View style={{backgroundColor: '#fff', borderRadius: 5}}>
              <InputCheckBox
                label=""
                checked={isChecked}
                onChange={setIsChecked}
              />
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
            }} // ✅ prevents extra vertical space
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            <TouchableOpacity>
              <View
                style={{
                  // borderRadius: 20,
                  // borderWidth: 1,
                  // borderColor: '#CDD3D4',
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <CheckIcon width={20} height={20}></CheckIcon>
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Activate
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View
                style={{
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <ExCircleIcon width={20} height={20}></ExCircleIcon>
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Deactivate
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View
                style={{
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <DiscountIcon width={20} height={20}></DiscountIcon>
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Discount
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View
                style={{
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <DiscountIcon width={20} height={20}></DiscountIcon>
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Remove Discount
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View
                style={{
                  padding: 10,
                  flexDirection: 'row',
                }}>
                <PublishIcon width={20} height={20}></PublishIcon>
                <Text style={{marginHorizontal: 5, color: '#fff'}}>
                  Publish
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View
                style={{
                  padding: 10,
                  flexDirection: 'row',
                  marginRight: 20,
                }}>
                <RenewIcon width={20} height={20}></RenewIcon>
                <Text style={{marginHorizontal: 5, color: '#fff'}}>Renew</Text>
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
            <ListingTable
              headers={headers}
              data={dataTable}
              onEditPressFilter={onEditPressFilter}
              onPressDiscount={onPressDiscount}
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
});
