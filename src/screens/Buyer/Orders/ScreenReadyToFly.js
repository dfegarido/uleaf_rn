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
        status: ["Ready to Fly"],
        includeDetails: true, // Get detailed order information
      };

      console.log('🔍 Loading Ready to Fly orders');
      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      // New API returns a flattened plants[] array where each plant contains its order metadata
      const plantsData = response.data?.data?.plants || [];
      console.log('📦 Loaded Ready to Fly plant records:', plantsData.length);

      // Debug: Log the first plant's relevant fields
      if (plantsData.length > 0) {
        console.log('First plant record:', {
          listingId: plantsData[0].listingId,
          plantCode: plantsData[0].plantCode,
          flightDateFormatted: plantsData[0].flightDateFormatted,
          plantSourceCountry: plantsData[0].plantSourceCountry,
          orderId: plantsData[0].order?.id,
        });
      }

      // Transform plant-level API data to component expected format
      const transformedOrders = plantsData.map(plant => transformPlantToComponentFormat(plant));
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

  // Transform API plant-level data to component expected format
  const transformPlantToComponentFormat = (plant) => {
    const plantDetails = plant.plantDetails || {};
    const orderMeta = plant.order || {};

    // Build a minimal order-like object to satisfy components that expect fullOrderData.products
    const fullOrderLike = {
      ...orderMeta,
      products: [plant]
    };

    return {
      status: orderMeta.status || 'Ready to Fly',
      // Use the flightDateFormatted from the plant record first, then order metadata
      airCargoDate: plant.flightDateFormatted || orderMeta.flightDateFormatted || plant.flightDate || 'TBD',
      countryCode: getCountryCode(plant),
      flag: getCountryFlag(plant),
      planeIcon: PlaneGrayIcon,
      image: plantDetails?.imageCollectionWebp?.[0] ? { uri: plantDetails.imageCollectionWebp[0] } : (plantDetails?.image ? { uri: plantDetails.image } : (plantDetails?.imageCollection?.[0] ? { uri: plantDetails.imageCollection[0] } : require('../../../assets/images/plant1.png'))),
      plantName: plantDetails?.title || plant.plantName || 'Unknown Plant',
      variety: plant.variegation || plantDetails?.variegation || 'Standard',
      size: plant.potSize || plantDetails?.potSize || '',
      price: `$${((orderMeta.pricing?.finalTotal ?? plant.productTotal ?? plant.unitPrice) || 0).toFixed(2)}`,
      quantity: plant.quantity || 1,
      plantCode: plant.plantCode || '',
      // For navigation and downstream components, provide order identifiers and a fullOrderData compatible object
      orderId: orderMeta.id,
      transactionNumber: orderMeta.transactionNumber || orderMeta.id,
      products: [plant],
      fullOrderData: fullOrderLike,
      // include original plant record for any additional fields
      _rawPlantRecord: plant
    };
  };

  // Helper functions for display formatting
  const getCountryCode = (record) => {
    if (!record) return 'ID';

    // Prefer explicit plant-level country first
    if (record.plantSourceCountry) return record.plantSourceCountry;

    // If record contains an order metadata object, prefer its plantSourceCountry
    if (record.order && record.order.plantSourceCountry) return record.order.plantSourceCountry;

    // If this is an order-like object with products, prefer the first product's plantSourceCountry
    if (record.products && record.products.length > 0) {
      return record.products[0].plantSourceCountry || record.products[0].supplierCountry || 'ID';
    }

    // As a last resort, check nested plantDetails for any explicit country field
    if (record.plantDetails && record.plantDetails.plantSourceCountry) return record.plantDetails.plantSourceCountry;

    // Do NOT return supplierCode or sellerCode (they are identifiers, not country codes)
    return 'ID';
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
