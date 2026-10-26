import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect, useCallback, useRef} from 'react';
import {ScrollView, TouchableOpacity, Alert, RefreshControl, LayoutAnimation} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {OrderItemCardSkeleton} from '../../../components/OrderItemCard';
import Toast from '../../../components/Toast/Toast';
import BoardingPass, {PassConfirmSheet, PASS_COLORS} from './components/BoardingPass';
import {
  getBuyerOrdersApi,
  getBuyerOrdersGroupedApi,
  cancelPayToBoardOrderApi,
} from '../../../components/Api/orderManagementApi';
import {checkoutApi} from '../../../components/Api/checkoutApi';
import {openPaymentSheet} from '../../../utils/openPaymentSheet';
import NetInfo from '@react-native-community/netinfo';
import {useAuth} from '../../../auth/AuthProvider';
import { getBuyerProfileApi } from '../../../components/Api/getBuyerProfileApi';
import { createAndCapturePaypalOrder } from '../../../components/Api/paymentApi';
import { filterPayToBoardGroups, filterGroupPlants, isPayToBoard } from '../../../utils/buyerOrderFiltering';
import {
  orderTotalOf,
  flightDateOf,
  originCodesOf,
  toPassPlant,
  maskUsername,
  passSheetText,
  PAY_TO_BOARD_ACTION,
} from './payToBoardOrder';
import {on} from '../../../services/notifications/notificationEvents';
import {
  createPaymentProgressState,
  markPaymentInProgress,
  clearPaymentInProgress,
  isPaymentInProgress,
  loadPaymentProgress,
  savePaymentProgress,
} from '../../../utils/paymentProgress';

