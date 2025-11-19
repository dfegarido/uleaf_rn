import { API_ENDPOINTS } from '../../config/apiConfig';

export const postSellerPinCodeApi = async (idToken, pin) => {
  try {
    const apiUrl = API_ENDPOINTS.VALIDATE_SIGN_IN_PIN;
    // Detect if it's local (localhost, 127.0.0.1, or local IP) vs production (cloudfunctions.net)
    const isLocal = apiUrl.includes('localhost') || 
                   apiUrl.includes('127.0.0.1') || 
                   apiUrl.includes('192.168.') || 
                   apiUrl.includes('10.0.') ||
                   (apiUrl.includes('5001') && !apiUrl.includes('cloudfunctions.net'));
    const isProduction = apiUrl.includes('cloudfunctions.net');
    
    console.log('🔐 OTP API Call:', {
      url: apiUrl,
      environment: isLocal ? 'LOCAL' : (isProduction ? 'PRODUCTION' : 'UNKNOWN'),
      endpoint: 'VALIDATE_SIGN_IN_PIN',
    });
    
    const response = await fetch(
      apiUrl,
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
