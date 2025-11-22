import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import BarcodeIcon from '../../../../assets/admin-icons/barcode.svg';
import DimensionIcon from '../../../../assets/admin-icons/dimension.svg';
import ScaleIcon from '../../../../assets/admin-icons/scale.svg';
import FilterBar from '../../../../components/Admin/filter';
import ScreenHeader from '../../../../components/Admin/header';
import { getAdminLeafTrailFilters, getAdminLeafTrailShipped } from '../../../../components/Api/getAdminLeafTrail';

const ShippedListItem = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('ViewShippedScreen', { item })}>
    <View style={styles.listItemContainer}>
      {/* Top card with tracking info */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <BarcodeIcon />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
            <Text style={styles.plantCount}>{item.shippedPlantsCount} <Text style={{ color: '#556065' }}> plant(s)</Text></Text>
          </View>
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <DimensionIcon />
              <Text style={styles.specText}>
                {item?.packingData?.dimensions?.length || 0}x{item?.packingData?.dimensions?.width || 0}x{item?.packingData?.dimensions?.height || 0} in
              </Text>
            </View>
            <View style={styles.specItem}>
              <ScaleIcon />
              <Text style={styles.specText}>{item?.packingData?.weight?.value || 0} {item?.packingData?.weight?.unit || ''}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Details section with user info */}
      <View style={styles.detailsContainer}>
        <View style={styles.flightDetailsRow}>
          <AirplaneIcon />
          <Text style={styles.detailsText}>
            Plant Flight <Text style={{ fontWeight: 'bold' }}>{item.flightDate ? moment(item.flightDate).format('MMM DD, YYYY') : 'Date TBD'}</Text>
          </Text>
        </View>
        <View style={styles.userRow}>
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          <View>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userHandle}>{item.username}</Text>
            </View>
            <Text style={styles.userRole}>Receiver</Text>
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// --- MAIN SCREEN ---
const ShippedScreen = ({navigation}) => {
  const [shippedData, setShippedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminFilters, setAdminFilters] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const getFilters = async () => {
      setIsLoading(true);
      const adminFilter = await getAdminLeafTrailFilters('["shipped", "shipping"]');
      setAdminFilters(adminFilter);
      setIsLoading(false);
  }

  const fetchData = async (filters) => {
    try {
         const response = await getAdminLeafTrailShipped(filters);
           
        setShippedData(response);
    } catch (e) {
        setError(e);
        console.error("Failed to fetch shipped data:", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData({search: searchValue})
    setSearchActive(false);
    setSearchValue('');
  }

  useEffect(() => {
      fetchData();
      getFilters();
    }, []);

  
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
        <ScreenHeader onSearchChange={setSearchValue} searchValue={searchValue} onSearchSubmit={handleSearch} searchPlaceholder="Search Tracking Number" searchActive={searchActive} onSearchPress={() => setSearchActive(!searchActive)} navigation={navigation} title={'Shipped'} search={true}/>
        <FlatList
          data={shippedData?.data || []}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ShippedListItem item={item} navigation={navigation} />}
          ListHeaderComponent={
            <>
              <FilterBar adminFilters={adminFilters} onFilterChange={fetchData}/>
              <Text style={styles.countText}>{shippedData?.total || 0} tracking number(s)</Text>
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ShippedScreen;

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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B4EFF',
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
  trackingNumber: {
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
});
