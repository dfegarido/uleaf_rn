import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Upload chat shop photo using multipart/form-data
 * 
 * @param {string} imageUri - Local file URI
 * @param {string|null} overrideToken - Optional auth token override
 * @returns {Promise<Object>} Response with photoUrl
 */
export const uploadChatShopPhotoApi = async (imageUri, overrideToken = null) => {
  console.log('📸 Starting uploadChatShopPhotoApi...');
  
  try {
    const token = overrideToken || await getStoredAuthToken();

    // Extract filename from URI
    const filename = typeof imageUri === 'string' ? imageUri.split('/').pop() : 'shop-photo.jpg';
    const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    const mimeMap = { 
      jpg: 'image/jpeg', 
      jpeg: 'image/jpeg', 
      png: 'image/png', 
      gif: 'image/gif', 
      webp: 'image/webp' 
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    console.log('📤 Uploading chat shop photo:', filename);
    console.log('🌐 API Endpoint:', API_ENDPOINTS.UPLOAD_CHAT_SHOP_PHOTO);
    console.log('📁 Using multipart/form-data');

    // Create FormData with the image file
    const formData = new FormData();
    
    // For React Native, append the file with proper format
    formData.append('chatShopPhoto', {
      uri: imageUri,
      type: mimeType,
      name: filename,
    });

    console.log('📦 FormData created, sending request...');
    console.log('📋 FormData details:', {
      fieldName: 'chatShopPhoto',
      uri: imageUri,
      type: mimeType,
      name: filename
    });

    // Use XMLHttpRequest for better React Native FormData support
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let timeoutId = null;

      // Set up timeout (120 seconds)
      timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error('Upload request timed out. Please try again.'));
      }, 120000);

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
      xhr.open('POST', API_ENDPOINTS.UPLOAD_CHAT_SHOP_PHOTO);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Don't set Content-Type - let XMLHttpRequest set it with boundary for multipart/form-data
      
      console.log('🚀 Sending XMLHttpRequest...');
      xhr.send(formData);
    });

  } catch (error) {
    console.error('❌ uploadChatShopPhotoApi error:', error.message || error);
    throw error;
  }
};
