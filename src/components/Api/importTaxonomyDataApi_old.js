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
    console.log('📄 File details:', {
      uri: file.uri,
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Create FormData for file upload
    const formData = new FormData();
    
    // Add file - handle iOS file URIs properly
    // iOS file URIs need to be handled differently
    const fileToUpload = {
      uri: file.uri,
      type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: file.name || 'taxonomy_import.xlsx',
    };
    
    // For iOS, if uri starts with file://, keep it as is
    // DocumentPicker already provides the correct format
    formData.append('taxonomyFile', fileToUpload);

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

    console.log('📤 Uploading file with FormData...');

    // Use XMLHttpRequest for better multipart/form-data support in React Native
    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', url);
      
      // Set headers
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Handle response
      xhr.onload = () => {
        console.log('� XHR Response status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('✅ Import response received:', data);
            
            resolve({
              success: data.success || true,
              data: data.data || {},
              message: data.message || 'Import completed successfully',
              imported: data.data?.imported || 0,
              updated: data.data?.updated || 0,
              errors: data.errors || 0,
              skipped: data.skipped || 0,
              details: data.details || [],
              timestamp: data.timestamp
            });
          } catch (parseError) {
            console.error('❌ Error parsing response:', parseError);
            reject(new Error('Invalid response from server'));
          }
        } else {
          console.error('❌ Request failed:', xhr.status, xhr.responseText);
          
          let errorData;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch (e) {
            errorData = { error: xhr.responseText || 'Request failed' };
          }
          
          resolve({
            success: false,
            error: errorData.error || `HTTP ${xhr.status}`,
            status: xhr.status
          });
        }
      };
      
      xhr.onerror = () => {
        console.error('❌ Network error during upload');
        resolve({
          success: false,
          error: 'Network request failed'
        });
      };
      
      xhr.ontimeout = () => {
        console.error('❌ Upload timeout');
        resolve({
          success: false,
          error: 'Upload timeout'
        });
      };
      
      console.log('� Sending request with XMLHttpRequest...');
      
      // Send request
      xhr.send(formData);
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

/**
 * Download Taxonomy Template API Client
 * 
 * Downloads an Excel template file for taxonomy data import.
 * The template contains the correct headers and structure.
 * 
 * @returns {Promise<Object>} Response indicating download status
 */
export const downloadTaxonomyTemplateApi = async () => {
  try {
    console.log('📥 Downloading taxonomy template...');

    // Get authentication token (optional for template download)
    const token = await getStoredAuthToken();

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/downloadTaxonomyTemplate`;
    
    console.log('🌐 Making template download request to:', url);

    // Prepare request headers
    const headers = {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    console.log('📡 Template download response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Template download failed:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Template download failed' };
      }

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    // Get the blob
    const blob = await response.blob();
    console.log('✅ Template file downloaded, size:', blob.size);

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'taxonomy_import_template.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    return {
      success: true,
      message: 'Template downloaded successfully',
      filename: filename,
      size: blob.size,
      blob: blob
    };

  } catch (error) {
    console.error('❌ Error in downloadTaxonomyTemplateApi:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed'
    };
  }
};
