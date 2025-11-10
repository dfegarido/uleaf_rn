import React, {useRef, useState, useEffect} from 'react';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../../../components/Admin/header';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import { getAdminOrdersApi } from '../../../components/Api/adminOrderApi';
import { ReusableActionSheet } from '../../../components/ReusableActionSheet';
import { getAllPlantGenusApi, getListingTypeApi } from '../../../components/Api/dropdownApi';
import { getVariegationApi } from '../../../components/Api/getVariegationApi';
import PlantFlightFilter from '../../../components/Admin/plantFlightFilter';
import GardenFilter from '../../../components/Admin/gardenFilter';
import BuyerFilter from '../../../components/Admin/buyerFilter';
import ReceiverFilter from '../../../components/Admin/receiverFilter';
import DateRangeFilter from '../../../components/Admin/dateRangeFilter';
import { getAdminLeafTrailFilters } from '../../../components/Api/getAdminLeafTrail';
import OrderTableSkeleton from './OrderTableSkeleton';

const filterTabs = [
  { label: 'Sort', leftIcon: SortIcon },
  { label: 'Genus', rightIcon: DownIcon },
  { label: 'Variegation', rightIcon: DownIcon },
  { label: 'Listing Type', rightIcon: DownIcon },
  { label: 'Garden', rightIcon: DownIcon },
  { label: 'Buyer', rightIcon: DownIcon },
  { label: 'Receiver', rightIcon: DownIcon },
  { label: 'Plant Flight', rightIcon: DownIcon },
  { label: 'Date Range', rightIcon: DownIcon },
];


const TABLE_COLUMNS = [
  {key: 'image', label: 'Orders', width: 116},
  {key: 'orderInfo', label: 'Transaction Number & Date(s)', width: 240},
  {key: 'plantCode', label: 'Plant Code', width: 100},
  {key: 'plantName', label: 'Plant Name', width: 200},
  {key: 'listingType', label: 'Listing Type', width: 140},
  {key: 'size', label: 'Pot Size(s)', width: 90, align: 'center'},
  {key: 'quantity', label: 'Quantity', width: 100, align: 'center'},
  {key: 'localPrice', label: 'Local Price', width: 120, align: 'center'},
  {key: 'usdPrice', label: 'USD Price', width: 120, align: 'center'},
  {key: 'garden', label: 'Garden & Seller', width: 200},
  {key: 'buyer', label: 'Buyer', width: 200},
  {key: 'receiver', label: 'Receiver', width: 200},
  {key: 'plantFlight', label: 'Plant Flight', width: 140},
];

