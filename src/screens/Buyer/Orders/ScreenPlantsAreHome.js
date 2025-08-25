import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import {ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import {OrderItemCard, OrderItemCardSkeleton} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import CaretDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';
import {getBuyerOrdersApi} from '../../../components/Api/orderManagementApi';
import NetInfo from '@react-native-community/netinfo';

const ScreenPlantsAreHome = () => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
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
        status: 'delivered'
      };

      console.log('🔍 Loading Plants are Home orders');
      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      // Support both response formats:
      // 1. Legacy: response.data.data.orders (array of orders with products)
      // 2. New: response.data.data.plants (array of plants with embedded order)
      const plantsData = response.data?.data?.plants || [];
      const ordersData = response.data?.data?.orders || [];
      
      console.log('API Response Structure:', {
        hasPlants: plantsData.length > 0,
        hasOrders: ordersData.length > 0
      });
      
      let transformedOrders = [];
      
      if (plantsData.length > 0) {
        // New API format: plants array with embedded order
        console.log('📦 Processing Plants are Home plants:', plantsData.length);
        transformedOrders = plantsData.map(plant => transformPlantToComponentFormat(plant));
      } else {
        // Legacy API format: orders array with products
        console.log('📦 Processing Plants are Home orders:', ordersData.length);
        transformedOrders = ordersData.map(order => transformOrderToComponentFormat(order));
      }
      if (append) {
        setOrders(prev => [...prev, ...transformedOrders]);
        setPage(prev => prev + 1);
      } else {
        setOrders(transformedOrders);
        setPage(0);
      }

    } catch (error) {
      console.error('Error loading Plants are Home orders:', error);
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
      status: 'Plants are Home',
      airCargoDate: order.flightDateFormatted || order.cargoDateFormatted || 'TBD',
      countryCode: getCountryCode(order),
      flag: getCountryFlag(order),
      planeIcon: PlaneGrayIcon, // Add plane icon
      image: plantDetails?.imageCollectionWebp?.[0] ? 
        { uri: plantDetails.imageCollectionWebp[0] } :
        plantDetails?.imagePrimaryWebp ?
        { uri: plantDetails.imagePrimaryWebp } :
        plantDetails?.imagePrimary ? 
        { uri: plantDetails.imagePrimary } :
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
      // Plants are Home specific fields
      showRequestCredit: true,
      requestDeadline: getRequestDeadline(order),
      creditRequestStatus: product?.creditRequestStatus, // Pass the credit request status from API
      // Order details for navigation
      orderId: order.id,
      transactionNumber: order.transactionNumber || order.id,
      products: order.products || [],
      // Add full order data for navigation and credit requests
      fullOrderData: order
    };
  };

  // Transform API plant data to component expected format (for new API response)
  const transformPlantToComponentFormat = (plant) => {
    const plantDetails = plant.plantDetails || {};
    const order = plant.order || {};
    
    return {
      status: 'Plants are Home',
      airCargoDate: plant.flightDateFormatted || order.flightDateFormatted || order.cargoDateFormatted || 'TBD',
      countryCode: getCountryCode(plant),
      flag: getCountryFlag(plant),
      planeIcon: PlaneGrayIcon, // Add plane icon
      image: plantDetails?.imageCollectionWebp?.[0] ? 
        { uri: plantDetails.imageCollectionWebp[0] } :
        plantDetails?.imagePrimaryWebp ?
        { uri: plantDetails.imagePrimaryWebp } :
        plantDetails?.imagePrimary ? 
        { uri: plantDetails.imagePrimary } :
        plantDetails?.image ? 
        { uri: plantDetails.image } : 
        plantDetails?.imageCollection?.[0] ?
        { uri: plantDetails.imageCollection[0] } :
        plant.image ? 
        { uri: plant.image } :
        require('../../../assets/images/plant1.png'),
      plantName: plantDetails?.title || plant.plantName || `${plant.genus || ''} ${plant.species || ''}`.trim() || 'Unknown Plant',
      variety: plant.variegation || plantDetails?.variegation || 'Standard',
      size: plant.potSize || plantDetails?.potSize || '',
      price: `$${(order.pricing?.finalTotal || plant.unitPrice || plant.productTotal || 0).toFixed(2)}`,
      quantity: plant.quantity || 1,
      plantCode: plant.plantCode || '',
      // Plants are Home specific fields
      showRequestCredit: true,
      requestDeadline: getRequestDeadline(order),
      creditRequestStatus: plant.creditRequestStatus, // Pass the credit request status from API
      // Order details for navigation
      orderId: order.id,
      transactionNumber: order.transactionNumber || order.id,
      // Create a "products" array with this plant as the only item for compatibility
      products: [plant], 
      // Add full order and plant data for navigation/details
      fullOrderData: {
        ...order,
        products: [plant], // Make compatible with code expecting order.products[]
        plants: [plant]    // New field for newer code expecting plants[]
      }
    };
  };

  // Helper functions for display formatting
  const getCountryCode = (orderOrPlant) => {
    // For plant records: prefer direct plantSourceCountry
    if (orderOrPlant.plantSourceCountry) {
      return validateCountryCode(orderOrPlant.plantSourceCountry);
    }
    
    // Fall back to order's plantSourceCountry if available
    if (orderOrPlant.order?.plantSourceCountry) {
      return validateCountryCode(orderOrPlant.order.plantSourceCountry);
    }
    
    // Look in the plant's details
    if (orderOrPlant.plantDetails?.plantSourceCountry) {
      return validateCountryCode(orderOrPlant.plantDetails.plantSourceCountry);
    }
    
    // For legacy order records with products
    if (orderOrPlant.products && orderOrPlant.products.length > 0) {
      if (orderOrPlant.products[0].plantSourceCountry) {
        return validateCountryCode(orderOrPlant.products[0].plantSourceCountry);
      }
    }
    
    // Default fallback
    return 'ID'; // Default to Indonesia
  };
  
  // Ensure we only return valid country codes
  const validateCountryCode = (code) => {
    if (!code) return 'ID';
    
    // Valid country codes we support
    const validCodes = ['PH', 'TH', 'ID'];
    const upperCode = code.toUpperCase();
    
    if (validCodes.includes(upperCode)) {
      return upperCode;
    }
    
    // Log unexpected codes to help debug
    console.log(`Unexpected country code found: ${code}, using default ID`);
    return 'ID'; // Default to Indonesia for unknown codes
  };

  const getCountryFlag = (orderOrPlant) => {
    const countryCode = getCountryCode(orderOrPlant);
    
    // Map country codes to flag components
    const flagMap = {
      'TH': ThailandFlag,
      'PH': PhilippinesFlag,
      'ID': IndonesiaFlag,
    };
    
    // Use matching flag or default to Indonesia
    return flagMap[countryCode] || IndonesiaFlag;
  };

  const getRequestDeadline = (order) => {
    if (order.deliveredDate) {
      const deliveryDate = new Date(order.deliveredDate);
      const deadline = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' 12:00 AM';
    }
    return 'TBD';
  };

  // Load orders when component mounts
  useEffect(() => {
    loadOrders();
  }, []);

  // Listen for refresh parameter from credit request submission
  useEffect(() => {
    if (route.params?.refreshData) {
      console.log('📱 ScreenPlantsAreHome - Refreshing data after credit request submission');
      loadOrders(true); // Force refresh
    }
  }, [route.params?.refreshData, route.params?.timestamp]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    await loadOrders(false, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 20, paddingHorizontal: 1, paddingBottom: totalBottomPadding}}>
          
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
          contentContainerStyle={{paddingTop: 20, paddingHorizontal: 1, paddingBottom: totalBottomPadding}}
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
              <Text style={styles.emptyText}>No Plants are Home orders found</Text>
              <Text style={styles.emptySubtext}>
                Your delivered orders will appear here
              </Text>
            </View>
          ) : (
            orders.map((item, index) => (
              <OrderItemCard key={`${item.plantCode}_${index}`} {...item} activeTab="Plants are Home" />
            ))
          )}
          
          {/* Show skeletons while loading more */}
          {loadingMore && (
            <View style={{paddingHorizontal: 0, marginTop: 12}}>
              {Array.from({length: PAGE_SIZE}).map((_, i) => (
                <OrderItemCardSkeleton key={`load-more-skel-${i}`} />
              ))}
            </View>
          )}

          {/* Load more orders button */}
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
            initialLimit={4}
            loadMoreLimit={4}
            showLoadMore={true}
            containerStyle={{marginTop: 24, paddingHorizontal: 15, marginBottom: 32}}
          />

          
        </ScrollView>
      )}
    </SafeAreaView>
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

export default ScreenPlantsAreHome;
