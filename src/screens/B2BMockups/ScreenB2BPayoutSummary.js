import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import RightIcon from '../../assets/icons/greydark/caret-right-regular.svg';
import {globalStyles} from '../../assets/styles/styles';
import MockupHeader from './MockupHeader';
import {
  SAMPLE_PAYOUTS,
  formatUsd,
  getCancellationFee,
  getGrossNetPayout,
  isExceptionCondition,
  isPayoutEligible,
  payoutStatusTone,
} from './mockData';

const GROUP_KEYS = [
  {key: 'liveSaleDate', label: 'Live sale'},
  {key: 'orderDate', label: 'Order'},
  {key: 'scanDate', label: 'Scan'},
];

const STATUS_FILTERS = [
  {key: 'all', label: 'All'},
  {key: 'Ready for partial', label: 'Ready'},
  {key: 'Partially paid', label: 'Partial'},
  {key: 'Fully paid', label: 'Paid'},
  {key: 'Awaiting scan', label: 'Unscanned'},
  {key: 'Missing / Damaged', label: 'Issues'},
];

const ScreenB2BPayoutSummary = ({navigation, route}) => {
  const isAdmin = route?.params?.audience === 'admin';
  const [groupBy, setGroupBy] = useState('liveSaleDate');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') {
      return SAMPLE_PAYOUTS;
    }
    return SAMPLE_PAYOUTS.filter(item => item.payoutStatus === statusFilter);
  }, [statusFilter]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(item => {
      const key = item[groupBy] || 'Not scanned';
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });
    return Object.entries(map);
  }, [filtered, groupBy]);

  const totals = SAMPLE_PAYOUTS.reduce(
    (acc, item) => {
      if (!item.scanned) {
        acc.awaitingScan += 1;
        return acc;
      }
      if (isExceptionCondition(item)) {
        const fee = getCancellationFee(item.listedPrice);
        acc.cancellationFees += fee;
        acc.net -= fee;
        acc.issues += 1;
        return acc;
      }
      if (!isPayoutEligible(item)) {
        return acc;
      }
      acc.listed += item.listedPrice;
      acc.commission += item.commission;
      acc.logistics += item.logistics;
      acc.plantCare += item.plantCare;
      acc.net += item.netPayout || 0;
      acc.paid += item.amountPaid || 0;
      return acc;
    },
    {
      listed: 0,
      commission: 0,
      logistics: 0,
      plantCare: 0,
      cancellationFees: 0,
      net: 0,
      paid: 0,
      awaitingScan: 0,
      issues: 0,
    },
  );

  const remaining = Number((totals.net - totals.paid).toFixed(2));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader
        navigation={navigation}
        title={isAdmin ? 'B2B Payouts' : 'Payouts'}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>{isAdmin ? 'ADMIN' : 'SELLER'}</Text>
          <Text style={styles.heroLabel}>Net payout</Text>
          <Text style={styles.heroAmount}>{formatUsd(totals.net)}</Text>
          <View style={styles.heroStats}>
            <HeroStat label="Paid" value={formatUsd(totals.paid)} />
            <HeroStat label="Remaining" value={formatUsd(remaining)} />
            <HeroStat label="Unscanned" value={String(totals.awaitingScan)} />
          </View>
        </View>

        <View style={styles.formulaCard}>
          <FormulaLine label="Listed" value={formatUsd(totals.listed)} />
          <FormulaLine label="Commission" value={`− ${formatUsd(totals.commission)}`} dim />
          <FormulaLine label="Logistics" value={`− ${formatUsd(totals.logistics)}`} dim />
          <FormulaLine label="Plant care" value={`− ${formatUsd(totals.plantCare)}`} dim />
          {totals.cancellationFees > 0 ? (
            <FormulaLine
              label="Cancellation 3.5%"
              value={`− ${formatUsd(totals.cancellationFees)}`}
              alert
            />
          ) : null}
        </View>

        <View style={styles.ruleRow}>
          <RuleChip text="Scan QR first" />
          <RuleChip text="Pay 70–80%" />
          <RuleChip text="Full after hub" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, statusFilter === item.key && styles.filterChipOn]}
              onPress={() => setStatusFilter(item.key)}>
              <Text
                style={[
                  styles.filterText,
                  statusFilter === item.key && styles.filterTextOn,
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.groupBar}>
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
        </View>

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No payouts in this filter</Text>
            <Text style={styles.emptyBody}>Switch status to see other plants.</Text>
          </View>
        ) : (
          groups.map(([date, items]) => {
            const net = items.reduce((sum, row) => sum + (getGrossNetPayout(row) || 0), 0);
            return (
              <View key={date} style={styles.dateBlock}>
                <View style={styles.dateHead}>
                  <Text style={styles.dateTitle}>{date}</Text>
                  <Text style={[styles.dateNet, net < 0 && styles.negative]}>
                    {formatUsd(net)}
                  </Text>
                </View>
                {items.map(item => (
                  <PayoutCard
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigation.navigate('ScreenB2BPayoutDetail', {
                        payout: item,
                        audience: isAdmin ? 'admin' : 'seller',
                      })
                    }
                  />
                ))}
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={globalStyles.secondaryButtonAccent}
          onPress={() =>
            Alert.alert(
              'Export',
              'CSV would include order, scan status, leaf trail, payout status, listed price, fees, cancellation 3.5%, partial/full paid, and proof of transfer.',
            )
          }>
          <Text style={globalStyles.secondaryButtonButtonTextAccent}>Export</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const PayoutCard = ({item, onPress}) => {
  const netValue = getGrossNetPayout(item);
  const tone = payoutStatusTone(item.payoutStatus);
  const remaining = Number(((netValue || 0) - (item.amountPaid || 0)).toFixed(2));
  const hasProof = (item.proofs || []).length > 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={{flex: 1, paddingRight: 12}}>
          <Text style={styles.plant}>{item.plant}</Text>
          <Text style={styles.meta}>
            #{item.orderId} · {item.potSize} · {item.businessName}
          </Text>
        </View>
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amount,
              netValue == null && styles.muted,
              netValue < 0 && styles.negative,
            ]}>
            {formatUsd(netValue)}
          </Text>
          {item.amountPaid > 0 && netValue != null ? (
            <Text style={styles.paidHint}>
              {item.payoutStatus === 'Fully paid'
                ? 'Paid in full'
                : `${formatUsd(item.amountPaid)} paid`}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardBadges}>
        <StatusChip label={item.payoutStatus} tone={tone} />
        <StatusChip
          label={item.scanned ? item.leafTrailStatus : 'Not scanned'}
          tone={item.scanned ? 'scan' : 'wait'}
        />
        {hasProof ? <StatusChip label="Proof attached" tone="paid" /> : null}
      </View>

      <View style={styles.cardFoot}>
        <Text style={styles.footText}>
          {netValue == null
            ? 'Payout waits for seller QR scan'
            : item.payoutStatus === 'Fully paid'
              ? 'No remaining balance'
              : `Remaining ${formatUsd(remaining)}`}
        </Text>
        <RightIcon width={16} height={16} />
      </View>
    </TouchableOpacity>
  );
};

const HeroStat = ({label, value}) => (
  <View style={styles.heroStat}>
    <Text style={styles.heroStatValue}>{value}</Text>
    <Text style={styles.heroStatLabel}>{label}</Text>
  </View>
);

const FormulaLine = ({label, value, dim, alert}) => (
  <View style={styles.formulaLine}>
    <Text style={styles.formulaLabel}>{label}</Text>
    <Text
      style={[
        styles.formulaValue,
        dim && styles.formulaDim,
        alert && styles.negative,
      ]}>
      {value}
    </Text>
  </View>
);

const RuleChip = ({text}) => (
  <View style={styles.ruleChip}>
    <Text style={styles.ruleText}>{text}</Text>
  </View>
);

const StatusChip = ({label, tone}) => (
  <View style={[styles.chip, styles[`chip_${tone}`]]}>
    <Text style={[styles.chipText, styles[`chipText_${tone}`]]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  hero: {
    backgroundColor: '#f2f7f3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroKicker: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroLabel: {color: '#556065', fontSize: 13, marginTop: 10},
  heroAmount: {color: '#539461', fontSize: 32, fontWeight: '700', marginTop: 4},
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#DFECDF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroStat: {flex: 1, alignItems: 'center'},
  heroStatValue: {color: '#356641', fontWeight: '700', fontSize: 13},
  heroStatLabel: {color: '#556065', fontSize: 10, marginTop: 4, fontWeight: '600'},
  formulaCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  formulaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formulaLabel: {color: '#7F8D91', fontSize: 13},
  formulaValue: {color: '#202325', fontSize: 13, fontWeight: '600'},
  formulaDim: {color: '#7F8D91'},
  ruleRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  ruleChip: {
    flex: 1,
    backgroundColor: '#DFECDF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  ruleText: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  filterRow: {gap: 8, paddingBottom: 4, marginBottom: 12},
  filterChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipOn: {backgroundColor: '#539461', borderColor: '#539461'},
  filterText: {color: '#356641', fontSize: 12, fontWeight: '700'},
  filterTextOn: {color: '#fff'},
  groupBar: {marginBottom: 16},
  groupLabel: {color: '#7F8D91', fontSize: 11, fontWeight: '700', marginBottom: 8},
  segment: {
    flexDirection: 'row',
    backgroundColor: '#f2f7f3',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  segBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center'},
  segBtnOn: {backgroundColor: '#539461'},
  segText: {color: '#356641', fontSize: 12, fontWeight: '600'},
  segTextOn: {color: '#fff'},
  dateBlock: {marginBottom: 8},
  dateHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dateTitle: {fontWeight: '700', color: '#556065', fontSize: 13},
  dateNet: {fontWeight: '700', color: '#356641', fontSize: 13},
  card: {
    backgroundColor: '#f2f7f3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  cardTop: {flexDirection: 'row', alignItems: 'flex-start'},
  plant: {fontWeight: '700', color: '#202325', fontSize: 16},
  meta: {color: '#7F8D91', fontSize: 12, marginTop: 4},
  amountCol: {alignItems: 'flex-end'},
  amount: {fontWeight: '700', color: '#539461', fontSize: 18},
  paidHint: {color: '#7F8D91', fontSize: 11, marginTop: 4},
  muted: {color: '#7F8D91'},
  negative: {color: '#B42318'},
  cardBadges: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12},
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C0DAC2',
  },
  footText: {color: '#7F8D91', fontSize: 12, fontWeight: '600'},
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {fontWeight: '700', color: '#202325'},
  emptyBody: {color: '#7F8D91', marginTop: 6, fontSize: 13},
  chip: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6},
  chipText: {fontSize: 10, fontWeight: '700'},
  chip_paid: {backgroundColor: '#DFECDF'},
  chipText_paid: {color: '#356641'},
  chip_partial: {backgroundColor: '#FEF0C7'},
  chipText_partial: {color: '#B54708'},
  chip_ready: {backgroundColor: '#D1E9FF'},
  chipText_ready: {color: '#175CD3'},
  chip_alert: {backgroundColor: '#FEE4E2'},
  chipText_alert: {color: '#B42318'},
  chip_wait: {backgroundColor: '#E4E7E9'},
  chipText_wait: {color: '#475467'},
  chip_scan: {backgroundColor: '#F2F7F3'},
  chipText_scan: {color: '#356641'},
});

export default ScreenB2BPayoutSummary;
