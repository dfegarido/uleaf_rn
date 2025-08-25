import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const AddressBookSkeleton = () => {
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

  const AddressCardSkeleton = () => (
    <View style={styles.addressCard}>
      <View style={styles.addressCardContent}>
        {/* Icon skeleton */}
        <View style={styles.iconSection}>
          <ShimmerBox style={styles.iconSkeleton} />
        </View>
        
        {/* Content skeleton */}
        <View style={styles.contentSection}>
          {/* Address text skeleton */}
          <View style={styles.addressRow}>
            <View style={styles.addressTextSection}>
              <ShimmerBox style={styles.addressLine1} />
              <ShimmerBox style={styles.addressLine2} />
            </View>
            <ShimmerBox style={styles.editButtonSkeleton} />
          </View>
          
          {/* Default toggle skeleton */}
          <View style={styles.defaultRow}>
            <ShimmerBox style={styles.defaultLabelSkeleton} />
            <ShimmerBox style={styles.switchSkeleton} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AddressCardSkeleton />
      <AddressCardSkeleton />
      <AddressCardSkeleton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  shimmerBox: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  addressCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    marginBottom: 6,
  },
  addressCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  iconSection: {
    width: 40,
    height: 60,
    justifyContent: 'flex-start',
  },
  iconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contentSection: {
    flex: 1,
    gap: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  addressTextSection: {
    flex: 1,
    gap: 8,
    marginRight: 12,
  },
  addressLine1: {
    height: 18,
    width: '90%',
    borderRadius: 4,
  },
  addressLine2: {
    height: 18,
    width: '70%',
    borderRadius: 4,
  },
  editButtonSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultLabelSkeleton: {
    height: 16,
    width: 120,
    borderRadius: 4,
  },
  switchSkeleton: {
    width: 40,
    height: 20,
    borderRadius: 10,
  },
});

export default AddressBookSkeleton;
