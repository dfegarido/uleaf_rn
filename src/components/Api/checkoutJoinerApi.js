import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Create a checkout order for joiners (users with approved receiver)
 * @param {Object} orderData - Order details
 * @param {string} orderData.cargoDate - Cargo date for the order (must match receiver's flight date)
 * @param {Array} orderData.productData - Array of products (if not using cart)
 * @param {Object} orderData.deliveryDetails - Delivery address and contact info (must be receiver's address)
 * @param {string} orderData.paymentMethod - Payment method (default: 'VENMO')
 * @param {number} orderData.leafPoints - Leaf points to apply
 * @param {number} orderData.plantCredits - Plant credits to apply
 * @param {number} orderData.shippingCredits - Shipping credits to apply
 * @param {boolean} orderData.useCart - Whether to use cart items instead of productData
 * @returns {Promise<Object>} Checkout response
 */
export const checkoutJoinerApi = async (orderData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    console.log('🛒 Initiating joiner checkout with data:', {
      ...orderData,
      deliveryDetails: orderData.deliveryDetails ? 'Present' : 'Missing'
    });
    
    const response = await fetch(
      API_ENDPOINTS.CHECKOUT_JOINER,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Joiner Checkout API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('✅ Joiner Checkout API success:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Joiner Checkout API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during joiner checkout',
    };
  }
};
