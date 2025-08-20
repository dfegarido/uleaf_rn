import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get plant recommendations
 * @param {Object} params - Optional parameters
 * @param {string} params.plantCode - Plant code to base recommendations on (optional)
 * @param {number} params.limit - Number of recommendations to return (default: 20)
 * @returns {Promise<Object>} Recommendation results
 */
export const getPlantRecommendationsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    console.log({authToken})
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        let value = params[key];
        
        // Handle arrays by joining with commas
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        // Handle objects by converting to JSON string or extracting specific properties
        else if (typeof value === 'object') {
          // If it's an object, try to extract meaningful value or stringify
          if (value.value !== undefined) {
            value = value.value;
          } else if (value.label !== undefined) {
            value = value.label;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        queryParams.append(key, String(value));
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_PLANT_RECOMMENDATIONS}?${queryParams.toString()}`,
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
        let value = params[key];
        
        // Handle arrays by joining with commas
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        // Handle objects by converting to JSON string or extracting specific properties
        else if (typeof value === 'object') {
          // If it's an object, try to extract meaningful value or stringify
          if (value.value !== undefined) {
            value = value.value;
          } else if (value.label !== undefined) {
            value = value.label;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        queryParams.append(key, String(value));
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.SEARCH_LISTING}?${queryParams.toString()}`,
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
    
    console.log("Input params to getBuyerListingsApi:", params);
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        let value = params[key];
        
        // Handle arrays by joining with commas
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        // Handle objects by converting to JSON string or extracting specific properties
        else if (typeof value === 'object') {
          // If it's an object, try to extract meaningful value or stringify
          if (value.value !== undefined) {
            value = value.value;
          } else if (value.label !== undefined) {
            value = value.label;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        queryParams.append(key, String(value));
      }
    });
    console.log("API Query Params:", `${API_ENDPOINTS.GET_BUYER_LISTINGS}?${queryParams.toString()}`);
    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_LISTINGS}?${queryParams.toString()}`,
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
        let value = params[key];
        
        // Handle arrays by joining with commas
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        // Handle objects by converting to JSON string or extracting specific properties
        else if (typeof value === 'object') {
          // If it's an object, try to extract meaningful value or stringify
          if (value.value !== undefined) {
            value = value.value;
          } else if (value.label !== undefined) {
            value = value.label;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        queryParams.append(key, String(value));
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.BROWSE_PLANTS_BY_GENUS}?${queryParams.toString()}`,
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
        let value = params[key];
        
        // Handle arrays by joining with commas
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        // Handle objects by converting to JSON string or extracting specific properties
        else if (typeof value === 'object') {
          // If it's an object, try to extract meaningful value or stringify
          if (value.value !== undefined) {
            value = value.value;
          } else if (value.label !== undefined) {
            value = value.label;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        queryParams.append(key, String(value));
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.SEARCH_DRAFT_LISTINGS}?${queryParams.toString()}`,
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

/**
 * Search for plants using the new plant search API
 * @param {Object} params - Search parameters
 * @param {string} params.query - Plant name search query (required, min 2 characters)
 * @param {number} params.limit - Number of results (1-100, default: 20)
 * @param {number} params.offset - Pagination offset (default: 0)
 * @param {string} params.sortBy - Sort by: 'relevance', 'price', 'name', 'createdAt' (default: 'relevance')
 * @param {string} params.sortOrder - Sort order: 'asc', 'desc' (default: 'desc')
 * @param {string} params.genus - Filter by genus (comma-separated)
 * @param {string} params.variegation - Filter by variegation (comma-separated)
 * @param {string} params.listingType - Filter by listing type (comma-separated)
 * @param {number} params.minPrice - Minimum price filter
 * @param {number} params.maxPrice - Maximum price filter
 * @param {string} params.country - Filter by country/currency (comma-separated)
 * @returns {Promise<Object>} Search results with plant data
 */
export const searchPlantsApi = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        let value = params[key];
        
        // Handle arrays by joining with commas
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        // Handle objects by converting to JSON string or extracting specific properties
        else if (typeof value === 'object') {
          // If it's an object, try to extract meaningful value or stringify
          if (value.value !== undefined) {
            value = value.value;
          } else if (value.label !== undefined) {
            value = value.label;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        queryParams.append(key, String(value));
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.SEARCH_PLANTS}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Search plants API response:', data);

    return {
      success: true,
      data: data.data,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Search plants API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while searching plants',
    };
  }
};
