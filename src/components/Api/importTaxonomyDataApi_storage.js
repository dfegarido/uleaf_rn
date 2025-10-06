import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_CONFIG } from '../../config/apiConfig';
import storage from '@react-native-firebase/storage';
import { Linking } from 'react-native';

/**
 * Import Taxonomy Data via Firebase Storage
 * 
 * This approach uploads the XLSX file to Firebase Storage first,
 * then triggers a Cloud Function to process it.
 * 
 * Flow:
 * 1. Upload XLSX to Firebase Storage (imports/taxonomy/{timestamp}_{filename})
 * 2. Get download URL
 * 3. Call Cloud Function with file reference
 * 4. Cloud Function downloads from Storage to /tmp
 * 5. Cloud Function processes with xlsx library
 * 6. Cloud Function imports to Firestore
 * 7. Cloud Function deletes temp file from Storage
 */

/**
 * Import Taxonomy Data API Client
 * 
 * @param {Object} params - Import parameters
 * @param {Object} params.file - File object from DocumentPicker
 * @param {string} params.importType - Type of import ('taxonomy', 'species', etc.)
 * @param {string} params.adminId - ID of the admin performing the import
 * @param {Object} params.options - Additional import options
 * @param {boolean} params.options.overwriteExisting - Whether to overwrite existing entries
 * @param {boolean} params.options.skipDuplicates - Whether to skip duplicate entries
 * @param {string} params.options.source - Source identifier for imported data
 * 
 * @returns {Promise<Object>} Response containing import results
 */
export const importTaxonomyDataApi = async (params) => {
  const { file, importType, adminId, options = {} } = params;
  
  let uploadedFilePath = null;
  
  try {
    console.log('📤 Starting taxonomy data import via Firebase Storage...');
    console.log('📤 Import params:', {
      fileName: file?.name,
      fileSize: file?.size,
      importType,
      adminId,
      options
    });

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

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileName = file.name || 'taxonomy_import.xlsx';
    const storagePath = `imports/taxonomy/${timestamp}_${fileName}`;
    
    console.log('📤 Uploading to Firebase Storage:', storagePath);
    
    // Upload file to Firebase Storage
    const reference = storage().ref(storagePath);
    
    // Track upload progress
    const uploadTask = reference.putFile(file.uri);
    
    uploadTask.on('state_changed', snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log(`📤 Upload progress: ${progress.toFixed(1)}%`);
    });

    // Wait for upload to complete
    await uploadTask;
    uploadedFilePath = storagePath;
    
    console.log('✅ File uploaded successfully to Storage');

    // Get download URL (optional, for logging)
    const downloadUrl = await reference.getDownloadURL();
    console.log('🔗 Download URL:', downloadUrl);

    // Get authentication token
    const token = await getStoredAuthToken();

    // Call Cloud Function to process the file
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/importTaxonomyDataFromStorage`;
    
    console.log('🌐 Calling Cloud Function:', url);
    
    const payload = {
      storagePath: storagePath,
      fileName: fileName,
      importType: importType,
      adminId: adminId,
      options: options
    };

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
      console.log('✅ Import completed successfully:', responseData);
      
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
      console.error('❌ Import failed:', response.status, responseData);
      
      // If function failed, try to clean up the uploaded file
      if (uploadedFilePath) {
        try {
          await storage().ref(uploadedFilePath).delete();
          console.log('🗑️ Cleaned up uploaded file after error');
        } catch (cleanupError) {
          console.error('⚠️ Failed to cleanup file:', cleanupError);
        }
      }
      
      return {
        success: false,
        error: responseData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

  } catch (error) {
    console.error('❌ Error in importTaxonomyDataApi:', error);
    
    // Clean up uploaded file on error
    if (uploadedFilePath) {
      try {
        await storage().ref(uploadedFilePath).delete();
        console.log('🗑️ Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup file:', cleanupError);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Upload or processing failed',
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
