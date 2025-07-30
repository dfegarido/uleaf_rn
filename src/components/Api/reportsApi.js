import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get sales report
 * @param {Object} params - Report parameters
 * @param {string} params.startDate - Start date for report
 * @param {string} params.endDate - End date for report
 * @param {string} params.supplierId - Optional supplier ID filter
 * @param {string} params.groupBy - Group data by (day, week, month)
 * @returns {Promise<Object>} Sales report response
 */
export const getSalesReportApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getSalesReport?${queryParams.toString()}`,
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
    console.error('Get sales report API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching sales report',
    };
  }
};

/**
 * Get inventory report
 * @param {Object} params - Report parameters
 * @param {string} params.supplierId - Optional supplier ID filter
 * @param {string} params.status - Optional listing status filter
 * @param {string} params.plantGenus - Optional plant genus filter
 * @returns {Promise<Object>} Inventory report response
 */
export const getInventoryReportApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getInventoryReport?${queryParams.toString()}`,
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
    console.error('Get inventory report API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching inventory report',
    };
  }
};

/**
 * Get financial summary
 * @param {Object} params - Summary parameters
 * @param {string} params.startDate - Start date for summary
 * @param {string} params.endDate - End date for summary
 * @param {string} params.supplierId - Optional supplier ID filter
 * @returns {Promise<Object>} Financial summary response
 */
export const getFinancialSummaryApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getFinancialSummary?${queryParams.toString()}`,
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
    console.error('Get financial summary API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching financial summary',
    };
  }
};

/**
 * Get supplier performance report
 * @param {Object} params - Report parameters
 * @param {string} params.startDate - Start date for report
 * @param {string} params.endDate - End date for report
 * @param {number} params.limit - Number of suppliers to include
 * @param {string} params.sortBy - Sort criteria (sales, orders, rating)
 * @returns {Promise<Object>} Supplier performance report response
 */
export const getSupplierPerformanceReportApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getSupplierPerformanceReport?${queryParams.toString()}`,
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
    console.error('Get supplier performance report API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching supplier performance report',
    };
  }
};
