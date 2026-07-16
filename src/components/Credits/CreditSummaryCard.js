import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WarningIcon from './WarningIcon';
import { formatCreditBalance, formatAvailableCreditBalance, getCreditTypeMeta, CREDIT_COLORS } from '../../utils/creditEnums';

export default function CreditSummaryCard({
  plantAvailable,
  shippingAvailable,
  combinedAvailable,
  plantActual,
  shippingActual,
  requiresInvestigation = false,
  showDiagnostics = false,
}) {
  const plantMeta = getCreditTypeMeta('plant');
  const shippingMeta = getCreditTypeMeta('shipping');
  const total = Number(combinedAvailable) || 0;
  const displayTotal = Math.max(0, total);

  const hasNegativePlant = showDiagnostics && plantActual < 0;
  const hasNegativeShipping = showDiagnostics && shippingActual < 0;
  const shouldShowInvestigation = showDiagnostics && Boolean(requiresInvestigation) && (hasNegativePlant || hasNegativeShipping);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Available Credits</Text>
      <Text style={styles.total}>{formatCreditBalance(displayTotal)}</Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.lineItem}>
          <View style={[styles.dot, { backgroundColor: plantMeta.color }]} />
          <Text style={styles.lineLabel}>Plant Credit</Text>
        </View>
        <Text style={[styles.lineValue, { color: plantMeta.color }]}>
          {formatAvailableCreditBalance(plantAvailable)}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lineItem}>
          <View style={[styles.dot, { backgroundColor: shippingMeta.color }]} />
          <Text style={styles.lineLabel}>Shipping Credit</Text>
        </View>
        <Text style={[styles.lineValue, { color: shippingMeta.color }]}>
          {formatAvailableCreditBalance(shippingAvailable)}
        </Text>
      </View>

      {shouldShowInvestigation && (
        <View style={styles.warningBox}>
          <View style={styles.warningTitleRow}>
            <WarningIcon size={14} color={CREDIT_COLORS.red} />
            <Text style={styles.warningTitle}>Needs Investigation</Text>
          </View>
          {plantActual < 0 && (
            <Text style={styles.warningLine}>
              Plant ledger balance: {formatCreditBalance(plantActual)} (displayed as {formatAvailableCreditBalance(plantAvailable)})
            </Text>
          )}
          {shippingActual < 0 && (
            <Text style={styles.warningLine}>
              Shipping ledger balance: {formatCreditBalance(shippingActual)} (displayed as {formatAvailableCreditBalance(shippingAvailable)})
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  label: {
    fontSize: 14,
    color: '#475467',
    marginBottom: 8,
  },
  total: {
    fontSize: 36,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7EC',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  lineLabel: {
    fontSize: 14,
    color: '#475467',
  },
  lineValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B42318',
    marginBottom: 4,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningLine: {
    fontSize: 12,
    color: '#B42318',
    marginTop: 2,
  },
});
