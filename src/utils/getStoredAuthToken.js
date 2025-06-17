import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import {getAuth} from '@react-native-firebase/auth';
import {ensureFirebaseApp} from './ensureFirebaseApp';

export const getStoredAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;

  const decoded = jwtDecode(token);
  const now = Math.floor(Date.now() / 1000);

  if (decoded.exp < now) {
    const app = ensureFirebaseApp(); // ✅ Make sure initialized
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) return null;

    const freshToken = await user.getIdToken(true); // force refresh
    await AsyncStorage.setItem('authToken', freshToken);
    return freshToken;
  }

  return token;
};