const OrderSummary = ({navigation}) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('readyToFly');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const searchInputRef = useRef(null);
  
  // Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    sort: null,
    genus: null,
    variegation: null,
    listingType: null,
    garden: null,
    buyer: null,
    receiver: null,
    dateRange: null,
    plantFlight: null,
  });
  
  // Modal states
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [genusModalVisible, setGenusModalVisible] = useState(false);
  const [genusOptionsState, setGenusOptionsState] = useState([]);
  const [genusDraft, setGenusDraft] = useState([]);
  const [genusLoading, setGenusLoading] = useState(false);
  
  const [variegationModalVisible, setVariegationModalVisible] = useState(false);
  const [variegationOptionsState, setVariegationOptionsState] = useState([]);
  const [variegationDraft, setVariegationDraft] = useState([]);
  const [variegationLoading, setVariegationLoading] = useState(false);
  
  const [listingTypeModalVisible, setListingTypeModalVisible] = useState(false);
  const [listingTypeOptionsState, setListingTypeOptionsState] = useState([]);
  const [listingTypeDraft, setListingTypeDraft] = useState([]);
  const [listingTypeLoading, setListingTypeLoading] = useState(false);
  
  const [gardenModalVisible, setGardenModalVisible] = useState(false);
  const [gardenOptionsState, setGardenOptionsState] = useState([]);
  const [gardenCounts, setGardenCounts] = useState({});

  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [buyerOptionsState, setBuyerOptionsState] = useState([]);

  const [receiverModalVisible, setReceiverModalVisible] = useState(false);
  const [receiverOptionsState, setReceiverOptionsState] = useState([]);

  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);

  const [flightModalVisible, setFlightModalVisible] = useState(false);
  const [flightDatesState, setFlightDatesState] = useState([]);

  const TABS = [
    {id: 'readyToFly', label: 'Ready To Fly', active: true, tabWidth: 103, contentWidth: 103, indicatorWidth: 103},
    {id: 'completed', label: 'Completed', active: false, tabWidth: 105, contentWidth: 105, indicatorWidth: 105},
    {id: 'wildgone', label: 'Wildgone', active: false, tabWidth: 100, contentWidth: 93, indicatorWidth: 100, badge: true},
  ];

  // Sort options (matching Listings Viewer)
  const adminSortOptions = [
    { label: 'Newest to Oldest', value: 'latest' },
    { label: 'Oldest to Newest', value: 'oldest' },
    { label: 'Price Low to High', value: 'priceLow' },
    { label: 'Price High to Low', value: 'priceHigh' },
  ];

  // Helper function to format dates
  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Helper function to safely convert error to string
  const errorToString = (err) => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    if (typeof err?.toString === 'function') {
      try {
        return err.toString();
      } catch (e) {
        return 'An error occurred';
      }
    }
    try {
      return String(err);
    } catch (e) {
      return 'An error occurred';
    }
  };

  // Map order data to table row format
  const mapOrderToTableRow = (order) => {

    const formatPrice = (price, currency = 'USD') => {
      if (!price || price === 0) return '—';
      return `${currency === 'USD' ? '$' : currency}${price.toFixed(2)}`;
    };

    // Check multiple possible image field names
    const imageUrl = order.imagePrimary || 
                     order.imageUrl || 
                     order.plantImageUrl || 
                     order.image || 
                     order.plantImage || 
                     order.thumbnailUrl ||
                     order.listing?.imageUrl ||
                     order.listing?.image ||
                     order.listing?.images?.[0] ||
                     order.listingData?.imageUrl ||
                     order.listingData?.image ||
                     order.listingData?.images?.[0] ||
                     order.plantData?.imageUrl ||
                     order.plantData?.image ||
                     (order.images && order.images.length > 0 ? order.images[0] : null) ||
                     (order.plantImages && order.plantImages.length > 0 ? order.plantImages[0] : null);

    console.log('Order image URL:', imageUrl, 'for order:', order.id);

    // Extract price data - check multiple possible field names
    let localPrices, usdPrices;
    
    // Log all price-related fields for debugging (first order only)
    if (order.transactionNumber) {
      console.log(`Order ${order.transactionNumber} price fields:`, {
        localPrices: order.localPrices,
        localPrice: order.localPrice,
        usdPrices: order.usdPrices,
        usdPrice: order.usdPrice,
        totalPrice: order.totalPrice,
        totalUsdPrice: order.totalUsdPrice,
        price: order.price,
        productTotal: order.productTotal,
        allKeys: Object.keys(order).filter(k => k.toLowerCase().includes('price'))
      });
    }
    
    if (order.localPrices && Array.isArray(order.localPrices) && order.localPrices.length > 0) {
      localPrices = order.localPrices;
    } else if (order.localPrice !== undefined && order.localPrice !== null) {
      localPrices = [order.localPrice];
    } else if (order.totalPrice !== undefined && order.totalPrice !== null) {
      localPrices = [order.totalPrice];
    } else if (order.price !== undefined && order.price !== null) {
      localPrices = [order.price];
    } else if (order.productTotal !== undefined && order.productTotal !== null) {
      localPrices = [order.productTotal];
    } else {
      // Don't default to [0], use empty array to show nothing
      localPrices = [];
    }
    
    if (order.usdPrices && Array.isArray(order.usdPrices) && order.usdPrices.length > 0) {
      usdPrices = order.usdPrices;
    } else if (order.usdPrice !== undefined && order.usdPrice !== null) {
      usdPrices = [order.usdPrice];
    } else if (order.totalUsdPrice !== undefined && order.totalUsdPrice !== null) {
      usdPrices = [order.totalUsdPrice];
    } else if (order.totalPrice !== undefined && order.totalPrice !== null) {
      usdPrices = [order.totalPrice];
    } else if (order.price !== undefined && order.price !== null) {
      usdPrices = [order.price];
    } else if (order.productTotal !== undefined && order.productTotal !== null) {
      usdPrices = [order.productTotal];
    } else {
      // Don't default to [0], use empty array to show nothing
      usdPrices = [];
    }

    // Helper to safely format dates - use formatted dates from backend if available
    const safeFormatDate = (dateValue, formattedValue) => {
      if (formattedValue && typeof formattedValue === 'string') {
        return formattedValue;
      }
      if (!dateValue) return '—';
      // If it's already a string, return it
      if (typeof dateValue === 'string') return dateValue;
      // Otherwise, try to format it
      try {
        return formatDate(dateValue);
      } catch (e) {
        return '—';
      }
    };

    return {
      id: order.id,
      imageUrl: imageUrl,
      transactionNumber: (order.transactionNumber || '—').toString(),
      orderDate: safeFormatDate(order.orderDate || order.createdAt, order.orderDateFormatted || order.createdAtFormatted),
      deliveredDate: safeFormatDate(order.deliveredDate, order.deliveredDateFormatted),
      receivedDate: safeFormatDate(order.receivedDate, order.receivedDateFormatted),
      plantCode: (order.plantCode || '—').toString(),
      genus: (order.genus || '—').toString(),
      species: (order.species || '').toString(),
      variegation: ((order.variegation || order.variations || '')).toString(),
      listingType: (order.listingType || '—').toString(),
      potSizes: order.potSizeVariations || [order.potSizeVariation || '—'],
      quantities: order.quantities || [order.orderQty || '—'],
      localPrices: localPrices,
      usdPrices: usdPrices,
      localCurrency: order.localPriceCurrency || 'USD',
      localCurrencySymbol: order.localPriceCurrencySymbol || '$',
      gardenName: (order.gardenOrCompanyName || '—').toString(),
      sellerName: (order.sellerName || '—').toString(),
      buyerFirstName: (order.buyerInfo?.firstName || '').toString() || '—',
      buyerLastName: (order.buyerInfo?.lastName || '').toString() || '',
      buyerUsername: (order.buyerInfo?.username || '').toString() || '',
      receiverName: (order.deliveryDetails?.receiverName || '').toString() || '—',
      receiverUsername: (order.deliveryDetails?.receiverUsername || '').toString() || '',
      plantFlight: safeFormatDate(order.flightDate, order.flightDateFormatted) || '—',
    };
  };

  // Fetch orders data
  const fetchOrders = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug plant flight filter
      if (selectedFilters.plantFlight) {
        console.log('Plant Flight Filter Active:', selectedFilters.plantFlight);
      }

      const response = await getAdminOrdersApi({
        status: activeTab,
        limit: 50,
        page: page,
        search: searchTerm.trim() || undefined,
        sort: selectedFilters.sort || undefined,
        genus: selectedFilters.genus || undefined,
        variegation: selectedFilters.variegation || undefined,
        listingType: selectedFilters.listingType || undefined,
        garden: selectedFilters.garden || undefined,
        buyer: selectedFilters.buyer || undefined,
        receiver: selectedFilters.receiver || undefined,
        dateRange: selectedFilters.dateRange || undefined,
        plantFlight: selectedFilters.plantFlight || undefined,
      });

      if (response.success && response.orders) {
        console.log('Orders API response:', {
          success: response.success,
          ordersCount: response.orders.length,
          total: response.total,
          totalPages: response.totalPages,
          currentPage: response.currentPage
        });
        if (response.orders.length > 0) {
          console.log('Full order data from API (first order):', JSON.stringify(response.orders[0], null, 2));
        } else {
          console.log('No orders returned from API. This might be due to filtering or no orders in the database.');
        }
        
        // Debug: Log price fields from first few orders
        if (response.orders.length > 0) {
          console.log('Price data in orders:', response.orders.slice(0, 5).map((o, i) => ({
            index: i,
            transactionNumber: o.transactionNumber,
            localPrice: o.localPrice,
            usdPrice: o.usdPrice,
            localPrices: o.localPrices,
            usdPrices: o.usdPrices,
            totalPrice: o.totalPrice,
            totalUsdPrice: o.totalUsdPrice,
            localPriceCurrency: o.localPriceCurrency
          })));
        }
        
        const mappedOrders = response.orders.map(mapOrderToTableRow);
        setOrders(mappedOrders);
        
        // Update pagination info
        setTotalOrders(response.total || response.orders.length);
        setTotalPages(response.totalPages || Math.ceil((response.total || response.orders.length) / 50));
        setCurrentPage(page);

        // Use garden options from backend response (includes all gardens from filtered orders, not just current page)
        // Fallback to deriving from current page if backend doesn't provide gardens
        try {
          if (response.gardens && Array.isArray(response.gardens)) {
            // Use complete garden list from backend
            setGardenOptionsState(response.gardens);
            setGardenCounts(response.gardenCounts || {});
            console.log('Using gardens from backend response:', {
              count: response.gardens.length,
              sample: response.gardens.slice(0, 10)
            });
          } else {
            // Fallback: derive from current page orders (backward compatibility)
            const counts = {};
            const gardens = Array.isArray(response.orders) ? response.orders.map(order => {
              const gardenName = order.gardenOrCompanyName || order.garden || order.gardenName || null;
              if (gardenName) {
                counts[gardenName] = (counts[gardenName] || 0) + 1;
              }
              return gardenName;
            }).filter(Boolean) : [];
            
            const uniqueGardens = Array.from(new Set(gardens)).sort((a, b) => a.localeCompare(b));
            setGardenOptionsState(uniqueGardens);
            setGardenCounts(counts);
            console.warn('Backend did not provide gardens, falling back to current page extraction');
          }
        } catch (e) {
          console.warn('Failed to set garden options', e?.message || e);
        }

        // Use buyer options from backend response (includes all buyers from filtered orders, not just current page)
        // Fallback to deriving from current page if backend doesn't provide buyers
        try {
          if (response.buyers && Array.isArray(response.buyers)) {
            // Use complete buyer list from backend
            setBuyerOptionsState(response.buyers);
            console.log('Using buyers from backend response:', {
              count: response.buyers.length,
              sample: response.buyers.slice(0, 10).map(b => b.name)
            });
          } else {
            // Fallback: derive from current page orders (backward compatibility)
            const buyersMap = new Map();
            if (Array.isArray(response.orders)) {
              response.orders.forEach(order => {
                if (order.buyerInfo && order.buyerUid) {
                  const buyerId = order.buyerUid;
                  const buyerName = `${order.buyerInfo.firstName || ''} ${order.buyerInfo.lastName || ''}`.trim();
                  const buyerAvatar = order.buyerInfo.avatar || order.buyerInfo.profileImage || 'https://via.placeholder.com/40';
                  
                  if (!buyersMap.has(buyerId) && buyerName) {
                    buyersMap.set(buyerId, {
                      id: buyerId,
                      name: buyerName,
                      avatar: buyerAvatar,
                    });
                  }
                }
              });
            }
            const uniqueBuyers = Array.from(buyersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            setBuyerOptionsState(uniqueBuyers);
            console.warn('Backend did not provide buyers, falling back to current page extraction');
          }
        } catch (e) {
          console.warn('Failed to set buyer options', e?.message || e);
        }

        // Build receiver options from the current page orders
        try {
          const receiversMap = new Map();
          if (Array.isArray(response.orders)) {
            response.orders.forEach((order, index) => {
              // Debug first order to see structure
              if (index === 0) {
                console.log('Sample order deliveryDetails:', order.deliveryDetails);
                console.log('Sample order receiver fields:', {
                  receiverId: order.receiverId,
                  hubReceiverId: order.hubReceiverId,
                  deliveryDetailsReceiverId: order.deliveryDetails?.receiverId,
                  deliveryDetailsReceiverUid: order.deliveryDetails?.receiverUid,
                  deliveryDetailsReceiverName: order.deliveryDetails?.receiverName,
                });
                console.log('Sample order flightDate:', order.flightDate);
                console.log('Sample order flightDate type:', typeof order.flightDate);
                console.log('Sample order createdAt:', order.createdAt);
                console.log('Sample order createdAt type:', typeof order.createdAt);
              }
              
              if (order.deliveryDetails) {
                // Try multiple possible receiver ID fields
                const receiverId = order.deliveryDetails.receiverId || 
                                 order.deliveryDetails.receiverUid ||
                                 order.receiverId ||
                                 order.hubReceiverId;
                const receiverName = order.deliveryDetails.receiverName || '';
                const receiverAvatar = order.deliveryDetails.receiverAvatar || 
                                     order.deliveryDetails.receiverProfileImage || 
                                     'https://via.placeholder.com/40';
                
                if (receiverId && receiverName && !receiversMap.has(receiverId)) {
                  receiversMap.set(receiverId, {
                    id: receiverId,
                    name: receiverName,
                    avatar: receiverAvatar,
                  });
                }
              }
            });
          }
          const uniqueReceivers = Array.from(receiversMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          console.log('Extracted receivers:', uniqueReceivers.length, uniqueReceivers);
          setReceiverOptionsState(uniqueReceivers);
        } catch (e) {
          console.warn('Failed to derive receiver options from orders', e?.message || e);
        }
      } else {
        setError('Failed to fetch orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      // Ensure error is always a string, never an object
      const errorMessage = errorToString(err) || 'Failed to fetch orders';
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Pre-load common filter options on component mount
  useEffect(() => {
    // Pre-load genus options
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

    // Note: Buyers and receivers are now extracted from orders in fetchOrders()
    // Flight dates could be pre-loaded but we'll extract them from orders too for consistency
  }, []);

  // Load orders on component mount and when activeTab changes
  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(1);
  }, [activeTab]);

  // Load orders when search term changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      if (searchTerm !== '') {
        console.log('Search term:', searchTerm);
        fetchOrders(1);
      } else {
        // Reload all orders when search is cleared
        fetchOrders(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Refetch orders when filters change
  useEffect(() => {
    if (currentPage === 1) {
      fetchOrders(1);
    }
  }, [selectedFilters]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchOrders(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchOrders(currentPage + 1);
    }
  };

  // Filter Tab press handler
  const handleFilterTabPress = (filterLabel) => {
    // If filter is already active, reset it instead of opening modal
    if (isFilterActive(filterLabel)) {
      handleResetFilter(filterLabel);
      return;
    }

    // Open the appropriate modal
    if (filterLabel === 'Sort') {
      setSortModalVisible(true);
    } else if (filterLabel === 'Genus') {
      setGenusModalVisible(true);
    } else if (filterLabel === 'Variegation') {
      setVariegationModalVisible(true);
    } else if (filterLabel === 'Listing Type') {
      if (!listingTypeOptionsState || listingTypeOptionsState.length === 0) {
        setListingTypeLoading(true);
        setTimeout(() => setListingTypeModalVisible(true), 0);
      } else {
        setListingTypeLoading(false);
        setListingTypeModalVisible(true);
      }
    } else if (filterLabel === 'Garden') {
      setGardenModalVisible(true);
    } else if (filterLabel === 'Buyer') {
      setBuyerModalVisible(true);
    } else if (filterLabel === 'Receiver') {
      console.log('Opening Receiver Modal', receiverOptionsState);
      setReceiverModalVisible(true);
    } else if (filterLabel === 'Date Range') {
      setDateRangeModalVisible(true);
    } else if (filterLabel === 'Plant Flight') {
      setFlightModalVisible(true);
    }
  };

  // Reset specific filter
  const handleResetFilter = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        setSelectedFilters((prev) => ({ ...prev, sort: null }));
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
      case 'Buyer':
        setSelectedFilters((prev) => ({ ...prev, buyer: null }));
        break;
      case 'Receiver':
        setSelectedFilters((prev) => ({ ...prev, receiver: null }));
        break;
      case 'Date Range':
        setSelectedFilters((prev) => ({ ...prev, dateRange: null }));
        break;
      case 'Plant Flight':
        setSelectedFilters((prev) => ({ ...prev, plantFlight: null }));
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

  // Sort handlers
  const handleSortChange = (sortValue) => {
    setSelectedFilters((prev) => ({ ...prev, sort: sortValue }));
  };
  const handleSortView = () => {
    setSortModalVisible(false);
    setCurrentPage(1);
  };

  // Genus handlers
  const handleGenusChange = (values) => {
    const arr = Array.isArray(values) ? values : [];
    if (genusModalVisible) {
      setGenusDraft(arr);
    } else {
      setSelectedFilters((prev) => ({ ...prev, genus: arr }));
    }
  };
  const handleGenusView = () => {
    setSelectedFilters((prev) => ({ ...prev, genus: Array.isArray(genusDraft) ? genusDraft : [] }));
    setGenusModalVisible(false);
    setCurrentPage(1);
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
    setSelectedFilters((prev) => ({ ...prev, variegation: Array.isArray(variegationDraft) ? variegationDraft : [] }));
    setVariegationModalVisible(false);
    setCurrentPage(1);
  };

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
    setSelectedFilters((prev) => ({ ...prev, listingType: Array.isArray(listingTypeDraft) ? listingTypeDraft : [] }));
    setListingTypeModalVisible(false);
    setCurrentPage(1);
  };

  // Garden handlers
  const handleGardenSelect = (garden) => {
    setSelectedFilters((prev) => ({ ...prev, garden }));
    setGardenModalVisible(false);
    setCurrentPage(1);
  };

  // Buyer handlers
  const handleBuyerSelect = (buyerId) => {
    setSelectedFilters((prev) => ({ ...prev, buyer: buyerId }));
    setBuyerModalVisible(false);
    setCurrentPage(1);
  };

  // Receiver handlers
  const handleReceiverSelect = (receiverId) => {
    setSelectedFilters((prev) => ({ ...prev, receiver: receiverId }));
    setReceiverModalVisible(false);
    setCurrentPage(1);
  };

  // Date Range handlers
  const handleDateRangeSelect = (dateRange) => {
    setSelectedFilters((prev) => ({ ...prev, dateRange }));
    setDateRangeModalVisible(false);
    setCurrentPage(1);
  };

  // Initialize drafts when modals open
  useEffect(() => {
    if (genusModalVisible) {
      setGenusDraft(Array.isArray(selectedFilters.genus) ? selectedFilters.genus.slice() : []);
    }
  }, [genusModalVisible]);

  useEffect(() => {
    if (variegationModalVisible) {
      setVariegationDraft(Array.isArray(selectedFilters.variegation) ? selectedFilters.variegation.slice() : []);
    }
  }, [variegationModalVisible]);

  useEffect(() => {
    if (listingTypeModalVisible) {
      setListingTypeDraft(Array.isArray(selectedFilters.listingType) ? selectedFilters.listingType.slice() : []);
    }
  }, [listingTypeModalVisible]);

  // Genus modal opened - data should already be pre-loaded
  useEffect(() => {
    if (genusModalVisible && (!genusOptionsState || genusOptionsState.length === 0)) {
      // Only fetch if somehow pre-load failed
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
          console.warn('Failed to fetch genus options', e?.message || e);
        } finally {
          setGenusLoading(false);
        }
      })();
    }
  }, [genusModalVisible]);

  // These are now fallbacks only - data is pre-loaded on mount
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

  // Note: Buyers and receivers are now extracted from orders in fetchOrders()
  // No need for fallback loading as they're populated with each order fetch

  // Helper to check if filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        return selectedFilters.sort !== null;
      case 'Genus':
        return selectedFilters.genus !== null && selectedFilters.genus.length > 0;
      case 'Variegation':
        return selectedFilters.variegation !== null && selectedFilters.variegation.length > 0;
      case 'Listing Type':
        return selectedFilters.listingType !== null && selectedFilters.listingType.length > 0;
      case 'Garden':
        return selectedFilters.garden !== null;
      case 'Buyer':
        return selectedFilters.buyer !== null;
      case 'Receiver':
        return selectedFilters.receiver !== null;
      case 'Date Range':
        return selectedFilters.dateRange !== null;
      case 'Plant Flight':
        return selectedFilters.plantFlight !== null;
      default:
        return false;
    }
  };

  // FilterTab component - matches Listings Viewer
  const FilterTab = ({ filter }) => {
    const isActive = isFilterActive(filter.label);
    
    return (
      <TouchableOpacity
        onPress={() => handleFilterTabPress(filter.label)}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isActive ? '#23C16B' : '#CDD3D4',
          backgroundColor: isActive ? '#E8F5E9' : '#FFFFFF',
          padding: 8,
          marginTop: 5,
          flexDirection: 'row',
          alignItems: 'center',
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
        <Text style={{
          fontSize: 14,
          fontWeight: isActive ? '600' : '500',
          color: isActive ? '#23C16B' : '#393D40'
        }}>
          {filter.label}
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
  };


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader
          navigation={navigation}
          title="Order Summary"
          search
          onSearchPress={() => {
            const next = !searchVisible;
            setSearchVisible(next);
            if (next && searchInputRef && searchInputRef.current) {
              setTimeout(() => searchInputRef.current.focus(), 60);
            }
          }}
          searchActive={searchVisible}
          searchValue={searchTerm}
          onSearchChange={(text) => setSearchTerm(text || '')}
          onSearchSubmit={() => {
            setSearchVisible(false);
            fetchOrders();
          }}
          inputRef={searchInputRef}
        />

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { width: tab.tabWidth, minWidth: Math.min(100, tab.tabWidth), height: 40 }]}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.id)}
            >
              <View style={[styles.tabContent, { width: tab.contentWidth, minWidth: 40, height: 24 }]}>
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id ? styles.tabTextActive : styles.tabTextInactive
                ]}>
                  {tab.label}
                </Text>
                {tab.badge && (
                  <View style={styles.badgeDot} />
                )}
              </View>
              <View style={[
                styles.tabIndicator,
                activeTab === tab.id ? styles.tabIndicatorActive : styles.tabIndicatorInactive,
                { width: tab.indicatorWidth, height: 3, maxHeight: 3 }
              ]} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        

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
        >
          {filterTabs.map((filter) => (
            <FilterTab key={filter.label} filter={filter} />
          ))}
        </ScrollView>

        {/* Sort Modal */}
        <ReusableActionSheet
          code="SORT"
          visible={sortModalVisible}
          onClose={() => setSortModalVisible(false)}
          sortOptions={adminSortOptions}
          sortValue={selectedFilters.sort}
          sortChange={handleSortChange}
          handleSearchSubmit={handleSortView}
        />

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
          clearFilters={() => {
            setGenusDraft([]);
            setSelectedFilters((prev) => ({ ...prev, genus: null }));
            setGenusModalVisible(false);
            setCurrentPage(1);
          }}
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
          clearFilters={() => {
            setVariegationDraft([]);
            setSelectedFilters((prev) => ({ ...prev, variegation: null }));
            setVariegationModalVisible(false);
            setCurrentPage(1);
          }}
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
          clearFilters={() => {
            setListingTypeDraft([]);
            setSelectedFilters((prev) => ({ ...prev, listingType: null }));
            setListingTypeModalVisible(false);
            setCurrentPage(1);
          }}
        />

        {/* Garden Modal */}
        <GardenFilter
          isVisible={gardenModalVisible}
          onClose={() => setGardenModalVisible(false)}
          onSelectGarden={handleGardenSelect}
          gardens={gardenOptionsState}
          gardenCounts={gardenCounts}
          currentGarden={selectedFilters.garden}
        />

        {/* Buyer Modal */}
        <BuyerFilter
          isVisible={buyerModalVisible}
          onClose={() => setBuyerModalVisible(false)}
          onSelectBuyer={handleBuyerSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, buyer: null }));
            setBuyerModalVisible(false);
            setCurrentPage(1);
          }}
          buyers={buyerOptionsState}
        />

        {/* Receiver Modal */}
        <ReceiverFilter
          isVisible={receiverModalVisible}
          onClose={() => setReceiverModalVisible(false)}
          onSelectReceiver={handleReceiverSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, receiver: null }));
            setReceiverModalVisible(false);
            setCurrentPage(1);
          }}
          receivers={receiverOptionsState}
        />

        {/* Date Range Modal */}
        <DateRangeFilter
          isVisible={dateRangeModalVisible}
          onClose={() => setDateRangeModalVisible(false)}
          onSelectDateRange={handleDateRangeSelect}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, dateRange: null }));
            setDateRangeModalVisible(false);
            setCurrentPage(1);
          }}
        />

        {/* Plant Flight Modal */}
        <PlantFlightFilter
          isVisible={flightModalVisible}
          onClose={() => setFlightModalVisible(false)}
          flightDates={flightDatesState}
          onSelectFlight={(isoDate) => {
            setSelectedFilters(prev => ({ ...prev, plantFlight: isoDate }));
            setFlightModalVisible(false);
            setCurrentPage(1);
          }}
          onReset={() => {
            setSelectedFilters((prev) => ({ ...prev, plantFlight: null }));
            setFlightModalVisible(false);
            setCurrentPage(1);
          }}
        />

        {/* Table */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScrollContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          nestedScrollEnabled={true}
        >
          <View style={styles.tableContainer}>
            {/* Header */}
            <View style={styles.tableHeaderRow}>
              {TABLE_COLUMNS.map((col) => (
                <View key={col.key} style={[styles.tableHeaderCell, {width: col.width}]}> 
                  <Text style={[
                    col.key === 'image' ? styles.tableHeaderTextBold : styles.tableHeaderText,
                    col.align === 'center' && {textAlign: 'center'}
                  ]}>
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Order Rows */}
            {loading ? (
              <OrderTableSkeleton rowCount={5} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {errorToString(error) || 'An error occurred'}
                </Text>
                <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchTerm ? 'No orders match your search' : 'No orders found'}
                </Text>
                {searchTerm && (
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search term or filters
                  </Text>
                )}
                {searchTerm && (
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => {
                      setSearchTerm('');
                      setSearchVisible(false);
                    }}
                  >
                    <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <ScrollView
                style={styles.tableContent}
                contentContainerStyle={styles.tableContentContainer}
                nestedScrollEnabled={true}
              >
                {orders.map((order, i) => (
                  <View key={order.id || i} style={styles.tableRow}>
                    {/* Image */}
                    <View style={[styles.tableCell, {width: 116}]}>
                      {order.imageUrl ? (
                        <Image 
                          source={{uri: order.imageUrl}} 
                          style={styles.plantImage}
                          resizeMode="cover"
                          onError={(e) => console.log('Image load error:', e.nativeEvent.error, 'for URL:', order.imageUrl)}
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                      )}
                    </View>

                    {/* Order Info */}
                    <View style={[styles.tableCell, {width: 240}]}>
                      <View style={styles.orderInfoContainer}>
                        <Text style={styles.transactionNumber}>{order.transactionNumber}</Text>
                        <Text style={styles.orderDate}>Order: {order.orderDate}</Text>
                        <Text style={styles.orderDate}>Delivered: {order.deliveredDate}</Text>
                        <Text style={styles.orderDate}>Received: {order.receivedDate}</Text>
                      </View>
                    </View>

                    {/* Plant Code */}
                    <View style={[styles.tableCell, {width: 100}]}>
                      <Text style={styles.plantCode}>{order.plantCode}</Text>
                    </View>

                    {/* Plant Name */}
                    <View style={[styles.tableCell, {width: 200}]}>
                      <View style={styles.plantNameContainer}>
                        <Text style={styles.plantNameText}>
                          {order.genus} {order.species}
                        </Text>
                        {order.variegation ? (
                          <Text style={styles.variegationText}>{order.variegation}</Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Listing Type */}
                    <View style={[styles.tableCell, {width: 140}]}>
                      {order.listingType !== '—' && (
                        <View style={styles.listingTypeBadge}>
                          <Text style={styles.listingTypeText}>{order.listingType}</Text>
                        </View>
                      )}
                    </View>

                    {/* Size/Quantity/Prices */}
                    <View style={[styles.tableCell, {width: 90, alignItems: 'center'}]}>
                      <View style={styles.sizeStockPriceContainer}>
                        {Array.isArray(order.potSizes) && order.potSizes.map((size, idx) => (
                          <View key={idx} style={styles.sizeCard}>
                            <Text style={styles.sizeText}>{size}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Quantity */}
                    <View style={[styles.tableCell, {width: 100, alignItems: 'center'}]}>
                      <View style={styles.sizeStockPriceContainer}>
                        {Array.isArray(order.quantities) && order.quantities.map((qty, idx) => (
                          <Text key={idx} style={styles.quantityText}>{qty}</Text>
                        ))}
                      </View>
                    </View>

                    {/* Local Price */}
                    <View style={[styles.tableCell, {width: 120, alignItems: 'center'}]}>
                      <View style={styles.sizeStockPriceContainer}>
                        {Array.isArray(order.localPrices) && order.localPrices.map((price, idx) => (
                          <Text key={idx} style={styles.priceText}>
                            {price !== 0 ? `${order.localCurrencySymbol}${price.toFixed(2)}` : '—'}
                          </Text>
                        ))}
                      </View>
                    </View>

                    {/* USD Price */}
                    <View style={[styles.tableCell, {width: 120, alignItems: 'center'}]}>
                      <View style={styles.sizeStockPriceContainer}>
                        {Array.isArray(order.usdPrices) && order.usdPrices.map((price, idx) => (
                          <Text key={idx} style={styles.priceText}>
                            {price !== 0 ? `$${price.toFixed(2)}` : '—'}
                          </Text>
                        ))}
                      </View>
                    </View>

                    {/* Garden & Seller */}
                    <View style={[styles.tableCell, {width: 200}]}>
                      <View style={styles.userInfoContainer}>
                        <Text style={styles.userPrimaryText}>{order.gardenName}</Text>
                        <Text style={styles.userSecondaryText}>{order.sellerName}</Text>
                      </View>
                    </View>

                    {/* Buyer */}
                    <View style={[styles.tableCell, {width: 200}]}>
                      <View style={styles.userInfoContainer}>
                        <Text style={styles.userPrimaryText}>
                          {order.buyerFirstName} {order.buyerLastName}
                        </Text>
                        {order.buyerUsername ? (
                          <Text style={styles.usernameText}>{order.buyerUsername}</Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Receiver */}
                    <View style={[styles.tableCell, {width: 200}]}>
                      <View style={styles.userInfoContainer}>
                        <Text style={styles.userPrimaryText}>{order.receiverName}</Text>
                        {order.receiverUsername ? (
                          <Text style={styles.usernameText}>{order.receiverUsername}</Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Plant Flight */}
                    <View style={[styles.tableCell, {width: 140}]}>
                      <Text style={styles.orderDate}>{order.plantFlight}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {/* Pagination Controls */}
        <View style={styles.paginationWrapper}>
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              style={[
                styles.paginationButton,
                (currentPage <= 1 || loading) && styles.paginationButtonDisabled
              ]}
              onPress={handlePreviousPage}
              disabled={currentPage <= 1 || loading}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.paginationButtonText,
                (currentPage <= 1 || loading) && styles.paginationButtonTextDisabled
              ]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>
              <Text style={styles.paginationSubtext}>
                {loading ? 'Loading...' : `${totalOrders} total orders`}
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.paginationButton,
                (currentPage >= totalPages || loading) && styles.paginationButtonDisabled
              ]}
              onPress={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.paginationButtonText,
                (currentPage >= totalPages || loading) && styles.paginationButtonTextDisabled
              ]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default OrderSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
    height: 48,
    flexGrow: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    gap: 24,
    height: 40,
  },
  tab: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    minWidth: 100,
    height: 40,
    borderRadius: 1000,
  },
  tabContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'auto',
    minWidth: 40,
    height: 24,
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  tabTextActive: {
    fontWeight: '600',
    color: '#202325',
  },
  tabTextInactive: {
    fontWeight: '600',
    color: '#647276',
  },
  badgeDot: {
    width: 12,
    height: 12,
    borderRadius: 1000,
    backgroundColor: '#E7522F',
    marginLeft: 6,
  },
  tabIndicator: {
    marginHorizontal: 'auto',
    height: 3,
    maxHeight: 3,
  },
  tabIndicatorActive: {
    backgroundColor: '#202325',
  },
  tabIndicatorInactive: {
    backgroundColor: '#FFFFFF',
    opacity: 0,
  },
  // Table Styles
  tableScrollContainer: {
    flex: 1,
    marginTop: 0,
    paddingBottom: 0,
  },
  tableContainer: {
    minWidth: 2140,
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingHorizontal: 15,
    gap: 12,
    width: 2140,
    height: 36,
    backgroundColor: '#E4E7E9',
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
  },
  tableHeaderCell: {
    height: 20,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  tableHeaderTextBold: {
    fontWeight: '700',
    color: '#202325',
  },
  tableContent: {
    flex: 1,
  },
  tableContentContainer: {
    flexGrow: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 12,
    width: 2140,
    minHeight: 144,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  tableCell: {
    justifyContent: 'flex-start',
  },
  // Image Styles
  plantImage: {
    width: 116,
    height: 116,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
  },
  placeholderImage: {
    width: 116,
    height: 116,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#CDD3D4',
  },
  // Order Info Styles
  orderInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    width: 240,
  },
  transactionNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  orderDate: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  // Plant Code Styles
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  // Plant Name Styles
  plantNameContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    width: 200,
  },
  plantNameText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  variegationText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  // Listing Type Styles
  listingTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 1,
    minHeight: 28,
    backgroundColor: '#202325',
    borderRadius: 8,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  // Size/Stock/Price Container
  sizeStockPriceContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  // Size Card Styles
  sizeCard: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    paddingHorizontal: 8,
    minWidth: 22,
    minHeight: 28,
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  // Quantity Styles
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  // Price Styles
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  // User Info Styles
  userInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    width: 200,
  },
  userPrimaryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  userSecondaryText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  usernameText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
  },
  // Loading/Error States
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#E7522F',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#E7522F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
    marginBottom: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    marginTop: 8,
  },
  clearSearchButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  // Pagination Styles (matches Listings Viewer)
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


