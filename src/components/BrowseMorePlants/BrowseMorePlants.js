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
      console.log('Plant recommendations API response:', response);
      
      if (response.success && response.data && response.data.recommendations) {
        if (isInitial) {
          setPlants(response.data.recommendations);
        } else {
          // Add new recommendations, filtering out duplicates
          setPlants(prevPlants => {
            const existingPlantCodes = new Set(prevPlants.map(p => p.plantCode));
            const newPlants = response.data.recommendations.filter(p => !existingPlantCodes.has(p.plantCode));
            return [...prevPlants, ...newPlants];
          });
          
          if (response.data.recommendations.length === 0) {
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
          {plants.map((plant, idx) => (
            <PlantItemCard
              key={plant.plantCode || plant.id || idx}
              data={plant}
              onPress={onPlantPress ? () => onPlantPress(plant) : undefined}
              onAddToCart={() => handleAddToCart(plant)}
            />
          ))}
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
    gap: 1,
    justifyContent: 'center',
  },
  skeletonCard: {
    width: 191,
    height: 289,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    margin: 1,
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
