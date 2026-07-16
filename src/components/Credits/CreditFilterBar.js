import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'used', label: 'Used' },
  { key: 'cleared', label: 'Cleared' },
  { key: 'expired', label: 'Expired' },
];

export default function CreditFilterBar({ activeFilter, onFilterChange, sort, onSortChange }) {
  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onFilterChange(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.sortButton} onPress={onSortChange}>
        <Text style={styles.sortText}>{sort === 'asc' ? '↑ Oldest' : '↓ Newest'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#101828',
  },
  chipText: {
    fontSize: 13,
    color: '#475467',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortText: {
    fontSize: 13,
    color: '#475467',
  },
});
