import AppImage from '../../../components/AppImage/AppImage';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/iconnav/search.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import CheckBox from '../../../components/CheckBox/CheckBox';
import { listPayToBoardOrdersApi, migratePayToBoardOrdersApi } from '../../../components/Api/migrateOrdersApi';

const MigrateOrders = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const fetchingRef = useRef(false);
  const lastDocIdRef = useRef(null);
  const searchQueryRef = useRef('');
  const PAGE_SIZE = 10;

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

  const fetchOrders = async (reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const body = {
        limit: PAGE_SIZE,
        sort: sortOrder,
        lastDocId: reset ? null : lastDocIdRef.current,
        ...buildSearchParams(searchQueryRef.current),
      };

      const data = await listPayToBoardOrdersApi(body);

      if (data.success) {
        const newOrders = (data.data || []).filter((order) => Boolean(order?.id));
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
        setHasMore(newOrders.length >= PAGE_SIZE && !!data.lastDocId);
      } else {
        const msg = data.error || data.message || 'Unknown error';
        console.error('Failed to fetch orders:', msg, data);
        if (reset) setOrders([]);
        setHasMore(false);
        Alert.alert('Migrate Orders', msg);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (reset) setOrders([]);
      setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
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
        <Text style={styles.details}>
          Buyer: {(item?.buyerInfo?.firstName || '') + ' ' + (item?.buyerInfo?.lastName || '')}
        </Text>
        <Text style={styles.price}>Final Total: ${item.usdPrice || item.finalTotal}</Text>
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMigrate(selectedOrders)}
          >
            <Text style={styles.actionButtonText}>Migrate to Ready to Fly</Text>
          </TouchableOpacity>
        </View>
      )}
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
  filterContainer: { flexDirection: 'row', padding: 16, gap: 12 },
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
  cardButton: {
    backgroundColor: '#539461',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  cardButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  selectedText: { fontSize: 14, fontWeight: '600', color: '#202325' },
  actionButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#647276' },
});

export default MigrateOrders;
