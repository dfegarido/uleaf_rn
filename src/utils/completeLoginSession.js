import AsyncStorage from '@react-native-async-storage/async-storage';
import {getProfileInfoApi} from '../components/Api';
import {getB2BAccountApi} from '../components/Api/b2bAccountApi';
import {B2B_APP_SHELL_KEY, mergeB2BAccountIntoUserInfo} from './b2bShell';

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
  setAppShell,
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
      try {
        const b2b = await getB2BAccountApi();
        if (b2b.success && b2b.data?.account) {
          profileData = mergeB2BAccountIntoUserInfo(profile, b2b.data.account);
          setUserInfo(profileData);
          await AsyncStorage.setItem('userInfo', JSON.stringify(profileData));
        }
      } catch (b2bError) {
        console.log('B2B account merge skipped', b2bError?.message);
      }
    }
  } catch (profileError) {
    console.error('Profile fetch error:', profileError);
  }

  await AsyncStorage.setItem(B2B_APP_SHELL_KEY, 'shop');
  if (typeof setAppShell === 'function') {
    await setAppShell('shop');
  }

  if (!deferLoggedIn) {
    setIsLoggedIn(true);
  }

  return profileData;
}
