import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';
import { getCachedResponse, setCachedResponse } from '../../utils/apiResponseCache';

// Simple in-memory TTL cache to reduce duplicate GET requests across session
const __memCache = {
  store: new Map(),
  ttlMs: 60 * 1000, // 60s default for list endpoints
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  },
  set(key, value, ttlOverrideMs) {
    const ttl = typeof ttlOverrideMs === 'number' ? ttlOverrideMs : this.ttlMs;
    this.store.set(key, { value, expiry: Date.now() + ttl });
  }
};

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
    
    // Validate auth token before proceeding
    if (!authToken) {
      throw new Error('Authentication token not available');
    }
    
    console.log('🌱 getPlantRecommendations called with params:', params);
    
    // Build query string with better error handling
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        let value = params[key];
        
        try {
          // Handle arrays by joining with commas
          if (Array.isArray(value)) {
            value = value.filter(v => v !== null && v !== undefined && v !== '').join(',');
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
          
          // Only add non-empty values
          const stringValue = String(value);
          if (stringValue.trim() !== '') {
            queryParams.append(key, stringValue);
          }
        } catch (paramError) {
          console.warn('Error processing parameter', key, ':', paramError);
          // Skip problematic parameters instead of failing the entire request
        }
      }
    });
    const qs = queryParams.toString();
    
    console.log('🌱 Final query string:', qs);

  // Memory cache key per-user token + endpoint + query
    const cacheKey = `recs:${authToken?.slice?.(-12) || 'anon'}:${qs}`;
    const cached = __memCache.get(cacheKey);
    if (cached) {
      console.log('🌱 Returning cached recommendations');
      return cached;
    }

    // Try persistent cache (short TTL) as a fallback
    const userKey = authToken?.slice?.(-12) || 'anon';
    const persistent = await getCachedResponse('GET_PLANT_RECOMMENDATIONS', qs, userKey);
    if (persistent) {
      console.log('🌱 Returning persistent cached recommendations');
      return persistent;
    }

    console.log('🌱 Making API request to:', `${API_ENDPOINTS.GET_PLANT_RECOMMENDATIONS}?${qs}`);
    console.log('🌱 Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken?.slice?.(0, 20)}...` // Log partial token for debugging
    });

    // Verify the endpoint is properly constructed
    if (!API_ENDPOINTS.GET_PLANT_RECOMMENDATIONS) {
      throw new Error('GET_PLANT_RECOMMENDATIONS endpoint is not defined in API configuration');
    }

    const response = await fetch(
      `${API_ENDPOINTS.GET_PLANT_RECOMMENDATIONS}?${qs}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    console.log('🌱 API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🌱 API error response:', errorText);
      
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.warn('🌱 Could not parse error response as JSON');
      }
      
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status} - ${errorText}`,
      );
    }

  const data = await response.json();
  console.log('🌱 API response data:', { 
    success: true, 
    recommendationsCount: data?.recommendations?.length || 0 
  });
  
  const result = {
      success: true,
      data,
  };
  // Cache for a bit longer (2 minutes) as recommendations do not need to be real-time
  __memCache.set(cacheKey, result, 2 * 60 * 1000);
  await setCachedResponse('GET_PLANT_RECOMMENDATIONS', qs, userKey, result, 2 * 60 * 1000);
  return result;
  } catch (error) {
    console.error('🌱 Get plant recommendations API error:', error);
    console.error('🌱 Error details:', {
      message: error.message,
      stack: error.stack,
      params: params
    });
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
    
    // Set default limit to 20 if not specified
    const finalParams = {
      limit: 20,
      ...params
    };
    
    console.log("Input params to getBuyerListingsApi:", finalParams);
    
    const queryParams = new URLSearchParams();
    Object.keys(finalParams).forEach(key => {
      if (finalParams[key] !== undefined && finalParams[key] !== null) {
        let value = finalParams[key];
        
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
    const qs = queryParams.toString();
    console.log("API Query Params:", `${API_ENDPOINTS.GET_BUYER_LISTINGS}?${qs}`);

  // Memory cache key per-user token + endpoint + query
    const cacheKey = `buyerListings:${authToken?.slice?.(-12) || 'anon'}:${qs}`;
    const cached = __memCache.get(cacheKey);
  if (cached) return cached;

  // Try persistent cache next for very common queries (e.g., no filters)
  const userKey = authToken?.slice?.(-12) || 'anon';
  const persistent = await getCachedResponse('GET_BUYER_LISTINGS', qs, userKey);
  if (persistent) return persistent;

    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_LISTINGS}?${qs}`,
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
  const result = {
      success: true,
      data,
  };
  // Cache for 60s in memory; plus 2 minutes on disk for common revisits
  __memCache.set(cacheKey, result);
  await setCachedResponse('GET_BUYER_LISTINGS', qs, userKey, result, 2 * 60 * 1000);
  return result;
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
