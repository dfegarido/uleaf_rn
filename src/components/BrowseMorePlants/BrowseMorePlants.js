import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import PlantItemCard from '../PlantItemCard/PlantItemCard';
import { getPlantRecommendationsApi, addToCartApi } from '../Api';
import CaretDownIcon from '../../assets/icons/accent/caret-down-regular.svg';

// Global state for plant recommendations - shared across all instances
let globalPlantRecommendations = [];
let isGlobalLoading = false;
let hasGlobalLoaded = false; // Track if we've ever loaded recommendations in this app session

// Function to reset global state (can be called from outside when needed)
export const resetGlobalPlantRecommendations = () => {
  console.log('🌱 Resetting global plant recommendations');
  globalPlantRecommendations = [];
  hasGlobalLoaded = false;
  isGlobalLoading = false;
};

// Removed AsyncStorage caching (backend now handles image & data freshness)

const BrowseMorePlants = ({
  title = "Discover Random Plants",
  initialLimit = 4,
  loadMoreLimit = 4,
  showLoadMore = true,
  onPlantPress = null, // Custom handler for plant press
  onAddToCart = null, // Custom handler for add to cart
  containerStyle = {},
  autoLoad = true, // Whether to load plants automatically on mount
  forceRefresh = false, // Force refresh from API, bypassing cache and global state
}) => {
  const [plants, setPlants] = useState(globalPlantRecommendations);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Helper to compute next chunk from global data without refetching
  const getNextChunk = (currentCount) => {
    if (!Array.isArray(globalPlantRecommendations) || globalPlantRecommendations.length === 0) return [];
    const start = currentCount;
    const end = start + loadMoreLimit;
    return globalPlantRecommendations.slice(start, end);
  };

  // Removed loadPlantsFromCache & savePlantsToCache (no local caching)

  // Simplified load function that respects singleton pattern
  const loadPlants = async (isInitial = true, forceRefresh = false) => {
    if (isInitial) {
      // For initial load, use the global singleton pattern
      await loadGlobalPlantRecommendations(forceRefresh);
    } else {
      // For "load more", add additional plants from global cache (no API call)
      if (globalPlantRecommendations.length === 0) {
        console.log('🌱 No global data available for load more');
        return;
      }

      setLoadingMore(true);
      try {
        setPlants(prevPlants => {
          const next = getNextChunk(prevPlants.length);
          if (next.length === 0) {
            Alert.alert('No more plants', 'No more plants available to load.');
            return prevPlants;
          }

          // Filter out duplicates by plantCode
          const existingPlantCodes = new Set(prevPlants.map(p => p.plantCode));
          const uniqueNext = next.filter(p => p && p.plantCode && !existingPlantCodes.has(p.plantCode));
          return [...prevPlants, ...uniqueNext];
        });
      } catch (error) {
        console.error('Error loading more plants:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setLoadingMore(false);
      }
    }
  };

  // Global function to load plant recommendations (singleton pattern)
  const loadGlobalPlantRecommendations = async (forceRefresh = false) => {
    // If already loaded in this app session and not forced refresh, use existing data
    if (hasGlobalLoaded && !forceRefresh) {
      console.log('🌱 BrowseMorePlants: Using existing global recommendations (', globalPlantRecommendations.length, 'plants)');
      // Only show initial chunk on mount
      setPlants(globalPlantRecommendations.slice(0, initialLimit));
      return;
    }

    // If another instance is already loading, wait for it
    if (isGlobalLoading) {
      console.log('🌱 BrowseMorePlants: Another instance is loading, waiting...');
      // Poll until loading is complete
      const checkInterval = setInterval(() => {
        if (!isGlobalLoading) {
          clearInterval(checkInterval);
          // After the other instance finishes, only show the first chunk
          setPlants(globalPlantRecommendations.slice(0, initialLimit));
        }
      }, 100);
      return;
    }

    // Start loading
    isGlobalLoading = true;
  setLoading(true);

    try {
      console.log('🌱 BrowseMorePlants: Loading recommendations for the first time this session');

  // Skip local cache logic (always fetch fresh batch)

      // Load from API
      console.log('🌱 BrowseMorePlants: Loading recommendations from API...');
  // Fetch a larger batch once, then chunk for UI to avoid subsequent API calls
  const batchSize = Math.max(12, initialLimit * 5); // smaller due to lower per-page limit
  const params = { limit: batchSize };
      const response = await getPlantRecommendationsApi(params);

      if (response.success && response.data && response.data.recommendations) {
        // Filter valid plants
  const validPlants = response.data.recommendations.filter(plant => {
          const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
          const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                          (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
          const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                             (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
          return hasPlantCode && hasTitle && hasSubtitle;
        });

        console.log(`🌱 Loaded ${validPlants.length} valid plants for global recommendations`);

  // Update global state with full batch
  // Normalize image fields to include webp versions
  globalPlantRecommendations = validPlants.map(p => ({
    ...p,
    imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimaryWebp || p.imagePrimary,
    imageCollectionWebp: p.imageCollectionWebp || p.imageCollectionWebp || p.imageCollection,
  }));
        hasGlobalLoaded = true;
  // Show only the first chunk in UI
  setPlants(globalPlantRecommendations.slice(0, initialLimit));

  // No local cache persistence
      } else {
        console.error('Failed to load plant recommendations:', response.data?.message || 'Unknown error');
        setPlants([]);
      }
    } catch (error) {
      console.error('Error loading plant recommendations:', error);
      setPlants([]);
    } finally {
      isGlobalLoading = false;
      setLoading(false);
    }
  };

  // Default add to cart handler
  const handleAddToCart = async (plant) => {
    if (onAddToCart) {
      // Use custom handler if provided
      return onAddToCart(plant);
    }

    try {
      console.log('Adding plant to cart from browse more:', plant.plantCode);
      
      const params = {
        plantCode: plant.plantCode,
        quantity: 1,
      };
      
      const response = await addToCartApi(params);
      console.log('Add to cart response:', response);
      
      if (response.success) {
        Alert.alert('Success', 'Plant added to cart successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to add plant to cart');
      }
    } catch (error) {
      console.error('Error adding plant to cart:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Load more plants
  const handleLoadMore = () => {
    loadPlants(false);
  };

  // Auto-load on mount if enabled
  useEffect(() => {
    console.log('🌱 BrowseMorePlants useEffect triggered:', { autoLoad, plantsCount: plants.length, forceRefresh });
    if (autoLoad) {
      console.log('🌱 BrowseMorePlants: Loading plants because autoLoad is true');
      loadPlants(true, forceRefresh);
    }
  }, [autoLoad, forceRefresh]);

  // Component mount/unmount debugging
  useEffect(() => {
    console.log('🌱 BrowseMorePlants: Component mounted');
    return () => {
      console.log('🌱 BrowseMorePlants: Component unmounted');
    };
  }, []);

  // Skeleton loading component
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      {/* Image skeleton */}
      <View style={styles.skeletonImage} />
      
      {/* Title skeleton */}
      <View style={styles.skeletonTitle} />
      
      {/* Subtitle skeleton */}
      <View style={styles.skeletonSubtitle} />
      
      {/* Price skeleton */}
      <View style={styles.skeletonPrice} />
      
      {/* Button skeleton */}
      <View style={styles.skeletonButton} />
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Plants Grid */}
  {loading ? (
        <View style={styles.plantsGrid}>
          {Array.from({length: initialLimit}).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </View>
      ) : plants.length > 0 ? (
        <View style={styles.plantsGrid}>
          {plants.map((plant, idx) => {
            // Additional safety check before rendering
            if (!plant || 
                !plant.plantCode || 
                typeof plant.plantCode !== 'string' ||
                plant.plantCode.trim() === '') {
              console.log('Skipping invalid plant at render:', plant);
              return null;
            }
            
            // Ensure title and subtitle are safe
            const hasValidTitle = (plant.genus && typeof plant.genus === 'string') || 
                                 (plant.plantName && typeof plant.plantName === 'string');
            const hasValidSubtitle = (plant.species && typeof plant.species === 'string') || 
                                    (plant.variegation && typeof plant.variegation === 'string');
            
            if (!hasValidTitle || !hasValidSubtitle) {
              console.log('Skipping plant with invalid text fields:', plant);
              return null;
            }
            
            return (
              <View key={plant.plantCode || plant.id || `plant-${idx}`} style={styles.cardWrapper}>
                <PlantItemCard
                  data={plant}
                  onPress={onPlantPress ? () => onPlantPress(plant) : undefined}
                  onAddToCart={() => handleAddToCart(plant)}
                />
              </View>
            );
          }).filter(Boolean)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recommendations available</Text>
        </View>
      )}
      
      {/* Load More Button */}
      {showLoadMore && plants.length > 0 && (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity 
            onPress={handleLoadMore} 
            style={styles.loadMoreButton}
            disabled={loadingMore}
          >
            <View style={styles.loadMoreTextContainer}>
              <Text style={styles.loadMoreText}>
                {loadingMore ? 'Loading more...' : 'Load More'}
              </Text>
              {!loadingMore && (
                <CaretDownIcon width={24} height={24} style={styles.loadMoreIcon} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#393D40',
    marginBottom: 16,
    marginLeft: 12,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to top to prevent stretching
    paddingHorizontal: 12,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 12,
    alignSelf: 'flex-start', // Prevent vertical stretching
  },
  skeletonCard: {
    width: '48%',
    height: 280, // Match the PlantItemCard height
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
  },
  skeletonImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: '60%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    width: '50%',
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonButton: {
    width: '100%',
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginTop: 'auto',
  },
  emptyState: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  loadMoreContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 16, // Add padding to match the 375px width constraint
  },
  loadMoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 375,
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  loadMoreText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
    textAlign: 'center',
  },
  loadMoreTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    height: 16,
  },
  loadMoreIcon: {
    width: 24,
    height: 24,
  },
});

export default BrowseMorePlants;
