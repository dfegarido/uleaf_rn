import NetInfo from '@react-native-community/netinfo';
import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import { useAuth } from '../../../auth/AuthProvider';
import { getBuyerOrdersApi } from '../../../components/Api/orderManagementApi';
import { JoinerOrderCard, OrderItemCard, OrderItemCardSkeleton } from '../../../components/OrderItemCard';
import { filterByPlantOwner, isNeedsToStay, getBuyerUid } from '../../../utils/buyerOrderFiltering';

const NEEDS_TO_STAY_LIMIT = 4;

const ScreenNeedsToStay = ({ plantOwnerFilter = null, onBuyersLoaded = null }) => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const tabBarHeight = 60;
  const safeBottomPadding = Math.max(insets.bottom, 8);
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 100;

  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);

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

      const limit = NEEDS_TO_STAY_LIMIT;
      const params = {
        status: 'Ready to Fly',
        includeDetails: true,
        limit,
        offset: append ? (page + 1) * limit : 0,
      };

      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      setHasMore(response.data?.data?.pagination?.hasMore || false);

      const plantsData = response.data?.data?.plants || [];

      const transformedOrders = plantsData.map(plant => transformPlantToComponentFormat(plant));

      if (onBuyersLoaded) {
        const buyersMap = new Map();
        transformedOrders.forEach(order => {
          const buyerUid = order.buyerUid || order._rawPlantRecord?.buyerUid || order.fullOrderData?.buyerUid;
          if (buyerUid && !buyersMap.has(buyerUid)) {
            let buyerInfo = null;
            if (order.isJoinerOrder && order.joinerInfo) {
              buyerInfo = {
                buyerUid,
                name: `${order.joinerInfo.firstName || ''} ${order.joinerInfo.lastName || ''}`.trim() || order.joinerInfo.username || 'Buyer',
                firstName: order.joinerInfo.firstName || '',
                lastName: order.joinerInfo.lastName || '',
                username: order.joinerInfo.username || '',
              };
            } else {
              const orderBuyerInfo = order.fullOrderData?.buyerInfo || order._rawPlantRecord?.order?.buyerInfo;
              buyerInfo = {
                buyerUid,
                name: orderBuyerInfo
                  ? `${orderBuyerInfo.firstName || ''} ${orderBuyerInfo.lastName || ''}`.trim() || user?.firstName || 'Buyer'
                  : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'You',
                firstName: orderBuyerInfo?.firstName || user?.firstName || '',
                lastName: orderBuyerInfo?.lastName || user?.lastName || '',
                username: orderBuyerInfo?.username || user?.username || '',
              };
            }
            if (buyerInfo?.name) buyersMap.set(buyerUid, buyerInfo);
          }
        });
        onBuyersLoaded(Array.from(buyersMap.values()));
      }

      if (append) {
        const updatedAll = [...allOrders, ...transformedOrders];
        setAllOrders(updatedAll);
        applyFilter(updatedAll, plantOwnerFilter);
        setPage(prev => prev + 1);
      } else {
        setAllOrders(transformedOrders);
        applyFilter(transformedOrders, plantOwnerFilter);
        setPage(0);
      }

    } catch (err) {
      console.error('Error loading Need to Stay orders:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const transformPlantToComponentFormat = (plant) => {
    const plantDetails = plant.plantDetails || {};
    const orderMeta = plant.order || {};

    const fullOrderLike = {
      ...orderMeta,
      products: [plant],
      plantDetails,
    };

    return {
      leafTrailHistory: orderMeta?.leafTrailHistory || {},
      status: orderMeta.status || 'Ready to Fly',
      leafTrailStatus: orderMeta.leafTrailStatus || plant.leafTrailStatus || '',
      airCargoDate: plant.flightDateFormatted || orderMeta.flightDateFormatted || plant.flightDate || 'TBD',
      countryCode: getCountryCode(plant),
      flag: getCountryFlag(plant),
      planeIcon: PlaneGrayIcon,
      image: plantDetails?.imageCollectionWebp?.[0]
        ? { uri: plantDetails.imageCollectionWebp[0] }
        : plantDetails?.image
          ? { uri: plantDetails.image }
          : plantDetails?.imageCollection?.[0]
            ? { uri: plantDetails.imageCollection[0] }
            : require('../../../assets/images/plant1.png'),
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
      isJoinerOrder: plant.isJoinerOrder || false,
      joinerInfo: plant.joinerInfo || null,
      buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
      _rawPlantRecord: plant,
    };
  };

  const getCountryCode = (record) => {
    if (!record) return 'ID';
    if (record.plantSourceCountry) return record.plantSourceCountry;
    if (record.order?.plantSourceCountry) return record.order.plantSourceCountry;
    if (record.products?.length > 0) return record.products[0].plantSourceCountry || 'ID';
    if (record.plantDetails?.plantSourceCountry) return record.plantDetails.plantSourceCountry;
    return 'ID';
  };

  const getCountryFlag = (order) => {
    const code = getCountryCode(order);
    const flagMap = {
      TH: ThailandFlag,
      PH: PhilippinesFlag,
      ID: IndonesiaFlag,
    };
    return flagMap[code] || IndonesiaFlag;
  };

  const applyFilter = useCallback((ordersToFilter, filter) => {
    const filtered = filterByPlantOwner(ordersToFilter, filter);

    const validated = filtered.filter(order => {
      const orderForValidation = {
        status: order.status || order._rawPlantRecord?.order?.status,
        leafTrailStatus: order._rawPlantRecord?.order?.leafTrailStatus || order._rawPlantRecord?.leafTrailStatus || order.leafTrailStatus,
      };
      return isNeedsToStay(orderForValidation);
    });

    setOrders(validated);
  }, []);

  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilter(allOrders, plantOwnerFilter);
    }
  }, [plantOwnerFilter, allOrders, applyFilter]);

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

  const formatHeldDate = (order) => {
    const heldDate =
      order.leafTrailHistory?.needsToStay?.hubNeedsToStayDate ||
      order._rawPlantRecord?.order?.hubNeedsToStay?.dateScanned ||
      order._rawPlantRecord?.hubNeedsToStay?.dateScanned;
    if (!heldDate) return null;
    try {
      return new Date(heldDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
      });
    } catch {
      return null;
    }
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 1, paddingBottom: totalBottomPadding }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderItemCardSkeleton key={`skeleton-${i}`} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 1, paddingBottom: totalBottomPadding }}
          scrollEventThrottle={400}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 600;
            if (isCloseToBottom && !loadingMore && !refreshing && hasMore) {
              handleLoadMore();
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

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              These plants are being held at the hub and will be sent on a future flight.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {orders.length === 0 && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No plants on hold</Text>
              <Text style={styles.emptySubtext}>
                Plants held at the hub for a later flight will appear here
              </Text>
            </View>
          ) : (
            orders.map((item, index) => {
              const heldDate = formatHeldDate(item);

              if (item.isJoinerOrder && item.joinerInfo) {
                return (
                  <View key={`joiner_nts_${item.plantCode}_${index}`}>
                    {heldDate && (
                      <View style={styles.heldBadge}>
                        <Text style={styles.heldBadgeText}>Held at hub since {heldDate}</Text>
                      </View>
                    )}
                    <JoinerOrderCard
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
                      activeTab="Need to Stay"
                      joinerInfo={item.joinerInfo}
                    />
                  </View>
                );
              }

              return (
                <View key={`nts_${item.plantCode}_${index}`}>
                  {heldDate && (
                    <View style={styles.heldBadge}>
                      <Text style={styles.heldBadgeText}>Held at hub since {heldDate}</Text>
                    </View>
                  )}
                  <OrderItemCard {...item} activeTab="Need to Stay" />
                </View>
              );
            })
          )}

          {loadingMore && (
            <View style={{ paddingHorizontal: 0, marginTop: 12 }}>
              {Array.from({ length: NEEDS_TO_STAY_LIMIT }).map((_, i) => (
                <OrderItemCardSkeleton key={`load-more-skel-${i}`} />
              ))}
            </View>
          )}
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
  infoBanner: {
    marginHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  heldBadge: {
    marginHorizontal: 15,
    marginBottom: 4,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  heldBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    fontFamily: 'Inter',
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

export default ScreenNeedsToStay;
