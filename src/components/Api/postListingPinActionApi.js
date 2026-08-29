import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postListingPinActionApi = async (plantCode, pinTag) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.PIN_LISTING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({plantCode, pinTag}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingPinActionApi error:', error.message);
    throw error;
  }
};
