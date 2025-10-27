import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Calculate checkout shipping costs by calling backend API
 * This replaces the frontend shipping calculator
 * 
 * @param {Array} items - Array of plant items with listingType, quantity, price, etc.
 * @returns {Promise<Object>} Shipping calculation result
 */
export const calculateCheckoutShippingApi = async (items) => {
  try {
    const response = await fetch(API_ENDPOINTS.CALCULATE_CHECKOUT_SHIPPING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to calculate shipping');
    }

    return data;
  } catch (error) {
    console.error('Error calculating checkout shipping:', error);
    throw error;
  }
};

