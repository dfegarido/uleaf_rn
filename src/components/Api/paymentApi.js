import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';
import {reportClientError} from '../../utils/errorReporter';

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
  let gotResponse = false;
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
    gotResponse = true;

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
    const message = error.message || 'An error occurred while creating payment intent';
    // Only when fetch itself failed: the backend logs HTTP errors itself.
    if (!gotResponse) {
      reportClientError({
        location: 'paymentApi.createPaymentIntentApi',
        userMessage: message,
        detail: error.message,
        errorCode: 'NETWORK',
      });
    }
    return {
      success: false,
      error: message,
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
  let gotResponse = false;
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
    gotResponse = true;

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
    const message = error.message || 'An error occurred while capturing payment';
    // Only when fetch itself failed: the backend logs HTTP errors itself.
    if (!gotResponse) {
      reportClientError({
        location: 'paymentApi.capturePaymentApi',
        userMessage: message,
        detail: error.message,
        errorCode: 'NETWORK',
      });
    }
    return {
      success: false,
      error: message,
    };
  }
};

export const createAndCapturePaypalOrder = async (captureData) => {
  let gotResponse = false;
  try {
    const authToken = await getStoredAuthToken();
    
    // payment-completion charges the buyer's saved Venmo when vaultedPaymentId is present.
    const response = await fetch(
      API_ENDPOINTS.PAYMENT_COMPLETION,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(captureData),
      },
    );
    gotResponse = true;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || errorData.message || 'An error occurred while capturing payment',
        message: errorData.message,
        ref: errorData.ref,
        title: errorData.title,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('createAndCapturePaypalOrder API error:', error);
    const message = error.message || 'An error occurred while capturing payment';
    // Only when fetch itself failed: the backend logs HTTP errors itself.
    if (!gotResponse) {
      reportClientError({
        location: 'paymentApi.createAndCapturePaypalOrder',
        userMessage: message,
        detail: error.message,
        errorCode: 'NETWORK',
      });
    }
    return {
      success: false,
      error: message,
    };
  }
};
