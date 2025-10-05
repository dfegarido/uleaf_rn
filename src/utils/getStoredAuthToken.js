import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import { auth } from '../../firebase';

export const getStoredAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.warn('⚠️ No auth token found in storage');
      return null;
    }

    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp < now) {
      console.log('🔄 Token expired, attempting to refresh...');
      const user = auth.currentUser;

      if (!user) {
        console.warn('⚠️ No authenticated user found, cannot refresh token');
        return null;
      }

      const freshToken = await user.getIdToken(true); // force refresh
      await AsyncStorage.setItem('authToken', freshToken);
      console.log('✅ Token refreshed successfully');
      return freshToken;
    }

    return token;
  } catch (error) {
    console.error('❌ Error getting stored auth token:', error.message || error);
    return null;
  }
};
