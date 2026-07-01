import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BoxIcon from '../../../../assets/admin-icons/box-black.svg';
import CheckBox from '../../../../components/CheckBox/CheckBox';

const PackingSelectionFooter = ({
  selectedCount,
  assignableCount,
  isAllSelected,
  onSelectAll,
  onClear,
  onAssignBox,
  onNeedsToStay,
  assignBoxLabel = 'Assign box #',
}) => {
  const insets = useSafeAreaInsets();

  if (selectedCount === 0) return null;

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

      <View style={styles.selectAllRow}>
        <CheckBox isChecked={isAllSelected} onToggle={onSelectAll} />
        <Text style={styles.selectAllText}>
          Select all ({assignableCount})
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onAssignBox} activeOpacity={0.85}>
          <BoxIcon width={20} height={20} />
          <Text style={styles.primaryButtonText}>{assignBoxLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onNeedsToStay} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>Needs to Stay</Text>
        </TouchableOpacity>
      </View>
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
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#647276',
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#647276',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PackingSelectionFooter;
