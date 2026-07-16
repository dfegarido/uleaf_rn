import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/Admin/header';
import Loading from '../../../components/Loading/Loading';
import { AuthContext } from '../../../auth/AuthProvider';
import { clearCreditsApi, invalidateCreditManagementCache, invalidateCreditStatementCache } from '../../../components/Api/creditApi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { CREDIT_COLORS, getReasonMeta, CREDIT_TYPES, REASON_TYPES } from '../../../utils/creditEnums';

const REASON_PLACEHOLDER = 'e.g. Paid buyer directly via PayPal on Jul 10…';

const ISSUE_REASON_OPTIONS = [
  { key: REASON_TYPES.MISSING_PLANT, label: 'Missing' },
  { key: REASON_TYPES.DAMAGED_PLANT, label: 'Damaged' },
];

const StatusPill = ({ status }) => {
  const MAP = {
    active: { label: 'Active', bg: CREDIT_COLORS.plantBg, color: CREDIT_COLORS.plantDark },
    partially_used: { label: 'Partially Used', bg: CREDIT_COLORS.orangeBg, color: CREDIT_COLORS.orange },
    fully_used: { label: 'Fully Used', bg: CREDIT_COLORS.grayBg, color: CREDIT_COLORS.gray },
  };
  const m = MAP[status] || MAP.active;
  return (
    <View style={[styles.statusPill, { backgroundColor: m.bg }]}>
      <Text style={[styles.statusPillText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
};

const ReasonBadge = ({ reasonType, creditType }) => {
  const meta = getReasonMeta(reasonType);
  const isShipping = creditType === CREDIT_TYPES.SHIPPING;
  const label = !reasonType ? (isShipping ? '📦 Shipping Credit' : '—') : meta.label;
  const color = reasonType ? meta.color : CREDIT_COLORS.textMuted;
  const bg = reasonType ? meta.bgColor : CREDIT_COLORS.borderLight;
  return (
    <View style={[styles.reasonBadge, { backgroundColor: bg }]}>
      <Text style={[styles.reasonBadgeText, { color }]}>{label}</Text>
    </View>
  );
};

const formatCurrency = (amount) => `$${Math.abs(Number(amount) || 0).toFixed(2)}`;

export default function ClearCreditsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { userInfo } = useContext(AuthContext);

  const { buyer } = route.params || {};
  const fullName = buyer?.name || `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() || 'Buyer';
  const firstName = fullName.split(' ')[0];

  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedReasonType, setSelectedReasonType] = useState(REASON_TYPES.MISSING_PLANT);
  const [reason, setReason] = useState('');
  const [clearedIds, setClearedIds] = useState([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!buyer?.uid) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [plantSnap, shippingSnap] = await Promise.all([
          getDocs(query(collection(db, 'plant_credits'), where('buyerUid', '==', buyer.uid))),
          getDocs(query(collection(db, 'shipping_credits'), where('buyerUid', '==', buyer.uid))),
        ]);

        const shippingByOrder = {};
        shippingSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const oid = d.sourceOrderId || d.orderId;
          if (!oid) return;
          if (!shippingByOrder[oid]) {
            shippingByOrder[oid] = {
              amount: 0,
              usedAmount: 0,
              remainingAmount: 0,
              carrier: d.carrier,
              trackingNumber: d.trackingNumber,
              shipLeg: d.shipLeg || d.route,
            };
          }
          shippingByOrder[oid].amount += Number(d.amount || 0);
          shippingByOrder[oid].usedAmount += Number(d.usedAmount || 0);
          shippingByOrder[oid].remainingAmount += Number(d.remainingAmount ?? d.amount ?? 0);
        });

        const list = [];
        plantSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const amount = Number(d.amount || 0);
          const usedAmount = Number(d.usedAmount || 0);
          const remainingAmount = Number(d.remainingAmount ?? amount - usedAmount);
          if (d.status === 'fully_used' || remainingAmount <= 0) return;

          const tiedShipping = shippingByOrder[d.sourceOrderId || d.orderId] || null;
          list.push({
            id: docSnap.id,
            plantName: d.plantName || d.plantDetails?.plantName || 'Unknown Plant',
            plantCode: d.plantCode || d.plantDetails?.plantCode,
            orderId: d.sourceOrderId || d.orderId,
            amount,
            usedAmount,
            remainingAmount,
            status: d.status || 'active',
            reasonType: d.reasonType,
            issuedDate: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
            tiedShipping,
          });
        });

        setCredits(list);
      } catch (e) {
        console.error('Error loading plant credits:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [buyer?.uid]);

  const active = credits.filter((c) => c.status !== 'fully_used' && !clearedIds.includes(c.id));
  const hasActive = active.length > 0;

  const handleClear = useCallback(
    async (credit) => {
      if (!reason.trim()) return;
      const adminUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || null;

      setClearing(true);
      try {
        const result = await clearCreditsApi({
          buyerId: buyer?.uid,
          reason: reason.trim(),
          reasonType: selectedReasonType,
          creditId: credit.id,
          adminUid,
          creditType: 'plant',
          clearTiedShipping: !!credit.tiedShipping,
        });

        if (result.success) {
          setClearedIds((prev) => [...prev, credit.id]);
          setSelectedId(null);
          setReason('');
          invalidateCreditManagementCache(queryClient);
          invalidateCreditStatementCache(queryClient, buyer?.uid);
        } else {
          alert(result.error || 'Failed to clear credit.');
        }
      } catch (e) {
        console.error('Error clearing credit:', e);
        alert('Unexpected error while clearing credit.');
      } finally {
        setClearing(false);
      }
    },
    [buyer?.uid, reason, selectedReasonType, userInfo, queryClient]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && <StatusBar barStyle="dark-content" backgroundColor={CREDIT_COLORS.surface} />}

      <ScreenHeader navigation={navigation} title="Clear Plant Credit" />

      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={[styles.heroLabel, { color: CREDIT_COLORS.plantDark }]}>🌿 PLANT BALANCE</Text>
          <Text style={[styles.heroValue, { color: CREDIT_COLORS.plantDark }]}>{formatCurrency(buyer?.plantCredits ?? 0)}</Text>
        </View>
        <View style={styles.heroRight}>
          <Text style={[styles.heroSub, { color: CREDIT_COLORS.plantDark }]}>{active.length} active record{active.length !== 1 ? 's' : ''}</Text>
          <Text style={[styles.heroSub, { color: CREDIT_COLORS.plantDark }]}>Tap a plant to clear</Text>
        </View>
      </View>

      <View style={styles.instruction}>
        <Text style={styles.instructionText}>Select the plant credit to clear. Use this when you've paid the buyer directly for a specific plant and need to remove the corresponding store credit.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.listCard}>
          {loading ? (
            <Loading visible />
          ) : !hasActive ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No active plant credits to clear.</Text>
            </View>
          ) : (
            active.map((credit, i) => {
              const isOpen = selectedId === credit.id;
              const canClear = reason.trim().length > 0;
              const totalClear = credit.remainingAmount + (credit.tiedShipping?.remainingAmount || 0);

              return (
                <View key={credit.id}>
                  {i > 0 && <View style={styles.divider} />}

                  <TouchableOpacity
                    onPress={() => { setSelectedId(isOpen ? null : credit.id); setReason(''); setSelectedReasonType(REASON_TYPES.MISSING_PLANT); }}
                    activeOpacity={0.75}
                    style={[styles.recordRow, isOpen && { backgroundColor: '#FFF8F8' }]}
                  >
                    <View style={[styles.recordIcon, { backgroundColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder }]}>
                      <Text style={styles.recordIconText}>🌿</Text>
                    </View>

                    <View style={styles.recordInfo}>
                      <Text style={styles.recordName} numberOfLines={1}>{credit.plantName}</Text>
                      <Text style={styles.recordMeta}>{credit.orderId}{credit.plantCode ? ` · ${credit.plantCode}` : ''}</Text>
                      <View style={styles.recordBadgeRow}>
                        <StatusPill status={credit.status} />
                        <ReasonBadge reasonType={credit.reasonType} creditType="plant" />
                        <Text style={styles.recordDate}>{credit.issuedDate}</Text>
                      </View>
                      {credit.tiedShipping && (
                        <View style={styles.tiedShippingChip}>
                          <Text style={styles.tiedShippingChipText}>📦 +{formatCurrency(credit.tiedShipping.remainingAmount)} shipping tied</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.recordRight}>
                      <Text style={[styles.recordAmount, { color: CREDIT_COLORS.plantDark }]}>{formatCurrency(credit.remainingAmount)}</Text>
                      <Text style={styles.recordOf}>of {formatCurrency(credit.amount)}</Text>
                      <Text style={[styles.chevron, { transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }]}>›</Text>
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.confirmPanel}>
                      <View style={styles.confirmSummary}>
                        <View style={styles.confirmSummaryHeader}>
                          <Text style={styles.confirmSummaryTitle}>WILL BE CLEARED</Text>
                        </View>

                        <View style={styles.confirmLine}>
                          <View style={styles.confirmLineLeft}>
                            <Text style={styles.confirmLineIcon}>🌿</Text>
                            <Text style={styles.confirmLineText}>{credit.plantName}</Text>
                          </View>
                          <Text style={[styles.confirmLineAmount, { color: CREDIT_COLORS.red }]}>{formatCurrency(credit.remainingAmount)}</Text>
                        </View>
                        {credit.usedAmount > 0 && (
                          <Text style={styles.confirmLineNote}>{formatCurrency(credit.usedAmount)} already used — only remaining balance cleared</Text>
                        )}

                        {credit.tiedShipping && (
                          <>
                            <View style={styles.confirmDivider} />
                            <View style={styles.confirmLine}>
                              <View style={styles.confirmLineLeft}>
                                <Text style={styles.confirmLineIcon}>📦</Text>
                                <View>
                                  <Text style={styles.confirmLineText}>Tied Shipping Credit</Text>
                                  <Text style={styles.confirmLineSub}>Same order · cleared automatically</Text>
                                </View>
                              </View>
                              <Text style={[styles.confirmLineAmount, { color: CREDIT_COLORS.red }]}>{formatCurrency(credit.tiedShipping.remainingAmount)}</Text>
                            </View>
                            {credit.tiedShipping.usedAmount > 0 && (
                              <Text style={styles.confirmLineNote}>{formatCurrency(credit.tiedShipping.usedAmount)} already used — only remaining cleared</Text>
                            )}
                          </>
                        )}

                        {credit.tiedShipping && (
                          <View style={styles.confirmTotal}>
                            <Text style={[styles.confirmTotalLabel, { color: CREDIT_COLORS.red }]}>TOTAL CLEARED</Text>
                            <Text style={[styles.confirmTotalValue, { color: CREDIT_COLORS.red }]}>{formatCurrency(totalClear)}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.reasonInputWrap}>
                        <Text style={styles.reasonLabel}>Issue Type</Text>
                        <View style={styles.reasonOptions}>
                          {ISSUE_REASON_OPTIONS.map((opt) => {
                            const selected = selectedReasonType === opt.key;
                            return (
                              <TouchableOpacity
                                key={opt.key}
                                style={[
                                  styles.reasonChip,
                                  selected && styles.reasonChipSelected,
                                ]}
                                onPress={() => setSelectedReasonType(opt.key)}
                                activeOpacity={0.8}
                              >
                                <Text style={[styles.reasonChipText, selected && styles.reasonChipTextSelected]}>{opt.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <Text style={[styles.reasonLabel, styles.reasonLabelSpaced]}>Reason for clearing</Text>
                        <TextInput
                          value={reason}
                          onChangeText={setReason}
                          placeholder={REASON_PLACEHOLDER}
                          placeholderTextColor={CREDIT_COLORS.textMuted}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                          style={styles.reasonInput}
                        />
                      </View>

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          onPress={() => { setSelectedId(null); setReason(''); }}
                          activeOpacity={0.8}
                          style={[styles.cancelBtn, { borderColor: CREDIT_COLORS.border }]}
                        >
                          <Text style={[styles.cancelBtnText, { color: CREDIT_COLORS.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          disabled={!canClear || clearing}
                          onPress={() => handleClear(credit)}
                          activeOpacity={0.8}
                          style={[
                            styles.clearBtn,
                            { backgroundColor: canClear && !clearing ? CREDIT_COLORS.red : CREDIT_COLORS.border },
                          ]}
                        >
                          <Text style={[styles.clearBtnText, { color: canClear && !clearing ? '#FFFFFF' : CREDIT_COLORS.textMuted }]}>
                            {clearing ? 'Clearing…' : `Clear ${formatCurrency(totalClear)}`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {clearedIds.length > 0 && (
            <>
              {hasActive && <View style={styles.divider} />}
              <View style={styles.clearedHeader}>
                <Text style={styles.clearedHeaderText}>CLEARED THIS SESSION</Text>
              </View>
              {credits
                .filter((c) => clearedIds.includes(c.id))
                .map((credit, i) => (
                  <View key={credit.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.clearedRow}>
                      <View style={[styles.recordIcon, { backgroundColor: CREDIT_COLORS.grayBg, borderColor: 'transparent' }]}>
                        <Text style={styles.recordIconText}>🌿</Text>
                      </View>
                      <View style={styles.recordInfo}>
                        <Text style={[styles.recordName, { color: CREDIT_COLORS.textSecondary }]}>{credit.plantName}</Text>
                        <Text style={styles.recordMeta}>{credit.orderId}</Text>
                      </View>
                      <View style={styles.clearedRight}>
                        <Text style={[styles.recordAmount, { color: CREDIT_COLORS.gray, textDecorationLine: 'line-through' }]}>{formatCurrency(credit.remainingAmount)}</Text>
                        <View style={[styles.clearedBadge, { backgroundColor: CREDIT_COLORS.grayBg }]}>
                          <Text style={[styles.clearedBadgeText, { color: CREDIT_COLORS.gray }]}>Cleared</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREDIT_COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: CREDIT_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: CREDIT_COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CREDIT_COLORS.textPrimary,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CREDIT_COLORS.plantBg,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: CREDIT_COLORS.plantBorder,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroRight: {
    alignItems: 'flex-end',
  },
  heroSub: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 1,
  },
  instruction: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  instructionText: {
    fontSize: 12,
    color: CREDIT_COLORS.textMuted,
    lineHeight: 18,
  },
  listCard: {
    backgroundColor: CREDIT_COLORS.surface,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CREDIT_COLORS.border,
    overflow: 'hidden',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: CREDIT_COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: CREDIT_COLORS.border,
    marginHorizontal: 16,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIconText: {
    fontSize: 16,
  },
  recordInfo: {
    flex: 1,
    minWidth: 0,
  },
  recordName: {
    fontSize: 14,
    fontWeight: '600',
    color: CREDIT_COLORS.textPrimary,
    marginBottom: 2,
  },
  recordMeta: {
    fontSize: 12,
    color: CREDIT_COLORS.textMuted,
    marginBottom: 5,
  },
  recordBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  statusPill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reasonBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reasonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recordDate: {
    fontSize: 10,
    color: CREDIT_COLORS.textMuted,
  },
  tiedShippingChip: {
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: CREDIT_COLORS.shippingBg,
    borderColor: CREDIT_COLORS.shippingBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tiedShippingChipText: {
    fontSize: 10,
    color: CREDIT_COLORS.shippingDark,
    fontWeight: '600',
  },
  recordRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  recordAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordOf: {
    fontSize: 10,
    color: CREDIT_COLORS.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: CREDIT_COLORS.textMuted,
    lineHeight: 22,
    marginTop: 2,
  },
  confirmPanel: {
    backgroundColor: '#FFF8F8',
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    padding: 14,
    gap: 10,
  },
  confirmSummary: {
    backgroundColor: CREDIT_COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    overflow: 'hidden',
  },
  confirmSummaryHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  confirmSummaryTitle: {
    fontSize: 11,
    color: CREDIT_COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confirmLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confirmLineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  confirmLineIcon: {
    fontSize: 14,
  },
  confirmLineText: {
    fontSize: 13,
    color: CREDIT_COLORS.textPrimary,
    fontWeight: '500',
  },
  confirmLineSub: {
    fontSize: 10,
    color: CREDIT_COLORS.textMuted,
  },
  confirmLineAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmLineNote: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    fontSize: 11,
    color: CREDIT_COLORS.textMuted,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#FEE2E2',
    marginHorizontal: 12,
  },
  confirmTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  confirmTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmTotalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  reasonInputWrap: {
    gap: 5,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: CREDIT_COLORS.textSecondary,
  },
  reasonLabelSpaced: {
    marginTop: 12,
  },
  reasonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F2F2',
    borderWidth: 1,
    borderColor: CREDIT_COLORS.border,
  },
  reasonChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: CREDIT_COLORS.textSecondary,
  },
  reasonChipSelected: {
    backgroundColor: '#FEF3F2',
    borderColor: '#F04438',
  },
  reasonChipTextSelected: {
    color: '#F04438',
  },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: CREDIT_COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: CREDIT_COLORS.textPrimary,
    backgroundColor: CREDIT_COLORS.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearBtn: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearedHeader: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  clearedHeaderText: {
    fontSize: 11,
    color: CREDIT_COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    opacity: 0.5,
  },
  clearedRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  clearedBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  clearedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
