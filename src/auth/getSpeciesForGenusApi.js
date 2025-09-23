import { API_CONFIG } from '../config/apiConfig';

/**
 * Get Species for Genus API Client
 * 
 * Retrieves all species belonging to a specific genus.
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.genusId - ID of the genus to get species for
 * @param {string} params.genusName - Alternative: name of the genus (optional)
 * @param {string} params.authToken - Authentication token (optional for emulator)
 * 
 * @returns {Promise<Object>} Response containing species data
 * 
 * @example
 * const response = await getSpeciesForGenusApi({
 *   genusId: 'genus123'
 * });
 * 
 * if (response.success) {
 *   console.log('Species data:', response.data);
 *   console.log('Genus info:', response.genusInfo);
 * }
 */
export const getSpeciesForGenusApi = async (params) => {
  try {
    console.log('✅ Starting getSpeciesForGenusApi call with params:', params);

    const { genusId, genusName, authToken } = params;

    // Validate required parameters
    if (!genusId && !genusName) {
      throw new Error('Either genusId or genusName is required');
    }

    // Prepare query parameters
    const queryParams = new URLSearchParams();
    if (genusId) {
      queryParams.append('genusId', genusId);
    }
    if (genusName) {
      queryParams.append('genusName', genusName);
    }

    console.log('📝 Query parameters prepared:', queryParams.toString());

    // Prepare request configuration
    const requestConfig = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add authentication header if token provided
    if (authToken) {
      requestConfig.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const url = `${API_CONFIG.BASE_URL}/getSpeciesForGenus?${queryParams.toString()}`;
    console.log('🌐 Making API call to:', url);

    // Make the API call
    const response = await fetch(url, requestConfig);

    console.log('📡 Raw response status:', response.status);

    // Parse response
    const responseData = await response.json();
    console.log('📄 Parsed response data:', responseData);

    if (!response.ok) {
      console.error('❌ API call failed with status:', response.status);
      console.error('❌ Error response:', responseData);
      
      throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!responseData.success) {
      console.error('❌ API returned error:', responseData.error);
      throw new Error(responseData.error || 'API request failed');
    }

    console.log('✅ API call successful:', {
      speciesCount: responseData.count,
      genusName: responseData.genusInfo?.name,
      source: responseData.source
    });

    return responseData;

  } catch (error) {
    console.error('❌ getSpeciesForGenusApi error:', error.message);
    
    // Return error in consistent format
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      data: [],
      count: 0
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
  
  // Map database values to display values
  const displayMap = {
    'Low': 'Good (5-8)',
    'Medium': 'Better (7-10)', 
    'High': 'Best (9-10)',
    'Easy': 'Better (4-6)',
    'Medium': 'Average (3-5)',
    'Hard': 'Difficult (1-3)'
  };

  return displayMap[indexValue] || indexValue;
};
