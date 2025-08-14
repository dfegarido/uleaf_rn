import { API_ENDPOINTS } from '../../config/apiConfig';

export const postSellerPinCodeApi = async (idToken, pin) => {
  try {
    const response = await fetch(
      API_ENDPOINTS.VALIDATE_SIGN_IN_PIN,
      {
        method: 'POST', // or 'POST' if your function expects a body
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`, // Pass token in Authorization header
        },
        body: JSON.stringify({pin}), // pass both params here
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    // console.error('postSellerPinCodeApi error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
