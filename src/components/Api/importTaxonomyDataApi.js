import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_CONFIG } from '../../config/apiConfig';

/**
 * Import Taxonomy Data API Client
 * 
 * Handles uploading and importing taxonomy data from various file formats.
 * Supports CSV, Excel, and JSON files with taxonomy information.
 * 
 * @param {Object} params - Import parameters
 * @param {Object} params.file - File object to upload
 * @param {string} params.importType - Type of import ('taxonomy', 'species', etc.)
 * @param {string} params.adminId - ID of the admin performing the import
 * @param {Object} params.options - Additional import options
 * @param {boolean} params.options.overwriteExisting - Whether to overwrite existing entries
 * @param {boolean} params.options.skipDuplicates - Whether to skip duplicate entries
 * @param {string} params.options.source - Source identifier for imported data
 * 
 * @returns {Promise<Object>} Response containing import results
 * 
 * @example
 * const response = await importTaxonomyDataApi({
 *   file: selectedFile,
 *   importType: 'taxonomy',
 *   adminId: 'admin123',
 *   options: {
 *     overwriteExisting: false,
 *     skipDuplicates: true,
 *     source: 'manual_import'
 *   }
 * });
 * 
 * if (response.success) {
 *   console.log('Import successful:', response.data);
 * }
 */
export const importTaxonomyDataApi = async (params) => {
  try {
    console.log('📤 Starting taxonomy data import...');
    console.log('📤 Import params:', {
      fileName: params.file?.name,
      fileSize: params.file?.size,
      importType: params.importType,
      adminId: params.adminId,
      options: params.options
    });

    const { file, importType, adminId, options = {} } = params;

    // Validate required parameters
    if (!file) {
      throw new Error('File is required for import');
    }

    if (!importType) {
      throw new Error('Import type is required');
    }

    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    // Get authentication token
    const token = await getStoredAuthToken();

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/importTaxonomyData`;
    
    console.log('🌐 Making import request to:', url);

    // Create FormData for file upload
    const formData = new FormData();
    
    // Add file
    formData.append('taxonomyFile', {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name,
    });

    // Add metadata
    formData.append('importType', importType);
    formData.append('adminId', adminId);
    
    // Add options
    if (options.overwriteExisting !== undefined) {
      formData.append('overwriteExisting', options.overwriteExisting.toString());
    }
    
    if (options.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', options.skipDuplicates.toString());
    }
    
    if (options.source) {
      formData.append('source', options.source);
    }

    // Prepare request headers
    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    // Add authorization header if token available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('📤 Uploading file...');

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Import request failed:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Import request failed' };
      }

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();
    console.log('✅ Import response received:', data);

    // Process the response
    const result = {
      success: data.success || true,
      data: data.data || {},
      imported: data.imported || 0,
      updated: data.updated || 0,
      errors: data.errors || 0,
      skipped: data.skipped || 0,
      message: data.message || 'Import completed successfully',
      details: data.details || [],
      timestamp: data.timestamp
    };

    console.log('📊 Import statistics:', {
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      skipped: result.skipped
    });

    return result;

  } catch (error) {
    console.error('❌ Error in importTaxonomyDataApi:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed',
      imported: 0,
      updated: 0,
      errors: 0
    };
  }
};

/**
 * Validate Taxonomy File API Client
 * 
 * Validates a taxonomy file before actual import to check format and structure.
 * 
 * @param {Object} params - Validation parameters
 * @param {Object} params.file - File object to validate
 * @param {string} params.importType - Type of import to validate for
 * 
 * @returns {Promise<Object>} Response containing validation results
 */
export const validateTaxonomyFileApi = async (params) => {
  try {
    console.log('🔍 Starting taxonomy file validation...');

    const { file, importType } = params;

    if (!file) {
      throw new Error('File is required for validation');
    }

    // Get authentication token
    const token = await getStoredAuthToken();

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/validateTaxonomyFile`;
    
    console.log('🌐 Making validation request to:', url);

    // Create FormData for file upload
    const formData = new FormData();
    
    formData.append('taxonomyFile', {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name,
    });

    formData.append('importType', importType || 'taxonomy');

    // Prepare request headers
    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    console.log('📡 Validation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Validation request failed:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Validation request failed' };
      }

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();
    console.log('✅ Validation response received:', data);

    return {
      success: data.success || true,
      valid: data.valid || false,
      records: data.records || 0,
      columns: data.columns || [],
      errors: data.errors || [],
      warnings: data.warnings || [],
      preview: data.preview || [],
      message: data.message || 'File validation completed'
    };

  } catch (error) {
    console.error('❌ Error in validateTaxonomyFileApi:', error);
    
    return {
      success: false,
      valid: false,
      error: error.message || 'Network request failed'
    };
  }
};

/**
 * Get Import History API Client
 * 
 * Retrieves the history of taxonomy data imports.
 * 
 * @param {Object} params - Request parameters
 * @param {number} params.limit - Number of records to return
 * @param {number} params.offset - Number of records to skip
 * @param {string} params.adminId - Filter by admin ID
 * 
 * @returns {Promise<Object>} Response containing import history
 */
export const getImportHistoryApi = async (params = {}) => {
  try {
    console.log('📋 Fetching import history...');

    const { limit = 50, offset = 0, adminId } = params;

    // Get authentication token
    const token = await getStoredAuthToken();

    // Build URL with query parameters
    const baseUrl = API_CONFIG.BASE_URL;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (adminId) {
      queryParams.append('adminId', adminId);
    }

    const url = `${baseUrl}/getImportHistory?${queryParams.toString()}`;
    
    console.log('🌐 Making request to:', url);

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Request failed' };
      }

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();
    console.log('✅ Import history received:', data);

    return {
      success: data.success || true,
      data: data.data || [],
      total: data.total || 0,
      limit: data.limit || limit,
      offset: data.offset || offset,
      message: data.message
    };

  } catch (error) {
    console.error('❌ Error in getImportHistoryApi:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed',
      data: []
    };
  }
};
