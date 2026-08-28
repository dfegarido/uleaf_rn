import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getHomePayoutListingApi = async nextPageToken => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('nextPageToken', nextPageToken ?? '');

    console.log(params.toString());

    const response = await fetch(
      `${API_ENDPOINTS.LIST_PAYOUT}?${params.toString()}`,
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
    // console.error('getHomePayoutListingApi error:', error.message);
    throw error;
  }
};
