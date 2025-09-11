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
import { SafeAreaView } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../../../assets/icons/greylight/magnifying-glass-regular';
import SortIcon from '../../../../assets/icons/greylight/sort-arrow-regular.svg';
import { getAdminLeafTrailSorting } from '../../../../components/Api/getAdminLeafTrail';

const TABS_DATA = [
    { title: 'Sort', iconLeft: <SortIcon width={20} height={20}></SortIcon> },
    { title: 'Plant Flight', iconRight: <DownIcon width={20} height={20}></DownIcon> },
    { title: 'Country', iconRight: <DownIcon width={20} height={20}></DownIcon> },
    { title: 'Garden', iconRight: <DownIcon width={20} height={20}></DownIcon> },
    { title: 'Seller', iconRight: <DownIcon width={20} height={20}></DownIcon> },
    { title: 'Buyer', iconRight: <DownIcon width={20} height={20}></DownIcon> },
    { title: 'Receiver', iconRight: <DownIcon width={20} height={20}></DownIcon> },
];


// --- REUSABLE COMPONENTS (unchanged) ---

const ListItem = ({ item }) => (
  <View style={styles.greenhouseList}>
    <View style={styles.card}>
      <Image source={{uri:item.avatar}} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.usernameText}>{item.username}</Text>
        </View>
        <View style={styles.quantityRow}>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Received</Text>
            <Text style={styles.receivedNumber}>{item.receivedPlants}</Text>
          </View>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Mishap</Text>
            <Text style={styles.mishapNumber}>{item.journeyMishap}</Text>
          </View>
        </View>
      </View>
    </View>
    <View style={styles.detailsRow}>
      <View style={styles.detailsContent}>
        {/* <Icon name="sprout-outline" size={24} color="#556065" /> */}
        <AirplaneIcon width={20} height={20} color="#556065"/>
        <Text style={styles.detailsText}>Plant Flight <Text style={{ fontWeight: 'bold' }}>{item.plantFlight}</Text></Text>
      </View>
    </View>
  </View>
);

const TabButton = ({ title, iconLeft, iconRight }) => (
    <TouchableOpacity style={styles.tabButton}>
        {iconLeft && iconLeft}
        <Text style={styles.tabButtonText}>{title}</Text>
        {iconRight && iconRight}
    </TouchableOpacity>
);

const ScreenHeader = ({navigation}) => (
    <View style={styles.headerContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <BackSolidIcon size={28} color="#393D40" />
                </TouchableOpacity>
                <Text style={styles.title}>Plant Sorting</Text>
                <View style={styles.navbarRight}>
                    <TouchableOpacity style={styles.searchButton}>
                        {/* <Icon name="magnify" size={24} color="#556065" /> */}
                        <SearchIcon width={24} height={24} color="#556065"/>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Horizontal Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {TABS_DATA.map((tab) => (
                        <TabButton key={tab.title} {...tab} />
                    ))}
                </ScrollView>
            </View>
    </View>
);

// --- MAIN SCREEN COMPONENT (Updated) ---
const SortingScreen = ({navigation}) => {
  const [sortingData, setSortingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
      const fetchData = async () => {
      try {
          const response = await getAdminLeafTrailSorting();
              
          setSortingData(response);
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
    // SafeAreaView ensures content is within the screen's safe boundaries, avoiding notches and the status bar.
    <SafeAreaView style={styles.screenContainer}>
      {/* This component controls the app's status bar style.
          'dark-content' makes the time, battery icon, etc., dark.
          'backgroundColor' is for Android.
      */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {isLoading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScreenHeader navigation={navigation} />
      
      <FlatList
        data={sortingData?.data || {}}
        renderItem={({ item }) => <ListItem item={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{sortingData?.total || 0} receiver(s)</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

// --- STYLES (unchanged) ---
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    height: 58,
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  navbarRight: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingVertical: 2,
    paddingBottom: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    gap: 4,
    height: 34,
  },
  tabButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  listContentContainer: {
    paddingBottom: 34,
  },
  countContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 6,
  },
  countText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 19.6,
    color: '#647276',
    textAlign: 'right',
  },
  greenhouseList: {
    backgroundColor: '#F5F6F6',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  usernameText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#7F8D91',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantitySection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#647276',
  },
  receivedNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#202325',
  },
  mishapNumber: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#E7522F',
  },
  detailsRow: {
    paddingHorizontal: 6,
  },
  detailsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#556065',
  },
});

export default SortingScreen;