import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Calculate checkout shipping costs for joiners by calling backend API
 * This validates joiner status and uses receiver's locked flight date
 * 
 * @param {Array} items - Array of plant items with listingType, quantity, price, etc.
 * @param {string} flightDate - Receiver's flight date (locked for joiners)
 * @param {boolean} upsNextDay - Whether UPS Next Day upgrade is enabled
 * @param {number} userCredits - Total user credits (leaf points + plant credits + shipping credits)
 * @param {Object} freeShippingDiscount - Optional free shipping discount info { freeUpsShipping, freeAirCargo }
 * @returns {Promise<Object>} Shipping calculation result
 */
export const calculateCheckoutShippingJoinerApi = async (items, flightDate = null, upsNextDay = false, userCredits = 0, freeShippingDiscount = null) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!authToken) {
      throw new Error('Authentication token required for joiner shipping calculation');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
    
    const response = await fetch(API_ENDPOINTS.CALCULATE_CHECKOUT_SHIPPING_JOINER, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items, flightDate, upsNextDay, userCredits, freeShippingDiscount }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to calculate shipping for joiner');
    }

    return data;
  } catch (error) {
    console.error('Error calculating joiner checkout shipping:', error);
    throw error;
  }
};
