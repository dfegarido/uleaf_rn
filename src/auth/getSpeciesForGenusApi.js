import { API_CONFIG, API_ENDPOINTS } from '../config/apiConfig';

/**
 * Get Species for Genus API Client
 * 
 * Retrieves all species belonging to a specific genus.
 * 
 * @param {Object} params - Request parameters
 * @param {string} [params.genusId] - ID of the genus to get species for
 * @param {string} [params.genusName] - Alternative: name of the genus
 * @param {string} params.authToken - Authentication token (required in production)
 * 
 * @returns {Promise<Object>} Response containing species data
 * 
 * @example
 * const response = await getSpeciesForGenusApi({
 *   genusName: 'Monstera',
 *   authToken: await getStoredAuthToken()
 * });
 * 
 * if (response.success) {
 *   console.log('Species data:', response.data);
 *   console.log('Genus info:', response.genusInfo);
 * }
 */
export const getSpeciesForGenusApi = async (params) => {
  try {
    console.log('🔍 Starting getSpeciesForGenusApi call');

    const { genusId, genusName, authToken } = params || {};

    // Validate required parameters
    if (!genusId && !genusName) {
      throw new Error('Either genusId or genusName is required');
    }

    if (!authToken) {
      console.warn('⚠️ No auth token provided. Request may fail in production.');
    }

    // Prepare query parameters
    const queryParams = new URLSearchParams();
    if (genusId) {
      queryParams.append('genusId', genusId.toString().trim());
    }
    if (genusName) {
      queryParams.append('genusName', genusName.toString().trim());
    }

    console.log('📝 Query parameters:', queryParams.toString());

    // Prepare request configuration
    const requestConfig = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add authentication header
    if (authToken) {
      requestConfig.headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Build URL with query parameters
    const base = API_ENDPOINTS.GET_SPECIES_FOR_GENUS;
    const url = queryParams.toString() ? `${base}?${queryParams.toString()}` : base;
    console.log('🌐 Making API call to:', url);

    // Make the API call
    const response = await fetch(url, requestConfig);
    console.log('📡 Response status:', response.status);

    // Parse response
    const responseData = await response.json();
    console.log('📄 Response data:', responseData);

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, responseData.error);
      throw new Error(
        responseData.error || 
        responseData.message || 
        `Failed to get species. Status: ${response.status}`
      );
    }

    console.log('✅ Species retrieved:', {
      count: responseData.data?.length || 0,
      genus: responseData.genusInfo?.name || genusName || genusId
    });

    return {
      success: true,
      data: responseData.data || responseData,
      genusInfo: responseData.genusInfo,
      count: responseData.data?.length || 0,
      status: response.status
    };

  } catch (error) {
    console.error('❌ Error in getSpeciesForGenusApi:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      data: [],
      count: 0,
      status: error.status || 500
    };
  }
};

/**
 * Helper function to format species data for display
 * 
 * @param {Array} species - Array of species objects from API
 * @returns {Array} Formatted species array for UI display
 */
export const formatSpeciesForDisplay = (species) => {
  if (!Array.isArray(species)) return [];

  return species.map(specie => ({
    id: specie.id,
    name: specie.name || 'Unknown Species',
    variegation: specie.variegation || '',
    shipping: formatIndexForDisplay(specie.shippingIndex),
    acclimation: formatIndexForDisplay(specie.acclimationIndex),
    // Keep original data for editing
    originalData: specie
  }));
};

/**
 * Helper function to format index values for display
 * 
 * @param {string} indexValue - The index value from the database
 * @returns {string} Formatted display string
 */
const formatIndexForDisplay = (indexValue) => {
  if (!indexValue) return '';
  
  // If value is already in the new format (e.g., "Best (7-10)"), return as-is
  if (indexValue.includes('(') && indexValue.includes(')')) {
    return indexValue;
  }
  
  // Convert string to number if it's a numeric string
  const numValue = parseFloat(indexValue);
  
  // If it's a valid number, convert to Good/Better/Best format
  if (!isNaN(numValue)) {
    if (numValue >= 7) {
      return 'Best (7-10)';
    } else if (numValue >= 4) {
      return 'Better (4-6)';
    } else {
      return 'Good (3-5)';
    }
  }
  
  // Map legacy database values to display values for backward compatibility
  const shippingMap = {
    'Low': 'Good (5-8)',
    'Medium': 'Better (7-10)', 
    'High': 'Best (9-10)'
  };
  
  const acclimationMap = {
    'Easy': 'Better (4-6)',
    'Medium': 'Average (3-5)',
    'Hard': 'Difficult (1-3)'
  };

  return shippingMap[indexValue] || acclimationMap[indexValue] || indexValue;
};
