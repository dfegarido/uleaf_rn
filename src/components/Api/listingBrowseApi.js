import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Search listings with filters
 * @param {Object} params - Search parameters
 * @param {string} params.plant - Plant search term
 * @param {number} params.limit - Number of results to return
 * @param {string} params.nextPageToken - Token for pagination
 * @param {string} params.filterMine - Filter to own listings
 * @param {string} params.sortBy - Sort criteria
 * @param {string} params.genus - Genus filter (comma-separated)
 * @param {string} params.variegation - Variegation filter (comma-separated)
 * @param {string} params.listingType - Listing type filter (comma-separated)
 * @param {string} params.status - Status filter
 * @param {string} params.discount - Discount filter
 * @param {string} params.pinTag - Pin tag filter
 * @returns {Promise<Object>} Search results
 */
export const searchListingApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/searchListing?${queryParams.toString()}`,
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
    console.error('Search listing API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while searching listings',
    };
  }
};

/**
 * Get buyer listings (for buyers to browse)
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of listings to fetch
 * @param {string} params.nextPageToken - Token for pagination
 * @param {string} params.category - Category filter
 * @param {string} params.priceRange - Price range filter
 * @param {string} params.location - Location filter
 * @returns {Promise<Object>} Buyer listings response
 */
export const getBuyerListingsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getBuyerListings?${queryParams.toString()}`,
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
    console.error('Get buyer listings API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching buyer listings',
    };
  }
};

/**
 * Browse plants by genus
 * @param {Object} params - Browse parameters
 * @param {string} params.genus - Genus to browse
 * @param {number} params.limit - Number of results
 * @param {string} params.nextPageToken - Pagination token
 * @returns {Promise<Object>} Browse results
 */
export const browsePlantsByGenusApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/browsePlantsByGenus?${queryParams.toString()}`,
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
    console.error('Browse plants by genus API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while browsing plants',
    };
  }
};

/**
 * Get plant recommendations
 * @param {Object} params - Recommendation parameters
 * @param {number} params.limit - Number of recommendations
 * @param {string} params.category - Category for recommendations
 * @returns {Promise<Object>} Recommendations response
 */
export const getPlantRecommendationsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getPlantRecommendations?${queryParams.toString()}`,
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
    console.error('Get plant recommendations API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching recommendations',
    };
  }
};

/**
 * Search draft listings
 * @param {Object} params - Search parameters
 * @param {string} params.plant - Plant search term
 * @param {number} params.limit - Number of results
 * @param {string} params.nextPageToken - Pagination token
 * @returns {Promise<Object>} Draft listings response
 */
export const searchDraftListingsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/searchDraftListings?${queryParams.toString()}`,
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
    console.error('Search draft listings API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while searching draft listings',
    };
  }
};
