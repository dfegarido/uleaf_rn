import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postListingUpdateStockActionApi = async (
  plantCode,
  potSize,
  availableQty,
) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.UPDATE_LISTING_VARIATION_QTY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({plantCode, potSize, availableQty}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingUpdateStockActionApi error:', error.message);
    throw error;
  }
};
