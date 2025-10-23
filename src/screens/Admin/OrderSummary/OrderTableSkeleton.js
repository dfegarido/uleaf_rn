import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SkeletonBox = ({ width, height, style }) => {
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
        backgroundColor: '#E4E7E9',
        borderRadius: 8,
        opacity: pulseAnim,
      }, style]} 
    />
  );
};

const OrderTableSkeletonRow = () => {
  return (
    <View style={styles.tableRow}>
      {/* Image */}
      <View style={[styles.tableCell, {width: 116}]}>
        <SkeletonBox width={116} height={116} style={{borderRadius: 12}} />
      </View>

      {/* Order Info */}
      <View style={[styles.tableCell, {width: 240}]}>
        <SkeletonBox width={180} height={16} style={{marginBottom: 8}} />
        <SkeletonBox width={140} height={14} style={{marginBottom: 6}} />
        <SkeletonBox width={160} height={14} style={{marginBottom: 6}} />
        <SkeletonBox width={150} height={14} />
      </View>

      {/* Plant Code */}
      <View style={[styles.tableCell, {width: 100}]}>
        <SkeletonBox width={80} height={16} />
      </View>

      {/* Plant Name */}
      <View style={[styles.tableCell, {width: 200}]}>
        <SkeletonBox width={160} height={16} style={{marginBottom: 6}} />
        <SkeletonBox width={120} height={14} />
      </View>

      {/* Listing Type */}
      <View style={[styles.tableCell, {width: 140}]}>
        <SkeletonBox width={100} height={28} style={{borderRadius: 8}} />
      </View>

      {/* Pot Size */}
      <View style={[styles.tableCell, {width: 90, alignItems: 'center'}]}>
        <SkeletonBox width={60} height={28} style={{borderRadius: 8}} />
      </View>

      {/* Quantity */}
      <View style={[styles.tableCell, {width: 100, alignItems: 'center'}]}>
        <SkeletonBox width={40} height={16} />
      </View>

      {/* Local Price */}
      <View style={[styles.tableCell, {width: 120, alignItems: 'center'}]}>
        <SkeletonBox width={80} height={16} />
      </View>

      {/* USD Price */}
      <View style={[styles.tableCell, {width: 120, alignItems: 'center'}]}>
        <SkeletonBox width={70} height={16} />
      </View>

      {/* Garden & Seller */}
      <View style={[styles.tableCell, {width: 200}]}>
        <SkeletonBox width={150} height={16} style={{marginBottom: 6}} />
        <SkeletonBox width={120} height={14} />
      </View>

      {/* Buyer */}
      <View style={[styles.tableCell, {width: 200}]}>
        <SkeletonBox width={140} height={16} style={{marginBottom: 6}} />
        <SkeletonBox width={100} height={14} />
      </View>

      {/* Receiver */}
      <View style={[styles.tableCell, {width: 200}]}>
        <SkeletonBox width={130} height={16} style={{marginBottom: 6}} />
        <SkeletonBox width={90} height={14} />
      </View>

      {/* Plant Flight */}
      <View style={[styles.tableCell, {width: 140}]}>
        <SkeletonBox width={110} height={16} />
      </View>
    </View>
  );
};

const OrderTableSkeleton = ({ rowCount = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: rowCount }).map((_, index) => (
        <OrderTableSkeletonRow key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 12,
    width: 2140,
    minHeight: 144,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  tableCell: {
    justifyContent: 'flex-start',
  },
});

export default OrderTableSkeleton;

