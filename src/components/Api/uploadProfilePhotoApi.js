import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Read local file as base64 using XMLHttpRequest
 * This works in React Native without requiring additional native modules
 */
const readFileAsBase64 = (uri) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = function() {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });
};

/**
 * Upload profile photo using JSON/base64 approach (React Native friendly)
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

    // Read file as base64 using XMLHttpRequest
    const base64 = await readFileAsBase64(imageUri);

    console.log('📦 Converted to base64, size:', Math.round(base64.length / 1024), 'KB');

    // Send as JSON with base64 data
    const response = await fetch(API_ENDPOINTS.UPLOAD_PROFILE_PHOTO, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        filename: filename,
        mimeType: mimeType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload response:', result);

    if (!result.success) {
      throw new Error(result.error || result.message || 'Upload failed');
    }

    return result;

  } catch (error) {
    console.error('❌ uploadProfilePhotoApi error:', error.message || error);
    throw error;
  }
};

