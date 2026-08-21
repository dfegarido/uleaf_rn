import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postProfileUpdateInfoApi = async (
  firstName,
  lastName,
  contactNumber,
  country,
  gardenOrCompanyName,
  profileImage,
) => {
  try {
    const token = await getStoredAuthToken();
    console.log(
      JSON.stringify({
        firstName,
        lastName,
        contactNumber,
        country,
        gardenOrCompanyName,
        profileImage,
      }),
    );

    const response = await fetch(
      API_ENDPOINTS.POST_SUPPLIER_UPDATE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          contactNumber,
          country,
          gardenOrCompanyName,
          profileImage,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postProfileUpdateInfoApi error:', error.message);
    throw error;
  }
};
