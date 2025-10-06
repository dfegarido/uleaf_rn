import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleLoveListingApi, getLovedListingsApi, checkLovedListingsApi } from '../components/Api/buyerProfileApi';

const LovedListingsContext = createContext();

export const useLovedListings = () => {
  const context = useContext(LovedListingsContext);
  if (!context) {
    throw new Error('useLovedListings must be used within a LovedListingsProvider');
  }
  return context;
};

export const LovedListingsProvider = ({ children }) => {
  const [lovedListings, setLovedListings] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load loved listings from AsyncStorage on mount
  useEffect(() => {
    loadLovedListingsFromCache();
  }, []);

  // Load loved listings from AsyncStorage cache
  const loadLovedListingsFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem('lovedListings');
      if (cached) {
        const parsedData = JSON.parse(cached);
        setLovedListings(new Set(parsedData.listingIds || []));
        setLastSyncTime(parsedData.timestamp || null);
      }
    } catch (error) {
      console.log('Error loading loved listings from cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save loved listings to AsyncStorage cache
  const saveLovedListingsToCache = async (listingIds) => {
    try {
      const data = {
        listingIds: Array.from(listingIds),
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('lovedListings', JSON.stringify(data));
      setLastSyncTime(data.timestamp);
    } catch (error) {
      console.log('Error saving loved listings to cache:', error);
    }
  };

  // Sync loved listings from backend
  const syncLovedListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getLovedListingsApi();
      
      if (response.success && response.lovedListings) {
        const listingIds = response.lovedListings.map(item => item.listingId);
        const newLovedSet = new Set(listingIds);
        setLovedListings(newLovedSet);
        await saveLovedListingsToCache(newLovedSet);
        console.log(`[LovedListingsContext] Synced ${listingIds.length} loved listings from backend`);
      }
    } catch (error) {
      console.log('Error syncing loved listings:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if a listing is loved
  const isLoved = useCallback((listingId) => {
    return lovedListings.has(listingId);
  }, [lovedListings]);

  // Toggle love status for a listing
  const toggleLove = useCallback(async (listingId) => {
    try {
      // Optimistic update
      const wasLoved = lovedListings.has(listingId);
      const newLovedSet = new Set(lovedListings);
      
      if (wasLoved) {
        newLovedSet.delete(listingId);
      } else {
        newLovedSet.add(listingId);
      }
      
      setLovedListings(newLovedSet);
      await saveLovedListingsToCache(newLovedSet);

      // Call API to persist the change
      const response = await toggleLoveListingApi(listingId);
      
      if (response.success) {
        console.log(`[LovedListingsContext] Toggled love for ${listingId}: isLoved=${response.isLoved}, loveCount=${response.loveCount}`);
        
        // Verify optimistic update matches server response
        if (response.isLoved !== !wasLoved) {
          // If server response doesn't match our optimistic update, sync from server
          console.warn('[LovedListingsContext] Optimistic update mismatch, syncing from server');
          await syncLovedListings();
        }
        
        return {
          success: true,
          isLoved: response.isLoved,
          loveCount: response.loveCount,
        };
      } else {
        // Revert optimistic update on failure
        setLovedListings(lovedListings);
        await saveLovedListingsToCache(lovedListings);
        return {
          success: false,
          error: 'Failed to toggle love status',
        };
      }
    } catch (error) {
      console.log('Error toggling love status:', error.message);
      
      // Revert optimistic update on error
      setLovedListings(lovedListings);
      await saveLovedListingsToCache(lovedListings);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }, [lovedListings, syncLovedListings]);

  // Bulk check loved status for multiple listings
  const checkLovedStatus = useCallback(async (listingIds) => {
    try {
      const response = await checkLovedListingsApi(listingIds);
      
      if (response.success && response.lovedStatus) {
        // Update local state with server data
        const newLovedSet = new Set(lovedListings);
        
        Object.entries(response.lovedStatus).forEach(([listingId, isLovedStatus]) => {
          if (isLovedStatus) {
            newLovedSet.add(listingId);
          } else {
            newLovedSet.delete(listingId);
          }
        });
        
        setLovedListings(newLovedSet);
        await saveLovedListingsToCache(newLovedSet);
        
        return response.lovedStatus;
      }
      
      return {};
    } catch (error) {
      console.log('Error checking loved status:', error.message);
      return {};
    }
  }, [lovedListings]);

  // Get count of loved listings
  const getLovedCount = useCallback(() => {
    return lovedListings.size;
  }, [lovedListings]);

  // Clear all loved listings (for logout, etc.)
  const clearLovedListings = useCallback(async () => {
    try {
      setLovedListings(new Set());
      await AsyncStorage.removeItem('lovedListings');
      setLastSyncTime(null);
    } catch (error) {
      console.log('Error clearing loved listings:', error);
    }
  }, []);

  const value = {
    lovedListings: Array.from(lovedListings), // Convert Set to Array for easier consumption
    isLoved,
    toggleLove,
    syncLovedListings,
    checkLovedStatus,
    getLovedCount,
    clearLovedListings,
    isLoading,
    lastSyncTime,
  };

  return (
    <LovedListingsContext.Provider value={value}>
      {children}
    </LovedListingsContext.Provider>
  );
};

export default LovedListingsContext;
