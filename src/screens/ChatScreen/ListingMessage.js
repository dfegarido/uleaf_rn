import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import { postListingDeleteApi } from '../../components/Api/postListingDeleteApi';
import EditIcon from '../../assets/icons/greydark/note-edit.svg';
import TrashIcon from '../../assets/icons/greydark/trash-regular.svg';

const ListingMessage = ({ isSeller=false, isBuyer, listingId, navigation }) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: listing.imagePrimary }} style={styles.image} />
        {isSoldOut && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>SOLD</Text>
          </View>
        )}
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
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
    fontSize: 14,
    fontWeight: '600',
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
});

export default ListingMessage;
