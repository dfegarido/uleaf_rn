import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get buyer content (Deals / Rewards / News carousels on the shop home).
 * @returns {Promise<{success: boolean, data: Object}>} items grouped-ready array
 */
export const getBuyerContentApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    const headers = {'Content-Type': 'application/json'};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(API_ENDPOINTS.GET_BUYER_CONTENT, {method: 'GET', headers});

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data: data.items || [],
    };
  } catch (error) {
    console.error('Get buyer content API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching buyer content',
      data: [],
    };
  }
};

/**
 * Get chat shops (horizontal "Chat Shops" cards on the shop home).
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getChatShopsApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    const headers = {'Content-Type': 'application/json'};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(API_ENDPOINTS.GET_CHAT_SHOPS, {method: 'GET', headers});

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data: data.shops || [],
    };
  } catch (error) {
    console.error('Get chat shops API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching chat shops',
      data: [],
    };
  }
};

/**
 * Get a single chat's metadata (shop screen opens a group chat by id).
 * @param {string} id - the chats/{docId} to fetch
 * @returns {Promise<{success: boolean, data: Object|null}>}
 */
export const getChatDetailApi = async (id) => {
  try {
    const authToken = await getStoredAuthToken();
    const headers = {'Content-Type': 'application/json'};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const qs = new URLSearchParams({id}).toString();
    const response = await fetch(`${API_ENDPOINTS.GET_CHAT_DETAIL}?${qs}`, {method: 'GET', headers});

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data: data.chat || null,
    };
  } catch (error) {
    console.error('Get chat detail API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching chat detail',
      data: null,
    };
  }
};
