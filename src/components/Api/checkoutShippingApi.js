import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Calculate checkout shipping costs by calling backend API
 * This replaces the frontend shipping calculator
 * 
 * @param {Array} items - Array of plant items with listingType, quantity, price, etc.
 * @param {string} flightDate - Optional flight date to check if it's a succeeding order
 * @param {boolean} upsNextDay - Whether UPS Next Day upgrade is enabled
 * @param {number} userCredits - Total user credits (leaf points + plant credits + shipping credits)
 * @returns {Promise<Object>} Shipping calculation result
 */
export const calculateCheckoutShippingApi = async (items, flightDate = null, upsNextDay = false, userCredits = 0) => {
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
      body: JSON.stringify({ items, flightDate, upsNextDay, userCredits }),
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

