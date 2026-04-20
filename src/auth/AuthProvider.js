// AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
// Use Web Firebase SDK to avoid relying on native default app initialization
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { checkMaintenanceApi } from '../components/Api/maintenanceApi';

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
        // #region agent log
        fetch('http://127.0.0.1:7925/ingest/9a196955-a083-44bc-acca-b2ca885f3d02',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a9adf'},body:JSON.stringify({sessionId:'0a9adf',hypothesisId:'H8',location:'AuthProvider.js:checkLogin',message:'checkLoginStatus token read',data:{hasToken:!!token},timestamp:Date.now(),runId:'pre-fix'})}).catch(()=>{});
        // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7925/ingest/9a196955-a083-44bc-acca-b2ca885f3d02',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a9adf'},body:JSON.stringify({sessionId:'0a9adf',hypothesisId:'H1',location:'AuthProvider.js:checkLogin-finally',message:'checkLoginStatus finally: setting isLoading false',data:{},timestamp:Date.now(),runId:'pre-fix'})}).catch(()=>{});
        // #endregion
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      if (auth) {
        await signOut(auth);
      }
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setUserInfo(null);
    } catch (e) {
      console.log('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }
    const unsubscribe = onIdTokenChanged(auth, async user => {
      // #region agent log
      fetch('http://127.0.0.1:7925/ingest/9a196955-a083-44bc-acca-b2ca885f3d02',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a9adf'},body:JSON.stringify({sessionId:'0a9adf',hypothesisId:'H10',location:'AuthProvider.js:onIdTokenChanged',message:'onIdTokenChanged fired',data:{hasUser:!!user,uid:user?.uid||null},timestamp:Date.now(),runId:'pre-fix'})}).catch(()=>{});
      // #endregion
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
  }, [isLoggedIn, logout]);

  const updateProfileImage = useCallback(async newImage => {
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
  }, []);

  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      setIsLoggedIn,
      isLoading,
      logout,
      userInfo,
      setUserInfo,
      user: userInfo,
      updateProfileImage,
    }),
    [isLoggedIn, isLoading, logout, userInfo, updateProfileImage],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
