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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import CloseIcon from '../../assets/live-icon/close-x.svg';
import { useAuth } from '../../auth/AuthProvider';
import { getLiveListingsBySessionApi, setLiveListingActiveApi } from '../../components/Api/agoraLiveApi';
import { deleteListingApi } from '../../components/Api/listingManagementApi';
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

const LiveListingsModal = ({ isVisible, onClose, sessionId, onActiveListingSet, onActiveListingFailed, onAddListing }) => {
  const { userInfo } = useAuth();
  const insets = useSafeAreaInsets();
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

  // Seller and co-host alike (delete-listing allows the owner or an admin).
  const handleDelete = () => {
    if (!selectedListing) {
      Alert.alert('No Selection', 'Select a listing to delete.');
      return;
    }
    const name = `${selectedListing.genus || ''} ${selectedListing.species || ''}`.trim() || selectedListing.plantCode;
    Alert.alert('Delete listing?', `${name} will be removed from this live.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const res = await deleteListingApi({ plantCode: selectedListing.plantCode });
            if (!res.success) throw new Error(res.error);
            setSelectedListing(null);
            await fetchListings();
          } catch (error) {
            Alert.alert('Error', error.message || 'Could not delete the listing.');
            setLoading(false);
          }
        },
      },
    ]);
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
    // Optimistic: show the new active listing and close at once; the parent rolls back and
    // shows an error toast if the server refuses.
    const picked = selectedListing;
    const previous = listings;
    setListings((rows) => rows.map((l) => ({ ...l, isActiveLiveListing: l.plantCode === picked.plantCode })));
    onActiveListingSet(picked);
    onClose();
    try {
      const response = await setLiveListingActiveApi({ sessionId, plantCode: picked.plantCode });
      if (!response?.success) throw new Error(response?.message || 'Failed to set active listing.');
    } catch (error) {
      setListings(previous);
      onActiveListingFailed?.(error.message || 'Failed to set active listing.');
    }
  };

  const igIndexMap = useMemo(() => {
    // The IG number is stored on the listing (liveIgIndex) and assigned once at
    // creation, so it must not be derived from position: a sold/deleted listing
    // would otherwise renumber everything below it. Ordering is by creation
    // date so the sequence still reads naturally top-to-bottom.
    const sortedForIg = [...listings].sort(
      (a, b) => createdAtMs(a) - createdAtMs(b),
    );
    const map = {};
    sortedForIg.forEach((row) => {
      if (row.liveIgIndex == null || String(row.liveIgIndex).trim() === '') return;
      const key = row.id || row.plantCode;
      if (key) map[key] = `IG${row.liveIgIndex}`;
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
        {/* Same card as the buyer's Shop sheet: full photo, dark fade, name left, price right. */}
        <AppImage source={{ uri: item.imagePrimary }} style={styles.cardImage} />
        {indexCode ? (
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{indexCode}</Text>
          </View>
        ) : null}
        <View style={styles.cardOverlay} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="liveCardFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#liveCardFade)" />
          </Svg>
          <View style={styles.cardContent}>
            <View style={styles.nameCol}>
              <Text style={styles.cardGenus} numberOfLines={1}>{item.genus}</Text>
              <Text style={styles.cardSpecies} numberOfLines={2}>{item.species}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.cardPrice}>${item.usdPrice}</Text>
              <Text style={styles.cardQty}>Qty: {item.availableQty}</Text>
            </View>
          </View>
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

          <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
            {typeof onAddListing === 'function' ? (
              <TouchableOpacity
                style={[styles.circleButton, loading && styles.dimmed]}
                onPress={onAddListing}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Add listing">
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Path d="M12 5v14M5 12h14" stroke="#2E6B3E" strokeWidth={2.4} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.circleButton, styles.deleteCircle, (loading || !selectedListing) && styles.dimmed]}
              onPress={handleDelete}
              disabled={loading || !selectedListing}
              accessibilityRole="button"
              accessibilityLabel="Delete listing">
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
                  stroke="#C23B1E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.activeButton, loading && styles.dimmed]}
              onPress={handleSetNewActive}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button">
              {/* Same gradient as the buyer's Buy Now button. */}
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="setActiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#7CC97C" />
                    <Stop offset="1" stopColor="#2E6B3E" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" rx="14" ry="14" fill="url(#setActiveGradient)" />
              </Svg>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set New Active</Text>}
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
  card: {
    flex: 1,
    margin: 6,
    maxWidth: '48%',
    height: 260,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
  },
  selectedCard: { borderColor: '#539461' },
  activeCard: { borderColor: '#E7522F' },
  cardImage: { width: '100%', height: '100%' },
  // No padding on the overlay: Yoga insets absolute children by it, which would cut the fade.
  cardOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 40 },
  nameCol: { flex: 1 },
  priceCol: { alignItems: 'flex-end', flexShrink: 0 },
  cardGenus: { fontSize: 13, fontWeight: '800', fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', color: '#FFF' },
  cardSpecies: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', color: '#FFF', marginTop: 1 },
  cardPrice: { color: '#F5F5F7', fontSize: 18, fontWeight: '800' },
  cardQty: { fontSize: 10, color: '#F0F0F0', marginTop: 1, fontFamily: 'Inter' },
  indexBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  indexText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  activeBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E7522F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  activeText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#2E6B3E',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircle: { borderColor: '#C23B1E' },
  activeButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});

export default LiveListingsModal;