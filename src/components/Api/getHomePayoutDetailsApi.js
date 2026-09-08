import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getHomePayoutDetailsApi = async workWeek => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.PAYOUT_DETAIL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({workWeek}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    // console.error('getHomePayoutDetailsApi error:', error.message);
    throw error;
  }
};