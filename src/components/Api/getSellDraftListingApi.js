import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getSellDraftListingApi = async (limit, nextPageToken) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('nextPageToken', nextPageToken);

    const response = await fetch(
      `${API_ENDPOINTS.SEARCH_DRAFT_LISTINGS}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // use token from AsyncStorage
        },
      },
    );
    // console.log(response.json());
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getSellDraftListingApi error:', error.message);
    throw error;
  }
};
