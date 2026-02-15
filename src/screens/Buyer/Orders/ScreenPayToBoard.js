import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect, useCallback} from 'react';
import {ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import VenmoLogoIcon from '../../../assets/buyer-icons/venmo-logo.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import {OrderItemCard, OrderItemCardSkeleton, JoinerOrderCard} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import CaretDownIcon from '../../../assets/icons/accent/caret-down-regular.svg';
import {getBuyerOrdersApi, getBuyerOrdersGroupedApi} from '../../../components/Api/orderManagementApi';
import {checkoutApi} from '../../../components/Api/checkoutApi';
import {paymentPaypalVenmoUrl} from '../../../../config';
import {Linking} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {useAuth} from '../../../auth/AuthProvider';
import { getBuyerProfileApi } from '../../../components/Api/getBuyerProfileApi';
import { createAndCapturePaypalOrder } from '../../../components/Api/paymentApi';
import { filterPayToBoardGroups, filterGroupPlants, isPayToBoard } from '../../../utils/buyerOrderFiltering';

const ScreenPayToBoard = ({plantOwnerFilter = null, onBuyersLoaded = null}) => {
  const navigation = useNavigation();
  const route = useRoute();
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
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [payingTransaction, setPayingTransaction] = useState(null);
  const [vaultedPaymentId, setVaultedPaymentId] = useState(null);
  const [vaultedPaymentUsername, setVaultedPaymentUsername] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileResult = await getBuyerProfileApi();
        // Backend returns data at root level, not in a 'data' property
        if (profileResult && profileResult.success) {
          // Use profileResult directly (data is at root level)
          setVaultedPaymentId(profileResult?.paypalPaymentSource?.id || null);
          setVaultedPaymentUsername(profileResult?.paypalPaymentSource?.details?.venmo?.user_name || null);
        } 
      } catch (error) {
        console.error('❌ [loadUserProfile] Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  // Apply plant owner filter using centralized filtering utility
  const applyPlantOwnerFilter = useCallback((ordersToFilter, filter) => {
    // Use centralized filtering utility for grouped orders
    const filtered = filterPayToBoardGroups(ordersToFilter, filter);
    
    // Additional frontend validation: ensure groups pass Pay to Board criteria
    const validatedGroups = filtered.filter(group => {
      // Validate group status
      return isPayToBoard(group);
    });
    
    // Filter plants within each group if plant owner filter is applied
    const groupsWithFilteredPlants = validatedGroups.map(group => 
      filter ? filterGroupPlants(group, filter) : group
    );
    
    console.log(`🔍 [ScreenPayToBoard] Filtered groups: ${ordersToFilter.length} → ${filtered.length} (plant owner) → ${validatedGroups.length} (validated)`);
    
    setOrders(groupsWithFilteredPlants);
  }, []);

  // Load orders from API
  const loadOrders = async (isRefresh = false, append = false) => {
    try {
      if (append) {
        setLoadingMore(hasMore);
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
      setHasMore(response.data?.data?.pagination?.hasMore || false);
      
      const groupedOrders = response.data?.data?.groups || [];
      console.log('📦 Loaded Pay to Board grouped orders:', groupedOrders);

      // Extract unique buyers from orders
      if (onBuyersLoaded && groupedOrders.length > 0 && !append) {
        const uniqueBuyers = new Map();
        
        // Add receiver (current user) to the list
        if (user) {
          uniqueBuyers.set(user.uid, {
            buyerUid: user.uid,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'You',
            username: user.username || '',
            type: 'receiver'
          });
        }
        
        // Extract buyers from groups and their plants
        groupedOrders.forEach(group => {
          // Check group level
          if (group.buyerUid && !uniqueBuyers.has(group.buyerUid)) {
            const joinerInfo = group.joinerInfo;
            if (joinerInfo) {
              uniqueBuyers.set(group.buyerUid, {
                buyerUid: group.buyerUid,
                name: `${joinerInfo.firstName || ''} ${joinerInfo.lastName || ''}`.trim() || joinerInfo.username || 'Unknown',
                username: joinerInfo.username || '',
                type: 'joiner'
              });
            }
          }
          
          // Check plant level
          if (group.plants && group.plants.length > 0) {
            group.plants.forEach(plant => {
              const plantBuyerUid = plant.buyerUid || group.buyerUid;
              if (plantBuyerUid && !uniqueBuyers.has(plantBuyerUid)) {
                const joinerInfo = plant.joinerInfo || group.joinerInfo;
                if (joinerInfo) {
                  uniqueBuyers.set(plantBuyerUid, {
                    buyerUid: plantBuyerUid,
                    name: `${joinerInfo.firstName || ''} ${joinerInfo.lastName || ''}`.trim() || joinerInfo.username || 'Unknown',
                    username: joinerInfo.username || '',
                    type: 'joiner'
                  });
                } else if (plantBuyerUid === user?.uid) {
                  uniqueBuyers.set(plantBuyerUid, {
                    buyerUid: plantBuyerUid,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'You',
                    username: user.username || '',
                    type: 'receiver'
                  });
                }
              }
            });
          }
        });
        
        const buyersArray = Array.from(uniqueBuyers.values());
        console.log('👥 Pay to Board unique buyers:', buyersArray);
        onBuyersLoaded(buyersArray);
      }

      if (append) {
        const updatedAllOrders = [...allOrders, ...groupedOrders];
        setAllOrders(updatedAllOrders);
        applyPlantOwnerFilter(updatedAllOrders, plantOwnerFilter);
        setPage(prev => prev + 1);
      } else {
        setAllOrders(groupedOrders);
        applyPlantOwnerFilter(groupedOrders, plantOwnerFilter);
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

  // Apply filter when plantOwnerFilter prop changes
  useEffect(() => {
    if (allOrders.length > 0) {
      applyPlantOwnerFilter(allOrders, plantOwnerFilter);
    }
  }, [plantOwnerFilter, allOrders, applyPlantOwnerFilter]);

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
      // Include joiner order flags and info
      isJoinerOrder: plant.isJoinerOrder || orderMeta.isJoinerOrder || false,
      joinerInfo: plant.joinerInfo || orderMeta.joinerInfo || null,
      buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
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
      // Redirect to PayPal/Venmo payment page for existing transaction
      // No need to create a new transaction - just pay for the existing one
      if (transactionNumber && total > 0 && vaultedPaymentId) {
          setLoading(true);
          const paymentResponse = await createAndCapturePaypalOrder({
            amount: String(total),
            ileafuOrderId: transactionNumber,
            vaultedPaymentId,
          });
          // const paymentResponse = await createAndCapturePaypalOrder({
          //   amount: String(0.02),
          //   ileafuOrderId: 'TXN1762690660039632',
          //   vaultedPaymentId,
          // });
          setLoading(false);
          if (paymentResponse.success) {
            Alert.alert('Success', 'Order placed successfully!', [
              { 
                text: 'OK', 
                onPress: () => {
                  navigation.navigate('Orders');
                }
              }
            ]);
          }
      
        if (!paymentResponse.success) {
          if (paymentResponse.error === 'Failed to create/capturing order') {
              Alert.alert(
                'Payment Error',
                'Payment failed. Please try again or contact support.',
                [
                  { text: 'Retry Payment', onPress: () =>  
                    Linking.openURL(`${paymentPaypalVenmoUrl}?amount=${total}&ileafuOrderId=${transactionNumber}`).catch(err => {
                      console.error('❌ [handleCheckout] Failed to open payment URL:', err);
                      Alert.alert(
                        'Payment Error',
                        'Unable to open payment page. Please try again or contact support.',
                        [{ text: 'OK', onPress: () => navigation.navigate('Orders') }]
                      );
                    })
                  },
                  {
                    text: 'Cancel',
                    onPress: () => {
                      navigation.navigate('Orders');
                    },
                    style: 'cancel',
                  }
                ]
              );
            } else {
              Alert.alert(
                'Payment Error',
                paymentResponse.error || 'Payment failed. Please try again or contact support.',
                [{ text: 'OK' }]
              );
            }
        }
          
      } else {
        navigation.navigate('Orders');

        setTimeout(() => {
          console.log('💳 Opening payment page for existing order:', transactionNumber);
          Linking.openURL(
            `${paymentPaypalVenmoUrl}?amount=${total}&ileafuOrderId=${transactionNumber}`,
          );
        }, 500);
      }
      
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

  const maskUsername = (username) => {
    if (!username || username.length < 3) {
      return ''; // Don't show for very short or empty usernames
    }
    const firstChar = username[0];
    const secondChar = username[1];
    const lastChar = username.slice(-1);
    const secondToTheLastChar = username.slice(-2, -1);
    // Show first and last char, with up to 8 asterisks in between
    const middle = '*'.repeat(Math.min(username.length - 2, 8));
    return `@${firstChar}${secondChar}${middle}${secondToTheLastChar}${lastChar}`;
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
                    {!vaultedPaymentId && (<TouchableOpacity
                      style={styles.payButton}
                      onPress={() => {
                        Alert.alert('Are you sure?', '', [
                              {
                                text: 'No',
                                onPress: () => {
                                  return null;
                                },
                                style: 'cancel'
                              },
                              {
                                text: 'Yes',
                                onPress: () => {
                                  handlePayTransaction(group);
                                },
                              },
                            ])
                        }}
                      activeOpacity={0.7}
                      disabled={payingTransaction === group.transactionNumber}
                    >
                      {payingTransaction === group.transactionNumber ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
                      )}
                    </TouchableOpacity>)}

                    {vaultedPaymentId && (<TouchableOpacity
                      style={styles.payButton}
                      onPress={() => {
                        Alert.alert('Are you sure?', '', [
                              {
                                text: 'No',
                                onPress: () => {
                                  return null;
                                },
                                style: 'cancel'
                              },
                              {
                                text: 'Yes',
                                onPress: () => {
                                  handlePayTransaction(group);
                                },
                              },
                            ])
                        }}
                      activeOpacity={0.7}
                      disabled={payingTransaction === group.transactionNumber}
                    >
                      {payingTransaction === group.transactionNumber ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <View style={styles.venmoButtonContent}>
                          <View style={styles.venmoFirstLine}>
                            <Text style={styles.venmoButtonText}>Pay ${total.toFixed(2)} with </Text>
                            <VenmoLogoIcon width={51} height={13} />
                          </View>
                          {vaultedPaymentUsername && (
                            <View style={styles.venmoFirstLine}>
                              <Text style={styles.venmoUsernameText}> {maskUsername(vaultedPaymentUsername)}</Text>
                            </View>
                          )}
                        </View>
                        // <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
                      )}
                    </TouchableOpacity>)}
                  </View>
                  
                  {isExpanded && group.plants && group.plants.length > 0 && (
                    <View style={styles.transactionPlants}>
                      {group.plants.map((plant, index) => {
                        const plantData = transformPlantToComponentFormat({
                          ...plant,
                          order: group
                        });
                        // Check if this is a joiner order
                        const isJoinerOrder = plantData.isJoinerOrder || group.isJoinerOrder || false;
                        
                        return isJoinerOrder ? (
                          <JoinerOrderCard 
                            key={`${plant.plantCode}_${index}`} 
                            {...plantData}
                            joinerInfo={plantData.joinerInfo || group.joinerInfo}
                            activeTab="Pay to Board" 
                          />
                        ) : (
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
  venmoButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#0074DE', // Venmo Blue
      borderRadius: 12,
      flex: 1,
  },
  venmoButtonDisabled: {
      backgroundColor: '#A9B3B7', // A muted gray for the disabled state
  },
  venmoButtonContent: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
  },
  venmoFirstLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venmoButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
      marginRight: 8,
      fontStyle: 'italic',
  },
  venmoUsernameText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 0,
      marginTop: 4,
  },
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
