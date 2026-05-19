import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Create a live stream request
 * @param {Object} data - Request data
 * @param {string} data.title - Live session title
 * @param {string} data.liveType - 'live' or 'purge'
 * @param {string} data.requestedDate - ISO date string
 * @param {string} data.description - Optional reason/description
 * @returns {Promise<Object>} Create response
 */
export const createLiveRequestApi = async (data) => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.CREATE_LIVE_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Create live request API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating live request',
    };
  }
};

/**
 * Get live requests for seller (own) or admin (all)
 * @param {Object} params - Query params
 * @param {string} params.status - Filter by status
 * @param {string} params.sellerUid - Filter by seller
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @param {number} params.limit - Pagination limit
 * @param {number} params.offset - Pagination offset
 * @returns {Promise<Object>} Get response
 */
export const getLiveRequestsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(`${API_ENDPOINTS.GET_LIVE_REQUESTS}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get live requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching live requests',
    };
  }
};

/**
 * Update live request status (approve/reject) - Admin only
 * @param {Object} data - Update data
 * @param {string} data.requestId - Request ID
 * @param {string} data.status - 'approved' or 'rejected'
 * @param {string} data.rejectionReason - Required when rejecting
 * @returns {Promise<Object>} Update response
 */
export const updateLiveRequestStatusApi = async (data) => {
  try {
    if (!data || !data.requestId || !data.status) {
      throw new Error('requestId and status are required');
    }

    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.UPDATE_LIVE_REQUEST_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Update live request status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating live request status',
    };
  }
};
