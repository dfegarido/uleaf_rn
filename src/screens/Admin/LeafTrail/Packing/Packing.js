import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import TrayIcon from '../../../../assets/admin-icons/tray.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../../../assets/icons/greylight/magnifying-glass-regular';
import SortIcon from '../../../../assets/icons/greylight/sort-arrow-regular.svg';
import { getAdminLeafTrailPacking } from '../../../../components/Api/getAdminLeafTrail';

// --- REUSABLE COMPONENTS ---

const ScreenHeader = ({navigation}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Packing</Text>
      <TouchableOpacity style={styles.headerAction}>
        <SearchIcon />
      </TouchableOpacity>
    </View>
  );
};

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

const PackingListItem = ({ item }) => (
  <View style={styles.listItemContainer}>
    {/* Top card with tray info */}
    <View style={styles.card}>
      <View style={styles.trayIconCircle}>
        <TrayIcon />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.boxNumber}>{item.boxNumber}</Text>
        <Text style={styles.plantCount}>{item.plantCount}<Text style={{ color: '#556065' }}> plant(s)</Text></Text>
      </View>
    </View>

    {/* Details section with user info */}
    <View style={styles.detailsContainer}>
        <View style={styles.flightDetailsRow}>
            <AirplaneIcon />
            <Text style={styles.flightDateText}>Plant Flight <Text style={{ fontWeight: 'bold' }}>{item.flightDate}</Text></Text>
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
const PackingScreen = ({navigation}) => {
  const [packingData, setPackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
    
    // useEffect hook to fetch data when the component mounts
  useEffect(() => {
      const fetchData = async () => {
      try {
           const response = await getAdminLeafTrailPacking();
                
          setPackingData(response);
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
        {isLoading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}
        <ScreenHeader navigation={navigation}/>
        <FlatList
          data={packingData?.data || {}}
          keyExtractor={item => item.key}
          renderItem={({ item }) => <PackingListItem item={item} />}
          ListHeaderComponent={
            <>
              <FilterBar />
              <Text style={styles.countText}>{packingData?.total || 0} tray(es)</Text>
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default PackingScreen;

// --- STYLES ---
const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
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
  // Filter Bar
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  trayIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB323',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  plantCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
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
  flightDateText: {
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
});