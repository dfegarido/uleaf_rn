import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postProfileUpdatePasswordApi = async (
  oldPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateBuyerPassword',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({oldPassword, newPassword, confirmPassword}),
      },
    );

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
