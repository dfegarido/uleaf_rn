import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import CaretRightIcon from '../../../../assets/icons/greylight/caret-right-regular.svg';

export const formatPayoutAmount = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  const [whole, cents] = Math.abs(n).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}${grouped}.${cents}`;
};

const STATUS_THEME = {
  paid: {bg: '#E6F4EB', fg: '#23794A', dot: '#23C16B', tile: '#E6F4EB'},
  receivable: {bg: '#E8F2FC', fg: '#1F6FB5', dot: '#48A7F8', tile: '#E8F2FC'},
};
const FALLBACK_THEME = {bg: '#F2F3F3', fg: '#393D40', dot: '#9AA3A6', tile: '#F2F3F3'};

const PayoutCard = ({item}) => {
  const status = item?.status || 'Unknown';
  const theme = STATUS_THEME[String(status).toLowerCase()] || FALLBACK_THEME;
  const symbol = item?.totalReceivableAmountCurrencySymbol || '$';

  return (
    <View style={styles.card}>
      <View style={[styles.tile, {backgroundColor: theme.tile}]}>
        <Text style={[styles.tileText, {color: theme.fg}]}>{symbol}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.date} numberOfLines={1}>
          {item?.payOutDate || 'Payout date pending'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Sales period · {item?.salesPeriod || '—'}
        </Text>
        {item?.referenceNumber ? (
          <Text style={styles.ref} numberOfLines={1}>
            Ref # {item.referenceNumber}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={styles.amount} numberOfLines={1}>
          {symbol}
          {formatPayoutAmount(item?.totalReceivableAmountLocal)}
        </Text>
        <View style={[styles.pill, {backgroundColor: theme.bg}]}>
          <View style={[styles.pillDot, {backgroundColor: theme.dot}]} />
          <Text style={[styles.pillText, {color: theme.fg}]}>{status}</Text>
        </View>
      </View>

      <CaretRightIcon width={18} height={18} style={styles.chevron} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {fontFamily: 'Inter', fontSize: 18, fontWeight: '700'},
  body: {flex: 1, gap: 3},
  date: {fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#202325'},
  meta: {fontFamily: 'Inter', fontSize: 12, color: '#647276'},
  ref: {fontFamily: 'Inter', fontSize: 12, color: '#9AA3A6'},
  right: {alignItems: 'flex-end', gap: 6, maxWidth: '40%'},
  amount: {fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#202325'},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillDot: {width: 6, height: 6, borderRadius: 3},
  pillText: {fontFamily: 'Inter', fontSize: 12, fontWeight: '600'},
  chevron: {marginLeft: -4},
});

export default PayoutCard;
