import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../../../firebase';
import CloseIcon from '../../../assets/live-icon/close-x.svg';

const ShopModal = ({ isVisible, onClose, broadcasterId, onBuyNow }) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'sold'
  const [allListings, setAllListings] = useState([]);
  const [soldListings, setSoldListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isVisible || !broadcasterId) return;

    const listingsRef = collection(db, 'listing');
    const q = query(
      listingsRef,
      where('sellerCode', '==', broadcasterId),
      where('status', '==', 'Live'),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listings = [];
      querySnapshot.forEach((doc) => {
        listings.push({ id: doc.id, ...doc.data() });
      });

      // Separate into all and sold
      const sold = listings.filter(item => item.availableQty === 0);
      const unSold = listings.filter(item => item.availableQty !== 0);
      setAllListings(unSold);
      setSoldListings(sold);
    });

    return () => unsubscribe();
  }, [isVisible, broadcasterId]);

  const filteredAllListings = allListings.filter(
    (item) =>
      item.genus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.species.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSoldListings = soldListings.filter(
    (item) =>
      item.genus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.species.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderListingItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagePrimary }} style={styles.plantImage} />
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>${item.usdPrice}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.plantName} numberOfLines={2}>
          {item.genus} {item.species}
        </Text>
        <Text style={styles.quantityText}>Quantity: {item.availableQty}</Text>
        <TouchableOpacity style={styles.buyButton} onPress={() => onBuyNow(item)}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSoldItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagePrimary }} style={styles.plantImage} />
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>${item.usdPrice}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.plantName} numberOfLines={2}>
          {item.genus} {item.species}
        </Text>
        <Text style={styles.soldToText}>Sold to @{item.buyerUsername || 'user'}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>LIVE Listing</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseIcon width={24} height={24} color="#000" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchBar}
            placeholder="Search by genus or species"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#BDBDBD"
          />

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}>
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                All Live Listings ({filteredAllListings.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sold' && styles.activeTab]}
              onPress={() => setActiveTab('sold')}>
              <Text style={[styles.tabText, activeTab === 'sold' && styles.activeTabText]}>
                Sold ({filteredSoldListings.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'all' ? (
            <FlatList
              data={filteredAllListings}
              renderItem={renderListingItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <FlatList
              data={filteredSoldListings}
              renderItem={renderSoldItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: '75%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  searchBar: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontFamily: 'Inter',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#539461',
  },
  tabText: {
    fontSize: 14,
    color: '#828282',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#539461',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '31%',
  },
  plantImage: {
    width: '100%',
    height: 100,
  },
  priceContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 8,
  },
  plantName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    height: 30,
    color: '#000',
  },
  quantityText: {
    fontSize: 10,
    color: '#828282',
    marginVertical: 4,
    fontFamily: 'Inter',
  },
  buyButton: {
    backgroundColor: '#539461',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  soldToText: {
    fontSize: 12,
    color: '#539461',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});

export default ShopModal;