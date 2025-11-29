import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_CONFIG, API_ENDPOINTS} from '../../config/apiConfig';

export const getSpeciesFromListingsApi = async () => {
  try {
    const token = await getStoredAuthToken();
    const endpoint = `${API_CONFIG.BASE_URL}/getSpeciesFromListings`;
    console.log('getSpeciesFromListingsApi calling endpoint:', endpoint);

    const response = await fetch(endpoint, {
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
    console.log('getSpeciesFromListingsApi error:', error.message);
    throw error;
  }
};

