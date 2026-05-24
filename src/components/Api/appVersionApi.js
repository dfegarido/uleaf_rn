import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get minimum required app version
 * @returns {Promise<Object>} App version response
 */
export const getAppVersionApi = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.GET_APP_VERSION, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      if (response.status === 404) {
        console.warn(
          `[getAppVersion] 404 - Function not found. If using the Firebase emulator, restart it so it picks up the latest backend code.`,
        );
      }
      throw new Error(message);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get app version API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while checking app version',
    };
  }
};

/**
 * Set app version (Admin only)
 * @param {Object} versionData - Version data object
 * @returns {Promise<Object>} Response object
 */
export const setAppVersionApi = async (versionData) => {
  try {
    const token = await getStoredAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(API_ENDPOINTS.SET_APP_VERSION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(versionData),
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
    console.error('Set app version API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while setting app version',
    };
  }
};

