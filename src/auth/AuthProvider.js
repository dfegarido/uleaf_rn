// AuthContext.js
import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAuth, signOut, onIdTokenChanged} from '@react-native-firebase/auth';
import {getBuyerProfileApi} from '../components/Api/buyerProfileApi';

export const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);

        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
        // If logged in, fetch buyer profile to ensure AsyncStorage has buyerProfile/profilePhotoUrl
        if (token) {
          try {
            const profile = await getBuyerProfileApi();
            if (profile) {
              // Merge with existing stored userInfo if any
              const merged = {
                ...(storedUserInfo ? JSON.parse(storedUserInfo) : {}),
                ...profile,
                profileImage: profile.profilePhotoUrl || (storedUserInfo ? JSON.parse(storedUserInfo).profileImage : ''),
              };
              setUserInfo(merged);
              await AsyncStorage.setItem('userInfo', JSON.stringify(merged));
            }
          } catch (e) {
            console.warn('Failed to fetch buyer profile on startup:', e?.message || e);
          }
        }
      } catch (e) {
        console.log('Error checking login status', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const logout = async () => {
    setIsLoading(true);

    const auth = getAuth();

    try {
      await signOut(auth);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setUserInfo(null);
    } catch (e) {
      console.log('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onIdTokenChanged(auth, async user => {
      if (user) {
        try {
          const newToken = await user.getIdToken();
          await AsyncStorage.setItem('authToken', newToken);
        } catch (e) {
          console.log('Error refreshing token:', e);
        }
      } else {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userInfo');
        setUserInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateProfileImage = async newImage => {
    try {
      // Strip any cache-busting query params to store canonical URL
      const canonical = typeof newImage === 'string' ? newImage.split('?')[0] : newImage;
      const timestamp = Date.now();

      setUserInfo(prev => {
        const updatedUserInfo = {
          ...prev,
          profileImage: canonical,
          profileImageTimestamp: timestamp,
        };

        // Save to AsyncStorage
        AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

        return updatedUserInfo;
      });
    } catch (error) {
      console.log('Error updating profile image:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        isLoading,
        logout,
        userInfo,
        setUserInfo,
        user: userInfo, // Add user property that references userInfo
        updateProfileImage,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
