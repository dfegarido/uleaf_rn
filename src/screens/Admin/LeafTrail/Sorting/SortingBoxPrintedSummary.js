import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const StatCell = ({ label, value, accent }) => (
  <View style={styles.statCell}>
    <Text style={styles.statCellLabel}>{label}</Text>
    <Text style={[styles.statCellValue, accent && styles.statCellValueAccent]}>{value}</Text>
  </View>
);

const ProgressRow = ({ label, current, total, color }) => {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressFraction}>
          <Text style={styles.progressCurrent}>{current}</Text>
          <Text style={styles.progressOf}> of {total}</Text>
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

/**
 * Trail #3 printed stats.
 * variant="card" — compact tile
 * variant="detail" — full box detail dashboard
 */
const SortingBoxPrintedSummary = ({ metrics, variant = 'card' }) => {
  const {
    forReceivingCount = 0,
    receivedCount = 0,
    sortedCount = 0,
    needsToStayCount = 0,
    othersCount = 0,
    missingCount = 0,
    damagedCount = 0,
    totalPlantsToFulfill = 0,
  } = metrics || {};

  const denom = forReceivingCount;

  if (variant === 'card') {
    return (
      <View style={styles.wrapCard}>
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>For Receiving </Text>
          <Text style={styles.cardValue}>{forReceivingCount}</Text>
        </Text>
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>Received </Text>
          <Text style={styles.cardValue}>
            {receivedCount} of {denom}
          </Text>
        </Text>
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>Sorted </Text>
          <Text style={styles.cardValueSorted}>
            {sortedCount} of {denom}
          </Text>
        </Text>
      </View>
    );
  }

  const fulfillHint = `${receivedCount} − ${missingCount} − ${damagedCount} − ${needsToStayCount} − ${othersCount}`;

  return (
    <View style={styles.wrapDetail}>
      <View style={styles.statRow}>
        <StatCell label="For Receiving" value={String(forReceivingCount)} />
        <View style={styles.statDivider} />
        <StatCell label="Received" value={`${receivedCount}/${denom}`} />
        <View style={styles.statDivider} />
        <StatCell label="Sorted" value={`${sortedCount}/${denom}`} accent />
      </View>

      <ProgressRow label="Received at the hub" current={receivedCount} total={denom} color="#539461" />
      <ProgressRow label="Sorted" current={sortedCount} total={denom} color="#2F8C4F" />

      {(needsToStayCount > 0 || othersCount > 0 || missingCount > 0 || damagedCount > 0) && (
        <View style={styles.excludedSection}>
          <Text style={styles.excludedHeading}>Excluded from fulfillment</Text>
          <View style={styles.chipRow}>
            {needsToStayCount > 0 ? (
              <View style={[styles.chip, styles.chipStay]}>
                <Text style={styles.chipText}>Need to Stay · {needsToStayCount}</Text>
              </View>
            ) : null}
            {othersCount > 0 ? (
              <View style={[styles.chip, styles.chipOthers]}>
                <Text style={styles.chipText}>Others · {othersCount}</Text>
              </View>
            ) : null}
            {missingCount > 0 ? (
              <View style={[styles.chip, styles.chipMissing]}>
                <Text style={styles.chipText}>Missing · {missingCount}</Text>
              </View>
            ) : null}
            {damagedCount > 0 ? (
              <View style={[styles.chip, styles.chipDamaged]}>
                <Text style={styles.chipText}>Damaged · {damagedCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.fulfillCard}>
        <Text style={styles.fulfillTitle}>Outstanding Plants</Text>
        <Text style={styles.fulfillCount}>{totalPlantsToFulfill}</Text>
        <Text style={styles.fulfillHint}>{fulfillHint} = {totalPlantsToFulfill}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapCard: { gap: 6, marginTop: 4 },
  cardLine: { fontSize: 14, lineHeight: 20 },
  cardLabel: { fontWeight: '500', color: '#647276' },
  cardValue: { fontWeight: '700', color: '#202325' },
  cardValueSorted: { fontWeight: '700', color: '#1B7A43' },
  wrapDetail: { gap: 16 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statCellLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#647276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statCellValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202325',
  },
  statCellValueAccent: { color: '#2F8C4F' },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E3E7E8',
  },
  progressBlock: { gap: 6 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#556065' },
  progressFraction: { fontSize: 14 },
  progressCurrent: { fontWeight: '800', color: '#202325' },
  progressOf: { fontWeight: '500', color: '#647276' },
  progressTrack: {
    height: 8,
    backgroundColor: '#E8ECEA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  excludedSection: { gap: 8 },
  excludedHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#647276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipStay: { backgroundColor: '#FFF8E6' },
  chipOthers: { backgroundColor: '#EEF1F2' },
  chipMissing: { backgroundColor: '#FDECEA' },
  chipDamaged: { backgroundColor: '#FDECEA' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#5C4030' },
  fulfillCard: {
    backgroundColor: '#EAF7EF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8DFC4',
    padding: 14,
    alignItems: 'center',
  },
  fulfillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F6B3E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fulfillCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B7A43',
    marginVertical: 4,
  },
  fulfillHint: {
    fontSize: 12,
    color: '#556065',
    fontStyle: 'italic',
  },
});

export default SortingBoxPrintedSummary;
