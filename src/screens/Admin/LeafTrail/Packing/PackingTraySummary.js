import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Tray detail progress — greenhouse scan vs admin box assignment.
 * variant="inline" — compact row under tray header
 */
const PackingTraySummary = ({ metrics, variant = 'inline' }) => {
  const {
    totalCount = 0,
    packedCount = 0,
    sortedCount = 0,
    boxAssignedCount = 0,
    needsBoxCount = 0,
  } = metrics || {};

  if (variant === 'card') {
    return (
      <View style={styles.wrapCard}>
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>Plants </Text>
          <Text style={styles.cardValue}>{totalCount}</Text>
        </Text>
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>Scanned </Text>
          <Text style={styles.cardValue}>
            {packedCount} of {totalCount}
          </Text>
        </Text>
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>Boxed </Text>
          <Text style={styles.cardValueGreen}>
            {boxAssignedCount} of {totalCount}
          </Text>
        </Text>
        {sortedCount > 0 ? (
          <Text style={styles.cardLine}>
            <Text style={styles.cardLabel}>To scan </Text>
            <Text style={styles.cardValueWarn}>{sortedCount}</Text>
          </Text>
        ) : null}
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.value}>{packedCount}</Text>
          <Text style={styles.label}>
            {'of '}
            <Text style={styles.labelBold}>{totalCount}</Text>
            {' scanned'}
          </Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.cell}>
          <Text style={[styles.value, sortedCount > 0 && styles.valueWarn]}>
            {sortedCount}
          </Text>
          <Text style={styles.label}>to scan</Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.cell}>
          <Text style={[styles.value, styles.valueGreen]}>{boxAssignedCount}</Text>
          <Text style={styles.label}>
            {'of '}
            <Text style={styles.labelBold}>{totalCount}</Text>
            {' boxed'}
          </Text>
        </View>
        {needsBoxCount > 0 ? (
          <>
            <View style={styles.sep} />
            <View style={styles.cell}>
              <Text style={[styles.value, styles.valueOrange]}>{needsBoxCount}</Text>
              <Text style={styles.label}>need box #</Text>
            </View>
          </>
        ) : null}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  wrapCard: { gap: 4, marginTop: 4 },
  cardLine: { fontSize: 13, lineHeight: 18 },
  cardLabel: { fontWeight: '500', color: '#647276' },
  cardValue: { fontWeight: '700', color: '#202325' },
  cardValueGreen: { fontWeight: '700', color: '#1B7A43' },
  cardValueWarn: { fontWeight: '700', color: '#E65100' },
  row: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#F4F7F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE7E1',
    paddingVertical: 10,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  sep: {
    width: 1,
    backgroundColor: '#DDE7E1',
    marginVertical: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202325',
  },
  valueGreen: {
    color: '#2F8C4F',
  },
  valueWarn: {
    color: '#E65100',
  },
  valueOrange: {
    color: '#F57C00',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#647276',
    textAlign: 'center',
  },
  labelBold: {
    fontWeight: '700',
    color: '#202325',
  },
});

export default PackingTraySummary;
