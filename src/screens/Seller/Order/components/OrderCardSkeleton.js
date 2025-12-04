import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const OrderCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const ShimmerBox = ({ style }) => (
    <Animated.View style={[styles.shimmerBox, style, { opacity }]} />
  );

  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <ShimmerBox style={styles.plantImage} />
      
      {/* Content Skeleton */}
      <View style={styles.cardContent}>
        {/* Index and Status */}
        <ShimmerBox style={styles.indexLine} />
        
        {/* Plant Name */}
        <ShimmerBox style={styles.plantName} />
        
        {/* Transaction Number */}
        <ShimmerBox style={styles.infoLine} />
        
        {/* Plant Code */}
        <ShimmerBox style={styles.infoLine} />
        
        {/* Variegation & Size */}
        <ShimmerBox style={styles.infoLineShort} />
        
        {/* Quantity */}
        <ShimmerBox style={styles.infoLineShort} />
        
        {/* Price */}
        <ShimmerBox style={styles.price} />
        
        {/* Chip */}
        <ShimmerBox style={styles.typeChip} />
        
        {/* Dates */}
        <ShimmerBox style={styles.dateText} />
        <ShimmerBox style={styles.dateText} />
        
        {/* Country */}
        <ShimmerBox style={styles.infoLineShort} />
      </View>
    </View>
  );
};

const SkeletonList = ({ count = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  shimmerBox: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantImage: {
    width: 110,
    height: 160,
    borderRadius: 8,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  indexLine: {
    width: 80,
    height: 14,
    marginBottom: 6,
  },
  plantName: {
    width: '90%',
    height: 18,
    marginBottom: 8,
  },
  infoLine: {
    width: '75%',
    height: 14,
    marginBottom: 4,
  },
  infoLineShort: {
    width: '60%',
    height: 14,
    marginBottom: 4,
  },
  price: {
    width: 60,
    height: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  typeChip: {
    width: 80,
    height: 20,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  dateText: {
    width: '70%',
    height: 12,
    marginTop: 4,
  },
});

export { OrderCardSkeleton, SkeletonList };
export default SkeletonList;
