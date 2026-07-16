import { useQuery } from '@tanstack/react-query';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import SearchIcon from '../../../assets/iconnav/search.svg';
import Avatar from '../../../shared/components/Avatar';
import ScreenHeader from '../../../components/Admin/header';
import { CREDIT_COLORS } from '../../../utils/creditEnums';
import PlantIcon from '../../../assets/icons/accent/plant-regular.svg';
import BoxIcon from '../../../assets/icons/greydark/box-regular.svg';
import WarningIcon from '../../../components/Credits/WarningIcon';
import { CREDIT_MANAGEMENT_QUERY_KEY } from '../../../components/Api/creditApi';

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const round2 = (n) => Number((Number(n) || 0).toFixed(2));

const CreditChip = ({ amount }) => {
  const total = Math.max(0, Number(amount) || 0);
  const isZero = total === 0;

  return (
    <View style={[
      styles.chip,
      isZero ? styles.chipZero : { backgroundColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder },
      !isZero && styles.chipOutline,
    ]}>
      <PlantIcon width={12} height={12} color={isZero ? CREDIT_COLORS.textMuted : CREDIT_COLORS.plantDark} style={styles.chipIcon} />
      <Text style={[styles.chipText, { color: isZero ? CREDIT_COLORS.textMuted : CREDIT_COLORS.plantDark }]}>
        ${total.toFixed(2)}
      </Text>
    </View>
  );
};

const ItemSeparator = () => <View style={styles.divider} />;

const FilterChip = ({ label, active, onPress, count }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.filterChip, active && styles.filterChipActive]}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    {count != null && (
      <View style={[styles.filterChipBadge, active && styles.filterChipBadgeActive]}>
        <Text style={[styles.filterChipBadgeText, active && styles.filterChipBadgeTextActive]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const InvestigationBadge = () => (
  <View style={styles.warningBadge}>
    <WarningIcon size={12} color={CREDIT_COLORS.red} />
    <Text style={styles.warningBadgeText}>Needs Investigation</Text>
  </View>
);

const BuyerRow = ({ buyer, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.buyerRow} testID="credit-buyer-row">
    <Avatar name={buyer.name} size={44} />

    <View style={styles.buyerInfo}>
      <Text style={styles.buyerName} numberOfLines={1}>{buyer.name}</Text>
      <Text style={styles.buyerMeta} numberOfLines={1}>
        {buyer.email} · {buyer.country}
      </Text>

      <View style={styles.chipRow}>
        <CreditChip amount={round2(buyer.plantCredits + buyer.shippingCredits)} />
        {buyer.requiresInvestigation && <InvestigationBadge />}
      </View>
    </View>

    <View style={styles.buyerRight}>
      <Text style={styles.lastActivity}>{formatRelativeTime(buyer.lastActivityAt)}</Text>
      <Text style={styles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

const SkeletonPulse = ({ children }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
};

const BuyerSkeletonRow = () => (
  <View style={styles.buyerRow}>
    <SkeletonPulse>
      <View style={styles.skeletonAvatar} />
    </SkeletonPulse>
    <View style={styles.buyerInfo}>
      <SkeletonPulse>
        <View style={[styles.skeletonLine, styles.skeletonName]} />
      </SkeletonPulse>
      <SkeletonPulse>
        <View style={[styles.skeletonLine, styles.skeletonMeta]} />
      </SkeletonPulse>
      <SkeletonPulse>
        <View style={[styles.skeletonLine, styles.skeletonChip]} />
      </SkeletonPulse>
    </View>
  </View>
);

const SkeletonSummaryCard = () => (
  <View style={styles.summaryCard}>
    <SkeletonPulse>
      <View style={[styles.skeletonLine, styles.skeletonSummaryLabel]} />
    </SkeletonPulse>
    <SkeletonPulse>
      <View style={[styles.skeletonLine, styles.skeletonSummaryValue]} />
    </SkeletonPulse>
    <SkeletonPulse>
      <View style={[styles.skeletonLine, styles.skeletonSummarySub]} />
    </SkeletonPulse>
  </View>
);

const fetchCreditManagementBuyers = async () => {
  const [buyerSnap, txSnap] = await Promise.all([
    getDocs(collection(db, 'buyer')),
    getDocs(collection(db, 'credit_transactions')),
  ]);

  const buyersWithHistory = new Set();
  txSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.buyerUid) buyersWithHistory.add(data.buyerUid);
  });

  const list = [];
  buyerSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!buyersWithHistory.has(docSnap.id)) return;

    const plantCredits = Number(data.plantCredits ?? data.plant_credits ?? 0);
    const shippingCredits = Number(data.shippingCredits ?? data.shipping_credits ?? 0);
    const requiresInvestigation = (plantCredits < 0 || shippingCredits < 0) && (Math.abs(plantCredits) > 0.001 || Math.abs(shippingCredits) > 0.001);

    const lastActivityAt = data.lastActivityAt ?? data.updatedAt ?? data.createdAt;
    const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.username || data.email || 'Unknown';

    list.push({
      uid: docSnap.id,
      name,
      email: data.email || '',
      country: data.country || data.region || '',
      plantCredits,
      shippingCredits,
      requiresInvestigation,
      lastActivityAt,
    });
  });

  list.sort((a, b) => {
    const aTime = a.lastActivityAt?.toDate ? a.lastActivityAt.toDate() : new Date(a.lastActivityAt || 0);
    const bTime = b.lastActivityAt?.toDate ? b.lastActivityAt.toDate() : new Date(b.lastActivityAt || 0);
    if (bTime - aTime !== 0) return bTime - aTime;
    const bal = b.plantCredits + b.shippingCredits - (a.plantCredits + a.shippingCredits);
    if (bal !== 0) return bal;
    return a.name.localeCompare(b.name);
  });

  return list;
};

