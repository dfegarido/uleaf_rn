import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import {ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import {OrderItemCard, OrderItemCardSkeleton} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import {getBuyerCreditRequestsApi, getJourneyMishapDataApi} from '../../../components/Api/orderManagementApi';
import {getPlantDetailApi} from '../../../components/Api/getPlantDetailApi';
import NetInfo from '@react-native-community/netinfo';

const ScreenJourneyMishap = () => {
  const route = useRoute();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load credit requests from API using the new comprehensive Journey Mishap API
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

      const params = {
        limit: 20,
        offset: 0,
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

      const creditRequestsData = response.data?.data?.creditRequests || [];
      
      // Transform comprehensive Journey Mishap data to component format
      const transformedOrders = await Promise.all(
        creditRequestsData.map(creditRequest => 
          transformJourneyMishapDataToComponentFormat(creditRequest)
        )
      );

      setOrders(transformedOrders);

    } catch (error) {
      console.error('Error loading Journey Mishap orders:', error);
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
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

    const finalImage = productPlantDetails?.image ? 
      { uri: productPlantDetails.image } : 
      productPlantDetails?.imageCollection?.[0] ?
      { uri: productPlantDetails.imageCollection[0] } :
      // Check actual order product image fields
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
      // Try fallback plant data
      fallbackPlantData?.image ?
      { uri: fallbackPlantData.image } :
      fallbackPlantData?.imageCollection?.[0] ?
      { uri: fallbackPlantData.imageCollection[0] } :
      require('../../../assets/images/plant1.png');

    const transformedObject = {
      status: creditRequest.issueType || 'Credit Requested',
      airCargoDate: orderDetails.cargoDateFormatted || orderDetails.orderDate || orderDetails.createdAt || 'TBD',
      countryCode: getCountryCode({ products: [{ supplierCode: orderDetails.supplierCode || listingDetails.supplierCode }] }),
      flag: getCountryFlag({ products: [{ supplierCode: orderDetails.supplierCode || listingDetails.supplierCode }] }),
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

  // Transform credit request data to component expected format (Legacy - fallback for old API)
  const transformCreditRequestToComponentFormat = (creditRequest) => {
    const orderData = creditRequest.orderData || {};
    const plantDetails = creditRequest.plantDetails || {};
    
    return {
      status: creditRequest.issueType || 'Credit Requested',
      airCargoDate: orderData.cargoDateFormatted || orderData.orderDate || 'TBD',
      countryCode: getCountryCode({ products: [{ supplierCode: orderData.supplierCode }] }),
      flag: getCountryFlag({ products: [{ supplierCode: orderData.supplierCode }] }),
      image: plantDetails?.image ? 
        { uri: plantDetails.image } : 
        plantDetails?.imageCollection?.[0] ?
        { uri: plantDetails.imageCollection[0] } :
        require('../../../assets/images/plant1.png'),
      plantName: plantDetails?.title || plantDetails?.plantName || 'Unknown Plant',
      variety: plantDetails?.variegation || 'Standard',
      size: plantDetails?.potSize || '',
      price: `$${(
        orderData.pricing?.finalTotal || 
        orderData.finalTotal || 
        orderData.totalAmount || 
        orderData.total ||
        plantDetails?.price || 
        plantDetails?.finalPrice ||
        creditRequest.orderAmount || 
        creditRequest.amount ||
        creditRequest.totalAmount ||
        orderData.products?.[0]?.price ||
        orderData.products?.[0]?.finalPrice ||
        0
      ).toFixed(2)}`,
      quantity: plantDetails?.quantity || 1,
      plantCode: creditRequest.plantCode || '',
      // Journey Mishap specific fields
      showCreditStatus: true,
      creditRequestStatus: creditRequest.status || 'pending',
      issueType: creditRequest.issueType || 'Plant Issue',
      requestDate: creditRequest.requestDate || creditRequest.createdAt || new Date().toISOString(),
      totalCreditRequests: 1,
      hasActiveCreditRequests: creditRequest.status === 'pending',
      // Order details for navigation
      orderId: creditRequest.orderId,
      transactionNumber: orderData.transactionNumber || creditRequest.orderId,
      products: [{ 
        plantCode: creditRequest.plantCode,
        plantDetails: plantDetails,
        ...plantDetails 
      }],
      creditRequests: [creditRequest],
      fullOrderData: {
        ...orderData,
        id: creditRequest.orderId,
        creditRequests: [creditRequest],
        products: [{ 
          plantCode: creditRequest.plantCode,
          plantDetails: plantDetails,
          ...plantDetails 
        }]
      }
    };
  };

  // Helper functions for display formatting
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
            initialLimit={6}
            loadMoreLimit={6}
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
          
          {/* Browse More Plants Component */}
          <BrowseMorePlants 
            title="More from our Jungle"
            initialLimit={6}
            loadMoreLimit={6}
            showLoadMore={true}
            containerStyle={{marginTop: 24, paddingHorizontal: 15}}
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

export default ScreenJourneyMishap;
