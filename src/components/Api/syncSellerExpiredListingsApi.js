import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const syncSellerExpiredListingsApi = async () => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.SYNC_SELLER_EXPIRED_LISTINGS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('syncSellerExpiredListingsApi error:', error.message);
    throw error;
  }
};
