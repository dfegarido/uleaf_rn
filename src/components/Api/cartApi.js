import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Add item to cart
 * @param {Object} cartData - Cart item data
 * @param {string} cartData.plantCode - Plant code
 * @param {number} cartData.quantity - Quantity to add
 * @param {string} cartData.potSize - Pot size
 * @param {string} cartData.notes - Optional notes
 * @returns {Promise<Object>} API response
 */
export const addToCartApi = async (cartData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      API_ENDPOINTS.ADD_TO_CART,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(cartData),
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
    console.error('Add to cart API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while adding to cart',
    };
  }
};

/**
 * Get cart items
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of items to fetch
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Object>} Cart items response
 */
export const getCartItemsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `${API_ENDPOINTS.GET_CART_ITEMS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    
    // Debug logging for cart items API response
    console.log('🛒 GetCartItems API Response:');
    console.log('📊 Response Status:', response.status);
    console.log('📝 Raw Data:', JSON.stringify(data, null, 2));
    console.log('📋 Items Count:', data.items?.length || 0);
    
    if (data.items && data.items.length > 0) {
      console.log('🔍 First Item Details:', JSON.stringify(data.items[0], null, 2));
      console.log('🖼️ First Item Listing Details:', JSON.stringify(data.items[0].listingDetails, null, 2));
    }
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get cart items API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching cart items',
    };
  }
};

/**
 * Update cart item
 * @param {Object} updateData - Update data
 * @param {string} updateData.cartItemId - Cart item ID to update
 * @param {number} updateData.quantity - New quantity
 * @param {string} updateData.potSize - New pot size
 * @param {string} updateData.notes - Updated notes
 * @returns {Promise<Object>} Update response
 */
export const updateCartItemApi = async (updateData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      API_ENDPOINTS.UPDATE_CART_ITEM,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
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
    console.error('Update cart item API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating cart item',
    };
  }
};

/**
 * Remove item from cart
 * @param {Object} removeData - Remove data
 * @param {string} removeData.cartItemId - Cart item ID to remove
 * @returns {Promise<Object>} Remove response
 */
export const removeFromCartApi = async (removeData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      API_ENDPOINTS.REMOVE_FROM_CART,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(removeData),
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
    console.error('Remove from cart API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while removing from cart',
    };
  }
};
