import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SkeletonItem = ({ width, height = 20, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    const pulseTiming = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseTiming.start();
    
    return () => {
      pulseTiming.stop();
    };
  }, [pulseAnim]);
  
  return (
    <Animated.View 
      style={[{
        width,
        height,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        opacity: pulseAnim,
      }, style]} 
    />
  );
};

const TaxonomyCardSkeleton = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.nameSection}>
            <SkeletonItem width={120} height={24} style={styles.genusNameSkeleton} />
          </View>
          <View style={styles.receivedPlantsSection}>
            <SkeletonItem width={103} height={22} />
            <SkeletonItem width={20} height={22} />
          </View>
        </View>
        <SkeletonItem width={24} height={24} style={styles.editButtonSkeleton} />
      </View>
    </View>
  );
};

const TaxonomySkeletonList = ({ count = 5 }) => {
  return (
    <View style={styles.skeletonList}>
      {/* Count header skeleton */}
      <View style={styles.countContainer}>
        <SkeletonItem width={120} height={20} />
      </View>
      
      {/* Taxonomy cards skeleton */}
      {Array.from({ length: count }).map((_, index) => (
        <TaxonomyCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonList: {
    backgroundColor: '#F5F6F6',
    flex: 1,
  },
  countContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cardContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F6F6',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 12,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  genusNameSkeleton: {
    borderRadius: 6,
  },
  receivedPlantsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonSkeleton: {
    borderRadius: 12,
  },
});

export default TaxonomySkeletonList;
