import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getMyReceiverRequestApi = async () => {
  try {
    const token = await getStoredAuthToken();
    if (!token) {
      // During logout, token may be cleared - return gracefully instead of throwing
      // This prevents error spam when components are unmounting or effects are cleaning up
      console.log('getMyReceiverRequestApi: No token found, returning empty result (likely during logout)');
      return {
        success: false,
        data: null,
        message: 'Authentication token not found',
      };
    }

    const response = await fetch(API_ENDPOINTS.GET_MY_RECEIVER_REQUEST, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Only log error if it's not a missing token (which is expected during logout)
    if (!error.message?.includes('Authentication token not found')) {
      console.error('getMyReceiverRequestApi error:', error);
    }
    // Return graceful error response instead of throwing
    // This allows components to handle it without crashing
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch receiver request',
      error: error.message,
    };
  }
};

