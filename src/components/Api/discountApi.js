import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Create a new discount code
 * @param {Object} discountData - Discount code data
 * @param {string} discountData.code - Discount code
 * @param {string} discountData.type - Discount type: 'buyXGetY', 'amountOffPlantsPercentage', 'amountOffPlantsFixed', 'eventGift'
 * @param {number} [discountData.buyQuantity] - Buy quantity (for buyXGetY)
 * @param {number} [discountData.getQuantity] - Get quantity (for buyXGetY)
 * @param {number} [discountData.discountPercent] - Discount percentage
 * @param {number} [discountData.discountAmount] - Discount amount (fixed)
 * @param {number} [discountData.maxDiscount] - Maximum discount amount
 * @param {string} discountData.startDate - Start date (MM/DD/YYYY)
 * @param {string} discountData.startTime - Start time (HH:MM AM/PM)
 * @param {string} [discountData.endDate] - End date (MM/DD/YYYY)
 * @param {string} [discountData.endTime] - End time (HH:MM AM/PM)
 * @param {string} discountData.appliesText - Applies to: 'Specific listing type', 'Specific genus', 'Specific country', 'Specific garden', 'Specific listing'
 * @param {Array<string>} [discountData.selectedListingTypes] - Selected listing types
 * @param {Array<string>} [discountData.selectedGenus] - Selected genus
 * @param {Array<string>} [discountData.selectedCountries] - Selected countries
 * @param {Array<string>} [discountData.selectedGardens] - Selected gardens (with IDs)
 * @param {Array<string>} [discountData.selectedListings] - Selected listing IDs
 * @param {string} discountData.eligibility - Eligibility: 'All customers', 'VIP customers', 'Specific customers'
 * @param {string} discountData.minRequirement - Minimum requirement
 * @param {boolean} discountData.limitTotalEnabled - Limit total uses enabled
 * @param {boolean} discountData.limitPerCustomerEnabled - Limit per customer enabled
 * @param {number|string} [discountData.maxUsesTotal] - Maximum total uses
 * @param {Array<string>} [discountData.selectedBuyers] - Selected buyer IDs (for specific customers)
 * @returns {Promise<Object>} Response with created discount data
 */
