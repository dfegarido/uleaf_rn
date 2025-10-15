import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_CONFIG, API_ENDPOINTS} from '../../config/apiConfig';

export const getSellSpeciesApi = async genus => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();

    let endpoint;
    if (genus) params.append('genus', genus);
    endpoint = `${API_CONFIG.BASE_URL}/getSpeciesFromPlantCatalogDropdown?${params.toString()}`;
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
