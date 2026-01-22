import { Alert } from 'react-native';
import { API_ENDPOINTS } from '../config/apiConfig';
import { getStoredAuthToken } from './getStoredAuthToken';

/**
 * Upload Chat Video Utility
 * Handles video upload to backend with progress tracking
 * Similar to uploadChatImage but for video files
 */

/**
 * Upload a video file to the server
 * @param {string} videoUri - Local URI of the video file
 * @param {string} thumbnailUri - Local URI of the thumbnail image
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<{videoUrl: string, thumbnailUrl: string}>}
 */
export const uploadChatVideo = async (videoUri, thumbnailUri, onProgress = null) => {
  try {
    console.log('📤 Uploading chat video:', videoUri);
    console.log('📤 Uploading thumbnail:', thumbnailUri);
    
    // Get auth token
    const token = await getStoredAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`📊 Upload progress: ${percentComplete}%`);
          if (onProgress) {
            onProgress(percentComplete);
          }
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Video upload response:', response);

            if (response.success && response.data) {
              resolve({
                videoUrl: response.data.videoUrl || response.data.url,
                thumbnailUrl: response.data.thumbnailUrl,
              });
            } else {
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (error) {
            console.error('❌ Parse upload response error:', error);
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          console.error('❌ Upload failed with status:', xhr.status);
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ Upload network error');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.log('⚠️ Upload aborted');
        reject(new Error('Upload aborted'));
      });

      // Prepare form data
      const formData = new FormData();

      // Add video file
      const videoFileName = videoUri.split('/').pop();
      const videoFileType = videoFileName.split('.').pop();
      formData.append('video', {
        uri: videoUri,
        type: `video/${videoFileType === 'mov' ? 'quicktime' : videoFileType}`,
        name: videoFileName,
      });

      // Add thumbnail file
      if (thumbnailUri) {
        const thumbnailFileName = thumbnailUri.split('/').pop();
        formData.append('thumbnail', {
          uri: thumbnailUri,
          type: 'image/jpeg',
          name: thumbnailFileName || 'thumbnail.jpg',
        });
      }

      // Send request
      xhr.open('POST', API_ENDPOINTS.UPLOAD_CHAT_VIDEO);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Note: Don't set Content-Type for multipart/form-data, browser sets it with boundary
      xhr.send(formData);
    });
  } catch (error) {
    console.error('❌ Upload chat video error:', error);
    Alert.alert('Upload Error', 'Failed to upload video. Please try again.');
    throw error;
  }
};

/**
 * Cancel ongoing upload (for future implementation)
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest object
 */
export const cancelVideoUpload = (xhr) => {
  if (xhr) {
    xhr.abort();
  }
};
