import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CheckBox from '../../../../components/CheckBox/CheckBox';

/**
 * Select-all row aligned with the tab plant count (e.g. "167 plant(s)").
 */
const ReceivingPlantCountHeader = ({
  plantCount = 0,
  isAllSelected = false,
  onSelectAll,
  selectedCount = 0,
  onClearSelection,
}) => (
  <View style={styles.row}>
    <View style={styles.selectAllGroup}>
      <CheckBox isChecked={isAllSelected} onToggle={onSelectAll} />
      <Text style={styles.selectAllLabel}>Select All</Text>
    </View>
    <View style={styles.countGroup}>
      {selectedCount > 0 && onClearSelection ? (
        <TouchableOpacity onPress={onClearSelection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      ) : null}
      {selectedCount > 0 ? (
        <Text style={styles.selectedHint}>{selectedCount} selected · </Text>
      ) : null}
      <Text style={styles.plantCount}>
        {plantCount} plant{plantCount === 1 ? '' : 's'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  selectAllGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  selectAllLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#393D40',
  },
  countGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  selectedHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },
  plantCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#647276',
    textAlign: 'right',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
    marginRight: 6,
  },
});

export default ReceivingPlantCountHeader;
