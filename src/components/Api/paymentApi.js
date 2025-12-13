import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Create a PayPal payment intent
 * @param {Object} paymentData - Payment intent data
 * @param {string} paymentData.orderId - The Firestore order ID
 * @param {string} paymentData.returnUrl - URL to redirect after successful payment
 * @param {string} paymentData.cancelUrl - URL to redirect after cancelled payment
 * @param {boolean} paymentData.preferVenmo - Whether to prefer Venmo payment method
 * @returns {Promise<Object>} Payment intent response with approval URL
 */
export const createPaymentIntentApi = async (paymentData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/createPaymentIntent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(paymentData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Create payment intent API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating payment intent',
    };
  }
};

/**
 * Capture a PayPal payment after user approval
 * @param {Object} captureData - Capture payment data
 * @param {string} captureData.paypalOrderId - The PayPal order ID to capture
 * @returns {Promise<Object>} Payment capture response
 */
export const capturePaymentApi = async (captureData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/capturePayment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(captureData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Capture payment API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while capturing payment',
    };
  }
};

export const createAndCapturePaypalOrder = async (captureData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/createAndCapturePaypalOrder',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(captureData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'An error occurred while capturing payment',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('createAndCapturePaypalOrder API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while capturing payment',
    };
  }
};
