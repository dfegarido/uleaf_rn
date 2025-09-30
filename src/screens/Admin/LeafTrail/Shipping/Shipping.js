import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import CubeIcon from '../../../../assets/admin-icons/cube.svg';
import DimensionIcon from '../../../../assets/admin-icons/dimension.svg';
import ScaleIcon from '../../../../assets/admin-icons/scale.svg';
import FilterBar from '../../../../components/Admin/filter';
import ScreenHeader from '../../../../components/Admin/header';
import { getAdminLeafTrailShipping } from '../../../../components/Api/getAdminLeafTrail';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        {isLoading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}
        <ScreenHeader navigation={navigation} title={'For Shipping'} search={true}/>
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
});