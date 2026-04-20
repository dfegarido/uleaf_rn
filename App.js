/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

/** Compare semver-like strings (e.g. "1.0.0" vs "1.1.0"). */
function isVersionUpdateRequired(currentVersion, minimumVersion) {
  const current = currentVersion.split('.').map(Number);
  const minimum = minimumVersion.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (current[i] < minimum[i]) return true;
    if (current[i] > minimum[i]) return false;
  }
  return false;
}

const App = () => {
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7925/ingest/9a196955-a083-44bc-acca-b2ca885f3d02',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a9adf'},body:JSON.stringify({sessionId:'0a9adf',hypothesisId:'H-app',location:'App.js:mount',message:'App render state',data:{showUpdateScreen,hasUpdateInfo:!!updateInfo},timestamp:Date.now(),runId:'pre-fix'})}).catch(()=>{});
  }, [showUpdateScreen, updateInfo]);
  // #endregion

  // Check app version on startup (runs once; logic kept inside effect for exhaustive-deps)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getAppVersionApi();
        if (cancelled || !response.success || !response.data?.data) {
          return;
        }
        const {minimumVersion, forceUpdate, updateUrl, message} = response.data.data;

        if (isVersionUpdateRequired(appVersion, minimumVersion)) {
          console.log('Update required. Update URLs:', updateUrl);
          console.log('Force update:', forceUpdate);
          setUpdateInfo({
            updateUrl,
            message:
              message || 'A new version of the app is available. Please update to continue.',
          });
          if (forceUpdate) {
            setShowUpdateScreen(true);
          }
        }
      } catch (error) {
        console.error('Error checking app version:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Show update screen if update is required
  if (showUpdateScreen && updateInfo) {
    return (
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <UpdateRequiredScreen updateUrl={updateInfo.updateUrl} message={updateInfo.message} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

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
