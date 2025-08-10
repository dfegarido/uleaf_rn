import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';

const OrderItemCardSkeleton = () => {
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

  const ShimmerBox = ({style}) => (
    <Animated.View style={[styles.shimmerBox, style, {opacity}]} />
  );

  return (
    <View style={styles.container}>
      {/* Status Row Skeleton */}
      <View style={styles.statusRow}>
        <ShimmerBox style={styles.statusSkeleton} />
        <ShimmerBox style={styles.creditButtonSkeleton} />
      </View>

      {/* Flight Info Row Skeleton */}
      <View style={styles.flightRow}>
        <View style={styles.flightInfo}>
          <ShimmerBox style={styles.iconSkeleton} />
          <ShimmerBox style={styles.flightTextSkeleton} />
        </View>
        <View style={styles.countryInfo}>
          <ShimmerBox style={styles.countryCodeSkeleton} />
          <ShimmerBox style={styles.flagSkeleton} />
        </View>
      </View>

      {/* Main Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.contentRow}>
          {/* Plant Image Skeleton */}
          <ShimmerBox style={styles.imageSkeleton} />
          
          {/* Info Column Skeleton */}
          <View style={styles.infoCol}>
            <ShimmerBox style={styles.plantNameSkeleton} />
            <ShimmerBox style={styles.varietySkeleton} />
            <View style={styles.priceRow}>
              <ShimmerBox style={styles.priceSkeleton} />
              <ShimmerBox style={styles.quantitySkeleton} />
            </View>
            <ShimmerBox style={styles.requestButtonSkeleton} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F6F6',
    paddingVertical: 10,
    marginVertical: 4,
  },
  shimmerBox: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusSkeleton: {
    width: 100,
    height: 20,
  },
  creditButtonSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 12,
  },
  flightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  flightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  flightTextSkeleton: {
    width: 120,
    height: 16,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeSkeleton: {
    width: 30,
    height: 16,
    marginRight: 4,
  },
  flagSkeleton: {
    width: 22,
    height: 16,
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentRow: {
    flexDirection: 'row',
  },
  imageSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  plantNameSkeleton: {
    width: '90%',
    height: 18,
    marginBottom: 6,
  },
  varietySkeleton: {
    width: '70%',
    height: 14,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceSkeleton: {
    width: 60,
    height: 16,
  },
  quantitySkeleton: {
    width: 30,
    height: 16,
  },
  requestButtonSkeleton: {
    width: '60%',
    height: 32,
    borderRadius: 16,
  },
});

export default OrderItemCardSkeleton;
