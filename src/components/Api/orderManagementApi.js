import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

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
      `https://us-central1-i-leaf-u.cloudfunctions.net/getBuyerOrders?${queryParams.toString()}`,
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
