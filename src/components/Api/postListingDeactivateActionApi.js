import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postListingDeactivateActionApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();

    const status = 'Inactive';
    const response = await fetch(API_ENDPOINTS.UPDATE_LISTING_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({plantCodes, status}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingDeactivateActionApi error:', error.message);
    throw error;
  }
};
