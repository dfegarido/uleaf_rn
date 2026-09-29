/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Ensure Firebase is initialized before providers mount
import './firebase';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { useUserPresence } from './src/hooks/useUserPresence';
import { getGenusApi, getVariegationApi } from './src/components/Api/dropdownApi';
import AppNavigation from './src/components/AppNavigation';
import { FilterProvider } from './src/context/FilterContext';
import { LovedListingsProvider } from './src/context/LovedListingsContext';
import { CACHE_KEYS, clearSpecificDropdownCache, preloadAllDropdownData } from './src/utils/dropdownCache';
import { clearExpiredImageCache } from './src/utils/imageCache';
import NotificationService from './src/services/notifications/NotificationService';
import { addTokenToBuyer, removeTokenFromBuyer } from './src/services/notifications/buyerFcmTokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Warm key caches at startup for faster first paint on buyer screens
  useEffect(() => {
    clearSpecificDropdownCache([
      CACHE_KEYS.COUNTRY,
      CACHE_KEYS.LISTING_TYPE,
      CACHE_KEYS.SHIPPING_INDEX,
      CACHE_KEYS.ACCLIMATION_INDEX,
    ]);
    preloadAllDropdownData({
      getGenusApi,
      getVariegationApi,
    });
    clearExpiredImageCache();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationBootstrapper>
              <FilterProvider>
                <LovedListingsProvider>
                  <AppNavigation />
                </LovedListingsProvider>
              </FilterProvider>
            </NotificationBootstrapper>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
};

// Inner component: has access to AuthContext so it can react to login/logout
// and run NotificationService.init / requestPermissionAndRegister / dispose.
const NotificationBootstrapper = ({ children }) => {
  const { isLoggedIn, userInfo } = useAuth();

  // Presence must be tracked for as long as the user is signed in, not only while a
  // chat is open. It previously lived inside ChatScreen, so everyone appeared offline
  // unless they happened to be reading a conversation — which made the 1:1 header
  // ("Active now") and the group member count both meaningless. Mounted here it
  // covers the whole signed-in session and still flips offline on background/logout.
  const currentUserUid =
    userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  useUserPresence(isLoggedIn ? currentUserUid : '');

  useEffect(() => {
    NotificationService.init(null, {
      writeToken: addTokenToBuyer,
      removeToken: removeTokenFromBuyer,
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn && userInfo && userInfo.uid) {
      // Register the FCM token silently. Notifications are opt-out by default;
      // the OS system prompt is only shown if the user explicitly enables
      // notifications from the Notification Settings screen.
      NotificationService.registerWithoutPrompting(userInfo.uid, {
        writeToken: addTokenToBuyer,
        removeToken: removeTokenFromBuyer,
      });
    } else {
      NotificationService.dispose();
    }
  }, [isLoggedIn, userInfo]);

  return children;
};

export default App;
