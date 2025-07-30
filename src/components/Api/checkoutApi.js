import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Create a checkout order
 * @param {Object} orderData - Order details
 * @param {string} orderData.cargoDate - Cargo date for the order
 * @param {Array} orderData.productData - Array of products (if not using cart)
 * @param {Object} orderData.deliveryDetails - Delivery address and contact info
 * @param {string} orderData.paymentMethod - Payment method (default: 'VENMO')
 * @param {number} orderData.leafPoints - Leaf points to apply
 * @param {number} orderData.plantCredits - Plant credits to apply
 * @param {number} orderData.shippingCredits - Shipping credits to apply
 * @param {boolean} orderData.useCart - Whether to use cart items instead of productData
 * @returns {Promise<Object>} Checkout response
 */
export const checkoutApi = async (orderData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/checkout',
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
    console.error('Checkout API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during checkout',
    };
  }
};
