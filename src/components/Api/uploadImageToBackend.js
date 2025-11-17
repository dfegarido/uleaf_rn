import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Upload image to backend API using multipart/form-data (direct file upload)
 * 
 * The backend will:
 * 1. Receive the image file (as multipart/form-data)
 * 2. Upload to Firebase Storage
 * 3. Trigger Cloud Function for WebP conversion
 * 4. Return the public URL
 * 
 * This is more efficient than base64 encoding and reduces payload size by ~33%
 * 
 * This function respects the USE_LOCAL_API setting in apiConfig.js:
 * - When USE_LOCAL_API = true: Uses local emulator (http://localhost:5001/...)
 * - When USE_LOCAL_API = false: Uses production endpoint
 * 
 * @param {string} uri - Local file URI (file:// path)
 * @returns {Promise<string>} Public URL of uploaded image
 */
export const uploadImageToBackend = async (uri) => {
  try {
    const token = await getStoredAuthToken();

    // Extract filename from URI
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const mimeMap = { 
      jpg: 'image/jpeg', 
      jpeg: 'image/jpeg', 
      png: 'image/png', 
      gif: 'image/gif', 
      webp: 'image/webp' 
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    console.log('📤 Uploading image to backend:', filename);
    console.log('🌐 API Endpoint:', API_ENDPOINTS.UPLOAD_LISTING_IMAGE);
    console.log('📁 Using multipart/form-data (direct file upload)');

    // Create FormData with the image file
    const formData = new FormData();
    
    // For React Native, we need to append the file with proper format
    formData.append('image', {
      uri: uri,
      type: mimeType,
      name: filename,
    });

    console.log('📦 FormData created, sending request...');
    console.log('📋 FormData details:', {
      fieldName: 'image',
      uri: uri,
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
            const json = JSON.parse(xhr.responseText);
            
            if (!json.success) {
              reject(new Error(json.error || 'Upload failed'));
              return;
            }

            console.log('✅ Upload successful:', json.url);
            resolve(json.url);
          } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            reject(new Error('Invalid response from server'));
          }
        } else {
          console.error('❌ Server error:', xhr.status, xhr.responseText);
          reject(new Error(`Error ${xhr.status}: ${xhr.responseText || 'Unknown error'}`));
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
      xhr.open('POST', API_ENDPOINTS.UPLOAD_LISTING_IMAGE);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Don't set Content-Type - let XMLHttpRequest set it with boundary for multipart/form-data
      
      console.log('🚀 Sending XMLHttpRequest...');
      xhr.send(formData);
    });

  } catch (error) {
    console.error('❌ uploadImageToBackend error:', error.message);
    throw error;
  }
};

/**
 * Upload multiple images to backend API
 * 
 * @param {string[]} uris - Array of local file URIs
 * @returns {Promise<string[]>} Array of public URLs
 */
export const uploadMultipleImagesToBackend = async (uris) => {
  try {
    console.log(`📤 Uploading ${uris.length} images to backend...`);
    
    // Upload images in parallel
    const uploadPromises = uris.map(uri => uploadImageToBackend(uri));
    const urls = await Promise.all(uploadPromises);
    
    console.log(`✅ All ${urls.length} images uploaded successfully`);
    return urls;

  } catch (error) {
    console.error('❌ uploadMultipleImagesToBackend error:', error.message);
    throw error;
  }
};
