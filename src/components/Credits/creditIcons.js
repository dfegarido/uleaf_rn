import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TRANSACTION_TYPES, REASON_TYPES, CREDIT_TYPES } from '../../utils/creditEnums';

/**
 * Frontend icon mapping for credit ledger rows.
 * Presentation is owned by the frontend; backend only sends
 * transactionType, reasonType, and creditType.
 *
 * Since we cannot assume every SVG icon file exists, we render
 * simple geometric icon badges with color-coded backgrounds.
 */
const ICON_COLORS = {
  earned: { bg: '#E6F9EE', fg: '#12B76A' },
  used: { bg: '#FEE4E2', fg: '#F04438' },
  cleared: { bg: '#F2F4F7', fg: '#667085' },
  expired: { bg: '#FFFAEB', fg: '#F79009' },
  manual: { bg: '#E0EAFF', fg: '#2E90FA' },
  default: { bg: '#F2F4F7', fg: '#667085' },
};

function Badge({ symbol, palette }) {
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.symbol, { color: palette.fg }]}>{symbol}</Text>
    </View>
  );
}

export function getCreditRowIcon({ transactionType, reasonType, creditType }) {
  if (transactionType === TRANSACTION_TYPES.CLEARED) {
    return { component: () => <Badge symbol="−" palette={ICON_COLORS.cleared} />, palette: ICON_COLORS.cleared };
  }

  if (transactionType === TRANSACTION_TYPES.EXPIRED) {
    return { component: () => <Badge symbol="⌛" palette={ICON_COLORS.expired} />, palette: ICON_COLORS.expired };
  }

  if (transactionType === TRANSACTION_TYPES.USED) {
    return { component: () => <Badge symbol="−" palette={ICON_COLORS.used} />, palette: ICON_COLORS.used };
  }

  if (transactionType === TRANSACTION_TYPES.MANUAL_ADJUSTMENT) {
    return { component: () => <Badge symbol="✎" palette={ICON_COLORS.manual} />, palette: ICON_COLORS.manual };
  }

  // Earned / Refund / Reversal
  const isShipping =
    creditType === CREDIT_TYPES.SHIPPING ||
    reasonType === REASON_TYPES.MISSING_SHIPPING ||
    reasonType === REASON_TYPES.DAMAGED_SHIPPING ||
    reasonType === REASON_TYPES.SHIPPING_ISSUE;

  if (isShipping) {
    return { component: () => <Badge symbol="🚚" palette={ICON_COLORS.earned} />, palette: ICON_COLORS.earned };
  }

  if (reasonType === REASON_TYPES.MISSING_PLANT || reasonType === REASON_TYPES.WRONG_PLANT) {
    return { component: () => <Badge symbol="⚠" palette={ICON_COLORS.earned} />, palette: ICON_COLORS.earned };
  }

  if (reasonType === REASON_TYPES.DAMAGED_PLANT) {
    return { component: () => <Badge symbol="🌿" palette={ICON_COLORS.earned} />, palette: ICON_COLORS.earned };
  }

  return { component: () => <Badge symbol="+" palette={ICON_COLORS.earned} />, palette: ICON_COLORS.earned };
}

export function getCreditRowIconBackgroundColor(transactionType, creditType) {
  const { palette } = getCreditRowIcon({ transactionType, creditType });
  return palette.bg;
}

export function getCreditRowIconColor(transactionType, creditType) {
  const { palette } = getCreditRowIcon({ transactionType, creditType });
  return palette.fg;
}

const styles = StyleSheet.create({
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 14,
    fontWeight: '600',
  },
});