export const createDiscountApi = async (discountData) => {
  try {
    const token = await getStoredAuthToken();

    // Transform data to match backend expectations
    const payload = {
      code: discountData.code,
      type: discountData.type,
      // Buy X Get Y specific fields
      ...(discountData.buyQuantity && { buyQuantity: discountData.buyQuantity }),
      ...(discountData.getQuantity && { getQuantity: discountData.getQuantity }),
      // Percentage/Fixed amount fields
      ...(discountData.discountPercent !== undefined && { discountPercent: discountData.discountPercent }),
      ...(discountData.discountAmount !== undefined && { discountAmount: discountData.discountAmount }),
      ...(discountData.maxDiscount !== undefined && { maxDiscount: discountData.maxDiscount }),
      // Free Shipping specific fields
      ...(discountData.type === 'freeShipping' && {
        freeUpsShipping: Boolean(discountData.freeUpsShipping),
        freeAirCargo: Boolean(discountData.freeAirCargo),
      }),
      // Date and time fields
      startDate: discountData.startDate,
      startTime: discountData.startTime,
      ...(discountData.endDate && { endDate: discountData.endDate }),
      ...(discountData.endTime && { endTime: discountData.endTime }),
      // Applies to fields
      appliesTo: discountData.appliesText,
      listingTypes: discountData.selectedListingTypes || [],
      genus: discountData.selectedGenus || [],
      countries: discountData.selectedCountries || [],
      gardens: discountData.selectedGardens?.map(g => typeof g === 'object' ? g.id : g) || [],
      listingIds: discountData.selectedListings || [],
      // Eligibility and requirements
      eligibility: discountData.eligibility,
      minRequirement: discountData.minRequirement,
      // Usage limits
      limitTotal: discountData.limitTotalEnabled,
      limitPerCustomer: discountData.limitPerCustomerEnabled,
      ...(discountData.maxUsesTotal && { maxUsesTotal: parseInt(discountData.maxUsesTotal, 10) }),
      // Buyer-specific
      ...(discountData.selectedBuyers && discountData.selectedBuyers.length > 0 && {
        buyerIds: discountData.selectedBuyers
      }),
    };

    console.log('Creating discount with payload:', JSON.stringify(payload, null, 2));

    // Use API_ENDPOINTS if available, otherwise use direct URL
    // NOTE: The backend endpoint must be created as: createDiscount
    // If your backend uses a different endpoint name, update it here or in apiConfig.js
    let endpoint = API_ENDPOINTS?.CREATE_DISCOUNT;
    if (!endpoint) {
      // Fallback to constructing URL manually
      const baseUrl = API_ENDPOINTS?.GET_ADMIN_LISTINGS?.replace('/getAdminListings', '') || 
        'https://us-central1-i-leaf-u.cloudfunctions.net';
      endpoint = `${baseUrl}/createDiscount`;
    }
    
    console.log('Calling endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint: endpoint
      });
      
      // Provide helpful error message for 404
      if (response.status === 404) {
        throw new Error(`Backend endpoint not found. Please create the 'createDiscount' Firebase Cloud Function. Endpoint: ${endpoint}`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('createDiscountApi error:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred while creating the discount',
    };
  }
};

/**
 * Update an existing discount code
 * @param {string} discountId - Discount ID
 * @param {Object} discountData - Discount code data (same structure as createDiscountApi)
 * @returns {Promise<Object>} Response with updated discount data
 */
export const updateDiscountApi = async (discountId, discountData) => {
  try {
    const token = await getStoredAuthToken();

    // Transform data to match backend expectations (same as create)
    const payload = {
      code: discountData.code,
      type: discountData.type,
      ...(discountData.buyQuantity && { buyQuantity: discountData.buyQuantity }),
      ...(discountData.getQuantity && { getQuantity: discountData.getQuantity }),
      ...(discountData.discountPercent !== undefined && { discountPercent: discountData.discountPercent }),
      ...(discountData.discountAmount !== undefined && { discountAmount: discountData.discountAmount }),
      ...(discountData.maxDiscount !== undefined && { maxDiscount: discountData.maxDiscount }),
      // Free Shipping specific fields
      ...(discountData.type === 'freeShipping' && {
        freeUpsShipping: Boolean(discountData.freeUpsShipping),
        freeAirCargo: Boolean(discountData.freeAirCargo),
      }),
      startDate: discountData.startDate,
      startTime: discountData.startTime,
      ...(discountData.endDate && { endDate: discountData.endDate }),
      ...(discountData.endTime && { endTime: discountData.endTime }),
      appliesTo: discountData.appliesText,
      listingTypes: discountData.selectedListingTypes || [],
      genus: discountData.selectedGenus || [],
      countries: discountData.selectedCountries || [],
      gardens: discountData.selectedGardens?.map(g => typeof g === 'object' ? g.id : g) || [],
      listingIds: discountData.selectedListings || [],
      eligibility: discountData.eligibility,
      minRequirement: discountData.minRequirement,
      limitTotal: discountData.limitTotalEnabled,
      limitPerCustomer: discountData.limitPerCustomerEnabled,
      // Only include maxUsesTotal if it has a valid value
      // For updates, if not provided, backend will preserve existing value
      ...(discountData.maxUsesTotal !== undefined && discountData.maxUsesTotal !== null && discountData.maxUsesTotal !== '' && { 
        maxUsesTotal: parseInt(discountData.maxUsesTotal, 10) 
      }),
      ...(discountData.selectedBuyers && discountData.selectedBuyers.length > 0 && {
        buyerIds: discountData.selectedBuyers
      }),
    };

    console.log('Updating discount with payload:', JSON.stringify(payload, null, 2));

    let endpoint = API_ENDPOINTS?.UPDATE_DISCOUNT;
    
    // If endpoint exists and has :id placeholder, replace it
    if (endpoint && endpoint.includes(':id')) {
      endpoint = endpoint.replace(':id', discountId);
    } else if (endpoint) {
      // If endpoint exists but no placeholder, append the ID
      endpoint = `${endpoint}/${discountId}`;
    } else {
      // Fallback to constructing URL manually
      const baseUrl = API_ENDPOINTS?.GET_ADMIN_LISTINGS?.replace('/getAdminListings', '') || 
        'https://us-central1-i-leaf-u.cloudfunctions.net';
      endpoint = `${baseUrl}/updateDiscount/${discountId}`;
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('updateDiscountApi error:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred while updating the discount',
    };
  }
};

/**
 * Get all discount codes
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status ('Active', 'Scheduled', 'Expired')
 * @param {number} [options.limit] - Limit number of results (default: 100)
 * @param {number} [options.offset] - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Response with discounts array
 */
export const getDiscountsApi = async (options = {}) => {
  try {
    const token = await getStoredAuthToken();

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.status) queryParams.append('status', options.status);
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.offset) queryParams.append('offset', options.offset.toString());

    let endpoint = API_ENDPOINTS?.GET_DISCOUNTS;
    if (!endpoint) {
      // Fallback to constructing URL manually
      const baseUrl = API_ENDPOINTS?.GET_ADMIN_LISTINGS?.replace('/getAdminListings', '') || 
        'https://us-central1-i-leaf-u.cloudfunctions.net';
      endpoint = `${baseUrl}/getDiscounts`;
    }

    // Append query string if there are params
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    console.log('Calling getDiscounts endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
      count: data.count || 0,
    };
  } catch (error) {
    console.error('getDiscountsApi error:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching discounts',
      data: [],
    };
  }
};

