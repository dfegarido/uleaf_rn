import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get orders with filters
 * @param {Object} params - Query parameters
 * @param {string} params.supplierId - Supplier ID filter
 * @param {string} params.status - Order status filter
 * @param {number} params.limit - Number of orders to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise<Object>} Orders response
 */
export const getOrdersApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getOrders?${queryParams.toString()}`,
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
    console.error('Get orders API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching orders',
    };
  }
};

/**
 * Get buyer orders
 * @param {Object} params - Query parameters
 * @param {string} params.status - Order status filter
 * @param {number} params.limit - Number of orders to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @returns {Promise<Object>} Buyer orders response
 */
export const getBuyerOrdersApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_ORDERS}?${queryParams.toString()}`,
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
    console.error('Get buyer orders API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching buyer orders',
    };
  }
};

/**
 * Get detailed information for a specific order
 * @param {Object} params - Query parameters
 * @param {string} params.orderId - Order ID (optional if transactionNumber provided)
 * @param {string} params.transactionNumber - Transaction number (optional if orderId provided)
 * @returns {Promise<Object>} Order detail response with comprehensive information and images
 */
export const getOrderDetailApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!params.orderId && !params.transactionNumber) {
      throw new Error('Either orderId or transactionNumber is required');
    }
    
    const queryParams = new URLSearchParams();
    if (params.orderId) {
      queryParams.append('orderId', params.orderId);
    }
    if (params.transactionNumber) {
      queryParams.append('transactionNumber', params.transactionNumber);
    }
    
    const url = `${API_ENDPOINTS.GET_ORDER_DETAIL}?${queryParams.toString()}`;
    console.log('getOrderDetailApi - Making request to:', url);
    console.log('getOrderDetailApi - With params:', params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('getOrderDetailApi - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('getOrderDetailApi - Error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('getOrderDetailApi - Success response:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get order detail API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching order details',
    };
  }
};

/**
 * Update delivery status by transaction number
 * @param {Object} updateData - Update data
 * @param {string} updateData.transactionNumber - Transaction number
 * @param {string} updateData.deliveryStatus - New delivery status
 * @param {string} updateData.notes - Optional notes
 * @returns {Promise<Object>} Update response
 */
export const updateDeliveryStatusApi = async (updateData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateDeliveryStatusByTrxNumber',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
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
    console.error('Update delivery status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating delivery status',
    };
  }
};

/**
 * Export delivery data
 * @param {Object} params - Export parameters
 * @param {string} params.startDate - Start date for export
 * @param {string} params.endDate - End date for export
 * @param {string} params.format - Export format (excel/csv)
 * @returns {Promise<Object>} Export response
 */
export const deliveryExportApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/deliveryExport?${queryParams.toString()}`,
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
    console.error('Delivery export API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while exporting delivery data',
    };
  }
};

/**
 * Generate Excel report
 * @param {Object} params - Excel generation parameters
 * @param {string} params.reportType - Type of report to generate
 * @param {string} params.startDate - Start date for report
 * @param {string} params.endDate - End date for report
 * @returns {Promise<Object>} Excel generation response
 */
export const excelGeneratorApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/excelGenerator?${queryParams.toString()}`,
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
    console.error('Excel generator API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while generating Excel report',
    };
  }
};

/**
 * Request credit for plant issues
 * @param {Object} params - Credit request parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.plantCode - Plant code
 * @param {string} params.issueType - Type of issue (Missing, Dead on Arrival, Damaged)
 * @param {string} params.description - Optional description of the issue
 * @param {Array} params.attachments - Optional attachments (images/videos)
 * @returns {Promise<Object>} Credit request response
 */
export const requestCreditApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    console.log('🔍 Requesting credit with params:', params);

    const response = await fetch(API_ENDPOINTS.REQUEST_CREDIT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('✅ Credit request successful:', data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Request credit API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while requesting credit',
    };
  }
};

/**
 * Get buyer credit requests
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.limit - Number of requests to fetch
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Object>} Credit requests response
 */
export const getBuyerCreditRequestsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_CREDIT_REQUESTS}?${queryParams.toString()}`,
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
    console.error('Get buyer credit requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching credit requests',
    };
  }
};

/**
 * Get credit request details
 * @param {Object} params - Query parameters
 * @param {string} params.requestId - Credit request ID
 * @returns {Promise<Object>} Credit request details response
 */
export const getCreditRequestDetailApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_CREDIT_REQUEST_DETAIL}?${queryParams.toString()}`,
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
    console.error('Get credit request detail API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching credit request details',
    };
  }
};
