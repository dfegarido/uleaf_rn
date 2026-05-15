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
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import PlaneGrayIcon from '../../../assets/buyer-icons/plane-gray.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import XIcon from '../../../assets/icons/greylight/x-regular';
import { getBuyerOrdersApi, getBuyerOrdersGroupedApi } from '../../../components/Api/orderManagementApi';
import { OrderItemCard } from '../../../components/OrderItemCard';
import { retryAsync } from '../../../utils/utils';

const RECENT_SEARCHES_KEY = 'recent_order_searches';
const MAX_RECENT = 10;

const FLAG_MAP = {
  TH: ThailandFlag,
  PH: PhilippinesFlag,
  ID: IndonesiaFlag,
};

const getCountryCode = (record) => {
  if (!record) return 'ID';
  if (record.plantSourceCountry) return record.plantSourceCountry;
  if (record.order && record.order.plantSourceCountry) return record.order.plantSourceCountry;
  if (record.products && record.products.length > 0) {
    return record.products[0].plantSourceCountry || record.products[0].supplierCountry || 'ID';
  }
  if (record.plantDetails && record.plantDetails.plantSourceCountry) return record.plantDetails.plantSourceCountry;
  return 'ID';
};

const getCountryFlag = (record) => {
  const code = getCountryCode(record);
  return FLAG_MAP[code] || IndonesiaFlag;
};

// Transform individual plant format (from getBuyerOrdersApi)
const transformIndividualPlant = (plant) => {
  const plantDetails = plant.plantDetails || {};
  const orderMeta = plant.order || {};
  const fullOrderLike = {
    ...orderMeta,
    products: [plant],
    plantDetails,
  };
  const countryCode = getCountryCode(plant);
  const priceValue = (orderMeta.pricing?.finalTotal ?? plant.productTotal ?? plant.unitPrice) || 0;

  return {
    id: `${orderMeta.id || orderMeta.transactionNumber || ''}_${plant.plantCode || ''}`,
    status: orderMeta.status || 'Ready to Fly',
    airCargoDate: plant.flightDateFormatted || orderMeta.flightDateFormatted || plant.flightDate || 'TBD',
    countryCode,
    flag: getCountryFlag(plant),
    planeIcon: PlaneGrayIcon,
    image: plantDetails?.imageCollectionWebp?.[0]
      ? { uri: plantDetails.imageCollectionWebp[0] }
      : plantDetails?.image
        ? { uri: plantDetails.image }
        : plantDetails?.imageCollection?.[0]
          ? { uri: plantDetails.imageCollection[0] }
          : require('../../../assets/images/plant1.png'),
    plantName: plantDetails?.title || plant.plantName || 'Unknown Plant',
    variety: plant.variegation || plantDetails?.variegation || 'Standard',
    size: plant.potSize || plantDetails?.potSize || '',
    price: `$${priceValue.toFixed(2)}`,
    quantity: plant.quantity || 1,
    plantCode: plant.plantCode || '',
    orderId: orderMeta.id,
    transactionNumber: orderMeta.transactionNumber || orderMeta.id || '',
    fullOrderData: fullOrderLike,
    isJoinerOrder: plant.isJoinerOrder || false,
    joinerInfo: plant.joinerInfo || null,
    buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
    _rawPlantRecord: plant,
  };
};

// Transform grouped plant format (from getBuyerOrdersGroupedApi)
const transformGroupedPlant = (group, plant) => {
  const plantDetails = plant.plantDetails || {};
  const fullOrderLike = {
    ...group,
    products: [plant],
    plantDetails,
  };
  const countryCode = getCountryCode(plant);
  const priceValue = (group.pricing?.finalTotal ?? plant.productTotal ?? plant.unitPrice) || 0;

  return {
    id: `${group.id || group.transactionNumber || ''}_${plant.plantCode || ''}`,
    status: group.status || 'pending_payment',
    airCargoDate: plant.flightDateFormatted || group.flightDateFormatted || plant.flightDate || 'TBD',
    countryCode,
    flag: getCountryFlag(plant),
    planeIcon: PlaneGrayIcon,
    image: plantDetails?.imageCollectionWebp?.[0]
      ? { uri: plantDetails.imageCollectionWebp[0] }
      : plantDetails?.image
        ? { uri: plantDetails.image }
        : plantDetails?.imageCollection?.[0]
          ? { uri: plantDetails.imageCollection[0] }
          : require('../../../assets/images/plant1.png'),
    plantName: plantDetails?.title || plant.plantName || 'Unknown Plant',
    variety: plant.variegation || plantDetails?.variegation || 'Standard',
    size: plant.potSize || plantDetails?.potSize || '',
    price: `$${priceValue.toFixed(2)}`,
    quantity: plant.quantity || 1,
    plantCode: plant.plantCode || '',
    orderId: group.id,
    transactionNumber: group.transactionNumber || group.id || '',
    fullOrderData: fullOrderLike,
    isJoinerOrder: plant.isJoinerOrder || group.isJoinerOrder || false,
    joinerInfo: plant.joinerInfo || group.joinerInfo || null,
    buyerUid: plant.buyerUid || group.buyerUid || null,
    _rawPlantRecord: plant,
  };
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

  // Load recent searches and fetch all orders on mount
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

      // Ready to Fly
      if (responses[0].status === 'fulfilled' && responses[0].value?.success) {
        const plants = responses[0].value.data?.data?.plants || [];
        plants.forEach(plant => combinedOrders.push(transformIndividualPlant(plant)));
      }

      // Delivered
      if (responses[1].status === 'fulfilled' && responses[1].value?.success) {
        const plants = responses[1].value.data?.data?.plants || [];
        plants.forEach(plant => combinedOrders.push(transformIndividualPlant(plant)));
      }

      // Pending Payment (grouped)
      if (responses[2].status === 'fulfilled' && responses[2].value?.success) {
        const groups = responses[2].value.data?.data?.groups || [];
        groups.forEach(group => {
          const groupPlants = group.plants || [];
          groupPlants.forEach(plant => {
            combinedOrders.push(transformGroupedPlant(group, plant));
          });
        });
      }

      // Deduplicate by id
      const seen = new Set();
      const deduped = combinedOrders.filter(order => {
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
    const filtered = allOrders.filter(order => {
      const plantNameMatch = order.plantName && order.plantName.toLowerCase().includes(trimmed);
      const txnMatch = order.transactionNumber && order.transactionNumber.toLowerCase().includes(trimmed);
      return plantNameMatch || txnMatch;
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

  const handleOrderPress = useCallback((order) => {
    if (order.plantCode && order.fullOrderData) {
      navigation.navigate('OrderDetailsScreen', {
        order: order.fullOrderData,
        plantCode: order.plantCode,
      });
    }
  }, [navigation]);

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
            {results.map((order) => (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.8}
                onPress={() => handleOrderPress(order)}
              >
                <OrderItemCard
                  status={order.status}
                  airCargoDate={order.airCargoDate}
                  countryCode={order.countryCode}
                  flag={order.flag}
                  planeIcon={order.planeIcon}
                  image={order.image}
                  plantName={order.plantName}
                  variety={order.variety}
                  size={order.size}
                  price={order.price}
                  quantity={order.quantity}
                  plantCode={order.plantCode}
                  fullOrderData={order.fullOrderData}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No orders found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try searching by plant name, invoice number, or transaction number.
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
