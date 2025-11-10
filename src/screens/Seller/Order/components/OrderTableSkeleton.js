import React, {useRef, useEffect} from 'react';
import {View, StyleSheet, Animated, ScrollView} from 'react-native';

const COLUMN_WIDTH = 120;

const SkeletonBox = ({width, height, style}) => {
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
      ]),
    );

    pulseTiming.start();

    return () => {
      pulseTiming.stop();
    };
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#E4E7E9',
          borderRadius: 8,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

const OrderTableSkeletonRow = () => {
  return (
    <View style={styles.row}>
      {/* Image */}
      <View style={styles.cell}>
        <SkeletonBox width={80} height={80} style={{borderRadius: 12}} />
      </View>

      {/* Transaction # & Date(s) */}
      <View style={[styles.cell, {width: 200}]}>
        <SkeletonBox width={140} height={16} style={{marginBottom: 8}} />
        <SkeletonBox width={120} height={14} style={{marginBottom: 8}} />
        <SkeletonBox width={100} height={14} />
      </View>

      {/* Plant Code */}
      <View style={styles.cell}>
        <SkeletonBox width={100} height={16} />
      </View>

      {/* Plant Name */}
      <View style={styles.cell}>
        <SkeletonBox width={110} height={16} style={{marginBottom: 8}} />
        <SkeletonBox width={90} height={14} />
      </View>

      {/* Listing Type */}
      <View style={styles.cell}>
        <SkeletonBox width={80} height={28} style={{borderRadius: 10}} />
      </View>

      {/* Pot Size */}
      <View style={styles.cell}>
        <SkeletonBox width={70} height={28} style={{borderRadius: 10}} />
      </View>

      {/* Quantity */}
      <View style={styles.cell}>
        <SkeletonBox width={40} height={16} />
      </View>

      {/* Total Price */}
      <View style={styles.cell}>
        <SkeletonBox width={90} height={16} />
      </View>
    </View>
  );
};

const OrderTableSkeleton = ({rowCount = 5}) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Header Skeleton */}
        <View style={[styles.row, {backgroundColor: '#E4E7E9'}]}>
          <View style={styles.cell}>
            <SkeletonBox width={60} height={16} />
          </View>
          <View style={[styles.cell, {width: 200}]}>
            <SkeletonBox width={150} height={16} />
          </View>
          <View style={styles.cell}>
            <SkeletonBox width={80} height={16} />
          </View>
          <View style={styles.cell}>
            <SkeletonBox width={90} height={16} />
          </View>
          <View style={styles.cell}>
            <SkeletonBox width={80} height={16} />
          </View>
          <View style={styles.cell}>
            <SkeletonBox width={70} height={16} />
          </View>
          <View style={styles.cell}>
            <SkeletonBox width={60} height={16} />
          </View>
          <View style={styles.cell}>
            <SkeletonBox width={80} height={16} />
          </View>
        </View>

        {/* Rows */}
        {Array.from({length: rowCount}).map((_, index) => (
          <OrderTableSkeletonRow key={index} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: COLUMN_WIDTH,
    padding: 10,
    borderColor: '#ccc',
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
});

export default OrderTableSkeleton;

