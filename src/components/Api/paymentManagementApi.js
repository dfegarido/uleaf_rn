import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const getPendingPaymentOrdersApi = async (params) => {
  try {
    const token = await getStoredAuthToken();
    console.log('token', token);
    console.log('params', params);
    
    const response = await fetch(API_ENDPOINTS.GET_PENDING_PAYMENT_ORDERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data: params }),
    });
    const result = await response.json();
    return result.result || result;
  } catch (error) {
    console.error('Error in getPendingPaymentOrdersApi:', error);
    return { success: false, error: error.message };
  }
};

export const updateOrderToReadyToFlyApi = async (orderIds) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.UPDATE_ORDER_READY_TO_FLY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { orderIds } }),
    });
    const result = await response.json();
    return result.result || result;
  } catch (error) {
    console.error('Error in updateOrderToReadyToFlyApi:', error);
    return { success: false, error: error.message };
  }
};

export const deletePendingOrderApi = async (orderId) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.DELETE_PENDING_ORDER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { orderId } }),
    });
    const result = await response.json();
    return result.result || result;
  } catch (error) {
    console.error('Error in deletePendingOrderApi:', error);
    return { success: false, error: error.message };
  }
};
