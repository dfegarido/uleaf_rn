import { Platform } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import RNFS from 'react-native-fs';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeLocalVideoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return uri;
  // iOS AVFoundation is happiest with file:// URLs for local files.
  if (Platform.OS === 'ios') {
    if (uri.startsWith('file://')) return uri;
    if (uri.startsWith('/')) return `file://${uri}`;
  }
  return uri;
};

const waitForFileToStabilize = async (uri, attempts = 6, delayMs = 150) => {
  // Only try to validate local file paths; if it's not a local path, just proceed.
  const path = typeof uri === 'string' ? uri.replace(/^file:\/\//, '') : null;
  if (!path || !path.startsWith('/')) return;

  let lastSize = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const exists = await RNFS.exists(path);
      if (!exists) {
        await sleep(delayMs);
        continue;
      }

      const stat = await RNFS.stat(path);
      const size = Number(stat?.size || 0);
      if (size <= 0) {
        await sleep(delayMs);
        continue;
      }

      // If size stops changing, assume the file write is finished.
      if (lastSize !== null && size === lastSize) {
        return;
      }
      lastSize = size;
      await sleep(delayMs);
    } catch {
      await sleep(delayMs);
    }
  }
};

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
    const normalizedUri = normalizeLocalVideoUri(videoUri);
    console.log('🎬 Generating thumbnail for video:', normalizedUri);

    // On iOS, thumbnail generation can fail if the file is still being written.
    // Wait briefly for the file to exist and stabilize before attempting.
    await waitForFileToStabilize(normalizedUri);
    
    // Some encodings fail at the first frame; retry a couple times with a later timestamp.
    const candidateTimestamps = [
      Math.max(0, Number(timeMs) || 0),
      500,
      1000,
    ].filter((v, idx, arr) => arr.indexOf(v) === idx);

    let lastError = null;
    for (const ts of candidateTimestamps) {
      try {
        const thumbnail = await createThumbnail({
          url: normalizedUri,
          timeStamp: ts, // Time in milliseconds
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
      } catch (e) {
        lastError = e;
        // If it fails, try the next timestamp.
      }
    }

    throw lastError || new Error('Unknown thumbnail generation error');
  } catch (error) {
    console.error('❌ Thumbnail generation error:', error);
    const msg = error?.message ? `Failed to generate video thumbnail: ${error.message}` : 'Failed to generate video thumbnail';
    throw new Error(msg);
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
