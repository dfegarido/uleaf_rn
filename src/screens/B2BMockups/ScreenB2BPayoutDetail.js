import React, {useMemo, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import {ImagePickerModal} from '../../components/ImagePicker';
import MockupHeader from './MockupHeader';
import {
  CANCELLATION_FEE_PERCENT,
  DEFAULT_PARTIAL_PERCENT,
  PARTIAL_PERCENT_OPTIONS,
  SAMPLE_PAYOUTS,
  formatUsd,
  getCancellationFee,
  getGrossNetPayout,
  getPartialAmount,
  isExceptionCondition,
  isPayoutEligible,
  payoutStatusTone,
} from './mockData';

const ScreenB2BPayoutDetail = ({navigation, route}) => {
  const seed = route?.params?.payout || SAMPLE_PAYOUTS[0];
  const isAdmin = route?.params?.audience === 'admin';
  const [payoutStatus, setPayoutStatus] = useState(seed.payoutStatus);
  const [amountPaid, setAmountPaid] = useState(seed.amountPaid || 0);
  const [partialPercent, setPartialPercent] = useState(
    seed.partialPercent || DEFAULT_PARTIAL_PERCENT,
  );
  const [proofs, setProofs] = useState(seed.proofs || []);
  const [pendingKind, setPendingKind] = useState(null);

  const net = getGrossNetPayout(seed);
  const eligible = isPayoutEligible(seed);
  const exception = isExceptionCondition(seed);
  const cancellationFee = exception ? getCancellationFee(seed.listedPrice) : 0;
  const partialAmount = getPartialAmount(net, partialPercent);
  const remaining = Number(((net || 0) - amountPaid).toFixed(2));
  const tone = payoutStatusTone(payoutStatus);

  const scanLabel = seed.scanned
    ? `Scanned ${seed.scanDate}`
    : 'Seller has not scanned the QR code';

  const canPayPartial =
    isAdmin &&
    eligible &&
    !exception &&
    payoutStatus === 'Ready for partial' &&
    amountPaid === 0;
  const canPayFull =
    isAdmin &&
    eligible &&
    !exception &&
    seed.hubReceived &&
    amountPaid > 0 &&
    remaining > 0;
  const needsProof = pendingKind != null;

  const latestProof = useMemo(
    () => (proofs.length ? proofs[proofs.length - 1] : null),
    [proofs],
  );

  const attachProof = uris => {
    const uri = uris?.[0];
    if (!uri) {
      return;
    }
    const kind = pendingKind || (amountPaid > 0 ? 'full' : 'partial');
    const shouldApply = pendingKind != null;
    setProofs(prev => [
      ...prev,
      {
        kind,
        uri,
        label: 'Bank / Remitly screenshot',
        method: 'Remitly',
        attachedAt: 'Just now',
      },
    ]);
    setPendingKind(null);
    if (!shouldApply) {
      return;
    }
    if (kind === 'partial' && amountPaid === 0 && net > 0) {
      const paid = getPartialAmount(net, partialPercent);
      setAmountPaid(paid);
      setPayoutStatus(seed.hubReceived ? 'Ready for full' : 'Partially paid');
    } else if (kind === 'full' && remaining > 0) {
      setAmountPaid(net);
      setPayoutStatus('Fully paid');
    }
  };

  const requireProofThen = (kind, onReady) => {
    const hasKind = proofs.some(p => p.kind === kind);
    if (hasKind) {
      onReady();
      return;
    }
    setPendingKind(kind);
    Alert.alert(
      'Proof of transfer required',
      'Attach a screenshot of the bank or Remitly transaction before marking this payout.',
    );
  };

  const markPartial = () => {
    requireProofThen('partial', () => {
      setAmountPaid(partialAmount);
      setPayoutStatus(seed.hubReceived ? 'Ready for full' : 'Partially paid');
      Alert.alert(
        'Partially paid (mockup)',
        `${partialPercent}% of ${formatUsd(net)} = ${formatUsd(partialAmount)} marked paid. Remaining ${formatUsd(
          net - partialAmount,
        )} releases after hub staff receives the plant.`,
      );
    });
  };

  const markFull = () => {
    requireProofThen('full', () => {
      setAmountPaid(net);
      setPayoutStatus('Fully paid');
      Alert.alert(
        'Fully paid (mockup)',
        `Remaining ${formatUsd(remaining)} released. Hub received this plant.`,
      );
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title={`Order #${seed.orderId}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.plant}>{seed.plant}</Text>
        <Text style={styles.meta}>
          {seed.potSize} · {seed.businessName} · {seed.country}
        </Text>

        <View style={styles.flags}>
          <Flag label="Payout" value={payoutStatus} tone={tone} />
          <Flag
            label="Leaf Trail"
            value={seed.leafTrailStatus}
            tone={seed.scanned ? 'scan' : 'wait'}
          />
        </View>

        <View style={styles.scanCard}>
          <Text style={styles.scanTitle}>QR / scan status</Text>
          <Text style={styles.scanBody}>{scanLabel}</Text>
          <Text style={styles.scanHint}>
            Same scan visibility as Admin Orders. Payout is calculated only when
            Leaf Trail is Inventory for Hub.
          </Text>
        </View>

        <View style={styles.dates}>
          <DateCell label="Live Sale" value={seed.liveSaleDate} />
          <DateCell label="Order Date" value={seed.orderDate} />
          <DateCell label="Scan Date" value={seed.scanDate} />
        </View>

        {!eligible && !exception ? (
          <View style={styles.blockCard}>
            <Text style={styles.blockTitle}>Payout not calculated</Text>
            <Text style={styles.blockBody}>
              Seller must scan the plant QR first so Leaf Trail is Inventory for
              Hub. This confirms the sold plant exists and a QR is attached.
            </Text>
          </View>
        ) : exception ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>
              {seed.condition === 'missing' ? 'Missing' : 'Damaged'} plant
            </Text>
            <Text style={styles.alertBody}>
              Buyer plant credit is issued automatically. Seller is charged a{' '}
              {CANCELLATION_FEE_PERCENT}% cancellation fee on listed USD.
            </Text>
            <View style={styles.card}>
              <Row label="Listed USD price" value={formatUsd(seed.listedPrice)} />
              <Row
                label={`Cancellation fee (${CANCELLATION_FEE_PERCENT}%)`}
                value={formatUsd(cancellationFee)}
                negative
              />
              {amountPaid > 0 ? (
                <Row
                  label="Already paid to seller"
                  value={formatUsd(amountPaid)}
                  negative
                />
              ) : null}
              <View style={styles.divider} />
              <Row
                label="Net payout"
                value={formatUsd((net || 0) - amountPaid)}
                emphasis
                negative
              />
            </View>
            <Text style={styles.creditNote}>
              {seed.buyerCreditIssued
                ? 'Buyer credit issued automatically.'
                : 'Buyer credit would be issued automatically.'}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Row label="Listed USD price" value={formatUsd(seed.listedPrice)} />
            <Row
              label={`Commission (${seed.commissionRate}%)`}
              value={`− ${formatUsd(seed.commission)}`}
              negative
            />
            <Row label="Logistics" value={`− ${formatUsd(seed.logistics)}`} negative />
            <Row label="Plant Care" value={`− ${formatUsd(seed.plantCare)}`} negative />
            <View style={styles.divider} />
            <Row label="Net payout" value={formatUsd(net)} emphasis />
            <Row label="Paid so far" value={formatUsd(amountPaid)} />
            <Row label="Remaining" value={formatUsd(remaining)} />
          </View>
        )}

        {isAdmin && eligible && !exception ? (
          <>
            <Text style={styles.section}>Partial payout (70–80%)</Text>
            <View style={styles.segment}>
              {PARTIAL_PERCENT_OPTIONS.map(pct => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.segBtn, partialPercent === pct && styles.segBtnOn]}
                  disabled={amountPaid > 0}
                  onPress={() => setPartialPercent(pct)}>
                  <Text
                    style={[
                      styles.segText,
                      partialPercent === pct && styles.segTextOn,
                    ]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.partialHint}>
              {partialPercent}% of {formatUsd(net)} = {formatUsd(partialAmount)}. Full
              remaining releases after hub staff receives the plant.
            </Text>
          </>
        ) : null}

        {isAdmin ? (
          <View style={styles.proofCard}>
            <Text style={styles.section}>Proof of transfer</Text>
            <Text style={styles.proofHint}>
              Attach a screenshot of the bank or Remitly transaction before marking
              Partially paid or Fully paid.
            </Text>
            {proofs.map((proof, index) => (
              <View key={`${proof.kind}-${index}`} style={styles.proofRow}>
                {proof.uri ? (
                  <Image source={{uri: proof.uri}} style={styles.proofThumb} />
                ) : (
                  <View style={styles.proofPlaceholder}>
                    <Text style={styles.proofPlaceholderText}>IMG</Text>
                  </View>
                )}
                <View style={{flex: 1}}>
                  <Text style={styles.proofLabel}>{proof.label}</Text>
                  <Text style={styles.proofMeta}>
                    {proof.kind === 'full' ? 'Full payout' : 'Partial payout'} ·{' '}
                    {proof.method} · {proof.attachedAt}
                  </Text>
                </View>
              </View>
            ))}
            {needsProof ? (
              <Text style={styles.warn}>
                Attach {pendingKind === 'full' ? 'full' : 'partial'} payout proof to
                continue.
              </Text>
            ) : null}
            <ImagePickerModal onImagePicked={attachProof} limit={1} />
          </View>
        ) : proofs.length ? (
          <View style={styles.proofCard}>
            <Text style={styles.section}>Proof of transfer</Text>
            <Text style={styles.proofMeta}>
              {latestProof.label} · {latestProof.attachedAt}
            </Text>
          </View>
        ) : null}

        {isAdmin && canPayPartial ? (
          <TouchableOpacity style={globalStyles.primaryButton} onPress={markPartial}>
            <Text style={globalStyles.primaryButtonText}>
              Mark partially paid · {formatUsd(partialAmount)}
            </Text>
          </TouchableOpacity>
        ) : null}

        {isAdmin && canPayFull ? (
          <TouchableOpacity style={globalStyles.primaryButton} onPress={markFull}>
            <Text style={globalStyles.primaryButtonText}>
              Release full remaining · {formatUsd(remaining)}
            </Text>
          </TouchableOpacity>
        ) : null}

        {isAdmin && payoutStatus === 'Partially paid' && !seed.hubReceived ? (
          <Text style={styles.waitNote}>
            Waiting for hub staff to receive this plant before full remaining can be
            released.
          </Text>
        ) : null}
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
        emphasis && styles.emphasis,
        negative && styles.negative,
      ]}>
      {value}
    </Text>
  </View>
);

const Flag = ({label, value, tone}) => (
  <View style={styles.flag}>
    <Text style={styles.flagLabel}>{label}</Text>
    <View style={[styles.flagChip, styles[`flag_${tone}`]]}>
      <Text style={[styles.flagText, styles[`flagText_${tone}`]]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  plant: {fontSize: 20, fontWeight: '700', color: '#202325'},
  meta: {color: '#7F8D91', marginTop: 4, marginBottom: 16},
  flags: {flexDirection: 'row', gap: 12, marginBottom: 16},
  flag: {flex: 1},
  flagLabel: {color: '#7F8D91', fontSize: 12, marginBottom: 6},
  flagChip: {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6},
  flagText: {fontWeight: '700', fontSize: 12},
  flag_paid: {backgroundColor: '#DFECDF'},
  flagText_paid: {color: '#356641'},
  flag_partial: {backgroundColor: '#FEF0C7'},
  flagText_partial: {color: '#B54708'},
  flag_ready: {backgroundColor: '#D1E9FF'},
  flagText_ready: {color: '#175CD3'},
  flag_alert: {backgroundColor: '#FEE4E2'},
  flagText_alert: {color: '#B42318'},
  flag_wait: {backgroundColor: '#E4E7E9'},
  flagText_wait: {color: '#475467'},
  flag_scan: {backgroundColor: '#E4E7E9'},
  flagText_scan: {color: '#344054'},
  scanCard: {
    backgroundColor: '#F5F6F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  scanTitle: {fontWeight: '700', color: '#202325', marginBottom: 4},
  scanBody: {color: '#202325', fontSize: 14},
  scanHint: {color: '#7F8D91', fontSize: 12, marginTop: 6, lineHeight: 18},
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
  rowLabel: {color: '#556065', fontSize: 14, flex: 1, paddingRight: 8},
  rowValue: {color: '#202325', fontSize: 14, fontWeight: '600'},
  negative: {color: '#B42318'},
  emphasis: {fontWeight: '700', color: '#202325', fontSize: 16},
  divider: {height: 1, backgroundColor: '#E4E7E9', marginBottom: 12},
  blockCard: {
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    padding: 16,
  },
  blockTitle: {fontWeight: '700', color: '#202325', marginBottom: 6},
  blockBody: {color: '#556065', fontSize: 13, lineHeight: 20},
  alertCard: {
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    padding: 16,
  },
  alertTitle: {fontWeight: '700', color: '#B42318', marginBottom: 6},
  alertBody: {color: '#912018', fontSize: 13, lineHeight: 20, marginBottom: 12},
  creditNote: {color: '#356641', fontSize: 12, fontWeight: '600', marginTop: 10},
  section: {fontWeight: '700', color: '#202325', marginTop: 20, marginBottom: 8},
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F6',
    borderRadius: 10,
    padding: 4,
  },
  segBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center'},
  segBtnOn: {backgroundColor: '#fff'},
  segText: {color: '#7F8D91', fontSize: 13, fontWeight: '700'},
  segTextOn: {color: '#202325'},
  partialHint: {color: '#7F8D91', fontSize: 12, marginTop: 8, lineHeight: 18},
  proofCard: {marginTop: 8},
  proofHint: {color: '#7F8D91', fontSize: 12, marginBottom: 10, lineHeight: 18},
  proofRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10},
  proofThumb: {width: 48, height: 48, borderRadius: 8, backgroundColor: '#E4E7E9'},
  proofPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E4E7E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofPlaceholderText: {color: '#7F8D91', fontSize: 10, fontWeight: '700'},
  proofLabel: {fontWeight: '600', color: '#202325'},
  proofMeta: {color: '#7F8D91', fontSize: 12, marginTop: 2},
  warn: {color: '#B54708', fontSize: 12, fontWeight: '600', marginBottom: 8},
  waitNote: {color: '#B54708', fontSize: 12, marginTop: 12, lineHeight: 18},
});

export default ScreenB2BPayoutDetail;
