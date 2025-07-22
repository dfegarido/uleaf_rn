import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postBuyerSignupApi = async signupData => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/buyerSignup',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
        },
        body: JSON.stringify(signupData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Buyer signup API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during signup',
    };
  }
};
