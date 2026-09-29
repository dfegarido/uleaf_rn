import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import XIcon from '../../../assets/icons/greylight/x-regular';
import {PlantItemCard} from '../../../components/PlantItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import { searchPlantsApi } from '../../../components/Api/listingBrowseApi';
import { retryAsync } from '../../../utils/utils';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT = 10;

// Server-side paging: /plant-search accepts limit (1-100) + offset and returns
// pagination.total / pagination.hasMore, so results are fetched as the user
// scrolls instead of being capped at the first page.
const SEARCH_PAGE_SIZE = 20;
const LOAD_MORE_THRESHOLD = 400; // px from the bottom that triggers the next page
const LOAD_MORE_COOLDOWN = 800; // ms between two load-more calls

const SUGGESTED_SEARCHES = [
  'Monstera',
  'Philodendron',
  'Hoya',
  'Alocasia',
  'Anthurium',
  'Begonia',
  'Scindapsus',
  'Syngonium',
];

const transformSearchResult = (p) => ({
  id: p.id,
  plantCode: p.plantCode,
  genus: p.genus || '',
  species: p.species || '',
  variegation: p.variegation || '',
  plantName: p.title || `${p.genus} ${p.species}${p.variegation ? ' ' + p.variegation : ''}`,
  imagePrimary: p.image || null,
  imagePrimaryWebp: p.image || null,
  imageCollection: p.images || [],
  imageCollectionWebp: p.images || [],
  usdPrice: p.price || 0,
  localPrice: p.localPrice || 0,
  finalPrice: p.finalPrice || p.price || 0,
  originalPrice: p.price || 0,
  discountPrice: p.discountPrice || null,
  hasDiscount: p.discountPercentage ? true : false,
  discountAmount: p.discountPercentage ? ((p.price - p.finalPrice) || 0) : 0,
  listingType: p.listingType || 'Single Plant',
  availableQty: p.availableQuantity || 0,
  country: p.country || '',
  shippingIndex: p.shippingIndex || null,
  acclimationIndex: p.acclimationIndex || null,
  sellerName: p.supplierName || '',
  localCurrency: p.currency || 'USD',
  plantFlightDate: p.plantFlightDate || null,
  createdAt: p.createdAt || null,
  updatedAt: p.updatedAt || null,
  description: p.description || '',
  potSize: p.potSizes && p.potSizes.length > 0 ? p.potSizes[0] : null,
});

// Match browse (ScreenGenusPlants isDisplayableBuyerPlant): don't require
// species/variegation — that was dropping valid API hits (e.g. title-only names).
const isDisplayableSearchResult = (plant) => {
  if (!plant || typeof plant.plantCode !== 'string' || plant.plantCode.trim() === '') {
    return false;
  }
  return (
    (typeof plant.genus === 'string' && plant.genus.trim() !== '') ||
    (typeof plant.plantName === 'string' && plant.plantName.trim() !== '')
  );
};

