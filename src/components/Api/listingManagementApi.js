import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Add new listing
 * @param {Object} listingData - Listing data
 * @returns {Promise<Object>} API response
 */
export const addListingApi = async (listingData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/addListing',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(listingData),
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
    console.error('Add listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while adding listing',
    };
  }
};

/**
 * Update existing listing
 * @param {Object} listingData - Updated listing data
 * @returns {Promise<Object>} API response
 */
export const updateListingApi = async (listingData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateListing',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(listingData),
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
    console.error('Update listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating listing',
    };
  }
};

/**
 * Duplicate listing
 * @param {Object} duplicateData - Duplication data
 * @param {string} duplicateData.originalListingId - Original listing ID
 * @returns {Promise<Object>} API response
 */
export const duplicateListingApi = async (duplicateData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/duplicateListing',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(duplicateData),
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
    console.error('Duplicate listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while duplicating listing',
    };
  }
};

/**
 * Get specific listing
 * @param {Object} params - Query parameters
 * @param {string} params.listingId - Listing ID to fetch
 * @returns {Promise<Object>} Listing data
 */
export const getListingApi = async (params) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getListing?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
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
    console.error('Get listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching listing',
    };
  }
};

/**
 * Update listing status by plant code
 * @param {Object} statusData - Status update data
 * @param {string} statusData.plantCode - Plant code
 * @param {string} statusData.status - New status
 * @returns {Promise<Object>} API response
 */
export const updateListingStatusApi = async (statusData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateListingStatusByPlantCode',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(statusData),
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
    console.error('Update listing status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating listing status',
    };
  }
};

/**
 * Update listing discount by plant code
 * @param {Object} discountData - Discount update data
 * @param {string} discountData.plantCode - Plant code
 * @param {number} discountData.discountPercent - Discount percentage
 * @param {number} discountData.discountPrice - Discount price
 * @returns {Promise<Object>} API response
 */
export const updateListingDiscountApi = async (discountData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateListingDiscountByPlantCode',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(discountData),
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
    console.error('Update listing discount API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating listing discount',
    };
  }
};

/**
 * Remove listing discount by plant code
 * @param {Object} discountData - Discount removal data
 * @param {string} discountData.plantCode - Plant code
 * @returns {Promise<Object>} API response
 */
export const removeListingDiscountApi = async (discountData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/removeListingDiscountByPlantCode',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(discountData),
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
    console.error('Remove listing discount API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while removing listing discount',
    };
  }
};

/**
 * Pin listing
 * @param {Object} pinData - Pin data
 * @param {string} pinData.listingId - Listing ID to pin
 * @param {string} pinData.pinTag - Pin tag
 * @returns {Promise<Object>} API response
 */
export const pinListingApi = async (pinData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/pinListing',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(pinData),
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
    console.error('Pin listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while pinning listing',
    };
  }
};

/**
 * Get pin tags list
 * @returns {Promise<Object>} Pin tags response
 */
export const listPinTagApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/listPinTag',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
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
    console.error('List pin tag API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching pin tags',
    };
  }
};

/**
 * Publish on nursery drop
 * @param {Object} publishData - Publish data
 * @param {string} publishData.listingId - Listing ID to publish
 * @returns {Promise<Object>} API response
 */
export const publishOnNurseryDropApi = async (publishData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/publishOnNurseryDrop',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(publishData),
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
    console.error('Publish on nursery drop API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while publishing on nursery drop',
    };
  }
};

/**
 * Publish now
 * @param {Object} publishData - Publish data
 * @param {string} publishData.listingId - Listing ID to publish
 * @returns {Promise<Object>} API response
 */
export const publishNowApi = async (publishData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/publishNow',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(publishData),
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
    console.error('Publish now API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while publishing listing',
    };
  }
};

/**
 * Renew publish now
 * @param {Object} renewData - Renew data
 * @param {string} renewData.listingId - Listing ID to renew
 * @returns {Promise<Object>} API response
 */
export const renewPublishNowApi = async (renewData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/renewPublishNow',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(renewData),
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
    console.error('Renew publish now API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while renewing listing',
    };
  }
};

/**
 * Delete listing by plant code
 * @param {Object} deleteData - Delete data
 * @param {string} deleteData.plantCode - Plant code to delete
 * @returns {Promise<Object>} API response
 */
export const deleteListingApi = async (deleteData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/deleteListingByPlantCode',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(deleteData),
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
    console.error('Delete listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while deleting listing',
    };
  }
};
