import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Browse plants by species using getBuyerListings with species filter
 * @param {Object} params - Parameters for species browsing
 * @param {string} params.species - Species name to filter by
 * @param {string} params.genus - Optional genus to further filter
 * @param {number} params.limit - Number of results to return
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} API response with plants
 */
export const browsePlantsBySpeciesApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    
    // Add species filter (required)
    if (params.species) {
      queryParams.append('species', params.species);
    }
    
    // Add optional filters
    if (params.genus) {
      queryParams.append('genus', params.genus);
    }
    
    // Add pagination and sorting
    queryParams.append('limit', params.limit || '20');
    queryParams.append('offset', params.offset || '0');
    queryParams.append('sortBy', params.sortBy || 'createdAt');
    queryParams.append('sortOrder', params.sortOrder || 'desc');
    
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
    console.error('Browse plants by species API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while browsing plants by species',
    };
  }
};