/**
 * Validate and calculate discount for a discount code
 * @param {string} code - Discount code to validate
 * @param {Array} cartItems - Array of cart items with plantCode, quantity, price, listingType, country, genus, etc.
 * @param {string} [buyerId] - Optional buyer ID for eligibility checks
 * @returns {Promise<Object>} Response with discount amount and details
 */
export const validateDiscountCodeApi = async (code, cartItems, buyerId) => {
  try {
    const token = await getStoredAuthToken();

    if (!code || !code.trim()) {
      return {
        success: false,
        error: 'Discount code is required',
      };
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return {
        success: false,
        error: 'Cart items are required',
      };
    }

    const payload = {
      code: code.trim().toUpperCase(),
      cartItems: cartItems.map(item => ({
        plantCode: item.plantCode,
        quantity: item.quantity || 1,
        price: item.price || item.unitPrice || 0,
        listingType: item.listingType,
        country: item.country || item.plantSourceCountry,
        genus: item.genus,
        sellerCode: item.sellerCode,
      })),
      ...(buyerId && { buyerId }),
    };

    console.log('💳 [validateDiscountCodeApi] Validating discount code:', code);
    console.log('💳 [validateDiscountCodeApi] Payload:', JSON.stringify(payload, null, 2));

    // Debug: Check if API_ENDPOINTS has the validate endpoint
    console.log('💳 [validateDiscountCodeApi] API_ENDPOINTS.VALIDATE_DISCOUNT_CODE:', API_ENDPOINTS?.VALIDATE_DISCOUNT_CODE);
    console.log('💳 [validateDiscountCodeApi] API_ENDPOINTS keys:', Object.keys(API_ENDPOINTS || {}).filter(k => k.includes('DISCOUNT')));

    let endpoint = API_ENDPOINTS?.VALIDATE_DISCOUNT_CODE;
    if (!endpoint) {
      console.warn('⚠️ [validateDiscountCodeApi] VALIDATE_DISCOUNT_CODE not found in API_ENDPOINTS, using fallback');
      // Fallback to constructing URL manually
      const baseUrl = API_ENDPOINTS?.GET_ADMIN_LISTINGS?.replace('/getAdminListings', '') ||
        'https://us-central1-i-leaf-u.cloudfunctions.net';
      endpoint = `${baseUrl}/validateDiscountCode`;
    }

    console.log('💳 [validateDiscountCodeApi] Calling endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('💳 [validateDiscountCodeApi] Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      
      console.error('💳 [validateDiscountCodeApi] Error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        endpoint,
      });

      // Log debug info if available
      if (errorData.debug) {
        console.error('💳 [validateDiscountCodeApi] Debug info:', {
          appliesTo: errorData.debug.appliesTo,
          cartItemsCount: errorData.debug.cartItemsCount,
          discountCriteria: errorData.debug.discountCriteria,
          cartItems: errorData.debug.cartItems,
        });
      }
      
      // Provide helpful error message for 404 ONLY if there's no error data
      // If errorData exists, it means the endpoint is working but returned a validation error
      if (response.status === 404 && !errorData.error) {
        return {
          success: false,
          error: `Discount validation endpoint not found. Please deploy the 'validateDiscountCode' Firebase Cloud Function. Endpoint: ${endpoint}`,
        };
      }
      
      // Include debug info in error message for better debugging
      let enhancedErrorMessage = errorMessage;
      if (errorData.debug && errorData.error === 'No eligible items in cart for this discount code') {
        enhancedErrorMessage = `${errorMessage}\n\nDebug Info:\n- Applies To: ${errorData.debug.appliesTo}\n- Discount Criteria: ${JSON.stringify(errorData.debug.discountCriteria, null, 2)}\n- Cart Items: ${JSON.stringify(errorData.debug.cartItems, null, 2)}`;
      }
      
      return {
        success: false,
        error: enhancedErrorMessage,
        debug: errorData.debug,
      };
    }

    const data = await response.json();
    console.log('💳 [validateDiscountCodeApi] Success response:', JSON.stringify(data, null, 2));
    
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('validateDiscountCodeApi error:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred while validating the discount code',
    };
  }
};

