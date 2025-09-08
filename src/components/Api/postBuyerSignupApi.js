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
      // Pass through the complete error response for detailed handling
      const errorMessage = errorData.details 
        ? JSON.stringify(errorData) 
        : errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      
      throw new Error(errorMessage);
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
