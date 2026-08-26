import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getSpeciesFromPlantCatalogApi = async (genus) => {
  try {
    const token = await getStoredAuthToken();

    const queryParams = new URLSearchParams();
    if (genus) {
      queryParams.append('genus', genus);
    }

    const response = await fetch(
      `${API_ENDPOINTS.GET_SPECIES_FROM_PLANT_CATALOG}?${queryParams.toString()}`,
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
    console.log('getSpeciesFromPlantCatalogApi error:', error.message);
    throw error;
  }
};
