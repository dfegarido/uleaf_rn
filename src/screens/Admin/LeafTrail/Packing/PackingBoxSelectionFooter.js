import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckBox from '../../../../components/CheckBox/CheckBox';

const PackingBoxSelectionFooter = ({
  selectedCount,
  sendableCount,
  isAllSelected,
  onSelectAll,
  onClear,
  onSendToInTransit,
  sending = false,
}) => {
  const insets = useSafeAreaInsets();

  if (selectedCount === 0) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.topRow}>
        <Text style={styles.countText}>
          {selectedCount} box{selectedCount === 1 ? '' : 'es'} selected
        </Text>
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectAllRow}>
        <CheckBox isChecked={isAllSelected} onToggle={onSelectAll} />
        <Text style={styles.selectAllText}>Select all ready ({sendableCount})</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, sending && styles.primaryButtonDisabled]}
        onPress={onSendToInTransit}
        activeOpacity={0.85}
        disabled={sending}>
        {sending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Send to In Transit</Text>
        )}
      </TouchableOpacity>
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
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PackingBoxSelectionFooter;
