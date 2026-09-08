import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getSortApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.GET_SORT_DROPDOWN,
      {
        method: 'GET', // or 'POST' if your function expects a body
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Pass token in Authorization header
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getSortApi error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
