import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Retrieve persisted user info from AsyncStorage.
 * Expects AuthProvider to have stored it under key 'userInfo'.
 * Returns parsed object or null if not found/invalid.
 */
export const getStoredUserInfo = async () => {
  try {
    const raw = await AsyncStorage.getItem('userInfo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    console.warn('getStoredUserInfo: failed to parse userInfo from storage', e?.message || e);
    return null;
  }
};

/**
 * Convenience: attempt to extract an admin identifier from userInfo.
 * Tries common keys: uid, id, adminId, userId.
 */
export const getStoredAdminId = async () => {
  const info = await getStoredUserInfo();
  if (!info) return null;
  return info.data.uid || null;
};