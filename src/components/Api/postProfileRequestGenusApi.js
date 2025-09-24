import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const postProfileRequestGenusApi = async (genus, species) => {
  try {
    const token = await getStoredAuthToken();

    const status = 'Inactive';
    const response = await fetch(
      API_ENDPOINTS.INSERT_GENUS_REQUEST,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({genus, species}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postProfileRequestGenusApi error:', error.message);
    throw error;
  }
};
