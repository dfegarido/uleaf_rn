import { API_CONFIG } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Download Taxonomy Import Template API Client
 * 
 * Downloads an Excel template file for importing taxonomy data.
 * The template includes instructions and sample data.
 * 
 * @returns {Promise<Object>} Response containing file blob and metadata
 * 
 * @example
 * const response = await downloadTaxonomyTemplateApi();
 * if (response.success) {
 *   // Handle file download
 *   const blob = response.blob;
 *   const filename = response.filename;
 * }
 */
export const downloadTaxonomyTemplateApi = async () => {
  try {
    console.log('📥 Downloading taxonomy import template...');

    // Get authentication token
    const token = await getStoredAuthToken();

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/downloadTaxonomyTemplate`;
    
    console.log('🌐 Making request to:', url);

    // Prepare request headers
    const headers = {};

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
      console.error('❌ Download failed:', response.status, errorText);
      
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        status: response.status
      };
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'taxonomy_import_template.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    console.log('✅ Template downloaded successfully:', {
      filename,
      size: blob.size,
      type: blob.type
    });

    return {
      success: true,
      blob,
      filename,
      size: blob.size,
      type: blob.type
    };

  } catch (error) {
    console.error('❌ Error downloading template:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed'
    };
  }
};
