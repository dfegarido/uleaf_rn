import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const CREDIT_STATEMENT_QUERY_KEY = (buyerUid) => ['credit-statement', buyerUid];

export const CREDIT_MANAGEMENT_QUERY_KEY = ['credit-management'];

export const invalidateCreditStatementCache = (queryClient, buyerUid) => {
  if (queryClient?.invalidateQueries && buyerUid) {
    queryClient.invalidateQueries({ queryKey: CREDIT_STATEMENT_QUERY_KEY(buyerUid) });
  }
};

export const invalidateCreditManagementCache = (queryClient) => {
  if (queryClient?.invalidateQueries) {
    queryClient.invalidateQueries({ queryKey: CREDIT_MANAGEMENT_QUERY_KEY });
  }
};

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

    // Single credit clear: pass creditId (preferred) or legacy transactionId.
    if (clearData.creditId) {
      body.creditId = clearData.creditId;
    } else if (clearData.transactionId) {
      body.transactionId = clearData.transactionId;
      body.amount = clearData.amount ?? 0;
    }

    if (clearData.reasonType) {
      body.reasonType = clearData.reasonType;
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

/**
 * Get the plant credit wallet ledger for a buyer.
 * @param {Object} params - Query parameters
 * @param {string} params.buyerUid - Buyer UID (required)
 * @param {number} [params.limit=50] - Page size
 * @param {string} [params.startAfter] - Last document id for pagination
 * @param {string} [params.filterType] - Optional transactionType filter
 * @param {string} [params.filterReason] - Optional reasonType filter
 * @returns {Promise<Object>} Ledger response
 */
export const getPlantCreditLedgerApi = async (params = {}) => {
  try {
    if (!params.buyerUid) {
      throw new Error('buyerUid is required');
    }

    const authToken = await getStoredAuthToken();

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(
      `${API_ENDPOINTS.GET_PLANT_CREDIT_LEDGER}?${queryParams.toString()}`,
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
    console.error('Get plant credit ledger API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching the ledger',
    };
  }
};

/**
 * Get the complete buyer credit statement.
 * @param {Object} params - Query parameters
 * @param {string} params.buyerUid - Buyer UID (required)
 * @param {number} [params.limit] - Page size
 * @param {string} [params.startAfter] - Cursor doc id
 * @param {string} [params.sort] - 'desc' (default) or 'asc'
 * @returns {Promise<Object>} Statement response
 */
export const getBuyerCreditStatementApi = async (params = {}) => {
  try {
    if (!params.buyerUid) {
      throw new Error('buyerUid is required');
    }

    const authToken = await getStoredAuthToken();

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_CREDIT_STATEMENT}?${queryParams.toString()}`,
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
    console.error('Get buyer credit statement API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching the credit statement',
    };
  }
};

/**
 * Manually adjust a buyer's plant credit balance (admin action).
 * @param {Object} adjustData - Adjustment data
 * @param {string} adjustData.buyerUid - Buyer UID (required)
 * @param {number} adjustData.amount - Positive or negative amount (required)
 * @param {string} [adjustData.reasonType] - REASON_TYPES value
 * @param {string} [adjustData.reason] - Human-readable reason
 * @param {string} [adjustData.notes] - Admin notes
 * @param {string} [adjustData.adminUid] - Admin UID
 * @returns {Promise<Object>} Adjustment response
 */
export const manualAdjustCreditsApi = async (adjustData = {}) => {
  try {
    if (!adjustData.buyerUid || adjustData.amount === undefined || adjustData.amount === null) {
      throw new Error('buyerUid and amount are required');
    }

    const authToken = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.MANUAL_ADJUST_CREDITS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(adjustData),
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
    console.error('Manual adjust credits API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while adjusting credits',
    };
  }
};
