import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';
import RNFS from 'react-native-fs';

/**
 * Upload profile photo using base64 JSON (Supabase Edge Function).
 *
 * Reads the local image file as base64 and POSTs it to the
 * /profile-photo-upload Edge Function, which stores it in the Supabase
 * `profiles` Storage bucket and updates the buyer/supplier row.
 *
 * @param {string} imageUri - Local file URI (or an already-uploaded URL, which is returned as-is)
 * @param {string|null} overrideToken - Optional auth token override
 * @returns {Promise<Object>} Response with profilePhotoUrl
 */
export const uploadProfilePhotoApi = async (imageUri, overrideToken = null) => {
  console.log('Starting uploadProfilePhotoApi...');

  try {
    const token = overrideToken || await getStoredAuthToken();

    // If it's already a URL, return it as-is (nothing to upload).
    if (typeof imageUri === 'string' && (imageUri.startsWith('http://') || imageUri.startsWith('https://'))) {
      console.log('ℹ️ Image is already a URL, returning as-is:', imageUri);
      return { success: true, profilePhotoUrl: imageUri, profileImage: imageUri };
    }

    // Extract filename + mime from the URI.
    const filename = typeof imageUri === 'string' ? imageUri.split('/').pop() : 'photo.jpg';
    const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    console.log('📤 Reading image as base64:', filename);
    const base64 = await RNFS.readFile(imageUri, 'base64');

    console.log('🌐 API Endpoint:', API_ENDPOINTS.POST_PROFILE_PHOTO_UPLOAD);

    const response = await fetch(API_ENDPOINTS.POST_PROFILE_PHOTO_UPLOAD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: base64,
        filename,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText || 'Unknown error'}`);
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
