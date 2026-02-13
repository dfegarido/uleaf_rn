import NetInfo from '@react-native-community/netinfo';
import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import { useAuth } from '../../../auth/AuthProvider';
import { getBuyerOrdersApi, exportBuyerOrdersApi } from '../../../components/Api/orderManagementApi';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import { JoinerOrderCard, OrderItemCard, OrderItemCardSkeleton } from '../../../components/OrderItemCard';
import { filterByPlantOwner, isReadyToFly, getBuyerUid } from '../../../utils/buyerOrderFiltering';

const READY_TO_FLY_LIMIT = 4;

const ScreenReadyToFly = ({plantOwnerFilter = null, onBuyersLoaded = null}) => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders (unfiltered)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const browseMorePlantsRef = React.useRef(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);

  // Load orders from API
  const loadOrders = async (isRefresh = false, append = false) => {
    try {
      if (append) {
        setLoadingMore(hasMore);
      } else if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection');
      }

      // Fetch Ready to Fly orders with an elevated limit so all plants are returned
      const limit = READY_TO_FLY_LIMIT;
      const params = {
        status: "Ready to Fly",
        includeDetails: true,
        limit,
        offset: append ? (page + 1) * limit : 0,
      };

      console.log('🔍 Loading Ready to Fly orders');
      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      setHasMore(response.data?.data?.pagination?.hasMore || false);
      
      // New API returns a flattened plants[] array where each plant contains its order metadata
      const plantsData = response.data?.data?.plants || [];
      console.log('📦 Loaded Ready to Fly plant records:', plantsData.length, 'plants');

      // Transform plant-level API data to component expected format
      const transformedOrders = plantsData.map(plant => transformPlantToComponentFormat(plant));
      
      // Extract unique buyers from orders and notify parent
      if (onBuyersLoaded) {
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
      
      // Apply filter if provided

      if (append) {
        const updatedAllOrders = [...allOrders, ...transformedOrders];
        setAllOrders(updatedAllOrders);
        applyPlantOwnerFilter(updatedAllOrders, plantOwnerFilter);
        setPage(prev => prev + 1);
      } else {
        setAllOrders(transformedOrders);
        applyPlantOwnerFilter(transformedOrders, plantOwnerFilter);
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
      products: [plant],
      plantDetails: plantDetails,
    };

    return {
      leafTrailHistory: orderMeta?.leafTrailHistory || {},
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
      // Include joiner order flags and info
      isJoinerOrder: plant.isJoinerOrder || false,
      joinerInfo: plant.joinerInfo || null,
      // Include buyerUid for filtering
      buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
      // include original plant record for any additional fields
      _rawPlantRecord: plant
    };
  };

  // Helper functions for display formatting
  const getCountryCode = (record) => {
    if (!record) return 'ID';

    console.log('🔍 getCountryCode - Checking record for plantSourceCountry:', {
      hasRecord: !!record,
      plantSourceCountry: record.plantSourceCountry,
      orderPlantSourceCountry: record.order?.plantSourceCountry,
      supplierName: record.supplierName,
      supplierCode: record.supplierCode,
      plantDetails: record.plantDetails ? Object.keys(record.plantDetails) : 'none'
    });

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
    console.warn('⚠️ No plantSourceCountry found, defaulting to ID for plant:', record.plantName || record.plantCode);
    return 'ID';
  };

  const getCountryFlag = (order) => {
    const countryCode = getCountryCode(order);
    console.log('🔍 getCountryFlag - raw order:', JSON.stringify(order, null, 2).substring(0, 500));
    console.log('🔍 Country code for flag:', countryCode, 'for plant:', order?.plantName || order?.plantCode);
    
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

  // Apply plant owner filter using centralized filtering utility
  const applyPlantOwnerFilter = useCallback((ordersToFilter, filter) => {
    // Use centralized filtering utility
    const filtered = filterByPlantOwner(ordersToFilter, filter);
    
    // Additional frontend validation: ensure orders pass Ready to Fly criteria
    // (Backend already filters, but this provides extra safety)
    const validatedOrders = filtered.filter(order => {
      // Convert component format back to order format for validation
      const orderForValidation = {
        status: order.status || order._rawPlantRecord?.order?.status,
        leafTrailStatus: order._rawPlantRecord?.order?.leafTrailStatus || order._rawPlantRecord?.leafTrailStatus,
        flightDate: order._rawPlantRecord?.flightDate || order._rawPlantRecord?.order?.flightDate,
        buyerUid: order.buyerUid || order._rawPlantRecord?.buyerUid,
      };
      
      // Validate order passes Ready to Fly criteria
      return isReadyToFly(orderForValidation);
    });
    
    console.log(`🔍 [ScreenReadyToFly] Filtered orders: ${ordersToFilter.length} → ${filtered.length} (plant owner) → ${validatedOrders.length} (validated)`);
    
    setOrders(validatedOrders);
  }, []);

  // Apply filter when plantOwnerFilter prop changes
  useEffect(() => {
    if (allOrders.length > 0) {
      applyPlantOwnerFilter(allOrders, plantOwnerFilter);
    }
  }, [plantOwnerFilter, allOrders, applyPlantOwnerFilter]);

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

  const handleLoadMore = async () => {
    if (loadingMore) return;
    
    await loadOrders(false, true);
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      console.log('📊 Exporting Ready to Fly orders to Excel...');

      const response = await exportBuyerOrdersApi({
        status: 'Ready to Fly'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate Excel file');
      }

      setExporting(false);
      
      // Show success message
      Alert.alert(
        '📧 Email Sent!',
        `Your Excel report has been sent to:\n${response.sentTo}\n\nReport contains:\n• ${response.plantCount} plants\n• ${response.transactionCount} transactions\n\nPlease check your email inbox.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error exporting orders:', error);
      setExporting(false);
      Alert.alert(
        'Export Failed', 
        error.message || 'Failed to export orders. Please try again.'
      );
    }
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
            // Trigger load more plants when very close to bottom (within 200px)
            const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
            
            // Load more orders when scrolling near bottom
            if (isCloseToBottom && !loadingMore && !refreshing) {
              console.log('📦 ScreenPayToBoard: User is near bottom, loading more orders');
              handleLoadMore();
            }

            if (distanceFromBottom <= 200 && browseMorePlantsRef?.current) {
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

          {/* Export Button */}
          {orders.length > 0 && !error && (
            <View style={styles.exportContainer}>
              <TouchableOpacity 
                style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
                onPress={handleExportToExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.exportButtonText}>📧 Email Excel Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Orders container with tracking */}
          <View 
            onLayout={(event) => {
              // This will be used to track when orders section ends
            }}>
            {orders.length === 0 && !error ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No Ready to Fly orders found</Text>
                <Text style={styles.emptySubtext}>
                  Your confirmed orders will appear here
                </Text>
              </View>
          ) : (
            orders.map((item, index) => {
              // Check if this is a joiner order
              if (item.isJoinerOrder && item.joinerInfo) {
                return (
                  <JoinerOrderCard
                    key={`joiner_${item.plantCode}_${index}`}
                    status={item.status}
                    airCargoDate={item.airCargoDate}
                    countryCode={item.countryCode}
                    flag={item.flag}
                    image={item.image}
                    plantName={item.plantName}
                    variety={item.variety}
                    size={item.size}
                    price={item.price}
                    quantity={item.quantity}
                    plantCode={item.plantCode}
                    fullOrderData={item.fullOrderData}
                    activeTab="Ready to Fly"
                    joinerInfo={item.joinerInfo}
                  />
                );
              }
              // Regular order card
              return (
                <OrderItemCard key={`${item.plantCode}_${index}`} {...item} activeTab="Ready to Fly" />
              );
            })
          )}
          </View>

          {loadingMore && (
                      <View style={{paddingHorizontal: 0, marginTop: 12}}>
                        {Array.from({length: READY_TO_FLY_LIMIT}).map((_, i) => (
                          <OrderItemCardSkeleton key={`load-more-skel-${i}`} />
                        ))}
                      </View>
                    )}

          {/* Browse More Plants Component */}
          {/* <BrowseMorePlants 
            ref={browseMorePlantsRef}
            title="More from our Jungle"
            initialLimit={8}
            loadMoreLimit={8}
            showLoadMore={false}
            containerStyle={{marginTop: 24, paddingHorizontal: 15, marginBottom: 40}}
          /> */}

          
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
  exportContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  exportButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  exportButtonDisabled: {
    backgroundColor: '#A0C4A8',
    opacity: 0.7,
  },
  exportButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default ScreenReadyToFly;
