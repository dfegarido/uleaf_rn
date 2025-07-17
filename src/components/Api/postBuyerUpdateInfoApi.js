import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postBuyerUpdateInfoApi = async (
  firstName,
  lastName,
  countryCode,
  contactNumber,
) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateBuyerInfo',
      {
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
      },
    );

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
