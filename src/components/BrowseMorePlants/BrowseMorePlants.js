import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import PlantItemCard from '../PlantItemCard/PlantItemCard';
import { getPlantRecommendationsApi, addToCartApi } from '../Api';
import CaretDownIcon from '../../assets/icons/accent/caret-down-regular.svg';

// Removed global state - now each component manages its own state for proper pagination

// Removed AsyncStorage caching (backend now handles image & data freshness)

const BrowseMorePlants = React.forwardRef(({
  title = "Discover Random Plants",
  initialLimit = 8,
  loadMoreLimit = 8,
  showLoadMore = true,
  onPlantPress = null, // Custom handler for plant press
  onAddToCart = null, // Custom handler for add to cart
  containerStyle = {},
  autoLoad = true, // Whether to load plants automatically on mount
  forceRefresh = false, // Force refresh from API
  onRegisterScrollHandler = null, // Callback to register scroll handler
}, ref) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreTriggered = useRef(false);
  const observerRef = useRef(null);

  // Load plants from API with offset pagination
  const loadPlants = async (loadOffset = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      console.log(`🌱 Loading plants with offset: ${loadOffset}, limit: ${initialLimit}`);
      const response = await getPlantRecommendationsApi({ 
        limit: initialLimit, 
        offset: loadOffset 
      });
      
      // Handle nested data structure: response.data.data.recommendations
      const apiData = response.data?.data || response.data;
      
      if (response.success && apiData && apiData.recommendations) {
        const validPlants = apiData.recommendations.filter(plant => {
          const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
          const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') ||
                          (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
          const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') ||
                            (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
          return hasPlantCode && hasTitle && hasSubtitle;
        });

        if (validPlants.length > 0) {
          // Normalize webp fields if present
          const normalized = validPlants.map(p => ({
            ...p,
            imagePrimaryWebp: p.imagePrimaryWebp || p.imagePrimary,
            imageCollectionWebp: p.imageCollectionWebp || p.imageCollection,
          }));

          if (isLoadMore) {
            // Filter out duplicates when loading more
            const existingPlantCodes = new Set(plants.map(p => p.plantCode));
            const uniqueNew = normalized.filter(p => p.plantCode && !existingPlantCodes.has(p.plantCode));
            console.log(`🌱 Loading ${uniqueNew.length} new plants, filtered out ${normalized.length - uniqueNew.length} duplicates`);
            setPlants(prev => [...prev, ...uniqueNew]);
          } else {
            console.log(`🌱 Loading ${normalized.length} initial plants`);
            setPlants(normalized);
          }

          // Update pagination state
          if (apiData.pagination) {
            setHasMore(apiData.pagination.hasMore);
          } else {
            setHasMore(true); // Default to true if pagination info not available
          }
          
          setOffset(loadOffset + validPlants.length);
        } else if (!isLoadMore) {
          setPlants([]);
        }
      } else {
        console.error('🌱 Failed to load plants:', response);
        if (!isLoadMore) {
          setPlants([]);
        }
      }
    } catch (error) {
      console.error('🌱 Error loading plants:', error);
      if (!isLoadMore) {
        Alert.alert('Loading Error', 'Unable to load plant recommendations. Please try again.');
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Expose handleLoadMore method to parent via ref
  React.useImperativeHandle(ref, () => ({
    handleLoadMore: handleLoadMoreIfNeeded
  }), [handleLoadMoreIfNeeded]);

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

  // Auto-load more when scrolling near bottom - using useCallback to prevent recreation
  const handleLoadMoreIfNeeded = React.useCallback(() => {
    if (hasMore && !loadingMore && !loadMoreTriggered.current) {
      console.log('🌱 BrowseMorePlants: Loading more plants...');
      loadMoreTriggered.current = true;
      loadPlants(offset, true);
      // Reset the flag after a delay to allow another load
      setTimeout(() => {
        loadMoreTriggered.current = false;
      }, 2000); // Increased delay to prevent rapid successive calls
    }
  }, [hasMore, loadingMore, offset, plants.length]);
  
  // Register scroll handler with parent if provided
  useEffect(() => {
    if (onRegisterScrollHandler) {
      onRegisterScrollHandler(handleScroll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only register once on mount

  // Auto-load on mount if enabled
  useEffect(() => {
    console.log('🌱 BrowseMorePlants useEffect triggered:', { autoLoad, plantsCount: plants.length, forceRefresh });
    if (autoLoad && plants.length === 0) {
      console.log('🌱 BrowseMorePlants: Loading initial plants');
      loadPlants(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, forceRefresh]); // Don't include loadPlants in deps

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
              <View key={`${plant.plantCode || plant.id || 'plant'}-${idx}`} style={styles.cardWrapper}>
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
      
      {/* Loading Indicator for Infinite Scroll */}
      {loadingMore && plants.length > 0 && (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingMoreText}>Loading more plants...</Text>
        </View>
      )}
      
    </View>
  );
});

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
    marginBottom: 100,
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
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#539461',
    textAlign: 'center',
  },
  sentinel: {
    height: 1,
    width: '100%',
  },
});

BrowseMorePlants.displayName = 'BrowseMorePlants';

export default BrowseMorePlants;
