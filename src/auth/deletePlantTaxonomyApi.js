import { API_CONFIG } from '../config/apiConfig';

/**
 * Delete Plant Taxonomy API Client
 * 
 * Deletes an existing plant taxonomy entry including genus and all associated species.
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.genusId - ID of the genus to delete
 * @param {string} params.adminId - ID of the admin deleting the taxonomy
 * @param {string} params.authToken - Authentication token (optional for emulator)
 * 
 * @returns {Promise<Object>} Response containing deletion result
 * 
 * @example
 * const response = await deletePlantTaxonomyApi({
 *   genusId: 'genus123',
 *   adminId: 'admin123'
 * });
 * 
 * if (response.success) {
 *   console.log('Taxonomy deleted:', response.data);
 * }
 */
export const deletePlantTaxonomyApi = async (params) => {
  try {
    console.log('✅ Starting deletePlantTaxonomyApi call with params:', params);

    const { genusId, adminId, authToken } = params;

    // Validate required parameters
    if (!genusId) {
      throw new Error('Missing required parameter: genusId');
    }

    if (!adminId) {
      throw new Error('Missing required parameter: adminId');
    }

    // Prepare request body
    const requestBody = {
      genusId: genusId.trim(),
      adminId: adminId.trim()
    };

    console.log('🗑️ Request body prepared:', requestBody);

    // Prepare request configuration
    const requestConfig = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    // Add authorization header if token is provided
    if (authToken) {
      requestConfig.headers.Authorization = `Bearer ${authToken}`;
    }

    console.log('📡 Making DELETE request to deletePlantTaxonomy endpoint...');

    // Construct API URL
    const apiUrl = `${API_CONFIG.BASE_URL}/deletePlantTaxonomy`;

    console.log('🔗 API URL:', apiUrl);

    // Make the API request
    const response = await fetch(apiUrl, requestConfig);

    console.log('📡 Response status:', response.status);

    // Parse response
    const responseData = await response.json();

    console.log('📊 Response data:', responseData);

    // Handle different response scenarios
    if (response.ok && responseData.success) {
      console.log('✅ Taxonomy deleted successfully:', responseData.data);
      
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Taxonomy deleted successfully',
        timestamp: responseData.timestamp,
        status: response.status
      };
    } else {
      // Handle error responses
      const errorMessage = responseData.error || 
                          responseData.message || 
                          `HTTP ${response.status}: ${response.statusText}`;

      console.error('❌ API Error Response:', {
        status: response.status,
        error: errorMessage,
        data: responseData
      });

      return {
        success: false,
        error: errorMessage,
        data: responseData,
        status: response.status
      };
    }

  } catch (error) {
    console.error('❌ deletePlantTaxonomyApi error:', error.message);

    // Handle network or other errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to the server. Please check your internet connection.',
        details: error.message
      };
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      details: error.stack
    };
  }
};
