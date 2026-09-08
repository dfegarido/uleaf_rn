import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getSellSpeciesApi = async genus => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();

    if (genus) params.append('genus', genus);
    const endpoint = `${API_ENDPOINTS.GET_SPECIES_FROM_PLANT_CATALOG}?${params.toString()}`;
    console.log('getSellSpeciesApi calling endpoint:', endpoint);

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
    console.log('getSellSpeciesApi error:', error.message);
    throw error;
  }
};