/**
 * Get a single discount code by ID
 * @param {string} discountId - Discount ID
 * @returns {Promise<Object>} Response with discount data
 */
export const getDiscountApi = async (discountId) => {
  try {
    const token = await getStoredAuthToken();

    if (!discountId) {
      return {
        success: false,
        error: 'Discount ID is required',
      };
    }

    let endpoint = API_ENDPOINTS?.GET_DISCOUNT;
    
    // If endpoint exists and has :id placeholder, replace it
    if (endpoint && endpoint.includes(':id')) {
      endpoint = endpoint.replace(':id', discountId);
    } else if (endpoint) {
      // If endpoint exists but no placeholder, append the ID
      endpoint = `${endpoint}/${discountId}`;
    } else {
      // Fallback to constructing URL manually
      const baseUrl = API_ENDPOINTS?.GET_ADMIN_LISTINGS?.replace('/getAdminListings', '') || 
        'https://us-central1-i-leaf-u.cloudfunctions.net';
      endpoint = `${baseUrl}/getDiscount/${discountId}`;
    }

    console.log('Calling getDiscount endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('getDiscountApi error:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching the discount',
    };
  }
};

/**
 * Delete a discount code
 * @param {string} discountId - Discount ID
 * @returns {Promise<Object>} Response with deletion result
 */
export const deleteDiscountApi = async (discountId) => {
  try {
    const token = await getStoredAuthToken();

    let endpoint = API_ENDPOINTS?.DELETE_DISCOUNT;
    
    // If endpoint exists and has :id placeholder, replace it
    if (endpoint && endpoint.includes(':id')) {
      endpoint = endpoint.replace(':id', discountId);
    } else if (endpoint) {
      // If endpoint exists but no placeholder, append the ID
      endpoint = `${endpoint}/${discountId}`;
    } else {
      // Fallback to constructing URL manually
      const baseUrl = API_ENDPOINTS?.GET_ADMIN_LISTINGS?.replace('/getAdminListings', '') || 
        'https://us-central1-i-leaf-u.cloudfunctions.net';
      endpoint = `${baseUrl}/deleteDiscount/${discountId}`;
    }

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('deleteDiscountApi error:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred while deleting the discount',
    };
  }
};
