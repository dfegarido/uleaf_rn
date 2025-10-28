// AuthContext.js
import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use Web Firebase SDK to avoid relying on native default app initialization
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import {getBuyerProfileApi} from '../components/Api/buyerProfileApi';
import {checkMaintenanceApi} from '../components/Api/maintenanceApi';

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
        const hasToken = !!token;
        setIsLoggedIn(hasToken);

        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        // Only set userInfo from storage if we actually have a token
        if (hasToken && storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        } else if (!hasToken && storedUserInfo) {
          // Clear stale userInfo when there's no token to avoid accidental role-based redirects
          await AsyncStorage.removeItem('userInfo');
          setUserInfo(null);
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
        // Ensure isLoggedIn is cleared when there's no authenticated user
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check maintenance status periodically and force logout if enabled
  useEffect(() => {
    const checkMaintenanceAndLogout = async () => {
      try {
        const response = await checkMaintenanceApi();
        
        if (response.success && response.data?.maintenance?.enabled) {
          // Force logout if maintenance is enabled
          console.log('🔧 Maintenance mode enabled, forcing logout');
          await logout();
        }
      } catch (error) {
        console.error('Error checking maintenance in AuthProvider:', error);
      }
    };

    // Check every 5 minutes when user is logged in
    const interval = setInterval(() => {
      if (isLoggedIn) {
        checkMaintenanceAndLogout();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const updateProfileImage = async newImage => {
    try {
      setUserInfo(prev => {
        const updatedUserInfo = {
          ...prev,
          profileImage: newImage,
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
