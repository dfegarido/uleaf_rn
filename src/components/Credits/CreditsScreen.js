import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getBuyerCreditStatementApi,
  clearCreditsApi,
  invalidateCreditManagementCache,
  invalidateCreditStatementCache,
} from '../Api/creditApi';
import { formatCreditAmount } from '../../utils/creditEnums';
import ScreenHeader from '../Admin/header';
import CreditSummaryCard from './CreditSummaryCard';
import CreditFilterBar from './CreditFilterBar';
import CreditLedgerCard from './CreditLedgerCard';
import LoadMoreFooter from './LoadMoreFooter';
import CreditEmptyState from './CreditEmptyState';
import { CreditLedgerSkeletonList } from './CreditLedgerSkeleton';

const PAGE_SIZE = 25;

const normalizeStatement = (response) => {
  const statementData = response.data || response;
  const statement = statementData.transactions ? statementData : statementData.data;
  return {
    summary: statement?.summary || null,
    reconciliation: statement?.reconciliation || null,
    transactions: statement?.transactions || [],
  };
};

export const CREDIT_STATEMENT_QUERY_KEY = (buyerUid) => ['credit-statement', buyerUid];

export default function CreditsScreen({
  buyerUid,
  title = 'Credits',
  showDebug = false,
  isAdmin = false,
  headerProps = {},
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clearModal, setClearModal] = useState({ visible: false, item: null, reason: '', clearing: false, error: null });

  // Local pagination state: append pages 2..N to the cached first page.
  const [extraTransactions, setExtraTransactions] = useState([]);
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const {
    data: initialData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: CREDIT_STATEMENT_QUERY_KEY(buyerUid),
    queryFn: async () => {
      const response = await getBuyerCreditStatementApi({
        buyerUid,
        limit: PAGE_SIZE,
        sort,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to load credit statement');
      }
      return normalizeStatement(response);
    },
    enabled: !!buyerUid,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Reset local pagination whenever the cached first page changes (refresh, sort change).
  useEffect(() => {
    setExtraTransactions([]);
    setLastDocId(initialData?.summary?.lastDocId || null);
    setHasMore(initialData?.summary?.hasMore || false);
  }, [initialData]);

  const summary = initialData?.summary || null;
  const firstPageTransactions = initialData?.transactions || [];
  const transactions = [...firstPageTransactions, ...extraTransactions];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      setExtraTransactions([]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !buyerUid) return;
    const cursor = lastDocId || summary?.lastDocId;
    if (!cursor) return;

    setLoadingMore(true);
    try {
      const response = await getBuyerCreditStatementApi({
        buyerUid,
        limit: PAGE_SIZE,
        sort,
        startAfter: cursor,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to load more transactions');
      }
      const { transactions: nextPage, summary: nextSummary } = normalizeStatement(response);
      setExtraTransactions(prev => [...prev, ...(nextPage || [])]);
      setLastDocId(nextSummary?.lastDocId || null);
      setHasMore(nextSummary?.hasMore || false);
    } finally {
      setLoadingMore(false);
    }
  }, [buyerUid, hasMore, lastDocId, loadingMore, sort, summary]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.transactionType === filter;
  });

  const renderItem = useCallback(({ item, index }) => {
    const prev = filteredTransactions[index - 1];
    const currentDate = item.date ? new Date(item.date).toDateString() : '';
    const prevDate = prev?.date ? new Date(prev.date).toDateString() : '';
    const isFirstInDay = !prev || currentDate !== prevDate;
    return (
      <CreditLedgerCard
        item={item}
        isFirstInDay={isFirstInDay}
        showDebug={showDebug}
        isAdmin={isAdmin}
        onClearCredit={(it) => setClearModal({ visible: true, item: it, reason: '', clearing: false, error: null })}
        onViewInvoice={({ transactionNumber }) => {
          if (!transactionNumber) return;
          navigation.navigate('InvoiceViewScreen', { transactionNumber });
        }}
      />
    );
  }, [filteredTransactions, showDebug, isAdmin, navigation]);

  const handleClearCredit = useCallback(async () => {
    const { item, reason } = clearModal;
    if (!item || !reason.trim()) return;
    setClearModal(m => ({ ...m, clearing: true, error: null }));
    const result = await clearCreditsApi({
      buyerId: buyerUid,
      creditId: item.creditId || item.id,
      reason: reason.trim(),
      amount: item.amount,
      reasonType: 'credit_cleared',
    });
    if (!result.success) {
      setClearModal(m => ({ ...m, clearing: false, error: result.error || 'Failed to clear credit' }));
      return;
    }
    invalidateCreditManagementCache(queryClient);
    invalidateCreditStatementCache(queryClient, buyerUid);
    setClearModal({ visible: false, item: null, reason: '', clearing: false, error: null });
    setExtraTransactions([]);
    await refetch();
  }, [clearModal, buyerUid, queryClient, refetch]);

  const toggleSort = () => {
    setSort(s => (s === 'desc' ? 'asc' : 'desc'));
    setExtraTransactions([]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { paddingTop: insets.top }]} edges={['bottom']}>
        <ScreenHeader title={title} {...headerProps} />
        <CreditLedgerSkeletonList count={6} hasHeader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: insets.top }]} edges={['bottom']}>
      <ScreenHeader title={title} {...headerProps} />

      <FlatList
        ref={flatListRef}
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} tintColor="#12B76A" />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {summary && <CreditSummaryCard {...summary} showDiagnostics={isAdmin} />}
            <CreditFilterBar
              activeFilter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={toggleSort}
            />
          </View>
        }
        ListFooterComponent={
          summary ? (
            <LoadMoreFooter
              loading={loadingMore}
              hasMore={hasMore}
              onPress={onLoadMore}
            />
          ) : null
        }
        ListEmptyComponent={
          !isFetching ? <CreditEmptyState /> : null
        }
      />

      {clearModal.visible && (
        <Modal
          transparent
          animationType="fade"
          visible={clearModal.visible}
          onRequestClose={() => setClearModal({ visible: false, item: null, reason: '', clearing: false, error: null })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Clear Credit</Text>
              <Text style={styles.modalBody}>
                Clear {formatCreditAmount(clearModal.item?.amount)} credit? A reason is required.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter reason (required)"
                value={clearModal.reason}
                onChangeText={(text) => setClearModal(m => ({ ...m, reason: text }))}
                multiline
              />
              {clearModal.error ? <Text style={styles.modalError}>{clearModal.error}</Text> : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setClearModal({ visible: false, item: null, reason: '', clearing: false, error: null })}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, (!clearModal.reason.trim() || clearModal.clearing) && styles.modalConfirmDisabled]}
                  onPress={handleClearCredit}
                  disabled={!clearModal.reason.trim() || clearModal.clearing}
                >
                  <Text style={styles.modalConfirmText}>{clearModal.clearing ? 'Clearing…' : 'Clear Credit'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 24,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: '#475467',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#101828',
  },
  modalError: {
    color: '#F04438',
    fontSize: 13,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#F04438',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalConfirmDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
