import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

async function tryFetch(url, token, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  let result = {};
  try {
    result = await response.json();
  } catch {
    result = {};
  }
  return { response, payload: result.result || result };
}

function asError(response, payload) {
  return {
    success: false,
    error:
      payload.error ||
      payload.message ||
      `Request failed (${response.status})`,
  };
}

export const listPayToBoardOrdersApi = async (params) => {
  try {
    const token = await getStoredAuthToken();
    const hasBuyerFilter = !!(
      params?.buyerUid ||
      (Array.isArray(params?.buyerUids) && params.buyerUids.length > 0)
    );

    // Prefer dedicated migrate endpoint; fall back if not deployed yet.
    let { response, payload } = await tryFetch(
      API_ENDPOINTS.ADMIN_MIGRATE_ORDERS,
      token,
      { action: 'listPayToBoardOrders', ...(params || {}) }
    );

    // Only fall back when there is no buyer filter — payment-management may ignore buyerUids.
    if (
      !hasBuyerFilter &&
      (response.status === 404 || payload?.code === 'NOT_FOUND')
    ) {
      ({ response, payload } = await tryFetch(
        API_ENDPOINTS.GET_PENDING_PAYMENT_ORDERS,
        token,
        { action: 'getPendingPaymentOrders', ...(params || {}) }
      ));
    }

    if (!response.ok || payload.success === false) {
      return asError(response, payload);
    }
    return payload;
  } catch (error) {
    console.error('Error in listPayToBoardOrdersApi:', error);
    return { success: false, error: error.message };
  }
};

export const migratePayToBoardOrdersApi = async (orderIds) => {
  try {
    const token = await getStoredAuthToken();

    let { response, payload } = await tryFetch(
      API_ENDPOINTS.ADMIN_MIGRATE_ORDERS,
      token,
      { action: 'migratePayToBoardOrders', orderIds }
    );

    if (response.status === 404 || payload?.code === 'NOT_FOUND') {
      ({ response, payload } = await tryFetch(
        API_ENDPOINTS.UPDATE_ORDER_READY_TO_FLY,
        token,
        { action: 'updateOrderToReadyToFly', orderIds }
      ));
    }

    if (!response.ok || payload.success === false) {
      return asError(response, payload);
    }
    return payload;
  } catch (error) {
    console.error('Error in migratePayToBoardOrdersApi:', error);
    return { success: false, error: error.message };
  }
};

/** Clear (delete) Pay to Board pending orders so the buyer can check out again. */
export const clearPayToBoardOrdersApi = async (orderIds) => {
  try {
    const token = await getStoredAuthToken();

    let { response, payload } = await tryFetch(
      API_ENDPOINTS.ADMIN_MIGRATE_ORDERS,
      token,
      { action: 'clearPayToBoardOrders', orderIds }
    );

    // Fallback: clear one-by-one via payment-management delete if migrate edge is old.
    if (response.status === 404 || payload?.code === 'NOT_FOUND') {
      let cleared = 0;
      let lastError = null;
      for (const orderId of orderIds || []) {
        const single = await tryFetch(
          API_ENDPOINTS.DELETE_PENDING_ORDER,
          token,
          { action: 'deletePendingOrder', orderId }
        );
        if (single.response.ok && single.payload?.success !== false) {
          cleared += 1;
        } else {
          lastError = asError(single.response, single.payload);
        }
      }
      if (cleared > 0) {
        return {
          success: true,
          message: `${cleared} Pay to Board order(s) cleared. Buyer can check out again.`,
          clearedCount: cleared,
        };
      }
      return lastError || { success: false, error: 'Failed to clear orders' };
    }

    if (!response.ok || payload.success === false) {
      return asError(response, payload);
    }
    return payload;
  } catch (error) {
    console.error('Error in clearPayToBoardOrdersApi:', error);
    return { success: false, error: error.message };
  }
};