const ScreenSearch = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const offsetRef = useRef(0);
  const lastQueryRef = useRef('');
  const loadMoreLockRef = useRef(0);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to load recent searches:', e);
      }
    };
    loadRecent();

    // Auto-focus after a short delay to ensure transition completes
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);

    return () => clearTimeout(focusTimer);
  }, []);

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

  const resetPagination = useCallback(() => {
    offsetRef.current = 0;
    lastQueryRef.current = '';
    setResults([]);
    setTotalResults(0);
    setHasMore(false);
    setLoadMoreError(false);
  }, []);

  const fetchSearchPage = useCallback(async (query, offset) => {
    // searchPlantsApi returns { success:false } on HTTP errors instead of throwing,
    // so retry inside the callback or flaky 500s never get retried.
    const res = await retryAsync(
      async () => {
        const apiRes = await searchPlantsApi({ query, limit: SEARCH_PAGE_SIZE, offset });
        if (!apiRes?.success) {
          throw new Error(apiRes?.error || 'Search failed');
        }
        return apiRes;
      },
      3,
      600,
    );

    const rawPlants = (res.data?.plants || []).map(transformSearchResult);
    const pagination = res.data?.pagination || {};

    return {
      plants: rawPlants.filter(isDisplayableSearchResult),
      // Server rows returned, before the client-side displayability filter —
      // this is what the next offset must advance by.
      rowCount: rawPlants.length,
      total: typeof pagination.total === 'number' ? pagination.total : offset + rawPlants.length,
      hasMore:
        typeof pagination.hasMore === 'boolean'
          ? pagination.hasMore
          : rawPlants.length >= SEARCH_PAGE_SIZE,
    };
  }, []);

  /**
   * Run a search, or fetch the next page when append is true.
   * Appends never clear the list and share the current request id so a newer
   * search (or a cleared query) invalidates them.
   */
  const performSearch = useCallback(async (query, { append = false } = {}) => {
    const trimmed = typeof query === 'string' ? query.trim() : '';

    if (trimmed.length < 2) {
      resetPagination();
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    const requestId = append ? searchRequestIdRef.current : ++searchRequestIdRef.current;
    const offset = append ? offsetRef.current : 0;

    if (append) {
      setLoadingMore(true);
      setLoadMoreError(false);
    } else {
      setLoading(true);
      setHasSearched(true);
      setSearchError(null);
      setLoadMoreError(false);
    }

    try {
      const page = await fetchSearchPage(trimmed, offset);

      // Ignore stale responses: a newer search (or a load-more) bumped the id.
      if (requestId !== searchRequestIdRef.current) {
        return;
      }

      lastQueryRef.current = trimmed;
      offsetRef.current = offset + page.rowCount;

      setResults(prev => {
        if (!append) {
          return page.plants;
        }
        const existing = new Set(prev.map(p => p.plantCode));
        return [...prev, ...page.plants.filter(p => !existing.has(p.plantCode))];
      });
      setTotalResults(page.total);
      setHasMore(page.hasMore);
      setSearchError(null);
    } catch (error) {
      if (requestId !== searchRequestIdRef.current) {
        return;
      }
      console.error('Search error:', error);
      if (append) {
        setLoadMoreError(true);
      } else {
        setResults([]);
        setTotalResults(0);
        setHasMore(false);
        setSearchError(error?.message || 'Search failed. Please try again.');
      }
    } finally {
      if (requestId === searchRequestIdRef.current) {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    }
  }, [fetchSearchPage, resetPagination]);

  const handleTextChange = useCallback((text) => {
    setSearchText(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(text);
      }, 300);
    } else {
      resetPagination();
      setHasSearched(false);
      setSearchError(null);
    }
  }, [performSearch, resetPagination]);

  const handleSubmit = useCallback(() => {
    if (searchText.trim().length >= 2) {
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

  // Fetch the next page when the list is nearly scrolled to the bottom.
  const handleLoadMore = useCallback(() => {
    const now = Date.now();
    if (!hasMore || loading || loadingMore || loadMoreError) return;
    if (now - loadMoreLockRef.current < LOAD_MORE_COOLDOWN) return;
    loadMoreLockRef.current = now;
    performSearch(lastQueryRef.current, { append: true });
  }, [hasMore, loading, loadingMore, loadMoreError, performSearch]);

  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  const handleRetryLoadMore = useCallback(() => {
    setLoadMoreError(false);
    loadMoreLockRef.current = Date.now();
    performSearch(lastQueryRef.current, { append: true });
  }, [performSearch]);

  const handleSuggestedPress = useCallback((query) => {
    setSearchText(query);
    saveRecentSearch(query);
    performSearch(query);
  }, [saveRecentSearch, performSearch]);

  const handleResultPress = useCallback((plant) => {
    if (plant.plantCode) {
      saveRecentSearch(searchText);
      navigation.navigate('ScreenPlantDetail', { plantCode: plant.plantCode });
    } else {
      Alert.alert('Error', 'Unable to view plant details. Missing plant code.');
    }
  }, [navigation, saveRecentSearch, searchText]);

  const handleClear = useCallback(() => {
    setSearchText('');
    resetPagination();
    setHasSearched(false);
    setSearchError(null);
    inputRef.current?.focus();
  }, [resetPagination]);

  const showEmptyState = hasSearched && !loading && results.length === 0 && !searchError;
  const showErrorState = hasSearched && !loading && !!searchError;
  const showResults = hasSearched && results.length > 0;
  const showRecent = !hasSearched && recentSearches.length > 0;
  const showSuggested = !hasSearched;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <BackSolidIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.searchField}>
          <SearchIcon width={20} height={20} color="#647276" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search plants..."
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
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Recent Searches */}
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
              contentContainerStyle={styles.pillsContainer}
            >
              {recentSearches.map((query, idx) => (
                <TouchableOpacity
                  key={`recent-${idx}`}
                  style={styles.pill}
                  onPress={() => handleRecentPress(query)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pillText} numberOfLines={1}>
                    {query}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Suggested Searches */}
        {showSuggested && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested</Text>
            <View style={styles.suggestedGrid}>
              {SUGGESTED_SEARCHES.map((query, idx) => (
                <TouchableOpacity
                  key={`suggested-${idx}`}
                  style={styles.suggestedPill}
                  onPress={() => handleSuggestedPress(query)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestedPillText} numberOfLines={1}>
                    {query}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Results */}
        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>
              {totalResults > results.length
                ? `${totalResults} results`
                : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </Text>
            <View style={styles.resultsGrid}>
              {results.map((plant, idx) => (
                <View
                  key={plant.plantCode || `result-${idx}`}
                  style={[
                    styles.plantCardWrapper,
                    (idx + 1) % 2 === 0 || idx === results.length - 1
                      ? { marginRight: 0 }
                      : {},
                  ]}
                >
                  <PlantItemCard
                    data={plant}
                    cardStyle={{ height: 220, margin: 8 }}
                    onPress={() => handleResultPress(plant)}
                  />
                </View>
              ))}
            </View>

            {/* Infinite scroll footer: next-page loader / end of list */}
            {loadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#539461" />
                <Text style={styles.loadingMoreText}>Loading more plants...</Text>
              </View>
            )}

            {!hasMore && !loadingMore && !loadMoreError && (
              <View style={styles.loadMoreContainer}>
                <Text style={styles.loadingMoreText}>You've reached the end</Text>
              </View>
            )}

            {!loadingMore && loadMoreError && (
              <View style={styles.loadMoreContainer}>
                <Text style={styles.loadMoreErrorText}>Couldn't load more plants.</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetryLoadMore}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Error State */}
        {showErrorState && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>Search unavailable</Text>
            <Text style={styles.emptyStateSubtitle}>
              Something went wrong. Please try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => performSearch(searchText)}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No plants found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try a different search term or check your spelling.
            </Text>
          </View>
        )}

        {/* More from our Jungle */}
        {!hasSearched && (
          <View style={{ marginTop: 16 }}>
            <BrowseMorePlants
              title="More from our Jungle"
              initialLimit={8}
              loadMoreLimit={8}
              showLoadMore={false}
              autoLoad={true}
            />
          </View>
        )}

        {/* Bottom padding for safe area */}
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
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  suggestedPill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestedPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#647276',
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9AA4A8',
    marginBottom: 10,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantCardWrapper: {
    width: '48%',
    marginBottom: 8,
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
  retryButton: {
    marginTop: 16,
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9AA4A8',
  },
  loadMoreErrorText: {
    fontSize: 14,
    color: '#9AA4A8',
    marginBottom: 4,
  },
});

export default ScreenSearch;
