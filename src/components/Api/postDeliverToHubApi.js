import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postDeliverToHubApi = async (trxNumbers, deliveryStatus) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.UPDATE_ORDER_DELIVERY_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({trxNumbers, deliveryStatus}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postDeliverToHubApi error:', error.message);
    throw error;
  }
};
