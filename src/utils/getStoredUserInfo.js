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
  try {
    const info = await getStoredUserInfo();
    if (!info) {
      console.warn('⚠️ No user info found in storage');
      return null;
    }
    
    // Try different possible structures
    // Structure can be: info.user.uid, info.data.uid, info.uid, etc.
    const adminId = 
      info?.user?.uid || 
      info?.data?.uid || 
      info?.uid || 
      info?.id || 
      info?.adminId || 
      info?.userId || 
      null;
    
    if (!adminId) {
      console.warn('⚠️ Could not extract admin ID from user info:', JSON.stringify(info));
    } else {
      console.log('✅ Admin ID extracted successfully:', adminId);
    }
    
    return adminId;
  } catch (error) {
    console.error('❌ Error getting stored admin ID:', error.message || error);
    return null;
  }
};