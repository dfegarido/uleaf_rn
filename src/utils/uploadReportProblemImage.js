// utils/uploadReportProblemImage.js
import {getStoredAuthToken} from './getStoredAuthToken';
import {API_ENDPOINTS} from '../config/apiConfig';

/**
 * Uploads a report-problem attachment image to Supabase Storage.
 * Replaces the legacy uploadImageToFirebase path (Firebase Storage) used by
 * ScreenProfileProblem. Uploads via the report-problem-photo-upload edge fn
 * and returns the public Supabase Storage URL.
 *
 * @param {string} fileUri - Local image URI from the image picker
 * @returns {Promise<string>} Public Supabase Storage URL
 */
export const uploadReportProblemImage = async (fileUri) => {
  if (!fileUri) {
    throw new Error('Image URI is required.');
  }

  const token = await getStoredAuthToken();

  const filename = fileUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const formData = new FormData();
  formData.append('image', {
    uri: fileUri,
    type: mimeType,
    name: filename,
  });

  // Use XMLHttpRequest for reliable React Native FormData / multipart upload.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timeoutId = setTimeout(() => {
      xhr.abort();
      reject(new Error('Upload request timed out. Please try again.'));
    }, 120000);

    xhr.onload = function() {
      clearTimeout(timeoutId);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (!json.success) {
            reject(new Error(json.error || 'Upload failed'));
            return;
          }
          const url = json.photoUrl || json.url;
          if (!url) {
            reject(new Error('No image URL returned from server'));
            return;
          }
          resolve(url);
        } catch (parseError) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Error ${xhr.status}: ${xhr.responseText || 'Unknown error'}`));
      }
    };

    xhr.onerror = function() {
      clearTimeout(timeoutId);
      reject(new Error('Network error during upload. Please check your connection.'));
    };

    xhr.ontimeout = function() {
      clearTimeout(timeoutId);
      reject(new Error('Upload request timed out. Please try again.'));
    };

    xhr.open('POST', API_ENDPOINTS.POST_REPORT_PROBLEM_PHOTO_UPLOAD);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
