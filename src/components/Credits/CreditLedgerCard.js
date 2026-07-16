import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  formatCreditAmount,
  getTransactionMeta,
  getReasonMeta,
  getCreditTypeMeta,
} from '../../utils/creditEnums';
import { getCreditRowIcon } from './creditIcons';
import CaretDownIcon from '../../assets/icons/accent/caret-down-regular.svg';
import CreditLedgerDetails from './CreditLedgerDetails';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return (
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' • ' +
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function formatDateHeader(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return 'TODAY';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'YESTERDAY';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

export default function CreditLedgerCard({ item, isFirstInDay, showDebug, isAdmin, onClearCredit, onViewInvoice }) {
  const [expanded, setExpanded] = useState(false);
  const { component: IconComponent, palette } = getCreditRowIcon({
    transactionType: item.transactionType,
    reasonType: item.reasonType,
    creditType: item.creditType,
  });
  const meta = getTransactionMeta(item.transactionType);
  const reasonMeta = getReasonMeta(item.reasonType);
  const creditTypeMeta = getCreditTypeMeta(item.creditType);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const amountStyle = item.amount < 0 ? styles.amountNegative : styles.amountPositive;

  return (
    <View style={styles.wrapper}>
      {isFirstInDay && <Text style={styles.dayHeader}>{formatDateHeader(item.date)}</Text>}

      <TouchableOpacity activeOpacity={0.7} onPress={toggle} style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconContainer, { backgroundColor: palette.bg }]} >
            <IconComponent />
          </View>

          <View style={styles.content}>
            <View style={styles.topLine}>
              <Text style={styles.title}>{item.title || meta.label}</Text>
              <Text style={[styles.amount, amountStyle]}>{formatCreditAmount(item.amount)}</Text>
            </View>

            <View style={styles.subLine}>
              <Text style={styles.subtitle}>
                {item.subtitle || reasonMeta?.label || creditTypeMeta.label}
              </Text>
              <Text style={styles.date}>{formatDateTime(item.date)}</Text>
            </View>

            {item.reconstructed && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Legacy Record</Text>
              </View>
            )}

            <View style={styles.balanceLine}>
              <Text style={styles.balanceLabel}>Balance After</Text>
              {item.balanceAfter != null ? (
                <Text style={styles.balanceValue}>
                  {formatCreditAmount(item.balanceAfter).replace('+', '')}
                </Text>
              ) : (
                <Text style={styles.balanceMissing}>—</Text>
              )}
            </View>
          </View>

          <View style={[styles.chevron, expanded && styles.chevronOpen]}>
            <CaretDownIcon width={16} height={16} fill="#667085" />
          </View>
        </View>

        {expanded && (
          <CreditLedgerDetails
            item={item}
            isAdmin={isAdmin}
            onClearCredit={onClearCredit}
            onViewInvoice={onViewInvoice}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#98A2B3',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  row: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountPositive: {
    color: '#12B76A',
  },
  amountNegative: {
    color: '#F04438',
  },
  subLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#475467',
  },
  date: {
    fontSize: 12,
    color: '#98A2B3',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F4F7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#667085',
    fontWeight: '500',
  },
  balanceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#98A2B3',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
  },
  balanceMissing: {
    fontSize: 13,
    color: '#98A2B3',
  },
  chevron: {
    marginLeft: 12,
    alignSelf: 'center',
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
});
