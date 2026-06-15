/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Ensure Firebase is initialized before providers mount
import './firebase';
import { AuthProvider } from './src/auth/AuthProvider';
import { getGenusApi, getVariegationApi } from './src/components/Api/dropdownApi';
import AppNavigation from './src/components/AppNavigation';
import { FilterProvider } from './src/context/FilterContext';
import { LovedListingsProvider } from './src/context/LovedListingsContext';
import { CACHE_KEYS, clearSpecificDropdownCache, preloadAllDropdownData } from './src/utils/dropdownCache';
import { clearExpiredImageCache } from './src/utils/imageCache';

const App = () => {
  // Warm key caches at startup for faster first paint on buyer screens
  useEffect(() => {
    // Clear old caches for country, listing type, shipping index, and acclimation index
    // These dropdowns will now always fetch fresh data from API
    clearSpecificDropdownCache([
      CACHE_KEYS.COUNTRY,
      CACHE_KEYS.LISTING_TYPE,
      CACHE_KEYS.SHIPPING_INDEX,
      CACHE_KEYS.ACCLIMATION_INDEX
    ]);

    preloadAllDropdownData({
      getGenusApi,
      getVariegationApi,
      // Removed: getCountryApi, getListingTypeApi, getShippingIndexApi, getAcclimationIndexApi
      // These will now fetch fresh data directly from components
    });
    // Opportunistically clean expired image cache
    clearExpiredImageCache();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AuthProvider>
          <FilterProvider>
            <LovedListingsProvider>
              <AppNavigation />
            </LovedListingsProvider>
          </FilterProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
