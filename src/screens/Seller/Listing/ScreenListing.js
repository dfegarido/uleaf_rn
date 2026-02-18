import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
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
  getManageListingApi,
  getSortApi,
  getVariegationApi,
  postListingApplyDiscountActionApi,
  postListingDeleteApi,
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
import { auth } from '../../../../firebase';
import { fetchLiveListingsFromFirestore } from '../../../utils/fetchLiveListingsFromFirestore';
import { retryAsync } from '../../../utils/utils';
import ConfirmDelete from './components/ConfirmDelete';
import ListingActionSheet from './components/ListingActionSheetEdit';
import LiveListingGrid from './components/LiveListingGrid';
import ListingTable from './components/ListingTable';
import ListingTableSkeleton from './components/ListingTableSkeleton';

import PinAccentIcon from '../../../assets/icons/accent/pin.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
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
  const [pageTokens, setPageTokens] = useState(['']);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalListings, setTotalListings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /** Live tab infinite scroll: cursor and load-more state */
  const liveLastDocRef = useRef(null);
  const [liveLoadingMore, setLiveLoadingMore] = useState(false);
  const [liveHasMore, setLiveHasMore] = useState(false);

  /** Live tab: plantCodes that were set active earlier this session (for orange styling) */
  const [prevActivePlantCodes, setPrevActivePlantCodes] = useState(new Set());

  const resetPaginationState = () => {
    setPageTokens(['']);
    setCurrentPage(1);
    setHasMorePages(false);
    setTotalListings(0);
    setTotalPages(1);
    liveLastDocRef.current = null;
    setLiveLoadingMore(false);
    setLiveHasMore(false);
    setPrevActivePlantCodes(new Set());
  };

  const loadData = async (
    filterMine,
    sortBy,
    genus,
    variegation,
    listingType,
    status,
    discount,
    limit,
    plant,
    pinTag,
    nextPageToken,
  ) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    // Convert discount boolean to string 'true' or 'false' for API
    const discountParam = discount === true ? 'true' : (discount === false ? 'false' : '');
    
    // Map tab names to API status values (exact match required by backend)
    // Ensure status is a valid string and map correctly
    let apiStatus = status || 'All';
    
    // Handle status mapping - ensure 'All' is passed correctly
    if (status === 'All' || !status || status === '') {
      apiStatus = 'All'; // Show all statuses
    } else if (status === 'Discounted') {
      apiStatus = 'All'; // Discounted uses 'All' status with discount=true
    } else if (status === 'Out of Stock') {
      apiStatus = 'All'; // Handle out of stock client-side
    } else if (status === 'Active') {
      apiStatus = 'Active'; // Explicitly set Active status
    } else if (status === 'Inactive') {
      apiStatus = 'Inactive';
    } else if (status === 'Sold') {
      apiStatus = 'All'; // Handle sold client-side
    } else if (status === 'Scheduled') {
      apiStatus = 'Scheduled';
    } else if (status === 'Expired') {
      apiStatus = 'Expired';
    }  else if (status === 'Group Chat Listing') {
      apiStatus = 'GroupChatListing';
    }
    
    // Normalize sortBy to match backend expectations (case-sensitive)
    // Backend expects: 'Price Low To High', 'Price High To Low', 'Most Loved', or empty/default
    let normalizedSortBy = sortBy || '';
    if (sortBy) {
      const sortTrimmed = sortBy.trim();
      const sortLower = sortTrimmed.toLowerCase();
      
      // Check for exact matches first (most common case)
      if (sortTrimmed === 'Price Low To High' || sortTrimmed === 'Price Low to High') {
        normalizedSortBy = 'Price Low To High';
      } else if (sortTrimmed === 'Price High To Low' || sortTrimmed === 'Price High to Low') {
        normalizedSortBy = 'Price High To Low';
      } else if (sortTrimmed === 'Most Loved') {
        normalizedSortBy = 'Most Loved';
      } else if (sortTrimmed === 'Newest to Oldest' || sortTrimmed === 'Newest To Oldest') {
        normalizedSortBy = 'Newest to Oldest';
      } else if (sortTrimmed === 'Oldest to Newest' || sortTrimmed === 'Oldest To Newest') {
        normalizedSortBy = 'Oldest to Newest';
      } else {
        // Fallback: try to match by keywords
        if (sortLower.includes('price') && sortLower.includes('low') && sortLower.includes('high')) {
          normalizedSortBy = 'Price Low To High';
        } else if (sortLower.includes('price') && sortLower.includes('high') && sortLower.includes('low')) {
          normalizedSortBy = 'Price High To Low';
        } else if (sortLower.includes('most') && sortLower.includes('loved')) {
          normalizedSortBy = 'Most Loved';
        } else if (sortLower.includes('newest') && sortLower.includes('oldest')) {
          // "Newest to Oldest" - newest first
          normalizedSortBy = 'Newest to Oldest';
        } else if (sortLower.includes('oldest') && sortLower.includes('newest')) {
          // "Oldest to Newest" - oldest first
          normalizedSortBy = 'Oldest to Newest';
        } else if (sortLower.includes('newest')) {
          // Just "Newest" - default to newest first
          normalizedSortBy = 'Newest to Oldest';
        } else if (sortLower.includes('oldest')) {
          // Just "Oldest" - default to oldest first
          normalizedSortBy = 'Oldest to Newest';
        } else {
          // Keep original if it matches expected format
          normalizedSortBy = sortTrimmed;
        }
      }
    }
    
    // Extract values from filter objects (genus, variegation, listingType may be arrays of objects)
    const extractValues = (filterArray) => {
      if (!filterArray || !Array.isArray(filterArray)) return [];
      return filterArray.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.value || item.label || item.name || '';
        return String(item);
      }).filter(Boolean);
    };

    const genusValues = extractValues(genus);
    const variegationValues = extractValues(variegation);
    const listingTypeValues = extractValues(listingType);

    const effectiveLimit = limit || SELLER_LISTINGS_PAGE_SIZE;
    const effectiveToken = nextPageToken || '';
    
    const response = await getManageListingApi(
      filterMine,
      normalizedSortBy,
      genusValues,
      variegationValues,
      listingTypeValues,
      apiStatus,
      discountParam,
      effectiveLimit,
      plant,
      pinTag,
      effectiveToken,
    );

    if (!response?.success) {
      throw new Error(response?.message || 'Login verification failed.');
    }

    return response;
  };

  const fetchListingsPage = async (targetPage = 1) => {
    try {
      setLoading(true);
      let desiredPage = Math.max(1, targetPage);

      const tokensCopy = [...pageTokens];
      let response = null;

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
          try {
            liveLastDocRef.current = null;
            const { listings, docs, hasMore } = await fetchLiveListingsFromFirestore(uid, {
              pageSize: 12,
              lastDoc: null,
            });
            setDataTable(listings);
            liveLastDocRef.current = docs[docs.length - 1] ?? null;
            setLiveHasMore(hasMore);
          } catch (liveErr) {
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

      const fetchPageWithToken = async (pageToken = '') => {
        return loadData(
        true,
        reusableSort,
        reusableGenus,
        reusableVariegation,
        reusableListingType,
          activeTab,
        isDiscounted,
          SELLER_LISTINGS_PAGE_SIZE,
        search,
        pinSearch,
          pageToken,
        );
      };

      if (activeTab !== 'Live') {
        if (tokensCopy[desiredPage - 1] === undefined) {
          let currentIndex = tokensCopy.length - 1;
          let lastToken = tokensCopy[currentIndex] || '';
          while (currentIndex < desiredPage - 1) {
            const interimResponse = await fetchPageWithToken(lastToken);
            const nextToken = interimResponse?.nextPageToken || null;
            tokensCopy[currentIndex + 1] = nextToken;
            lastToken = nextToken || '';
            currentIndex += 1;

            if (currentIndex === desiredPage - 1) {
              response = interimResponse;
              break;
            }

            if (!nextToken) {
              desiredPage = currentIndex;
              response = interimResponse;
              break;
            }
          }

          if (tokensCopy[desiredPage - 1] === undefined) {
            desiredPage = Math.max(1, tokensCopy.length - 1);
          }
        }

        if (!response) {
          let tokenForPage = tokensCopy[desiredPage - 1] || '';

          if (desiredPage === 1 && activeTab === 'Group Chat Listing') {
            tokenForPage = null;
          }
          response = await fetchPageWithToken(tokenForPage);
        }
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
          case 'Newest to Oldest':
          case 'Newest To Oldest':
            return 'Newest to Oldest';
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
          // Live tab should only show listings with status "Live" AND isActiveLiveListing === true
          const isLiveStatus = (listing.status || '').trim() === 'Live';
          // const isActiveLive = listing.isActiveLiveListing === true;
          return isLiveStatus;
        }

        if (activeTab === 'Group Chat Listing') {
          const isGroupChatListingStatus = (listing.status || '').trim() === 'GroupChatListing';
          return isGroupChatListingStatus;
        }

        return true;
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
            sorted.sort((a, b) => {
              const createdA = new Date(a.createdAt || a.orderDate || 0).getTime();
              const createdB = new Date(b.createdAt || b.orderDate || 0).getTime();
              return createdB - createdA;
            });
            break;
          case 'Oldest to Newest':
            sorted.sort((a, b) => {
              const createdA = new Date(a.createdAt || a.orderDate || 0).getTime();
              const createdB = new Date(b.createdAt || b.orderDate || 0).getTime();
              return createdA - createdB;
            });
            break;
          default:
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

      let aggregatedListings = deduplicateListings(processResponseListings(response?.listings));
      let nextToken = response?.nextPageToken || null;

      let safetyCounter = 0;
      const MAX_ADDITIONAL_FETCHES = 5;

      while (
        aggregatedListings.length < SELLER_LISTINGS_PAGE_SIZE &&
        nextToken &&
        safetyCounter < MAX_ADDITIONAL_FETCHES
      ) {
        const previousToken = nextToken;
        const additionalResponse = await fetchPageWithToken(nextToken);
        const additionalListings = processResponseListings(additionalResponse?.listings);
        // Deduplicate when concatenating to prevent duplicates
        aggregatedListings = deduplicateListings(aggregatedListings.concat(additionalListings));
        nextToken = additionalResponse?.nextPageToken || null;
        safetyCounter += 1;

        if (nextToken === previousToken) {
          nextToken = null;
          break;
        }
      }

      const sortedAggregated = sortListingsBySelection(aggregatedListings);

      const pageListings = sortedAggregated.slice(0, SELLER_LISTINGS_PAGE_SIZE);

      const displayedCount = pageListings.length;
      // Never use backend total for Active tab since we filter out zero-quantity listings client-side
      const shouldUseBackendTotal =
        !hasListingTypeFilter &&
        !hasGenusFilter &&
        !hasVariegationFilter &&
        !hasSearchFilter &&
        !hasPinFilter &&
        !hasDiscountFilter &&
        !isSoldTab &&
        !isOutOfStockTab &&
        !isActiveTab &&
        !isLiveTab &&
        !isGroupChatListing &&
        typeof response?.total === 'number';

      let computedTotal;
      let totalFilteredCount = aggregatedListings.length; // Declare outside to use in safeguard

      if (shouldUseBackendTotal) {
        computedTotal =
          response.total ??
          response.count ??
          (displayedCount + (currentPage - 1) * SELLER_LISTINGS_PAGE_SIZE);
      } else {
        // For filtered tabs (Active, Sold, Out of Stock, etc.), we need to count all filtered results
        // Track unique listings to prevent duplicate counting
        const uniqueListingKeys = new Set();
        aggregatedListings.forEach(listing => {
          const uniqueKey = listing.plantCode || listing.id || listing._id;
          if (uniqueKey) {
            uniqueListingKeys.add(uniqueKey);
          }
        });
        totalFilteredCount = uniqueListingKeys.size;
        let countToken = nextToken;
        let countSafety = 0;
        const MAX_TOTAL_FETCHES = 50; // Increased significantly to ensure we count all pages (142 listings / 20 per page = ~7 pages, but we need buffer)

        // For Active tab, we MUST fetch all pages to get accurate count
        // Continue fetching and counting filtered results until no more pages
        while (countToken && countSafety < MAX_TOTAL_FETCHES) {
          try {
            const additionalResponse = await fetchPageWithToken(countToken);
            const additionalListings = processResponseListings(additionalResponse?.listings);
            // Count only unique listings
            let newUniqueCount = 0;
            additionalListings.forEach(listing => {
              const uniqueKey = listing.plantCode || listing.id || listing._id;
              if (uniqueKey && !uniqueListingKeys.has(uniqueKey)) {
                uniqueListingKeys.add(uniqueKey);
                newUniqueCount += 1;
              }
            });
            totalFilteredCount = uniqueListingKeys.size;

            if (additionalResponse?.nextPageToken) {
              countToken = additionalResponse.nextPageToken;
            } else {
              countToken = null;
              break; // No more pages, we have the accurate total
            }

            countSafety += 1;
          } catch (error) {
            console.error('Error fetching page for total count:', error);
            break; // Stop on error
          }
        }

        // If we hit the safety limit but still have more pages, we need to continue
        // For Active tab, we should never estimate - we need the exact count
        if (isActiveTab && countToken && countSafety >= MAX_TOTAL_FETCHES) {
          console.warn(`⚠️ Active tab: Hit safety limit (${MAX_TOTAL_FETCHES}) but more pages exist. Current count: ${totalFilteredCount}`);
          // For Active tab, we can't estimate - we need exact count
          // Continue fetching with a warning
          let extraSafety = 0;
          while (countToken && extraSafety < 20) {
            try {
              const additionalResponse = await fetchPageWithToken(countToken);
              const additionalListings = processResponseListings(additionalResponse?.listings);
              // Count only unique listings
              additionalListings.forEach(listing => {
                const uniqueKey = listing.plantCode || listing.id || listing._id;
                if (uniqueKey && !uniqueListingKeys.has(uniqueKey)) {
                  uniqueListingKeys.add(uniqueKey);
                }
              });
              totalFilteredCount = uniqueListingKeys.size;
              
              if (additionalResponse?.nextPageToken) {
                countToken = additionalResponse.nextPageToken;
              } else {
                countToken = null;
                break;
              }
              extraSafety += 1;
            } catch (error) {
              console.error('Error in extra fetch:', error);
              break;
            }
          }
        }

        computedTotal = totalFilteredCount;
        
        // For Active tab, never use backend total - always use filtered count
        if (isActiveTab) {
          // Ensure we're using the filtered count, not backend total
          computedTotal = totalFilteredCount;
        }
      }

      // Final safeguard: For Active tab, never use backend total even if computedTotal is somehow wrong
      if (isActiveTab) {
        // Ignore backend total completely for Active tab
        // Always use the filtered count, which excludes zero-quantity listings
        // If we somehow got the backend total (140), force recalculation
        if (computedTotal === response?.total || computedTotal >= 140) {
          console.warn('⚠️ Active tab: Detected backend total being used, forcing recalculation from filtered results');
          // Use the filtered count we calculated
          computedTotal = totalFilteredCount;
        } else {
          // Make sure we're using the filtered count, not any estimate
          computedTotal = totalFilteredCount;
        }
      }

      tokensCopy[desiredPage] = nextToken;
      const updatedTokens = tokensCopy.slice(0, desiredPage + 1);

      setPageTokens(updatedTokens);
      setDataTable(pageListings);
      setTotalListings(computedTotal);
      setTotalPages(Math.max(1, Math.ceil(computedTotal / SELLER_LISTINGS_PAGE_SIZE)));
      setHasMorePages(Boolean(nextToken));
      setCurrentPage(desiredPage);
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

  const loadMoreLiveListings = async () => {
    if (!liveHasMore || liveLoadingMore) return;
    const uid =
      userInfo?.uid ||
      userInfo?.id ||
      userInfo?.user?.uid ||
      userInfo?.user?.id ||
      auth.currentUser?.uid;
    if (!uid) return;
    setLiveLoadingMore(true);
    try {
      const { listings, docs, hasMore } = await fetchLiveListingsFromFirestore(uid, {
        pageSize: 12,
        lastDoc: liveLastDocRef.current,
      });
      setDataTable((prev) => [...prev, ...listings]);
      liveLastDocRef.current = docs[docs.length - 1] ?? null;
      setLiveHasMore(hasMore);
    } catch (err) {
      if (__DEV__) console.warn('[Live tab] loadMore error:', err?.message);
    } finally {
      setLiveLoadingMore(false);
    }
  };

  // ✅ Fetch on mount
  const [isInitialFetchRefresh, setIsInitialFetchRefresh] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      resetPaginationState();
      fetchListingsPage(1);
    }
  }, [isFocused, isInitialFetchRefresh, activeTab]);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
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
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };
  // Pin search

  // Search
  const handleSearchSubmit = e => {
    const searchText = e.nativeEvent.text;
    setSearch(searchText);
    // trigger your search logic here
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const handleFilterView = () => {
    setLoading(true); // Show skeleton while applying filters
    resetPaginationState();
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
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
    setLoading(true); // Show skeleton while fetching with new tab filter
    
    // Handle Discounted tab - set discount flag and reset status
    if (pressTab === 'Discounted') {
      setIsDiscounted(true);
    } else {
      setIsDiscounted(false);
    }
    
    // Trigger refresh to apply new filter
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
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
    setIsInitialFetchRefresh(!isInitialFetchRefresh);
  };

  const onPressFilter = pressCode => {
    // Map pressCode to filter label
    const filterLabelMap = {
      'SORT': 'Sort',
      'GENUS': 'Genus',
      'VARIEGATION': 'Variegation',
      'LISTINGTYPE': 'Listing Type',
    };
    
    const filterLabel = filterLabelMap[pressCode];
    
    // If filter is active, clear it instead of opening the modal
    if (filterLabel && isFilterActive(filterLabel)) {
      clearSpecificFilter(filterLabel);
      return;
    }
    
    // Otherwise, open the filter modal as usual
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
  const onPressDelete = async () => {
    setLoading(true);
    setActionShowSheet(false);
    setDeleteModalVisible(false);
    try {
      let plantCode = selectedItemStockUpdate?.plantCode;
      const response = await postListingDeleteApi(plantCode);

      if (!response?.success) {
        throw new Error(response?.message || 'Post pin failed.');
      }
      resetPaginationState();
      await fetchListingsPage(1);
      setActionShowSheet(false);
      setDeleteModalVisible(false);
      Alert.alert('Delete Listing', 'Listing deleted successfully!');
    } catch (error) {
      console.log('Error pin table action:', error.message);
      Alert.alert('Delete item', error.message);
    } finally {
      setActionShowSheet(false);
      setDeleteModalVisible(false);
      setLoading(false);
    }
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
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexGrow: 0,
            paddingVertical: 20,
            paddingHorizontal: 20,
          }} // ✅ prevents extra vertical space
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
            {loading ? (
              <View style={styles.contents}>
                <ListingTableSkeleton rowCount={SELLER_LISTINGS_PAGE_SIZE} />
              </View>
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
        >
          <View
            style={{
              backgroundColor: '#fff',
              minHeight: dataTable.length != 0 && screenHeight * 0.9,
            }}>
            {loading ? (
              <View style={styles.contents}>
                <ListingTableSkeleton rowCount={SELLER_LISTINGS_PAGE_SIZE} />
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

      {/* Pagination Controls (hidden for Live tab — uses infinite scroll) */}
      {activeTab !== 'Live' && (
      <View style={styles.paginationWrapper}>
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              (currentPage <= 1 || loading) && styles.paginationButtonDisabled,
            ]}
            onPress={handlePreviousPage}
            disabled={currentPage <= 1 || loading}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.paginationButtonText,
                (currentPage <= 1 || loading) && styles.paginationButtonTextDisabled,
              ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>
            <Text style={styles.paginationSubtext}>
              {loading ? 'Loading...' : `${totalListings} total listings`}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              (!hasMorePages || loading) &&
                styles.paginationButtonDisabled,
            ]}
            onPress={handleNextPage}
            disabled={!hasMorePages || loading}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.paginationButtonText,
                (!hasMorePages || loading) &&
                  styles.paginationButtonTextDisabled,
              ]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
});
