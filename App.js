/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { useEffect } from 'react';
// Ensure Firebase is initialized before providers mount
import './firebase';
import {SafeAreaView, StyleSheet, Text} from 'react-native';
import AppNavigation from './src/components/AppNavigation';
import {AuthProvider} from './src/auth/AuthProvider';
import {FilterProvider} from './src/context/FilterContext';
import {LovedListingsProvider} from './src/context/LovedListingsContext';
import { preloadAllDropdownData, clearSpecificDropdownCache, CACHE_KEYS } from './src/utils/dropdownCache';
import { getGenusApi, getVariegationApi, getCountryApi, getListingTypeApi, getShippingIndexApi, getAcclimationIndexApi } from './src/components/Api/dropdownApi';
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
    <AuthProvider>
      <FilterProvider>
        <LovedListingsProvider>
          <AppNavigation />
        </LovedListingsProvider>
      </FilterProvider>
    </AuthProvider>
  );
};

export default App;
