import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get referral info (stats, recent referrals, available rewards)
 * @returns {Promise<Object>} Referral info response
 */
export const getReferralInfoApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    if (!authToken) {
      // During logout, token may be cleared - return gracefully instead of throwing
      // This prevents error spam when components are unmounting
      return {
        success: false,
        data: null,
        error: 'Authentication token not found',
      };
    }

    const response = await fetch(
      API_ENDPOINTS.REFERRAL_INFO,
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
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Get referral info API error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create referral
 * @param {Object} referralData - Referral data
 * @param {string} referralData.referrerId - Referrer user ID
 * @param {string} referralData.refereeEmail - Referee email address
 * @param {string} referralData.refereePhone - Referee phone number
 * @param {string} referralData.refereeUid - Referee UID
 * @returns {Promise<Object>} Create referral response
 */
export const createReferralApi = async (referralData) => {
  try {
    if (!referralData || !referralData.referrerId || (!referralData.refereeEmail && !referralData.refereePhone && !referralData.refereeUid)) {
      throw new Error('Referrer ID and referee (email, phone, or uid) are required');
    }

    const authToken = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.CREATE_REFERRAL,
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
