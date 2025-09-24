import { API_CONFIG, API_ENDPOINTS } from '../config/apiConfig';

/**
 * Update Plant Taxonomy API Client
 * 
 * Updates an existing plant taxonomy entry with genus and species information.
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.genusId - ID of the genus to update
 * @param {string} [params.newGenusName] - New name for the genus (optional)
 * @param {Array} [params.species] - Array of species objects to update/add/delete
 * @param {string} [params.adminId] - ID of the admin updating the taxonomy (optional when using authToken)
 * @param {string} params.authToken - Authentication token (required in production)
 * 
 * @returns {Promise<Object>} Response containing update result
 * 
 * @example
 * const response = await updatePlantTaxonomyApi({
 *   genusId: 'genus123',
 *   newGenusName: 'Monstera', // optional
 *   species: [
 *     {
 *       id: 'species123', // existing species to update
 *       name: 'deliciosa',
 *       variegation: 'Variegated',
 *       shippingIndex: 'Medium',
 *       acclimationIndex: 'Easy',
 *       action: 'update'
 *     },
 *     {
 *       name: 'adansonii', // new species to add
 *       variegation: 'None',
 *       shippingIndex: 'Low',
 *       acclimationIndex: 'Easy',
 *       action: 'add'
 *     }
 *   ],
 *   authToken: await getStoredAuthToken()
 * });
 * 
 * if (response.success) {
 *   console.log('Taxonomy updated:', response.data);
 * }
 */
export const updatePlantTaxonomyApi = async (params) => {
  try {
    console.log('✅ Starting updatePlantTaxonomyApi call with params:', params);

    const { genusId, newGenusName, species, adminId, authToken } = params;

    // Validate required parameters
    if (!genusId) {
      throw new Error('genusId is required');
    }

    if (!authToken) {
      console.warn('⚠️ No auth token provided. Request may fail in production.');
    }

    // adminId is optional when authToken is provided
    if (!authToken && !adminId) {
      throw new Error('Either authToken or adminId is required');
    }

    // Validate species objects if provided
    if (species && Array.isArray(species)) {
      species.forEach((spec, index) => {
        if (!spec.name || !spec.name.trim()) {
          throw new Error(`Species ${index + 1}: name is required`);
        }
      });
    }

    // Prepare request body
    const requestBody = {
      genusId: genusId.trim()
    };

    // Add optional fields
    if (adminId) {
      requestBody.adminId = adminId.trim();
    }

    if (newGenusName && newGenusName.trim()) {
      requestBody.newGenusName = newGenusName.trim();
    }

    if (species && Array.isArray(species)) {
      requestBody.species = species.map(spec => ({
        id: spec.id || undefined,
        name: spec.name.trim(),
        variegation: spec.variegation || '',
        shippingIndex: spec.shippingIndex || '',
        acclimationIndex: spec.acclimationIndex || '',
        action: spec.action || (spec.id ? 'update' : 'add')
      }));
    }

    console.log('📝 Request body prepared:', requestBody);

    // Prepare request configuration
    const requestConfig = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    // Add authentication header if token provided
    if (authToken) {
      requestConfig.headers['Authorization'] = `Bearer ${authToken}`;
      console.log('🔑 Using auth token for authentication');
    } else if (adminId) {
      console.log('🔑 Using adminId for authentication (fallback mode)');
    }

  console.log('🌐 Making API call to:', API_ENDPOINTS.UPDATE_PLANT_TAXONOMY);

    // Make the API call
  const response = await fetch(API_ENDPOINTS.UPDATE_PLANT_TAXONOMY, requestConfig);

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

    console.log('✅ API call successful:', responseData);
    return responseData;

  } catch (error) {
    console.error('❌ updatePlantTaxonomyApi error:', error.message);
    
    // Return error in consistent format
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Helper function to validate species data before sending to API
 * 
 * @param {Array} species - Array of species objects
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateSpeciesUpdateData = (species) => {
  const errors = [];

  if (!Array.isArray(species)) {
    errors.push('Species must be an array');
    return { isValid: false, errors };
  }

  species.forEach((specie, index) => {
    if (!specie.name || typeof specie.name !== 'string' || !specie.name.trim()) {
      errors.push(`Species ${index + 1}: Name is required`);
    }

    const validActions = ['add', 'update', 'delete'];
    if (specie.action && !validActions.includes(specie.action)) {
      errors.push(`Species ${index + 1}: Action must be one of: ${validActions.join(', ')}`);
    }

    if (specie.action === 'update' && !specie.id) {
      errors.push(`Species ${index + 1}: ID is required for update action`);
    }

    if (specie.action === 'delete' && !specie.id) {
      errors.push(`Species ${index + 1}: ID is required for delete action`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to format species data for the API
 * 
 * @param {Array} species - Array of species objects
 * @returns {Array} Formatted species array
 */
export const formatSpeciesForUpdateApi = (species) => {
  if (!Array.isArray(species)) return [];

  return species.map(specie => ({
    id: specie.id || undefined,
    name: specie.name?.trim() || '',
    variegation: specie.variegation || '',
    shippingIndex: specie.shippingIndex || '',
    acclimationIndex: specie.acclimationIndex || '',
    action: specie.action || (specie.id ? 'update' : 'add')
  }));
};
