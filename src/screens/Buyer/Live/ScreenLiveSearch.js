import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../../../firebase';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import XIcon from '../../../assets/icons/greylight/x-regular';
import Avatar from '../../../components/Avatar/Avatar';
import { resolveSellerDisplayName } from '../../../utils/resolveSellerAlias';

const RECENT_SEARCHES_KEY = 'recent_live_searches';
const MAX_RECENT = 10;

const getScreenDimensions = () => {
  const { width: screenWidth } = Dimensions.get('window');
  const HORIZONTAL_PADDING = 24;
  const GAP = 12;
  const availableWidth = screenWidth - HORIZONTAL_PADDING;
  const cardWidth = (availableWidth - GAP) / 2;
  return { screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH: cardWidth };
};

const formatViewers = (count) => {
  if (!count) return '0';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const SearchResultCard = ({ stream, cardWidth, index, sellerMap, onPress }) => {
  const isLive = stream.status === 'live';
  const isWaiting = stream.status === 'waiting';
  const isUpcoming = stream.status === 'draft';
  const thumbnailHeight = cardWidth * 1.25;
  const isLeftColumn = index % 2 === 0;
  const cardStyle = {
    width: cardWidth,
    marginRight: isLeftColumn ? 12 : 0,
    marginBottom: 20,
  };
  const seller = sellerMap[stream.createdBy] || {};
  const sellerName = resolveSellerDisplayName(seller);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim, isLive]);

  return (
    <View style={cardStyle}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={styles.thumbnailContainer}>
          <ImageBackground
            source={{ uri: stream.coverPhotoUrl || undefined }}
            style={[styles.thumbnail, { width: cardWidth, height: thumbnailHeight }]}
            imageStyle={styles.thumbnailImage}
            resizeMode="cover">
            <View style={styles.topOverlay}>
              <View style={styles.badgeRow}>
                {isLive && (
                  <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
                    <LiveIcon width={12} height={12} color="#FFFFFF" />
                    <Text style={styles.liveBadgeText}>Live</Text>
                  </Animated.View>
                )}
                {isWaiting && (
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingBadgeText}>Waiting</Text>
                  </View>
                )}
                {isUpcoming && (
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>Upcoming</Text>
                  </View>
                )}
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.countBadge}>
                  <SocialIcon width={12} height={12} />
                  <Text style={styles.countBadgeText}>{formatViewers(stream.totalViewers || 0)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.bottomOverlay}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {stream.title || 'Untitled Stream'}
              </Text>
            </View>
          </ImageBackground>
        </View>
        <View style={styles.sellerRow}>
          <Avatar size={28} imageUri={seller.profileImage || seller.profilePhotoUrl} rounded />
          <View style={styles.sellerTextColumn}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {sellerName}
            </Text>
            <Text style={styles.categoryText}>Plants</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const ScreenLiveSearch = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [streams, setStreams] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const inputRef = useRef(null);
  const dimensions = getScreenDimensions();

  // Load recent searches
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentSearches(parsed);
        }
      } catch (e) {
        console.warn('Failed to load recent searches:', e);
      }
    };
    loadRecent();
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(focusTimer);
  }, []);

  // Fetch all streams
  useEffect(() => {
    const liveCollectionRef = collection(db, 'live');
    const q = query(
      liveCollectionRef,
      where('status', 'in', ['live', 'waiting', 'draft']),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedStreams = [];
      querySnapshot.forEach((document) => {
        const data = document.data();
        fetchedStreams.push({
          id: document.id,
          title: data.title || 'Untitled Stream',
          coverPhotoUrl: data.coverPhotoUrl,
          sessionId: data.sessionId || '',
          status: data.status,
          totalViewers: data.totalViewers || 0,
          createdBy: data.createdBy || '',
          liveType: data.liveType || 'live',
          scheduledAt: data.scheduledAt || null,
          createdAt: data.createdAt || null,
        });
      });
      setStreams(fetchedStreams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch seller info for unique createdBy UIDs
  useEffect(() => {
    const fetchSellers = async () => {
      const uids = [...new Set(streams.map((s) => s.createdBy).filter(Boolean))];
      if (uids.length === 0) return;

      const newMap = { ...sellerMap };
      const missingUids = uids.filter((uid) => !newMap[uid]);
      if (missingUids.length === 0) return;

      const chunks = [];
      for (let i = 0; i < missingUids.length; i += 10) {
        chunks.push(missingUids.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (uid) => {
            try {
              const supplierDocRef = doc(db, 'supplier', uid);
              const docSnap = await getDoc(supplierDocRef);
              if (docSnap.exists()) {
                const data = docSnap.data();
                newMap[uid] = {
                  alias: data.alias || '',
                  gardenOrCompanyName: data.gardenOrCompanyName || '',
                  profileImage: data.profilePhotoUrl || data.profileImage || '',
                  profilePhotoUrl: data.profilePhotoUrl || data.profileImage || '',
                };
              }
            } catch {
              // ignore individual fetch errors
            }
          }),
        );
      }

      setSellerMap(newMap);
    };

    fetchSellers();
  }, [streams]);

  const saveRecentSearch = useCallback(async (query) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent search:', e);
    }
  }, [recentSearches]);

  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  }, []);

  const performSearch = useCallback((query) => {
    if (!query || query.trim().length < 1) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const trimmed = query.trim().toLowerCase();

    const filtered = streams.filter((stream) => {
      const titleMatch = stream.title && stream.title.toLowerCase().includes(trimmed);
      const seller = sellerMap[stream.createdBy] || {};
      const sellerName = resolveSellerDisplayName(seller).toLowerCase();
      const sellerMatch = sellerName.includes(trimmed);
      return titleMatch || sellerMatch;
    });

    setResults(filtered);
  }, [streams, sellerMap]);

  const handleTextChange = useCallback((text) => {
    setSearchText(text);
    if (text.trim().length >= 1) {
      performSearch(text);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [performSearch]);

  const handleSubmit = useCallback(() => {
    if (searchText.trim().length >= 1) {
      saveRecentSearch(searchText);
      performSearch(searchText);
    }
    Keyboard.dismiss();
  }, [searchText, saveRecentSearch, performSearch]);

  const handleRecentPress = useCallback((query) => {
    setSearchText(query);
    saveRecentSearch(query);
    performSearch(query);
  }, [saveRecentSearch, performSearch]);

  const handleClear = useCallback(() => {
    setSearchText('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }, []);

  const handleCardPress = useCallback((stream) => {
    if (stream.status === 'waiting') {
      Alert.alert('Waiting for the Broadcaster...');
      return;
    }
    if (stream.status === 'draft') {
      Alert.alert('Upcoming Live', 'This live is scheduled. Come back then!');
      return;
    }
    navigation.navigate(
      stream.liveType === 'purge' ? 'LivePurgeScreen' : 'BuyerLiveStreamScreen',
      {
        sessionId: stream.sessionId,
        broadcasterId: stream.createdBy,
      },
    );
  }, [navigation]);

  const showEmptyState = hasSearched && !loading && results.length === 0;
  const showResults = hasSearched && results.length > 0;
  const showRecent = !hasSearched && recentSearches.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}>
          <BackSolidIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.searchField}>
          <SearchIcon width={20} height={20} color="#647276" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search live and upcoming..."
            placeholderTextColor="#9AA4A8"
            value={searchText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={false}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            textContentType="none"
            keyboardType="default"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.6}>
              <XIcon width={20} height={20} color="#9AA4A8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {showRecent && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches} activeOpacity={0.6}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContainer}>
              {recentSearches.map((query, idx) => (
                <TouchableOpacity
                  key={`recent-${idx}`}
                  style={styles.pill}
                  onPress={() => handleRecentPress(query)}
                  activeOpacity={0.7}>
                  <Text style={styles.pillText} numberOfLines={1}>
                    {query}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {loading && !hasSearched && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
            <Text style={styles.loadingText}>Loading streams...</Text>
          </View>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            <View style={[styles.grid, { paddingHorizontal: dimensions.HORIZONTAL_PADDING / 2 }]}>
              {results.map((stream, index) => (
                <SearchResultCard
                  key={stream.id}
                  stream={stream}
                  cardWidth={dimensions.CARD_WIDTH}
                  index={index}
                  sellerMap={sellerMap}
                  onPress={() => handleCardPress(stream)}
                />
              ))}
            </View>
          </View>
        )}

        {showEmptyState && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No streams found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try searching by stream title or seller name.
            </Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#393D40',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#393D40',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#539461',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    backgroundColor: '#F0F5F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#539461',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9AA4A8',
  },
  resultsSection: {
    paddingTop: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9AA4A8',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#393D40',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9AA4A8',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  card: {
    flexDirection: 'column',
  },
  thumbnailContainer: {
    marginBottom: 8,
  },
  thumbnail: {
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  thumbnailImage: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 8,
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#E7522F',
    borderRadius: 8,
  },
  liveBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#D4A017',
    borderRadius: 8,
  },
  waitingBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  timeBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  countBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 18,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sellerTextColumn: {
    flexDirection: 'column',
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 13,
    color: '#202325',
  },
  categoryText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 11,
    color: '#7F8D91',
  },
});

export default ScreenLiveSearch;
