/**
 * API function to get cities by state from backend (with caching)
 * Uses the cached backend endpoint instead of external GeoDB API
 */

import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Get cities for a specific state from backend
 * @param {string} stateCode - State ISO code (e.g., 'CA', 'NY')
 * @param {number} limit - Maximum number of cities to return (default: 50)
 * @param {number} offset - Number of records to skip (default: 0)
 * @param {string} search - Optional search term for city names (default: '')
 * @returns {Promise<Object>} Cities data
 */
export const getCitiesByStateApi = async (stateCode, limit = 50, offset = 0, search = '') => {
  try {
    // Build URL with query parameters
    let url = `${API_ENDPOINTS.GET_CITIES_BY_STATE}?stateCode=${stateCode}&limit=${limit}&offset=${offset}`;
    
    // Add search/namePrefix if provided
    if (search) {
      url += `&namePrefix=${encodeURIComponent(search)}`;
    }

    console.log(`🏙️ Fetching cities from backend: ${stateCode} (search: "${search}", limit: ${limit}, offset: ${offset})`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend API Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Backend returned error:', data);
      return {
        success: false,
        error: data.error || 'Unknown error',
        cities: [],
        hasMore: false,
        totalCount: 0
      };
    }

    console.log(`✅ Cities loaded: ${data.data?.length || 0} (cached: ${data.cached || false})`);

    // Transform to match expected format
    const cities = data.data?.map(city => city.name || city.city) || [];

    return {
      success: true,
      cities: cities.map(name => ({ name })),
      hasMore: data.pagination?.hasMore || false,
      totalCount: data.pagination?.total || 0,
      cached: data.cached || false
    };
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
};

