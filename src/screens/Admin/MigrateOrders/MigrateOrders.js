import AppImage from '../../../components/AppImage/AppImage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/iconnav/search.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import CheckBox from '../../../components/CheckBox/CheckBox';
import Svg, { Path } from 'react-native-svg';
import {
  listPayToBoardOrdersApi,
  migratePayToBoardOrdersApi,
  clearPayToBoardOrdersApi,
} from '../../../components/Api/migrateOrdersApi';
import { searchBuyersApi } from '../../../components/Api/searchBuyersApi';
import { getAllUsersApi } from '../../../components/Api/getAllUsersApi';

const normalizeBuyer = (b) => ({
  id: b.id || b.userId || b.uid,
  name:
    [b.firstName, b.lastName].filter(Boolean).join(' ') ||
    b.username ||
    b.email ||
    b.name ||
    'Unknown',
  firstName: b.firstName || '',
  lastName: b.lastName || '',
  username: b.username || '',
  email: b.email || '',
  profileImage: b.profileImage || b.avatarUrl || null,
});

const sortBuyersByName = (list) =>
  [...list].sort((a, b) => {
    const nameA = (
      a.firstName && a.lastName
        ? `${a.firstName} ${a.lastName}`
        : a.name || a.username || ''
    ).toLowerCase();
    const nameB = (
      b.firstName && b.lastName
        ? `${b.firstName} ${b.lastName}`
        : b.name || b.username || ''
    ).toLowerCase();
    return nameA.localeCompare(nameB);
  });

const orderBuyerLabel = (item) => {
  const info = item?.buyerInfo || {};
  const full = [info.firstName, info.lastName].filter(Boolean).join(' ').trim();
  return info.username || full || info.email || item?.buyerUid || 'Unknown';
};

