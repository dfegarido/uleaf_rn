import React, {useRef, useEffect} from 'react';
import {View, StyleSheet, Animated, ScrollView} from 'react-native';

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

const ListingTableSkeletonRow = () => {
  return (
    <View style={styles.tableRow}>
      {/* Image and Checkbox */}
      <View style={[styles.tableCell, {width: 100}]}>
        <SkeletonBox width={80} height={80} style={{borderRadius: 12, marginBottom: 8}} />
        <SkeletonBox width={20} height={20} style={{borderRadius: 4}} />
      </View>

      {/* Plant Name & Status */}
      <View style={[styles.tableCell, {width: 150}]}>
        <SkeletonBox width={120} height={16} style={{marginBottom: 8}} />
        <SkeletonBox width={100} height={14} style={{marginBottom: 8}} />
        <SkeletonBox width={70} height={24} style={{borderRadius: 10}} />
      </View>

      {/* Pin */}
      <View style={[styles.tableCell, {width: 70, alignItems: 'center'}]}>
        <SkeletonBox width={20} height={20} />
      </View>

      {/* Listing Type */}
      <View style={[styles.tableCell, {width: 150}]}>
        <SkeletonBox width={100} height={28} style={{borderRadius: 8}} />
      </View>

      {/* Pot Size */}
      <View style={[styles.tableCell, {width: 150}]}>
        <SkeletonBox width={60} height={28} style={{borderRadius: 8, marginBottom: 4}} />
        <SkeletonBox width={70} height={28} style={{borderRadius: 8}} />
      </View>

      {/* Price */}
      <View style={[styles.tableCell, {width: 150}]}>
        <SkeletonBox width={80} height={16} style={{marginBottom: 4}} />
        <SkeletonBox width={90} height={16} />
      </View>

      {/* Quantity */}
      <View style={[styles.tableCell, {width: 250}]}>
        <SkeletonBox width={40} height={16} />
      </View>

      {/* Expiration Date */}
      <View style={[styles.tableCell, {width: 150}]}>
        <SkeletonBox width={100} height={16} />
      </View>

      {/* Discount */}
      <View style={[styles.tableCell, {width: 180}]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <SkeletonBox width={100} height={16} />
          <SkeletonBox width={20} height={20} style={{borderRadius: 10}} />
        </View>
      </View>
    </View>
  );
};

const ListingTableSkeleton = ({rowCount = 5}) => {
  return (
    <ScrollView horizontal>
      <View>
        {/* Header Skeleton */}
        <View style={[styles.headerRow, {backgroundColor: '#E4E7E9'}]}>
          <View style={[styles.headerCell, {width: 100}]}>
            <SkeletonBox width={60} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 150}]}>
            <SkeletonBox width={100} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 70}]}>
            <SkeletonBox width={30} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 150}]}>
            <SkeletonBox width={80} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 150}]}>
            <SkeletonBox width={60} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 150}]}>
            <SkeletonBox width={50} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 250}]}>
            <SkeletonBox width={60} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 150}]}>
            <SkeletonBox width={100} height={16} />
          </View>
          <View style={[styles.headerCell, {width: 180}]}>
            <SkeletonBox width={70} height={16} />
          </View>
        </View>

        {/* Rows */}
        {Array.from({length: rowCount}).map((_, index) => (
          <ListingTableSkeletonRow key={index} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  headerCell: {
    padding: 10,
    borderColor: '#ccc',
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderColor: '#ccc',
    borderBottomWidth: 1,
  },
  tableCell: {
    padding: 10,
    justifyContent: 'flex-start',
  },
});

export default ListingTableSkeleton;

