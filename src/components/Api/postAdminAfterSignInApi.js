import { API_ENDPOINTS } from '../../config/apiConfig';

export const postAdminAfterSignInApi = async idToken => {
  try {
    const response = await fetch(
      API_ENDPOINTS.ADMIN_LOGIN,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
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
    console.log('postAdminAfterSignInApi error:', error.message);
    throw error;
  }
};
