import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postBuyerUpdateInfoApi = async (
  firstName,
  lastName,
  countryCode,
  contactNumber,
) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.BUYER_UPDATE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        countryCode,
        contactNumber,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('postBuyerUpdateInfoApi error:', error.message);
    throw error;
  }
};