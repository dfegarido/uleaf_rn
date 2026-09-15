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

    // Prefer dedicated migrate endpoint; fall back if not deployed yet.
    let { response, payload } = await tryFetch(
      API_ENDPOINTS.ADMIN_MIGRATE_ORDERS,
      token,
      { action: 'listPayToBoardOrders', ...(params || {}) }
    );

    if (response.status === 404 || payload?.code === 'NOT_FOUND') {
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
