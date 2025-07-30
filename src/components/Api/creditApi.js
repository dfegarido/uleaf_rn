import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get credit transactions
 * @param {Object} params - Query parameters
 * @param {string} params.buyerId - Buyer ID filter
 * @param {string} params.type - Transaction type filter
 * @param {number} params.limit - Number of transactions to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise<Object>} Credit transactions response
 */
export const getCreditTransactionsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getCreditTransactions?${queryParams.toString()}`,
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
    console.error('Get credit transactions API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching credit transactions',
    };
  }
};

/**
 * Add credits to buyer account
 * @param {Object} creditData - Credit data
 * @param {string} creditData.buyerId - Buyer ID
 * @param {number} creditData.amount - Credit amount to add
 * @param {string} creditData.reason - Reason for credit addition
 * @param {string} creditData.referenceId - Optional reference ID
 * @returns {Promise<Object>} Add credits response
 */
export const addCreditsApi = async (creditData) => {
  try {
    if (!creditData || !creditData.buyerId || !creditData.amount) {
      throw new Error('Buyer ID and amount are required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/addCredits',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(creditData),
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
    console.error('Add credits API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while adding credits',
    };
  }
};

/**
 * Deduct credits from buyer account
 * @param {Object} deductData - Deduct data
 * @param {string} deductData.buyerId - Buyer ID
 * @param {number} deductData.amount - Credit amount to deduct
 * @param {string} deductData.reason - Reason for credit deduction
 * @param {string} deductData.referenceId - Optional reference ID
 * @returns {Promise<Object>} Deduct credits response
 */
export const deductCreditsApi = async (deductData) => {
  try {
    if (!deductData || !deductData.buyerId || !deductData.amount) {
      throw new Error('Buyer ID and amount are required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/deductCredits',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(deductData),
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
    console.error('Deduct credits API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while deducting credits',
    };
  }
};

/**
 * Get buyer credit balance
 * @param {string} buyerId - Buyer ID
 * @returns {Promise<Object>} Credit balance response
 */
export const getBuyerCreditBalanceApi = async (buyerId) => {
  try {
    if (!buyerId) {
      throw new Error('Buyer ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getBuyerCreditBalance?buyerId=${buyerId}`,
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
    console.error('Get buyer credit balance API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching credit balance',
    };
  }
};
