import { Platform, Alert } from 'react-native';
import { Video } from 'react-native-compressor';

/**
 * Video Compression Utility
 * Compresses videos before upload to reduce file size
 * Uses react-native-compressor for cross-platform support
 */

// Configuration
const MAX_VIDEO_SIZE_MB = 50; // Maximum video size in MB
const MAX_DURATION_SECONDS = 300; // 5 minutes max duration
const COMPRESSION_QUALITY = 'medium'; // low, medium, high

/**
 * Compress a video file
 * @param {string} videoUri - Local URI of the video
 * @returns {Promise<{uri: string, size: number, duration: number}>}
 */
export const compressVideo = async (videoUri) => {
  try {
    console.log('🎬 Starting video compression:', videoUri);
    
    // Get basic file info (size only, no dimensions needed)
    const fileInfo = await getFileSize(videoUri);
    console.log('📊 File size:', `${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`);

    // Check file size
    if (fileInfo.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      throw new Error(`Video size exceeds ${MAX_VIDEO_SIZE_MB}MB limit`);
    }
    
    // Try to compress video - Video.compress will handle dimensions internally
    console.log('📦 Compressing video...');
    try {
      const compressedUri = await Video.compress(videoUri, {
        compressionMethod: 'auto',
      });
      
      const compressedSize = await getFileSize(compressedUri);
      console.log('✅ Video compressed successfully', {
        original: `${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`,
        compressed: `${(compressedSize.size / 1024 / 1024).toFixed(2)}MB`,
        savings: `${(((fileInfo.size - compressedSize.size) / fileInfo.size) * 100).toFixed(1)}%`
      });

      return {
        uri: compressedUri,
        size: compressedSize.size,
        duration: 0, // Duration will be set from picker metadata
      };
    } catch (compressError) {
      // If compression fails (e.g., invalid dimensions), use original video
      console.warn('⚠️ Compression failed, using original video:', compressError.message);
      return {
        uri: videoUri,
        size: fileInfo.size,
        duration: 0,
      };
    }
  } catch (error) {
    console.error('❌ Video compression error:', error);
    // If everything fails, return original video
    console.warn('⚠️ Falling back to original video');
    return {
      uri: videoUri,
      size: 0,
      duration: 0,
    };
  }
};

/**
 * Get file size only (no video metadata needed)
 * @param {string} fileUri - Local URI of the file
 * @returns {Promise<{size: number}>}
 */
const getFileSize = async (fileUri) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return {
      size: blob.size || 0,
    };
  } catch (error) {
    console.error('Error getting file size:', error);
    return {
      size: 0,
    };
  }
};

/**
 * Validate video file
 * @param {Object} video - Video file object from image picker
 * @returns {boolean}
 */
export const validateVideo = (video) => {
  if (!video) {
    Alert.alert('Error', 'No video selected');
    return false;
  }

  // Check file type
  const validTypes = ['video/mp4', 'video/quicktime', 'video/mov'];
  if (video.type && !validTypes.includes(video.type.toLowerCase())) {
    Alert.alert('Invalid Format', 'Please select MP4 or MOV video files only');
    return false;
  }

  // Check file size
  if (video.fileSize && video.fileSize > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    Alert.alert('File Too Large', `Video must be less than ${MAX_VIDEO_SIZE_MB}MB`);
    return false;
  }

  // Check duration
  if (video.duration && video.duration > MAX_DURATION_SECONDS) {
    Alert.alert('Video Too Long', `Video must be less than ${MAX_DURATION_SECONDS / 60} minutes`);
    return false;
  }

  return true;
};

/**
 * Format video duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (mm:ss or hh:mm:ss)
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
