import AppImage from '../../../components/AppImage/AppImage';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import LiveStreamAddToCartButton from '../../../components/LiveStreamAddToCartButton';
import { getLiveListingsBySessionApi } from '../../../components/Api/agoraLiveApi';
import { liveOrderLookupApi } from '../../../components/Api/liveApi';

const SORT_OPTIONS = [
  {key: 'sequence', label: 'Sequence #'},
  {key: 'genus', label: 'Genus'},
  {key: 'priceHigh', label: 'Price High to Low'},
  {key: 'priceLow', label: 'Price Low to High'},
];

const createdAtMs = (data) => {
  const ts = data?.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds != null) return ts.seconds * 1000;
  return 0;
};

const igSequenceNum = (ig) => {
  const n = parseInt(String(ig || '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};

const listingPrice = (item) => Number(item?.usdPrice ?? item?.price ?? 0) || 0;

const ShopModal = ({
  isVisible,
  onClose,
  broadcasterId,
  onBuyNow,
  onAddToCart,
  sessionListingIndexMap = {},
}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'sold'
  const [allListings, setAllListings] = useState([]);
  const [soldListings, setSoldListings] = useState([]);
  const [localIgIndexMap, setLocalIgIndexMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('sequence');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const pressInTimeout = useRef(null);
  const isLongPress = useRef(false);
  const ignoreNextPress = useRef(false);

  useEffect(() => {
    if (!isVisible || !broadcasterId) return;

    let active = true;
    let pollTimer = null;

    const loadListings = async () => {
      const res = await getLiveListingsBySessionApi(null, 'Live', broadcasterId);
      if (!active) return;
      const listings = (res.data || []).map((item) => ({ id: item.id, ...item }));

      const sortedForIg = [...listings].sort(
        (a, b) => createdAtMs(a) - createdAtMs(b),
      );
      const igMap = {};
      sortedForIg.forEach((row, i) => {
        igMap[row.id] = `IG${i + 1}`;
      });
      setLocalIgIndexMap(igMap);

      // Separate into all and sold
      const unSold = listings.filter(item => item.availableQty !== 0);
      const soldItems = listings.filter(item => item.availableQty === 0);

      // Asynchronously fetch buyer info for sold items
      const soldWithBuyerInfo = await Promise.all(
        soldItems.map(async (item) => {
          try {
            const orderRes = await liveOrderLookupApi({ listingId: item.id, status: 'Ready to Fly' });
            if (orderRes.success && orderRes.order && orderRes.buyerUsername) {
              return { ...item, buyerUsername: orderRes.buyerUsername };
            }
          } catch (error) {
            console.error("Error fetching buyer info for sold item:", error);
          }
          // Return item without buyer info if anything fails
          return item;
        })
      );

      setAllListings(unSold);
      setSoldListings(soldWithBuyerInfo);
    };

    loadListings();
    pollTimer = setInterval(loadListings, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isVisible, broadcasterId]);

  const igForListing = (item) =>
    sessionListingIndexMap[item.id] || localIgIndexMap[item.id];

  const sortListings = (list) => {
    const rows = [...list];
    rows.sort((a, b) => {
      if (sortBy === 'genus') {
        const g = String(a.genus || '').localeCompare(String(b.genus || ''), undefined, {
          sensitivity: 'base',
        });
        if (g !== 0) return g;
        return String(a.species || '').localeCompare(String(b.species || ''), undefined, {
          sensitivity: 'base',
        });
      }
      if (sortBy === 'priceHigh') return listingPrice(b) - listingPrice(a);
      if (sortBy === 'priceLow') return listingPrice(a) - listingPrice(b);
      return igSequenceNum(igForListing(a)) - igSequenceNum(igForListing(b));
    });
    return rows;
  };

  const matchesSearch = (item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.genus || '').toLowerCase().includes(q) ||
      String(item.species || '').toLowerCase().includes(q)
    );
  };

  const filteredAllListings = useMemo(
    () => sortListings(allListings.filter(matchesSearch)),
    [allListings, searchQuery, sortBy, sessionListingIndexMap, localIgIndexMap],
  );

  const filteredSoldListings = useMemo(
    () => sortListings(soldListings.filter(matchesSearch)),
    [soldListings, searchQuery, sortBy, sessionListingIndexMap, localIgIndexMap],
  );

  const handlePress = (item) => {
    if (ignoreNextPress.current) {
      ignoreNextPress.current = false;
      return;
    }
    setSelectedImage(item.imagePrimary);
  };

  const renderListingItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <TouchableOpacity
          onPress={() => handlePress(item)}
          activeOpacity={0.8}>
          <AppImage source={{ uri: item.imagePrimary }} style={styles.plantImage} />
        </TouchableOpacity>
        {igForListing(item) ? (
          <View style={styles.modalIndexBadge} pointerEvents="none">
            <Text style={styles.modalIndexBadgeText}>{igForListing(item)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.overlayDetailsContainer}>
        <Text style={styles.plantGenus} numberOfLines={1}>
          {item.genus}
        </Text>
        <Text style={styles.plantSpecies} numberOfLines={2}>
          {item.species}
        </Text>
        <Text style={styles.priceLabel}>${item.usdPrice}</Text>
        <Text style={styles.quantityText}>Qty: {item.availableQty}</Text>
        <TouchableOpacity style={styles.buyButton} onPress={() => onBuyNow(item)}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
        <LiveStreamAddToCartButton
          style={styles.addToCartButtonSlot}
          onPress={() => onAddToCart && onAddToCart(item)}
        />
      </View>
    </View>
  );

  const renderSoldItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <TouchableOpacity
          onPress={() => handlePress(item)}
          activeOpacity={0.8}>
          <AppImage source={{ uri: item.imagePrimary }} style={styles.plantImage} />
        </TouchableOpacity>
        {igForListing(item) ? (
          <View style={styles.modalIndexBadge} pointerEvents="none">
            <Text style={styles.modalIndexBadgeText}>{igForListing(item)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.overlayDetailsContainer}>
        <Text style={styles.plantGenus} numberOfLines={1}>
          {item.genus}
        </Text>
        <Text style={styles.plantSpecies} numberOfLines={2}>
          {item.species}
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

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search by genus or species"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#BDBDBD"
            />
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOpen(!sortOpen)}>
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          </View>
          {sortOpen ? (
            <View style={styles.sortMenu}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy(opt.key);
                    setSortOpen(false);
                  }}>
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === opt.key && styles.sortOptionTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

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
              numColumns={2}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <FlatList
              data={filteredSoldListings}
              renderItem={renderSoldItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
      
      {/* Full-screen image modal - Moved outside FlatList */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenImageCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <CloseIcon width={24} height={24} color="#fff" />
          </TouchableOpacity>
          <ImageZoom
            cropWidth={Dimensions.get('window').width}
            cropHeight={Dimensions.get('window').height}
            imageWidth={Dimensions.get('window').width}
            imageHeight={Dimensions.get('window').height}
            minScale={0.5}
            maxScale={3}
            enableSwipeDown={true}
            onSwipeDown={() => setSelectedImage(null)}
            onClick={() => setSelectedImage(null)}>
            {selectedImage && (
              <AppImage
                source={{ uri: selectedImage }}
                style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
                resizeMode="contain"
              />
            )}
          </ImageZoom>
        </View>
      </Modal>

     
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter',
    color: '#000',
  },
  sortButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonText: {
    color: '#539461',
    fontSize: 14,
    fontWeight: '700',
  },
  sortMenu: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
  },
  sortOptionTextActive: {
    color: '#539461',
    fontWeight: '700',
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
    margin: 6,
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    overflow: 'hidden',
    maxWidth: '48%',
    minHeight: 300,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
  },
  plantImage: {
    width: '100%',
    height: 300,
  },
  modalIndexBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modalIndexBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
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
  overlayDetailsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  plantGenus: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  plantSpecies: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    color: '#FFF',
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  priceLabel: {
    marginTop: 2,
    color: '#F5F5F7',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  quantityText: {
    fontSize: 10,
    color: '#F0F0F0',
    marginTop: 2,
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  buyButton: {
    backgroundColor: '#22B553',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartButtonSlot: {
    marginTop: 6,
  },
  soldToText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});

export default ShopModal;