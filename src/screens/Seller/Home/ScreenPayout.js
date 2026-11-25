import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import PayoutCard, {formatPayoutAmount} from './components/PayoutCard';
import PayoutSkeleton from './components/PayoutSkeleton';
import {retryAsync} from '../../../utils/utils';
import {getHomePayoutListingApi} from '../../../components/Api';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

// list-payout returns at most this many rows per page.
const PAGE_SIZE = 20;

const fetchPayoutPage = async token => {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected || !netState.isInternetReachable) {
    throw new Error('No internet connection.');
  }
  const res = await retryAsync(() => getHomePayoutListingApi(token), 3, 1000);
  if (!res?.success) {
    throw new Error(res?.message || 'Failed to load payout data');
  }
  return res;
};

const ScreenPayout = ({navigation}) => {
  const isFocused = useIsFocused();
  const [data, setData] = useState([]);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [nextToken, setNextToken] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const loadFirstPage = useCallback(async () => {
    try {
      setError('');
      const res = await fetchPayoutPage('');
      const rows = res?.data || [];
      setData(rows);
      setTotalReceivables(res?.totalReceivable || 0);
      setNextToken(res?.nextPageToken || '');
      setHasMore(rows.length >= PAGE_SIZE && !!res?.nextPageToken);
      loadedOnce.current = true;
    } catch (e) {
      setError(e?.message || 'Failed to load payout data');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    if (!loadedOnce.current) setInitialLoading(true);
    loadFirstPage();
  }, [isFocused, loadFirstPage]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFirstPage();
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore || !nextToken) return;
    setLoadingMore(true);
    try {
      const res = await fetchPayoutPage(nextToken);
      const rows = res?.data || [];
      setData(prev => [...prev, ...rows]);
      setNextToken(res?.nextPageToken || '');
      setHasMore(rows.length >= PAGE_SIZE && !!res?.nextPageToken);
    } catch (e) {
      setError(e?.message || 'Failed to load more payouts');
    } finally {
      setLoadingMore(false);
    }
  };

  const currencySymbol = data[0]?.totalReceivableAmountCurrencySymbol || '$';
  const showSkeleton = initialLoading && data.length === 0;

  const header = (
    <View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total receivables</Text>
        <Text style={styles.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>
          {currencySymbol}
          {formatPayoutAmount(totalReceivables)}
        </Text>
        <Text style={styles.summaryCaption}>Amount from sales that has not been paid out yet</Text>
      </View>

      {error ? (
        <TouchableOpacity style={styles.errorBanner} onPress={onRefresh} activeOpacity={0.8}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorRetry}>Tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      {data.length > 0 ? (
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Payout history</Text>
          <Text style={styles.sectionCount}>
            {data.length}
            {hasMore ? '+' : ''} {data.length === 1 ? 'payout' : 'payouts'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>{currencySymbol}</Text>
      </View>
      <Text style={styles.emptyTitle}>No payouts yet</Text>
      <Text style={styles.emptyText}>
        Your payout history will appear here once you make sales.
      </Text>
    </View>
  );

  const footer = hasMore ? (
    <TouchableOpacity
      style={styles.loadMore}
      onPress={onLoadMore}
      disabled={loadingMore}
      activeOpacity={0.7}
      accessibilityRole="button">
      {loadingMore ? (
        <ActivityIndicator color="#539461" />
      ) : (
        <Text style={styles.loadMoreText}>Load more payouts</Text>
      )}
    </TouchableOpacity>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <LeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payouts</Text>
        <View style={styles.backButton} />
      </View>

      {showSkeleton ? (
        <View style={styles.content}>
          <PayoutSkeleton />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => String(item?.id || item?.referenceNumber || index)}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ScreenPayoutDetails', item)}
              accessibilityRole="button"
              accessibilityLabel={`Payout ${item?.payOutDate || ''}`}>
              <PayoutCard item={item} />
            </TouchableOpacity>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={error ? null : empty}
          ListFooterComponent={footer}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F5F6F6'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {fontFamily: 'Inter', fontSize: 18, fontWeight: '700', color: '#202325'},
  content: {padding: 16, paddingBottom: 32},
  summary: {
    backgroundColor: '#1F5C38',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#0E2E1C',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#CFE6D6',
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summaryCaption: {fontFamily: 'Inter', fontSize: 13, color: '#CFE6D6', marginTop: 8},
  errorBanner: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {fontFamily: 'Inter', fontSize: 13, color: '#C8342A', fontWeight: '600'},
  errorRetry: {fontFamily: 'Inter', fontSize: 12, color: '#C8342A', marginTop: 2},
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {fontFamily: 'Inter', fontSize: 17, fontWeight: '700', color: '#202325'},
  sectionCount: {fontFamily: 'Inter', fontSize: 13, color: '#647276'},
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIconText: {fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#23794A'},
  emptyTitle: {fontFamily: 'Inter', fontSize: 17, fontWeight: '700', color: '#202325'},
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    marginTop: 6,
  },
  loadMore: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  loadMoreText: {fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#539461'},
});

export default ScreenPayout;
