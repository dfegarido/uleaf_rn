/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { useEffect, useState } from 'react';
// Ensure Firebase is initialized before providers mount
import './firebase';
import { version as appVersion } from './package.json';
import { AuthProvider } from './src/auth/AuthProvider';
import { getAppVersionApi } from './src/components/Api/appVersionApi';
import { getGenusApi, getVariegationApi } from './src/components/Api/dropdownApi';
import AppNavigation from './src/components/AppNavigation';
import { FilterProvider } from './src/context/FilterContext';
import { LovedListingsProvider } from './src/context/LovedListingsContext';
import UpdateRequiredScreen from './src/screens/UpdateRequired/UpdateRequiredScreen';
import { CACHE_KEYS, clearSpecificDropdownCache, preloadAllDropdownData } from './src/utils/dropdownCache';
import { clearExpiredImageCache } from './src/utils/imageCache';

const App = () => {
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  // Check app version on startup
  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    try {
      const response = await getAppVersionApi();
      console.log('response', response.data?.data);
      if (response.success && response.data?.data) {
        const { minimumVersion, currentVersion, forceUpdate, updateUrl, message } = response.data.data;
        
        // Compare version numbers
        if (isVersionUpdateRequired(appVersion, minimumVersion)) {
          console.log('Update required. Update URLs:', updateUrl);
          console.log('Force update:', forceUpdate);
          setUpdateInfo({
            updateUrl,
            message: message || 'A new version of the app is available. Please update to continue.',
          });
          
          // If force update is enabled, show the screen
          if (forceUpdate) {
            console.log('🚨 Force update enabled - showing update screen');
            setShowUpdateScreen(true);
          } else {
            // Optional update - store info for later
            console.log('Update available:', currentVersion);
          }
        }
      }
    } catch (error) {
      console.error('Error checking app version:', error);
      // Continue with app if version check fails
    }
  };

  // Compare version numbers (e.g., "1.0.0" vs "1.1.0")
  const isVersionUpdateRequired = (currentVersion, minimumVersion) => {
    const current = currentVersion.split('.').map(Number);
    const minimum = minimumVersion.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (current[i] < minimum[i]) return true;
      if (current[i] > minimum[i]) return false;
    }
    return false;
  };

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

  // Debug logging - must be before any early returns (Rules of Hooks)
  useEffect(() => {
    console.log('🔍 Update screen state:', {
      showUpdateScreen,
      hasUpdateInfo: !!updateInfo,
      updateInfo,
    });
  }, [showUpdateScreen, updateInfo]);

  // Show update screen if update is required
  if (showUpdateScreen && updateInfo) {
    console.log('✅ Showing update screen with info:', updateInfo);
    return <UpdateRequiredScreen updateUrl={updateInfo.updateUrl} message={updateInfo.message} />;
  }

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
