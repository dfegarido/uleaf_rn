import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getGenusFromPlantCatalogApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getGenusFromPlantCatalogDropdown',
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
    console.log('getGenusFromPlantCatalogApi error:', error.message);
    throw error;
  }
};
