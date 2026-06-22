import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get Journey Mishap Orders - Only Orders with Credit Requests
 * @param {Object} params - Query parameters
 * @param {string} params.status - Credit request status filter (optional)
 * @param {number} params.limit - Number of orders to fetch
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Object>} Journey mishap orders response
 */
export const getJourneyMishapOrdersApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_JOURNEY_MISHAP_ORDERS}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get journey mishap orders API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching journey mishap orders',
    };
  }
};

/**
 * Clear plant credits (admin action).
 * Pass transactionId + amount to clear a single credit, or omit to clear all.
 * @param {Object} clearData - Clear data
 * @param {string} clearData.buyerId - Buyer ID (required)
 * @param {string} clearData.reason - Reason for clearing credits (required)
 * @param {string} [clearData.transactionId] - Specific transaction to clear (optional)
 * @param {number} [clearData.amount] - Amount to clear for single transaction (optional)
 * @returns {Promise<Object>} Clear credits response
 */
export const clearCreditsApi = async (clearData) => {
  try {
    if (!clearData || !clearData.buyerId || !clearData.reason) {
      throw new Error('Buyer ID and reason are required');
    }

    const authToken = await getStoredAuthToken();

    const body = {
      buyerUid: clearData.buyerId,
      reason: clearData.reason,
      adminUid: clearData.adminUid,
    };

    // Single credit clear
    if (clearData.transactionId) {
      body.transactionId = clearData.transactionId;
      body.amount = clearData.amount ?? 0;
    }

    const response = await fetch(API_ENDPOINTS.CLEAR_CREDITS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Clear credits API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while clearing credits',
    };
  }
};

/**
 * Get Plants with Credit Requests for Journey Mishap
 * @param {Object} params - Query parameters
 * @param {string} params.orderId - Order ID (required)
 * @returns {Promise<Object>} Plants with credit requests response
 */
export const getPlantsWithCreditRequestsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!params.orderId) {
      throw new Error('orderId is required');
    }
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_PLANTS_WITH_CREDIT_REQUESTS}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get plants with credit requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plants with credit requests',
    };
  }
};
