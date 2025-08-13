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

const BrowseMorePlants = ({
  title = "Discover Random Plants",
  initialLimit = 6,
  loadMoreLimit = 6,
  showLoadMore = true,
  onPlantPress = null, // Custom handler for plant press
  onAddToCart = null, // Custom handler for add to cart
  containerStyle = {},
  autoLoad = true, // Whether to load plants automatically on mount
}) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load initial plants
  const loadPlants = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log('Loading plant recommendations...');
      
      const params = {
        limit: isInitial ? initialLimit : loadMoreLimit,
      };
      
      const response = await getPlantRecommendationsApi(params);
      console.log('Plant recommendations API response:', response.data.recommendations);
      
      if (response.success && response.data && response.data.recommendations) {
        // Filter out plants with invalid data
        const validPlants = response.data.recommendations.filter(plant => {
          // Ensure plant has required fields and they are strings
          const hasPlantCode = plant && typeof plant.plantCode === 'string' && plant.plantCode.trim() !== '';
          const hasTitle = (typeof plant.genus === 'string' && plant.genus.trim() !== '') || 
                          (typeof plant.plantName === 'string' && plant.plantName.trim() !== '');
          const hasSubtitle = (typeof plant.species === 'string' && plant.species.trim() !== '') || 
                             (typeof plant.variegation === 'string' && plant.variegation.trim() !== '');
          
          // Check if plant has a valid price (greater than 0)
          const hasValidPrice = (plant.finalPrice && plant.finalPrice > 0) ||
                               (plant.usdPriceNew && plant.usdPriceNew > 0) ||
                               (plant.usdPrice && plant.usdPrice > 0) ||
                               (plant.localPriceNew && plant.localPriceNew > 0) ||
                               (plant.localPrice && plant.localPrice > 0);
          
          const isValid = hasPlantCode && hasTitle && hasSubtitle && hasValidPrice;
          
          if (!isValid) {
            console.log('Filtering out invalid plant:', {
              plantCode: plant?.plantCode,
              genus: plant?.genus,
              species: plant?.species,
              variegation: plant?.variegation,
              plantName: plant?.plantName,
              finalPrice: plant?.finalPrice,
              hasValidPrice: hasValidPrice
            });
          }
          
          return isValid;
        });
        
        console.log(`Filtered ${response.data.recommendations.length} plants down to ${validPlants.length} valid plants`);
        
        if (isInitial) {
          setPlants(validPlants);
        } else {
          // Add new recommendations, filtering out duplicates
          setPlants(prevPlants => {
            const existingPlantCodes = new Set(prevPlants.map(p => p.plantCode));
            const newPlants = validPlants.filter(p => !existingPlantCodes.has(p.plantCode));
            return [...prevPlants, ...newPlants];
          });
          
          if (validPlants.length === 0) {
            Alert.alert('No more plants', 'No more plants available to load.');
          }
        }
      } else {
        console.error('Failed to load plant recommendations:', response.data?.message || 'Unknown error');
        if (isInitial) {
          setPlants([]);
        }
        if (!isInitial) {
          Alert.alert('Error', 'Failed to load more plants. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error loading plant recommendations:', error);
      if (isInitial) {
        setPlants([]);
      }
      if (!isInitial) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
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
    if (autoLoad) {
      loadPlants(true);
    }
  }, [autoLoad]);

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
