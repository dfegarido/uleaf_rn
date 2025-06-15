import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';

import {getAuth} from 'firebase/auth';

export const getStoredAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;

  const decoded = jwtDecode(token); // call default exported function
  const now = Math.floor(Date.now() / 1000);

  if (decoded.exp < now) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;

    const freshToken = await user.getIdToken(true); // force refresh
    await AsyncStorage.setItem('authToken', freshToken);
    return freshToken;
  }

  return token;
};
