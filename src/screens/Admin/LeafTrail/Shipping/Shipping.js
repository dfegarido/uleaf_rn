import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import CubeIcon from '../../../../assets/admin-icons/cube.svg';
import DimensionIcon from '../../../../assets/admin-icons/dimension.svg';
import ScaleIcon from '../../../../assets/admin-icons/scale.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../../../assets/icons/greylight/magnifying-glass-regular';
import SortIcon from '../../../../assets/icons/greylight/sort-arrow-regular.svg';
import { getAdminLeafTrailShipping } from '../../../../components/Api/getAdminLeafTrail';

// --- MOCK DATA ---
const SHIPPING_DATA = {total: 19, data:[
  {
    key: 'ship1',
    fulfillmentNumber: '#F-12345',
    plantCount: '6',
    dimensions: '30x30x30 in',
    weight: '2.5 lbs',
    flightDate: 'May-30-2024',
    user: {
      name: 'Eleanor Pena',
      username: '@eleanor',
      role: 'Shipper',
      avatar: 'https://i.imgur.com/L6SHd3S.jpeg',
    },
  },
  {
    key: 'ship2',
    fulfillmentNumber: '#F-12346',
    plantCount: '8',
    dimensions: '45x30x30 in',
    weight: '3.1 lbs',
    flightDate: 'May-30-2024',
    user: {
      name: 'Robert Fox',
      username: '@robert',
      role: 'Shipper',
      avatar: 'https://i.imgur.com/Av8F42U.jpeg',
    },
  },
    {
    key: 'ship3',
    fulfillmentNumber: '#F-12347',
    plantCount: '12',
    dimensions: '60x40x40 in',
    weight: '5.2 lbs',
    flightDate: 'May-30-2024',
    user: {
      name: 'Jacob Jones',
      username: '@jacob',
      role: 'Shipper',
      avatar: 'https://i.imgur.com/r6HqY1B.jpeg',
    },
  },
]};

// --- REUSABLE COMPONENTS ---

const FilterBar = () => (
  <View style={styles.filterContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity style={styles.filterButton}>
        <SortIcon />
        <Text style={styles.filterButtonText}>Sort</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Plant Flight</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Country</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Garden</Text>
        <DownIcon />
      </TouchableOpacity>
       <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Seller</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Buyer</Text>
        <DownIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Receiver</Text>
        <DownIcon />
      </TouchableOpacity>
    </ScrollView>
  </View>
);

const ScreenHeader = ({navigation}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Top Navigation */}
      <View style={styles.headerControls}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>For Shipping</Text>
        <TouchableOpacity style={styles.headerAction}>
          <SearchIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ShippingListItem = ({ item }) => (
  <View style={styles.listItemContainer}>
    {/* Top card with box info */}
    <View style={styles.card}>
      <View style={styles.boxIconCircle}>
        <CubeIcon />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.fulfillmentNumber}>{item.fulfillmentNumber}</Text>
          <Text style={styles.plantCount}>{item.plantCount} <Text style={{ color: '#556065' }}> plant(s)</Text></Text>
        </View>
        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <DimensionIcon />
            <Text style={styles.specText}>{item.dimensions}</Text>
          </View>
          <View style={styles.specItem}>
            <ScaleIcon />
            <Text style={styles.specText}>{item.weight}</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Details section with user info */}
    <View style={styles.detailsContainer}>
      <View style={styles.flightDetailsRow}>
        <AirplaneIcon />
        <Text style={styles.detailsText}>
          Plant Flight <Text style={{ fontWeight: 'bold' }}>{item.flightDate}</Text>
        </Text>
      </View>
      <View style={styles.userRow}>
        <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
        <View>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.userHandle}>{item.user.username}</Text>
          </View>
          <Text style={styles.userRole}>Receiver</Text>
        </View>
      </View>
    </View>
  </View>
);

// --- MAIN SCREEN ---
const ShippingScreen = ({navigation}) => {
  const [shippingData, setShippingData] = useState(null);
          // const [isLoading, setIsLoading] = useState(true);
          // const [error, setError] = useState(null);
  useEffect(() => {
      const fetchData = async () => {
      try {
           const response = await getAdminLeafTrailShipping();
                
          setShippingData(response);
      } catch (e) {
          setError(e);
          console.error("Failed to fetch plant data:", e);
      } finally {
          setIsLoading(false);
      }
      };
    
      fetchData();
    }, []); // The empty array ensures this effect runs only once

  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screenContainer} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScreenHeader navigation={navigation}/>
        <FlatList
          data={shippingData?.data || {}}
          keyExtractor={item => item.key}
          renderItem={({ item }) => <ShippingListItem item={item} />}
          ListHeaderComponent={
            <>
              {/* 👇 Corrected: Added the FilterBar here */}
              <FilterBar />
              <Text style={styles.countText}>{shippingData?.total || 0} box(es)</Text>
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ShippingScreen;

// --- STYLES ---
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    height: 58,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  // Tabs
  tabsOuterContainer: {
    borderBottomWidth: 1,
    borderColor: '#CDD3D4',
  },
  tabsInnerContainer: {
    paddingHorizontal: 14,
    gap: 16,
  },
  tab: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#647276',
  },
  activeTabText: {
    color: '#202325',
    fontWeight: '600',
  },
  activeTabIndicator: {
    height: 3,
    width: '100%',
    backgroundColor: '#202325',
  },
  // List
  listContentContainer: {
    paddingBottom: 40,
  },
  countText: {
    textAlign: 'right',
    color: '#647276',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  // List Item
  listItemContainer: {
    backgroundColor: '#F5F6F6',
    padding: 12,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  boxIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#48A7F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fulfillmentNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  plantCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specText: {
    fontSize: 16,
    color: '#647276',
  },
  detailsContainer: {
    paddingHorizontal: 6,
    gap: 8,
  },
  flightDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsText: {
    fontSize: 16,
    color: '#556065',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  userHandle: {
    fontSize: 16,
    color: '#7F8D91',
  },
  userRole: {
    fontSize: 14,
    color: '#647276',
  },
  filterContainer: {
    paddingVertical: 16,
    paddingLeft: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#393D40',
  },
});