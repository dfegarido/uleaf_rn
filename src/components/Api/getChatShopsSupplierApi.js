import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Get supplier chat shops for the seller home screen.
 * Returns shops the current seller is a member of (via group-chat membership).
 * @returns {Promise<Object>} { success, shops: [...] }
 */
export const getChatShopsSupplierApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.GET_CHAT_SHOPS_SUPPLIER,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getChatShopsSupplierApi error:', error.message);
    throw error;
  }
};
