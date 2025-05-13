import React, {useState} from 'react';
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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';

import OrderTableList from './components/OrderTableList';

const screenHeight = Dimensions.get('window').height;

const headers = [
  'Orders',
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

const ScreenOrder = () => {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState('option1');
  const isActive = key => active === key;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TextInput style={styles.search} placeholder="Search plants" />
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

        <View style={styles.containerTab}>
          <TouchableOpacity
            style={
              isActive('option1') ? styles.buttonActive : styles.buttonInactive
            }
            onPress={() => setActive('option1')}>
            <Text style={styles.text}>For Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              isActive('option2') ? styles.buttonActive : styles.buttonInactive
            }
            onPress={() => setActive('option2')}>
            <Text style={styles.text}>Delivered</Text>
          </TouchableOpacity>
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
          <OrderTableList headers={headers} data={data} style={{}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreenOrder;

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
    backgroundColor: '#fff',
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
});
