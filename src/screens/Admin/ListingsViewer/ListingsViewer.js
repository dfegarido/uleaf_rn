import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/Admin/header';
import ArrowLeftIcon from '../../../assets/admin-icons/arrow-right.svg';
import SkeletonRow from './SkeletonRow';
import ListingRow from './ListingRow';
import TableHeader from './TableHeader';
import { IMAGE_CELL_TOTAL, IMAGE_CELL_WIDTH, IMAGE_CONTENT_GAP } from './constants';
import EmptyState from './EmptyState';
import SearchIcon from '../../../assets/admin-icons/search.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import { ReusableActionSheet } from '../../../components/ReusableActionSheet';
import GardenFilter from '../../../components/Admin/gardenFilter';
import { getAdminLeafTrailFilters } from '../../../components/Api/getAdminLeafTrail';
import { getAllPlantGenusApi, getListingTypeApi, getCountryApi, getShippingIndexApi, getAcclimationIndexApi } from '../../../components/Api/dropdownApi';
import { getVariegationApi } from '../../../components/Api/getVariegationApi';
// Import badge icons from buyer-icons following buyer shop pattern
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import HeartIcon from '../../../assets/buyer-icons/heart.svg';
// Import API
import { getAdminListingsApi } from '../../../components/Api/getAdminListingsApi';
import { postListingDeactivateActionApi } from '../../../components/Api/postListingDeactivateActionApi';
import { postListingActivateActionApi } from '../../../components/Api/postListingActivateActionApi';
import { Alert } from 'react-native';

