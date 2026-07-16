import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  RefreshControl,
  Animated,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../../../components/Admin/header';
import Loading from '../../../components/Loading/Loading';
import { getPlantCreditLedgerApi } from '../../../components/Api/creditApi';
import {
  CREDIT_TYPES,
  REASON_TYPES,
  getTransactionMeta,
  getReasonMeta,
  getCreditTypeMeta,
} from '../../../utils/creditEnums';
import PlantIcon from '../../../assets/icons/accent/plant-regular.svg';
import BoxIcon from '../../../assets/icons/greydark/box-regular.svg';
import TrashIcon from '../../../assets/icons/red/trash.svg';
import WarningIcon from '../../../components/Credits/WarningIcon';
import CaretDownIcon from '../../../assets/admin-icons/arrow-down.svg';
import DocumentIcon from '../../../assets/icons/accent/note-edit.svg';
import UserIcon from '../../../assets/icons/greydark/profile.svg';
import CalendarIcon from '../../../assets/icons/greylight/calendar-blank-regular.svg';
import HashIcon from '../../../assets/icons/greylight/dollar.svg';
import OrderIcon from '../../../assets/icontabs/order.svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PAGE_SIZE = 50;

const CREDIT_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'plant', label: 'Plant', Icon: PlantIcon },
  { key: 'shipping', label: 'Shipping', Icon: BoxIcon },
];

const TYPE_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Added' },
  { key: 'used', label: 'Used' },
  { key: 'cleared', label: 'Cleared' },
];

const formatCurrencyAbs = (amount) => {
  const value = Number(amount) || 0;
  return `$${Math.abs(value).toFixed(2)}`;
};

