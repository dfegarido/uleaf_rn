import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get referral data
 * @param {Object} params - Query parameters
 * @param {string} params.referrerId - Referrer ID filter
 * @param {string} params.status - Referral status filter
 * @param {number} params.limit - Number of referrals to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @returns {Promise<Object>} Referral data response
 */
export const getReferralDataApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getReferralData?${queryParams.toString()}`,
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
    console.error('Get referral data API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching referral data',
    };
  }
};

/**
 * Create referral
 * @param {Object} referralData - Referral data
 * @param {string} referralData.referrerId - Referrer user ID
 * @param {string} referralData.refereeEmail - Referee email address
 * @param {string} referralData.refereePhone - Referee phone number
 * @param {string} referralData.message - Optional referral message
 * @returns {Promise<Object>} Create referral response
 */
export const createReferralApi = async (referralData) => {
  try {
    if (!referralData || !referralData.referrerId || (!referralData.refereeEmail && !referralData.refereePhone)) {
      throw new Error('Referrer ID and referee contact information are required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/createReferral',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(referralData),
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
    console.error('Create referral API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating referral',
    };
  }
};

/**
 * Get referral rewards
 * @param {string} userId - User ID to get rewards for
 * @returns {Promise<Object>} Referral rewards response
 */
export const getReferralRewardsApi = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getReferralRewards?userId=${userId}`,
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
    console.error('Get referral rewards API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching referral rewards',
    };
  }
};

/**
 * Update referral status
 * @param {Object} updateData - Update data
 * @param {string} updateData.referralId - Referral ID
 * @param {string} updateData.status - New status
 * @param {string} updateData.notes - Optional notes
 * @returns {Promise<Object>} Update response
 */
export const updateReferralStatusApi = async (updateData) => {
  try {
    if (!updateData || !updateData.referralId || !updateData.status) {
      throw new Error('Referral ID and status are required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateReferralStatus',
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
    console.error('Update referral status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating referral status',
    };
  }
};
