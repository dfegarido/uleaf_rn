import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';

const ListingMessage = ({ isBuyer, listingId, navigation }) => {
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
        <Text style={styles.title} numberOfLines={2}>
          {listing.genus} {listing.species}
        </Text>
        <Text style={styles.price}>${listing.localPrice?.toFixed(2)}</Text>
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
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
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
