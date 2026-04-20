import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
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
import { db } from '../../../../firebase';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import LiveStreamAddToCartButton from '../../../components/LiveStreamAddToCartButton';

const createdAtMs = (data) => {
  const ts = data?.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds != null) return ts.seconds * 1000;
  return 0;
};

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
  const [selectedImage, setSelectedImage] = useState(null);
  const pressInTimeout = useRef(null);
  const isLongPress = useRef(false);
  const ignoreNextPress = useRef(false);

  useEffect(() => {
    if (!isVisible || !broadcasterId) return;

    const listingsRef = collection(db, 'listing');
    const q = query(
      listingsRef,
      where('sellerCode', '==', broadcasterId),
      where('status', '==', 'Live'),
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const listings = [];
      querySnapshot.forEach((doc) => {
        listings.push({ id: doc.id, ...doc.data() });
      });

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
            // 1. Fetch order info from 'order' collection
            
            const orderQuery = query(
              collection(db, 'order'),
              where('listingId', '==', item.id),
              where('status', '==', 'Ready to Fly')
            );
            const orderSnapshot = await getDocs(orderQuery);

            if (!orderSnapshot.empty) {
              const orderData = orderSnapshot.docs[0].data();
              // 2. Use buyerInfo from the order
              if (orderData.buyerUid) {
                
                const buyerQuery = query(
                  collection(db, 'buyer'),
                  where('uid', '==', orderData.buyerUid)
                );
                const buyerSnapshot = await getDocs(buyerQuery);
                if (!buyerSnapshot.empty) {
                  const buyerData = buyerSnapshot.docs[0].data();
                  return { ...item, buyerUsername: buyerData.username };
                }
              }
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

  const handlePress = (item) => {
    if (ignoreNextPress.current) {
      ignoreNextPress.current = false;
      return;
    }
    setSelectedImage(item.imagePrimary);
  };

  const igForListing = (item) =>
    sessionListingIndexMap[item.id] || localIgIndexMap[item.id];

  const renderListingItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <TouchableOpacity
          onPress={() => handlePress(item)}
          activeOpacity={0.8}>
          <Image source={{ uri: item.imagePrimary }} style={styles.plantImage} />
        </TouchableOpacity>
        {igForListing(item) ? (
          <View style={styles.modalIndexBadge} pointerEvents="none">
            <Text style={styles.modalIndexBadgeText}>{igForListing(item)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.overlayDetailsContainer}>
        <Text style={styles.plantName} numberOfLines={1}>
          {item.genus} {item.species}
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
          <Image source={{ uri: item.imagePrimary }} style={styles.plantImage} />
        </TouchableOpacity>
        {igForListing(item) ? (
          <View style={styles.modalIndexBadge} pointerEvents="none">
            <Text style={styles.modalIndexBadgeText}>{igForListing(item)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.overlayDetailsContainer}>
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
              <Image
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
  plantName: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    color: '#FFF',
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