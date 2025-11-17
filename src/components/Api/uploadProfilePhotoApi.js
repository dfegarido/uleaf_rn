import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Upload profile photo using multipart/form-data (direct file upload)
 * This is more efficient than base64 encoding and reduces payload size
 * 
 * @param {string} imageUri - Local file URI
 * @param {string|null} overrideToken - Optional auth token override
 * @returns {Promise<Object>} Response with profilePhotoUrl
 */
export const uploadProfilePhotoApi = async (imageUri, overrideToken = null) => {
  console.log('Starting uploadProfilePhotoApi...');
  
  try {
    const token = overrideToken || await getStoredAuthToken();

    // Extract filename from URI
    const filename = typeof imageUri === 'string' ? imageUri.split('/').pop() : 'photo.jpg';
    const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    const mimeMap = { 
      jpg: 'image/jpeg', 
      jpeg: 'image/jpeg', 
      png: 'image/png', 
      gif: 'image/gif', 
      webp: 'image/webp' 
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    console.log('📤 Uploading profile photo:', filename);
    console.log('🌐 API Endpoint:', API_ENDPOINTS.UPLOAD_PROFILE_PHOTO);
    console.log('📁 Using multipart/form-data (direct file upload)');

    // Create FormData with the image file
    const formData = new FormData();
    
    // For React Native, we need to append the file with proper format
    formData.append('profilePhoto', {
      uri: imageUri,
      type: mimeType,
      name: filename,
    });

    console.log('📦 FormData created, sending request...');
    console.log('📋 FormData details:', {
      fieldName: 'profilePhoto',
      uri: imageUri,
      type: mimeType,
      name: filename
    });

    // Use XMLHttpRequest instead of fetch for better React Native FormData support
    // fetch() can have issues with FormData in React Native, especially on iOS
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let timeoutId = null;

      // Set up timeout
      timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error('Upload request timed out. Please try again.'));
      }, 120000); // 120 second timeout

      xhr.onload = function() {
        clearTimeout(timeoutId);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('✅ Upload response:', result);

            if (!result.success) {
              reject(new Error(result.error || result.message || 'Upload failed'));
              return;
            }

            resolve(result);
          } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            reject(new Error('Invalid response from server'));
          }
        } else {
          console.error('❌ Server error:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText || 'Unknown error'}`));
        }
      };

      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('❌ Network error during upload');
        reject(new Error('Network error during upload. Please check your connection.'));
      };

      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        console.error('❌ Request timeout');
        reject(new Error('Upload request timed out. Please try again.'));
      };

      // Open and send request
      xhr.open('POST', API_ENDPOINTS.UPLOAD_PROFILE_PHOTO);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Don't set Content-Type - let XMLHttpRequest set it with boundary for multipart/form-data
      
      console.log('🚀 Sending XMLHttpRequest...');
      xhr.send(formData);
    });

  } catch (error) {
    console.error('❌ uploadProfilePhotoApi error:', error.message || error);
    throw error;
  }
};

