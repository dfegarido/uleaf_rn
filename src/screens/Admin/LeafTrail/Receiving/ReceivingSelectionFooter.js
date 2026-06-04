import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bulk status actions only — Print / Export / Scan QR stay in the screen header. */
const ReceivingSelectionFooter = ({
  visible,
  selectedCount,
  onClear,
  onLeafTrailPress,
  onPlantStatusPress,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.topRow}>
        <Text style={styles.countText}>
          {selectedCount} plant{selectedCount === 1 ? '' : 's'} selected
        </Text>
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusActions}>
        <TouchableOpacity style={styles.statusButton} onPress={onLeafTrailPress} activeOpacity={0.85}>
          <Text style={styles.statusButtonText}>Change leaf trail status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusButton} onPress={onPlantStatusPress} activeOpacity={0.85}>
          <Text style={styles.statusButtonText}>Change plant status</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE3E5',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202325',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },
  statusActions: {
    gap: 8,
    paddingBottom: 4,
  },
  statusButton: {
    backgroundColor: '#202325',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReceivingSelectionFooter;

export const RECEIVING_SELECTION_FOOTER_HEIGHT = 118;
