import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Calculate checkout shipping costs by calling backend API
 * This replaces the frontend shipping calculator
 * 
 * @param {Array} items - Array of plant items with listingType, quantity, price, etc.
 * @param {string} flightDate - Optional flight date to check if it's a succeeding order
 * @returns {Promise<Object>} Shipping calculation result
 */
export const calculateCheckoutShippingApi = async (items, flightDate = null) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(API_ENDPOINTS.CALCULATE_CHECKOUT_SHIPPING, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items, flightDate }),
    });

    const data = await response.json();
    console.log('💰 Backend shipping calculation result:', data);
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to calculate shipping');
    }

    return data;
  } catch (error) {
    console.error('Error calculating checkout shipping:', error);
    throw error;
  }
};

