import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

// Password update stays on the Firebase functions base — it verifies the old
// password against Firebase Auth and updates the Firebase Auth credential
// (auth domain, intentionally not migrated to Supabase).
export const postProfileUpdatePasswordApi = async (
  oldPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.UPDATE_BUYER_PASSWORD, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({oldPassword, newPassword, confirmPassword}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postProfileUpdatePasswordApi error:', error.message);
    throw error;
  }
};