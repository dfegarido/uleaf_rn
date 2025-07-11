// AuthContext.js
import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAuth, signOut, onIdTokenChanged} from '@react-native-firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        // console.log('auth context:' + token);
        setIsLoggedIn(!!token);
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
      await signOut(auth); // Updated logout with modular API
      await AsyncStorage.removeItem('authToken');
      setIsLoggedIn(false);
    } catch (e) {
      console.log('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Track token changes and update AsyncStorage automatically
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
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{isLoggedIn, setIsLoggedIn, isLoading, logout}}>
      {children}
    </AuthContext.Provider>
  );
};
