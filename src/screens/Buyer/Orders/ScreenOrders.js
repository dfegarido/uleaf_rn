import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import {ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert} from 'react-native';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {OrderItemCard} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import {searchPlantsApi} from '../../../components/Api/listingBrowseApi';
import NetInfo from '@react-native-community/netinfo';

const OrdersHeader = ({activeTab, setActiveTab}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const navigation = useNavigation();

  // Debounced search effect - triggers after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        console.log('🔍 Orders search triggered for:', searchTerm);
        performSearch(searchTerm.trim());
      } else if (searchTerm.trim().length === 0) {
        setSearchResults([]);
        setLoadingSearch(false);
      }
    }, 800); // 800ms delay for "finished typing" detection

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);
      console.log('🔍 Starting orders search for:', searchTerm);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const searchParams = {
        query: searchTerm,
        limit: 4,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      const res = await searchPlantsApi(searchParams);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search plants.');
      }

      const plants = res.data?.plants || [];
      console.log(`✅ Orders search completed: found ${plants.length} plants for "${searchTerm}"`);
      console.log('📋 First plant data:', plants[0]); // Debug plant structure
      setSearchResults(plants);
      
    } catch (error) {
      console.error('❌ Error performing orders search:', error);
      setSearchResults([]);
      
      Alert.alert(
        'Search Error',
        'Could not search for plants. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  const tabFilters = [
    {filterKey: 'Ready to Fly'},
    {filterKey: 'Plants are Home'},
    {filterKey: 'Journey Mishap'},
  ];

  const filterOptions =
    activeTab === 'Plants are Home' || activeTab === 'Journey Mishap'
      ? [
          {label: 'Plant Owner', rightIcon: DownIcon},
          {label: 'Plant Flight', rightIcon: DownIcon},
        ]
      : [{label: 'Plant Owner', rightIcon: DownIcon}];

  const onPressTab = ({pressTab}) => {
    setActiveTab(pressTab);
  };

  return (
    <View style={styles.stickyHeader}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plant, invoice #, buddy"
                placeholderTextColor="#647276"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onBlur={() => {
                  // Close search results when input loses focus
                  setTimeout(() => {
                    setSearchResults([]);
                    setLoadingSearch(false);
                  }, 150); // Small delay to allow for result tap
                }}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ScreenWishlist')}>
            <Wishicon width={40} height={40} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ScreenProfile')}>
            <AvatarIcon width={40} height={40} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results */}
      {searchTerm.trim().length >= 2 && (
        <View style={styles.searchResultsContainer}>
          {loadingSearch ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching plants...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsList}>
              {searchResults.map((plant, index) => (
                <TouchableOpacity
                  key={`${plant.id}_${index}`}
                  style={styles.searchResultItem}
                  onPress={() => {
                    if (plant.plantCode) {
                      navigation.navigate('ScreenPlantDetail', {
                        plantCode: plant.plantCode
                      });
                    } else {
                      console.error('❌ Missing plantCode for plant:', plant);
                      Alert.alert('Error', 'Unable to view plant details. Missing plant code.');
                    }
                  }}
                >
                  <Text style={styles.searchResultName} numberOfLines={2}>
                    {plant.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No plants found for "{searchTerm}"
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 20,
            alignItems: 'flex-start',
            paddingHorizontal: 16,
          }}>
          {tabFilters.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onPressTab({pressTab: tab.filterKey})}
              style={[
                styles.tabButton,
                activeTab === tab.filterKey && styles.activeTabButton,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.filterKey && styles.activeTabText,
                ]}>
                {tab.filterKey}
              </Text>
              {activeTab === tab.filterKey && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0, paddingVertical: 4}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          paddingHorizontal: 10,
        }}>
        {filterOptions.map((option, idx) => (
          <View
            key={option.label}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#CDD3D4',
              padding: 8,
              marginTop: 5,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            {option.leftIcon && (
              <option.leftIcon
                width={20}
                height={20}
                style={{marginRight: 4}}
              />
            )}
            <Text style={{fontSize: 16, fontWeight: '600', color: '#202325'}}>
              {option.label}
            </Text>
            {option.rightIcon && (
              <option.rightIcon
                width={20}
                height={20}
                style={{marginLeft: 4}}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const ScreenOrders = () => {
  const [activeTab, setActiveTab] = useState('Ready to Fly');

  // Different order items for each tab
  const getOrderItems = tab => {
    switch (tab) {
      case 'Ready to Fly':
        return Array.from({length: 10}).map((_, i) => ({
          id: i,
          status: 'Ready to Fly',
          image: require('../../../assets/images/plant1.png'),
          name: 'Spinacia Oleracea',
          subtitle: 'Inner Variegated • 2"',
          price: '65.27',
          flightInfo: 'Plant Flight May-30',
          shippingInfo: 'UPS 2nd Day $50, add-on plant $5',
          flagIcon: <Text style={{fontSize: 18}}>🇹🇭</Text>,
        }));

      case 'Plants are Home':
        return Array.from({length: 8}).map((_, i) => ({
          id: i + 100,
          status: 'Plants are Home',
          image: require('../../../assets/images/plant1.png'),
          name: 'Monstera Deliciosa',
          subtitle: 'Variegated • 4"',
          price: '89.99',
          flightInfo: 'Delivered May-25',
          shippingInfo: 'Successfully delivered to your home',
          flagIcon: <Text style={{fontSize: 18}}>🇺🇸</Text>,
          showRequestCredit: true,
          requestDeadline: 'May-31 12:00 AM',
        }));

      case 'Journey Mishap':
        const plantStatuses = ['Damaged', 'Missing', 'Dead on Arrival'];
        return Array.from({length: 6}).map((_, i) => ({
          id: i + 200,
          status: 'Journey Mission',
          image: require('../../../assets/images/plant1.png'),
          name: 'Philodendron Brasil',
          subtitle: 'Trailing • 6"',
          price: '45.50',
          flightInfo: 'In Transit - May-28',
          shippingInfo: 'FedEx Ground - Expected delivery June-2',
          flagIcon: <Text style={{fontSize: 18}}>🇧🇷</Text>,
          plantStatus: plantStatuses[i % plantStatuses.length],
          creditApproved: i % 3 === 0, // Show credit approved for every 3rd item
        }));

      default:
        return [];
    }
  };

  const orderItems = getOrderItems(activeTab);

  return (
    <>
      <OrdersHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <ScrollView
        style={{flex: 1, backgroundColor: '#fff'}}
        contentContainerStyle={{paddingHorizontal: 1}}>
        {orderItems.map(item => (
          <OrderItemCard key={item.id} {...item} />
        ))}
        
        {/* Browse More Plants Component */}
        <BrowseMorePlants 
          title="Discover More Plants to Order"
          initialLimit={6}
          loadMoreLimit={6}
          showLoadMore={true}
          containerStyle={{marginTop: 24, paddingHorizontal: 15}}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },

  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Lower than search results
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
    width: '100%',
    height: 58,
  },
  searchContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 209,
    height: 40,
    flex: 1,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 40,
    flex: 0,
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    height: 40,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
  },
  searchInput: {
    width: 145,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cartCard: {
    backgroundColor: '#F5F6F6',
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cartTopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  cartImageContainer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    width: 96,
    height: 128,
    position: 'relative',
  },
  cartImage: {
    width: 96,
    height: 128,
    borderRadius: 12,
  },
  cartCheckOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,

    borderRadius: 10,
    padding: 2,
    zIndex: 2,
  },
  cartName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
  },
  cartSubtitle: {
    color: '#647276',
    fontSize: 14,
    marginVertical: 2,
  },
  cartPrice: {
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 2,
  },
  cartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'space-between',
  },
  cartFooterText: {
    color: '#647276',
    fontWeight: 'bold',
  },
  tabContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
    paddingVertical: 2,
    paddingBottom: 1,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7F8D91',
    fontFamily: 'Inter',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#202325',
    fontFamily: 'Inter',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: '100%',
    backgroundColor: '#202325',
  },
  dropdownContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202325',
    fontFamily: 'Inter',
  },
  dropdownArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 12,
    color: '#647276',
  },
  // Search Results Styles
  searchResultsContainer: {
    position: 'absolute',
    top: 52, // Position below the header
    left: 13, // Match header paddingHorizontal
    right: 53, // Account for header icons width
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 9999, // Ensure it appears on top of everything
    elevation: 15, // Higher elevation for Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Ensure solid background
    opacity: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
  searchResultsList: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#FFFFFF', // Ensure solid background for each item
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Inter',
  },
  searchResultPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    fontFamily: 'Inter',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
});
export default ScreenOrders;
