import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

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
 * Upload image to backend API (instead of direct Firebase upload)
 * 
 * The backend will:
 * 1. Receive the image file (as base64 in JSON)
 * 2. Upload to Firebase Storage
 * 3. Trigger Cloud Function for WebP conversion
 * 4. Return the public URL
 * 
 * This function respects the USE_LOCAL_API setting in apiConfig.js:
 * - When USE_LOCAL_API = true: Uses local emulator (http://10.0.2.2:5001/...)
 * - When USE_LOCAL_API = false: Uses production (https://uploadlistingimage-nstilwgvua-uc.a.run.app)
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
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    console.log('📤 Uploading image to backend:', filename);
    console.log('🌐 API Endpoint:', API_ENDPOINTS.UPLOAD_LISTING_IMAGE);

    // Read file as base64 using XMLHttpRequest
    const base64 = await readFileAsBase64(uri);

    console.log('📦 Converted to base64, size:', Math.round(base64.length / 1024), 'KB');

    // Send as JSON with base64 data
    const response = await fetch(
      API_ENDPOINTS.UPLOAD_LISTING_IMAGE,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          filename: filename,
          mimeType: type,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    
    if (!json.success) {
      throw new Error(json.error || 'Upload failed');
    }

    console.log('✅ Upload successful:', json.url);
    return json.url;

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
