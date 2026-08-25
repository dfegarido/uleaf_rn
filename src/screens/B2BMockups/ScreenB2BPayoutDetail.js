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
import {updateB2BPayoutApi} from '../../components/Api/b2bPayoutApi';
import MockupHeader from './MockupHeader';
import {
  CANCELLATION_FEE_PERCENT,
  DEFAULT_PARTIAL_PERCENT,
  PARTIAL_PERCENT_OPTIONS,
  formatUsd,
  getCancellationFee,
  getGrossNetPayout,
  getPartialAmount,
  isExceptionCondition,
  isPayoutEligible,
  payoutStatusTone,
} from './mockData';

const ScreenB2BPayoutDetail = ({navigation, route}) => {
  const seed = route?.params?.payout;
  const isAdmin = route?.params?.audience === 'admin';
  const [payoutStatus, setPayoutStatus] = useState(seed.payoutStatus);
  const [amountPaid, setAmountPaid] = useState(seed.amountPaid || 0);
  const [partialPercent, setPartialPercent] = useState(
    seed.partialPercent || DEFAULT_PARTIAL_PERCENT,
  );
  const [proofs, setProofs] = useState(seed.proofs || []);
  const [pendingKind, setPendingKind] = useState(null);
  const [saving, setSaving] = useState(false);

  const applyPayout = next => {
    if (!next) {
      return;
    }
    setPayoutStatus(next.payoutStatus);
    setAmountPaid(next.amountPaid || 0);
    setPartialPercent(next.partialPercent || DEFAULT_PARTIAL_PERCENT);
    setProofs(next.proofs || []);
  };

  const persist = async payload => {
    if (!seed?.orderDocId && !seed?.id) {
      return {ok: false, error: 'No payout selected'};
    }
    setSaving(true);
    const result = await updateB2BPayoutApi({
      payoutId: seed.orderDocId || seed.id,
      ...payload,
    });
    setSaving(false);
    if (result.success) {
      applyPayout(result.data?.payout);
      return {ok: true};
    }
    return {ok: false, error: result.error};
  };

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

  const attachProof = async uris => {
    const uri = uris?.[0];
    if (!uri) {
      return;
    }
    const kind = pendingKind || (amountPaid > 0 ? 'full' : 'partial');
    const shouldApply = pendingKind != null;
    const localProof = {
      kind,
      uri,
      label: 'Bank / Remitly screenshot',
      method: 'Remitly',
      attachedAt: 'Just now',
    };
    setProofs(prev => [...prev, localProof]);
    setPendingKind(null);

    const saved = await persist({action: 'attachProof', kind, uri});
    if (!saved.ok && !saved.sample) {
      Alert.alert('Not saved to backend', saved.error || 'Functions are not running on this branch.');
    }

    if (!shouldApply) {
      return;
    }
    if (kind === 'partial' && amountPaid === 0 && net > 0) {
      const paid = getPartialAmount(net, partialPercent);
      if (saved.sample) {
        setAmountPaid(paid);
        setPayoutStatus(seed.hubReceived ? 'Ready for full' : 'Partially paid');
      } else {
        await persist({action: 'markPartial', partialPercent, uri});
      }
    } else if (kind === 'full' && remaining > 0) {
      if (saved.sample) {
        setAmountPaid(net);
        setPayoutStatus('Fully paid');
      } else {
        await persist({action: 'markFull', uri});
      }
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

  const markPartial = async () => {
    requireProofThen('partial', async () => {
      const saved = await persist({action: 'markPartial', partialPercent});
      if (saved.sample || !saved.ok) {
        setAmountPaid(partialAmount);
        setPayoutStatus(seed.hubReceived ? 'Ready for full' : 'Partially paid');
      }
      Alert.alert(
        saved.ok ? 'Partially paid' : 'Partially paid (local only)',
        `${partialPercent}% of ${formatUsd(net)} = ${formatUsd(partialAmount)}. Remaining ${formatUsd(
          net - partialAmount,
        )} releases after hub staff receives the plant.${
          saved.ok ? '' : ' Backend not running — not written to b2bPayout.'
        }`,
      );
    });
  };

  const markFull = async () => {
    requireProofThen('full', async () => {
      const saved = await persist({action: 'markFull'});
      if (saved.sample || !saved.ok) {
        setAmountPaid(net);
        setPayoutStatus('Fully paid');
      }
      Alert.alert(
        saved.ok ? 'Fully paid' : 'Fully paid (local only)',
        `Remaining ${formatUsd(remaining)} released.${
          saved.ok ? '' : ' Backend not running — not written to b2bPayout.'
        }`,
      );
    });
  };

  if (!seed) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <MockupHeader navigation={navigation} title="Payout" />
        <Text style={{padding: 20, color: '#556065'}}>
          Open a payout from the list. This screen does not use sample orders.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title={`Order #${seed.orderId}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>{seed.businessName}</Text>
          <Text style={styles.plant}>{seed.plant}</Text>
          <Text style={styles.meta}>
            {seed.potSize}
            {seed.variegation ? ` · ${seed.variegation}` : ''} · {seed.country}
          </Text>
          <Text style={styles.heroLabel}>Net payout</Text>
          <Text style={[styles.heroAmount, (net == null || net < 0) && styles.negative]}>
            {formatUsd(net)}
          </Text>
          <View style={styles.badgeRow}>
            <StatusPill label={payoutStatus} tone={tone} />
            <StatusPill
              label={seed.scanned ? seed.leafTrailStatus : 'Not scanned'}
              tone={seed.scanned ? 'scan' : 'wait'}
            />
          </View>
          {net != null && net > 0 ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${Math.min(100, Math.max(0, (amountPaid / net) * 100))}%`},
                  ]}
                />
              </View>
              <View style={styles.heroStats}>
                <HeroStat label="Paid" value={formatUsd(amountPaid)} />
                <HeroStat label="Remaining" value={formatUsd(remaining)} />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.dates}>
          <DateCell label="Live sale" value={seed.liveSaleDate} />
          <DateCell label="Order date" value={seed.orderDate} />
          <DateCell label="Scan date" value={seed.scanDate} />
        </View>

        <View style={[styles.panel, seed.scanned ? styles.panelOk : styles.panelWait]}>
          <View style={styles.panelHead}>
            <View style={[styles.dot, seed.scanned ? styles.dotOk : styles.dotWait]} />
            <Text style={styles.panelTitle}>QR / Leaf Trail</Text>
          </View>
          <Text style={styles.panelBody}>{scanLabel}</Text>
          <Text style={styles.panelHint}>
            Payout is calculated only when Leaf Trail is Inventory for Hub. Full remaining
            releases after hub staff receives the plant.
          </Text>
        </View>

        {!eligible && !exception ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Payout not calculated</Text>
            <Text style={styles.panelHint}>
              Seller must scan the plant QR first so Leaf Trail is Inventory for Hub.
              This confirms the sold plant exists and a QR is attached.
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
            <View style={styles.breakdown}>
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
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Payout breakdown</Text>
            <Row label="Listed USD price" value={formatUsd(seed.listedPrice)} />
            <Row
              label={`Commission (${seed.commissionRate}%)`}
              value={`− ${formatUsd(seed.commission)}`}
              dim
            />
            <Row label="Logistics" value={`− ${formatUsd(seed.logistics)}`} dim />
            <Row label="Plant care" value={`− ${formatUsd(seed.plantCare)}`} dim />
            <View style={styles.divider} />
            <Row label="Net payout" value={formatUsd(net)} emphasis />
            <Row label="Paid so far" value={formatUsd(amountPaid)} />
            <Row label="Remaining" value={formatUsd(remaining)} />
          </View>
        )}

        {isAdmin && eligible && !exception ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Partial payout (70–80%)</Text>
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
            <Text style={styles.panelHint}>
              {partialPercent}% of {formatUsd(net)} = {formatUsd(partialAmount)}. Remaining
              releases after hub receive.
            </Text>
          </View>
        ) : null}

        {isAdmin ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Proof of transfer</Text>
            <Text style={styles.panelHint}>
              Attach a bank or Remitly screenshot before marking Partially paid or Fully
              paid.
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
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Proof of transfer</Text>
            <Text style={styles.proofMeta}>
              {latestProof.label} · {latestProof.attachedAt}
            </Text>
          </View>
        ) : null}

        {isAdmin && canPayPartial ? (
          <TouchableOpacity
            style={[globalStyles.primaryButton, saving && {opacity: 0.6}]}
            disabled={saving}
            onPress={markPartial}>
            <Text style={globalStyles.primaryButtonText}>
              Mark partially paid · {formatUsd(partialAmount)}
            </Text>
          </TouchableOpacity>
        ) : null}

        {isAdmin && canPayFull ? (
          <TouchableOpacity
            style={[globalStyles.primaryButton, saving && {opacity: 0.6}]}
            disabled={saving}
            onPress={markFull}>
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

const HeroStat = ({label, value}) => (
  <View style={styles.heroStat}>
    <Text style={styles.heroStatValue}>{value}</Text>
    <Text style={styles.heroStatLabel}>{label}</Text>
  </View>
);

const StatusPill = ({label, tone}) => (
  <View style={[styles.pill, styles[`pill_${tone}`]]}>
    <Text style={[styles.pillText, styles[`pillText_${tone}`]]}>{label}</Text>
  </View>
);

const Row = ({label, value, negative, emphasis, dim}) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, emphasis && styles.emphasis]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        dim && styles.rowDim,
        emphasis && styles.emphasis,
        negative && styles.negative,
      ]}>
      {value}
    </Text>
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
    padding: 18,
    marginBottom: 12,
  },
  heroKicker: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  plant: {fontSize: 22, fontWeight: '700', color: '#202325'},
  meta: {color: '#556065', marginTop: 4, fontSize: 13},
  heroLabel: {color: '#556065', fontSize: 12, marginTop: 14},
  heroAmount: {color: '#539461', fontSize: 32, fontWeight: '700', marginTop: 2},
  badgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  progressWrap: {marginTop: 16},
  progressTrack: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  progressFill: {height: '100%', backgroundColor: '#539461', borderRadius: 8},
  heroStats: {flexDirection: 'row', marginTop: 12},
  heroStat: {flex: 1},
  heroStatValue: {color: '#356641', fontWeight: '700', fontSize: 14},
  heroStatLabel: {color: '#7F8D91', fontSize: 11, marginTop: 2, fontWeight: '600'},
  pill: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8},
  pillText: {fontSize: 11, fontWeight: '700'},
  pill_paid: {backgroundColor: '#DFECDF'},
  pillText_paid: {color: '#356641'},
  pill_partial: {backgroundColor: '#FEF0C7'},
  pillText_partial: {color: '#B54708'},
  pill_ready: {backgroundColor: '#D1E9FF'},
  pillText_ready: {color: '#175CD3'},
  pill_alert: {backgroundColor: '#FEE4E2'},
  pillText_alert: {color: '#B42318'},
  pill_wait: {backgroundColor: '#E4E7E9'},
  pillText_wait: {color: '#475467'},
  pill_scan: {backgroundColor: '#DFECDF'},
  pillText_scan: {color: '#356641'},
  dates: {flexDirection: 'row', gap: 8, marginBottom: 12},
  dateCell: {
    flex: 1,
    backgroundColor: '#f2f7f3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    padding: 12,
  },
  dateLabel: {color: '#7F8D91', fontSize: 11, marginBottom: 4, fontWeight: '600'},
  dateValue: {color: '#202325', fontWeight: '700', fontSize: 13},
  panel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  panelOk: {backgroundColor: '#f2f7f3'},
  panelWait: {backgroundColor: '#F5F6F6', borderColor: '#E4E7E9'},
  panelHead: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  dot: {width: 10, height: 10, borderRadius: 5},
  dotOk: {backgroundColor: '#539461'},
  dotWait: {backgroundColor: '#A9B3B7'},
  panelTitle: {fontWeight: '700', color: '#202325', fontSize: 15},
  panelBody: {color: '#202325', fontSize: 14, marginTop: 2},
  panelHint: {color: '#7F8D91', fontSize: 12, marginTop: 8, lineHeight: 18},
  breakdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  breakdownTitle: {fontWeight: '700', color: '#202325', fontSize: 15, marginBottom: 12},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {color: '#556065', fontSize: 14, flex: 1, paddingRight: 8},
  rowValue: {color: '#202325', fontSize: 14, fontWeight: '600'},
  rowDim: {color: '#7F8D91'},
  negative: {color: '#B42318'},
  emphasis: {fontWeight: '700', color: '#356641', fontSize: 16},
  divider: {height: 1, backgroundColor: '#C0DAC2', marginBottom: 12, marginTop: 4},
  alertCard: {
    backgroundColor: '#FEF3F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  alertTitle: {fontWeight: '700', color: '#B42318', marginBottom: 6, fontSize: 15},
  alertBody: {color: '#912018', fontSize: 13, lineHeight: 20, marginBottom: 12},
  creditNote: {color: '#356641', fontSize: 12, fontWeight: '600', marginTop: 10},
  segment: {
    flexDirection: 'row',
    backgroundColor: '#f2f7f3',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#C0DAC2',
    marginTop: 10,
  },
  segBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center'},
  segBtnOn: {backgroundColor: '#539461'},
  segText: {color: '#356641', fontSize: 13, fontWeight: '700'},
  segTextOn: {color: '#fff'},
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    backgroundColor: '#f2f7f3',
    borderRadius: 12,
    padding: 10,
  },
  proofThumb: {width: 52, height: 52, borderRadius: 8, backgroundColor: '#DFECDF'},
  proofPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#DFECDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofPlaceholderText: {color: '#356641', fontSize: 10, fontWeight: '700'},
  proofLabel: {fontWeight: '700', color: '#202325'},
  proofMeta: {color: '#7F8D91', fontSize: 12, marginTop: 2},
  warn: {color: '#B54708', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4},
  waitNote: {
    color: '#B54708',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
    backgroundColor: '#FEF0C7',
    borderRadius: 10,
    padding: 12,
  },
});

export default ScreenB2BPayoutDetail;
