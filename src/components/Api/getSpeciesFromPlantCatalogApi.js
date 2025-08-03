import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getSpeciesFromPlantCatalogApi = async (genus) => {
  try {
    const token = await getStoredAuthToken();

    const queryParams = new URLSearchParams();
    if (genus) {
      queryParams.append('genus', genus);
    }

    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getSpeciesFromPlantCatalogDropdown?${queryParams.toString()}`,
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
