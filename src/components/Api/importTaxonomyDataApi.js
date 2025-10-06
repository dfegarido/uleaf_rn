import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_CONFIG } from '../../config/apiConfig';
import { Linking } from 'react-native';

/**
 * Import Taxonomy Data API Client
 * Backend handles all Storage operations
 * Uses fetch API with FileReader to avoid RNFS dependency issues
 */
export const importTaxonomyDataApi = async (params) => {
  try {
    const { file, importType, adminId, options = {} } = params;

    if (!file || !importType || !adminId) {
      throw new Error('Missing required parameters');
    }

    const token = await getStoredAuthToken();
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/importTaxonomyDataFromStorage`;
    
    console.log('📖 Reading file as base64...');
    
    // Read file using fetch and convert to base64
    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();
    
    // Convert blob to base64
    const fileContent = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    console.log('✅ File read successfully, size:', fileContent.length, 'bytes (base64)');
    
    const payload = {
      fileContent,
      fileName: file.name || 'taxonomy_import.xlsx',
      fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      importType,
      adminId,
      options
    };

    console.log('📤 Sending to backend...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    if (response.ok) {
      return {
        success: true,
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
      return {
        success: false,
        error: responseData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message || 'Network request failed',
      imported: 0,
      updated: 0,
      errors: 0
    };
  }
};

export const downloadTaxonomyTemplateApi = async () => {
  try {
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/downloadTaxonomyTemplate`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return {
        success: true,
        message: 'Template download started. Check Files app > iCloud Drive > Downloads folder.'
      };
    } else {
      throw new Error('Cannot open download URL');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to download template'
    };
  }
};

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
      data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
