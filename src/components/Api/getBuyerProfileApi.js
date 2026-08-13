import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getBuyerProfileApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.GET_BUYER_PROFILE,
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
    console.log('getBuyerProfileApi error:', error.message);
    throw error;
  }
};
