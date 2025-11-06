import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {useState, useEffect, useCallback} from 'react';
import {ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import {OrderItemCard, OrderItemCardSkeleton, JoinerOrderCard} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import CaretDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';
import {getBuyerOrdersApi} from '../../../components/Api/orderManagementApi';
import NetInfo from '@react-native-community/netinfo';
import {useAuth} from '../../../auth/AuthProvider';
import Toast from '../../../components/Toast/Toast';

const ScreenPlantsAreHome = ({plantOwnerFilter = null, onBuyersLoaded = null}) => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  const PAGE_SIZE = 4;
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders (unfiltered)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const browseMorePlantsRef = React.useRef(null);
  
  // Optimistic credit requests state - tracks plantCode+orderId combinations
  const [optimisticCreditRequests, setOptimisticCreditRequests] = useState(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const processedParamsRef = React.useRef(new Set()); // Track processed params to avoid re-processing

  // Apply plant owner filter
  const applyPlantOwnerFilter = useCallback((ordersToFilter, filter) => {
    if (!filter || filter === null) {
      setOrders(ordersToFilter);
      return;
    }

    // Filter by buyerUid
    const filtered = ordersToFilter.filter(order => {
      const orderBuyerUid = order.buyerUid || order._rawPlantRecord?.buyerUid || order.fullOrderData?.buyerUid;
      return orderBuyerUid === filter;
    });
    
    setOrders(filtered);
  }, []);

  // Apply filter when plantOwnerFilter prop changes
  useEffect(() => {
    if (allOrders.length > 0) {
      applyPlantOwnerFilter(allOrders, plantOwnerFilter);
    }
  }, [plantOwnerFilter, allOrders.length, applyPlantOwnerFilter]);

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
        
        // Debug: Log receiver vs joiner orders
        const receiverCount = transformedOrders.filter(o => !o.isJoinerOrder).length;
        const joinerCount = transformedOrders.filter(o => o.isJoinerOrder).length;
        console.log(`📊 Plants are Home - Receiver orders: ${receiverCount}, Joiner orders: ${joinerCount}`);
      } else {
        // Legacy API format: orders array with products
        console.log('📦 Processing Plants are Home orders:', ordersData.length);
        transformedOrders = ordersData.map(order => transformOrderToComponentFormat(order));
        
        // Debug: Log receiver vs joiner orders
        const receiverCount = transformedOrders.filter(o => !o.isJoinerOrder).length;
        const joinerCount = transformedOrders.filter(o => o.isJoinerOrder).length;
        console.log(`📊 Plants are Home - Receiver orders: ${receiverCount}, Joiner orders: ${joinerCount}`);
      }
      
      // Extract unique buyers from orders and notify parent
      if (onBuyersLoaded && transformedOrders.length > 0 && !append) {
        const buyersMap = new Map();
        
        // Extract buyers from all orders (both receiver and joiner orders)
        transformedOrders.forEach(order => {
          const buyerUid = order.buyerUid || order._rawPlantRecord?.buyerUid || order.fullOrderData?.buyerUid;
          
          if (buyerUid && !buyersMap.has(buyerUid)) {
            // Get buyer info from order data
            let buyerInfo = null;
            
            if (order.isJoinerOrder && order.joinerInfo) {
              // Joiner order - use joinerInfo
              buyerInfo = {
                buyerUid: buyerUid,
                name: `${order.joinerInfo.firstName || ''} ${order.joinerInfo.lastName || ''}`.trim() || order.joinerInfo.username || 'Buyer',
                firstName: order.joinerInfo.firstName || '',
                lastName: order.joinerInfo.lastName || '',
                username: order.joinerInfo.username || ''
              };
            } else {
              // Receiver order - use buyerInfo from order or current user
              const orderBuyerInfo = order.fullOrderData?.buyerInfo || order._rawPlantRecord?.order?.buyerInfo;
              if (orderBuyerInfo) {
                buyerInfo = {
                  buyerUid: buyerUid,
                  name: `${orderBuyerInfo.firstName || ''} ${orderBuyerInfo.lastName || ''}`.trim() || user?.firstName || 'Buyer',
                  firstName: orderBuyerInfo.firstName || user?.firstName || '',
                  lastName: orderBuyerInfo.lastName || user?.lastName || '',
                  username: orderBuyerInfo.username || user?.username || ''
                };
              } else {
                // Fallback to current user
                buyerInfo = {
                  buyerUid: buyerUid,
                  name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'You',
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  username: user?.username || ''
                };
              }
            }
            
            if (buyerInfo && buyerInfo.name) {
              buyersMap.set(buyerUid, buyerInfo);
            }
          }
        });
        
        const uniqueBuyers = Array.from(buyersMap.values());
        onBuyersLoaded(uniqueBuyers);
      }
      
      // Store all orders and apply filter
      if (append) {
        const updatedAllOrders = [...allOrders, ...transformedOrders];
        setAllOrders(updatedAllOrders);
        applyPlantOwnerFilter(updatedAllOrders, plantOwnerFilter);
        setPage(prev => prev + 1);
      } else {
        setAllOrders(transformedOrders);
        // Apply filter if provided
        applyPlantOwnerFilter(transformedOrders, plantOwnerFilter);
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
      // Ensure plantCode is at root level for single-plant order processing
      fullOrderData: {
        ...order,
        plantCode: product?.plantCode || order.plantCode, // Include at root for backend single-plant order detection
      },
      // Include joiner order flags and info (for legacy format)
      isJoinerOrder: order.isJoinerOrder || product?.isJoinerOrder || false,
      joinerInfo: order.joinerInfo || product?.joinerInfo || null,
      // Include buyerUid for filtering
      buyerUid: order.buyerUid || product?.buyerUid || null
    };
  };

  // Transform API plant data to component expected format (for new API response)
  const transformPlantToComponentFormat = (plant) => {
    const plantDetails = plant.plantDetails || {};
    const order = plant.order || {};
    
    // Build a minimal order-like object to satisfy components that expect fullOrderData.products
    // Also include plantCode at root level for single-plant order processing in backend
    const fullOrderLike = {
      ...order,
      plantCode: plant.plantCode || order.plantCode, // Include at root for backend single-plant order detection
      products: [plant],
      plantDetails: plantDetails,
    };

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
      creditRequestStatus: plant.creditRequestStatus || order.creditRequestStatus, // Pass the credit request status from API
      // Order details for navigation
      orderId: order.id,
      transactionNumber: order.transactionNumber || order.id,
      // Create a "products" array with this plant as the only item for compatibility
      products: [plant], 
      // Add full order and plant data for navigation/details
      fullOrderData: fullOrderLike,
      // Include joiner order flags and info
      isJoinerOrder: plant.isJoinerOrder || order.isJoinerOrder || false,
      joinerInfo: plant.joinerInfo || order.joinerInfo || null,
      // Include buyerUid for filtering
      buyerUid: plant.buyerUid || order.buyerUid || null,
      // include original plant record for any additional fields
      _rawPlantRecord: plant
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
    // Try multiple possible field names for delivery date
    const deliveredDate = order.deliveredDate || 
                         order.deliveryDate || 
                         order.deliveryDetails?.deliveryDate ||
                         order.deliveryDetails?.[0]?.deliveryDate ||
                         (order.products && order.products[0]?.deliveryDate) ||
                         (order.products && order.products[0]?.deliveredDate);
    
    if (deliveredDate) {
      try {
        // Handle Firestore Timestamp
        let deliveryDateObj;
        if (deliveredDate._seconds) {
          deliveryDateObj = new Date(deliveredDate._seconds * 1000);
        } else if (deliveredDate.toDate) {
          deliveryDateObj = deliveredDate.toDate();
        } else if (typeof deliveredDate === 'string') {
          deliveryDateObj = new Date(deliveredDate);
        } else if (deliveredDate instanceof Date) {
          deliveryDateObj = deliveredDate;
        } else {
          return 'TBD';
        }
        
        if (!isNaN(deliveryDateObj.getTime())) {
          const deadline = new Date(deliveryDateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
          return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' 12:00 AM';
        }
      } catch (error) {
        console.error('Error parsing delivery date:', error);
      }
    }
    return 'TBD';
  };

  // Load orders when component mounts
  useEffect(() => {
    loadOrders();
  }, []);

  // Listen for credit request success and refresh parameter
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params;
      
      // Handle credit request success with optimistic update
      if (params?.creditRequestSuccess && params?.creditRequestPlantCode && params?.creditRequestOrderId) {
        const paramKey = `${params.creditRequestOrderId}_${params.creditRequestPlantCode}_${params.timestamp || Date.now()}`;
        
        // Skip if we've already processed these params
        if (processedParamsRef.current.has(paramKey)) {
          return;
        }
        
        // Mark as processed
        processedParamsRef.current.add(paramKey);
        
        const requestKey = `${params.creditRequestOrderId}_${params.creditRequestPlantCode}`;
        
        // Add to optimistic state
        setOptimisticCreditRequests(prev => new Set([...prev, requestKey]));
        
        // Show toast notification
        setToastMessage('Credit request submitted successfully');
        setToastVisible(true);
        
        // Refresh data to sync with backend
        console.log('📱 ScreenPlantsAreHome - Credit request submitted, refreshing data');
        loadOrders(true);
      } else if (params?.refreshData && !processedParamsRef.current.has(`refresh_${params.timestamp || Date.now()}`)) {
        // Regular refresh - track processed refreshes
        const refreshKey = `refresh_${params.timestamp || Date.now()}`;
        processedParamsRef.current.add(refreshKey);
        console.log('📱 ScreenPlantsAreHome - Refreshing data after credit request submission');
        loadOrders(true); // Force refresh
      }
    }, [route.params])
  );

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
            initialLimit={8}
            loadMoreLimit={8}
            showLoadMore={false}
            containerStyle={{marginTop: 24, paddingHorizontal: 15}}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 20, paddingHorizontal: 1, paddingBottom: totalBottomPadding}}
          scrollEventThrottle={400}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const paddingToBottom = 600;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
            
            // Load more orders when scrolling near bottom
            if (isCloseToBottom && !loadingMore && !refreshing) {
              console.log('📦 ScreenPlantsAreHome: User is near bottom, loading more orders');
              handleLoadMore();
            }
            
            // Load more recommendations when scrolling near bottom
            if (isCloseToBottom && browseMorePlantsRef?.current) {
              console.log('🌱 ScreenPlantsAreHome: User is near bottom, triggering load more recommendations');
              browseMorePlantsRef.current.handleLoadMore();
            }
          }}
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
            orders.map((item, index) => {
              // Check if this is a joiner order
              const isJoinerOrder = item.isJoinerOrder || false;
              
              // Check if this order has an optimistic credit request
              const orderKey = `${item.orderId || item.transactionNumber}_${item.plantCode}`;
              const hasOptimisticRequest = optimisticCreditRequests.has(orderKey);
              
              return isJoinerOrder ? (
                <JoinerOrderCard 
                  key={`${item.plantCode}_${index}`} 
                  {...item}
                  joinerInfo={item.joinerInfo}
                  activeTab="Plants are Home"
                  optimisticCreditRequest={hasOptimisticRequest}
                />
              ) : (
                <OrderItemCard 
                  key={`${item.plantCode}_${index}`} 
                  {...item} 
                  activeTab="Plants are Home"
                  optimisticCreditRequest={hasOptimisticRequest}
                />
              );
            })
          )}
          
          {/* Show skeletons while loading more */}
          {loadingMore && (
            <View style={{paddingHorizontal: 0, marginTop: 12}}>
              {Array.from({length: PAGE_SIZE}).map((_, i) => (
                <OrderItemCardSkeleton key={`load-more-skel-${i}`} />
              ))}
            </View>
          )}

          {/* Browse More Plants Component */}
          <BrowseMorePlants 
            ref={browseMorePlantsRef}
            title="More from our Jungle"
            initialLimit={8}
            loadMoreLimit={8}
            showLoadMore={false}
            containerStyle={{marginTop: 24, paddingHorizontal: 15, marginBottom: 32}}
          />

          
        </ScrollView>
      )}
      
      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
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