const MigrateOrders = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedBuyers, setSelectedBuyers] = useState([]); // [{ id, name, email, ... }]
  const [draftBuyers, setDraftBuyers] = useState([]); // selection while modal is open
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const fetchingRef = useRef(false);
  const lastDocIdRef = useRef(null);
  const searchQueryRef = useRef('');
  const selectedBuyersRef = useRef([]);
  const buyerSearchDebounceRef = useRef(null);
  const fetchRequestIdRef = useRef(0);
  const PAGE_SIZE = 10;
  const BUYER_PAGE_SIZE = 100;

  /** Backend uses exact match; normalize TXN / plant code for reliable search. */
  const buildSearchParams = (raw) => {
    const q = String(raw || '').trim();
    if (!q) return {};

    const upper = q.toUpperCase().replace(/\s+/g, '');
    const digitsOnly = /^\d+$/.test(upper);
    const looksLikeTxn =
      upper.startsWith('TXN') ||
      upper.startsWith('TRN') ||
      digitsOnly ||
      /TXN\d+/i.test(q);

    if (looksLikeTxn) {
      let txn = upper;
      if (digitsOnly) txn = `TXN${upper}`;
      if (txn.startsWith('TRN') && !txn.startsWith('TXN')) {
        txn = `TXN${txn.slice(3)}`;
      }
      const match = txn.match(/TXN\d+/);
      return { transactionNumber: match ? match[0] : txn };
    }

    return { plantCode: upper };
  };

  const fetchOrders = async (reset = false, buyerOverride = undefined) => {
    // Allow forced refresh (e.g. Apply buyer filter) even if a fetch is in flight.
    if (fetchingRef.current && buyerOverride === undefined && !reset) return;

    const requestId = ++fetchRequestIdRef.current;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const buyerUids =
        buyerOverride !== undefined
          ? (buyerOverride || []).map((b) => (typeof b === 'string' ? b : b.id)).filter(Boolean)
          : (selectedBuyersRef.current || []).map((b) => b.id).filter(Boolean);
      const body = {
        limit: buyerUids.length > 0 ? BUYER_PAGE_SIZE : PAGE_SIZE,
        sort: sortOrder,
        lastDocId: reset ? null : lastDocIdRef.current,
        ...buildSearchParams(searchQueryRef.current),
      };
      if (buyerUids.length > 0) {
        body.buyerUids = buyerUids;
        if (buyerUids.length === 1) body.buyerUid = buyerUids[0];
      }

      console.log('[MigrateOrders] fetchOrders', { requestId, reset, buyerUids, body });
      const data = await listPayToBoardOrdersApi(body);

      // Ignore stale responses from an older in-flight request.
      if (requestId !== fetchRequestIdRef.current) {
        console.log('[MigrateOrders] ignoring stale response', requestId);
        return;
      }

      if (data.success) {
        const newOrders = (data.data || []).filter((order) => Boolean(order?.id));
        console.log('[MigrateOrders] got orders', newOrders.length);
        if (reset) {
          setOrders(newOrders);
        } else {
          setOrders((prev) => {
            const mergedById = new Map(prev.map((order) => [order.id, order]));
            newOrders.forEach((order) => mergedById.set(order.id, order));
            return Array.from(mergedById.values());
          });
        }
        lastDocIdRef.current = data.lastDocId || null;
        const pageLimit = buyerUids.length > 0 ? BUYER_PAGE_SIZE : PAGE_SIZE;
        setHasMore(newOrders.length >= pageLimit && !!data.lastDocId);
      } else {
        const msg = data.error || data.message || 'Unknown error';
        console.error('Failed to fetch orders:', msg, data);
        if (reset) setOrders([]);
        setHasMore(false);
        Alert.alert('Migrate Orders', msg);
      }
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) return;
      console.error('Error fetching orders:', error);
      if (reset) setOrders([]);
      setHasMore(false);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        fetchingRef.current = false;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    lastDocIdRef.current = null;
    fetchOrders(true);
  }, [sortOrder]);

  const handleSearch = () => {
    searchQueryRef.current = searchQuery.trim();
    setSearchQuery(searchQueryRef.current);
    lastDocIdRef.current = null;
    setSelectedOrders([]);
    fetchOrders(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchQueryRef.current = '';
    lastDocIdRef.current = null;
    setSelectedOrders([]);
    fetchOrders(true);
  };

  const openBuyerModal = () => {
    setDraftBuyers(selectedBuyers);
    setBuyerModalVisible(true);
  };

  const toggleDraftBuyer = (buyer) => {
    setDraftBuyers((prev) => {
      const exists = prev.some((b) => b.id === buyer.id);
      if (exists) return prev.filter((b) => b.id !== buyer.id);
      return [...prev, buyer];
    });
  };

  const applyBuyerFilter = () => {
    const next = [...draftBuyers];
    const buyerUids = next.map((b) => b.id).filter(Boolean);
    console.log('[MigrateOrders] applyBuyerFilter', {
      count: next.length,
      buyerUids,
      names: next.map((b) => b.name),
    });
    if (buyerUids.length === 0) {
      Alert.alert('Select Buyers', 'Please select at least one buyer, or tap Clear.');
      return;
    }
    setSelectedBuyers(next);
    selectedBuyersRef.current = next;
    setBuyerModalVisible(false);
    setBuyerSearch('');
    // Clear plant/TXN search so it doesn't AND with buyer filter and return empty.
    setSearchQuery('');
    searchQueryRef.current = '';
    lastDocIdRef.current = null;
    setSelectedOrders([]);
    fetchOrders(true, next);
  };

  const clearBuyerFilter = () => {
    setSelectedBuyers([]);
    selectedBuyersRef.current = [];
    setDraftBuyers([]);
    setBuyerModalVisible(false);
    setBuyerSearch('');
    lastDocIdRef.current = null;
    setSelectedOrders([]);
    fetchOrders(true, []);
  };

  const buyerFilterLabel = () => {
    if (!selectedBuyers.length) return 'Filter by Buyer';
    if (selectedBuyers.length === 1) return `Buyer: ${selectedBuyers[0].name}`;
    return `${selectedBuyers.length} buyers selected`;
  };

  const loadInitialBuyers = useCallback(async () => {
    try {
      setBuyerLoading(true);
      const res = await getAllUsersApi({ role: 'buyer', limit: 50, page: 1 });
      const list =
        (Array.isArray(res?.data?.users) && res.data.users) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.results) && res.results) ||
        (Array.isArray(res?.users) && res.users) ||
        [];
      let normalized = list.map(normalizeBuyer).filter((x) => x.id);

      // If API didn't filter by role server-side, enforce buyer-only here
      if (!normalized.length) {
        const resAll = await getAllUsersApi({ limit: 50, page: 1 });
        const listAll =
          (Array.isArray(resAll?.data?.users) && resAll.data.users) ||
          (Array.isArray(resAll?.data) && resAll.data) ||
          (Array.isArray(resAll?.results) && resAll.results) ||
          (Array.isArray(resAll?.users) && resAll.users) ||
          [];
        normalized = listAll
          .map((b) => ({
            ...normalizeBuyer(b),
            rawRole: (b.role || b.rawRole || '').toString().toLowerCase(),
          }))
          .filter((x) => x.id && (x.rawRole === 'buyer' || x.rawRole === 'buyers'));
      }

      setBuyerOptions(sortBuyersByName(normalized));
    } catch (e) {
      console.error('Failed to load buyers:', e);
      setBuyerOptions([]);
    } finally {
      setBuyerLoading(false);
    }
  }, []);

  // Load buyers once when the modal opens
  useEffect(() => {
    if (!buyerModalVisible) {
      setBuyerSearch('');
      return;
    }
    setBuyerSearch('');
    loadInitialBuyers();
  }, [buyerModalVisible, loadInitialBuyers]);

  // Debounced search only — do not depend on buyerOptions/buyerLoading (avoids reload loop)
  useEffect(() => {
    if (!buyerModalVisible) return;

    const q = buyerSearch.trim();

    if (buyerSearchDebounceRef.current) {
      clearTimeout(buyerSearchDebounceRef.current);
    }

    // Empty search: keep the list already loaded on open (don't refetch in a loop)
    if (q.length === 0) {
      return;
    }

    // Wait until 2+ characters before searching
    if (q.length < 2) {
      return;
    }

    buyerSearchDebounceRef.current = setTimeout(async () => {
      try {
        setBuyerLoading(true);
        const res = await searchBuyersApi({ query: q, limit: 50, offset: 0 });
        if (!res?.success) {
          throw new Error(res?.error || 'Failed to search buyers.');
        }
        const buyers = (res.data?.buyers || []).map(normalizeBuyer).filter((x) => x.id);
        setBuyerOptions(sortBuyersByName(buyers));
      } catch (error) {
        console.error('Buyer search error:', error);
        setBuyerOptions([]);
      } finally {
        setBuyerLoading(false);
      }
    }, 300);

    return () => {
      if (buyerSearchDebounceRef.current) {
        clearTimeout(buyerSearchDebounceRef.current);
      }
    };
  }, [buyerSearch, buyerModalVisible]);

  // When user clears the search box, restore the initial buyer list once
  const prevBuyerSearchRef = useRef('');
  useEffect(() => {
    if (!buyerModalVisible) {
      prevBuyerSearchRef.current = '';
      return;
    }
    const prev = prevBuyerSearchRef.current;
    const next = buyerSearch.trim();
    prevBuyerSearchRef.current = next;
    // Transitioned from typing back to empty → reload default list
    if (prev.length > 0 && next.length === 0) {
      loadInitialBuyers();
    }
  }, [buyerSearch, buyerModalVisible, loadInitialBuyers]);

  const handleLoadMore = () => {
    if (!hasMore || loading || fetchingRef.current || orders.length === 0) return;
    fetchOrders(false);
  };

  const toggleSelection = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMigrate = (ids) => {
    Alert.alert(
      'Migrate to Ready to Fly',
      'Paid manually? This moves the Pay to Board order (all plants on the same TXN) to Ready to Fly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          onPress: async () => {
            try {
              setLoading(true);
              const data = await migratePayToBoardOrdersApi(ids);
              setLoading(false);
              if (data.success) {
                Alert.alert('Success', data.message);
                lastDocIdRef.current = null;
                fetchOrders(true);
                setSelectedOrders([]);
              } else {
                Alert.alert('Error', data.error || data.message || 'Failed to migrate order');
              }
            } catch (error) {
              setLoading(false);
              console.error('Error migrating orders:', error);
              Alert.alert('Error', 'An error occurred');
            }
          },
        },
      ]
    );
  };

  const handleClear = (ids) => {
    Alert.alert(
      'Clear from Pay to Board',
      'This removes the unpaid / failed-checkout order (all plants on the same TXN) so the buyer can check out again. Not Ready to Fly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const data = await clearPayToBoardOrdersApi(ids);
              setLoading(false);
              if (data.success) {
                Alert.alert('Success', data.message);
                lastDocIdRef.current = null;
                fetchOrders(true);
                setSelectedOrders([]);
              } else {
                Alert.alert('Error', data.error || data.message || 'Failed to clear order');
              }
            } catch (error) {
              setLoading(false);
              console.error('Error clearing orders:', error);
              Alert.alert('Error', 'An error occurred');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <AppImage source={{ uri: item.imagePrimary }} style={styles.plantImage} />
        <View style={styles.checkboxContainer}>
          <CheckBox
            isChecked={selectedOrders.includes(item.id)}
            onToggle={() => toggleSelection(item.id)}
            checkedColor="#539461"
          />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.plantCode}>{item.plantCode}</Text>
        <Text style={styles.plantName} numberOfLines={1}>
          {item.genus} {item.species}
        </Text>
        <Text style={styles.variegation} numberOfLines={1}>{item.variegation}</Text>
        <Text style={styles.details}>Qty: {item.orderQty}</Text>
        <Text style={styles.details}>Trx: {item.transactionNumber}</Text>
        <Text style={styles.details} numberOfLines={1}>
          Buyer: {orderBuyerLabel(item)}
        </Text>
        <Text style={styles.price}>Final Total: ${item.usdPrice || item.finalTotal}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={() => handleClear([item.id])}>
          <Text style={styles.clearButtonText}>Clear from Pay to Board</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardButton} onPress={() => handleMigrate([item.id])}>
          <Text style={styles.cardButtonText}>Migrate to Ready to Fly</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Migrate Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={handleSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <SearchIcon width={20} height={20} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Plant code or TXN..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="characters"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <SortIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.buyerFilterRow}>
        <TouchableOpacity
          style={[styles.buyerFilterChip, selectedBuyers.length > 0 && styles.buyerFilterChipActive]}
          onPress={openBuyerModal}
        >
          <Text
            style={[styles.buyerFilterChipText, selectedBuyers.length > 0 && styles.buyerFilterChipTextActive]}
            numberOfLines={1}
          >
            {buyerFilterLabel()}
          </Text>
        </TouchableOpacity>
        {selectedBuyers.length > 0 && (
          <TouchableOpacity onPress={clearBuyerFilter} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>Clear buyer</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedBuyers.length > 0 && (
        <Text style={styles.hintText}>
          Showing pending Pay to Board orders for {selectedBuyers.length === 1 ? 'this buyer' : 'these buyers'}. Clear them so they can check out again.
        </Text>
      )}

      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={loading && orders.length > 0 ? <ActivityIndicator color="#539461" /> : null}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#539461" style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>No Pay to Board orders found.</Text>
          )
        }
      />

      {selectedOrders.length > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedText}>{selectedOrders.length} selected</Text>
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.clearActionButton}
              onPress={() => handleClear(selectedOrders)}
            >
              <Text style={styles.clearActionButtonText}>Clear from Pay to Board</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMigrate(selectedOrders)}
            >
              <Text style={styles.actionButtonText}>Ready to Fly</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent
        visible={buyerModalVisible}
        onRequestClose={() => setBuyerModalVisible(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setBuyerModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.actionSheetContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Buyers</Text>
                    <TouchableOpacity onPress={() => setBuyerModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.71967 4.71967C5.01256 4.42678 5.48744 4.42678 5.78033 4.71967L12 10.9393L18.2197 4.71967C18.5126 4.42678 18.9874 4.42678 19.2803 4.71967C19.5732 5.01256 19.5732 5.48744 19.2803 5.78033L13.0607 12L19.2803 18.2197C19.5732 18.5126 19.5732 18.9874 19.2803 19.2803C18.9874 19.5732 18.5126 19.5732 18.2197 19.2803L12 13.0607L5.78033 19.2803C5.48744 19.5732 5.01256 19.5732 4.71967 19.2803C4.42678 18.9874 4.42678 18.5126 4.71967 18.2197L10.9393 12L4.71967 5.78033C4.42678 5.48744 4.42678 5.01256 4.71967 4.71967Z"
                          fill="#7F8D91"
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalContentContainer}>
                    <View style={styles.buyerSearchField}>
                      <SearchIcon width={20} height={20} />
                      <TextInput
                        style={styles.buyerSearchInput}
                        placeholder="Search by name, email, or username..."
                        placeholderTextColor="#647276"
                        value={buyerSearch}
                        onChangeText={setBuyerSearch}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                    </View>

                    {draftBuyers.length > 0 && (
                      <Text style={styles.draftCountText}>
                        {draftBuyers.length} selected
                      </Text>
                    )}

                    {buyerLoading ? (
                      <View style={styles.buyerLoadingContainer}>
                        <ActivityIndicator size="small" color="#539461" />
                        <Text style={styles.buyerLoadingText}>Loading buyers...</Text>
                      </View>
                    ) : (
                      <ScrollView
                        style={styles.buyerListContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                      >
                        {buyerOptions.length === 0 ? (
                          <View style={styles.buyerEmptyContainer}>
                            <Text style={styles.buyerEmptyText}>
                              {buyerSearch.trim().length >= 2
                                ? 'No buyers found'
                                : 'No buyers available'}
                            </Text>
                          </View>
                        ) : (
                          buyerOptions.map((item, index) => {
                            const isChecked = draftBuyers.some((b) => b.id === item.id);
                            return (
                              <View key={item.id || index}>
                                <TouchableOpacity
                                  style={styles.buyerItemContainer}
                                  onPress={() => toggleDraftBuyer(item)}
                                  activeOpacity={0.7}
                                >
                                  {item.profileImage ? (
                                    <AppImage source={{ uri: item.profileImage }} style={styles.buyerAvatar} />
                                  ) : (
                                    <View style={[styles.buyerAvatar, styles.buyerAvatarPlaceholder]}>
                                      <Text style={styles.buyerAvatarText}>
                                        {(item.name || '?').charAt(0).toUpperCase()}
                                      </Text>
                                    </View>
                                  )}
                                  <View style={styles.buyerInfo}>
                                    <Text style={styles.buyerRowName}>{item.name}</Text>
                                    {!!item.email && (
                                      <Text style={styles.buyerRowEmail}>{item.email}</Text>
                                    )}
                                    {!!item.username && item.username !== item.email && (
                                      <Text style={styles.buyerRowEmail}>@{item.username}</Text>
                                    )}
                                  </View>
                                  <CheckBox
                                    isChecked={isChecked}
                                    onToggle={() => toggleDraftBuyer(item)}
                                    checkedColor="#539461"
                                  />
                                </TouchableOpacity>
                                {index < buyerOptions.length - 1 && <View style={styles.buyerDivider} />}
                              </View>
                            );
                          })
                        )}
                      </ScrollView>
                    )}

                    <View style={[styles.buyerModalActions, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                      <TouchableOpacity
                        style={styles.buyerModalClearBtn}
                        onPress={() => setDraftBuyers([])}
                      >
                        <Text style={styles.buyerModalClearBtnText}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.buyerModalApplyBtn}
                        onPress={applyBuyerFilter}
                      >
                        <Text style={styles.buyerModalApplyBtnText}>
                          Apply{draftBuyers.length > 0 ? ` (${draftBuyers.length})` : ''}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F6',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202325' },
  backButton: { padding: 4 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  buyerFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  buyerFilterChip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buyerFilterChipActive: {
    backgroundColor: '#E8F3EB',
    borderWidth: 1,
    borderColor: '#539461',
  },
  buyerFilterChipText: { fontSize: 13, color: '#647276', fontWeight: '600' },
  buyerFilterChipTextActive: { color: '#539461' },
  hintText: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 12,
    color: '#647276',
    lineHeight: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#202325' },
  clearText: { fontSize: 12, color: '#647276', marginLeft: 4, fontWeight: '600' },
  searchButton: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: '#539461',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 8 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: { position: 'relative', height: 140 },
  plantImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkboxContainer: { position: 'absolute', top: 8, left: 8 },
  cardContent: { padding: 12 },
  plantCode: { fontSize: 12, fontWeight: '700', color: '#539461', marginBottom: 4 },
  plantName: { fontSize: 14, fontWeight: '600', color: '#202325', marginBottom: 2 },
  variegation: { fontSize: 12, color: '#647276', marginBottom: 8 },
  details: { fontSize: 12, color: '#647276', marginBottom: 2 },
  price: { fontSize: 16, fontWeight: '700', color: '#202325', marginTop: 8 },
  clearButton: {
    backgroundColor: '#FFF1EE',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C2B8',
  },
  clearButtonText: { color: '#E7522F', fontWeight: '700', fontSize: 11, textAlign: 'center' },
  cardButton: {
    backgroundColor: '#539461',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  cardButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  selectedText: { fontSize: 14, fontWeight: '600', color: '#202325' },
  bottomActions: { flexDirection: 'row', gap: 8 },
  clearActionButton: {
    flex: 1,
    backgroundColor: '#FFF1EE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5C2B8',
    alignItems: 'center',
  },
  clearActionButtonText: { color: '#E7522F', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  actionButton: {
    flex: 1,
    backgroundColor: '#539461',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#647276', paddingHorizontal: 24 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  buyerSearchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  buyerSearchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
    height: '100%',
  },
  draftCountText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#539461',
  },
  buyerLoadingContainer: {
    height: 280,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyerLoadingText: {
    fontSize: 14,
    color: '#647276',
  },
  buyerListContainer: {
    height: 280,
    marginTop: 12,
  },
  buyerEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  buyerEmptyText: {
    fontSize: 14,
    color: '#647276',
  },
  buyerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  buyerAvatarPlaceholder: {
    backgroundColor: '#48A7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerAvatarText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  buyerInfo: {
    flex: 1,
  },
  buyerRowName: { fontSize: 14, fontWeight: '600', color: '#202325' },
  buyerRowEmail: { fontSize: 12, color: '#647276', marginTop: 2 },
  buyerDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  buyerModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  buyerModalClearBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerModalClearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#647276',
  },
  buyerModalApplyBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerModalApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MigrateOrders;
