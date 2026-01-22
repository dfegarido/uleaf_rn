import { Platform } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';

/**
 * Video Thumbnail Generation Utility
 * Generates thumbnails from video files
 * Uses react-native-create-thumbnail for cross-platform support
 */

/**
 * Generate a thumbnail from a video file
 * @param {string} videoUri - Local URI of the video
 * @param {number} timeMs - Time in milliseconds to capture thumbnail (default: 0 = first frame)
 * @returns {Promise<{path: string, size: number, mime: string, width: number, height: number}>}
 */
export const generateVideoThumbnail = async (videoUri, timeMs = 0) => {
  try {
    console.log('🎬 Generating thumbnail for video:', videoUri);
    
    const thumbnail = await createThumbnail({
      url: videoUri,
      timeStamp: timeMs, // Time in milliseconds
      format: 'jpeg', // jpeg or png
      quality: 75, // 0-100
    });

    console.log('✅ Thumbnail generated:', thumbnail);

    return {
      path: thumbnail.path,
      size: thumbnail.size,
      mime: thumbnail.mime || 'image/jpeg',
      width: thumbnail.width,
      height: thumbnail.height,
    };
  } catch (error) {
    console.error('❌ Thumbnail generation error:', error);
    throw new Error('Failed to generate video thumbnail');
  }
};

/**
 * Generate multiple thumbnails from a video (for preview/scrubbing)
 * @param {string} videoUri - Local URI of the video
 * @param {number} duration - Video duration in milliseconds
 * @param {number} count - Number of thumbnails to generate (default: 5)
 * @returns {Promise<Array<{path: string, timestamp: number}>>}
 */
export const generateVideoThumbnails = async (videoUri, duration, count = 5) => {
  try {
    console.log(`🎬 Generating ${count} thumbnails for video:`, videoUri);
    
    const thumbnails = [];
    const interval = duration / (count + 1); // Space them evenly
    
    for (let i = 1; i <= count; i++) {
      const timestamp = Math.floor(interval * i);
      const thumbnail = await generateVideoThumbnail(videoUri, timestamp);
      thumbnails.push({
        ...thumbnail,
        timestamp,
      });
    }

    console.log(`✅ Generated ${thumbnails.length} thumbnails`);
    return thumbnails;
  } catch (error) {
    console.error('❌ Multiple thumbnails generation error:', error);
    throw new Error('Failed to generate video thumbnails');
  }
};

/**
 * Get default thumbnail (first frame)
 * @param {string} videoUri - Local URI of the video
 * @returns {Promise<{path: string, size: number, mime: string}>}
 */
export const getDefaultThumbnail = async (videoUri) => {
  return generateVideoThumbnail(videoUri, 0);
};
