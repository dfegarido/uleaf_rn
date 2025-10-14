import React from 'react';
import { View, StyleSheet } from 'react-native';

const SkeletonRow = () => (
  <View style={styles.skeletonRow}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonCells}>
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLineLong} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeletonRow: { flexDirection: 'row', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  skeletonImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eceff0' },
  skeletonCells: { marginLeft: 12, flex: 1 },
  skeletonLineShort: { width: '30%', height: 12, backgroundColor: '#eceff0', marginBottom: 8, borderRadius: 6 },
  skeletonLineLong: { width: '60%', height: 12, backgroundColor: '#f3f5f5', borderRadius: 6 },
});

export default SkeletonRow;
