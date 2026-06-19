import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Upload buyer content photo (Deals, Rewards, News) using multipart/form-data
 *
 * @param {string} imageUri - Local file URI
 * @param {string|null} overrideToken - Optional auth token override
 * @returns {Promise<Object>} Response with photoUrl
 */
export const uploadBuyerContentPhotoApi = async (imageUri, overrideToken = null) => {
  try {
    const token = overrideToken || await getStoredAuthToken();

    const filename = typeof imageUri === 'string' ? imageUri.split('/').pop() : 'content-photo.jpg';
    const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const formData = new FormData();
    formData.append('buyerContentPhoto', {
      uri: imageUri,
      type: mimeType,
      name: filename,
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let timeoutId = null;

      timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error('Upload request timed out. Please try again.'));
      }, 120000);

      xhr.onload = function () {
        clearTimeout(timeoutId);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);

            if (!result.success) {
              reject(new Error(result.error || result.message || 'Upload failed'));
              return;
            }

            resolve(result);
          } catch (parseError) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText || 'Unknown error'}`));
        }
      };

      xhr.onerror = function () {
        clearTimeout(timeoutId);
        reject(new Error('Network error during upload. Please check your connection.'));
      };

      xhr.ontimeout = function () {
        clearTimeout(timeoutId);
        reject(new Error('Upload request timed out. Please try again.'));
      };

      xhr.open('POST', API_ENDPOINTS.UPLOAD_BUYER_CONTENT_PHOTO);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (error) {
    throw error;
  }
};