const formatCurrencySigned = (amount) => {
  const value = Number(amount) || 0;
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrencyAbs(value)}`;
};

const formatDateShort = (value) => {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' • ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const parseFirestoreTimestamp = (value) => {
  if (value == null) return null;
  if (typeof value.toDate === 'function') {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const ms = value.seconds * 1000 + Math.round((value.nanoseconds || 0) / 1_000_000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeSummary = (apiSummary) => {
  const plantTotals = apiSummary?.plantTotals || apiSummary?.totals || {};
  const shippingTotals = apiSummary?.shippingTotals || {};

  const get = (obj, key) => Number(obj?.[key] ?? 0);

  return {
    plantAvailable: Math.max(0, Number(apiSummary?.plantTotals?.currentBalance ?? apiSummary?.currentBalance ?? apiSummary?.actualBalance ?? 0)),
    shippingAvailable: Math.max(0, Number(apiSummary?.shippingTotals?.currentBalance ?? apiSummary?.shippingCurrentBalance ?? 0)),
    plantActual: Number(apiSummary?.plantActual ?? apiSummary?.plantTotals?.actualBalance ?? apiSummary?.actualBalance ?? 0),
    shippingActual: Number(apiSummary?.shippingActual ?? apiSummary?.shippingTotals?.actualBalance ?? apiSummary?.shippingActualBalance ?? 0),
    requiresInvestigation: Boolean(apiSummary?.requiresInvestigation),
    plantTotals: {
      creditsEarned: get(plantTotals, 'creditsEarned'),
      creditsUsed: get(plantTotals, 'creditsUsed'),
      manualAdjustments: get(plantTotals, 'manualAdjustments'),
      creditsCleared: get(plantTotals, 'creditsCleared'),
      creditsExpired: get(plantTotals, 'creditsExpired'),
    },
    shippingTotals: {
      creditsEarned: get(shippingTotals, 'creditsEarned'),
      creditsUsed: get(shippingTotals, 'creditsUsed'),
      manualAdjustments: get(shippingTotals, 'manualAdjustments'),
      creditsCleared: get(shippingTotals, 'creditsCleared'),
      creditsExpired: get(shippingTotals, 'creditsExpired'),
    },
    totalTransactions: Number(apiSummary?.totalTransactions ?? 0),
    hasMore: Boolean(apiSummary?.hasMore),
    lastDocId: apiSummary?.lastDocId || null,
  };
};

const FilterChip = ({ label, active, onPress, count, Icon }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.filterChip,
      active && styles.filterChipActive,
    ]}
  >
    {Icon && <Icon width={14} height={14} color={active ? '#FFFFFF' : '#475467'} />}
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
    {count != null && (
      <View style={[styles.countBadge, active && styles.countBadgeActive]}>
        <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const TypePill = ({ active, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.typePill,
      active && styles.typePillActive,
    ]}
  >
    <Text style={[styles.typePillText, active && styles.typePillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const TransactionDivider = () => (
  <View style={styles.divider} />
);

const DetailRow = ({ icon: Icon, label, value, valueStyle, mono }) => {
  if (value == null || value === '') return null;
  return (
    <View style={styles.detailRow}>
      {Icon && <Icon width={16} height={16} color="#98A2B3" />}
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.monoValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
};

const TransactionRow = ({ transaction, onPress, testID, isExpanded }) => {
  const typeMeta = getTransactionMeta(transaction.transactionType);
  const reasonMeta = getReasonMeta(transaction.reasonType);
  const creditMeta = getCreditTypeMeta(transaction.creditType);
  const amount = Number(transaction.amount) || 0;
  const amountColor = amount >= 0 ? '#12B76A' : '#F04438';
  const isPlant = transaction.creditType === CREDIT_TYPES.PLANT;
  const isShipping = transaction.creditType === CREDIT_TYPES.SHIPPING;
  const plants = transaction.plants || [];
  const CreditIcon = isPlant ? PlantIcon : BoxIcon;

  const plantAmount = Number(transaction.plantAmount ?? transaction.plantCreditAmount ?? (isPlant ? amount : 0));
  const shippingAmount = Number(transaction.shippingAmount ?? transaction.shippingCreditAmount ?? (isShipping ? amount : 0));
  const plantBreakdownColor = plantAmount >= 0 ? '#12B76A' : '#F04438';
  const shippingBreakdownColor = shippingAmount >= 0 ? '#2E90FA' : '#F04438';

  const isMissingOrDamaged =
    transaction.reasonType === REASON_TYPES.MISSING_PLANT ||
    transaction.reasonType === REASON_TYPES.DAMAGED_PLANT ||
    transaction.reasonType === REASON_TYPES.MISSING_SHIPPING ||
    transaction.reasonType === REASON_TYPES.DAMAGED_SHIPPING;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, isExpanded && styles.cardExpanded]} testID={testID}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: creditMeta.bgColor, borderColor: creditMeta.borderColor }]}>
          <CreditIcon width={20} height={20} color={creditMeta.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardAmount, { color: amountColor }]}>
              {formatCurrencySigned(amount)}
            </Text>
          </View>
          <View style={styles.cardSubtitleRow}>
            <Text style={[styles.cardType, { color: typeMeta.color }]}>{typeMeta.label}</Text>
            {isMissingOrDamaged && (
              <View style={styles.issueBadge}>
                <Text style={styles.issueBadgeText}>{reasonMeta.label}</Text>
              </View>
            )}
            {transaction.orderId ? (
              <Text style={styles.cardOrder} numberOfLines={1}>Order {transaction.orderId}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.cardDate}>{formatDateShort(transaction.createdAt)}</Text>
          <Text style={styles.cardBalance}>Bal {formatCurrencyAbs(transaction.balanceAfter)}</Text>
          <CaretDownIcon width={14} height={14} color="#98A2B3" style={[styles.cardCaret, isExpanded && styles.cardCaretExpanded]} />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.cardExpandedContent} onStartShouldSetResponder={() => true}>
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>CREDIT BREAKDOWN</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownLabelRow}>
                  <PlantIcon width={14} height={14} color="#12B76A" />
                  <Text style={styles.breakdownLabel}>Plant Credit</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: plantBreakdownColor }]}>
                  {formatCurrencySigned(plantAmount)}
                </Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownLabelRow}>
                  <BoxIcon width={14} height={14} color="#2E90FA" />
                  <Text style={styles.breakdownLabel}>Shipping Credit</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: shippingBreakdownColor }]}>
                  {shippingAmount === 0 ? '$0.00' : formatCurrencySigned(shippingAmount)}
                </Text>
              </View>
            </View>
          </View>

          {(transaction.plantCreditUsed > 0 || transaction.shippingCreditUsed > 0 || plants.length > 0 || transaction.orderTotal || transaction.orderStatus) && (
            <View style={styles.purchaseCard}>
              <View style={styles.sectionTitleRow}>
                <OrderIcon width={16} height={16} color="#101828" />
                <Text style={styles.sectionTitle}>PURCHASE</Text>
              </View>

              {plants.length > 0 && plants.map((plant, i) => (
                <View key={plant.productId || plant.plantCode || i} style={styles.plantRow}>
                  {plant.plantImage ? (
                    <Image source={{ uri: plant.plantImage }} style={styles.plantThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.plantThumb, styles.plantThumbPlaceholder]}>
                      <PlantIcon width={20} height={20} color="#12B76A" />
                    </View>
                  )}
                  <View style={styles.plantInfo}>
                    <Text style={styles.plantName} numberOfLines={1}>{plant.plantName || 'Unknown Plant'}</Text>
                    {plant.genus && <Text style={styles.plantMeta}>{plant.genus}{plant.species ? ` ${plant.species}` : ''}</Text>}
                    {plant.quantity && <Text style={styles.plantMeta}>Qty {plant.quantity}</Text>}
                  </View>
                </View>
              ))}

              <DetailRow icon={OrderIcon} label="Order Number" value={transaction.orderId ? `Order ${transaction.orderId}` : transaction.orderNumber} mono />
              <DetailRow icon={HashIcon} label="Order Total" value={transaction.orderTotal != null ? formatCurrencyAbs(transaction.orderTotal) : null} />
              <DetailRow icon={DocumentIcon} label="Plant Credit Used" value={transaction.plantCreditUsed > 0 ? formatCurrencyAbs(transaction.plantCreditUsed) : null} valueStyle={styles.detailValueGreen} />
              <DetailRow icon={BoxIcon} label="Shipping Credit Used" value={transaction.shippingCreditUsed > 0 ? formatCurrencyAbs(transaction.shippingCreditUsed) : null} valueStyle={styles.detailValueBlue} />
              <DetailRow icon={HashIcon} label="Paid via Card" value={transaction.remainingAmountPaid > 0 ? formatCurrencyAbs(transaction.remainingAmountPaid) : null} />
              <DetailRow icon={DocumentIcon} label="Status" value={transaction.orderStatus} />
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.sectionTitleRow}>
              <DocumentIcon width={16} height={16} color="#101828" />
              <Text style={styles.sectionTitle}>TRANSACTION INFORMATION</Text>
            </View>
            <DetailRow icon={DocumentIcon} label="Type" value={isPlant ? 'Plant Credit' : 'Shipping Credit'} />
            <DetailRow icon={DocumentIcon} label="Reason" value={reasonMeta.label} />
            <DetailRow icon={UserIcon} label="Processed By" value={transaction.addedByName || transaction.processedBy || transaction.adminName} />
            <DetailRow icon={CalendarIcon} label="Date & Time" value={formatDateTime(transaction.createdAt)} />
            <DetailRow icon={HashIcon} label="Transaction ID" value={transaction.transactionNumber || transaction.transactionId} mono />
          </View>

          {transaction.notes ? (
            <View style={styles.notesCard}>
              <View style={styles.sectionTitleRow}>
                <DocumentIcon width={16} height={16} color="#101828" />
                <Text style={styles.sectionTitle}>NOTES</Text>
              </View>
              <Text style={styles.notesText}>{transaction.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function PlantCreditWalletScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { buyer } = route.params || {};

  const buyerRef = useRef(buyer);
  useEffect(() => {
    buyerRef.current = buyer;
  }, [buyer]);

  const fullName = useMemo(() => buyer?.name || `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() || 'Buyer', [buyer]);

  const [summary, setSummary] = useState({
    plantAvailable: Math.max(0, buyer?.plantCredits ?? 0),
    shippingAvailable: Math.max(0, buyer?.shippingCredits ?? 0),
    plantActual: buyer?.plantCredits ?? 0,
    shippingActual: buyer?.shippingCredits ?? 0,
    requiresInvestigation: (buyer?.plantCredits ?? 0) < 0 || (buyer?.shippingCredits ?? 0) < 0,
    plantTotals: {},
    shippingTotals: {},
    totalTransactions: 0,
    hasMore: false,
    lastDocId: null,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creditFilter, setCreditFilter] = useState('all');
  const [txFilter, setTxFilter] = useState('all');
  const [error, setError] = useState(null);

  const lastDocIdRef = useRef(summary.lastDocId);
  useEffect(() => {
    lastDocIdRef.current = summary.lastDocId;
  }, [summary.lastDocId]);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 45, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadLedger = useCallback(
    async ({ refresh = false, append = false } = {}) => {
      const activeBuyer = buyerRef.current;
      if (!activeBuyer?.uid) {
        setError('Buyer information is missing.');
        setLoading(false);
        return;
      }

      if (refresh) setRefreshing(true);
      else if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = {
          buyerUid: activeBuyer.uid,
          limit: PAGE_SIZE,
          creditType: creditFilter === 'all' ? undefined : creditFilter,
          filterType: txFilter === 'all' ? undefined : txFilter,
        };
        if (append && lastDocIdRef.current) {
          params.startAfter = lastDocIdRef.current;
        }

        const result = await getPlantCreditLedgerApi(params);
        if (!result.success) throw new Error(result.error || 'Failed to load ledger');

        const backendPayload = result.data || {};
        const apiData = backendPayload.data || result.data || {};
        const newSummary = normalizeSummary(apiData.summary);
        const newTransactions = (apiData.transactions || []).map((tx) => ({
          ...tx,
          createdAt: parseFirestoreTimestamp(tx.createdAt),
        }));

        setSummary(newSummary);
        setTransactions((prev) => (append ? [...prev, ...newTransactions] : newTransactions));
        setError(null);
      } catch (err) {
        console.error('[PlantCreditWallet] ledger error:', err);
        setError(err.message || 'Unable to load credit wallet.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [creditFilter, txFilter]
  );

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const onRefresh = useCallback(() => {
    loadLedger({ refresh: true });
  }, [loadLedger]);

  const onLoadMore = useCallback(() => {
    if (!loadingMore && summary.hasMore) {
      loadLedger({ append: true });
    }
  }, [loadingMore, summary.hasMore, loadLedger]);

  const [expandedId, setExpandedId] = useState(null);

  const handleTransactionPress = useCallback(
    (transaction) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId((current) => (current === transaction?.id ? null : transaction?.id));
    },
    []
  );

  const renderTransactionRow = useCallback(
    ({ item, index }) => (
      <TransactionRow
        testID={`credit-transaction-row-${index}`}
        transaction={item}
        onPress={() => handleTransactionPress(item)}
        isExpanded={expandedId === item.id}
      />
    ),
    [expandedId, handleTransactionPress]
  );

  const combinedBalance = Math.max(0, summary.plantAvailable) + Math.max(0, summary.shippingAvailable);

  const creditCounts = useMemo(() => {
    return {
      all: transactions.length,
      plant: transactions.filter((t) => t.creditType === CREDIT_TYPES.PLANT).length,
      shipping: transactions.filter((t) => t.creditType === CREDIT_TYPES.SHIPPING).length,
    };
  }, [transactions]);

  const hasRemainingBalance = combinedBalance > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && <StatusBar barStyle="light-content" backgroundColor="#1D2939" />}

      <ScreenHeader navigation={navigation} title={`${fullName.split(' ')[0]}'s Credits`} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#12B76A" />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: new Animated.Value(0) } } }], { useNativeDriver: true })}
      >
        <Animated.View style={[styles.heroWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.heroCard}>
            <View style={styles.heroDecorTop} />
            <View style={styles.heroDecorBottom} />
            <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
            <Text style={styles.heroTotal}>{formatCurrencyAbs(combinedBalance)}</Text>

            <View style={styles.heroSplitRow}>
              <View style={styles.heroSplit}>
                <View style={styles.heroSplitIconWrap}>
                  <PlantIcon width={20} height={20} color="#12B76A" />
                </View>
                <View>
                  <Text style={styles.heroSplitLabel}>Plant Credit</Text>
                  <Text style={styles.heroSplitValue}>{formatCurrencyAbs(summary.plantAvailable)}</Text>
                </View>
              </View>

              <View style={styles.heroSplit}>
                <View style={styles.heroSplitIconWrap}>
                  <BoxIcon width={20} height={20} color="#2E90FA" />
                </View>
                <View>
                  <Text style={styles.heroSplitLabel}>Shipping Credit</Text>
                  <Text style={[styles.heroSplitValue, styles.heroSplitValueBlue]}>{formatCurrencyAbs(summary.shippingAvailable)}</Text>
                </View>
              </View>
            </View>

            {summary.requiresInvestigation && (summary.plantActual < 0 || summary.shippingActual < 0) && (
              <View style={styles.heroWarning}>
                <View style={styles.heroWarningTitleRow}>
                  <WarningIcon size={14} color="#B42318" />
                  <Text style={styles.heroWarningTitle}>Needs Investigation</Text>
                </View>
                {summary.plantActual < 0 && (
                  <Text style={styles.heroWarningLine}>
                    Plant ledger balance {formatCurrencyAbs(summary.plantActual)} is negative (displayed as {formatCurrencyAbs(summary.plantAvailable)}).
                  </Text>
                )}
                {summary.shippingActual < 0 && (
                  <Text style={styles.heroWarningLine}>
                    Shipping ledger balance {formatCurrencyAbs(summary.shippingActual)} is negative (displayed as {formatCurrencyAbs(summary.shippingAvailable)}).
                  </Text>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        {hasRemainingBalance && (
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClearCreditsScreen', { buyer })}
          >
            <View style={styles.clearBtnContent}>
              <TrashIcon width={18} height={18} color="#F04438" />
              <Text style={styles.clearBtnText}>Clear Credits</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.filtersWrap}>
          <View style={styles.filterRow}>
            {CREDIT_FILTER_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.key}
                label={opt.label}
                active={creditFilter === opt.key}
                onPress={() => setCreditFilter(opt.key)}
                count={creditCounts[opt.key]}
                Icon={opt.Icon}
              />
            ))}
          </View>

          <View style={styles.filterRow}>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <TypePill
                key={opt.key}
                label={opt.label}
                active={txFilter === opt.key}
                onPress={() => setTxFilter(opt.key)}
              />
            ))}
          </View>
        </View>

        {loading && !transactions.length ? (
          <Loading visible />
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryBtn} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrap}>
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id || `${item.createdAt}-${item.transactionNumber}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={TransactionDivider}
              renderItem={renderTransactionRow}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator style={styles.footerLoader} color="#12B76A" />
                ) : summary.hasMore ? (
                  <TouchableOpacity onPress={onLoadMore} style={styles.loadMoreBtn} activeOpacity={0.8}>
                    <Text style={styles.loadMoreText}>Load more</Text>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No transactions for this filter</Text>
                </View>
              }
            />
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  heroWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: '#1D2939',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#1D2939',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroDecorTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDecorBottom: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroTotal: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 18,
  },
  heroSplitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroSplit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 12,
  },
  heroSplitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSplitLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroSplitValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSplitValueBlue: {
    color: '#2E90FA',
  },
  heroWarning: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
  },
  heroWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B42318',
    marginBottom: 4,
  },
  heroWarningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroWarningLine: {
    fontSize: 12,
    color: '#B42318',
    marginTop: 2,
  },
  detailValueGreen: {
    color: '#12B76A',
  },
  detailValueBlue: {
    color: '#2E90FA',
  },
  clearBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F04438',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  clearBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F04438',
  },
  filtersWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#1D2939',
    backgroundColor: '#1D2939',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475467',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    minWidth: 18,
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#98A2B3',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  typePill: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
  },
  typePillActive: {
    borderColor: '#101828',
    backgroundColor: '#F9FAFB',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#667085',
  },
  typePillTextActive: {
    color: '#101828',
    fontWeight: '600',
  },
  listWrap: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardExpanded: {
    borderColor: '#D0D5DD',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
  },
  issueBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  issueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F04438',
  },
  cardOrder: {
    fontSize: 11,
    color: '#98A2B3',
    flexShrink: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  cardDate: {
    fontSize: 12,
    color: '#475467',
    fontWeight: '500',
  },
  cardBalance: {
    fontSize: 11,
    color: '#98A2B3',
    fontWeight: '500',
  },
  cardCaret: {
    marginTop: 4,
  },
  cardCaretExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  cardExpandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: 0.5,
  },
  breakdownCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E4E7EC',
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475467',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  purchaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  plantThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F2F4F7',
  },
  plantThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantInfo: {
    flex: 1,
    minWidth: 0,
  },
  plantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },
  plantMeta: {
    fontSize: 12,
    color: '#667085',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475467',
    fontWeight: '500',
    marginLeft: 10,
  },
  detailValue: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'right',
  },
  monoValue: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
  },
  notesText: {
    fontSize: 14,
    color: '#475467',
    lineHeight: 20,
  },
  divider: {
    height: 10,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#667085',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#1D2939',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerLoader: {
    margin: 16,
  },
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475467',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#98A2B3',
  },
});
