import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { getOrderForReceiving } from '../../../components/Api/sellerOrderApi';
import { retryAsync } from '../../../utils/utils';

const RECENT_SEARCHES_KEY = 'recent_seller_order_searches';
const MAX_RECENT = 10;

const OrderResultCard = ({ item, onPress }) => {
  const plantName = `${item.genus || ''} ${item.species || ''}`.trim() || 'Unknown Plant';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View>
        <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.plantName} numberOfLines={3}>{plantName}</Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Trx #:</Text> {item.transactionNumber}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Code:</Text> {item.plantCode}
        </Text>
        <Text style={styles.cardText}>
          {item.variegation} • {item.size}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Qty:</Text> {item.quantity}
        </Text>
        <Text style={styles.price}>
          {item.localPriceCurrencySymbol}{item.localPrice}
        </Text>
        <View style={styles.chipContainer}>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{item.listingType}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          <Text style={styles.bold}>Order:</Text>{' '}
          {item.createdAt?._seconds
            ? moment(item.createdAt._seconds * 1000).format('MMM DD, YYYY')
            : ''}
        </Text>
        <Text style={styles.dateText}>
          <Text style={styles.bold}>Flight:</Text>{' '}
          {moment(item.flightDate).isValid() ? moment(item.flightDate).format('MMM DD, YYYY') : ''}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Country:</Text> {item.country}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ScreenOrderSearch = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const inputRef = useRef(null);

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
    loadAllOrders();

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(focusTimer);
  }, []);

  const loadAllOrders = async () => {
    try {
      setLoading(true);
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection');
      }

      const response = await retryAsync(
        () => getOrderForReceiving({ orderType: 'allOrders', limit: 500 }),
        2,
        1000,
      );

      if (response?.data) {
        setAllOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = useCallback(
    async (query) => {
      try {
        const trimmed = query.trim();
        if (!trimmed) return;
        const updated = [trimmed, ...recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent search:', e);
      }
    },
    [recentSearches],
  );

  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  }, []);

  const performSearch = useCallback(
    (query) => {
      if (!query || query.trim().length < 1) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setHasSearched(true);
      const trimmed = query.trim().toLowerCase();
      const filtered = allOrders.filter((order) => {
        const plantName = `${order.genus || ''} ${order.species || ''}`.toLowerCase();
        const txnMatch = order.transactionNumber && order.transactionNumber.toLowerCase().includes(trimmed);
        const plantCodeMatch = order.plantCode && order.plantCode.toLowerCase().includes(trimmed);
        return plantName.includes(trimmed) || txnMatch || plantCodeMatch;
      });
      setResults(filtered);
    },
    [allOrders],
  );

  const handleTextChange = useCallback(
    (text) => {
      setSearchText(text);
      if (text.trim().length >= 1) {
        performSearch(text);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    },
    [performSearch],
  );

  const handleSubmit = useCallback(() => {
    if (searchText.trim().length >= 1) {
      saveRecentSearch(searchText);
      performSearch(searchText);
    }
    Keyboard.dismiss();
  }, [searchText, saveRecentSearch, performSearch]);

  const handleRecentPress = useCallback(
    (query) => {
      setSearchText(query);
      saveRecentSearch(query);
      performSearch(query);
    },
    [saveRecentSearch, performSearch],
  );

  const handleClear = useCallback(() => {
    setSearchText('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }, []);

  const showEmptyState = hasSearched && !loading && results.length === 0;
  const showResults = hasSearched && results.length > 0;
  const showRecent = !hasSearched && recentSearches.length > 0;

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
            placeholder="Search plant name, trx #, code..."
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

        {/* Loading */}
        {loading && !hasSearched && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        )}

        {/* Results */}
        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            {results.map((item) => (
              <OrderResultCard
                key={item.id || item.plantCode}
                item={item}
                onPress={() => {
                  // Navigate to order detail if available, otherwise no-op
                  // Seller order detail screen can be wired here later
                }}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No orders found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try searching by plant name, transaction number, or plant code.
            </Text>
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  plantImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: '#556065',
    marginBottom: 2,
  },
  bold: {
    fontWeight: '600',
    color: '#393D40',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#539461',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  typeChip: {
    backgroundColor: '#F0F5F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#539461',
  },
  dateText: {
    fontSize: 12,
    color: '#7F8D91',
    marginBottom: 2,
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
});

export default ScreenOrderSearch;
