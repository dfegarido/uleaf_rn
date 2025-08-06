import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  SORT: 'dropdown_sort',
  GENUS: 'dropdown_genus',
  VARIEGATION: 'dropdown_variegation',
  COUNTRY: 'dropdown_country',
  LISTING_TYPE: 'dropdown_listing_type',
  SHIPPING_INDEX: 'dropdown_shipping_index',
  ACCLIMATION_INDEX: 'dropdown_acclimation_index',
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Store data in cache with timestamp
 * @param {string} key - Cache key
 * @param {Array} data - Data to cache
 */
export const setCacheData = async (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    console.log(`Cache saved for ${key}`);
  } catch (error) {
    console.error(`Error saving cache for ${key}:`, error);
  }
};

/**
 * Get data from cache if not expired
 * @param {string} key - Cache key
 * @returns {Array|null} Cached data or null if expired/not found
 */
export const getCacheData = async (key) => {
  try {
    const cachedItem = await AsyncStorage.getItem(key);
    if (!cachedItem) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cachedItem);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY) {
      console.log(`Cache expired for ${key}, removing...`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    console.log(`Cache hit for ${key}`);
    return data;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
};

/**
 * Clear all dropdown cache
 */
export const clearAllDropdownCache = async () => {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('All dropdown cache cleared');
  } catch (error) {
    console.error('Error clearing dropdown cache:', error);
  }
};

/**
 * Check if cache exists for a key
 * @param {string} key - Cache key
 * @returns {boolean} True if cache exists and not expired
 */
export const hasCacheData = async (key) => {
  const data = await getCacheData(key);
  return data !== null;
};

export { CACHE_KEYS };

/**
 * Preload all dropdown data and cache it
 * This can be called during app startup for better performance
 * @param {Object} apis - Object containing all API functions
 */
export const preloadAllDropdownData = async (apis) => {
  try {
    console.log('Starting preload of all dropdown data...');
    
    const tasks = [];
    
    // Check cache and load data if not cached
    const loadIfNotCached = async (cacheKey, apiFunction, mapFunction) => {
      const cachedData = await getCacheData(cacheKey);
      if (!cachedData && apiFunction) {
        try {
          const res = await apiFunction();
          if (res?.success && res.data) {
            const mappedData = mapFunction ? mapFunction(res.data) : res.data;
            await setCacheData(cacheKey, mappedData);
            console.log(`Preloaded and cached ${cacheKey}`);
          }
        } catch (error) {
          console.error(`Error preloading ${cacheKey}:`, error);
        }
      }
    };

    // Sort options (static data)
    const sortOptions = [
      {label: 'Newest to Oldest', value: 'Newest to Oldest'},
      {label: 'Price Low to High', value: 'Price Low to High'},
      {label: 'Price High to Low', value: 'Price High to Low'},
      {label: 'Most Loved', value: 'Most Loved'},
    ];
    const cachedSort = await getCacheData(CACHE_KEYS.SORT);
    if (!cachedSort) {
      await setCacheData(CACHE_KEYS.SORT, sortOptions);
    }

    // Dynamic dropdown data
    if (apis.getGenusApi) {
      tasks.push(loadIfNotCached(
        CACHE_KEYS.GENUS,
        apis.getGenusApi,
        (data) => data.map(item => ({ label: item.name, value: item.name }))
      ));
    }

    if (apis.getVariegationApi) {
      tasks.push(loadIfNotCached(
        CACHE_KEYS.VARIEGATION,
        apis.getVariegationApi,
        (data) => data.map(item => ({ label: item.name, value: item.name }))
      ));
    }

    if (apis.getCountryApi) {
      tasks.push(loadIfNotCached(
        CACHE_KEYS.COUNTRY,
        apis.getCountryApi,
        (data) => data.map(item => ({ 
          label: item.name || item.country, 
          value: item.name || item.country 
        }))
      ));
    }

    if (apis.getListingTypeApi) {
      tasks.push(loadIfNotCached(
        CACHE_KEYS.LISTING_TYPE,
        apis.getListingTypeApi,
        (data) => data.map(item => ({ 
          label: item.name || item.listingType, 
          value: item.name || item.listingType 
        }))
      ));
    }

    if (apis.getShippingIndexApi) {
      tasks.push(loadIfNotCached(
        CACHE_KEYS.SHIPPING_INDEX,
        apis.getShippingIndexApi,
        (data) => data.map(item => ({ 
          label: item.name || item.shippingIndex, 
          value: item.name || item.shippingIndex 
        }))
      ));
    }

    if (apis.getAcclimationIndexApi) {
      tasks.push(loadIfNotCached(
        CACHE_KEYS.ACCLIMATION_INDEX,
        apis.getAcclimationIndexApi,
        (data) => data.map(item => ({ 
          label: item.name || item.acclimationIndex, 
          value: item.name || item.acclimationIndex 
        }))
      ));
    }

    // Execute all preload tasks
    await Promise.allSettled(tasks);
    console.log('Preload of dropdown data completed');
    
  } catch (error) {
    console.error('Error in preloadAllDropdownData:', error);
  }
};