const ListingsViewer = ({ navigation }) => {
  // Normalize garden/seller names to reduce mismatches (curly quotes, extra spaces)
  const normalizeGardenName = (s) => {
    if (!s && s !== 0) return null;
    try {
      const str = String(s).trim();
      // Replace curly apostrophes/quotes with straight apostrophe and collapse spaces
      return str.replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'").replace(/\s+/g, ' ').normalize('NFC');
    } catch (e) {
      return String(s);
    }
  };
  const [selectedFilters, setSelectedFilters] = useState({
    sort: null,
    status: null,
    genus: null,
    variegation: null,
    listingType: null,
    garden: null,
    country: null,
    shippingIndex: null,
    acclimationIndex: null,
  });

  // Sort modal state
  const [sortModalVisible, setSortModalVisible] = useState(false);
  // Status modal state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
    // Genus modal state
    const [genusModalVisible, setGenusModalVisible] = useState(false);
    const [genusOptionsState, setGenusOptionsState] = useState([]);
  const [listingTypeOptionsState, setListingTypeOptionsState] = useState([]);
  const [listingTypeLoading, setListingTypeLoading] = useState(false);
  // Local draft for listing type selections inside the modal. Commit on View.
  const [listingTypeDraft, setListingTypeDraft] = useState([]);
    // Local draft for genus selections inside the modal. This prevents
    // immediate mutation of `selectedFilters` while the user is choosing
    // options. Selections are committed only when the user presses View.
    const [genusDraft, setGenusDraft] = useState([]);
  // Loading indicator for genus dropdown options
  const [genusLoading, setGenusLoading] = useState(false);
    const [variegationOptionsState, setVariegationOptionsState] = useState([]);
  const [variegationLoading, setVariegationLoading] = useState(false);
    const [variegationModalVisible, setVariegationModalVisible] = useState(false);
    // Local draft for variegation selections inside the modal. Commit on View.
    const [variegationDraft, setVariegationDraft] = useState([]);
  const [listingTypeModalVisible, setListingTypeModalVisible] = useState(false);
  const [gardenOptionsState, setGardenOptionsState] = useState([]);
  const [gardenCounts, setGardenCounts] = useState({});
  const [gardenModalVisible, setGardenModalVisible] = useState(false);
  const [countryOptionsState, setCountryOptionsState] = useState([]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);
  // Local draft for country selections inside the modal. Commit on View.
  const [countryDraft, setCountryDraft] = useState([]);
  const [shippingIndexOptions, setShippingIndexOptions] = useState([]);
  const [shippingIndexLoading, setShippingIndexLoading] = useState(false);
  const [shippingIndexDraft, setShippingIndexDraft] = useState([]);
  const [shippingIndexModalVisible, setShippingIndexModalVisible] = useState(false);
  const [acclimationIndexOptions, setAcclimationIndexOptions] = useState([]);
  const [acclimationIndexModalVisible, setAcclimationIndexModalVisible] = useState(false);
  const [acclimationIndexLoading, setAcclimationIndexLoading] = useState(false);
  const [acclimationIndexDraft, setAcclimationIndexDraft] = useState([]);
    // Status options for admin (match backend values)
    const adminStatusOptions = [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Draft', value: 'draft' },
      { label: 'Discounted', value: 'discounted' },
      { label: 'Expired', value: 'expired' },
      { label: 'Out of Stock', value: 'out_of_stock' },
      { label: 'Sold', value: 'sold' }
    ];
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingPlantCodes, setActivatingPlantCodes] = useState({});
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [headerSearchVisible, setHeaderSearchVisible] = useState(false);
  const searchInputRef = React.useRef(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
  });
  const [error, setError] = useState(null);

  // Filter tabs configuration - following buyer shop pattern
  const filterTabs = [
    { label: 'Sort', leftIcon: SortIcon },
    { label: 'Status', rightIcon: DownIcon },
    { label: 'Genus', rightIcon: DownIcon },
    { label: 'Variegation', rightIcon: DownIcon },
    { label: 'Listing Type', rightIcon: DownIcon },
    { label: 'Garden', rightIcon: DownIcon },
    { label: 'Country', rightIcon: DownIcon },
    { label: 'Shipping Index', rightIcon: DownIcon },
    { label: 'Acclimation Index', rightIcon: DownIcon },
  ];

  // Admin sort options (match backend values)
  const adminSortOptions = [
    { label: 'Newest to Oldest', value: 'latest' },
    { label: 'Oldest to Newest', value: 'oldest' },
    { label: 'Price Low to High', value: 'priceLow' },
    { label: 'Price High to Low', value: 'priceHigh' },
    { label: 'Most Loved', value: 'mostLoved' },
  ];

  // Badge filter options - following buyer shop badge pattern
  const badgeFilters = [
    { id: 'latest', label: 'Latest Nursery Drop', icon: LeavesIcon },
    { id: 'below20', label: 'Below $20', icon: PriceTagIcon },
    { id: 'unicorn', label: 'Unicorn', icon: UnicornIcon },
    { id: 'wishlist', label: 'Top 5 Buyer Wish List', icon: Top5Icon },
    { id: 'sellers-fave', label: 'Sellers Fave', icon: HeartIcon },
  ];

  // Table columns configuration
  const tableColumns = [
  { key: 'image', label: 'Image', width: IMAGE_CELL_WIDTH },
    { key: 'code', label: 'Code + Status', width: 120 },
    { key: 'name', label: 'Name', width: 200 },
    { key: 'listingType', label: 'Listing Type', width: 140 },
    { key: 'size', label: 'Size', width: 90 },
    { key: 'quantity', label: 'Quantity', width: 100 },
    { key: 'localPrice', label: 'Local Price', width: 120 },
  { key: 'usdPrice', label: 'USD Price', width: 120 },
  { key: 'discount', label: 'Discount', width: 120 },
  { key: 'garden', label: 'Garden', width: 200 },
    { key: 'country', label: 'Country', width: 100 },
    { key: 'shippingIndex', label: 'Shipping Index', width: 120 },
    { key: 'acclimationIndex', label: 'Acclimation Index', width: 120 },
    { key: 'action', label: 'Action', width: 100 },
  ];

  useEffect(() => {
    loadListings();
  }, [selectedBadgeFilter, selectedFilters, pagination.currentPage]);

  // Use a columns array without 'image' for header/rows alignment
  const filteredColumns = tableColumns.filter(c => c.key !== 'image');

  const loadListings = async (opts = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare filters for API call
      const pageToUse = opts.page || pagination.currentPage;
      // If searching, use a larger limit for better results
      const isSearching = !!searchTerm && searchTerm.trim() !== '';
      const limitToUse = opts.limit || (isSearching ? 100 : pagination.itemsPerPage);

      // Build filters explicitly and exclude `status` so Listings Viewer no longer
      // requests status filtering from the backend. Other admin screens may still
      // send status when appropriate.
      const filters = {
        sort: selectedFilters.sort || undefined,
        status: selectedFilters.status || undefined,
        genus: selectedFilters.genus || undefined,
        variegation: selectedFilters.variegation || undefined,
        listingType: selectedFilters.listingType || undefined,
        garden: selectedFilters.garden || undefined,
        country: selectedFilters.country || undefined,
        shippingIndex: selectedFilters.shippingIndex || undefined,
        acclimationIndex: selectedFilters.acclimationIndex || undefined,
        search: isSearching ? searchTerm : undefined,
        page: pageToUse,
        limit: limitToUse,
      };

      // Add badge filter mappings
      if (selectedBadgeFilter) {
        switch (selectedBadgeFilter) {
          case 'latest':
            filters.sort = 'latest';
            break;
          case 'below20':
            filters.priceMax = 20;
            break;
          case 'unicorn':
            filters.rarity = 'unicorn';
            break;
          case 'wishlist':
            filters.isWishlist = true;
            break;
          case 'sellers-fave':
            filters.isSellersFave = true;
            break;
        }
      }

      // Debug logging for expired status filtering
      if (filters.status && filters.status.includes('expired')) {
        console.log('🔍 Filtering for EXPIRED status:', filters);
      }

      const response = await getAdminListingsApi(filters);

      if (response.success) {
        // Debug logging for expired status results
        if (filters.status && filters.status.includes('expired')) {
          console.log('📊 Expired status results:', {
            totalListings: response.data?.listings?.length || 0,
            pagination: response.data?.pagination,
            sampleListing: response.data?.listings?.[0] ? {
              id: response.data.listings[0].id,
              status: response.data.listings[0].status,
              expirationDate: response.data.listings[0].expirationDate,
              plantCode: response.data.listings[0].plantCode
            } : null
          });
        }
        // debug logs removed for performance
        // Before setting listings, if the admin requested price sorting, ensure
        // we sort by USD price on the client. Backend may sort by local price,
        // which leads to incorrect ordering when listings use different currencies.
        // Robust extraction of listings from various response shapes
        const extractListingsFromResponse = (resp) => {
          if (!resp) return [];
          // resp might be the full response.data or an array or nested shapes
          if (Array.isArray(resp)) return resp;
          if (Array.isArray(resp.listings)) return resp.listings;
          if (Array.isArray(resp.data)) return resp.data;
          if (Array.isArray(resp.data?.listings)) return resp.data.listings;
          if (Array.isArray(resp?.data?.data?.listings)) return resp.data.data.listings;
          if (Array.isArray(resp.list)) return resp.list; // legacy
          return [];
        };

        let pageListings = extractListingsFromResponse(response.data) || [];

        // Note: Backend already handles price sorting globally when sort is 'priceLow' or 'priceHigh'.
        // The backend fetches the full result set, sorts by finalPrice, and then paginates.
        // Therefore, we should NOT re-sort on the client side as it would only sort within the
        // current page and could cause incorrect ordering. The backend's global sort is the source of truth.

        setListings(pageListings);
        // Compute garden counts from ALL listings matching current filters (excluding garden filter)
        // This ensures accurate counts that match the total listings for each garden
        // Fire-and-forget: fetch all listings with current filters (excluding garden) to calculate accurate counts
        (async () => {
          try {
            // Build filters excluding garden filter to get all listings for accurate counts
            const countFilters = {
              sort: selectedFilters.sort || undefined,
              status: selectedFilters.status || undefined,
              genus: selectedFilters.genus || undefined,
              variegation: selectedFilters.variegation || undefined,
              listingType: selectedFilters.listingType || undefined,
              // Exclude garden filter to get counts for all gardens
              // garden: undefined,
              country: selectedFilters.country || undefined,
              shippingIndex: selectedFilters.shippingIndex || undefined,
              acclimationIndex: selectedFilters.acclimationIndex || undefined,
              search: isSearching ? searchTerm : undefined,
              page: 1,
              limit: 1000, // Fetch up to 1000 listings to calculate counts
            };

            // Add badge filter mappings
            if (selectedBadgeFilter) {
              switch (selectedBadgeFilter) {
                case 'latest':
                  countFilters.sort = 'latest';
                  break;
                case 'below20':
                  countFilters.priceMax = 20;
                  break;
                case 'unicorn':
                  countFilters.rarity = 'unicorn';
                  break;
                case 'wishlist':
                  countFilters.isWishlist = true;
                  break;
                case 'sellers-fave':
                  countFilters.isSellersFave = true;
                  break;
              }
            }

            const countResponse = await getAdminListingsApi(countFilters);
            if (countResponse && countResponse.success) {
              const extractListingsFromResponse = (respData) => {
                if (!respData) return [];
                if (Array.isArray(respData)) return respData;
                if (Array.isArray(respData.listings)) return respData.listings;
                if (Array.isArray(respData.data)) return respData.data;
                if (Array.isArray(respData.data?.listings)) return respData.data.listings;
                if (Array.isArray(respData?.data?.data?.listings)) return respData.data.data.listings;
                if (Array.isArray(respData.list)) return respData.list;
                return [];
              };

              const allListingsForCounts = extractListingsFromResponse(countResponse.data) || [];
              const counts = {};
              (allListingsForCounts || []).forEach(l => {
                // Prioritize sellerName from listing collection
                const raw = (l?.sellerName || l?.garden || l?.gardenOrCompanyName || l?.seller || null);
                const key = raw ? normalizeGardenName(raw) : null;
                if (!key) return;
                counts[key] = (counts[key] || 0) + 1;
              });
              setGardenCounts(counts);
            } else {
              // Fallback: use current page counts if full fetch fails
              const counts = {};
              (pageListings || []).forEach(l => {
                const raw = (l?.sellerName || l?.garden || l?.gardenOrCompanyName || l?.seller || null);
                const key = raw ? normalizeGardenName(raw) : null;
                if (!key) return;
                counts[key] = (counts[key] || 0) + 1;
              });
              setGardenCounts(counts);
            }
          } catch (e) {
            console.warn('Failed to compute gardenCounts from all listings', e?.message || e);
            // Fallback: use current page counts
            try {
              const counts = {};
              (pageListings || []).forEach(l => {
                const raw = (l?.sellerName || l?.garden || l?.gardenOrCompanyName || l?.seller || null);
                const key = raw ? normalizeGardenName(raw) : null;
                if (!key) return;
                counts[key] = (counts[key] || 0) + 1;
              });
              setGardenCounts(counts);
            } catch (fallbackError) {
              console.warn('Failed to compute gardenCounts fallback', fallbackError?.message || fallbackError);
            }
          }
        })();
        // Build garden options from the current page listings so the Garden
        // filter modal shows the gardens actually present in the listing set.
        // Prioritize sellerName from listing collection as the primary source.
        try {
          const gardens = Array.isArray(pageListings) ? pageListings.map(l => {
            // Use sellerName first (from listing collection), then fallback to other fields
            const raw = (l?.sellerName || l?.garden || l?.gardenOrCompanyName || l?.seller || null);
            return raw ? normalizeGardenName(raw) : null;
          }).filter(Boolean) : [];
          // de-duplicate and sort for stable UI
          const uniqueGardens = Array.from(new Set(gardens)).sort((a, b) => a.localeCompare(b));
          setGardenOptionsState(uniqueGardens);
          if (uniqueGardens.length === 0) {
            // Keep previous behavior: empty state handled by GardenFilter component
          }
          // Fire-and-forget: try to enrich garden options using the full filtered
          // result set so the Garden modal shows all gardens matching current filters.
          (async () => {
            try {
              const full = await fetchFullGardenList();
              if (Array.isArray(full) && full.length > 0) {
                // merge: keep page-derived uniqueGardens first, then append any
                // remaining gardens from full (both sets are already normalized)
                const merged = Array.from(new Set([...uniqueGardens, ...full]));
                setGardenOptionsState(merged.sort((a, b) => a.localeCompare(b)));
              }
            } catch (e) {
              // ignore enrichment failures
              // debug log removed
            }
          })();
        } catch (e) {
          console.warn('Failed to derive garden options from listings', e?.message || e);
        }
        // debug logs removed for performance
        // ensure pagination uses the page we requested when backend doesn't return one
        // Defensive: compute a sensible pagination fallback using any available counts
        const serverPagination = response.data?.pagination;
        let respPagination = serverPagination || null;

        // Determine total items fallback using several possible sources. Prefer server-provided totalItems,
        // then pagination.totalItems, then the length of the extracted pageListings, then response.data.listings length.
        if (!respPagination || typeof respPagination.totalPages !== 'number' || respPagination.totalPages <= 0) {
          const totalItemsFromServer = response.data?.totalItems || response.data?.count || response.data?.metadata?.totalItems || null;
          const totalItemsFromPagination = response.data?.pagination?.totalItems || null;
          const totalItemsFromListings = Array.isArray(pageListings) ? pageListings.length : 0;
          const totalItemsFallback = Number(totalItemsFromServer || totalItemsFromPagination || totalItemsFromListings || 0);

          let computedTotalPages = totalItemsFallback > 0 ? Math.max(1, Math.ceil(totalItemsFallback / limitToUse)) : 0;
          // If we have listings in the current page but computedTotalPages is 0 (server omitted counts), show at least 1 page
          if (computedTotalPages === 0 && Array.isArray(pageListings) && pageListings.length > 0) computedTotalPages = 1;

          respPagination = {
            currentPage: pageToUse,
            totalPages: computedTotalPages,
            totalItems: totalItemsFallback,
            itemsPerPage: limitToUse,
          };
          // debug log removed
        }

        setPagination(respPagination);
      } else {
        setError(response.error || 'Failed to load listings');
        setListings([]);
      }
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('An error occurred while loading listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (listing) => {
    if (!listing || !listing.plantCode) return;
    
    const isInactive = listing.status && listing.status.toLowerCase() === 'inactive';
    const action = isInactive ? 'activate' : 'deactivate';
    const actionCapitalized = isInactive ? 'Activate' : 'Deactivate';

    Alert.alert(
      `${actionCapitalized} listing`,
      `Are you sure you want to ${action} ${listing.plantCode}? ${isInactive ? 'The listing will be visible to buyers again.' : 'The listing will be hidden from buyers but can be reactivated later.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionCapitalized,
          style: isInactive ? 'default' : 'destructive',
          onPress: async () => {
            try {
              // mark this plantCode as processing so the row can disable its button
              setActivatingPlantCodes(prev => ({ ...prev, [listing.plantCode]: true }));
              setLoading(true);
              
              const resp = isInactive 
                ? await postListingActivateActionApi([listing.plantCode])
                : await postListingDeactivateActionApi([listing.plantCode]);
              
              if (resp.success) {
                // show success toast/alert
                Alert.alert(
                  actionCapitalized,
                  `Listing ${listing.plantCode} has been ${action}d successfully!`
                );
                // refresh current page
                await loadListings({ page: pagination.currentPage });
              } else {
                Alert.alert('Error', resp.message || resp.error || `Failed to ${action} listing`);
              }
            } catch (e) {
              console.error(`${actionCapitalized} listing error`, e);
              Alert.alert('Error', e.message || `Failed to ${action} listing`);
            } finally {
              // unmark processing state for this plantCode
              setActivatingPlantCodes(prev => {
                const copy = { ...prev };
                delete copy[listing.plantCode];
                return copy;
              });
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#23C16B';
      case 'reserved':
        return '#48A7F8';
      case 'unicorn':
        return '#6B4EFF';
      case 'pending':
        return '#FFB323';
      case 'unavailable':
        return '#E7522F';
      default:
        return '#23C16B';
    }
  };

  const handleFilterTabPress = (filterLabel) => {
    // Check if this filter is already active
    const isCurrentlyActive = isFilterActive(filterLabel);
    
    // If filter is active and clicked again, reset it instead of opening modal
    if (isCurrentlyActive) {
      handleResetFilter(filterLabel);
      return;
    }
    
    // Otherwise, open the appropriate modal
    if (filterLabel === 'Sort') {
      setSortModalVisible(true);
    } else {
        if (filterLabel === 'Status') {
          setStatusModalVisible(true);
        } else if (filterLabel === 'Genus') {
          setGenusModalVisible(true);
        } else if (filterLabel === 'Variegation') {
          setVariegationModalVisible(true);
        } else if (filterLabel === 'Listing Type') {
            // If we don't have listing type options yet, trigger the loading
            // flag immediately so the modal shows the skeleton on pop-in.
            if (!listingTypeOptionsState || listingTypeOptionsState.length === 0) {
              // Ensure loading flag is set before opening the modal so the sheet
              // can render skeletons immediately during pop-in. Use a micro-
              // task to allow React to process the state update first.
              setListingTypeLoading(true);
              setTimeout(() => setListingTypeModalVisible(true), 0);
            } else {
              setListingTypeLoading(false);
              setListingTypeModalVisible(true);
            }
        } else if (filterLabel === 'Garden') {
          setGardenModalVisible(true);
        } else if (filterLabel === 'Country') {
          setCountryModalVisible(true);
        } else if (filterLabel === 'Shipping Index') {
          setShippingIndexModalVisible(true);
        } else if (filterLabel === 'Acclimation Index') {
          setAcclimationIndexModalVisible(true);
        } else {
          // TODO: Open modal for other filters if needed
          // Filter pressed (debug log removed)
        }
    }
  };

  // For ReusableActionSheet
  const handleSortChange = (sortValue) => {
    setSelectedFilters((prev) => ({ ...prev, sort: sortValue }));
  };
  const handleSortView = () => {
    setSortModalVisible(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };
    // Status filter handlers
    const handleStatusChange = (statusValues) => {
      console.log('Status filter changed:', statusValues);
      setSelectedFilters((prev) => ({ ...prev, status: statusValues }));
    };
    const handleStatusView = () => {
      console.log('Status filter applied:', selectedFilters.status);
      setStatusModalVisible(false);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

  // Genus handlers
  const handleGenusChange = (values) => {
    // If the genus modal is open, update the local draft so user
    // interactions don't immediately mutate the active filters (and
    // cause `loadListings` to re-run). If the modal is not open, treat
    // changes as immediate updates to selectedFilters.
    const arr = Array.isArray(values) ? values : [];
    if (genusModalVisible) {
      setGenusDraft(arr);
    } else {
      setSelectedFilters((prev) => ({ ...prev, genus: arr }));
    }
  };

  // Initialize draft whenever the genus modal opens so the modal reflects
  // the current committed selection without instantly writing back while
  // the user toggles options.
  useEffect(() => {
    if (genusModalVisible) {
      try {
        setGenusDraft(Array.isArray(selectedFilters.genus) ? selectedFilters.genus.slice() : (selectedFilters.genus ? [selectedFilters.genus] : []));
      } catch (e) {
        setGenusDraft([]);
      }
    }
  }, [genusModalVisible]);

  // Genus modal fallback - should already be pre-loaded
  useEffect(() => {
    if (genusModalVisible && (!genusOptionsState || genusOptionsState.length === 0)) {
      setGenusLoading(true);
      (async () => {
        try {
          const res = await getAllPlantGenusApi();
          const mapped = Array.isArray(res?.data ? res.data : res) ? (res.data || res).map((g) => {
            if (!g) return null;
            if (typeof g === 'string') return { label: g, value: g, meta: '' };
            const name = g.genus_name || g.genusName || g.name || g.label || g.value;
            return { label: name, value: name, meta: g.count ? String(g.count) : '' };
          }).filter(Boolean) : [];
          setGenusOptionsState(mapped);
        } catch (e) {
          console.warn('Fallback genus load failed', e?.message || e);
        } finally {
          setGenusLoading(false);
        }
      })();
    }
  }, [genusModalVisible]);
  const handleGenusView = () => {
    (async () => {
      try {
        // Commit the draft selections to the active filters so loadListings
        // runs only now (on View). This avoids re-fetching listings while
        // the user is still toggling options in the modal.
        setSelectedFilters((prev) => ({ ...prev, genus: Array.isArray(genusDraft) ? genusDraft : [] }));

        // Ensure genus options are populated for future opens (fetch only if empty)
        if (!genusOptionsState || genusOptionsState.length === 0) {
          setGenusLoading(true);
          const res = await getAllPlantGenusApi();
          const mapped = Array.isArray(res?.data ? res.data : res) ? (res.data || res).map((g) => {
            if (!g) return null;
            if (typeof g === 'string') return { label: g, value: g, meta: '' };
            const name = g.genus_name || g.genusName || g.name || g.label || g.value;
            return { label: name, value: name, meta: g.count ? String(g.count) : '' };
          }).filter(Boolean) : [];
          setGenusOptionsState(mapped);
          setGenusLoading(false);
        }
      } catch (e) {
        console.warn('Fetch genus on View failed', e?.message || e);
      } finally {
        setGenusModalVisible(false);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    })();
  };

  // Variegation handlers
  const handleVariegationChange = (values) => {
    const arr = Array.isArray(values) ? values : [];
    if (variegationModalVisible) {
      setVariegationDraft(arr);
    } else {
      setSelectedFilters((prev) => ({ ...prev, variegation: arr }));
    }
  };
  const handleVariegationView = () => {
    // Commit draft selections and then close modal so loadListings triggers
    setSelectedFilters((prev) => ({ ...prev, variegation: Array.isArray(variegationDraft) ? variegationDraft : [] }));
    setVariegationModalVisible(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Initialize variegation draft when modal opens so the modal reflects current committed selection
  useEffect(() => {
    if (variegationModalVisible) {
      try {
        setVariegationDraft(Array.isArray(selectedFilters.variegation) ? selectedFilters.variegation.slice() : (selectedFilters.variegation ? [selectedFilters.variegation] : []));
      } catch (e) {
        setVariegationDraft([]);
      }
    }
  }, [variegationModalVisible]);

  // Listing Type handlers
  const handleListingTypeChange = (values) => {
    const arr = Array.isArray(values) ? values : [];
    if (listingTypeModalVisible) {
      setListingTypeDraft(arr);
    } else {
      setSelectedFilters((prev) => ({ ...prev, listingType: arr }));
    }
  };
  const handleListingTypeView = () => {
    // Commit draft selections and then close modal so loadListings triggers
    setSelectedFilters((prev) => ({ ...prev, listingType: Array.isArray(listingTypeDraft) ? listingTypeDraft : [] }));
    setListingTypeModalVisible(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Initialize listingType draft when modal opens so the modal reflects current committed selection
  useEffect(() => {
    if (listingTypeModalVisible) {
      try {
        setListingTypeDraft(Array.isArray(selectedFilters.listingType) ? selectedFilters.listingType.slice() : (selectedFilters.listingType ? [selectedFilters.listingType] : []));
      } catch (e) {
        setListingTypeDraft([]);
      }
    }
  }, [listingTypeModalVisible]);

  // Garden handlers
  const handleGardenSelect = (garden) => {
    setSelectedFilters((prev) => ({ ...prev, garden }));
    setGardenModalVisible(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Provide a helper to fetch the full set of listings for the current
  // selectedFilters so the GardenFilter modal can derive garden names
  // from the entire filtered result set (not just the current page). This
  // will be used by the modal when the user requests "View More" or when
  // auto-filling to reach PAGE_SIZE items.
  const fetchFullGardenList = async () => {
    try {
      // Reuse the same filters used by loadListings but request a large
      // limit so we retrieve all matching listings in one call. This keeps
      // garden derivation consistent with the table's data for the
      // currently-applied filters.
      const filters = {
        sort: selectedFilters.sort || undefined,
        status: selectedFilters.status || undefined,
        genus: selectedFilters.genus || undefined,
        variegation: selectedFilters.variegation || undefined,
        listingType: selectedFilters.listingType || undefined,
        garden: selectedFilters.garden || undefined,
        country: selectedFilters.country || undefined,
        shippingIndex: selectedFilters.shippingIndex || undefined,
        acclimationIndex: selectedFilters.acclimationIndex || undefined,
        search: (searchTerm && searchTerm.trim() !== '') ? searchTerm : undefined,
        page: 1,
        limit: 1000,
      };

      const resp = await getAdminListingsApi(filters);
      if (!resp || !resp.success) return [];
      // Extract listings robustly (same as loadListings)
      const extractListingsFromResponse = (respData) => {
        if (!respData) return [];
        if (Array.isArray(respData)) return respData;
        if (Array.isArray(respData.listings)) return respData.listings;
        if (Array.isArray(respData.data)) return respData.data;
        if (Array.isArray(respData.data?.listings)) return respData.data.listings;
        if (Array.isArray(respData?.data?.data?.listings)) return respData.data.data.listings;
        if (Array.isArray(respData.list)) return respData.list;
        return [];
      };

      const allListings = extractListingsFromResponse(resp.data) || [];
      // Prioritize sellerName from listing collection as the primary source for garden names
      const gardens = Array.isArray(allListings) ? allListings.map(l => {
        // Use sellerName first (from listing collection), then fallback to other fields
        const raw = (l?.sellerName || l?.garden || l?.gardenOrCompanyName || l?.seller || null);
        return raw ? normalizeGardenName(raw) : null;
      }).filter(Boolean) : [];
      const uniqueGardens = Array.from(new Set(gardens)).sort((a, b) => a.localeCompare(b));
      // Debug: show count and sample of gardens derived from the full listing fetch
      try {
  // fetchFullGardenList debug log removed
      } catch (e) { /* ignore */ }
      return uniqueGardens;
    } catch (e) {
      console.warn('fetchFullGardenList failed', e?.message || e);
      return [];
    }
  };

  // Country handlers
  const handleCountryChange = (values) => {
    const arr = Array.isArray(values) ? values : [];
    if (countryModalVisible) {
      setCountryDraft(arr);
    } else {
      setSelectedFilters((prev) => ({ ...prev, country: arr }));
    }
  };
  const handleCountryView = () => {
    // Commit draft and close modal
    setSelectedFilters((prev) => ({ ...prev, country: Array.isArray(countryDraft) ? countryDraft : [] }));
    setCountryModalVisible(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Shipping Index handlers (draft while modal open)
  const handleShippingIndexChange = (values) => {
    // ReusableActionSheet CheckBoxGroup returns array; we want a single value
    const arr = Array.isArray(values) ? values : [];
    if (shippingIndexModalVisible) {
      setShippingIndexDraft(arr);
    } else {
      const v = arr.length ? arr[0] : null;
      setSelectedFilters(prev => ({ ...prev, shippingIndex: v }));
    }
  };

  const handleShippingIndexView = () => {
    const v = Array.isArray(shippingIndexDraft) && shippingIndexDraft.length ? shippingIndexDraft[0] : null;
    setSelectedFilters(prev => ({ ...prev, shippingIndex: v }));
    setShippingIndexModalVisible(false);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Initialize shippingIndex draft when modal opens
  useEffect(() => {
    if (shippingIndexModalVisible) {
      try {
        setShippingIndexDraft(Array.isArray(selectedFilters.shippingIndex) ? selectedFilters.shippingIndex.slice() : (selectedFilters.shippingIndex ? [selectedFilters.shippingIndex] : []));
      } catch (e) {
        setShippingIndexDraft([]);
      }
    }
  }, [shippingIndexModalVisible]);

  // Acclimation Index handlers (draft while modal open)
  const handleAcclimationIndexChange = (values) => {
    const arr = Array.isArray(values) ? values : [];
    if (acclimationIndexModalVisible) {
      setAcclimationIndexDraft(arr);
    } else {
      const v = arr.length ? arr[0] : null;
      setSelectedFilters(prev => ({ ...prev, acclimationIndex: v }));
    }
  };

  const handleAcclimationIndexView = () => {
    const v = Array.isArray(acclimationIndexDraft) && acclimationIndexDraft.length ? acclimationIndexDraft[0] : null;
    setSelectedFilters(prev => ({ ...prev, acclimationIndex: v }));
    setAcclimationIndexModalVisible(false);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Initialize acclimationIndex draft when modal opens
  useEffect(() => {
    if (acclimationIndexModalVisible) {
      try {
        setAcclimationIndexDraft(Array.isArray(selectedFilters.acclimationIndex) ? selectedFilters.acclimationIndex.slice() : (selectedFilters.acclimationIndex ? [selectedFilters.acclimationIndex] : []));
      } catch (e) {
        setAcclimationIndexDraft([]);
      }
    }
  }, [acclimationIndexModalVisible]);

  // Initialize country draft when modal opens
  useEffect(() => {
    if (countryModalVisible) {
      try {
        setCountryDraft(Array.isArray(selectedFilters.country) ? selectedFilters.country.slice() : (selectedFilters.country ? [selectedFilters.country] : []));
      } catch (e) {
        setCountryDraft([]);
      }
    }
  }, [countryModalVisible]);

  // Pre-load all filter options on component mount for instant modal opening
  useEffect(() => {
    // Pre-load genus options
    (async () => {
      try {
        const res = await getAllPlantGenusApi();
        const mapped = Array.isArray(res?.data ? res.data : res) ? (res.data || res).map((g) => {
          if (!g) return null;
          if (typeof g === 'string') return { label: g, value: g, meta: '' };
          if (g.name) return { label: g.name, value: g.name, meta: (g.listingCount !== undefined ? String(g.listingCount) : (g.receivedPlants ? String(g.receivedPlants) : (g.count ? String(g.count) : ''))) };
          const name = g.genus_name || g.genusName || g.name || g.label || g.value;
          return { label: name, value: name, meta: g.count ? String(g.count) : '' };
        }).filter(Boolean) : [];
        setGenusOptionsState(mapped);
      } catch (e) {
        console.warn('Failed to pre-load genus options', e?.message || e);
      }
    })();

    // Pre-load variegation options
    (async () => {
      try {
        const resp = await getVariegationApi();
        const payload = Array.isArray(resp) ? resp : (resp.data || []);
        const mapped = payload.map(v => (typeof v === 'string' ? { label: v, value: v } : { label: v.name || v.label || v.variegation || v.value, value: v.name || v.label || v.variegation || v.value }));
        setVariegationOptionsState(mapped);
      } catch (e) {
        console.warn('Failed to pre-load variegation options', e?.message || e);
      }
    })();

    // Pre-load listing type options
    (async () => {
      try {
        const res = await getListingTypeApi();
        const payload = Array.isArray(res) ? res : (res.data || []);
        const mapped = payload.map(item => ({ label: item.name || item.listingType || item.label, value: item.name || item.listingType || item.value }));
        setListingTypeOptionsState(mapped);
      } catch (err) {
        console.warn('Failed to pre-load listing types', err?.message || err);
      }
    })();

    // Pre-load country options
    (async () => {
      try {
        const res = await getCountryApi();
        const payload = Array.isArray(res?.data) ? res.data : (res?.data || []);
        const mapped = payload.map(c => ({ label: c.name || c.country || c.label, value: c.code || c.country || c.name }));
        setCountryOptionsState(mapped);
      } catch (err) {
        console.warn('Failed to pre-load countries', err?.message || err);
      }
    })();

    // Pre-load shipping index options
    (async () => {
      try {
        const res = await getShippingIndexApi();
        const payload = Array.isArray(res?.data) ? res.data : (res?.data || []);
        const mapped = payload.map(item => (typeof item === 'string' ? { label: item, value: item } : { label: item.name || item.shippingIndex || item.label, value: item.name || item.shippingIndex || item.value }));
        setShippingIndexOptions(mapped);
      } catch (err) {
        console.warn('Failed to pre-load shipping index', err?.message || err);
      }
    })();

    // Pre-load acclimation index options
    (async () => {
      try {
        const res = await getAcclimationIndexApi();
        const payload = Array.isArray(res?.data) ? res.data : (res?.data || []);
        const mapped = payload.map(item => (typeof item === 'string' ? { label: item, value: item } : { label: item.name || item.acclimationIndex || item.label, value: item.name || item.acclimationIndex || item.value }));
        setAcclimationIndexOptions(mapped);
      } catch (err) {
        console.warn('Failed to pre-load acclimation index', err?.message || err);
      }
    })();

    // Pre-load flight dates
    (async () => {
      try {
        const res = await getAdminLeafTrailFilters();
        const payload = res?.flightDates || res?.data?.flightDates || [];
        const mapped = Array.isArray(payload) ? payload.map(d => (typeof d === 'string' ? d : (d.date || d.flight || String(d)))) : [];
        setFlightDatesState(mapped);
      } catch (err) {
        console.warn('Failed to pre-load flight dates', err?.message || err);
      }
    })();
  }, []);

  // The following useEffects are FALLBACKS only - data is now pre-loaded on mount.
  // They only run if pre-loading somehow failed.

  useEffect(() => {
    // Variegation - should already be pre-loaded
    if (variegationModalVisible && (!variegationOptionsState || variegationOptionsState.length === 0)) {
      setVariegationLoading(true);
      (async () => {
        try {
          const resp = await getVariegationApi();
          const payload = Array.isArray(resp) ? resp : (resp.data || []);
          const mapped = payload.map(v => (typeof v === 'string' ? { label: v, value: v } : { label: v.name || v.label || v.variegation || v.value, value: v.name || v.label || v.variegation || v.value }));
          setVariegationOptionsState(mapped);
        } catch (e) {
          console.warn('Fallback variegation load failed', e?.message || e);
        } finally {
          setVariegationLoading(false);
        }
      })();
    }
  }, [variegationModalVisible]);

  useEffect(() => {
    // Listing type - should already be pre-loaded
    if (listingTypeModalVisible && (!listingTypeOptionsState || listingTypeOptionsState.length === 0)) {
      setListingTypeLoading(true);
      (async () => {
        try {
          const res = await getListingTypeApi();
          const payload = Array.isArray(res) ? res : (res.data || []);
          const mapped = payload.map(item => ({ label: item.name || item.listingType || item.label, value: item.name || item.listingType || item.value }));
          setListingTypeOptionsState(mapped);
        } catch (err) {
          console.warn('Fallback listing type load failed', err?.message || err);
        } finally {
          setListingTypeLoading(false);
        }
      })();
    }
  }, [listingTypeModalVisible]);

  useEffect(() => {
    // Country - should already be pre-loaded
    if (countryModalVisible && (!countryOptionsState || countryOptionsState.length === 0)) {
      setCountryLoading(true);
      (async () => {
        try {
          const res = await getCountryApi();
          const payload = Array.isArray(res?.data) ? res.data : (res?.data || []);
          const mapped = payload.map(c => ({ label: c.name || c.country || c.label, value: c.code || c.country || c.name }));
          setCountryOptionsState(mapped);
        } catch (err) {
          console.warn('Fallback country load failed', err?.message || err);
        } finally {
          setCountryLoading(false);
        }
      })();
    }
  }, [countryModalVisible]);

  useEffect(() => {
    // Shipping index - should already be pre-loaded
    if (shippingIndexModalVisible && (!shippingIndexOptions || shippingIndexOptions.length === 0)) {
      setShippingIndexLoading(true);
      (async () => {
        try {
          const res = await getShippingIndexApi();
          const payload = Array.isArray(res?.data) ? res.data : (res?.data || []);
          const mapped = payload.map(item => (typeof item === 'string' ? { label: item, value: item } : { label: item.name || item.shippingIndex || item.label, value: item.name || item.shippingIndex || item.value }));
          setShippingIndexOptions(mapped);
        } catch (err) {
          console.warn('Fallback shipping index load failed', err?.message || err);
        } finally {
          setShippingIndexLoading(false);
        }
      })();
    }
  }, [shippingIndexModalVisible]);

  useEffect(() => {
    // Acclimation index - should already be pre-loaded
    if (acclimationIndexModalVisible && (!acclimationIndexOptions || acclimationIndexOptions.length === 0)) {
      setAcclimationIndexLoading(true);
      (async () => {
        try {
          const res = await getAcclimationIndexApi();
          const payload = Array.isArray(res?.data) ? res.data : (res?.data || []);
          const mapped = payload.map(item => (typeof item === 'string' ? { label: item, value: item } : { label: item.name || item.acclimationIndex || item.label, value: item.name || item.acclimationIndex || item.value }));
          setAcclimationIndexOptions(mapped);
        } catch (err) {
          console.warn('Fallback acclimation index load failed', err?.message || err);
        } finally {
          setAcclimationIndexLoading(false);
        }
      })();
    }
  }, [acclimationIndexModalVisible]);


  // Debug: log listing count at render-time when price sort is active
  useEffect(() => {
    // render-time debug log removed
  }, [selectedFilters.sort, listings.length]);

  const handleSearch = () => {
    // Always treat searchTerm as a string
    if (!searchTerm || searchTerm.trim() === '') {
      setSearchTerm('');
    }
    loadListings({ page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleBadgeFilterPress = (badgeId) => {
    // Toggle badge filter - if same badge clicked, deselect it
    if (selectedBadgeFilter === badgeId) {
      setSelectedBadgeFilter(null);
    } else {
      setSelectedBadgeFilter(badgeId);
    }
  };

  const handleListingPress = (listing) => {
  // listing click debug log removed
  };

  // Reset specific filter
  const handleResetFilter = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        setSelectedFilters((prev) => ({ ...prev, sort: null }));
        break;
      case 'Status':
        setSelectedFilters((prev) => ({ ...prev, status: null }));
        break;
      case 'Genus':
        setSelectedFilters((prev) => ({ ...prev, genus: null }));
        setGenusDraft([]);
        break;
      case 'Variegation':
        setSelectedFilters((prev) => ({ ...prev, variegation: null }));
        setVariegationDraft([]);
        break;
      case 'Listing Type':
        setSelectedFilters((prev) => ({ ...prev, listingType: null }));
        setListingTypeDraft([]);
        break;
      case 'Garden':
        setSelectedFilters((prev) => ({ ...prev, garden: null }));
        break;
      case 'Country':
        setSelectedFilters((prev) => ({ ...prev, country: null }));
        setCountryDraft([]);
        break;
      case 'Shipping Index':
        setSelectedFilters((prev) => ({ ...prev, shippingIndex: null }));
        setShippingIndexDraft([]);
        break;
      case 'Acclimation Index':
        setSelectedFilters((prev) => ({ ...prev, acclimationIndex: null }));
        setAcclimationIndexDraft([]);
        break;
      default:
        break;
    }
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setSelectedFilters({
      sort: null,
      status: null,
      genus: null,
      variegation: null,
      listingType: null,
      garden: null,
      country: null,
      shippingIndex: null,
      acclimationIndex: null,
    });
    
    // Reset all draft states
    setGenusDraft([]);
    setVariegationDraft([]);
    setListingTypeDraft([]);
    setCountryDraft([]);
    setShippingIndexDraft([]);
    setAcclimationIndexDraft([]);
    
    // Reset badge filter
    setSelectedBadgeFilter(null);
    
    // Reset search
    setSearchTerm('');
    setHeaderSearchVisible(false);
    
    // Reset pagination
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Helper function to check if a filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        return selectedFilters.sort !== null;
      case 'Status':
        // Consider Status active only when at least one status is selected.
        if (Array.isArray(selectedFilters.status)) return selectedFilters.status.length > 0;
        return selectedFilters.status !== null;
      case 'Genus':
        // Check if genus filter has any selected values
        if (Array.isArray(selectedFilters.genus)) return selectedFilters.genus.length > 0;
        return selectedFilters.genus !== null;
      case 'Variegation':
        // Check if variegation filter has any selected values
        if (Array.isArray(selectedFilters.variegation)) return selectedFilters.variegation.length > 0;
        return selectedFilters.variegation !== null;
      case 'Listing Type':
        // Check if listing type filter has any selected values
        if (Array.isArray(selectedFilters.listingType)) return selectedFilters.listingType.length > 0;
        return selectedFilters.listingType !== null;
      case 'Garden':
        return selectedFilters.garden !== null;
      case 'Country':
        // Check if country filter has any selected values
        if (Array.isArray(selectedFilters.country)) return selectedFilters.country.length > 0;
        return selectedFilters.country !== null;
      case 'Shipping Index':
        return selectedFilters.shippingIndex !== null;
      case 'Acclimation Index':
        return selectedFilters.acclimationIndex !== null;
      default:
        return false;
    }
  };

  // Filter Tab Button Component - following buyer shop pattern exactly
  // Memoized to prevent unnecessary re-renders during scroll
  const FilterTab = React.memo(({ filter, isActive, displayText, onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isActive ? '#23C16B' : '#CDD3D4',
          backgroundColor: isActive ? '#E8F5E9' : '#FFFFFF',
          padding: 8,
          marginTop: 5,
          flexDirection: 'row',
          alignItems: 'center',
          maxWidth: 200, // Prevent button from getting too wide
        }}
        activeOpacity={0.7}
      >
        {filter.leftIcon && (
          <filter.leftIcon
            width={20}
            height={20}
            style={{ marginRight: 4 }}
          />
        )}
        <Text 
          style={{
            fontSize: 14,
            fontWeight: isActive ? '600' : '500',
            color: isActive ? '#23C16B' : '#393D40',
            flexShrink: 1, // Allow text to shrink if needed
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
        {filter.rightIcon && (
          <filter.rightIcon
            width={20}
            height={20}
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if active state or display text changes
    return prevProps.isActive === nextProps.isActive && 
           prevProps.displayText === nextProps.displayText;
  });

  // Badge Filter Chip Component - following buyer shop PromoBadge pattern
  const BadgeFilterChip = ({ item, isSelected }) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        style={[styles.badgeFilterChip, isSelected && styles.badgeFilterChipSelected]}
        onPress={() => handleBadgeFilterPress(item.id)}
        activeOpacity={0.7}
      >
        {IconComponent && <IconComponent width={22} height={22} style={styles.badgeFilterIcon} />}
        <Text style={styles.badgeFilterText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const PaginationControls = () => {
    // Show pagination when:
    // 1. Server reports more than 1 page, OR
    // 2. Current page looks 'full' (listings length >= itemsPerPage) which suggests there may be additional pages, OR
    // 3. Server reports totalItems > itemsPerPage, OR
    // 4. There are any listings (show pagination even for single page to indicate current page and total count)
    const itemsPerPage = pagination.itemsPerPage || 50;
    const hasMultiplePages = typeof pagination.totalPages === 'number' && pagination.totalPages > 1;
    const looksLikeMorePages = Array.isArray(listings) && listings.length >= itemsPerPage;
    const totalItemsSuggestsMore = typeof pagination.totalItems === 'number' && pagination.totalItems > itemsPerPage;
    const hasListings = Array.isArray(listings) && listings.length > 0;

  const shouldShow = hasMultiplePages || looksLikeMorePages || totalItemsSuggestsMore || hasListings;
    if (!shouldShow) return null;

    const canGoPrev = pagination.currentPage > 1 && !loading;
    // If totalPages is known use it; otherwise infer that next may exist when
    // current page is full (listings length >= itemsPerPage)
    const canGoNext = !loading && ((typeof pagination.totalPages === 'number' && pagination.totalPages > 0)
      ? (pagination.currentPage < pagination.totalPages)
      : looksLikeMorePages);

    // Show loading placeholders when loading is active
    const totalPagesDisplay = loading 
      ? '...' 
      : ((typeof pagination.totalPages === 'number' && pagination.totalPages > 0) ? pagination.totalPages : '...');
    const totalItemsDisplay = loading 
      ? 'Loading...' 
      : ((typeof pagination.totalItems === 'number' && pagination.totalItems > 0) ? `${pagination.totalItems} total listings` : `${listings.length} listings on this page`);

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, (!canGoPrev || loading) && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!canGoPrev || loading}
        >
          <Text style={[styles.paginationButtonText, (!canGoPrev || loading) && styles.paginationButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {pagination.currentPage} of {totalPagesDisplay}
          </Text>
          <Text style={styles.paginationSubtext}>
            {totalItemsDisplay}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, (!canGoNext || loading) && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!canGoNext || loading}
        >
          <Text style={[styles.paginationButtonText, (!canGoNext || loading) && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  

  return (
    <SafeAreaProvider>
      {/* include bottom edge so pagination controls sit above device nav/gesture area */}
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <ScreenHeader
          navigation={navigation}
          title="Listings Viewer"
          search
          onSearchPress={() => {
            const next = !headerSearchVisible;
            setHeaderSearchVisible(next);
            if (next && searchInputRef && searchInputRef.current) {
              setTimeout(() => searchInputRef.current.focus(), 60);
            }
          }}
          searchActive={headerSearchVisible}
          searchValue={searchTerm}
          onSearchChange={(text) => setSearchTerm(text || '')}
          onSearchSubmit={() => { setHeaderSearchVisible(false); handleSearch(); }}
          inputRef={searchInputRef}
        />

        {/* Filter Tabs - following buyer shop pattern */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, paddingVertical: 4 }}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            paddingHorizontal: 10,
          }}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {filterTabs.map((filter) => {
            const isActive = isFilterActive(filter.label);
            // Get display text - show selected value if available, otherwise show label
            let displayText = filter.label;
            if (filter.label === 'Garden' && selectedFilters.garden) {
              const gardenName = String(selectedFilters.garden);
              displayText = gardenName.length > 20 ? gardenName.substring(0, 17) + '...' : gardenName;
            }
            return (
              <FilterTab 
                key={filter.label} 
                filter={filter}
                isActive={isActive}
                displayText={displayText}
                onPress={() => handleFilterTabPress(filter.label)}
              />
            );
          })}
        </ScrollView>

        {/* Sort Modal (matches buyer) */}
        <ReusableActionSheet
          code="SORT"
          visible={sortModalVisible}
          onClose={() => setSortModalVisible(false)}
          sortOptions={adminSortOptions}
          sortValue={selectedFilters.sort}
          sortChange={handleSortChange}
          handleSearchSubmit={handleSortView}
          clearFilters={() => handleResetFilter('Sort')}
        />

          {/* Status Modal (admin) */}
          <ReusableActionSheet
            code="STATUS"
            visible={statusModalVisible}
            onClose={() => setStatusModalVisible(false)}
            statusOptions={adminStatusOptions}
            statusValue={selectedFilters.status || []}
            statusChange={handleStatusChange}
            handleSearchSubmit={handleStatusView}
            clearFilters={() => handleResetFilter('Status')}
          />

          {/* Status Modal removed from Listings Viewer */}

            {/* Genus Modal */}
            <ReusableActionSheet
              code="GENUS"
              visible={genusModalVisible}
              onClose={() => setGenusModalVisible(false)}
              genusOptions={genusOptionsState}
              genusValue={genusModalVisible ? genusDraft : (selectedFilters.genus || [])}
              genusChange={handleGenusChange}
              genusLoading={genusLoading}
              handleSearchSubmit={handleGenusView}
              clearFilters={() => handleResetFilter('Genus')}
            />

          {/* Variegation Modal */}
          <ReusableActionSheet
            code="VARIEGATION"
            visible={variegationModalVisible}
            onClose={() => setVariegationModalVisible(false)}
            variegationOptions={variegationOptionsState}
            variegationValue={variegationModalVisible ? variegationDraft : (selectedFilters.variegation || [])}
            variegationChange={handleVariegationChange}
            variegationLoading={variegationLoading}
            handleSearchSubmit={handleVariegationView}
            clearFilters={() => handleResetFilter('Variegation')}
          />

          {/* Listing Type Modal */}
          <ReusableActionSheet
            code="LISTINGTYPE"
            visible={listingTypeModalVisible}
            onClose={() => setListingTypeModalVisible(false)}
            listingTypeOptions={listingTypeOptionsState}
            listingTypeValue={listingTypeModalVisible ? listingTypeDraft : (selectedFilters.listingType || [])}
            listingTypeChange={handleListingTypeChange}
            listingTypeLoading={listingTypeLoading}
            handleSearchSubmit={handleListingTypeView}
            clearFilters={() => handleResetFilter('Listing Type')}
          />

          {/* Garden Modal (Admin specific) */}
          <GardenFilter
            isVisible={gardenModalVisible}
            onClose={() => setGardenModalVisible(false)}
            onSelectGarden={handleGardenSelect}
            gardens={gardenOptionsState}
            gardenCounts={gardenCounts}
            fetchFullGardenList={fetchFullGardenList}
            currentGarden={selectedFilters.garden}
          />
          {/* Country Modal (reuse shared ActionSheet) */}
          <ReusableActionSheet
            code="COUNTRY"
            visible={countryModalVisible}
            onClose={() => setCountryModalVisible(false)}
            countryOptions={countryOptionsState}
            countryValue={countryModalVisible ? countryDraft : (selectedFilters.country || [])}
            countryChange={handleCountryChange}
            handleSearchSubmit={handleCountryView}
            clearFilters={() => handleResetFilter('Country')}
          />

            {/* Shipping Index Modal (reuse shared ActionSheet) */}
            <ReusableActionSheet
              code="SHIPPING_INDEX"
              visible={shippingIndexModalVisible}
              onClose={() => setShippingIndexModalVisible(false)}
              shippingIndexOptions={shippingIndexOptions}
              shippingIndexValue={shippingIndexModalVisible ? shippingIndexDraft : (selectedFilters.shippingIndex ? [selectedFilters.shippingIndex] : [])}
              shippingIndexChange={handleShippingIndexChange}
              shippingIndexLoading={shippingIndexLoading}
              handleSearchSubmit={handleShippingIndexView}
              clearFilters={() => handleResetFilter('Shipping Index')}
            />

            {/* Acclimation Index Modal (reuse shared ActionSheet) */}
            <ReusableActionSheet
              code="ACCLIMATION_INDEX"
              visible={acclimationIndexModalVisible}
              onClose={() => setAcclimationIndexModalVisible(false)}
              acclimationIndexOptions={acclimationIndexOptions}
              acclimationIndexValue={acclimationIndexModalVisible ? acclimationIndexDraft : (selectedFilters.acclimationIndex ? [selectedFilters.acclimationIndex] : [])}
              acclimationIndexChange={handleAcclimationIndexChange}
              acclimationIndexLoading={acclimationIndexLoading}
              handleSearchSubmit={handleAcclimationIndexView}
              clearFilters={() => handleResetFilter('Acclimation Index')}
            />


        {/* Badge Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgeFilterContainer}
          contentContainerStyle={styles.badgeFilterContent}
        >
          {badgeFilters.map((filter) => (
            <BadgeFilterChip
              key={filter.id}
              item={filter}
              isSelected={selectedBadgeFilter === filter.id}
            />
          ))}
        </ScrollView>

        {/* Table */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScrollContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          nestedScrollEnabled={true}
        >
          <View style={styles.tableContainer}>
            <TableHeader columns={tableColumns} imageWidth={IMAGE_CELL_TOTAL} />
            {loading ? (
              <View style={styles.skeletonContainer}>
                {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
              </View>
            ) : error ? (
              <EmptyState message={`Error: ${error}`} />
            ) : listings.length === 0 ? (
              <EmptyState message="No listings found" />
            ) : (
                  <ScrollView
                    style={styles.tableContent}
                    contentContainerStyle={styles.tableContentContainer}
                    nestedScrollEnabled={true}
                  >
                    {listings.map((listing) => (
                      <ListingRow
                        key={listing.id}
                        listing={listing}
                        onPress={handleListingPress}
                        columns={filteredColumns}
                        onToggleStatus={handleToggleStatus}
                        isProcessing={!!activatingPlantCodes[listing.plantCode]}
                        activeStatusFilter={selectedFilters.status}
                      />
                    ))}
                  </ScrollView>
                )}
          </View>
        </ScrollView>

        {/* Pagination Controls (render inline below the table so it follows content) */}
        <View style={styles.paginationWrapper}>
          <PaginationControls />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // headerBar and headerTitle replaced by shared ScreenHeader component
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  headerSearchAction: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  // Badge Filter Styles (following buyer shop PromoBadge pattern exactly)
  badgeFilterContainer: {
    // Allow badge row to expand if chips wrap to multiple lines
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
    flexGrow: 0,
    paddingVertical: 4,
  },
  badgeFilterContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  badgeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 5,
    flexShrink: 0,
    minHeight: 36,
    maxWidth: 220,
  },
  badgeFilterChipSelected: {
    backgroundColor: '#C0DAC2',
  },
  badgeFilterIcon: {
    marginRight: 8,
  },
  badgeFilterText: {
    color: '#393D40',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  // Table Styles
  tableScrollContainer: {
    flex: 1,
    marginTop: 12,
    // small bottom padding only; pagination is inline now so large padding is not needed
    paddingBottom: 0,
  },
  tableContainer: {
    minWidth: 1992,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: '#E4E7E9',
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
    height: 36,
  },
  headerCell: {
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  headerTextBold: {
    fontWeight: '700',
    color: '#202325',
  },
  tableContent: {
    flex: 1,
  },
  tableContentContainer: {
    flexGrow: 1,
    paddingBottom: 24, // small breathing room under rows before inline pagination
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
  },
  plantImage: {
    width: IMAGE_CELL_WIDTH,
    height: IMAGE_CELL_WIDTH,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    overflow: 'hidden',
  },
  plantImageActual: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
    color: '#647276',
  },
  contentContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  columnCell: {
    justifyContent: 'flex-start',
    gap: 6,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  plantName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  plantVariegation: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  listingTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#202325',
    borderRadius: 8,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sizeCard: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
    minHeight: 28,
    minWidth: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    gap: 4,
  },
  discountText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  gardenName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  infoText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  skeletonContainer: {
    paddingVertical: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
    backgroundColor: '#FFFFFF',
  },
  skeletonImage: {
    width: IMAGE_CELL_WIDTH,
    height: IMAGE_CELL_WIDTH,
    borderRadius: 12,
    backgroundColor: '#ECEFF0',
  },
  skeletonCells: {
    flex: 1,
  },
  skeletonLineShort: {
    width: '30%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#ECEFF0',
    marginBottom: 8,
  },
  skeletonLineLong: {
    width: '60%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F3F5F5',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#23C16B',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  paginationWrapper: {
    // Inline wrapper placed after the table content so pagination appears
    // naturally below the listings instead of overlaying them.
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#23C16B',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
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

export default ListingsViewer;
