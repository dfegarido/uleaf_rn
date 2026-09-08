import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getListingDetails = async plantCode => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('plantCode', plantCode);
    const url = `${API_ENDPOINTS.GET_LISTING}?${params.toString()}`;
    console.log(url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getListingDetails error:', error.message);
    throw error;
  }
};

/** Look up a listing by its document id (used for chat reply previews). */
export const getListingByIdApi = async (id) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('id', id);
    const url = `${API_ENDPOINTS.GET_LISTING}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getListingByIdApi error:', error.message);
    throw error;
  }
};
