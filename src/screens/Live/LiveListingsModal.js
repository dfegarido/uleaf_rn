import AppImage from '../../components/AppImage/AppImage';

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CloseIcon from '../../assets/live-icon/close-x.svg';
import { useAuth } from '../../auth/AuthProvider';
import { getLiveListingsBySessionApi, setLiveListingActiveApi } from '../../components/Api/agoraLiveApi';
import { attachOrphanLiveListingsToSession, getSellerUid } from '../../utils/attachLiveListingsToSession';

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
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const igSequenceNum = (ig) => {
  const n = parseInt(String(ig || '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};

const listingPrice = (item) => Number(item?.usdPrice ?? item?.price ?? 0) || 0;

const LiveListingsModal = ({ isVisible, onClose, sessionId, onActiveListingSet, onAddListing }) => {
  const { userInfo } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('sequence');
  const [sortOpen, setSortOpen] = useState(false);

  const fetchListings = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      try {
        await attachOrphanLiveListingsToSession(getSellerUid(userInfo), sessionId);
      } catch (attachErr) {
        console.warn('Attach orphan live listings:', attachErr?.message);
      }
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
      setSortBy('sequence');
      setSortOpen(false);
      setSearchQuery('');
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

  const igIndexMap = useMemo(() => {
    const sortedForIg = [...listings].sort(
      (a, b) => createdAtMs(a) - createdAtMs(b),
    );
    const map = {};
    sortedForIg.forEach((row, i) => {
      const key = row.id || row.plantCode;
      if (key) map[key] = `IG${i + 1}`;
    });
    return map;
  }, [listings]);

  const displayedListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = listings.filter(item => {
      if (!q) return true;
      return (
        String(item.genus || '').toLowerCase().includes(q) ||
        String(item.species || '').toLowerCase().includes(q)
      );
    });
    const rows = [...filtered];
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
      const igA = igIndexMap[a.id] || igIndexMap[a.plantCode];
      const igB = igIndexMap[b.id] || igIndexMap[b.plantCode];
      return igSequenceNum(igA) - igSequenceNum(igB);
    });
    return rows;
  }, [listings, searchQuery, sortBy, igIndexMap]);

  const renderItem = ({ item }) => {
    const isSelected = selectedListing?.plantCode === item.plantCode;
    const isActive = item.isActiveLiveListing;
    const indexCode = igIndexMap[item.id] || igIndexMap[item.plantCode] || '';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.selectedCard,
          isActive && styles.activeCard,
        ]}
        onPress={() => setSelectedListing(item)}>
        <AppImage source={{ uri: item.imagePrimary }} style={styles.cardImage} />
        {indexCode ? (
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{indexCode}</Text>
          </View>
        ) : null}
        <View style={styles.cardInfo}>
          <Text style={styles.cardGenus} numberOfLines={1}>
            {item.genus}
          </Text>
          <Text style={styles.cardSpecies} numberOfLines={2}>
            {item.species}
          </Text>
          <Text style={styles.cardPrice}>${item.variegation} · {item.potSize}</Text>
        </View>
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

          {loading && !listings?.length ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#539461" />
            </View>
          ) : (
            <FlatList
              data={displayedListings}
              renderItem={renderItem}
              keyExtractor={(item) => item.plantCode}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyText}>No listings found for this session.</Text>}
            />
          )}

          <View style={styles.footer}>
            {typeof onAddListing === 'function' ? (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]}
                onPress={onAddListing}
                disabled={loading}>
                <Text style={styles.secondaryButtonText}>Add listing</Text>
              </TouchableOpacity>
            ) : null}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginHorizontal: 16,
    marginTop: 8,
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
  listContainer: { padding: 8 },
  card: { flex: 1, margin: 8, borderWidth: 2, borderColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  selectedCard: { borderColor: '#539461' },
  activeCard: { borderColor: '#E7522F' },
  cardImage: { width: '100%', height: 120 },
  cardInfo: { padding: 8, color: '#333' },
  cardTitle: { fontWeight: '600', fontSize: 14, color: '#333' },
  cardGenus: {
    fontWeight: '800',
    fontSize: 13,
    color: '#333',
    textTransform: 'uppercase',
  },
  cardSpecies: {
    fontWeight: '600',
    fontSize: 12,
    color: '#333',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  cardPrice: { color: '#555', fontSize: 14, marginTop: 4 },
  indexBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  indexText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  activeBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#E7522F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0', gap: 10 },
  button: { backgroundColor: '#539461', padding: 16, borderRadius: 12, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#539461' },
  secondaryButtonText: { color: '#539461', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#A9A9A9' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});

export default LiveListingsModal;