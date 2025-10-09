/**
 * Using RapidAPI's World GeoData API with centralized configuration
 */

import { GEODATABASE_CONFIG } from '../../config/apiConfig';

// ============================================================================
// REQUEST CACHE & DEDUPLICATION
// ============================================================================

// Simple in-memory cache with TTL (5 minutes)
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map();

/**
 * Get cached response or return null if expired/not found
 */
const getCachedResponse = (cacheKey) => {
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Using cached response for: ${cacheKey}`);
    return cached.data;
  }
  return null;
};

/**
 * Store response in cache
 */
const setCachedResponse = (cacheKey, data) => {
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Deduplicate concurrent requests - if same request is in flight, wait for it
 */
const deduplicateRequest = async (cacheKey, requestFn) => {
  // Check if request is already in flight
  if (inFlightRequests.has(cacheKey)) {
    console.log(`⏳ Waiting for in-flight request: ${cacheKey}`);
    return await inFlightRequests.get(cacheKey);
  }

  // Execute request and track it
  const requestPromise = requestFn();
  inFlightRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up after request completes
    inFlightRequests.delete(cacheKey);
  }
};

// ============================================================================
// SIMPLE API FUNCTIONS (Most commonly used)
// ============================================================================

/**
 * Simple function to get US states using the centralized config with pagination support
 * @param {number} limit - Maximum number of states to return (default: 5)
 * @param {number} offset - Number of records to skip (default: 0)
 * @returns {Promise<Object>} US states data
 */
export const getUSStatesSimple = async (limit = 5, offset = 0) => {
  const cacheKey = `us_states_${limit}_${offset}`;
  
  // Check cache first
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;
  
  // Deduplicate concurrent requests
  return await deduplicateRequest(cacheKey, async () => {
    try {
      const url = GEODATABASE_CONFIG.ENDPOINTS.US_REGIONS(limit, offset);
      console.log(`🇺🇸 Fetching US states (limit: ${limit}, offset: ${offset}):`, url);
      
      const requestOptions = GEODATABASE_CONFIG.createRequestOptions();
      
      const response = await fetch(url, requestOptions);
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GeoDB API Error:', response.status, errorText);
        
        if (response.status === 429) {
          console.log('⏱️ Rate limited, please try again...');
          throw new Error('Rate limited - please try again in a moment');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ US states loaded: ${data.data?.length || 0} (total available: ${data.metadata?.totalCount || 'unknown'})`);
      
      const result = {
        success: true,
        states: data.data?.map(state => ({
          name: state.name,
          code: state.isoCode,
          id: state.id
        })) || [],
        hasMore: data.data && data.data.length === limit && (offset + data.data.length) < (data.metadata?.totalCount || 999),
        totalCount: data.metadata?.totalCount || 0
      };
      
      // Cache successful response
      setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Error loading US states:', error);
      return {
        success: false,
        error: error.message,
        states: [],
        hasMore: false,
        totalCount: 0
      };
    }
  });
};

/**
 * Simple function to get cities in a state using the general cities API with pagination support
 * @param {string} stateCode - State ISO code (e.g., 'CA', 'NY')
 * @param {number} limit - Maximum number of cities to return (default: 5)
 * @param {number} offset - Number of records to skip (default: 0)
 * @param {string} namePrefix - Optional name prefix to filter cities (default: '')
 * @returns {Promise<Object>} Cities data
 */
