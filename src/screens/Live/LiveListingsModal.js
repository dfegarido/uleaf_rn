import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CloseIcon from '../../assets/live-icon/close-x.svg';
import { getLiveListingsBySessionApi, setLiveListingActiveApi } from '../../components/Api/agoraLiveApi';

const LiveListingsModal = ({ isVisible, onClose, sessionId, onActiveListingSet }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const fetchListings = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await getLiveListingsBySessionApi(sessionId);
      if (response.success) {
        console.log('Fetched listings:', response);
        
        setListings(response.data);
        const active = response.data.find(l => l.isActiveLiveListing);
        if (active) {
          setSelectedListing(active);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch listings.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchListings();
    }
  }, [isVisible, sessionId]);

  const handleSetNewActive = async () => {
    if (!selectedListing) {
      Alert.alert('No Selection', 'Please select a listing to set as active.');
      return;
    }
    setLoading(true);
    try {
      const response = await setLiveListingActiveApi({
        sessionId,
        plantCode: selectedListing.plantCode,
      });

      if (response.success) {
        Alert.alert('Success', 'Active listing has been updated.');
        onActiveListingSet(selectedListing); // Pass new active listing to parent
        onClose();
      } else {
        throw new Error(response.message || 'Failed to set active listing.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedListing?.plantCode === item.plantCode;
    const isActive = item.isActiveLiveListing;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.selectedCard,
          isActive && styles.activeCard,
        ]}
        onPress={() => setSelectedListing(item)}>
        <Image source={{ uri: item.imagePrimary }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.genus} {item.species}
          </Text>
          <Text style={styles.cardPrice}>${item.variegation} · {item.potSize}</Text>
        </View>
        <View><Text></Text></View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.listingType} | {item.availableQty} pcs
          </Text>
          <Text style={styles.cardPrice}>${item.usdPrice}</Text>
        </View>
        {isActive && <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Live Listings</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {loading && !listings?.length ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#539461" />
            </View>
          ) : (
            <FlatList
              data={listings}
              renderItem={renderItem}
              keyExtractor={(item) => item.plantCode}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyText}>No listings found for this session.</Text>}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleSetNewActive}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Set New Active</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { height: '75%', backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  listContainer: { padding: 8 },
  card: { flex: 1, margin: 8, borderWidth: 2, borderColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  selectedCard: { borderColor: '#539461' },
  activeCard: { borderColor: '#E7522F' },
  cardImage: { width: '100%', height: 120 },
  cardInfo: { padding: 8, color: '#333' },
  cardTitle: { fontWeight: '600', fontSize: 14, color: '#333' },
  cardPrice: { color: '#555', fontSize: 14, marginTop: 4 },
  activeBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#E7522F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  button: { backgroundColor: '#539461', padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { backgroundColor: '#A9A9A9' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});

export default LiveListingsModal;