import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/iconnav/search.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import EllipsisIcon from '../../../assets/admin-icons/options.svg';
// import Options from '../../../../assets/admin-icons/options.svg';
import CheckBox from '../../../components/CheckBox/CheckBox';
import { getPendingPaymentOrdersApi, updateOrderToReadyToFlyApi, deletePendingOrderApi } from '../../../components/Api/paymentManagementApi';

const PaymentManagement = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  const [menuVisibleId, setMenuVisibleId] = useState(null);

  const fetchOrders = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const body = {
        limit: 10,
        sort: sortOrder,
        lastDocId: reset ? null : lastDocId,
      };

      if (searchQuery) {
        // Simple heuristic: if it looks like a transaction number (e.g. starts with TRN or is numeric), use transactionNumber
        // otherwise assume plantCode. Adjust logic as needed.
        if (searchQuery.toUpperCase().startsWith('TRN') || !isNaN(searchQuery)) {
            body.transactionNumber = searchQuery;
        } else {
            body.plantCode = searchQuery;
        }
      }

      const data = await getPendingPaymentOrdersApi(body);

      if (data.success) {
        const newOrders = data.data;
        if (reset) {
          setOrders(newOrders);
        } else {
          setOrders((prev) => [...prev, ...newOrders]);
        }
        setLastDocId(data.lastDocId);
        setHasMore(!!data.lastDocId);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [lastDocId, loading, searchQuery, sortOrder]);

  useEffect(() => {
    fetchOrders(true);
  }, [sortOrder]); // Re-fetch when sort changes

  const handleSearch = () => {
    fetchOrders(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchOrders(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUpdateStatus = async (ids) => {
    try {
      setLoading(true);
      const data = await updateOrderToReadyToFlyApi(ids);

      if (data.success) {
        setLoading(false);
        Alert.alert('Success', data.message);
        fetchOrders(true); // Refresh list
        setSelectedOrders([]);
      } else {
        setLoading(false);
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (error) {
        setLoading(false);
      console.error('Error updating status:', error);
      Alert.alert('Error', 'An error occurred');
    }
  };

  const handleDeleteOrder = async (id) => {
    
    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const data = await deletePendingOrderApi(id);

              if (data.success) {
                setLoading(false);
                Alert.alert('Success', 'Order deleted');
                fetchOrders(true);
              } else {
                setLoading(false);
                Alert.alert('Error', 'Failed to delete order');
              }
            } catch (error) {
              setLoading(false);
              console.error('Error deleting order:', error);
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
        <Image source={{ uri: item.imagePrimary }} style={styles.plantImage} />
        <View style={styles.checkboxContainer}>
          <CheckBox
            isChecked={selectedOrders.includes(item.id)}
            onToggle={() => toggleSelection(item.id)}
            checkedColor="#539461"
          />
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisibleId(item.id)}
        >
          <EllipsisIcon width={20} height={20} fill="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.plantCode}>{item.plantCode}</Text>
        <Text style={styles.plantName} numberOfLines={1}>
          {item.genus} {item.species}
        </Text>
        <Text style={styles.variegation} numberOfLines={1}>{item.variegation}</Text>
        <Text style={styles.details}>Qty: {item.orderQty}</Text>
        <Text style={styles.details}>Trx: {item.transactionNumber}</Text>
        <Text style={styles.details}>Buyer: {(item?.buyerInfo?.firstName || '') + ' ' + (item?.buyerInfo?.lastName || '')}</Text>
        <Text style={styles.price}>Final Total: ${item.usdPrice || item.finalTotal}</Text>
      </View>

      {/* Context Menu Modal */}
      <Modal
        transparent={true}
        visible={menuVisibleId === item.id}
        onRequestClose={() => setMenuVisibleId(null)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisibleId(null)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisibleId(null);
                handleUpdateStatus([item.id]);
              }}
            >
              <Text style={styles.menuText}>Ready to Fly</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisibleId(null);
                handleDeleteOrder(item.id);
              }}
            >
              <Text style={[styles.menuText, { color: '#E7522F' }]}>Delete Order</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Mgmt</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search & Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <SearchIcon width={20} height={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Plant Code or Trx..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <SortIcon width={20} height={20} />
        </TouchableOpacity>
        {/* </View> */}
      </View>

      {/* List */}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator color="#539461" /> : null}
        ListEmptyComponent={!loading && <Text style={styles.emptyText}>No pending orders found.</Text>}
      />

      {/* Bottom Action Bar */}
      {selectedOrders.length > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedText}>{selectedOrders.length} selected</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateStatus(selectedOrders)}
          >
            <Text style={styles.actionButtonText}>Tag as Ready to Fly</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  backButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#202325',
  },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
  },
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
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 4,
  },
  cardContent: {
    padding: 12,
  },
  plantCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#539461',
    marginBottom: 4,
  },
  plantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 2,
  },
  variegation: {
    fontSize: 12,
    color: '#647276',
    marginBottom: 8,
  },
  details: {
    fontSize: 12,
    color: '#647276',
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  actionButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#647276',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 200,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});

export default PaymentManagement;
