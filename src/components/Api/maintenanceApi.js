import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Check if the app is under maintenance
 * @returns {Promise<Object>} Maintenance status response
 */
export const checkMaintenanceApi = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.CHECK_MAINTENANCE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('Check maintenance API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while checking maintenance status',
    };
  }
};

/**
 * Set maintenance mode (Admin only)
 * @param {boolean} enabled - Whether to enable maintenance mode
 * @param {string} message - Optional maintenance message
 * @returns {Promise<Object>} Response object
 */
export const setMaintenanceApi = async (enabled, message = 'The app is under maintenance. Please check back later.') => {
  try {
    const token = await getStoredAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(API_ENDPOINTS.SET_MAINTENANCE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        enabled,
        message,
      }),
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
    console.error('Set maintenance API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while setting maintenance status',
    };
  }
};

