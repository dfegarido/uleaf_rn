import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getSellMostLove = async () => {
  try {
    const token = await getStoredAuthToken();
    const url = API_ENDPOINTS.GET_MOST_LOVE_LISTING;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getSellMostLove error:', error.message);
    throw error;
  }
};
