import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { getBuyerOrdersApi, getBuyerOrdersGroupedApi } from '../../../components/Api/orderManagementApi';
import { JoinerOrderCard, OrderItemCard } from '../../../components/OrderItemCard';
import {
  transformPayToBoardPlant,
  transformPlantsAreHomePlant,
  transformReadyToFlyPlant,
} from '../../../utils/buyerOrderCardTransform';
import { retryAsync } from '../../../utils/utils';

const RECENT_SEARCHES_KEY = 'recent_order_searches';
const MAX_RECENT = 10;

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

      const limit = 50;
      const responses = await Promise.allSettled([
        retryAsync(() => getBuyerOrdersApi({ status: 'Ready to Fly', includeDetails: true, limit }), 2, 1000),
        retryAsync(() => getBuyerOrdersApi({ status: 'delivered', includeDetails: true, limit }), 2, 1000),
        retryAsync(() => getBuyerOrdersGroupedApi({ status: 'pending_payment', includeDetails: true, limit }), 2, 1000),
      ]);

      const combinedOrders = [];

      if (responses[0].status === 'fulfilled' && responses[0].value?.success) {
        const plants = responses[0].value.data?.data?.plants || [];
        plants.forEach((plant) => combinedOrders.push(transformReadyToFlyPlant(plant)));
      }

      if (responses[1].status === 'fulfilled' && responses[1].value?.success) {
        const plants = responses[1].value.data?.data?.plants || [];
        plants.forEach((plant) => combinedOrders.push(transformPlantsAreHomePlant(plant)));
      }

      if (responses[2].status === 'fulfilled' && responses[2].value?.success) {
        const groups = responses[2].value.data?.data?.groups || [];
        groups.forEach((group) => {
          (group.plants || []).forEach((plant) => {
            combinedOrders.push(transformPayToBoardPlant(plant, group));
          });
        });
      }

      const seen = new Set();
      const deduped = combinedOrders.filter((order) => {
        if (seen.has(order.id)) return false;
        seen.add(order.id);
        return true;
      });

      setAllOrders(deduped);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

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
    const filtered = allOrders.filter((order) => {
      const plantNameMatch = order.plantName && order.plantName.toLowerCase().includes(trimmed);
      const txnMatch = order.transactionNumber && order.transactionNumber.toLowerCase().includes(trimmed);
      const invoiceMatch =
        order.fullOrderData?.invoiceNumber &&
        String(order.fullOrderData.invoiceNumber).toLowerCase().includes(trimmed);
      return plantNameMatch || txnMatch || invoiceMatch;
    });
    setResults(filtered);
  }, [allOrders]);

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

  const renderOrderCard = (item, index) => {
    const key = `${item.plantCode}_${item.activeTab}_${index}`;

    if (item.isJoinerOrder) {
      return (
        <JoinerOrderCard
          key={key}
          {...item}
          joinerInfo={item.joinerInfo}
          activeTab={item.activeTab}
        />
      );
    }

    return (
      <OrderItemCard
        key={key}
        {...item}
        activeTab={item.activeTab}
      />
    );
  };

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
          activeOpacity={0.6}
        >
          <BackSolidIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.searchField}>
          <SearchIcon width={20} height={20} color="#647276" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search plant, invoice #, transaction #..."
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

        {loading && !hasSearched && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            {results.map(renderOrderCard)}
          </View>
        )}

        {showEmptyState && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No orders found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try searching by plant name, invoice number, or transaction number.
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