export default function PlantCreditsManagement() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: buyers = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: CREDIT_MANAGEMENT_QUERY_KEY,
    queryFn: fetchCreditManagementBuyers,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const investigationCount = buyers.filter((b) => b.requiresInvestigation).length;

  const filteredBuyers = useCallback(() => {
    const q = search.trim().toLowerCase();
    return buyers.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q) && !b.email.toLowerCase().includes(q)) return false;
      if (filterMode === 'investigation' && !b.requiresInvestigation) return false;
      return true;
    });
  }, [buyers, search, filterMode])();

  const totalPlant = buyers.reduce((s, b) => s + b.plantCredits, 0);
  const totalShipping = buyers.reduce((s, b) => s + b.shippingCredits, 0);
  const plantBuyers = buyers.filter((b) => b.plantCredits > 0).length;
  const shippingBuyers = buyers.filter((b) => b.shippingCredits > 0).length;

  const onSelectBuyer = useCallback((buyer) => {
    navigation.navigate('AdminCreditsScreen', { buyerUid: buyer.uid });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderSkeletonList = () => (
    <View style={styles.listCard}>
      {[1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          {i > 1 && <View style={styles.divider} />}
          <BuyerSkeletonRow />
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && <StatusBar barStyle="dark-content" backgroundColor={CREDIT_COLORS.surface} />}

      <ScreenHeader navigation={navigation} title="Credit Management" />

      <View style={styles.searchWrap}>
        <View style={styles.searchInner} testID="credit-search-input-container">
          <SearchIcon width={16} height={16} color={CREDIT_COLORS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search buyers..."
            placeholderTextColor={CREDIT_COLORS.textMuted}
            style={styles.searchInput}
            testID="credit-search-input"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FilterChip
          label="All"
          active={filterMode === 'all'}
          onPress={() => setFilterMode('all')}
          count={buyers.length}
        />
        <FilterChip
          label="Needs Investigation"
          active={filterMode === 'investigation'}
          onPress={() => setFilterMode('investigation')}
          count={investigationCount}
        />
      </View>

      {isLoading ? (
        <View style={styles.summaryRow}>
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
        </View>
      ) : (
        <View style={styles.summaryRow} testID="credit-summary-row">
          <View style={[styles.summaryCard, { backgroundColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder }]}>
            <View style={styles.summaryLabelRow}>
              <PlantIcon width={14} height={14} color={CREDIT_COLORS.plantDark} style={styles.summaryLabelIcon} />
              <Text style={[styles.summaryLabel, { color: CREDIT_COLORS.plantDark }]}>TOTAL PLANT</Text>
            </View>
            <Text style={[styles.summaryValue, { color: CREDIT_COLORS.plantDark }]}>${totalPlant.toFixed(2)}</Text>
            <Text style={[styles.summarySub, { color: CREDIT_COLORS.plantDark }]}>{plantBuyers} buyers</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: CREDIT_COLORS.shippingBg, borderColor: CREDIT_COLORS.shippingBorder }]}>
            <View style={styles.summaryLabelRow}>
              <BoxIcon width={14} height={14} color={CREDIT_COLORS.shippingDark} style={styles.summaryLabelIcon} />
              <Text style={[styles.summaryLabel, { color: CREDIT_COLORS.shippingDark }]}>TOTAL SHIPPING</Text>
            </View>
            <Text style={[styles.summaryValue, { color: CREDIT_COLORS.shippingDark }]}>${totalShipping.toFixed(2)}</Text>
            <Text style={[styles.summarySub, { color: CREDIT_COLORS.shippingDark }]}>{shippingBuyers} buyers</Text>
          </View>
        </View>
      )}

      <View style={styles.listCard}>
        {isLoading ? (
          renderSkeletonList()
        ) : (
          <FlatList
            data={filteredBuyers}
            keyExtractor={(item) => item.uid}
            testID="credit-buyers-list"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            refreshControl={
              <RefreshControl refreshing={isFetching && !refreshing} onRefresh={handleRefresh} tintColor={CREDIT_COLORS.plant} />
            }
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => <BuyerRow testID={`credit-buyer-row-${item.uid}`} buyer={item} onPress={() => onSelectBuyer(item)} />}
            ListEmptyComponent={
              <View style={styles.empty} testID="credit-empty-state">
                <Text style={styles.emptyText}>No buyers match your search</Text>
              </View>
            }
          />
        )}
      </View>
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
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CREDIT_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: CREDIT_COLORS.border,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CREDIT_COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: CREDIT_COLORS.textPrimary,
    paddingVertical: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    backgroundColor: CREDIT_COLORS.surface,
    borderColor: CREDIT_COLORS.border,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabelIcon: {
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 1,
  },
  summarySub: {
    fontSize: 10,
    opacity: 0.7,
  },
  listCard: {
    flex: 1,
    backgroundColor: CREDIT_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CREDIT_COLORS.border,
    overflow: 'hidden',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CREDIT_COLORS.borderLight,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    backgroundColor: CREDIT_COLORS.borderLight,
  },
  skeletonName: {
    width: '55%',
    marginBottom: 8,
  },
  skeletonMeta: {
    width: '75%',
    marginBottom: 8,
  },
  skeletonChip: {
    width: 80,
    height: 22,
    borderRadius: 11,
  },
  skeletonSummaryLabel: {
    width: '45%',
    marginBottom: 10,
  },
  skeletonSummaryValue: {
    width: '70%',
    height: 28,
    marginBottom: 6,
  },
  skeletonSummarySub: {
    width: '40%',
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buyerInfo: {
    flex: 1,
    minWidth: 0,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '600',
    color: CREDIT_COLORS.textPrimary,
    marginBottom: 1,
  },
  buyerMeta: {
    fontSize: 12,
    color: CREDIT_COLORS.textMuted,
    marginBottom: 5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipZero: {
    backgroundColor: CREDIT_COLORS.borderLight,
  },
  chipOutline: {
    borderWidth: 1,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CREDIT_COLORS.redBg,
    borderWidth: 1,
    borderColor: CREDIT_COLORS.redBorder,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  warningBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: CREDIT_COLORS.red,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: CREDIT_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: CREDIT_COLORS.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CREDIT_COLORS.bg,
    borderWidth: 1,
    borderColor: CREDIT_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: CREDIT_COLORS.redBg,
    borderColor: CREDIT_COLORS.redBorder,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: CREDIT_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: CREDIT_COLORS.red,
  },
  filterChipBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CREDIT_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterChipBadgeActive: {
    backgroundColor: CREDIT_COLORS.red,
  },
  filterChipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: CREDIT_COLORS.textPrimary,
  },
  filterChipBadgeTextActive: {
    color: '#FFFFFF',
  },
  buyerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  lastActivity: {
    fontSize: 11,
    color: CREDIT_COLORS.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: CREDIT_COLORS.textMuted,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: CREDIT_COLORS.border,
    marginHorizontal: 16,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: CREDIT_COLORS.textMuted,
  },
});