const ScreenPayToBoard = ({plantOwnerFilter = null, onBuyersLoaded = null}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 100; // Extra 100px for spacing to show all orders
  
  const PAGE_SIZE = 4;
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders (unfiltered)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [payingTransaction, setPayingTransaction] = useState(null);
  // The confirmation sheet that is up, if any: {type: 'pay' | 'cancel', group}. The sheet
  // says exactly what will happen before the buyer commits to paying or cancelling.
  const [sheet, setSheet] = useState(null);
  // Orders being cancelled, by transaction number: 'cancelling' while the request runs (the
  // pass tears), then 'cancelled' while it folds away before leaving the list.
  const [cancelStatuses, setCancelStatuses] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  // Transactions the buyer started paying for and that have not been confirmed yet. The payment
  // completes in the browser, so the app cannot know the outcome when the sheet closes - the
  // backend confirms it and pushes a "payment confirmed" notification. Until then the buyer sees
  // a banner and the Pay button is disabled, so they cannot start a second payment for the same
  // order.
  const [paymentInProgress, setPaymentInProgress] = useState(createPaymentProgressState);
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

  // Handle payment for transaction
  const handlePayTransaction = async (group) => {
    const total = orderTotalOf(group);
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
                    openPaymentSheet(transactionNumber, total, {
                      onGaveUp: () => navigation.navigate('Orders'),
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
        console.log('💳 Opening payment page for existing order:', transactionNumber);
        // The payment completes in the browser, so from here on the outcome is unknown: the
        // backend confirms it and pushes a "payment confirmed" notification. Mark the order as
        // awaiting confirmation so the Pay button is disabled and the buyer sees the banner.
        setPaymentInProgress(prev => markPaymentInProgress(prev, transactionNumber));
        // Open the sheet over this screen and only navigate away once it is gone (presenter safety).
        openPaymentSheet(transactionNumber, total, {
          onClose: () => {
            // The sheet is gone and the buyer is back in the app. The payment is only confirmed
            // by the backend push, so until that arrives the order is still payable. Releasing
            // the flag here is what keeps a buyer who closed the sheet - or cancelled in PayPal -
            // able to pay again instead of being locked out of the button forever.
            setPaymentInProgress(prev => clearPaymentInProgress(prev, transactionNumber));
            setTimeout(() => navigation.navigate('Orders'), 300);
          },
        });
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

  // Restore the transactions that are still awaiting confirmation. The checkout flow opens the
  // payment sheet and then navigates here, so the flag has to survive the screen change.
  useEffect(() => {
    let active = true;
    loadPaymentProgress().then(state => {
      if (active && state.size > 0) {
        setPaymentInProgress(state);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist on every change, so the banner is still there after a navigation.
  useEffect(() => {
    savePaymentProgress(paymentInProgress);
  }, [paymentInProgress]);

  // The backend pushes "payment confirmed" once it has marked the order paid. That is the
  // moment the order is no longer awaiting confirmation, so the banner goes away and the list
  // is refreshed to show the new status.
  //
  // loadOrders is not memoized, so it is kept in a ref: subscribing on every render would
  // churn the listener for no reason.
  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    const unsubscribe = on('payment_confirmed', ({transactionNumber}) => {
      console.log('✅ Payment confirmed for', transactionNumber);
      if (transactionNumber) {
        setPaymentInProgress(prev => clearPaymentInProgress(prev, transactionNumber));
      }
      loadOrdersRef.current(true);
    });
    return unsubscribe;
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    await loadOrders(false, true);
  };

  const setCancelStatus = (transactionNumber, value) =>
    setCancelStatuses(prev => {
      const next = {...prev};
      if (value) {
        next[transactionNumber] = value;
      } else {
        delete next[transactionNumber];
      }
      return next;
    });

  // Cancel an unpaid order. The backend removes every plant on the transaction and gives back
  // the credits and discount code checkout took. Only this pass shows the progress, so the
  // rest of the list stays usable; on failure the pass goes back to how it was.
  const handleCancelTransaction = async group => {
    const transactionNumber = group.transactionNumber;
    setCancelStatus(transactionNumber, 'cancelling');
    try {
      const result = await cancelPayToBoardOrderApi(transactionNumber);
      if (!result.success) {
        throw new Error(result.error);
      }
      setCancelStatus(transactionNumber, 'cancelled');
      setToastMessage('Order cancelled');
    } catch (cancelError) {
      console.error('❌ Cancel order error:', cancelError);
      setCancelStatus(transactionNumber, null);
      Alert.alert(
        "Couldn't cancel the order",
        cancelError.message || 'Check your connection and try again.',
      );
    }
  };

  // Once the cancelled pass has folded away, take it off the list without a reload; the
  // passes below slide up into its place.
  const removeCancelledPass = transactionNumber => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const keep = group => group.transactionNumber !== transactionNumber;
    setAllOrders(prev => prev.filter(keep));
    setOrders(prev => prev.filter(keep));
    setCancelStatus(transactionNumber, null);
  };

  const renderSheet = () => {
    if (!sheet) {
      return null;
    }
    const {type, group} = sheet;
    return {
      ...passSheetText({
        type,
        group,
        vaulted: !!vaultedPaymentId,
        venmoUsername: maskUsername(vaultedPaymentUsername),
      }),
      confirmColor:
        type === 'cancel'
          ? PASS_COLORS.danger
          : vaultedPaymentId
            ? PASS_COLORS.venmo
            : PASS_COLORS.leaf,
      onConfirm: () =>
        type === 'cancel' ? handleCancelTransaction(group) : handlePayTransaction(group),
    };
  };

  // Pay or cancel confirmed on the order detail screen. Handlers are read from a ref so the
  // listener isn't re-subscribed on every render.
  const detailActionRef = useRef(null);
  detailActionRef.current = ({type, transactionNumber}) => {
    const group = orders.find(order => order.transactionNumber === transactionNumber);
    if (group) {
      type === 'cancel' ? handleCancelTransaction(group) : handlePayTransaction(group);
    }
  };
  useEffect(() => on(PAY_TO_BOARD_ACTION, action => detailActionRef.current(action)), []);

  // The order detail screen, for an order with more plants than the pass lists.
  const openOrderDetail = (group, status) =>
    navigation.navigate('PayToBoardOrderDetail', {
      group,
      status,
      vaulted: !!vaultedPaymentId,
      venmoUsername: maskUsername(vaultedPaymentUsername),
    });

  const sheetContent = renderSheet();
  const ordersTotal = orders.reduce((sum, group) => sum + orderTotalOf(group), 0);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      {loading ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 8, paddingHorizontal: 1, paddingBottom: totalBottomPadding}}>
          {Array.from({length: 3}).map((_, index) => (
            <OrderItemCardSkeleton key={`skeleton-${index}`} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 8, paddingBottom: totalBottomPadding}}
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
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PASS_COLORS.leaf]}
              tintColor={PASS_COLORS.leaf}
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

          {/* ponytail: the sum only covers loaded pages, so it shows once every order is loaded.
              Add a server-side total to the grouped API if buyers often have more than a page. */}
          {orders.length > 0 && !hasMore && (
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} waiting for payment
              </Text>
              <Text style={styles.summaryTotal}>${ordersTotal.toFixed(2)}</Text>
            </View>
          )}

          {orders.length === 0 && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nothing to pay right now</Text>
              <Text style={styles.emptySubtext}>
                Orders waiting for payment show up here before their flight.
              </Text>
            </View>
          ) : (
            orders.map((group, groupIndex) => {
              const transactionNumber = group.transactionNumber || group.orderId || `group-${groupIndex}`;
              // This order is waiting for the backend to confirm its payment: the stub shows
              // that instead of the Pay button, so the buyer cannot pay or cancel it twice.
              const awaitingConfirmation = isPaymentInProgress(paymentInProgress, transactionNumber);
              const status =
                cancelStatuses[transactionNumber] ||
                (awaitingConfirmation
                  ? 'confirming'
                  : payingTransaction === group.transactionNumber
                    ? 'paying'
                    : 'idle');

              return (
                <BoardingPass
                  key={transactionNumber}
                  originCodes={originCodesOf(group)}
                  flightDate={flightDateOf(group)}
                  plants={(group.plants || []).map(toPassPlant)}
                  total={orderTotalOf(group)}
                  transactionNumber={transactionNumber}
                  expanded={expandedTransactions.has(transactionNumber)}
                  onToggle={() => toggleTransaction(transactionNumber)}
                  status={status}
                  vaulted={!!vaultedPaymentId}
                  venmoUsername={maskUsername(vaultedPaymentUsername)}
                  onPay={() => setSheet({type: 'pay', group})}
                  onCancel={() => setSheet({type: 'cancel', group})}
                  onRemoved={() => removeCancelledPass(transactionNumber)}
                  onSeeAll={() => openOrderDetail(group, status)}
                />
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

        </ScrollView>
      )}

      {/* The sheet closes before the action runs; openPaymentSheet already waits out a
          dismissal animation before it presents, so the payment page opens cleanly. */}
      <PassConfirmSheet
        visible={!!sheetContent}
        {...sheetContent}
        onConfirm={() => {
          const confirm = sheetContent?.onConfirm;
          setSheet(null);
          confirm?.();
        }}
        onClose={() => setSheet(null)}
      />

      <Toast
        visible={!!toastMessage}
        message={toastMessage}
        onHide={() => setToastMessage(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASS_COLORS.screen,
  },
  summary: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: PASS_COLORS.slate,
    fontFamily: 'Inter',
  },
  summaryTotal: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
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

export default ScreenPayToBoard;
