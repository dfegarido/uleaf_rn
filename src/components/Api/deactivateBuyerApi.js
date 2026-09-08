import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const deactivateBuyerApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.DEACTIVATE_BUYER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('deactivateBuyerApi error:', error.message);
    throw error;
  }
};