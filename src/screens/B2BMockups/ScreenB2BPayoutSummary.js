import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import MockupHeader from './MockupHeader';
import {SAMPLE_PAYOUTS, formatUsd} from './mockData';

const GROUP_KEYS = [
  {key: 'liveSaleDate', label: 'Live Sale Date'},
  {key: 'orderDate', label: 'Order Date'},
  {key: 'scanDate', label: 'Scan Date'},
];

const ScreenB2BPayoutSummary = ({navigation, route}) => {
  const isAdmin = route?.params?.audience === 'admin';
  const [groupBy, setGroupBy] = useState('liveSaleDate');

  const groups = useMemo(() => {
    const map = {};
    SAMPLE_PAYOUTS.forEach(item => {
      const key = item[groupBy] || '—';
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });
    return Object.entries(map);
  }, [groupBy]);

  const totals = SAMPLE_PAYOUTS.reduce(
    (acc, item) => {
      acc.listed += item.listedPrice;
      acc.commission += item.commission;
      acc.logistics += item.logistics;
      acc.plantCare += item.plantCare;
      acc.net += item.netPayout;
      return acc;
    },
    {listed: 0, commission: 0, logistics: 0, plantCare: 0, net: 0},
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader
        navigation={navigation}
        title={isAdmin ? 'Admin B2B Payouts' : 'B2B Payouts'}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={globalStyles.textMDWhite}>Net payout</Text>
          <Text style={[globalStyles.textXLWhite, {paddingTop: 8}]}>
            {formatUsd(totals.net)}
          </Text>
          <Text style={styles.heroSub}>
            {formatUsd(totals.listed)} listed − {formatUsd(totals.commission)} commission −{' '}
            {formatUsd(totals.logistics)} logistics − {formatUsd(totals.plantCare)} plant care
          </Text>
        </View>

        <Text style={styles.groupLabel}>Group by</Text>
        <View style={styles.segment}>
          {GROUP_KEYS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.segBtn, groupBy === item.key && styles.segBtnOn]}
              onPress={() => setGroupBy(item.key)}>
              <Text style={[styles.segText, groupBy === item.key && styles.segTextOn]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {groups.map(([date, items]) => {
          const net = items.reduce((sum, row) => sum + row.netPayout, 0);
          return (
            <View key={date} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>{date}</Text>
                <Text style={styles.groupNet}>{formatUsd(net)}</Text>
              </View>
              {items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.orderRow}
                  onPress={() =>
                    navigation.navigate('ScreenB2BPayoutDetail', {payout: item})
                  }>
                  <View style={{flex: 1}}>
                    <Text style={styles.orderPlant}>{item.plant}</Text>
                    <Text style={styles.orderMeta}>
                      Order #{item.orderId} · {item.potSize}
                    </Text>
                  </View>
                  <Text style={styles.orderNet}>{formatUsd(item.netPayout)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        <TouchableOpacity
          style={globalStyles.secondaryButtonAccent}
          onPress={() =>
            Alert.alert('Export', 'Export is mocked. CSV would include order, business, dates, listed price, commission, logistics, plant care, and net payout.')
          }>
          <Text style={globalStyles.secondaryButtonButtonTextAccent}>Export</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  hero: {
    backgroundColor: '#202325',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  heroSub: {color: '#CDD3D4', fontSize: 12, marginTop: 10, lineHeight: 18},
  groupLabel: {color: '#7F8D91', fontSize: 12, marginBottom: 8, fontWeight: '600'},
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center'},
  segBtnOn: {backgroundColor: '#fff'},
  segText: {color: '#7F8D91', fontSize: 11, fontWeight: '600', textAlign: 'center'},
  segTextOn: {color: '#202325'},
  group: {
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E4E7E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  groupTitle: {fontWeight: '700', color: '#202325'},
  groupNet: {fontWeight: '700', color: '#356641'},
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
  },
  orderPlant: {fontWeight: '600', color: '#202325'},
  orderMeta: {color: '#7F8D91', fontSize: 12, marginTop: 2},
  orderNet: {fontWeight: '700', color: '#202325'},
});

export default ScreenB2BPayoutSummary;
