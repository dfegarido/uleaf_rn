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
import {getBuyerCreditRequestsApi, getJourneyMishapDataApi} from '../../../components/Api/orderManagementApi';
import {getPlantDetailApi} from '../../../components/Api/getPlantDetailApi';
import NetInfo from '@react-native-community/netinfo';

const ScreenJourneyMishap = () => {
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
  const browseMorePlantsRef = React.useRef(null);

  // Load credit requests from API using the new comprehensive Journey Mishap API
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
        includeOrderDetails: true,
        includeListingDetails: true,
        includePlantDetails: true,
        // Add any status filters for credit requests if needed
        // status: 'pending', // Uncomment to filter by status
        // issueType: 'missing', // Uncomment to filter by issue type
      };

      console.log('Loading Journey Mishap data with comprehensive API');
      const response = await getJourneyMishapDataApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load Journey Mishap data');
      }

      // Support both response formats:
      // 1. Legacy: response.data.data.creditRequests (array of credit requests with linked order/listing details)
      // 2. New: response.data.data.plants (array of plants with credit request info)
      const creditRequestsData = response.data?.data?.creditRequests || [];
      const plantsData = response.data?.data?.plants || [];
      
      console.log('API Response Structure:', {
        hasCreditRequests: creditRequestsData.length > 0,
        hasPlants: plantsData.length > 0
      });
      
      let transformedOrders = [];
      
      if (plantsData.length > 0) {
        // New API format: plants array with credit request info
        console.log('📦 Processing Journey Mishap plants:', plantsData.length);
        transformedOrders = await Promise.all(
          plantsData.map(plant => transformPlantToComponentFormat(plant))
        );
      } else {
        // Legacy API format: credit requests with linked collections
        console.log('📦 Processing Journey Mishap credit requests:', creditRequestsData.length);
        transformedOrders = await Promise.all(
          creditRequestsData.map(creditRequest => transformJourneyMishapDataToComponentFormat(creditRequest))
        );
      }

      if (append) {
        setOrders(prev => [...prev, ...transformedOrders]);
        setPage(prev => prev + 1);
      } else {
        setOrders(transformedOrders);
        setPage(0);
      }

    } catch (error) {
      console.error('Error loading Journey Mishap orders:', error);
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

  // Transform comprehensive Journey Mishap data (with linked orders and listings) to component format
  const transformJourneyMishapDataToComponentFormat = async (creditRequest) => {
    // New API provides comprehensive data with linked collections
    const orderDetails = creditRequest.orderDetails || {};
    const listingDetails = creditRequest.listingDetails || {};
    const plantDetails = creditRequest.plantDetails || listingDetails.plantDetails || {};
    
    // Extract order product data for the specific plant code (matching Plants Are Home pattern)
    const orderProduct = orderDetails.products?.find(product => product.plantCode === creditRequest.plantCode);
    const productPlantDetails = orderProduct?.plantDetails || orderProduct; // Fallback to product itself if no plantDetails

    // Check if we need to fetch plant image as fallback
    let fallbackPlantData = null;
    const hasAnyImage = productPlantDetails?.image || 
                       productPlantDetails?.imageCollection?.[0] ||
                       (orderProduct?.imagePrimary && orderProduct.imagePrimary !== "") ||
                       orderProduct?.images?.[0] ||
                       (orderProduct?.plantData?.imagePrimary && orderProduct.plantData.imagePrimary !== "") ||
                       orderProduct?.plantData?.images?.[0] ||
                       orderProduct?.image ||
                       orderProduct?.imageCollection?.[0];

    if (!hasAnyImage && creditRequest.plantCode) {
      try {
        const plantDetailResponse = await getPlantDetailApi(creditRequest.plantCode);
        if (plantDetailResponse.success && plantDetailResponse.data) {
          fallbackPlantData = plantDetailResponse.data;
        }
      } catch (error) {
        // Silently handle error - will use placeholder image
      }
    }

    const finalImage = productPlantDetails?.imageCollectionWebp?.[0] ?
      { uri: productPlantDetails.imageCollectionWebp[0] } :
      productPlantDetails?.image ? 
      { uri: productPlantDetails.image } : 
      productPlantDetails?.imageCollection?.[0] ?
      { uri: productPlantDetails.imageCollection[0] } :
      // Check actual order product image fields (prefer webp)
      orderProduct?.imageCollectionWebp?.[0] ?
      { uri: orderProduct.imageCollectionWebp[0] } :
      orderProduct?.imagePrimary && orderProduct.imagePrimary !== "" ?
      { uri: orderProduct.imagePrimary } :
      orderProduct?.images?.[0] ?
      { uri: orderProduct.images[0] } :
      orderProduct?.plantData?.imagePrimary && orderProduct.plantData.imagePrimary !== "" ?
      { uri: orderProduct.plantData.imagePrimary } :
      orderProduct?.plantData?.images?.[0] ?
      { uri: orderProduct.plantData.images[0] } :
      orderProduct?.image ?
      { uri: orderProduct.image } :
      orderProduct?.imageCollection?.[0] ?
      { uri: orderProduct.imageCollection[0] } :
      // Try fallback plant data (prefer webp)
      fallbackPlantData?.imageCollectionWebp?.[0] ?
      { uri: fallbackPlantData.imageCollectionWebp[0] } :
      fallbackPlantData?.image ?
      { uri: fallbackPlantData.image } :
      fallbackPlantData?.imageCollection?.[0] ?
      { uri: fallbackPlantData.imageCollection[0] } :
      require('../../../assets/images/plant1.png');

    const transformedObject = {
      status: creditRequest.issueType || 'Credit Requested',
      airCargoDate: orderDetails.flightDateFormatted || orderDetails.cargoDateFormatted || orderDetails.orderDate || orderDetails.createdAt || 'TBD',
      countryCode: getCountryCode({
        plantSourceCountry: orderDetails.plantSourceCountry || listingDetails.plantSourceCountry,
        orderDetails: orderDetails,
        listingDetails: listingDetails
      }),
      flag: getCountryFlag({
        plantSourceCountry: orderDetails.plantSourceCountry || listingDetails.plantSourceCountry,
        orderDetails: orderDetails,
        listingDetails: listingDetails
      }),
      planeIcon: PlaneGrayIcon,
      image: finalImage,
      plantName: productPlantDetails?.title || orderProduct?.plantName || orderProduct?.title || 'Unknown Plant',
      variety: orderProduct?.variegation || productPlantDetails?.variegation || plantDetails?.variegation || listingDetails?.variegation || 'Standard',
      size: orderProduct?.potSize || productPlantDetails?.potSize || plantDetails?.potSize || listingDetails?.potSize || '',
      price: `$${(
        orderProduct?.price ||
        orderProduct?.finalPrice ||
        orderDetails.pricing?.finalTotal || 
        orderDetails.finalTotal || 
        orderDetails.totalAmount ||
        orderDetails.products?.[0]?.price ||
        orderDetails.products?.[0]?.finalPrice ||
        listingDetails?.finalPrice ||
        listingDetails?.price ||
        listingDetails?.basePrice ||
        plantDetails?.finalPrice ||
        plantDetails?.price || 
        creditRequest.orderAmount || 
        creditRequest.amount ||
        creditRequest.totalAmount ||
        0
      ).toFixed(2)}`,
      quantity: orderProduct?.quantity || plantDetails?.quantity || listingDetails?.quantity || 1,
      plantCode: creditRequest.plantCode || orderProduct?.plantCode || plantDetails?.plantCode || listingDetails?.plantCode || '',
      // Journey Mishap specific fields
      showCreditStatus: true,
      creditRequestStatus: creditRequest.status || 'pending',
      issueType: creditRequest.issueType || 'Plant Issue',
      requestDate: creditRequest.requestDate || creditRequest.createdAt || new Date().toISOString(),
      totalCreditRequests: 1,
      hasActiveCreditRequests: creditRequest.status === 'pending',
      // Order details for navigation
      orderId: creditRequest.orderId,
      transactionNumber: orderDetails.transactionNumber || creditRequest.orderId,
      products: [{
        plantCode: creditRequest.plantCode,
        ...(orderProduct || {}),
        plantDetails: plantDetails,
        listingDetails: listingDetails,
        plantName: orderProduct?.plantName || orderProduct?.title || plantDetails?.title || plantDetails?.plantName,
        image: orderProduct?.image || plantDetails?.image || listingDetails?.image,
        ...plantDetails 
      }],
      creditRequests: [creditRequest],
      fullOrderData: {
        ...orderDetails,
        id: creditRequest.orderId,
        creditRequests: [creditRequest],
        listingDetails: listingDetails,
        products: [{
          plantCode: creditRequest.plantCode,
          ...(orderProduct || {}),
          plantDetails: plantDetails,
          listingDetails: listingDetails,
          plantName: orderProduct?.plantName || orderProduct?.title || plantDetails?.title || plantDetails?.plantName,
          image: orderProduct?.image || plantDetails?.image || listingDetails?.image,
          ...plantDetails 
        }]
      }
    };

    return transformedObject;
  };

  // Transform API plant with credit request to component format (for new API response)
  const transformPlantToComponentFormat = async (plant) => {
    const plantDetails = plant.plantDetails || {};
    const order = plant.order || {};
    const creditRequest = plant.creditRequestStatus?.latestRequest || {};
    
    // Image resolution with fallbacks
    const finalImage = plantDetails?.imageCollectionWebp?.[0] ?
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
      require('../../../assets/images/plant1.png');

    return {
      status: creditRequest.issueType || plant.creditRequestStatus?.issueType || 'Credit Requested',
      airCargoDate: order.flightDateFormatted || order.cargoDateFormatted || order.orderDate || order.createdAt || 'TBD',
      countryCode: getCountryCode(plant),
      flag: getCountryFlag(plant),
      planeIcon: PlaneGrayIcon,
      image: finalImage,
      plantName: plantDetails?.title || plant.plantName || `${plant.genus || ''} ${plant.species || ''}`.trim() || 'Unknown Plant',
      variety: plant.variegation || plantDetails?.variegation || 'Standard',
      size: plant.potSize || plantDetails?.potSize || '',
      price: `$${(
        plant.unitPrice ||
        plant.productTotal ||
        order.pricing?.finalTotal || 
        order.finalTotal || 
        order.totalAmount ||
        creditRequest.orderAmount || 
        creditRequest.amount ||
        creditRequest.totalAmount ||
        0
      ).toFixed(2)}`,
      quantity: plant.quantity || 1,
      plantCode: plant.plantCode || '',
      // Journey Mishap specific fields
      showCreditStatus: true,
      creditRequestStatus: creditRequest.status || plant.creditRequestStatus?.status || 'pending',
      issueType: creditRequest.issueType || plant.creditRequestStatus?.issueType || 'Plant Issue',
      requestDate: creditRequest.requestDate || creditRequest.createdAt || plant.creditRequestStatus?.createdAt || new Date().toISOString(),
      totalCreditRequests: 1,
      hasActiveCreditRequests: creditRequest.status === 'pending' || plant.creditRequestStatus?.status === 'pending',
      // Order details for navigation
      orderId: order.id,
      transactionNumber: order.transactionNumber || order.id,
      products: [{
        plantCode: plant.plantCode,
        ...plant,
        plantDetails: plantDetails,
        plantName: plant.plantName || plantDetails?.title,
        image: plant.image || plantDetails?.image,
      }],
      creditRequests: [creditRequest],
      fullOrderData: {
        ...order,
        id: order.id,
        creditRequests: [creditRequest],
        products: [{
          plantCode: plant.plantCode,
          ...plant,
          plantDetails: plantDetails,
          plantName: plant.plantName || plantDetails?.title,
          image: plant.image || plantDetails?.image,
        }]
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
    
    // Handle legacy order structure
    if (orderOrPlant.products && orderOrPlant.products.length > 0) {
      const p = orderOrPlant.products[0];
      if (p.plantSourceCountry) {
        return validateCountryCode(p.plantSourceCountry);
      }
    }
    
    // Legacy creditRequest with orderDetails
    if (orderOrPlant.orderDetails?.plantSourceCountry) {
      return validateCountryCode(orderOrPlant.orderDetails.plantSourceCountry);
    }
    
    // Legacy listing details
    if (orderOrPlant.listingDetails?.plantSourceCountry) {
      return validateCountryCode(orderOrPlant.listingDetails.plantSourceCountry);
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
    console.log(`Journey Mishap: Unexpected country code found: ${code}, using default ID`);
    return 'ID'; // Default to Indonesia for unknown codes
  };

  const getCountryFlag = (orderOrPlant) => {
    const countryCode = getCountryCode(orderOrPlant);
    const flagMap = {
      'PH': PhilippinesFlag,
      'ID': IndonesiaFlag,
      'TH': ThailandFlag,
    };
    return flagMap[countryCode] || IndonesiaFlag;
  };

  // Load orders when component mounts
  useEffect(() => {
    loadOrders();
  }, []);

  // Listen for refresh parameter from credit request submission
  useEffect(() => {
    if (route.params?.refreshData) {
      loadOrders(true);
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
              console.log('📦 ScreenJourneyMishap: User is near bottom, loading more orders');
              handleLoadMore();
            }
            
            // Load more recommendations when scrolling near bottom
            if (isCloseToBottom && browseMorePlantsRef?.current) {
              console.log('🌱 ScreenJourneyMishap: User is near bottom, triggering load more recommendations');
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
              <Text style={styles.emptyText}>No Journey Mishap orders found</Text>
              <Text style={styles.emptySubtext}>
                Any delivery issues will appear here
              </Text>
            </View>
          ) : (
            orders.map((item, index) => (
              <OrderItemCard key={`${item.plantCode}_${index}`} {...item} activeTab="Journey Mishap" />
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

          {/* Browse More Plants Component */}
          <BrowseMorePlants 
            ref={browseMorePlantsRef}
            title="More from our Jungle"
            initialLimit={8}
            loadMoreLimit={8}
            showLoadMore={false}
            containerStyle={{marginTop: 24, paddingHorizontal: 15, marginBottom: 40}}
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

export default ScreenJourneyMishap;
