import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postListingApplyDiscountActionApi = async (
  plantCodes,
  discountPrice,
  discountPercent,
) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.UPDATE_LISTING_DISCOUNT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({plantCodes, discountPrice, discountPercent}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingApplyDiscountActionApi error:', error.message);
    throw error;
  }
};
