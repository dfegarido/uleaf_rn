import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MockupHeader from './MockupHeader';
import {SAMPLE_PAYOUTS, formatUsd} from './mockData';

const ScreenB2BPayoutDetail = ({navigation, route}) => {
  const payout = route?.params?.payout || SAMPLE_PAYOUTS[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title={`Order #${payout.orderId}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.plant}>{payout.plant}</Text>
        <Text style={styles.meta}>
          {payout.potSize} · {payout.businessName} · {payout.country}
        </Text>

        <View style={styles.dates}>
          <DateCell label="Live Sale" value={payout.liveSaleDate} />
          <DateCell label="Order Date" value={payout.orderDate} />
          <DateCell label="Scan Date" value={payout.scanDate} />
        </View>

        <View style={styles.card}>
          <Row label="Listed USD price" value={formatUsd(payout.listedPrice)} />
          <Row
            label={`Commission (${payout.commissionRate}%)`}
            value={`− ${formatUsd(payout.commission)}`}
            negative
          />
          <Row label="Logistics" value={`− ${formatUsd(payout.logistics)}`} negative />
          <Row label="Plant Care" value={`− ${formatUsd(payout.plantCare)}`} negative />
          <View style={styles.divider} />
          <Row label="Net payout" value={formatUsd(payout.netPayout)} emphasis />
        </View>

        <View style={styles.flags}>
          <Flag label="Payment" value={payout.paymentStatus} tone="paid" />
          <Flag label="Payout" value={payout.payoutStatus} tone="open" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DateCell = ({label, value}) => (
  <View style={styles.dateCell}>
    <Text style={styles.dateLabel}>{label}</Text>
    <Text style={styles.dateValue}>{value}</Text>
  </View>
);

const Row = ({label, value, negative, emphasis}) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, emphasis && styles.emphasis]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        negative && styles.negative,
        emphasis && styles.emphasis,
      ]}>
      {value}
    </Text>
  </View>
);

const Flag = ({label, value, tone}) => (
  <View style={styles.flag}>
    <Text style={styles.flagLabel}>{label}</Text>
    <View style={[styles.flagChip, tone === 'paid' ? styles.paid : styles.open]}>
      <Text style={styles.flagText}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  plant: {fontSize: 20, fontWeight: '700', color: '#202325'},
  meta: {color: '#7F8D91', marginTop: 4, marginBottom: 16},
  dates: {flexDirection: 'row', gap: 8, marginBottom: 16},
  dateCell: {
    flex: 1,
    backgroundColor: '#F5F6F6',
    borderRadius: 10,
    padding: 10,
  },
  dateLabel: {color: '#7F8D91', fontSize: 11, marginBottom: 4},
  dateValue: {color: '#202325', fontWeight: '600', fontSize: 13},
  card: {
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowLabel: {color: '#556065', fontSize: 14},
  rowValue: {color: '#202325', fontSize: 14, fontWeight: '600'},
  negative: {color: '#B42318'},
  emphasis: {fontWeight: '700', color: '#202325', fontSize: 16},
  divider: {height: 1, backgroundColor: '#E4E7E9', marginBottom: 12},
  flags: {flexDirection: 'row', gap: 12, marginTop: 16},
  flag: {flex: 1},
  flagLabel: {color: '#7F8D91', fontSize: 12, marginBottom: 6},
  flagChip: {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6},
  paid: {backgroundColor: '#23C16B'},
  open: {backgroundColor: '#48A7F8'},
  flagText: {color: '#fff', fontWeight: '700', fontSize: 12},
});

export default ScreenB2BPayoutDetail;
