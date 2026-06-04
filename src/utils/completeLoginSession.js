import AsyncStorage from '@react-native-async-storage/async-storage';
import {getProfileInfoApi} from '../components/Api';

export function isSupplierAccount(userData) {
  return userData?.user?.userType === 'supplier';
}

async function storeProfilePhotoFromProfile(profile) {
  const profilePhotoUrl =
    profile?.data?.profilePhotoUrl ||
    profile?.data?.profileImage ||
    profile?.user?.profilePhotoUrl ||
    profile?.user?.profileImage ||
    profile?.profilePhotoUrl ||
    profile?.profileImage ||
    null;

  if (!profilePhotoUrl) {
    return;
  }

  const timestamp = Date.now();
  const cacheBustedUrl = `${profilePhotoUrl}${profilePhotoUrl.includes('?') ? '&' : '?'}cb=${timestamp}`;
  await AsyncStorage.setItem('profilePhotoUrl', profilePhotoUrl);
  await AsyncStorage.setItem('profilePhotoUrlWithTimestamp', cacheBustedUrl);
}

export async function completeLoginSession({
  idToken,
  setIsLoggedIn,
  setUserInfo,
  deferLoggedIn = false,
}) {
  await AsyncStorage.setItem('authToken', idToken);
  await AsyncStorage.setItem('loginPhase', 'otp_verified');

  let profileData = null;
  try {
    const profile = await getProfileInfoApi();
    if (profile?.success) {
      profileData = profile;
      setUserInfo(profile);
      await AsyncStorage.setItem('userInfo', JSON.stringify(profile));
      await storeProfilePhotoFromProfile(profile);
    }
  } catch (profileError) {
    console.error('Profile fetch error:', profileError);
  }

  if (!deferLoggedIn) {
    setIsLoggedIn(true);
  }

  return profileData;
}
