import { API_CONFIG } from '../config/apiConfig';

/**
 * Add Plant Taxonomy API Client
 * 
 * Creates a new plant taxonomy entry with genus and species information.
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.genusName - Name of the genus to create
 * @param {Array} params.species - Array of species objects to create
 * @param {string} params.adminId - ID of the admin creating the taxonomy
 * @param {string} params.authToken - Authentication token (optional for emulator)
 * 
 * @returns {Promise<Object>} Response containing creation result
 * 
 * @example
 * const response = await addPlantTaxonomyApi({
 *   genusName: 'Monstera',
 *   species: [
 *     {
 *       name: 'deliciosa',
 *       variegation: 'None',
 *       shippingIndex: 'Medium',
 *       acclimationIndex: 'Easy'
 *     }
 *   ],
 *   adminId: 'admin123'
 * });
 * 
 * if (response.success) {
 *   console.log('Taxonomy created:', response.data);
 * }
 */
export const addPlantTaxonomyApi = async (params) => {
  try {
    console.log('✅ Starting addPlantTaxonomyApi call with params:', params);

    const { genusName, species, adminId, authToken } = params;

    // Validate required parameters
    if (!genusName || !species || !Array.isArray(species) || species.length === 0) {
      throw new Error('Missing required parameters: genusName and species array are required');
    }

    if (!adminId) {
      throw new Error('Missing required parameter: adminId');
    }

    // Validate species objects
    const validatedSpecies = species.map((spec, index) => {
      if (!spec.name) {
        throw new Error(`Species at index ${index} is missing required field: name`);
      }
      
      return {
        name: spec.name.trim(),
        variegation: spec.variegation || 'None',
        shippingIndex: spec.shippingIndex || 'Medium',
        acclimationIndex: spec.acclimationIndex || 'Easy'
      };
    });

    // Prepare request body
    const requestBody = {
      genusName: genusName.trim(),
      species: validatedSpecies,
      adminId: adminId.trim()
    };

    console.log('📝 Request body prepared:', requestBody);

    // Prepare request configuration
    const requestConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    // Add authentication header if token provided
    if (authToken) {
      requestConfig.headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('🌐 Making API call to:', `${API_CONFIG.BASE_URL}/addPlantTaxonomy`);

    // Make the API call
    const response = await fetch(`${API_CONFIG.BASE_URL}/addPlantTaxonomy`, requestConfig);

    console.log('📡 Raw response status:', response.status);
    console.log('📡 Raw response headers:', response.headers);

    // Parse response
    const responseData = await response.json();
    console.log('📄 Parsed response data:', responseData);

    if (!response.ok) {
      console.error('❌ API call failed with status:', response.status);
      console.error('❌ Error response:', responseData);
      
      throw new Error(
        responseData.error || 
        responseData.message || 
        `Failed to create plant taxonomy. Status: ${response.status}`
      );
    }

    console.log('✅ addPlantTaxonomyApi completed successfully');
    
    return {
      success: true,
      data: responseData,
      status: response.status
    };

  } catch (error) {
    console.error('❌ Error in addPlantTaxonomyApi:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      status: error.status || 500
    };
  }
};

/**
 * Helper function to validate species data before API call
 * 
 * @param {Array} species - Array of species objects to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateSpeciesData = (species) => {
  const errors = [];
  
  if (!Array.isArray(species)) {
    errors.push('Species must be an array');
    return { isValid: false, errors };
  }
  
  if (species.length === 0) {
    errors.push('At least one species is required');
    return { isValid: false, errors };
  }
  
  species.forEach((spec, index) => {
    if (!spec.name || typeof spec.name !== 'string' || spec.name.trim() === '') {
      errors.push(`Species ${index + 1}: Name is required`);
    }
    
    if (!spec.variegation || typeof spec.variegation !== 'string') {
      errors.push(`Species ${index + 1}: Variegation is required`);
    }
    
    if (!spec.shippingIndex || typeof spec.shippingIndex !== 'string') {
      errors.push(`Species ${index + 1}: Shipping index is required`);
    }
    
    if (!spec.acclimationIndex || typeof spec.acclimationIndex !== 'string') {
      errors.push(`Species ${index + 1}: Acclimation index is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to format species data for API submission
 * 
 * @param {Array} species - Array of species objects from the form
 * @returns {Array} Formatted species array for API
 */
export const formatSpeciesForApi = (species) => {
  return species.map(spec => ({
    name: spec.name?.trim() || '',
    variegation: spec.variegation?.trim() || 'None',
    shippingIndex: spec.shippingIndex?.trim() || 'Medium',
    acclimationIndex: spec.acclimationIndex?.trim() || 'Easy'
  }));
};