export const getStateCitiesSimple = async (stateCode, limit = 5, offset = 0, namePrefix = '') => {
  const cacheKey = `state_cities_${stateCode}_${limit}_${offset}_${namePrefix}`;
  
  // Check cache first
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log(`ℹ️ Server search for "${namePrefix}" served from cache (key: ${cacheKey})`);
    return cached;
  }
  console.log(`ℹ️ Server search triggered for state=${stateCode} prefix="${namePrefix}" (cache miss)`);
  
  // Deduplicate concurrent requests
  return await deduplicateRequest(cacheKey, async () => {
    try {
      // Use the specific region cities endpoint with optional namePrefix
      const url = GEODATABASE_CONFIG.ENDPOINTS.REGION_CITIES('US', stateCode, limit, offset, namePrefix);
      console.log(`🏙️ Fetching cities for ${stateCode} (limit: ${limit}, offset: ${offset}${namePrefix ? `, prefix: "${namePrefix}"` : ''}):`, url);
      
      const requestOptions = GEODATABASE_CONFIG.createRequestOptions();
      
      const response = await fetch(url, requestOptions);
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GeoDB API Error:', response.status, errorText);
        
        if (response.status === 429) {
          console.log('⏱️ Rate limited for cities');
          throw new Error('Rate limited - please try again in a moment');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Cities loaded for ${stateCode}: ${data.data?.length || 0} (total available: ${data.metadata?.totalCount || 'unknown'})`);
      
      const result = {
        success: true,
        cities: data.data?.map(city => ({
          name: city.name,
          id: city.id,
          state: city.region,
          stateCode: city.regionCode
        })) || [],
        hasMore: data.data && data.data.length === limit && (offset + data.data.length) < (data.metadata?.totalCount || 999),
        totalCount: data.metadata?.totalCount || 0
      };
      
      // Cache successful response
      setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`❌ Error loading cities for ${stateCode}:`, error);
      return {
        success: false,
        error: error.message,
        cities: [],
        hasMore: false,
        totalCount: 0
      };
    }
  });
};

/**
 * Get all US cities using the general cities API
 * @param {number} maxLimit - Maximum number of cities to return (default: 100)
 * @returns {Promise<Object>} Cities data
 */
export const getAllUSCitiesSimple = async (maxLimit = 100) => {
  const cacheKey = `all_us_cities_${maxLimit}`;
  
  // Check cache first
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;
  
  // Deduplicate concurrent requests
  return await deduplicateRequest(cacheKey, async () => {
    try {
      console.log('🏙️ Fetching all US cities...');
      
      let allCities = [];
      let offset = 0;
      const batchSize = 5; // Free plan limit
      let hasMore = true;
      
      while (hasMore && allCities.length < maxLimit) {
        const url = GEODATABASE_CONFIG.ENDPOINTS.ALL_CITIES(batchSize, offset, '', 'US');
        console.log(`📡 Fetching cities batch ${Math.floor(offset/batchSize) + 1}:`, url);
        
        const requestOptions = GEODATABASE_CONFIG.createRequestOptions();
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ GeoDB API Error:', response.status, errorText);
          
          if (response.status === 429) {
            console.log('⏱️ Rate limited, waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          allCities.push(...data.data);
          console.log(`✅ Loaded ${data.data.length} cities, total: ${allCities.length}`);
          
          hasMore = data.data.length === batchSize && allCities.length < (data.metadata?.totalCount || maxLimit);
          offset += batchSize;
          
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          hasMore = false;
        }
      }
      
      const result = {
        success: true,
        cities: allCities.map(city => ({
          name: city.name,
          id: city.id,
          state: city.region,
          stateCode: city.regionCode,
          country: city.country,
          countryCode: city.countryCode
        }))
      };
      
      // Cache successful response
      setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Error loading all US cities:', error);
      return {
        success: false,
        error: error.message,
        cities: []
      };
    }
  });
};

// ============================================================================
// ADVANCED API FUNCTIONS (For broader geographic functionality)
// ============================================================================

/**
 * Get countries list
 * @param {number} limit - Maximum number of countries to return (default: 10)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Countries data
 */
export const getCountriesApi = async (limit = 10, offset = 0) => {
  try {
    const url = `${GEODATABASE_CONFIG.ENDPOINTS.COUNTRIES()}?limit=${limit}&offset=${offset}`;
    console.log('🌍 Fetching countries from GeoDB:', url);

    const response = await fetch(url, GEODATABASE_CONFIG.createRequestOptions());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Countries data received:', result.data?.length || 0, 'countries');
    
    return {
      success: true,
      data: result.data || [],
      metadata: result.metadata || {},
      links: result.links || []
    };
  } catch (error) {
    console.error('❌ Get countries API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching countries',
      data: []
    };
  }
};

/**
 * Get regions for a specific country
 * @param {string} countryCode - ISO country code (e.g., 'US', 'CA')
 * @param {number} limit - Maximum number of regions to return (default: 10)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Regions data
 */
export const getCountryRegionsApi = async (countryCode, limit = 10, offset = 0) => {
  try {
    const url = GEODATABASE_CONFIG.ENDPOINTS.COUNTRY_REGIONS(countryCode, limit, offset);
    console.log('🏛️ Fetching regions from GeoDB:', url);

    const response = await fetch(url, GEODATABASE_CONFIG.createRequestOptions());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Regions data received:', result.data?.length || 0, 'regions for', countryCode);
    
    return {
      success: true,
      data: result.data || [],
      metadata: result.metadata || {},
      links: result.links || []
    };
  } catch (error) {
    console.error(`❌ Get regions API error for ${countryCode}:`, error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching regions',
      data: []
    };
  }
};

/**
 * Get cities for a specific region
 * @param {string} countryCode - ISO country code (e.g., 'US', 'CA')
 * @param {string} regionCode - Region code (e.g., 'CA' for California)
 * @param {number} limit - Maximum number of cities to return (default: 10)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Cities data
 */
export const getRegionCitiesApi = async (countryCode, regionCode, limit = 10, offset = 0) => {
  try {
    const url = GEODATABASE_CONFIG.ENDPOINTS.REGION_CITIES(countryCode, regionCode, limit, offset);
    console.log('🏙️ Fetching cities from GeoDB:', url);

    const response = await fetch(url, GEODATABASE_CONFIG.createRequestOptions());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Cities data received:', result.data?.length || 0, 'cities for', `${countryCode}/${regionCode}`);
    
    return {
      success: true,
      data: result.data || [],
      metadata: result.metadata || {},
      links: result.links || []
    };
  } catch (error) {
    console.error(`❌ Get cities API error for ${countryCode}/${regionCode}:`, error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching cities',
      data: []
    };
  }
};

/**
 * Search for places (cities, regions, countries) by name
 * @param {string} namePrefix - The name prefix to search for
 * @param {number} limit - Maximum number of results to return (default: 10)
 * @param {number} offset - Offset for pagination (default: 0)
 * @param {Array<string>} types - Types of places to search for (e.g., ['CITY', 'ADM1']) 
 * @returns {Promise<Object>} Search results
 */
export const searchPlacesApi = async (namePrefix, limit = 10, offset = 0, types = ['CITY']) => {
  try {
    const url = GEODATABASE_CONFIG.ENDPOINTS.SEARCH_PLACES(namePrefix, limit, offset, types);
    console.log('🔍 Searching places from GeoDB:', url);

    const response = await fetch(url, GEODATABASE_CONFIG.createRequestOptions());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Search results received:', result.data?.length || 0, 'places');
    
    return {
      success: true,
      data: result.data || [],
      metadata: result.metadata || {},
      links: result.links || []
    };
  } catch (error) {
    console.error('❌ Search places API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while searching places',
      data: []
    };
  }
};

// ============================================================================
// CONVENIENCE METHODS & UTILITIES
// ============================================================================

/**
 * Get US regions specifically (convenience method)
 * @param {number} limit - Maximum number of regions to return (default: 50)
 * @returns {Promise<Object>} US regions data
 */
export const getUSRegionsApi = async (limit = 50) => {
  return getCountryRegionsApi('US', limit, 0);
};

/**
 * Transform GeoDB region data to match your app's format
 * @param {Array} geoDbRegions - Raw GeoDB regions data
 * @returns {Array} Formatted regions for your app
 */
export const formatRegionsForApp = (geoDbRegions) => {
  return geoDbRegions.map(region => ({
    name: region.name,
    isoCode: region.isoCode,
    id: region.id || region.isoCode,
    countryCode: region.countryCode,
    fipsCode: region.fipsCode,
    wikiDataId: region.wikiDataId
  }));
};

/**
 * Transform GeoDB city data to match your app's format
 * @param {Array} geoDbCities - Raw GeoDB cities data
 * @returns {Array} Formatted cities for your app
 */
export const formatCitiesForApp = (geoDbCities) => {
  return geoDbCities.map(city => ({
    name: city.name,
    id: city.id,
    countryCode: city.countryCode,
    regionCode: city.regionCode,
    region: city.region,
    latitude: city.latitude,
    longitude: city.longitude,
    population: city.population
  }));
};

/**
 * Test GeoDB connection using the centralized config
 * @returns {Promise<Object>} Connection test result
 */
export const testGeoDBConnection = async () => {
  try {
    console.log('🧪 Testing GeoDB connection...');
    
    const requestOptions = GEODATABASE_CONFIG.createRequestOptions();
    
    const url = GEODATABASE_CONFIG.ENDPOINTS.US_REGIONS(5, 0);
    console.log('🔗 Test URL:', url);
    console.log('🔑 API Key (masked):', GEODATABASE_CONFIG.RAPIDAPI_KEY.substring(0, 10) + '...');
    
    const response = await fetch(url, requestOptions);
    
    console.log('📡 Test Response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Test failed:', response.status, errorText);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      status: response.status,
      message: 'Connection successful',
      sampleData: data.data?.slice(0, 2) || []
    };
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Example usage function that demonstrates the API
 */
export const exampleGeoDBUsage = async () => {
  console.log('📍 GeoDB API Example Usage');
  
  // Test connection
  const testResult = await testGeoDBConnection();
  if (!testResult.success) {
    console.error('Connection test failed:', testResult.error);
    return;
  }
  
  // Get US states
  const statesResult = await getUSStatesSimple(10);
  if (statesResult.success) {
    console.log('Sample states:', statesResult.states.slice(0, 3));
    
    // Get cities for the first state
    if (statesResult.states.length > 0) {
      const firstState = statesResult.states[0];
      const citiesResult = await getStateCitiesSimple(firstState.code, 5);
      
      if (citiesResult.success) {
        console.log(`Sample cities for ${firstState.name}:`, citiesResult.cities);
      }
    }
  }
};
