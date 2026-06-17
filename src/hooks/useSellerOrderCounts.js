import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../auth/AuthProvider';
import { getSellerOrderCounts } from '../components/Api/sellerOrderApi';

const DEFAULT_COUNTS = {
  forDelivery: 0,
  inventoryForHub: 0,
  receivedScanned: 0,
  receivedUnscanned: 0,
  missing: 0,
  casualty: 0,
  allOrders: 0,
};

const POLL_INTERVAL_MS = 60000;

/**
 * Seller order counts for tab badges and Orders screen sub-tabs.
 * `badgeCount` uses forDelivery — new sales awaiting seller action.
 */
export const useSellerOrderCounts = () => {
  const { userInfo } = useContext(AuthContext);
  const [ordersCount, setOrdersCount] = useState(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userInfo?.uid) {
      setOrdersCount(DEFAULT_COUNTS);
      setLoading(false);
      return;
    }

    try {
      const response = await getSellerOrderCounts();
      if (response?.success && response?.data) {
        setOrdersCount({ ...DEFAULT_COUNTS, ...response.data });
      }
    } catch (error) {
      console.error('useSellerOrderCounts refresh error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.uid]);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  const badgeCount = ordersCount.forDelivery || 0;

  return { ordersCount, badgeCount, loading, refresh };
};

/** Maps OrderScreen tab keys to getSellerOrderCounts response fields. */
export const getOrderTabCount = (ordersCount, tabKey) => {
  const keyMap = {
    allOrders: 'allOrders',
    forDelivery: 'forDelivery',
    inventoryForHub: 'inventoryForHub',
    receivedScanned: 'receivedScanned',
    receivedUnscanned: 'receivedUnscanned',
    missing: 'missing',
    damaged: 'casualty',
  };
  const field = keyMap[tabKey];
  return field ? ordersCount[field] || 0 : 0;
};
