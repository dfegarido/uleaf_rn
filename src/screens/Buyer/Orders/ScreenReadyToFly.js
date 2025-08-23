import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import {ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import {OrderItemCard, OrderItemCardSkeleton} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import CaretDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';
import {getBuyerOrdersApi} from '../../../components/Api/orderManagementApi';
import NetInfo from '@react-native-community/netinfo';

const ScreenReadyToFly = () => {
  const route = useRoute();
  const PAGE_SIZE = 4;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load orders from API
  const loadOrders = async (isRefresh = false, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection');
      }

      const limit = PAGE_SIZE;
      const params = {
        limit,
        offset: append ? (page + 1) * limit : 0,
        statuses: ['pending_payment', 'confirmed', "Ready to Fly"],
        includeDetails: true, // Get detailed order information
      };

      console.log('🔍 Loading Ready to Fly orders');
      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

  const ordersData = response.data?.data?.orders || [];
      console.log('📦 Loaded Ready to Fly orders:', ordersData.length);
      
      // Debug: Log the first order's relevant fields
      if (ordersData.length > 0) {
        console.log('First order details:', {
          id: ordersData[0].id,
          flightDate: ordersData[0].flightDate,
          flightDateFormatted: ordersData[0].flightDateFormatted,
          plantSourceCountry: ordersData[0].plantSourceCountry,
          firstProduct: ordersData[0].products?.[0] ? {
            plantCode: ordersData[0].products[0].plantCode,
            plantSourceCountry: ordersData[0].products[0].plantSourceCountry,
            flightDateFormatted: ordersData[0].products[0].flightDateFormatted
          } : null
        });
      }
      
      // Transform API data to component format
      const transformedOrders = ordersData.map(order => transformOrderToComponentFormat(order));
      if (append) {
        setOrders(prev => [...prev, ...transformedOrders]);
        setPage(prev => prev + 1);
      } else {
        setOrders(transformedOrders);
        setPage(0);
      }

    } catch (error) {
      console.error('Error loading Ready to Fly orders:', error);
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Transform API order data to component expected format
  const transformOrderToComponentFormat = (order) => {
    const product = order.products?.[0]; // Get first product for display
    const plantDetails = product?.plantDetails;
    
    return {
      status: 'Ready to Fly',
      // Use the flightDateFormatted from the order data
      airCargoDate: order.flightDateFormatted || order.cargoDateFormatted || 'TBD',
      // Use plantSourceCountry from order
      countryCode: getCountryCode(order),
      flag: getCountryFlag(order),
      planeIcon: PlaneGrayIcon, // Add plane icon
      image: plantDetails?.imageCollectionWebp?.[0] ? 
        { uri: plantDetails.imageCollectionWebp[0] } :
        plantDetails?.image ? 
        { uri: plantDetails.image } : 
        plantDetails?.imageCollection?.[0] ?
        { uri: plantDetails.imageCollection[0] } :
        require('../../../assets/images/plant1.png'),
      plantName: plantDetails?.title || product?.plantName || 'Unknown Plant',
      variety: product?.variegation || 'Standard',
      size: product?.potSize || '',
      price: `$${(order.pricing?.finalTotal || 0).toFixed(2)}`,
      quantity: product?.quantity || 1,
      plantCode: product?.plantCode || '',
      // Order details for navigation
      orderId: order.id,
      transactionNumber: order.transactionNumber || order.id,
      products: order.products || [],
      // Add full order data for navigation
      fullOrderData: order
    };
  };

  // Helper functions for display formatting
  const getCountryCode = (order) => {
    // Prefer order-level plantSourceCountry, then first product's plantSourceCountry
    if (order.plantSourceCountry) {
      return order.plantSourceCountry;
    }
    
    if (order.products && order.products.length > 0) {
      return order.products[0].plantSourceCountry || 'ID'; // Default to Indonesia
    }
    
    return 'ID'; // Default to Indonesia if no country info available
  };

  const getCountryFlag = (order) => {
    const countryCode = getCountryCode(order);
    console.log('Country code for flag:', countryCode);
    
    // Map country codes to flag components
    const flagMap = {
      'TH': ThailandFlag,
      'PH': PhilippinesFlag,
      'ID': IndonesiaFlag,
      // Use Indonesia as default for other countries
      'US': IndonesiaFlag,
      'BR': IndonesiaFlag,
      'NL': IndonesiaFlag
    };
    
    // Use matching flag or default to Indonesia
    return flagMap[countryCode] || IndonesiaFlag;
  };

  // Load orders when component mounts
  useEffect(() => {
    loadOrders();
  }, []);

  // Listen for refresh parameter
  useEffect(() => {
    if (route.params?.refreshData) {
      console.log('📱 ScreenReadyToFly - Refreshing data');
      loadOrders(true); // Force refresh
    }
  }, [route.params?.refreshData]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(true);
  };

  // Load more handler
  const handleLoadMore = async () => {
    // Prevent concurrent load more
    if (loadingMore) return;
    await loadOrders(false, true);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 20, paddingHorizontal: 1}}>
          
          {/* Render skeleton loading cards */}
          {Array.from({length: 3}).map((_, index) => (
            <OrderItemCardSkeleton key={`skeleton-${index}`} />
          ))}
          
          {/* Browse More Plants Component */}
          <BrowseMorePlants 
            title="More from our Jungle"
            initialLimit={4}
            loadMoreLimit={4}
            showLoadMore={true}
            containerStyle={{marginTop: 24, paddingHorizontal: 15}}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 20, paddingHorizontal: 1}}
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
              <Text style={styles.emptyText}>No Ready to Fly orders found</Text>
              <Text style={styles.emptySubtext}>
                Your confirmed orders will appear here
              </Text>
            </View>
          ) : (
            orders.map((item, index) => (
              <OrderItemCard key={`${item.plantCode}_${index}`} {...item} activeTab="Ready to Fly" />
            ))
          )}

          {/* Show skeleton placeholders while loading more orders (above Load More) */}
          {loadingMore && (
            <View style={{paddingHorizontal: 0, marginTop: 12}}>
              {Array.from({length: PAGE_SIZE}).map((_, i) => (
                <OrderItemCardSkeleton key={`load-more-skel-${i}`} />
              ))}
            </View>
          )}

          {/* Load more orders - matches BrowseMorePlants style */}
          <View style={{width: '100%', alignItems: 'center', marginTop: 12, paddingHorizontal: 16}}>
            <TouchableOpacity
              onPress={handleLoadMore}
              style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, width: '100%', maxWidth: 375, height: 48, borderRadius: 12, backgroundColor: 'transparent'}}
              disabled={loadingMore}
            >
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, gap: 8, height: 16}}>
                <Text style={{fontFamily: 'Inter', fontWeight: '600', fontSize: 16, lineHeight: 16, color: '#539461', textAlign: 'center'}}>{loadingMore ? 'Loading more...' : 'Load More'}</Text>
                {!loadingMore && (<CaretDownIcon width={24} height={24} style={{width:24, height:24}} />)}
              </View>
            </TouchableOpacity>
          </View>

          
          
          {/* Browse More Plants Component */}
          <BrowseMorePlants 
            title="More from our Jungle"
            initialLimit={6}
            loadMoreLimit={6}
            showLoadMore={true}
            containerStyle={{marginTop: 24, paddingHorizontal: 15, marginBottom: 40}}
          />

          
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

export default ScreenReadyToFly;
