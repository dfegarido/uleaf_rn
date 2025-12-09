import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { db } from '../../../firebase';
import ImageZoom from 'react-native-image-pan-zoom';
import { postListingDeleteApi } from '../../components/Api/postListingDeleteApi';
import EditIcon from '../../assets/icons/greydark/note-edit.svg';
import TrashIcon from '../../assets/icons/greydark/trash-regular.svg';
import CloseIcon from '../../assets/live-icon/close-x.svg'; // Assuming this icon is available

const ListingMessage = ({ isSeller=false, isBuyer, listingId, navigation }) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const pressInTimeout = useRef(null);
  const isLongPress = useRef(false);

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
        } else {
          console.log('No such listing document!');
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
    navigation.navigate('ScreenEditListing', { plantCode: listing.plantCode });
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

  const handlePressIn = () => {
    // When the user presses down, start a timer.
    pressInTimeout.current = setTimeout(() => {
      // If the timer completes (user is holding), show the modal and flag it as a long press.
      setImageModalVisible(true);
      isLongPress.current = true;
    }, 200); // 200ms delay to distinguish from a tap.
  };

  const handlePressOut = () => {
    // When the user releases their finger...
    clearTimeout(pressInTimeout.current); // Always clear the timer.
    if (isLongPress.current) {
      // If it was a long press (peek), close the modal.
      setImageModalVisible(false);
      isLongPress.current = false; // Reset the flag.
    }
  };

  const handlePress = () => {
    // This only fires on a short tap because the long press is handled above.
    // Open the modal and let it stay open.
    setImageModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator color="#539461" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Listing not available.</Text>
      </View>
    );
  }

  const isSoldOut = listing.availableQty === 0;
  // const isSoldOut = true;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            activeOpacity={0.8}>
            <Image source={{ uri: listing.imagePrimary }} style={styles.image} />
            {isSoldOut && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {listing.genus} {listing.species}
            </Text>
            {isSeller && (
              <View style={styles.sellerActions}>
                <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
                  <EditIcon width={16} height={16} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                  <TrashIcon width={16} height={16} color="#E7522F" />
                </TouchableOpacity>
              </View>
            )}
          </View>
           <Text style={styles.title}>
              {listing.variegation}
            </Text>
          <Text style={styles.price}>${listing.usdPrice}</Text>        
          {(!isSoldOut && isBuyer) && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('ScreenPlantDetail', { plantCode: listing.plantCode })}
            >
              <Text style={styles.primaryButtonText}>Buy Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Full-screen image modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
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
            enableSwipeDown={true} // Allow swiping down to close
            onSwipeDown={() => setImageModalVisible(false)}
            onClick={() => setImageModalVisible(false)}>
            <Image
              source={{ uri: listing.imagePrimary }}
              style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
              resizeMode="contain"
            />
          </ImageZoom>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    overflow: 'hidden',
    width: 200,
    marginVertical: 4,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
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
  detailsContainer: {
    padding: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '400',
    color: '#000',
    flex: 1, // Allow title to take up available space
    marginRight: 8,
  },
  sellerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#539461',
    marginBottom: 12,
  },
  errorText: {
    padding: 12,
    color: 'red',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenImageCloseButton: {
    position: 'absolute',
    top: 50, // Using a value that works well with safe areas
    right: 20,
    zIndex: 10, // Increased zIndex to ensure it's on top
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});

export default ListingMessage;
