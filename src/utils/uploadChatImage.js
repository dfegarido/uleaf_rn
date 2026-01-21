// utils/uploadChatImage.js
import {getStoredAuthToken} from './getStoredAuthToken';
import {API_ENDPOINTS} from '../config/apiConfig';

/**
 * Uploads a chat image to backend API (which handles Firebase Storage upload)
 * Uses the same approach as listing image uploads
 * 
 * @param {string} fileUri - Local file URI from image picker
 * @param {string} chatId - Chat ID where the image is being sent (for reference, not used in upload)
 * @returns {Promise<string>} Public download URL of the uploaded image
 */
export const uploadChatImage = async (fileUri, chatId) => {
  try {
    if (!fileUri) {
      throw new Error('Image URI is required.');
    }

    const token = await getStoredAuthToken();

    // Extract filename from URI
    const filename = fileUri.split('/').pop();
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

    console.log('📤 Uploading chat image to backend:', filename);
    console.log('🌐 API Endpoint:', API_ENDPOINTS.UPLOAD_LISTING_IMAGE);

    // Create FormData with the image file
    const formData = new FormData();
    
    // For React Native, we need to append the file with proper format
    formData.append('image', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    });

    // Use XMLHttpRequest instead of fetch for better React Native FormData support
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

            console.log('✅ Chat image uploaded successfully:', json.url);
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
      
      console.log('🚀 Sending XMLHttpRequest for chat image...');
      xhr.send(formData);
    });

  } catch (error) {
    console.error('❌ Upload chat image failed:', error.message);
    throw error;
  }
};
