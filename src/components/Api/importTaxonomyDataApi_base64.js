import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_CONFIG } from '../../config/apiConfig';
import RNFS from 'react-native-fs';
import { Linking } from 'react-native';

/**
 * Import Taxonomy Data API Client
 * 
 * Handles uploading and importing taxonomy data from various file formats.
 * Supports CSV, Excel, and JSON files with taxonomy information.
 * Uses base64 encoding to avoid multipart/form-data compatibility issues with React Native.
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

    // Read file as base64 to avoid multipart/form-data issues
    console.log('📖 Reading file as base64...');
    
    let fileContent;
    try {
      // Read file from URI as base64
      const fileUri = file.uri.replace('file://', '');
      fileContent = await RNFS.readFile(fileUri, 'base64');
      console.log('✅ File read successfully, size:', fileContent.length, 'bytes (base64)');
    } catch (readError) {
      console.error('❌ Error reading file:', readError);
      throw new Error('Failed to read file: ' + readError.message);
    }

    // Prepare JSON payload with base64 encoded file
    const payload = {
      fileContent: fileContent,
      fileName: file.name || 'taxonomy_import.xlsx',
      fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      importType: importType,
      adminId: adminId,
      options: options
    };

    console.log('📤 Uploading file as base64 JSON...');

    // Use fetch with JSON payload
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ Import response received:', responseData);
      
      return {
        success: responseData.success || true,
        data: responseData.data || {},
        message: responseData.message || 'Import completed successfully',
        imported: responseData.data?.imported || 0,
        updated: responseData.data?.updated || 0,
        errors: responseData.errors || 0,
        skipped: responseData.skipped || 0,
        details: responseData.details || [],
        timestamp: responseData.timestamp
      };
    } else {
      console.error('❌ Request failed:', response.status, responseData);
      
      return {
        success: false,
        error: responseData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

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
 * Download Taxonomy Template
 * 
 * Opens the taxonomy template download URL in Safari.
 * On iOS, the template will be saved to iCloud Drive > Downloads folder.
 * 
 * Instructions for users:
 * 1. Click "Download Template"
 * 2. Template opens in Safari and downloads automatically
 * 3. Find downloaded file: Files app > Browse > iCloud Drive > Downloads
 * 4. Open file in Excel or Numbers to edit
 * 5. Fill in taxonomy data
 * 6. Return to app and upload the completed file
 * 
 * @returns {Promise<Object>} Response indicating success or failure
 */
export const downloadTaxonomyTemplateApi = async () => {
  try {
    console.log('📥 Opening taxonomy template download...');
    
    // Build template URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/downloadTaxonomyTemplate`;
    
    console.log('🌐 Opening URL in Safari:', url);
    
    // Open URL in Safari (will trigger download)
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
      console.log('✅ Template download opened in Safari');
      
      return {
        success: true,
        message: 'Template download started. Check Files app > iCloud Drive > Downloads folder.',
        instructions: [
          'The template is downloading in Safari',
          'Find it in: Files app > Browse > iCloud Drive > Downloads',
          'Open in Excel/Numbers to edit',
          'Fill in taxonomy data (scientific names, common names, categories)',
          'Save and return to app to upload'
        ]
      };
    } else {
      throw new Error('Cannot open download URL');
    }
    
  } catch (error) {
    console.error('❌ Error downloading template:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to download template',
      message: 'Could not open download. Please check your network connection.'
    };
  }
};

/**
 * Get Import Status
 * 
 * Check the status of an ongoing import operation
 * 
 * @param {string} importId - ID of the import operation
 * @returns {Promise<Object>} Import status information
 */
export const getImportStatusApi = async (importId) => {
  try {
    const token = await getStoredAuthToken();
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/getImportStatus?importId=${importId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      data: data,
      status: response.status
    };
    
  } catch (error) {
    console.error('Error getting import status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
