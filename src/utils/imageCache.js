import AsyncStorage from '@react-native-async-storage/async-storage';

// Image cache configuration
const IMAGE_CACHE_PREFIX = 'image_cache_';
const DEFAULT_CACHE_EXPIRY_DAYS = 7; // Default cache expiry

/**
 * Get cached image URI if available and not expired
 * @param {string} originalUri - The original image URI
 * @param {number} expiryDays - Cache expiry in days (default: 7)
 * @returns {Promise<string|null>} - Cached URI or null if not found/expired
 */
export const getCachedImageUri = async (originalUri, expiryDays = DEFAULT_CACHE_EXPIRY_DAYS) => {
  try {
    if (!originalUri) return null;
    
    const cacheKey = `${IMAGE_CACHE_PREFIX}${encodeURIComponent(originalUri)}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { uri, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      const expiryTime = timestamp + (expiryDays * 24 * 60 * 60 * 1000);
      
      // Check if cache is still valid
      if (now < expiryTime) {
        return uri;
      } else {
        // Cache expired, remove it
        await AsyncStorage.removeItem(cacheKey);
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Cache image URI with timestamp
 * @param {string} uri - The image URI to cache
 * @param {string} originalUri - The original image URI (used as key)
 * @param {number} expiryDays - Cache expiry in days (default: 7)
 */
export const setCachedImageUri = async (uri, originalUri, expiryDays = DEFAULT_CACHE_EXPIRY_DAYS) => {
  try {
    if (!uri || !originalUri) return;
    
    const cacheKey = `${IMAGE_CACHE_PREFIX}${encodeURIComponent(originalUri)}`;
    const cacheData = {
      uri: uri,
      timestamp: Date.now(),
      expiryDays: expiryDays
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    // Silently fail - caching is not critical
  }
};

/**
 * Clear all cached images
 */
export const clearImageCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imageCacheKeys = keys.filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
    
    if (imageCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(imageCacheKeys);
    }
  } catch (error) {
    // Silently fail
  }
};

/**
 * Clear expired cached images
 */
export const clearExpiredImageCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imageCacheKeys = keys.filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
    const expiredKeys = [];
    
    for (const key of imageCacheKeys) {
      try {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const { timestamp, expiryDays = DEFAULT_CACHE_EXPIRY_DAYS } = JSON.parse(cachedData);
          const now = Date.now();
          const expiryTime = timestamp + (expiryDays * 24 * 60 * 60 * 1000);
          
          if (now >= expiryTime) {
            expiredKeys.push(key);
          }
        }
      } catch (error) {
        // If we can't parse the data, consider it expired
        expiredKeys.push(key);
      }
    }
    
    if (expiredKeys.length > 0) {
      await AsyncStorage.multiRemove(expiredKeys);
    }
  } catch (error) {
    // Silently fail
  }
};

/**
 * Get cache statistics
 * @returns {Promise<{totalCached: number, totalSize: string}>}
 */
export const getImageCacheStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imageCacheKeys = keys.filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
    
    let totalSize = 0;
    for (const key of imageCacheKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      } catch (error) {
        // Continue counting other items
      }
    }
    
    // Convert bytes to human readable format
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return {
      totalCached: imageCacheKeys.length,
      totalSize: formatSize(totalSize)
    };
  } catch (error) {
    return {
      totalCached: 0,
      totalSize: '0 B'
    };
  }
};

// Predefined cache configurations for different image types
export const CACHE_CONFIGS = {
  PLANT_IMAGES: { expiryDays: 7 },
  EVENTS_IMAGES: { expiryDays: 10 },
  GENUS_IMAGES: { expiryDays: 30 }, // Genus images change less frequently
  PROFILE_IMAGES: { expiryDays: 3 },
  TEMPORARY_IMAGES: { expiryDays: 1 }
};
