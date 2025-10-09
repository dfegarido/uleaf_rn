import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postListingDeleteApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('plantCode', plantCodes);

    const deleteUrl = `${API_ENDPOINTS.DELETE_LISTING}?${params.toString()}`;

    const response = await fetch(
      deleteUrl,
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

    return await response.json();
  } catch (error) {
    console.log('postListingDeleteApi error:', error.message);
    throw error;
  }
};
