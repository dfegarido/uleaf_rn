import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getHomeBusinessPerformanceApi = async (interval, options = {}) => {
  try {
    const token = await getStoredAuthToken();
    const url = API_ENDPOINTS.GET_LISTING_REPORT;

    const body = { interval };
    if (options.debug) body.debug = true;

    if (options.debug) console.info('getHomeBusinessPerformanceApi: POST', url, body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // use token from AsyncStorage
      },

      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getHomeBusinessPerformanceApi error:', error.message);
    throw error;
  }
};
