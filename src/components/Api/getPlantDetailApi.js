import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const getPlantDetailApi = async (plantCode) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_LISTING}?plantCode=${plantCode}`,
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
    console.log('getPlantDetailApi error:', error.message);
    throw error;
  }
};

export const getPlantDetailApiLive = async (plantCode) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_LISTING_LIVE}?plantCode=${plantCode}`,
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
    console.error('getPlantDetailApiLive error:', error.message);
    throw error;
  }
};
