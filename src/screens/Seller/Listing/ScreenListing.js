import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../../../assets/styles/styles';
import { AuthContext } from '../../../auth/AuthProvider';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {
  getAllPlantGenusApi,
  getListingTypeApi,
  getSortApi,
  getVariegationApi,
  postListingApplyDiscountActionApi,
  postListingDeactivateActionApi,
  postListingPinActionApi,
  postListingRemoveDiscountActionApi,
  postListingUpdateStockActionApi,
} from '../../../components/Api';
import { setLiveListingActiveApi } from '../../../components/Api/agoraLiveApi';
import { InputBox } from '../../../components/Input';
import { InputSearch } from '../../../components/InputGroup/Left';
import { InputGroupAddon } from '../../../components/InputGroupAddon';
import { ReusableActionSheet } from '../../../components/ReusableActionSheet';
import TabFilter from '../../../components/TabFilter/TabFilter';
import Toast from '../../../components/Toast/Toast';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../../../firebase';
import { fetchLiveListingsFromFirestore } from '../../../utils/fetchLiveListingsFromFirestore';
import { fetchSellerListingsFromFirestore } from '../../../utils/fetchSellerListingsFromFirestore';
import { retryAsync } from '../../../utils/utils';
import ConfirmDelete from './components/ConfirmDelete';
import ListingActionSheet from './components/ListingActionSheetEdit';
import LiveListingGrid from './components/LiveListingGrid';
import ListingTable from './components/ListingTable';
import ListingTableSkeleton from './components/ListingTableSkeleton';
import LiveListingGridSkeleton from './components/LiveListingGridSkeleton';

import PinAccentIcon from '../../../assets/icons/accent/pin.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
import RefreshIcon from '../../../assets/icons/accent/arrow-clockwise-regular.svg';
import LiveIcon from '../../../assets/images/live.svg';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const SELLER_LISTINGS_PAGE_SIZE = 20;

const FilterTabs = [
  {
    filterKey: 'All',
    badgeCount: '',
  },
  {
    filterKey: 'Active',
    badgeCount: '',
  },
  {
    filterKey: 'Group Chat Listing',
    badgeCount: '',
  },
  {
    filterKey: 'Inactive',
    badgeCount: '',
  },
  {
    filterKey: 'Discounted',
    badgeCount: '',
  },
  {
    filterKey: 'Scheduled',
    badgeCount: '20',
  },
  {
    filterKey: 'Expired',
    badgeCount: '',
  },
  {
    filterKey: 'Out of Stock',
    badgeCount: '',
  },
];

const FilterLiveTabs = [
  {
    filterKey: 'All',
    badgeCount: '',
  },
  {
    filterKey: 'Active',
    badgeCount: '',
  },
  {
    filterKey: 'Live',
    badgeCount: '',
  },
  {
    filterKey: 'Group Chat Listing',
    badgeCount: '',
  },
  {
    filterKey: 'Inactive',
    badgeCount: '',
  },
  {
    filterKey: 'Discounted',
    badgeCount: '',
  },
  {
    filterKey: 'Sold',
    badgeCount: '',
  },
  {
    filterKey: 'Expired',
    badgeCount: '',
  },
  {
    filterKey: 'Out of Stock',
    badgeCount: '',
  },
];

const headers = [
  'Listings',
  'Plant Name & Status',
  'Pin',
  'Listing Type',
  'Pot Size',
  'Price',
  'Quantity',
  'Expiration Date',
  'Discount',
];

const imageMap = {
  all: require('../../../assets/images/manage-all.png'),
  active: require('../../../assets/images/manage-active.png'),
  inactive: require('../../../assets/images/manage-inactive.png'),
  discounted: require('../../../assets/images/manage-discounted.png'),
  sold: require('../../../assets/images/manage-scheduled.png'),
  expired: require('../../../assets/images/manage-expired.png'),
  outofstock: require('../../../assets/images/manage-out_of_stock.png'),
};

// Module-level cache for Live listings — persists across tab switches within the same app session.
// Key: "<uid>|<serialised filters>"  Value: { listings, timestamp }
const LIVE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const _liveListingsCache = new Map();

const _liveListingsCacheKey = (uid, filters = {}) =>
  `${uid}|${JSON.stringify({
    sort: filters.sort ?? '',
    genus: [...(filters.genus ?? [])].sort(),
    variegation: [...(filters.variegation ?? [])].sort(),
    listingType: [...(filters.listingType ?? [])].sort(),
    search: (filters.search ?? '').trim().toLowerCase(),
  })}`;

const _getLiveCache = (uid, filters) => {
  const key = _liveListingsCacheKey(uid, filters);
  const entry = _liveListingsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > LIVE_CACHE_TTL_MS) {
    _liveListingsCache.delete(key);
    return null;
  }
  return entry.listings;
};

const _setLiveCache = (uid, filters, listings) => {
  _liveListingsCache.set(_liveListingsCacheKey(uid, filters), {
    listings,
    timestamp: Date.now(),
  });
};

const _bustLiveCache = (uid) => {
  if (!uid) {
    _liveListingsCache.clear();
    return;
  }
  for (const key of _liveListingsCache.keys()) {
    if (key.startsWith(`${uid}|`)) _liveListingsCache.delete(key);
  }
};

