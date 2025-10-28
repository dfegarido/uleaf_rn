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
import {getBuyerOrdersApi, getBuyerOrdersGroupedApi} from '../../../components/Api/orderManagementApi';
import {checkoutApi} from '../../../components/Api/checkoutApi';
import {paymentPaypalVenmoUrl} from '../../../../config';
import {Linking} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const ScreenPayToBoard = () => {
  const navigation = useNavigation();
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
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [payingTransaction, setPayingTransaction] = useState(null);

  // Load orders from API
  const loadOrders = async (isRefresh = false, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      // Check network with fallback
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected === false || netState.isInternetReachable === false) {
          throw new Error('No internet connection');
        }
      } catch (netError) {
        console.warn('NetInfo check failed, proceeding anyway:', netError);
        // Continue - let the actual API call fail if there's really no connection
      }

      const limit = PAGE_SIZE;
      const params = {
        limit,
        offset: append ? (page + 1) * limit : 0,
        // backend expects status code strings like 'pending_payment'
        status: 'pending_payment',
        includeDetails: true, // Get detailed order information
      };

      console.log('🔍 Loading Pay to Board orders with params:', params);
      const response = await getBuyerOrdersGroupedApi(params);
      console.log('📡 Pay to Board Grouped API response:', { success: response.success, groupCount: response.data?.data?.groups?.length });

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      const groupedOrders = response.data?.data?.groups || [];
      console.log('📦 Loaded Pay to Board grouped orders:', groupedOrders);

      if (append) {
        setOrders(prev => [...prev, ...groupedOrders]);
        setPage(prev => prev + 1);
      } else {
        setOrders(groupedOrders);
        setPage(0);
      }

    } catch (error) {
      console.error('Error loading Pay to Board orders:', error);
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

    const fullOrderLike = {
      ...orderMeta,
      products: [plant]
    };

    return {
      status: mapStatus(orderMeta.status || 'pending_payment'),
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
      orderId: orderMeta.id,
      transactionNumber: orderMeta.transactionNumber || orderMeta.id,
      products: [plant],
      fullOrderData: fullOrderLike,
      _rawPlantRecord: plant
    };
  };

  const getCountryCode = (record) => {
    if (!record) return 'ID';

    if (record.plantSourceCountry) return record.plantSourceCountry;
    if (record.order && record.order.plantSourceCountry) return record.order.plantSourceCountry;
    if (record.products && record.products.length > 0) {
      return record.products[0].plantSourceCountry || record.products[0].supplierCountry || 'ID';
    }
    if (record.plantDetails && record.plantDetails.plantSourceCountry) return record.plantDetails.plantSourceCountry;
    return 'ID';
  };

  const getCountryFlag = (order) => {
    const countryCode = getCountryCode(order);
    const flagMap = {
      'TH': ThailandFlag,
      'PH': PhilippinesFlag,
      'ID': IndonesiaFlag,
      'US': IndonesiaFlag,
      'BR': IndonesiaFlag,
      'NL': IndonesiaFlag
    };
    return flagMap[countryCode] || IndonesiaFlag;
  };

  // Map backend status codes to friendly UI labels
  const mapStatus = (status) => {
    if (!status) return 'Pay to Board';
    switch (status) {
      case 'pending_payment':
        return 'Pay to Board';
      case 'ready_to_fly':
        return 'Ready to Fly';
      default:
        // Fallback: convert snake_case to Title Case
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  // Toggle transaction expansion
  const toggleTransaction = (transactionNumber) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionNumber)) {
        newSet.delete(transactionNumber);
      } else {
        newSet.add(transactionNumber);
      }
      return newSet;
    });
  };

  // Calculate total for a transaction group
  const calculateTransactionTotal = (group) => {
    return group.pricing?.finalTotal || group.finalTotal || 0;
  };

  // Handle payment for transaction
  const handlePayTransaction = async (group) => {
    const total = calculateTransactionTotal(group);
    const transactionNumber = group.transactionNumber;
    
    console.log('💳 Pay button clicked for existing transaction:', transactionNumber);
    
    setPayingTransaction(transactionNumber);
    
    try {
      // Navigate to Orders screen
      navigation.navigate('Orders');
      
      // Redirect to PayPal/Venmo payment page for existing transaction
      // No need to create a new transaction - just pay for the existing one
      setTimeout(() => {
        console.log('💳 Opening payment page for existing order:', transactionNumber);
        Linking.openURL(
          `${paymentPaypalVenmoUrl}?amount=${total}&ileafuOrderId=${transactionNumber}`,
        );
      }, 500);
    } catch (error) {
      console.error('❌ Payment error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setPayingTransaction(null);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (route.params?.refreshData) {
      loadOrders(true);
    }
  }, [route.params?.refreshData]);

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
          {Array.from({length: 3}).map((_, index) => (
            <OrderItemCardSkeleton key={`skeleton-${index}`} />
          ))}
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
              console.log('📦 ScreenPayToBoard: User is near bottom, loading more orders');
              handleLoadMore();
            }
            
            // Load more recommendations when scrolling near bottom
            if (isCloseToBottom && browseMorePlantsRef?.current) {
              console.log('🌱 ScreenPayToBoard: User is near bottom, triggering load more recommendations');
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
              <Text style={styles.emptyText}>No Pay to Board orders found</Text>
              <Text style={styles.emptySubtext}>
                Your pending Pay to Board orders will appear here
              </Text>
            </View>
          ) : (
            orders.map((group, groupIndex) => {
              const transactionNumber = group.transactionNumber || group.orderId || `group-${groupIndex}`;
              const isExpanded = expandedTransactions.has(transactionNumber);
              const total = calculateTransactionTotal(group);
              const plantCount = group.plants?.length || 0;
              
              return (
                <View key={transactionNumber} style={styles.transactionGroup}>
                  <View style={styles.transactionHeader}>
                    <TouchableOpacity 
                      style={styles.transactionHeaderContent}
                      onPress={() => toggleTransaction(transactionNumber)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionNumber}>
                          TXN {transactionNumber}
                        </Text>
                        <Text style={styles.transactionTotal}>
                          Total: ${total.toFixed(2)}
                        </Text>
                        <Text style={styles.transactionCount}>
                          {plantCount} {plantCount === 1 ? 'plant' : 'plants'}
                        </Text>
                      </View>
                      <View style={styles.transactionHeaderRight}>
                        <CaretDownIcon 
                          width={24} 
                          height={24} 
                          style={{transform: [{rotate: isExpanded ? '180deg' : '0deg'}]}}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handlePayTransaction(group)}
                      activeOpacity={0.7}
                      disabled={payingTransaction === group.transactionNumber}
                    >
                      {payingTransaction === group.transactionNumber ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {isExpanded && group.plants && group.plants.length > 0 && (
                    <View style={styles.transactionPlants}>
                      {group.plants.map((plant, index) => {
                        const plantData = transformPlantToComponentFormat({
                          ...plant,
                          order: group
                        });
                        return (
                          <OrderItemCard 
                            key={`${plant.plantCode}_${index}`} 
                            {...plantData}
                            activeTab="Pay to Board" 
                          />
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )
          }

          {loadingMore && (
            <View style={{paddingHorizontal: 0, marginTop: 12}}>
              {Array.from({length: PAGE_SIZE}).map((_, i) => (
                <OrderItemCardSkeleton key={`load-more-skel-${i}`} />
              ))}
            </View>
          )}


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
  transactionGroup: {
    marginBottom: 8,
  },
  transactionHeader: {
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  transactionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionHeaderRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  transactionTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter',
  },
  transactionPlants: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  payButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter',
  },
});

export default ScreenPayToBoard;
