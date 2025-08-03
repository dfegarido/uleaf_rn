import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get supplier profile
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} Supplier profile response
 */
export const getSupplierProfileApi = async (supplierId) => {
  try {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getSupplierProfile?supplierId=${supplierId}`,
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
    console.error('Get supplier profile API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching supplier profile',
    };
  }
};

/**
 * Get supplier listings
 * @param {string} supplierId - Supplier ID
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of listings to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @returns {Promise<Object>} Supplier listings response
 */
export const getSupplierListingsApi = async (supplierId, params = {}) => {
  try {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams({supplierId});
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getSupplierListings?${queryParams.toString()}`,
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
    console.error('Get supplier listings API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching supplier listings',
    };
  }
};

/**
 * Update supplier profile
 * @param {Object} supplierData - Supplier profile data to update
 * @returns {Promise<Object>} Update response
 */
export const updateSupplierProfileApi = async (supplierData) => {
  try {
    if (!supplierData) {
      throw new Error('Supplier data is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateSupplierProfile',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(supplierData),
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
    console.error('Update supplier profile API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating supplier profile',
    };
  }
};

/**
 * Follow supplier
 * @param {string} supplierId - Supplier ID to follow
 * @returns {Promise<Object>} Follow response
 */
export const followSupplierApi = async (supplierId) => {
  try {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/followSupplier',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({supplierId}),
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
    console.error('Follow supplier API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while following supplier',
    };
  }
};

/**
 * Unfollow supplier
 * @param {string} supplierId - Supplier ID to unfollow
 * @returns {Promise<Object>} Unfollow response
 */
export const unfollowSupplierApi = async (supplierId) => {
  try {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/unfollowSupplier',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({supplierId}),
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
    console.error('Unfollow supplier API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while unfollowing supplier',
    };
  }
};

/**
 * Add supplier
 * @param {Object} supplierData - New supplier data
 * @returns {Promise<Object>} Add supplier response
 */
export const addSupplierApi = async (supplierData) => {
  try {
    if (!supplierData) {
      throw new Error('Supplier data is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/addSupplier',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(supplierData),
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
    console.error('Add supplier API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while adding supplier',
    };
  }
};

/**
 * Approve supplier
 * @param {string} supplierId - Supplier ID to approve
 * @returns {Promise<Object>} Approval response
 */
export const approveSupplierApi = async (supplierId) => {
  try {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/approveSupplier',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({supplierId}),
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
    console.error('Approve supplier API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while approving supplier',
    };
  }
};