const ScreenListing = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [dataTable, setDataTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const {userInfo} = useContext(AuthContext);

  const normalizeKey = key => key.toLowerCase().replace(/\s+/g, '');

  // List table
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Your loadData (unchanged)
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalListings, setTotalListings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /** Non-Live tabs: all fetched listings cached in memory (avoids re-fetch on tab/page switch) */
  const allListingsRef = useRef([]);
  const allFetchIdRef = useRef(0);
  /** Non-Live tabs: filtered+sorted result set for in-memory infinite scroll */
  const allDisplayListingsRef = useRef([]);
  const ALL_DISPLAY_PAGE = 10;
  const [allLoadingMore, setAllLoadingMore] = useState(false);
  const [allHasMore, setAllHasMore] = useState(false);

  /** Live tab: full fetched array (for client-side lazy rendering) */
  const liveAllListingsRef = useRef([]);
  const LIVE_DISPLAY_PAGE = 24;

  /** Live tab scroll state */
  const liveLastDocRef = useRef(null);
  const liveFetchIdRef = useRef(0);
  const [liveLoadingMore, setLiveLoadingMore] = useState(false);
  const [liveHasMore, setLiveHasMore] = useState(false);

  /** Live tab: plantCodes that were set active earlier this session (for orange styling) */
  const [prevActivePlantCodes, setPrevActivePlantCodes] = useState(new Set());

  /** Live tab: batch select mode */
  const [isLiveSelectMode, setIsLiveSelectMode] = useState(false);
  const [liveSelectedIds, setLiveSelectedIds] = useState([]);

  const resetPaginationState = () => {
    allListingsRef.current = [];
    allDisplayListingsRef.current = [];
    setAllHasMore(false);
    setAllLoadingMore(false);
    setCurrentPage(1);
    setHasMorePages(false);
    setTotalListings(0);
    setTotalPages(1);
    liveAllListingsRef.current = [];
    liveLastDocRef.current = null;
    setLiveLoadingMore(false);
    setLiveHasMore(false);
    setPrevActivePlantCodes(new Set());
    setIsLiveSelectMode(false);
    setLiveSelectedIds([]);
  };

  const toggleLiveSelect = useCallback((id) => {
    setLiveSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const toggleLiveSelectAll = useCallback(() => {
    setLiveSelectedIds(prev =>
      prev.length === dataTable.length ? [] : dataTable.map(l => l.id)
    );
  }, [dataTable]);

  const exitLiveSelectMode = useCallback(() => {
    setIsLiveSelectMode(false);
    setLiveSelectedIds([]);
  }, []);

  const handleLiveBatchDelete = useCallback(() => {
    if (liveSelectedIds.length === 0) return;
    const count = liveSelectedIds.length;
    Alert.alert(
      'Delete Listings',
      `Are you sure you want to delete ${count} listing${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const selectedItems = dataTable.filter(item => liveSelectedIds.includes(item.id));
            const remainingItems = dataTable.filter(item => !liveSelectedIds.includes(item.id));

            setDataTable(remainingItems);
            liveAllListingsRef.current = liveAllListingsRef.current.filter(
              item => !liveSelectedIds.includes(item.id)
            );
            exitLiveSelectMode();
            showToast(`${count} listing${count > 1 ? 's' : ''} deleted.`);

            const batch = writeBatch(db);
            selectedItems.forEach(item => {
              batch.delete(doc(db, 'listing', item.id));
            });
            batch.commit().catch(() => {
              showToast('Some listings failed to delete.', 'error');
              onRefresh();
            });
          },
        },
      ]
    );
  }, [liveSelectedIds, dataTable]);

  const handleLiveBatchExportToMainstream = useCallback(() => {
    if (liveSelectedIds.length === 0) return;
    const count = liveSelectedIds.length;
    Alert.alert(
      'Export to Mainstream',
      `Move ${count} listing${count > 1 ? 's' : ''} to your Active listings? They will no longer appear in the Live tab.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            const selectedItems = dataTable.filter(item => liveSelectedIds.includes(item.id));
            const remainingItems = dataTable.filter(item => !liveSelectedIds.includes(item.id));
            setDataTable(remainingItems);
            liveAllListingsRef.current = liveAllListingsRef.current.filter(
              item => !liveSelectedIds.includes(item.id)
            );
            exitLiveSelectMode();
            showToast(`${count} listing${count > 1 ? 's' : ''} moved to Active.`);
            const batch = writeBatch(db);
            selectedItems.forEach(item => {
              batch.update(doc(db, 'listing', item.id), {
                status: 'Active',
                isActiveLiveListing: false,
                updatedAt: serverTimestamp(),
              });
            });
            batch.commit().catch(() => {
              showToast('Failed to export listings.', 'error');
              onRefresh();
            });
          },
        },
      ]
    );
  }, [liveSelectedIds, dataTable, exitLiveSelectMode]);

  const handleLiveBatchDeactivate = useCallback(() => {
    if (liveSelectedIds.length === 0) return;
    const count = liveSelectedIds.length;
    Alert.alert(
      'Deactivate Listings',
      `Deactivate ${count} listing${count > 1 ? 's' : ''}? They will be moved to Inactive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            const selectedItems = dataTable.filter(item => liveSelectedIds.includes(item.id));
            const remainingItems = dataTable.filter(item => !liveSelectedIds.includes(item.id));
            setDataTable(remainingItems);
            liveAllListingsRef.current = liveAllListingsRef.current.filter(
              item => !liveSelectedIds.includes(item.id)
            );
            exitLiveSelectMode();
            showToast(`${count} listing${count > 1 ? 's' : ''} deactivated.`);
            const batch = writeBatch(db);
            selectedItems.forEach(item => {
              batch.update(doc(db, 'listing', item.id), {
                status: 'Inactive',
                isActiveLiveListing: false,
                updatedAt: serverTimestamp(),
              });
            });
            batch.commit().catch(() => {
              showToast('Some listings failed to deactivate.', 'error');
              onRefresh();
            });
          },
        },
      ]
    );
  }, [liveSelectedIds, dataTable, exitLiveSelectMode]);

  const handleLiveEdit = useCallback(() => {
    if (liveSelectedIds.length !== 1) return;
    const selectedItem = dataTable.find(item => item.id === liveSelectedIds[0]);
    if (!selectedItem) return;
    exitLiveSelectMode();
    navigation.navigate('ScreenListingDetail', {
      onGoBack: () => setIsInitialFetchRefresh(prev => !prev),
      plantCode: selectedItem.plantCode,
    });
  }, [liveSelectedIds, dataTable, exitLiveSelectMode, navigation]);


  const fetchListingsPage = async (targetPage = 1) => {
    try {
      setLoading(true);

      if (activeTab === 'Live') {
        const uid =
          userInfo?.uid ||
          userInfo?.id ||
          userInfo?.user?.uid ||
          userInfo?.user?.id ||
          auth.currentUser?.uid;
        if (__DEV__ && uid) {
          console.log('[Live tab] Using uid for Firestore query:', uid);
        }
        if (uid) {
          const fetchId = ++liveFetchIdRef.current;
          const liveFilters = {
            genus: reusableGenus,
            variegation: reusableVariegation,
            listingType: reusableListingType,
            search,
            sort: reusableSort,
          };
          if (__DEV__) {
            console.log(
              '[Live tab] filters:',
              liveFilters,
            );
          }
          try {
            liveLastDocRef.current = null;

            // — Cache check —
            const cached = _getLiveCache(uid, liveFilters);
            if (cached) {
              if (__DEV__) console.log('[Live tab] Cache HIT — skipping Firestore fetch');
              if (fetchId !== liveFetchIdRef.current) return;
              liveAllListingsRef.current = cached;
              setDataTable(cached.slice(0, LIVE_DISPLAY_PAGE));
              setLiveHasMore(cached.length > LIVE_DISPLAY_PAGE);
              setRefreshing(false);
              setLoading(false);
              return;
            }

            if (__DEV__) console.log('[Live tab] Cache MISS — fetching from Firestore');
            const { listings } = await fetchLiveListingsFromFirestore(uid, {
              pageSize: 12,
              lastDoc: null,
              fetchAll: true,
              filters: liveFilters,
            });
            _setLiveCache(uid, liveFilters, listings);
            if (fetchId !== liveFetchIdRef.current) return;
            liveAllListingsRef.current = listings;
            setDataTable(listings.slice(0, LIVE_DISPLAY_PAGE));
            setLiveHasMore(listings.length > LIVE_DISPLAY_PAGE);
          } catch (liveErr) {
            if (fetchId !== liveFetchIdRef.current) return;
            console.error('[Live tab] Firestore fetch error:', liveErr?.message || liveErr);
            Alert.alert(
              'Live listings',
              liveErr?.message?.includes('permission')
                ? 'Could not load Live listings. Check Firestore rules allow read for your account.'
                : liveErr?.message || 'Failed to load Live listings.',
            );
          }
        } else {
          if (__DEV__) {
            console.warn('[Live tab] No uid available (userInfo or auth.currentUser)');
          }
          setDataTable([]);
          setLiveHasMore(false);
        }
        setRefreshing(false);
        setLoading(false);
        return;
      }

      // ── Non-Live tabs: fetch from Firestore directly ────────────────────────
      const uid =
        userInfo?.uid ||
        userInfo?.id ||
        userInfo?.user?.uid ||
        userInfo?.user?.id ||
        auth.currentUser?.uid;

      if (!uid) {
        setDataTable([]);
        setTotalListings(0);
        setTotalPages(1);
        setHasMorePages(false);
        setCurrentPage(1);
        setRefreshing(false);
        setLoading(false);
        return;
      }

      // Only re-fetch from Firestore when cache is empty (first load / after refresh)
      if (allListingsRef.current.length === 0) {
        const fetchId = ++allFetchIdRef.current;
        if (__DEV__) console.log('[All tabs] Fetching listings from Firestore…');
        const { listings: rawListings } = await fetchSellerListingsFromFirestore(uid);
        if (fetchId !== allFetchIdRef.current) return;
        allListingsRef.current = rawListings;
        if (__DEV__) console.log(`[All tabs] Fetched ${rawListings.length} listing(s)`);
      }

      const normalizeFilterValues = (filterArray) => {
        if (!Array.isArray(filterArray) || filterArray.length === 0) {
          return [];
        }
        return filterArray
          .map(item => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              return (item.value || item.label || '').toString().trim();
            }
            return '';
          })
          .filter(Boolean);
      };

      const computeDisplayStatus = (listing) => {
        const normalizedType = (listing.listingType || '').trim().toLowerCase();
        const qty = parseInt(listing.availableQty, 10) || 0;
        const variations = Array.isArray(listing.variations) ? listing.variations : [];
        const isAllVariationsZero =
          variations.length > 0 &&
          variations.every(variation => (parseInt(variation.availableQty, 10) || 0) === 0);
        const isZero =
          qty === 0 && (variations.length === 0 || isAllVariationsZero);

        if (isZero && normalizedType.includes('single')) {
          return 'sold';
        }

        if (
          isZero &&
          (normalizedType.includes('grower') ||
            normalizedType.includes('choice') ||
            normalizedType.includes('wholesale'))
        ) {
          return 'out of stock';
        }

        if (isZero) {
          return 'out of stock';
        }

        return (listing.status || '').trim().toLowerCase();
      };

      const listingTypeFilters = normalizeFilterValues(reusableListingType).map(value =>
        value.toLowerCase(),
      );
      const genusFilters = normalizeFilterValues(reusableGenus).map(value =>
        value.toLowerCase(),
      );
      const variegationFilters = normalizeFilterValues(reusableVariegation).map(value =>
        value.toLowerCase(),
      );
      const hasListingTypeFilter = listingTypeFilters.length > 0;
      const hasGenusFilter = genusFilters.length > 0;
      const hasVariegationFilter = variegationFilters.length > 0;
      const hasSearchFilter = typeof search === 'string' && search.trim() !== '';
      const hasPinFilter = pinSearch === true;
      const hasDiscountFilter = isDiscounted === true;
      const isSoldTab = activeTab === 'Sold';
      const isOutOfStockTab = activeTab === 'Out of Stock';
      const isActiveTab = activeTab === 'Active';
      const isLiveTab = activeTab === 'Live';
      const isGroupChatListing = activeTab === 'Group Chat Listing';

      const normalizedSortValue = (() => {
        if (!reusableSort) return '';
        const value = reusableSort.trim();
        switch (value) {
          case 'Price Low To High':
          case 'Price Low to High':
            return 'Price Low To High';
          case 'Price High To Low':
          case 'Price High to Low':
            return 'Price High To Low';
          case 'Most Loved':
            return 'Most Loved';
          case 'Newest':
          case 'Newest to Oldest':
          case 'Newest To Oldest':
            return 'Newest to Oldest';
          case 'Oldest':
          case 'Oldest to Newest':
          case 'Oldest To Newest':
            return 'Oldest to Newest';
          default:
            return value;
        }
      })();

      const normalizeListingsFromResponse = rawListings => {
        return (Array.isArray(rawListings) ? rawListings : []).map(listing => {
          const rawType =
            listing.listingType ||
            listing.listingData?.listingType ||
            listing.listing?.listingType ||
            listing.variationType ||
            listing.type;

          if (rawType) {
            return {...listing, listingType: rawType};
          }
          if (listing.listingType) return listing;

          const inferredType = (() => {
            if (listing.variations && Array.isArray(listing.variations) && listing.variations.length > 0) {
              return "Grower's Choice";
            }
            if (Array.isArray(listing.availableQty) || listing.bulkDetails) {
              return 'Wholesale';
            }
            if (listing.potSize || listing.singlePlantDetails || listing.availableQty !== undefined) {
              return 'Single Plant';
            }
            return 'Single Plant';
          })();

          return {...listing, listingType: inferredType};
        });
      };

      const matchesActiveFilters = listing => {
        const listingTypeNormalized = (listing.listingType || '').trim().toLowerCase();
        if (
          listingTypeFilters.length > 0 &&
          !listingTypeFilters.some(filter => listingTypeNormalized === filter)
        ) {
          return false;
        }

        const genusNormalized = (listing.genus || '').trim().toLowerCase();
        if (genusFilters.length > 0 && !genusFilters.includes(genusNormalized)) {
          return false;
        }

        const variegationNormalized = (listing.variegation || '').trim().toLowerCase();
        if (variegationFilters.length > 0 && !variegationFilters.includes(variegationNormalized)) {
          return false;
        }

        if (activeTab === 'Active') {
          // Active tab should only show listings with status "Active" AND availableQty > 0
          const isActiveStatus = (listing.status || '').trim().toLowerCase() === 'active';
          
          // Check direct quantity
          const qty = parseInt(listing.availableQty, 10) || 0;
          
          // Check variations quantity (for Grower's Choice and Wholesale)
          const variations = Array.isArray(listing.variations) ? listing.variations : [];
          const hasVariationQuantity = variations.length > 0 
            ? variations.some(variation => (parseInt(variation.availableQty, 10) || 0) > 0)
            : true; // If no variations, don't exclude based on variations
          
          // Listing must have status "Active" AND (direct quantity > 0 OR has variation with quantity > 0)
          const hasQuantity = qty > 0 || (variations.length > 0 && hasVariationQuantity);
          
          return isActiveStatus && hasQuantity;
        }

        if (activeTab === 'Sold') {
          return listing._displayStatus === 'sold';
        }

        if (activeTab === 'Out of Stock') {
          return listing._displayStatus === 'out of stock';
        }

        if (activeTab === 'Live') {
          const isLiveStatus = (listing.status || '').trim() === 'Live';
          const isSold = listing._displayStatus === 'sold';
          return isLiveStatus && !isSold;
        }

        if (activeTab === 'Group Chat Listing') {
          const isGroupChatListingStatus = (listing.status || '').trim() === 'GroupChatListing';
          return isGroupChatListingStatus;
        }

        return true;
      };

      // Handles Firestore Timestamp objects as well as ISO strings / numbers
      const toMs = val => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        return new Date(val).getTime() || 0;
      };

      const sortListingsBySelection = listingsToSort => {
        const sorted = [...listingsToSort];
        switch (normalizedSortValue) {
          case 'Price Low To High':
            sorted.sort((a, b) => {
              const priceA = parseFloat(a.localPrice || a.usdPrice || 0);
              const priceB = parseFloat(b.localPrice || b.usdPrice || 0);
              return priceA - priceB;
            });
            break;
          case 'Price High To Low':
            sorted.sort((a, b) => {
              const priceA = parseFloat(a.localPrice || a.usdPrice || 0);
              const priceB = parseFloat(b.localPrice || b.usdPrice || 0);
              return priceB - priceA;
            });
            break;
          case 'Most Loved':
            sorted.sort((a, b) => (b.loveCount || 0) - (a.loveCount || 0));
            break;
          case 'Newest to Oldest':
            sorted.sort((a, b) => toMs(b.createdAt || b.orderDate) - toMs(a.createdAt || a.orderDate));
            break;
          case 'Oldest to Newest':
            sorted.sort((a, b) => toMs(a.createdAt || a.orderDate) - toMs(b.createdAt || b.orderDate));
            break;
          default:
            // Default: newest first (Firestore already returns in createdAt desc order)
            sorted.sort((a, b) => toMs(b.createdAt || b.orderDate) - toMs(a.createdAt || a.orderDate));
            break;
        }
        return sorted;
      };

      const processResponseListings = rawListings => {
        const normalizedListings = normalizeListingsFromResponse(rawListings);
        return normalizedListings
          .map(listing => {
            const displayStatus = computeDisplayStatus(listing);
            return {
              ...listing,
              _displayStatus: displayStatus,
            };
          })
          .filter(matchesActiveFilters);
      };

      // Helper function to deduplicate listings by plantCode (or id as fallback)
      const deduplicateListings = (listings) => {
        const seen = new Set();
        return listings.filter(listing => {
          const uniqueKey = listing.plantCode || listing.id || listing._id;
          if (!uniqueKey) {
            // If no unique identifier, include it (shouldn't happen, but handle gracefully)
            return true;
          }
          if (seen.has(uniqueKey)) {
            return false; // Duplicate, exclude it
          }
          seen.add(uniqueKey);
          return true; // First occurrence, include it
        });
      };

      // Filter, deduplicate, and sort all cached listings
      const aggregatedListings = deduplicateListings(
        processResponseListings(allListingsRef.current),
      );
      const sortedAggregated = sortListingsBySelection(aggregatedListings);

      // Store the full result set for infinite scroll
      allDisplayListingsRef.current = sortedAggregated;

      // Show first page of 10 — infinite scroll appends more
      setDataTable(sortedAggregated.slice(0, ALL_DISPLAY_PAGE));
      setTotalListings(sortedAggregated.length);
      setAllHasMore(sortedAggregated.length > ALL_DISPLAY_PAGE);
    } catch (error) {
      console.log('Error in fetchListingsPage:', error.message);
      Alert.alert('Listing', error.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchListingsPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMorePages) {
      fetchListingsPage(currentPage + 1);
    }
  };

  const loadMoreLiveListings = useCallback(() => {
    if (!liveHasMore || liveLoadingMore) return;
    const all = liveAllListingsRef.current;
    setDataTable((prev) => {
      const nextSlice = all.slice(prev.length, prev.length + LIVE_DISPLAY_PAGE);
      if (nextSlice.length === 0) return prev;
      const next = [...prev, ...nextSlice];
      // schedule the hasMore update outside the render cycle
      setTimeout(() => setLiveHasMore(next.length < all.length), 0);
      return next;
    });
  }, [liveHasMore, liveLoadingMore]);

  const loadMoreAllListings = useCallback(() => {
    if (!allHasMore || allLoadingMore) return;
    setAllLoadingMore(true);
    setDataTable(prev => {
      const next = allDisplayListingsRef.current.slice(0, prev.length + ALL_DISPLAY_PAGE);
      setTimeout(() => {
        setAllHasMore(next.length < allDisplayListingsRef.current.length);
        setAllLoadingMore(false);
      }, 0);
      return next;
    });
  }, [allHasMore, allLoadingMore]);

  // ✅ Fetch on mount
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    const timer = setTimeout(() => {
      resetPaginationState();
      fetchListingsPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [isFocused, isInitialFetchRefresh, activeTab]);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    const uid =
      userInfo?.uid ||
      userInfo?.id ||
      userInfo?.user?.uid ||
      userInfo?.user?.id ||
      auth.currentUser?.uid;
    if (activeTab === 'Live') _bustLiveCache(uid);
    setRefreshing(true);
    resetPaginationState();
    fetchListingsPage(1);
  };
  // List table

  // Pin search
  const [pinSearch, setPinSearch] = useState(false);

  const onPressPinSearch = paramPinSearch => {
    setPinSearch(paramPinSearch);
    resetPaginationState();
    setIsInitialFetchRefresh(prev => !prev);
  };
  // Pin search

  // Search
  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    // trigger your search logic here
    resetPaginationState();
    setIsInitialFetchRefresh(prev => !prev);
  };

  const handleFilterView = () => {
    setLoading(true); // Show skeleton while applying filters
    resetPaginationState();
    setIsInitialFetchRefresh(prev => !prev);
    // Close the modal after applying filters
    setShowSheet(false);
  };
  // Search

  // For dropdown
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [listingTypeOptions, setListingTypeOptions] = useState([]);

  useEffect(() => {
    const fetchDataDropdown = async () => {
      try {
        // Then fetch main data (if it depends on the above)
        // Parallel fetches
        await Promise.all([
          loadSortByData(),
          loadGenusData(),
          loadVariegationData(),
          loadListingTypeData(),
        ]);
      } catch (error) {
        console.log('Error in dropdown:', error);
      }
    };

    fetchDataDropdown();
  }, []);

  const loadSortByData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getSortApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    let localSortData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    setSortOptions(localSortData);
  };

  const loadGenusData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getAllPlantGenusApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load genus api');
    }

    // Handle different response formats like other screens
    // 1. { success: true, data: ['genus1', 'genus2', ...] } - array of strings
    // 2. { success: true, data: [{ name: 'genus1' }, ...] } - array of objects
    let localGenusData = [];
    if (Array.isArray(res.data)) {
      localGenusData = res.data.map(item => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        } else if (item && typeof item === 'object') {
          const name = item.name || item.genus_name || item.genusName || item.genus || '';
          return { label: name, value: name };
        }
        return null;
      }).filter(Boolean);
    } else if (res.data && typeof res.data === 'object') {
      // Handle case where data might be an object with a name property
      const name = res.data.name || res.data.genus_name || res.data.genusName || res.data.genus || '';
      if (name) {
        localGenusData = [{ label: name, value: name }];
      }
    }

    setGenusOptions(localGenusData);
  };

  const loadVariegationData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getVariegationApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load variegation api');
    }

    let localVariegationData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    setVariegationOptions(localVariegationData);
  };

  const loadListingTypeData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getListingTypeApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load listing type api');
    }

    let localListingTypeData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));
    // console.log(localListingTypeData);
    setListingTypeOptions(localListingTypeData);
  };
  // For dropdown

  // For reusable action sheet
  const [reusableSort, setReusableSort] = useState('');
  const [reusableGenus, setReusableGenus] = useState([]);
  const [reusableVariegation, setReusableVariegation] = useState([]);
  const [reusableListingType, setReusableListingType] = useState([]);
  // For reusable action sheet

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  // const onPressItem = ({data}) => {
  //   navigation.navigate('ScreenMyStoreDetail', data);
  // };

  const [activeTab, setActiveTab] = useState('All');
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [activeFilterShow, setActiveFilterShow] = useState('');

  const onTabPressItem = ({pressTab}) => {
    setActiveTab(pressTab);
    setIsDiscounted(false);
    resetPaginationState();
    setLoading(true);

    if (pressTab === 'Live') {
      const uid = userInfo?.uid || userInfo?.id || userInfo?.user?.uid || userInfo?.user?.id || auth.currentUser?.uid;
      _bustLiveCache(uid);
    }

    if (pressTab === 'Discounted') {
      setIsDiscounted(true);
    } else {
      setIsDiscounted(false);
    }
    
    // Trigger refresh to apply new filter
    setIsInitialFetchRefresh(prev => !prev);
  };

  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  // Check if a filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        return reusableSort && reusableSort !== '';
      case 'Genus':
        return Array.isArray(reusableGenus) && reusableGenus.length > 0;
      case 'Variegation':
        return Array.isArray(reusableVariegation) && reusableVariegation.length > 0;
      case 'Listing Type':
        return Array.isArray(reusableListingType) && reusableListingType.length > 0;
      default:
        return false;
    }
  };

  // Clear a specific filter
  const clearSpecificFilter = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        setReusableSort('');
        break;
      case 'Genus':
        setReusableGenus([]);
        break;
      case 'Variegation':
        setReusableVariegation([]);
        break;
      case 'Listing Type':
        setReusableListingType([]);
        break;
      default:
        return;
    }
    // Refresh listings after clearing filter
    setLoading(true); // Show skeleton while clearing filter and refetching
    resetPaginationState();
    setIsInitialFetchRefresh(prev => !prev);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const [actionSheetCode, setActionSheetCode] = useState(null);
  const [showActionSheet, setActionShowSheet] = useState(false);

  const [selectedItemStockUpdate, setselectedItemStockUpdate] = useState(false);

  const onEditPressFilter = ({pressCode, id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    // console.log(selectedItem);
    setselectedItemStockUpdate(selectedItem);
    setActionSheetCode(pressCode);
    setActionShowSheet(true);
  };

  // Add stocks
  const [quantities, setQuantities] = useState({});
  useEffect(() => {
    if (Array.isArray(selectedItemStockUpdate?.variations)) {
      const initialQuantities = {};
      selectedItemStockUpdate.variations.forEach(variation => {
        initialQuantities[variation.id] =
          variation.availableQty?.toString() || '';
      });
      setQuantities(initialQuantities);
    } else if (selectedItemStockUpdate?.potSize) {
      setQuantities({
        single: selectedItemStockUpdate.availableQty?.toString() || '',
      });
    }
  }, [selectedItemStockUpdate]);

  const [showSheetUpdateStocks, setShowSheetUpdateStocks] = useState(false);

  const onPressUpdateStockShow = ({id}) => {
    setActionShowSheet(false);
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setShowSheetUpdateStocks(!showSheetUpdateStocks);
  };

  const onPressUpdateStockPost = async () => {
    setActionShowSheet(false);
    setShowSheetUpdateStocks(false);
    // setLoading(true);
    try {
      const {variations, plantCode} = selectedItemStockUpdate;

      // Extract pot sizes and map their IDs to corresponding quantities from qtyMap
      const potSizes = variations.map(variation => variation.potSize);
      const selectedQuantity = variations.map(
        variation => quantities[variation.id]?.toString() || '0', // default to '0' if missing
      );

      const response = await postListingUpdateStockActionApi(
        plantCode,
        potSizes,
        selectedQuantity,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post stock update failed.');
      }
      resetPaginationState();
      await fetchListingsPage(1);
      Alert.alert('Update Listing', 'Listing stocks updated successfully!');
    } catch (error) {
      console.log('Error updating stock:', error.message);
      Alert.alert('Update stocks', error.message);
    } finally {
      // setLoading(false);
    }
  };
  // Add stocks

  // Apply discount
  const [discountPercentageSheet, setDiscountPercentageSheet] = useState();
  const [discountPriceSheet, setDiscountPriceSheet] = useState();
  const [showSheetDiscount, setShowSheetDiscount] = useState(false);

  const onPressDiscount = ({id}) => {
    let selectedItem = dataTable.find(item => item.id === id);
    setselectedItemStockUpdate(selectedItem);
    setShowSheetDiscount(!showSheetDiscount);
  };

  const onPressUpdateApplyDiscountPost = async () => {
    // Validation: only one of the two should be filled
    const isPriceFilled =
      discountPriceSheet !== undefined &&
      discountPriceSheet !== '' &&
      discountPriceSheet !== null;
    const isPercentageFilled =
      discountPercentageSheet !== undefined &&
      discountPercentageSheet !== null &&
      discountPercentageSheet !== '';

    if (
      (isPriceFilled && isPercentageFilled) ||
      (!isPriceFilled && !isPercentageFilled)
    ) {
      Alert.alert(
        'Invalid Input',
        'Please fill **either** Discount Price or Discount Percentage, not both or none.',
      );
      return;
    }

    setLoading(true);
    try {
      const {plantCode} = selectedItemStockUpdate;

      const response = await postListingApplyDiscountActionApi(
        [plantCode],
        discountPriceSheet,
        discountPercentageSheet,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Post stock update failed.');
      }

      setDiscountPercentageSheet('');
      setDiscountPriceSheet('');
      setShowSheetDiscount(!showSheetDiscount);
      resetPaginationState();
      await fetchListingsPage(1);
    } catch (error) {
      console.log('Error updating discount:', error.message);
      Alert.alert('Update Discount', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onPressRemoveDiscountPost = async plantCode => {
    setLoading(true);
    try {
      const response = await postListingRemoveDiscountActionApi([plantCode]);

      if (!response?.success) {
        throw new Error(response?.message || 'Post stock update failed.');
      }
      resetPaginationState();
      await fetchListingsPage(1);
    } catch (error) {
      console.log('Error remove discount:', error.message);
      Alert.alert('Remove discount', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Apply discount

  const onPressCheck = () => {
    // navigation.navigate('ScreenListingAction', {
    //   dataTable: dataTable,
    //   activeTab: activeTab,
    // });

    navigation.navigate('ScreenListingAction', {
      onGoBack: setIsInitialFetchRefresh(prev => !prev),
      dataTable: dataTable,
      activeTab: activeTab,
    });
  };

  const onNavigateToDetail = plantCode => {
    navigation.navigate('ScreenListingDetail', {
      onGoBack: setIsInitialFetchRefresh(prev => !prev),
      plantCode: plantCode,
    });
  };

  const onPressSetToActive = async (plantCode) => {
    if (activeTab === 'Live') {
      const previousDataTable = dataTable;
      const previousPrevActive = prevActivePlantCodes;
      const currentActive = dataTable.find((l) => l.isActiveLiveListing === true);
      if (currentActive?.plantCode && currentActive.plantCode !== plantCode) {
        setPrevActivePlantCodes((prev) => new Set([...prev, currentActive.plantCode]));
      }
      setDataTable((prev) =>
        prev.map((l) => ({
          ...l,
          isActiveLiveListing: l.plantCode === plantCode,
        })),
      );
      try {
        const response = await setLiveListingActiveApi({ plantCode });
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to set active listing.');
        }
        showToast('Active listing has been updated.');
      } catch (error) {
        console.log('Error action:', error.message);
        setDataTable(previousDataTable);
        setPrevActivePlantCodes(previousPrevActive);
        showToast(error.message || 'Failed to set active listing.', 'error');
      }
      return;
    }
    setLoading(true);
    try {
      const response = await setLiveListingActiveApi({
        plantCode: plantCode,
      });

      if (response.success) {
        showToast('Active listing has been updated.');
        resetPaginationState();
        await fetchListingsPage(1);
      } else {
        throw new Error(response.message || 'Failed to set active listing.');
      }
    } catch (error) {
      console.log('Error action:', error.message);
      showToast(error.message || 'Failed to set active listing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onPressTableListPin = async (plantCode, pinTag) => {
    setLoading(true);
    try {
      const updatedPinTag = !pinTag;

      const response = await postListingPinActionApi(plantCode, updatedPinTag);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }
      resetPaginationState();
      await fetchListingsPage(1);
    } catch (error) {
      console.log('Error pin table action:', error.message);
      Alert.alert('Pin item', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Item
  const onPressDelete = () => {
    const item = selectedItemStockUpdate;
    if (!item) return;

    setActionShowSheet(false);
    setDeleteModalVisible(false);

    // Snapshot current state for rollback
    const prevDataTable = [...dataTable];
    const prevAllListings = [...allListingsRef.current];
    const prevAllDisplay = [...allDisplayListingsRef.current];
    const prevTotal = totalListings;

    const removeItem = arr =>
      arr.filter(l => l.id !== item.id && l.plantCode !== item.plantCode);

    // Optimistic removal
    setDataTable(removeItem(dataTable));
    allListingsRef.current = removeItem(allListingsRef.current);
    allDisplayListingsRef.current = removeItem(allDisplayListingsRef.current);
    setTotalListings(prev => Math.max(0, prev - 1));

    showToast('Listing deleted.');

    // Firestore delete in background
    const batch = writeBatch(db);
    batch.delete(doc(db, 'listing', item.id));
    batch.commit().catch(() => {
      // Rollback on failure
      setDataTable(prevDataTable);
      allListingsRef.current = prevAllListings;
      allDisplayListingsRef.current = prevAllDisplay;
      setTotalListings(prevTotal);
      showToast('Failed to delete listing.', 'error');
    });
  };
  // Delete Item

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onPressDeleteConfirm = () => {
    setActionShowSheet(false);
    setDeleteModalVisible(true);
  };

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingTop: insets.top}}>
      {/* Search and Icons */}
      <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <InputSearch
              placeholder="Search ileafU"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              showClear={true} // shows an 'X' icon to clear
            />
          </View>

          <View style={styles.headerIcons}>
            {userInfo?.liveFlag != 'No' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('LiveSellerScreen')}
                style={styles.iconButton}>
                <LiveIcon width={40} height={40} />  
                {/* <LiveIcon width={40} height={40} />
                <Text style={styles.liveTag}>LIVE</Text> */}
                {/* <Purge /> */}
                {/* <Image source={require('../../../assets/live-icon/purge.png')} style={{width: 40, height: 40}} /> */}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 10,
                  borderRadius: 10,
                },
              ]}
              onPress={() => onPressPinSearch(!pinSearch)}>
              {pinSearch ? (
                <PinAccentIcon width={20} height={20} />
              ) : (
                <PinIcon width={20} height={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Filter Tabs */}
        <TabFilter
          tabFilters={userInfo?.liveFlag != 'No' ? FilterLiveTabs : FilterTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onPressTab={onTabPressItem}
          disabled={loading}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexGrow: 0,
            paddingTop: 8,
            paddingBottom: 0,
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}>
          <TouchableOpacity onPress={() => onPressFilter('SORT')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Sort') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Sort') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
              <SortIcon width={20} height={20} />
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Sort') && { color: '#23C16B', fontWeight: '600' }
              ]}>Sort</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('GENUS')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Genus') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Genus') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Genus') && { color: '#23C16B', fontWeight: '600' }
              ]}>Genus</Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('VARIEGATION')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Variegation') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Variegation') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Variegation') && { color: '#23C16B', fontWeight: '600' }
              ]}>Variegation</Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPressFilter('LISTINGTYPE')}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isFilterActive('Listing Type') ? '#23C16B' : '#CDD3D4',
                backgroundColor: isFilterActive('Listing Type') ? '#E8F5E9' : '#FFFFFF',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginRight: 30,
              }}>
              <Text style={[
                globalStyles.textSMGreyDark,
                isFilterActive('Listing Type') && { color: '#23C16B', fontWeight: '600' }
              ]}>Listing Type</Text>
              <DownIcon width={20} height={20} />
            </View>
          </TouchableOpacity>
        </ScrollView>
        {/* Filter Tabs */}
      </View>
      {/* Search and Icons — use View for Live tab so FlatList is not inside ScrollView */}
      {activeTab === 'Live' ? (
        <View style={[styles.container, { flex: 1, paddingBottom: insets.bottom }]}>
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {!loading && dataTable && dataTable.length > 0 && (
              <View style={[styles.liveToolbar, isLiveSelectMode && styles.liveToolbarSelectMode]}>
                {isLiveSelectMode ? (
                  <View style={styles.liveSelectModeContainer}>
                    {/* Row 1: Select All + count + Cancel */}
                    <View style={styles.liveToolbarRow}>
                      <TouchableOpacity onPress={toggleLiveSelectAll} style={styles.liveSelectAllBtn}>
                        <View style={[styles.liveCheckbox, liveSelectedIds.length === dataTable.length && styles.liveCheckboxChecked]}>
                          {liveSelectedIds.length === dataTable.length && <Text style={styles.liveCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.liveToolbarText}>Select All</Text>
                      </TouchableOpacity>
                      <Text style={styles.liveToolbarCount}>{liveSelectedIds.length} selected</Text>
                      <TouchableOpacity onPress={exitLiveSelectMode} style={styles.liveCancelBtn}>
                        <Text style={styles.liveCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Row 2: Action chips */}
                    <View style={styles.liveActionsRow}>
                      <TouchableOpacity
                        onPress={handleLiveBatchExportToMainstream}
                        disabled={liveSelectedIds.length === 0}
                        style={[styles.liveActionChip, styles.liveExportChip, liveSelectedIds.length === 0 && { opacity: 0.4 }]}>
                        <Text style={styles.liveActionChipText}>Export</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleLiveEdit}
                        disabled={liveSelectedIds.length !== 1}
                        style={[styles.liveActionChip, styles.liveEditChip, liveSelectedIds.length !== 1 && { opacity: 0.4 }]}>
                        <Text style={styles.liveEditChipText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleLiveBatchDeactivate}
                        disabled={liveSelectedIds.length === 0}
                        style={[styles.liveActionChip, styles.liveDeactivateChip, liveSelectedIds.length === 0 && { opacity: 0.4 }]}>
                        <Text style={styles.liveActionChipText}>Deactivate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleLiveBatchDelete}
                        disabled={liveSelectedIds.length === 0}
                        style={[styles.liveActionChip, styles.liveDeleteChip, liveSelectedIds.length === 0 && { opacity: 0.4 }]}>
                        <Text style={styles.liveActionChipText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity onPress={onRefresh} style={styles.liveRefreshBtn} hitSlop={8}>
                      <RefreshIcon width={18} height={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsLiveSelectMode(true)} style={styles.liveManageBtn}>
                      <Text style={styles.liveManageBtnText}>Manage</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
            {loading ? (
              <LiveListingGridSkeleton cardCount={12} />
            ) : dataTable && dataTable.length > 0 ? (
              <View style={[styles.contents, { flex: 1 }]}>
                <LiveListingGrid
                  data={dataTable}
                  onNavigateToDetail={onNavigateToDetail}
                  onPressSetToActive={onPressSetToActive}
                  onLoadMore={loadMoreLiveListings}
                  isLoadingMore={liveLoadingMore}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  prevActivePlantCodes={prevActivePlantCodes}
                  isSelectMode={isLiveSelectMode}
                  selectedIds={liveSelectedIds}
                  onToggleSelect={toggleLiveSelect}
                />
              </View>
            ) : !loading ? (
              <View style={{ alignItems: 'center', paddingTop: 80, flex: 1 }}>
                <Image
                  source={imageMap[normalizeKey(activeTab)]}
                  style={{ width: 300, height: 300, resizeMode: 'contain' }}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={[styles.container]}
          contentContainerStyle={{
            paddingBottom: insets.bottom,
          }}
          scrollEventThrottle={400}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 200 &&
              !allLoadingMore &&
              allHasMore
            ) {
              loadMoreAllListings();
            }
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              minHeight: dataTable.length != 0 && screenHeight * 0.9,
            }}>
            {loading ? (
              <View style={styles.contents}>
                <ListingTableSkeleton rowCount={ALL_DISPLAY_PAGE} />
              </View>
            ) : dataTable && dataTable.length > 0 ? (
              <View style={styles.contents}>
                <ListingTable
                  headers={headers}
                  data={dataTable}
                  onEditPressFilter={onEditPressFilter}
                  onPressDiscount={onPressDiscount}
                  onPressUpdateStock={onPressUpdateStockShow}
                  module={'MAIN'}
                  navigateToListAction={onPressCheck}
                  style={{}}
                  onPressTableListPin={onPressTableListPin}
                  onPressRemoveDiscountPost={onPressRemoveDiscountPost}
                  onNavigateToDetail={onNavigateToDetail}
                  activeTab={activeTab}
                  onPressSetToActive={onPressSetToActive}
                />
                {allLoadingMore && (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#48A7F8" />
                  </View>
                )}
                {!allHasMore && totalListings > 0 && !loading && (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#9DA5A7' }}>
                      {totalListings} listing{totalListings !== 1 ? 's' : ''} total
                    </Text>
                  </View>
                )}
              </View>
            ) : !loading ? (
              <View style={{ alignItems: 'center', paddingTop: 80, flex: 1 }}>
                <Image
                  source={imageMap[normalizeKey(activeTab)]}
                  style={{ width: 300, height: 300, resizeMode: 'contain' }}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}


      <ReusableActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        genusOptions={genusOptions}
        variegationOptions={variegationOptions}
        listingTypeOptions={listingTypeOptions}
        sortValue={reusableSort}
        sortChange={setReusableSort}
        genusValue={reusableGenus}
        genusChange={setReusableGenus}
        variegationValue={reusableVariegation}
        variegationChange={setReusableVariegation}
        listingTypeValue={reusableListingType}
        listingTypeChange={setReusableListingType}
        handleSearchSubmit={handleFilterView}
      />
      <ListingActionSheet
        code={actionSheetCode}
        visible={showActionSheet}
        onClose={() => setActionShowSheet(false)}
        onPressUpdateStockShow={() => {
          setActionShowSheet(false);
          setShowSheetUpdateStocks(true);
        }}
        onPressEdit={() =>
          navigation.navigate('ScreenListingDetail', {
            onGoBack: setIsInitialFetchRefresh(prev => !prev),
            plantCode: selectedItemStockUpdate.plantCode,
          })
        }
        onPressDelete={onPressDeleteConfirm}
      />

      <ActionSheet
        visible={showSheetUpdateStocks}
        onClose={() => setShowSheetUpdateStocks(false)}
        heightPercent={'50%'}>
        <View style={styles.sheetTitleContainer}>
          <Text style={styles.sheetTitle}>Update Stocks</Text>
          <TouchableOpacity onPress={() => setShowSheetUpdateStocks(false)}>
            <ExIcon width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={{paddingHorizontal: 20}}>
          {Array.isArray(selectedItemStockUpdate.variations) &&
          selectedItemStockUpdate.variations.length > 0 ? (
            selectedItemStockUpdate.variations.map((variation, index) => (
              <View key={variation.id || index} style={{marginTop: 10}}>
                <Text
                  style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                  Pot size: {variation.potSize || 'N/A'}
                </Text>
                <Text
                  style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                  Current Quantity
                </Text>
                <InputBox
                  placeholder="Quantity"
                  value={quantities[variation.id] || ''}
                  setValue={text =>
                    setQuantities(prev => ({...prev, [variation.id]: text}))
                  }
                />
              </View>
            ))
          ) : selectedItemStockUpdate.potSize ? (
            <View style={{marginTop: 10}}>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Pot size: {selectedItemStockUpdate.potSize}
              </Text>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Current Quantity
              </Text>
              <InputBox
                placeholder="Quantity"
                value={quantities.single || ''}
                setValue={text =>
                  setQuantities(prev => ({...prev, single: text}))
                }
              />
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => onPressUpdateStockPost()}
          style={{
            position: 'absolute',
            bottom: 0,
            paddingHorizontal: 20,
            width: '100%',
            paddingBottom: 10,
          }}>
          <View style={globalStyles.primaryButton}>
            <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
              Update Stocks
            </Text>
          </View>
        </TouchableOpacity>
      </ActionSheet>

      <ActionSheet
        visible={showSheetDiscount}
        onClose={() => setShowSheetDiscount(false)}
        heightPercent={'40%'}>
        <View style={{height: '100%'}}>
          <View style={styles.sheetTitleContainer}>
            <Text style={styles.sheetTitle}>Apply Discount</Text>
            <TouchableOpacity onPress={() => setShowSheetDiscount(false)}>
              <ExIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={{marginHorizontal: 20}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{paddingBottom: 20}}>
            <View>
              <Text style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
                Discount price
              </Text>
              <InputGroupAddon
                addonText={userInfo?.currencySymbol ?? ''}
                position="left"
                value={discountPriceSheet}
                onChangeText={setDiscountPriceSheet}
                placeholder="Enter price"
              />
            </View>
            <View style={{paddingTop: 20}}>
              <Text style={[globalStyles.textMDGreyLight, {paddingBottom: 10}]}>
                or discount on percentage
              </Text>
              <InputGroupAddon
                addonText="% OFF"
                position="right"
                value={discountPercentageSheet}
                onChangeText={setDiscountPercentageSheet}
                placeholder="Enter percentage"
              />
            </View>
            <View style={{paddingTop: 20}}>
              <TouchableOpacity
                style={{
                  // position: 'absolute',
                  // bottom: 0,
                  width: '100%',
                }}
                onPress={onPressUpdateApplyDiscountPost}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    Apply Discount
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ActionSheet>

      <ConfirmDelete
        visible={deleteModalVisible}
        onDelete={onPressDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        position="bottom"
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ScreenListing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 20,
  },
  search: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  liveTag: {
    color: 'red',
    fontSize: 10,
    marginTop: -4,
  },
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    // zIndex: 10,
    paddingTop: 12,
  },
  contents: {
    // paddingHorizontal: 20,
    backgroundColor: '#fff',
    // minHeight: screenHeight,
  },
  image: {
    width: 166,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    padding: 5,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
  },
  strikeText: {
    textDecorationLine: 'line-through', // This adds the line in the middle
    color: 'black',
  },
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
  paginationWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#23C16B',
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E4E7E9',
  },
  paginationButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3A6',
  },
  paginationInfo: {
    alignItems: 'center',
    marginVertical: 4,
  },
  paginationText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  paginationSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#647276',
  },
  liveToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: '#fff',
  },
  liveSelectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9DA5A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCheckboxChecked: {
    backgroundColor: '#48A7F8',
    borderColor: '#48A7F8',
  },
  liveCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  liveToolbarText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#3B4344',
  },
  liveToolbarCount: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#647276',
  },
  liveToolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  liveDeleteBtn: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  liveDeleteBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  liveCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  liveCancelBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#647276',
  },
  liveRefreshBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    marginRight: 8,
  },
  liveManageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  liveManageBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#3B4344',
  },
  liveToolbarSelectMode: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingBottom: 10,
  },
  liveSelectModeContainer: {
    width: '100%',
    gap: 8,
  },
  liveToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  liveActionChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveActionChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  liveExportChip: {
    backgroundColor: '#48A7F8',
  },
  liveEditChip: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#fff',
  },
  liveEditChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#3B4344',
  },
  liveDeactivateChip: {
    backgroundColor: '#E07B3B',
  },
  liveDeleteChip: {
    backgroundColor: '#E74C3C',
  },
});
