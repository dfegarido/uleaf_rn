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
import { preloadAllDropdownData } from './src/utils/dropdownCache';
import { getGenusApi, getVariegationApi, getCountryApi, getListingTypeApi, getShippingIndexApi, getAcclimationIndexApi } from './src/components/Api/dropdownApi';
import { clearExpiredImageCache } from './src/utils/imageCache';

const App = () => {
  // Warm key caches at startup for faster first paint on buyer screens
  useEffect(() => {
    preloadAllDropdownData({
      getGenusApi,
      getVariegationApi,
      getCountryApi,
      getListingTypeApi,
      getShippingIndexApi,
      getAcclimationIndexApi,
    });
    // Opportunistically clean expired image cache
    clearExpiredImageCache();
  }, []);

  return (
    <AuthProvider>
      <FilterProvider>
        <AppNavigation />
      </FilterProvider>
    </AuthProvider>
  );
};

export default App;
