import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { db } from '../../../firebase';
import ImageZoom from 'react-native-image-pan-zoom';
import { postListingDeleteApi } from '../../components/Api/postListingDeleteApi';
import { addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  getDoc,
  or,
  deleteDoc
} from 'firebase/firestore';
import CloseIcon from '../../assets/icons/white/x-regular.svg';

const formatPrice = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const ListingMessage = ({ messageId, currentUserUid, isSeller=false, isBuyer, isMe=false, senderName, listingId, navigation, onMessageLongPress, onMissingListing }) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  

  const [soldTo, setSoldTo] = useState(null);

  useEffect(() => {
      if (!listingId) return;
    
      const orderCollectionRef = collection(db, 'order');
        
      const q = query(orderCollectionRef, where('listingId', '==' , listingId), where('status', '==' , 'Ready to Fly'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() });
        });

          const orderData = fetchedOrders[0] || {};
          
          if (orderData?.isJoinerOrder) {
             setSoldTo(orderData?.joinerInfo?.joinerUsername || 'Unknown Buyer');
          } else {
            const buyerUid = orderData?.buyerUid;
            if (buyerUid) {
              const buyerCollectionRef = collection(db, 'buyer');
              const buyerDocRef = doc(buyerCollectionRef, buyerUid);
              getDoc(buyerDocRef).then((buyerDoc) => {
                if (buyerDoc.exists()) {
                  const buyerData = buyerDoc.data();
                  setSoldTo(buyerData.username || 'Unknown Buyer');
                } else {
                  setSoldTo('Unknown Buyer');
                }
              }).catch((error) => {
                console.error('Error fetching buyer data:', error);
                setSoldTo('Unknown Buyer');
              });
            }
          }
          
        });
        
      return () => unsubscribe();
  }, [listingId]);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) {
        setLoading(false);
        return;
      }
      try {
        const listingRef = doc(db, 'listing', listingId);
        const docSnap = await getDoc(listingRef);

        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  const handleEdit = () => {
    if (!listing) return;
    // Navigate to the edit screen, passing the listing's plantCode
    navigation.navigate('ScreenSingleSell', { plantCode: listing.plantCode, isGroupChatListing: true });
  };

  const handleDelete = () => {
    if (!listing) return;
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await postListingDeleteApi(listing.plantCode);
              if (messageId) {
                await deleteDoc(doc(db, 'messages', messageId));
              }
              setListing(null);
              setLoading(false);
              Alert.alert("Success", "Listing has been deleted.");
            } catch (error) {
              setLoading(false)
              Alert.alert("Error", "Failed to delete listing. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handlePress = () => {
    setImageModalVisible(true);
  };

  const handleLongPress = () => {
    if (!listing || !onMessageLongPress) return;
    onMessageLongPress({
      id: messageId,
      isListing: true,
      listingId,
      plantCode: listing.plantCode,
      // Only set senderId to current user if this is their own listing
      // so Edit/Delete appear only for the owner
      senderId: isMe ? currentUserUid : null,
      senderName: isMe ? null : (senderName || null),
    });
  };

  let isSoldOut = listing?.availableQty <= 0;

  useEffect(() => {
    if (!loading && !listing && typeof onMissingListing === 'function') {
      onMissingListing();
    }
  }, [loading, listing, onMissingListing]);

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator color="#539461" />
      </View>
    );
  }

  if (!listing) {
    // Hide deleted/missing listing messages entirely for all users.
    return null;
  }

  return (
    <>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={300}
          activeOpacity={0.8}
          style={styles.imageContainer}>
          <Image source={{ uri: listing.imagePrimary }} style={styles.image} resizeMode="cover" />
          {isSoldOut && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>SOLD</Text>
              <Text style={styles.soldToText}>{soldTo ? `@${soldTo} claimed in a heartbeat! It is boarding your next Plant Flight.` : ''}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.detailsOverlay} pointerEvents="box-none">
          <View style={styles.gradientFade}>
            <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0)' }]} />
            <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.12)' }]} />
            <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.22)' }]} />
            <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          </View>
          <TouchableWithoutFeedback>
            <View style={styles.detailsContent}>
              <Text style={styles.title}>
                {listing.genus} {listing.species}
              </Text>
              {listing.variegation ? (
                <Text style={styles.variegation}>{listing.variegation}</Text>
              ) : null}
              <Text style={styles.price}>{formatPrice(listing.usdPrice)}</Text>
              {(!isSoldOut && isBuyer) && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('ScreenPlantDetail', { plantCode: listing.plantCode })}
                >
                  <Text style={styles.primaryButtonText}>Buy Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>

      {/* Full-screen image modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenImageCloseButton}
            onPress={() => setImageModalVisible(false)}
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
            onSwipeDown={() => setImageModalVisible(false)}
            onClick={() => setImageModalVisible(false)}>
            <Image
              source={{ uri: listing.imagePrimary }}
              style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
              resizeMode="contain"
            />
          </ImageZoom>
          <View style={styles.fullScreenDetailsOverlay} pointerEvents="box-none">
            <View style={styles.fullScreenGradientFade}>
              <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0)' }]} />
              <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
              <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.12)' }]} />
              <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.22)' }]} />
              <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
              <View style={[styles.gradientStrip, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
            </View>
            <View style={styles.fullScreenDetailsContent}>
              <Text style={styles.fullScreenPlantName}>
                {listing.genus} {listing.species}
              </Text>
              {listing.variegation ? (
                <Text style={styles.fullScreenVariegation}>
                  {listing.variegation}
                </Text>
              ) : null}
              <Text style={styles.fullScreenPrice}>{formatPrice(listing.usdPrice)}</Text>
              {(!isSoldOut && isBuyer) && (
                <TouchableOpacity
                  style={styles.fullScreenBuyButton}
                  onPress={() => {
                    setImageModalVisible(false);
                    navigation.navigate('ScreenPlantDetail', { plantCode: listing.plantCode });
                  }}
                >
                  <Text style={styles.fullScreenBuyButtonText}>Buy Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#539461',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 220,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    height: 150,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  soldBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  soldToText: {
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  detailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradientFade: {
    height: 40,
  },
  gradientStrip: {
    flex: 1,
  },
  detailsContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  variegation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7FC98A',
    marginTop: 2,
  },
  errorText: {
    padding: 12,
    color: 'red',
    backgroundColor: '#fff',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
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
  fullScreenDetailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fullScreenGradientFade: {
    height: 50,
  },
  fullScreenDetailsContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  fullScreenPlantName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  fullScreenVariegation: {
    color: '#ddd',
    fontSize: 18,
    marginTop: 2,
  },
  fullScreenPrice: {
    color: '#7FC98A',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 6,
  },
  fullScreenBuyButton: {
    backgroundColor: '#539461',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  fullScreenBuyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ListingMessage;
