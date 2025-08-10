import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import {ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import {OrderItemCard, OrderItemCardSkeleton} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import {searchPlantsApi} from '../../../components/Api/listingBrowseApi';
import {getBuyerOrdersApi} from '../../../components/Api/orderManagementApi';
import NetInfo from '@react-native-community/netinfo';

const OrdersHeader = ({activeTab, setActiveTab}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Close search results when input loses focus
                  setTimeout(() => {
                    setIsSearchFocused(false);
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
      {isSearchFocused && searchTerm.trim().length >= 2 && (
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Map tab names to order statuses
  const getStatusForTab = (tab) => {
    switch (tab) {
      case 'Ready to Fly':
        return ['pending_payment', 'confirmed', 'ready_to_ship']; // Multiple statuses for Ready to Fly
      case 'Plants are Home':
        return 'delivered';
      case 'Journey Mishap':
        return ['damaged', 'dead_on_arrival', 'missing_plant']; // Multiple mishap statuses
      default:
        return null;
    }
  };

  // Load orders from API
  const loadOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection');
      }

      const status = getStatusForTab(activeTab);
      const params = {
        limit: 20,
        offset: 0,
        // Handle both single status and array of statuses
        ...(Array.isArray(status) ? { statuses: status } : status && { status })
      };

      console.log('🔍 Loading orders for tab:', activeTab, 'with status(es):', status);
      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      const ordersData = response.data?.data?.orders || [];
      console.log('📦 Loaded orders:', ordersData.length);
      
      // Transform API data to component format
      const transformedOrders = ordersData.map(order => transformOrderToComponentFormat(order, activeTab));
      setOrders(transformedOrders);

    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Transform API order data to component expected format
  const transformOrderToComponentFormat = (order, tab) => {
    const product = order.products?.[0]; // Get first product for display
    const plantDetails = product?.plantDetails;
    
    return {
      status: getDisplayStatus(order.status, tab),
      airCargoDate: order.cargoDateFormatted || 'TBD',
      countryCode: getCountryCode(order),
      flag: getCountryFlag(order),
      image: plantDetails?.image ? { uri: plantDetails.image } : require('../../../assets/images/plant1.png'),
      plantName: plantDetails?.title || product?.plantName || 'Unknown Plant',
      variety: product?.variegation || 'Standard',
      size: product?.potSize || '',
      price: `$${(order.pricing?.finalTotal || 0).toFixed(2)}`,
      quantity: product?.quantity || 1,
      plantCode: product?.plantCode || '',
      // Additional fields based on tab
      ...(tab === 'Plants are Home' && {
        showRequestCredit: true,
        requestDeadline: getRequestDeadline(order)
      }),
      ...(tab === 'Journey Mishap' && {
        plantStatus: getPlantStatus(order),
        creditApproved: order.creditApproved || false
      }),
      // Add full order data for detailed view
      fullOrderData: order
    };
  };

  // Helper functions for display formatting
  const getDisplayStatus = (status, tab) => {
    switch (tab) {
      case 'Ready to Fly':
        return 'Ready to Fly';
      case 'Plants are Home':
        return 'Plants are Home';
      case 'Journey Mishap':
        return 'Journey Mishap';
      default:
        return status;
    }
  };

  const getCountryCode = (order) => {
    return order.products?.[0]?.supplierCode || 'US';
  };

  const getCountryFlag = (order) => {
    const countryCode = getCountryCode(order);
    const flagMap = {
      'TH': ThailandFlag,
      'US': ThailandFlag, // Use default flag for now
      'BR': ThailandFlag,
      'ID': ThailandFlag,
      'NL': ThailandFlag
    };
    return flagMap[countryCode] || ThailandFlag;
  };

  const getRequestDeadline = (order) => {
    if (order.deliveredDate) {
      const deliveryDate = new Date(order.deliveredDate);
      const deadline = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' 12:00 AM';
    }
    return 'TBD';
  };

  const getPlantStatus = (order) => {
    // Map order status to display text
    if (order.status) {
      switch (order.status.toLowerCase()) {
        case 'damaged':
          return 'Damaged';
        case 'dead_on_arrival':
          return 'Dead on Arrival';
        case 'missing_plant':
          return 'Missing Plant';
        default:
          break;
      }
    }
    
    // Fallback to issueType or random for demo
    if (order.issueType) {
      return order.issueType;
    }
    
    // Demo fallback
    const statuses = ['Damaged', 'Missing Plant', 'Dead on Arrival'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Load orders when component mounts or tab changes
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <OrdersHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 200, paddingHorizontal: 1}}>
          
          {/* Render skeleton loading cards */}
          {Array.from({length: 3}).map((_, index) => (
            <OrderItemCardSkeleton key={`skeleton-${index}`} />
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OrdersHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingTop: 200, paddingHorizontal: 1}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => loadOrders()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {orders.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found for {activeTab}</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'Ready to Fly' && 'Your confirmed orders will appear here'}
              {activeTab === 'Plants are Home' && 'Your delivered orders will appear here'}
              {activeTab === 'Journey Mishap' && 'Any delivery issues will appear here'}
            </Text>
          </View>
        ) : (
          orders.map((item, index) => (
            <OrderItemCard key={`${item.plantCode}_${index}`} {...item} activeTab={activeTab} />
          ))
        )}
        
        {/* Browse More Plants Component */}
        <BrowseMorePlants 
          title="Discover More Plants to Order"
          initialLimit={6}
          loadMoreLimit={6}
          showLoadMore={true}
          containerStyle={{marginTop: 24, paddingHorizontal: 15}}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
export default ScreenOrders;
