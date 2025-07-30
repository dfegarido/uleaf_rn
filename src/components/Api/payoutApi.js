import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get payouts
 * @param {Object} params - Query parameters
 * @param {string} params.supplierId - Supplier ID filter
 * @param {string} params.status - Payout status filter
 * @param {number} params.limit - Number of payouts to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise<Object>} Payouts response
 */
export const getPayoutsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getPayouts?${queryParams.toString()}`,
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
    console.error('Get payouts API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching payouts',
    };
  }
};

/**
 * Create payout
 * @param {Object} payoutData - Payout data
 * @param {string} payoutData.supplierId - Supplier ID
 * @param {number} payoutData.amount - Payout amount
 * @param {string} payoutData.paymentMethod - Payment method
 * @param {string} payoutData.description - Payout description
 * @returns {Promise<Object>} Create payout response
 */
export const createPayoutApi = async (payoutData) => {
  try {
    if (!payoutData) {
      throw new Error('Payout data is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/createPayout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payoutData),
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
    console.error('Create payout API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating payout',
    };
  }
};

/**
 * Update payout status
 * @param {Object} updateData - Update data
 * @param {string} updateData.payoutId - Payout ID
 * @param {string} updateData.status - New status
 * @param {string} updateData.notes - Optional notes
 * @returns {Promise<Object>} Update response
 */
export const updatePayoutStatusApi = async (updateData) => {
  try {
    if (!updateData || !updateData.payoutId || !updateData.status) {
      throw new Error('Payout ID and status are required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updatePayoutStatus',
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
    console.error('Update payout status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating payout status',
    };
  }
};

/**
 * Get supplier balance
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} Supplier balance response
 */
export const getSupplierBalanceApi = async (supplierId) => {
  try {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getSupplierBalance?supplierId=${supplierId}`,
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
    console.error('Get supplier balance API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching supplier balance',
    };
  }
};
