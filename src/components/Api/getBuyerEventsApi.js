import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Fetch buyer news & events (announcements etc.)
 * @param {Object} options
 * @param {number} [options.limit=10]
 * @param {string} [options.category='announcement']
 */
export const getBuyerEventsApi = async (options = {}) => {
  try {
    const {limit = 10, category = 'announcement'} = options;
    const token = await getStoredAuthToken();
    // If token is missing, fail fast with a clear message so callers can
    // differentiate auth issues from network issues.
    if (!token) {
      console.warn('getBuyerEventsApi: missing auth token');
      throw new Error('Not authenticated');
    }
    const url = API_ENDPOINTS.GET_NEWS_AND_EVENT(limit, category);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Type': 'buyer', // Add user type to differentiate content
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getBuyerEventsApi error:', error.message);
    throw error;
  }
};
