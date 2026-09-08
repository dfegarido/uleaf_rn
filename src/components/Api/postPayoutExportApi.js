import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postPayoutExportApi = async workWeek => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.PAYOUT_DETAIL_EXPORT, {
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

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('postPayoutExportApi error:', error.message);
    throw error;
  }
};