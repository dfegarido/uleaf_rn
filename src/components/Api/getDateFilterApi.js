import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getDateFilterApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.GET_DATE_PERIOD_DROPDOWN,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // use token from AsyncStorage
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
    console.log('getDateFilterApi error:', error.message);
    throw error;
  }
};
