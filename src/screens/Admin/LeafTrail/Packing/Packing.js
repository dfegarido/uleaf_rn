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
import TrayIcon from '../../../../assets/admin-icons/tray.svg';
import FilterBar from '../../../../components/Admin/filter';
import ScreenHeader from '../../../../components/Admin/header';
import { getAdminLeafTrailPacking } from '../../../../components/Api/getAdminLeafTrail';

const PackingListItem = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('ViewPackingScreen', { item })}>
    <View style={styles.listItemContainer}>
      {/* Top card with tray info */}
      <View style={styles.card}>
        <View style={styles.trayIconCircle}>
          <TrayIcon />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.boxNumber}>{item.sortingTrayNumber}</Text>
          <Text style={styles.plantCount}>{item.sortedPlantsCount}<Text style={{ color: '#556065' }}> plant(s)</Text></Text>
        </View>
      </View>

      {/* Details section with user info */}
      <View style={styles.detailsContainer}>
          <View style={styles.flightDetailsRow}>
              <AirplaneIcon />
              <Text style={styles.flightDateText}>Plant Flight <Text style={{ fontWeight: 'bold' }}>{item.flightDate}</Text></Text>
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
        <ScreenHeader navigation={navigation} title={'Packing'} search={true}/>
        <FlatList
          data={packingData?.data || {}}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PackingListItem item={item} navigation={navigation} />}
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