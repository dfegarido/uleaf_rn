// AuthContext.js
import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApp} from '@react-native-firebase/app';
import {getAuth, signOut, onIdTokenChanged} from '@react-native-firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const auth = getAuth(getApp()); // ✅ Modern modular API (RN Firebase >=18+)

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
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
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('authToken');
      setIsLoggedIn(false);
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
          const token = await user.getIdToken();
          await AsyncStorage.setItem('authToken', token);
          setIsLoggedIn(true);
        } catch (e) {
          console.log('Error refreshing token:', e);
        }
      } else {
        await AsyncStorage.removeItem('authToken');
        setIsLoggedIn(false);
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
