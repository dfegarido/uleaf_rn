import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getHomeSummaryApi = async () => {
  try {
    const token = await getStoredAuthToken();

    // Support either a function endpoint or a string endpoint
    const url = API_ENDPOINTS.GET_DASHBOARD_STATISTICS;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // use token from AsyncStorage
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getHomeSummaryApi error:', error.message);
    throw error;
  }
};
