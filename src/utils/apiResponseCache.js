import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple AsyncStorage-backed response cache with TTL
const PREFIX = 'api_resp_cache:';

const buildKey = (endpoint, qs, userKey = 'anon') => `${PREFIX}${userKey}:${endpoint}?${qs}`;

export const getCachedResponse = async (endpoint, qs, userKey = 'anon') => {
  try {
    const key = buildKey(endpoint, qs, userKey);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { value, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return value;
  } catch (e) {
    return null;
  }
};

export const setCachedResponse = async (endpoint, qs, userKey, value, ttlMs) => {
  try {
    const key = buildKey(endpoint, qs, userKey);
    const payload = { value, expiry: Date.now() + Math.max(1000, ttlMs || 60000) };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    // ignore
  }
};

export const clearResponseCacheByPrefix = async (prefix = PREFIX) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toDelete = keys.filter(k => k.startsWith(prefix));
    if (toDelete.length) await AsyncStorage.multiRemove(toDelete);
  } catch (e) {
    // ignore
  }
};
