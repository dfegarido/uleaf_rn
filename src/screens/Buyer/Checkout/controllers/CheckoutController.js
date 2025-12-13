import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking } from 'react-native';
import { paymentPaypalVenmoUrl } from '../../../../../config';
import { getAddressBookEntriesApi, getMyReceiverRequestApi } from '../../../../components/Api';
import { checkoutApi } from '../../../../components/Api/checkoutApi';
import { checkoutJoinerApi } from '../../../../components/Api/checkoutJoinerApi';
import { calculateCheckoutShippingApi } from '../../../../components/Api/checkoutShippingApi';
import { calculateCheckoutShippingJoinerApi } from '../../../../components/Api/checkoutShippingJoinerApi';
import { validateDiscountCodeApi } from '../../../../components/Api/discountApi';
import { getBuyerProfileApi } from '../../../../components/Api/getBuyerProfileApi';
import { getBuyerOrdersApi } from '../../../../components/Api/orderManagementApi';
import { getActiveFlightDatesApi } from '../../../../components/Api/getActiveFlightDatesApi';
import { roundToCents } from '../../../../utils/money';
import { createAndCapturePaypalOrder } from '../../../../components/Api/paymentApi';

/**
 * CheckoutController - Handles all business logic for CheckoutScreen
 */
export const useCheckoutController = (props) => {
  console.log('🚀 [CheckoutController] ===== CONTROLLER INITIALIZED =====');
  console.log('🔍 [CheckoutController] About to set up hooks and state...');

  const navigation = useNavigation();
  const route = useRoute();

  // Get parameters from navigation
  const routeParams = props || route.params || {};
  console.log('📥 [CheckoutController] Received route params:', {
    hasParams: !!route.params,
    routeParamsKeys: Object.keys(routeParams),
    routeParamsFull: JSON.stringify(routeParams, null, 2),
  });

  const {
    cartItems = [],
    productData = [],
    useCart = true,
    fromBuyNow = false,
    plantData = null,
    selectedPotSize = null,
    quantity = 1,
    plantCode = null,
    totalAmount = 0,
    isLive = false,
    onClose,
  } = routeParams;

  console.log('📥 [CheckoutController] Extracted params:', {
    cartItemsType: Array.isArray(cartItems) ? 'array' : typeof cartItems,
    cartItemsLength: Array.isArray(cartItems) ? cartItems.length : 'N/A',
    cartItemsSample: Array.isArray(cartItems) && cartItems.length > 0 ? {
      firstItemKeys: Object.keys(cartItems[0]),
      firstItemStructure: cartItems[0],
    } : 'no items',
    productDataType: Array.isArray(productData) ? 'array' : typeof productData,
    productDataLength: Array.isArray(productData) ? productData.length : 'N/A',
    useCart,
    fromBuyNow,
    plantDataType: typeof plantData,
    hasPlantData: !!plantData,
    plantDataKeys: plantData ? Object.keys(plantData) : [],
    plantDataSample: plantData ? {
      plantCode: plantData.plantCode,
      name: plantData.name,
      title: plantData.title,
      hasListingDetails: !!plantData.listingDetails,
      listingDetailsKeys: plantData.listingDetails ? Object.keys(plantData.listingDetails) : [],
      plantFlightDate: plantData.plantFlightDate || plantData.listingDetails?.plantFlightDate,
      flightDates: plantData.flightDates,
    } : null,
    selectedPotSize,
    quantity,
    plantCode,
    totalAmount,
  });

  // State management
  const [loading, setLoading] = useState(false);
  const [transactionNum, setTransactionNum] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState({ amount: 0, discountId: null, code: null, discountDetails: null });
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
    },
    contactPhone: '+1-555-0123',
    specialInstructions: 'Leave at front door',
  });

  const [cargoDate, setCargoDate] = useState();
  const [lockedFlightDate, setLockedFlightDate] = useState(null);
  const [lockedFlightKey, setLockedFlightKey] = useState(null);
  const [checkingOrders, setCheckingOrders] = useState(false);
  const [disablePlantFlightSelection, setDisablePlantFlightSelection] = useState(false);
  const [selectedFlightDate, setSelectedFlightDate] = useState(null);
  const [shippingCalculation, setShippingCalculation] = useState({ 
    baseFee: 0,
    addOnFee: 0,
    airCargoFee: 0,
    total: 0,
    discount: 0,
    finalTotal: 0,
    loading: false, // Track shipping calculation loading state
  });
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');
  const [leafPoints, setLeafPoints] = useState(0);
  const [plantCredits, setPlantCredits] = useState(0);
  const [shippingCredits, setShippingCredits] = useState(0);
  const [upsNextDayEnabled, setUpsNextDayEnabled] = useState(false);
  const [leafPointsEnabled, setLeafPointsEnabled] = useState(false);
  const [plantCreditsEnabled, setPlantCreditsEnabled] = useState(false);
  const [shippingCreditsEnabled, setShippingCreditsEnabled] = useState(false);
  
  // Joiner state - if user is a joiner with approved receiver
  const [isJoiner, setIsJoiner] = useState(false);
  const [isJoinerApproved, setIsJoinerApproved] = useState(false);
  const [receiverFlightDate, setReceiverFlightDate] = useState(null);
  const [disableAddressSelection, setDisableAddressSelection] = useState(false);
  const [disableFlightSelection, setDisableFlightSelection] = useState(false);

  const [vaultedPaymentId, setVaultedPaymentId] = useState(null);
  const [vaultedPaymentUsername, setVaultedPaymentUsername] = useState(null);

  // Animation refs
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Helper functions - memoized to prevent infinite loops
  const normalizeFlightKey = useCallback((input) => {
    if (!input) return null;
    try {
      if (input instanceof Date) {
        const m = input.toLocaleString('en-US', { month: 'short' });
        const d = input.getDate();
        return `${m.toLowerCase()}-${d}`;
      }
      const s = String(input).trim();
      const m = s.match(/([A-Za-z]{3,9})\s*-?\s*(\d{1,2})/);
      if (m && m.length >= 3) {
        const month = m[1].slice(0,3).toLowerCase();
        const day = parseInt(m[2], 10);
        return `${month}-${day}`;
      }
      return null;
    } catch (e) {
      console.warn('Failed to normalize flight key:', input, e);
      return null;
    }
  }, []); // No dependencies - pure function

  // Normalize listingType to standard format
  const normalizeListingType = useCallback((listingType) => {
    if (!listingType) return 'single_grower'; // Default
    const normalized = String(listingType).toLowerCase().trim();
    
    // Direct/exact matches first (most specific)
    // Handle common database formats
    if (normalized === 'wholesale') return 'wholesale';
    if (normalized === "grower's choice" || normalized === 'growers choice' || normalized === 'grower choice' || 
        normalized === 'growers_choice' || normalized === 'growerschoice') {
      return 'growers_choice';
    }
    if (normalized === 'single plant' || normalized === 'singleplant' || 
        normalized === 'single_grower' || normalized === 'singlegrower' ||
        normalized === 'single') {
      return 'single_grower';
    }
    
    // Handle compound terms with underscores or special characters (check before partial matches)
    if (normalized.includes('single_grower') || normalized.includes('single-plant') || 
        normalized.includes('singleplant')) {
      return 'single_grower';
    }
    
    // Handle various formats (partial matches)
    // Wholesale check
    if (normalized.includes('whole')) return 'wholesale';
    
    // Grower's choice check - only if it's NOT part of 'single' context
    // Check for 'grower' or 'choice' but exclude if it's a single plant variant
    if ((normalized.includes('grower') || normalized.includes('choice')) && 
        !normalized.includes('single') && !normalized.includes('single_grower')) {
      return 'growers_choice';
    }
    
    // Single plant check (should come last to avoid mis-matching)
    if (normalized.includes('single')) return 'single_grower';
    
    // Default fallback
    return 'single_grower';
  }, []);

  // Helper to parse date string to Date object (e.g., "Aug 23" -> Date)
  const parseFlightDate = useCallback((dateStr) => {
    if (!dateStr || dateStr === 'N/A') return null;
    
    try {
      // Try to parse various date formats: "Aug 23" or "August 23" or "Aug 23, 2024"
      const parts = dateStr.trim().match(/([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?/i);
      if (parts) {
        const monthStr = parts[1].slice(0, 3).toLowerCase();
        const day = parseInt(parts[2], 10);
        const year = parts[3] ? parseInt(parts[3], 10) : new Date().getFullYear();
        
        const monthMap = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const month = monthMap[monthStr];
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }
      
      // Try parsing as ISO string
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
    } catch (e) {
      console.warn('Failed to parse flight date:', dateStr, e);
    }
    
    return null;
  }, []);

  // Helper to get next Saturday from a date
  const getNextSaturday = useCallback((date) => {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = day === 6 ? 0 : (6 - day);
    const nextSaturday = new Date(date);
    nextSaturday.setDate(date.getDate() + daysUntilSaturday);
    return nextSaturday;
  }, []);

  // Helper to format date as "Mon DD" or "Aug 23"
  const formatDateLabel = useCallback((date) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  }, []);

  const formatFlightDateToISO = useCallback((flightDate, fallbackYear = null) => {
    if (!flightDate) return null;
    try {
      if (flightDate.iso) return flightDate.iso;
      if (typeof flightDate === 'string') {
        // Try parsing as ISO string first
        const isoDate = new Date(flightDate);
        if (!isNaN(isoDate.getTime())) {
          // Use local date components to avoid timezone issues
          const year = isoDate.getFullYear();
          const month = String(isoDate.getMonth() + 1).padStart(2, '0');
          const day = String(isoDate.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // If that fails and we have a date string like "Aug 23", use parseFlightDate
        const parsed = parseFlightDate(flightDate);
        if (parsed) {
          // Use local date components to avoid timezone issues
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // Last resort: if we have a year, try constructing the date
        if (fallbackYear) {
          const parts = flightDate.match(/([A-Za-z]+)\s+(\d{1,2})/i);
          if (parts) {
            const monthMap = {
              'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
              'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            const month = monthMap[parts[1].slice(0, 3).toLowerCase()];
            const day = parseInt(parts[2], 10);
            if (month !== undefined) {
              const date = new Date(fallbackYear, month, day);
              // Use local date components to avoid timezone issues
              const year = date.getFullYear();
              const monthStr = String(date.getMonth() + 1).padStart(2, '0');
              const dayStr = String(date.getDate()).padStart(2, '0');
              return `${year}-${monthStr}-${dayStr}`;
            }
          }
        }
      }
      return null;
    } catch (e) {
      console.warn('Failed to format flight date to ISO:', flightDate, e);
      return null;
    }
  }, [parseFlightDate]);

  // Process cart items and product data
  const plantItems = useMemo(() => {
    console.log('🔍 [plantItems] Starting processing...', {
      useCart,
      fromBuyNow,
      plantData: !!plantData,
      cartItemsLength: cartItems.length,
      productDataLength: productData?.length || 0,
      plantDataFull: plantData ? JSON.stringify(plantData, null, 2).substring(0, 500) + '...' : 'null',
    });

    // Priority: When fromBuyNow is true, always use plantData (regardless of useCart flag)
    if (fromBuyNow && plantData) {
      console.log('🔍 [plantItems] Using buyNow plantData (fromBuyNow=true)');
      console.log('🔍 [plantItems] plantData structure:', {
        keys: Object.keys(plantData),
        plantCode: plantData.plantCode,
        name: plantData.name,
        title: plantData.title,
        hasListingDetails: !!plantData.listingDetails,
        listingDetailsKeys: plantData.listingDetails ? Object.keys(plantData.listingDetails) : [],
        plantFlightDate: plantData.plantFlightDate,
        flightDate: plantData.flightDate,
        cargoDate: plantData.cargoDate,
        listingDetailsPlantFlightDate: plantData.listingDetails?.plantFlightDate,
        flightDates: plantData.flightDates,
        listingDetailsFlightDates: plantData.listingDetails?.flightDates,
        // Image fields debugging
        imagePrimary: plantData.imagePrimary,
        image: plantData.image,
        images: plantData.images,
        imageCollection: plantData.imageCollection,
        listingDetailsImage: plantData.listingDetails?.image,
        listingDetailsImagePrimary: plantData.listingDetails?.imagePrimary,
        listingDetailsImages: plantData.listingDetails?.images,
      });
      
      const buyNowItem = {
        ...plantData,
        ...plantData.listingDetails, // Spread listingDetails to access nested fields
        quantity: quantity,
        selectedPotSize: selectedPotSize,
        plantCode: plantCode || plantData.plantCode,
        listingId: plantData.listingId || plantData.id || null, // Preserve listingId for discount validation
        totalAmount: totalAmount,
        // Extract flight date from multiple possible locations
        plantFlightDate: plantData.plantFlightDate || plantData.flightDate || plantData.listingDetails?.plantFlightDate,
        // Ensure flight dates are preserved in the structure we expect
        flightDates: plantData.flightDates || 
                    (plantData.plantFlightDate && plantData.plantFlightDate !== 'N/A' ? [{ date: plantData.plantFlightDate }] : null) ||
                    (plantData.flightDate && plantData.flightDate !== 'N/A' ? [{ date: plantData.flightDate }] : null) ||
                    (plantData.listingDetails?.plantFlightDate && plantData.listingDetails.plantFlightDate !== 'N/A' ? [{ date: plantData.listingDetails.plantFlightDate }] : null) ||
                    (plantData.listingDetails?.flightDates && Array.isArray(plantData.listingDetails.flightDates) ? plantData.listingDetails.flightDates : null),
        // Ensure all required fields for PlantItemComponent are present
        // Image priority: imagePrimary (from getPlantDetailApi) > image > listingDetails.image > images array > imageCollection
        image: plantData.imagePrimary || 
               plantData.image || 
               plantData.listingDetails?.image || 
               plantData.listingDetails?.imagePrimary ||
               (Array.isArray(plantData.images) && plantData.images.length > 0 ? plantData.images[0] : null) ||
               (Array.isArray(plantData.imageCollection) && plantData.imageCollection.length > 0 ? plantData.imageCollection[0] : null),
        name: plantData.name || plantData.title || `${plantData.genus || ''} ${plantData.species || ''}`.trim() || 'Unknown Plant',
        variation: plantData.variation || plantData.listingDetails?.variegation || 'Standard',
        size: selectedPotSize || plantData.potSize || plantData.selectedPotSize || plantData.listingDetails?.potSize || '2"',
        price: plantData.price || plantData.unitPrice || plantData.listingDetails?.price || plantData.discountPrice || totalAmount / quantity || 0,
        title: plantData.title || plantData.name || `${plantData.genus || ''} ${plantData.species || ''}`.trim() || 'Rare Tropical Plants',
        originalPrice: plantData.originalPrice || plantData.listingDetails?.originalPrice || plantData.listingDetails?.price || null,
        discount: plantData.discount || plantData.discountPercent || plantData.listingDetails?.discountPercent || null,
        listingType: normalizeListingType(plantData.listingType || plantData.listingDetails?.listingType),
        country: plantData.country || plantData.listingDetails?.country || 'TH',
        shippingMethod: plantData.shippingMethod || 'Plant / UPS Ground Shipping',
        hasAirCargo: plantData.hasAirCargo || plantData.listingDetails?.hasAirCargo || false,
        // Store genus and species explicitly for discount validation
        genus: plantData.genus || plantData.listingDetails?.genus || '',
        species: plantData.species || plantData.listingDetails?.species || '',
        // Ensure id exists for key prop in PlantList
        id: plantData.id || plantData.plantCode || `plant-${Date.now()}`,
      };
      
      console.log('✅ [plantItems] Created buyNow item:', {
        plantCode: buyNowItem.plantCode,
        hasFlightDates: !!buyNowItem.flightDates,
        flightDates: buyNowItem.flightDates,
        plantFlightDate: buyNowItem.plantFlightDate,
        listingDetailsPlantFlightDate: buyNowItem.listingDetails?.plantFlightDate,
        // Debug all required fields
        hasImage: !!buyNowItem.image,
        image: buyNowItem.image,
        imagePrimary: plantData.imagePrimary,
        imageFromPlantData: plantData.image,
        listingDetailsImage: plantData.listingDetails?.image,
        listingDetailsImagePrimary: plantData.listingDetails?.imagePrimary,
        imagesArray: plantData.images,
        imageCollection: plantData.imageCollection,
        name: buyNowItem.name,
        variation: buyNowItem.variation,
        size: buyNowItem.size,
        price: buyNowItem.price,
        title: buyNowItem.title,
        originalPrice: buyNowItem.originalPrice,
        discount: buyNowItem.discount,
        listingType: buyNowItem.listingType,
        country: buyNowItem.country,
        quantity: buyNowItem.quantity,
        hasId: !!buyNowItem.id,
      });
      
      return [buyNowItem];
    }

    if (!cartItems.length) {
      console.log('⚠️ [plantItems] No cartItems and not fromBuyNow, returning empty array');
      return [];
    }

    // If productData is not provided, use cartItems directly (they contain listingDetails)
    if (!productData || productData.length === 0) {
      console.log('🔍 [plantItems] Using cartItems directly (no productData)');
      console.log('🔍 [plantItems] Sample cartItem structure:', {
        hasCartItems: cartItems.length > 0,
        firstCartItem: cartItems[0] ? {
          id: cartItems[0].id,
          plantCode: cartItems[0].plantCode,
          hasListingDetails: !!cartItems[0].listingDetails,
          listingDetailsKeys: cartItems[0].listingDetails ? Object.keys(cartItems[0].listingDetails) : [],
          plantFlightDate: cartItems[0].listingDetails?.plantFlightDate,
          directPlantFlightDate: cartItems[0].plantFlightDate,
        } : null,
      });

      return cartItems.map((cartItem, index) => {
        // Extract flight dates from cartItem's listingDetails
        let flightDates = null;
        const flightDateStr = cartItem.listingDetails?.plantFlightDate || cartItem.plantFlightDate;
        
        console.log(`🔍 [plantItems] Processing cartItem ${index}:`, {
          plantCode: cartItem.plantCode,
          flightDateFromListingDetails: cartItem.listingDetails?.plantFlightDate,
          flightDateDirect: cartItem.plantFlightDate,
          flightDateStr,
          hasListingDetails: !!cartItem.listingDetails,
        });
        
        if (flightDateStr && flightDateStr !== 'N/A') {
          flightDates = [{ date: flightDateStr }];
          console.log(`✅ [plantItems] Found flight date for ${cartItem.plantCode}:`, flightDateStr);
        } else {
          console.log(`⚠️ [plantItems] No valid flight date for ${cartItem.plantCode}`);
        }

        // Helper function to extract image URI from various formats
        const extractImageUri = (img) => {
          if (!img) return null;
          if (typeof img === 'string') return img;
          if (typeof img === 'object' && img.uri) return img.uri;
          if (Array.isArray(img) && img.length > 0) {
            const firstImg = img[0];
            if (typeof firstImg === 'string') return firstImg;
            if (typeof firstImg === 'object' && firstImg.uri) return firstImg.uri;
          }
          return null;
        };

        // Extract image URI from various possible sources
        const imageUri = extractImageUri(cartItem.imagePrimary) ||
                        extractImageUri(cartItem.image) || 
                        extractImageUri(cartItem.listingDetails?.imagePrimary) ||
                        extractImageUri(cartItem.listingDetails?.image) ||
                        extractImageUri(cartItem.images) ||
                        extractImageUri(cartItem.listingDetails?.images) ||
                        extractImageUri(cartItem.imageCollection) ||
                        extractImageUri(cartItem.listingDetails?.imageCollection) ||
                        null;

        const processedItem = {
          ...cartItem,
          ...cartItem.listingDetails,
          quantity: cartItem.quantity,
          selectedPotSize: cartItem.selectedPotSize,
          plantCode: cartItem.plantCode,
          listingId: cartItem.listingId || null, // Preserve listingId for discount validation
          totalAmount: cartItem.totalAmount || (cartItem.price || cartItem.listingDetails?.price || 0) * (cartItem.quantity || 1),
          flightDates: flightDates,
          // Ensure all needed fields are present for PlantItemComponent
          // Image is normalized to a string URI
          image: imageUri,
          name: cartItem.name || cartItem.listingDetails?.title || cartItem.listingDetails?.name || 'Unknown Plant',
          variation: cartItem.variation || cartItem.listingDetails?.variegation || 'Standard',
          size: cartItem.selectedPotSize || cartItem.potSize || cartItem.listingDetails?.potSize || '2"',
          price: cartItem.price || cartItem.listingDetails?.price || 0,
          title: cartItem.title || cartItem.listingDetails?.title || cartItem.name || 'Rare Tropical Plants',
          originalPrice: cartItem.originalPrice || cartItem.listingDetails?.originalPrice || null,
          discount: cartItem.discount || cartItem.listingDetails?.discountPercent || null,
          listingType: normalizeListingType(cartItem.listingType || cartItem.listingDetails?.listingType),
          country: cartItem.country || cartItem.listingDetails?.country || 'TH',
          shippingMethod: cartItem.shippingMethod || 'Plant / UPS Ground Shipping',
          hasAirCargo: cartItem.hasAirCargo || cartItem.listingDetails?.hasAirCargo || false,
          // Store genus and species explicitly for discount validation
          // Note: listingDetails is spread above, so species might already be at root level
          // But we explicitly set it to ensure it's always present
          genus: cartItem.genus || cartItem.listingDetails?.genus || '',
          species: cartItem.species || cartItem.listingDetails?.species || (() => {
            // If species is still not found, try to parse from name
            const name = cartItem.name || cartItem.listingDetails?.title || cartItem.listingDetails?.name || '';
            if (name) {
              const nameParts = name.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                // For names like "ALOCASIA AMAZONICA RESERVED FOR ST-GA"
                // The species is everything after the first word (genus)
                return nameParts.slice(1).join(' ').trim();
              }
            }
            return '';
          })(),
          // Ensure id exists for key prop
          id: cartItem.id || cartItem.plantCode || `cart-${index}`,
        };
        
        console.log(`📦 [plantItems] Processed item ${index}:`, {
          plantCode: processedItem.plantCode,
          hasFlightDates: !!processedItem.flightDates,
          flightDates: processedItem.flightDates,
          plantFlightDate: processedItem.plantFlightDate,
          listingDetailsPlantFlightDate: processedItem.listingDetails?.plantFlightDate,
          // Debug image
          image: processedItem.image,
          imageSources: {
            cartItemImagePrimary: cartItem.imagePrimary,
            cartItemImage: cartItem.image,
            listingDetailsImagePrimary: cartItem.listingDetails?.imagePrimary,
            listingDetailsImage: cartItem.listingDetails?.image,
            cartItemImages: cartItem.images,
            listingDetailsImages: cartItem.listingDetails?.images,
            cartItemImageCollection: cartItem.imageCollection,
            listingDetailsImageCollection: cartItem.listingDetails?.imageCollection,
          },
        });
        
        return processedItem;
      });
    }

    // If productData is provided, merge with cartItems
    return cartItems.map(cartItem => {
      const product = productData.find(p => p.id === cartItem.productId || p.plantCode === cartItem.plantCode);
      
      // Extract flight dates from various possible locations
      let flightDates = null;
      if (product) {
        if (product.flightDates && Array.isArray(product.flightDates)) {
          flightDates = product.flightDates;
        } else if (product.listingDetails?.flightDates && Array.isArray(product.listingDetails.flightDates)) {
          flightDates = product.listingDetails.flightDates;
        } else if (product.plantFlightDate || product.listingDetails?.plantFlightDate) {
          const flightDateStr = product.plantFlightDate || product.listingDetails.plantFlightDate;
          if (flightDateStr && flightDateStr !== 'N/A') {
            flightDates = [{ date: flightDateStr }];
          }
        }
      }
      
      // Fallback to cartItem's listingDetails if product not found or no flight dates
      if (!flightDates) {
        const flightDateStr = cartItem.listingDetails?.plantFlightDate || cartItem.plantFlightDate;
        if (flightDateStr && flightDateStr !== 'N/A') {
          flightDates = [{ date: flightDateStr }];
        }
      }

        // Helper function to extract image URI from various formats
        const extractImageUri = (img) => {
          if (!img) return null;
          if (typeof img === 'string') return img;
          if (typeof img === 'object' && img.uri) return img.uri;
          if (Array.isArray(img) && img.length > 0) {
            const firstImg = img[0];
            if (typeof firstImg === 'string') return firstImg;
            if (typeof firstImg === 'object' && firstImg.uri) return firstImg.uri;
          }
          return null;
        };

        // Extract image URI from various possible sources
        const imageUri = extractImageUri(product?.imagePrimary) ||
                        extractImageUri(product?.image) ||
                        extractImageUri(cartItem.imagePrimary) ||
                        extractImageUri(cartItem.image) ||
                        extractImageUri(product?.listingDetails?.imagePrimary) ||
                        extractImageUri(product?.listingDetails?.image) ||
                        extractImageUri(cartItem.listingDetails?.imagePrimary) ||
                        extractImageUri(cartItem.listingDetails?.image) ||
                        extractImageUri(product?.images) ||
                        extractImageUri(cartItem.images) ||
                        extractImageUri(product?.listingDetails?.images) ||
                        extractImageUri(cartItem.listingDetails?.images) ||
                        extractImageUri(product?.imageCollection) ||
                        extractImageUri(cartItem.imageCollection) ||
                        extractImageUri(product?.listingDetails?.imageCollection) ||
                        extractImageUri(cartItem.listingDetails?.imageCollection) ||
                        null;

      return {
        ...(product || cartItem),
        ...(product?.listingDetails || cartItem.listingDetails || {}),
        quantity: cartItem.quantity,
        selectedPotSize: cartItem.selectedPotSize,
        plantCode: product?.plantCode || cartItem.plantCode,
        listingId: cartItem.listingId || product?.listingId || null, // Preserve listingId for discount validation
        totalAmount: cartItem.totalAmount || (product?.price || cartItem.price || cartItem.listingDetails?.price || 0) * (cartItem.quantity || 1),
        flightDates: flightDates, // Ensure flightDates is preserved
        // Ensure all needed fields are present for PlantItemComponent
        // Image is normalized to a string URI
        image: imageUri,
        name: product?.name || cartItem.name || cartItem.listingDetails?.title || product?.title || 'Unknown Plant',
        variation: product?.variation || cartItem.variation || cartItem.listingDetails?.variegation || 'Standard',
        size: product?.size || cartItem.selectedPotSize || cartItem.potSize || cartItem.listingDetails?.potSize || '2"',
        price: product?.price || cartItem.price || cartItem.listingDetails?.price || 0,
        title: product?.title || cartItem.title || cartItem.name || cartItem.listingDetails?.title || 'Rare Tropical Plants',
        originalPrice: product?.originalPrice || cartItem.originalPrice || product?.listingDetails?.originalPrice || cartItem.listingDetails?.originalPrice || null,
        discount: product?.discount || cartItem.discount || product?.listingDetails?.discountPercent || cartItem.listingDetails?.discountPercent || null,
        listingType: normalizeListingType(product?.listingType || cartItem.listingType || cartItem.listingDetails?.listingType),
        country: product?.country || cartItem.country || cartItem.listingDetails?.country || 'TH',
        shippingMethod: product?.shippingMethod || cartItem.shippingMethod || 'Plant / UPS Ground Shipping',
        hasAirCargo: product?.hasAirCargo || cartItem.hasAirCargo || product?.listingDetails?.hasAirCargo || cartItem.listingDetails?.hasAirCargo || false,
        // Store genus and species explicitly for discount validation
        genus: product?.genus || cartItem.genus || product?.listingDetails?.genus || cartItem.listingDetails?.genus || '',
        species: product?.species || cartItem.species || product?.listingDetails?.species || cartItem.listingDetails?.species || '',
        // Ensure id exists for key prop
        id: cartItem.id || product?.id || cartItem.plantCode || product?.plantCode || `item-${Date.now()}`,
      };
    }).filter(Boolean);
  }, [cartItems, productData, useCart, fromBuyNow, plantData, quantity, selectedPotSize, plantCode, totalAmount, normalizeListingType]);

  // Calculate quantity breakdown
  const quantityBreakdown = useMemo(() => {
    const breakdown = {
      singlePlant: 0,  // Changed from singleGrower to match OrderSummary component
      singleGrower: 0, // Keep for backwards compatibility
      wholesale: 0,
      growersChoice: 0,
      total: 0,
    };

    plantItems.forEach(item => {
      const originalListingType = item.listingType;
      const normalizedType = normalizeListingType(item.listingType);
      const qty = Number(item.quantity) || 1;
      
      // Debug logging for quantity breakdown
      console.log('📊 [quantityBreakdown] Processing item:', {
        originalListingType,
        normalizedType,
        quantity: qty,
        itemId: item.id || item.plantCode,
      });
      
      if (normalizedType === 'single_grower') {
        breakdown.singlePlant += qty;
        breakdown.singleGrower += qty; // Keep for backwards compatibility
      } else if (normalizedType === 'wholesale') {
        breakdown.wholesale += qty;
      } else if (normalizedType === 'growers_choice') {
        breakdown.growersChoice += qty;
      }
      breakdown.total += qty;
    });

    console.log('📊 [quantityBreakdown] Final breakdown:', breakdown);
    return breakdown;
  }, [plantItems, normalizeListingType]);

  // Calculate order summary
  const orderSummary = useMemo(() => {
    const subtotal = plantItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    // Add null safety for shippingCalculation
    // Use finalShippingCost from backend (already includes shipping credits discount)
    // If not available, use totalShippingCost and subtract shippingCreditsDiscount
    const backendFinalShippingCost = shippingCalculation?.finalShippingCost || 0;
    const backendTotalShippingCost = shippingCalculation?.totalShippingCost || 0;
    const backendShippingCreditsDiscount = shippingCalculation?.shippingCreditsDiscount || 0;
    const shippingTotal = backendFinalShippingCost || (backendTotalShippingCost - backendShippingCreditsDiscount);
    
    // Get shipping credit note from backend (displayed when remaining credit is added to account)
    const shippingCreditNote = shippingCalculation?.shippingCreditNote || '';
    
    // For display purposes, use backend's finalTotal if available (it accounts for all credits)
    // Otherwise calculate: subtotal + shipping (already has credits applied)
    const backendFinalTotal = shippingCalculation?.finalTotal;
    const shippingDiscount = shippingCalculation?.discount || 0;
    const codeDiscount = appliedDiscount.amount || 0;
    // For freeShipping type, get the discount amount from shipping calculation
    const freeShippingDiscount = shippingCalculation?.freeShippingDiscount || 0;
    const totalDiscount = shippingDiscount + codeDiscount + freeShippingDiscount;
    
    // Calculate credits/points deductions (only if toggles are enabled)
    const leafPointsDeduction = leafPointsEnabled ? leafPoints : 0;
    const plantCreditsDeduction = plantCreditsEnabled ? plantCredits : 0;
    const shippingCreditsDeduction = shippingCreditsEnabled ? shippingCredits : 0;
    const totalCreditsDeduction = leafPointsDeduction + plantCreditsDeduction + shippingCreditsDeduction;

    // Calculate final total - ensure it never goes negative
    let finalTotal;
    if (backendFinalTotal !== undefined) {
      // Backend's finalTotal includes: subtotal + shipping (with promotional shipping credits like $150 promo)
      // It does NOT include:
      //   - Discount codes (need to subtract)
      //   - User credits/points (leafPoints, plantCredits, shippingCredits - need to subtract here)
      // This is to avoid double deduction (backend + frontend)
      // Ensure the result is never negative (minimum $1)
      finalTotal = Math.max(1, backendFinalTotal - codeDiscount - totalCreditsDeduction);
    } else {
      // Fallback: Calculate from components: subtotal + shipping - all discounts - credits
      finalTotal = Math.max(1, subtotal + shippingTotal - totalDiscount - totalCreditsDeduction);
    }
    
    // Debug logging for shipping calculation matching
    console.log('🔍 [orderSummary] Final total calculation:', {
      step1_backend: {
        backendFinalTotal,
        note: 'Subtotal + Shipping (includes $150 promo if qualified)'
      },
      step2_discounts: {
        codeDiscount,
        shippingDiscount,
        freeShippingDiscount,
        totalDiscount,
      },
      step3_userCredits: {
        leafPoints: leafPointsDeduction,
        plantCredits: plantCreditsDeduction,
        shippingCredits: shippingCreditsDeduction,
        total: totalCreditsDeduction,
        note: 'User points deducted HERE (frontend), not in backend'
      },
      step4_finalTotal: {
        calculation: `${backendFinalTotal} - ${codeDiscount} - ${totalCreditsDeduction} = ${finalTotal}`,
        finalTotal,
      },
      breakdown: {
        subtotal,
        shippingTotal,
        backendFinalShippingCost,
        backendShippingCreditsDiscount,
      }
    });
    
    // Log if discount should be visible
    if (codeDiscount > 0) {
      console.log('✅ [orderSummary] Code discount is active:', {
        amount: codeDiscount,
        code: appliedDiscount.code,
        shouldDisplay: true,
      });
    } else {
      console.log('ℹ️ [orderSummary] No code discount:', {
        appliedDiscountAmount: appliedDiscount.amount,
        codeDiscount,
      });
    }

    // Calculate total items
    const totalItems = quantityBreakdown.total || 0;

    // Calculate total original cost (before discounts)
    const totalOriginalCost = plantItems.reduce((sum, item) => {
      const originalPrice = item.originalPrice || item.price || 0;
      return sum + (originalPrice * (item.quantity || 1));
    }, 0);

    // Extract shipping details from shippingCalculation (API returns these fields)
    // Add null safety checks
    const baseUpsShipping = shippingCalculation?.shippingTotal || 0;
    const upsNextDayUpgradeCost = shippingCalculation?.upsNextDayUpgrade || 0;
    // Base Air Cargo is for Single Plant/Grower's Choice only (regularAirCargoTotal)
    // Wholesale items have their own wholesaleAirCargoTotal
    const airBaseCargo = shippingCalculation?.regularAirCargoTotal ?? 0;
    const wholesaleAirCargo = shippingCalculation?.wholesaleAirCargoTotal ?? 0;
    
    // Debug logging for air cargo calculation
    console.log('💳 [orderSummary] Air Cargo values:', {
      shippingCalculationKeys: shippingCalculation ? Object.keys(shippingCalculation) : 'null',
      regularAirCargoTotal: shippingCalculation?.regularAirCargoTotal,
      wholesaleAirCargoTotal: shippingCalculation?.wholesaleAirCargoTotal,
      airBaseCargo,
      wholesaleAirCargo,
      hasQuantityBreakdown: !!quantityBreakdown,
      singlePlantQty: quantityBreakdown?.singlePlant || 0,
      wholesaleQty: quantityBreakdown?.wholesale || 0,
      growersChoiceQty: quantityBreakdown?.growersChoice || 0,
    });
    const airBaseCargoCreditApplied = shippingCalculation?.appliedAirBaseCredit || 0;
    // Use the values already extracted above (backendShippingCreditsDiscount, backendFinalShippingCost, backendTotalShippingCost)
    // Calculate total credits applied (all three types)
    const creditsApplied = totalCreditsDeduction;

    // Check if Buy X Get Y discount is applied
    const isBuyXGetYDiscount = appliedDiscount.discountDetails?.type === 'buyXGetY';
    const buyXGetYDiscountAmount = isBuyXGetYDiscount ? codeDiscount : 0;

    // Check if Event Gift discount is applied
    const isEventGiftDiscount = appliedDiscount.discountDetails?.type === 'eventGift' || appliedDiscount.discountDetails?.type === 'eventGiftFixed';
    const eventGiftDiscountAmount = isEventGiftDiscount ? codeDiscount : 0;

    return {
      subtotal: roundToCents(subtotal),
      discount: roundToCents(totalDiscount),
      codeDiscount: roundToCents(codeDiscount),
      shippingDiscount: roundToCents(shippingDiscount),
      freeShippingDiscount: roundToCents(freeShippingDiscount),
      isFreeShippingDiscount: appliedDiscount.discountDetails?.type === 'freeShipping',
      eventGiftDiscount: roundToCents(eventGiftDiscountAmount),
      isEventGiftDiscount: isEventGiftDiscount,
      buyXGetYDiscount: roundToCents(buyXGetYDiscountAmount),
      isBuyXGetYDiscount: isBuyXGetYDiscount,
      shipping: roundToCents(shippingTotal),
      finalTotal: roundToCents(finalTotal),
      totalItems: totalItems,
      totalOriginalCost: roundToCents(totalOriginalCost),
      baseUpsShipping: roundToCents(baseUpsShipping),
      upsNextDayUpgradeCost: roundToCents(upsNextDayUpgradeCost),
      airBaseCargo: roundToCents(airBaseCargo),
      wholesaleAirCargo: roundToCents(wholesaleAirCargo),
      airBaseCargoCreditApplied: roundToCents(airBaseCargoCreditApplied),
      shippingCreditsDiscount: roundToCents(backendShippingCreditsDiscount),
      creditsApplied: roundToCents(creditsApplied),
      finalShippingCost: roundToCents(backendFinalShippingCost),
      totalShippingCost: roundToCents(backendTotalShippingCost),
      shippingCreditNote: shippingCreditNote, // Customer message about remaining shipping credit
    };
  }, [plantItems, shippingCalculation, quantityBreakdown, leafPointsEnabled, plantCreditsEnabled, shippingCreditsEnabled, leafPoints, plantCredits, shippingCredits, normalizeListingType, appliedDiscount]);

  // Check if all plants are from Thailand
  const isThailandPlant = useMemo(() => {
    if (!plantItems.length) return false;
    // Check if all plant items are from Thailand
    return plantItems.every(item => {
      const country = item.country || item.listingDetails?.country || '';
      return country === 'Thailand' || country === 'TH' || country.toLowerCase() === 'thailand';
    });
  }, [plantItems]);

  // Flight date options - generate Saturdays with Thailand-specific rule
  // State to hold flight date options from API
  const [flightDateOptions, setFlightDateOptions] = useState([]);
  const [isLoadingFlightDates, setIsLoadingFlightDates] = useState(false);

  // Calculate the starting Saturday based on existing logic
  const calculateStartingSaturday = useCallback(() => {
    console.log('🔍 [calculateStartingSaturday] Starting calculation...', {
      plantItemsLength: plantItems.length,
      isThailandPlant,
    });

    if (!plantItems.length) {
      console.log('⚠️ [calculateStartingSaturday] No plantItems, returning null');
      return null;
    }

    let startSaturday;

    // PRIORITY 1: Check if we have a locked flight date from existing orders
    // If user has existing "Ready to Fly" + "Pending" orders, use that flight date
    if (lockedFlightDate) {
      console.log('🔒 [flightDateOptions] Locked flight date detected:', lockedFlightDate);
      const lockedDate = new Date(lockedFlightDate);
      lockedDate.setHours(0, 0, 0, 0);

      // Use the locked date as the starting Saturday
      startSaturday = getNextSaturday(lockedDate);
      console.log('✅ [flightDateOptions] Using locked flight date as starting Saturday:', startSaturday.toISOString().split('T')[0]);
    } else if (isThailandPlant) {
      // Thailand rule: 
      // 1. If plant has flight date, use that date (find next Saturday on/after it)
      // 2. Otherwise: today + 7 days, then move to next Saturday on/after that date
      console.log('🇹🇭 [flightDateOptions] Thailand plant detected - using Thailand-specific rule');
      
      // First, try to find plant flight dates
      const flightDates = [];
      plantItems.forEach((item) => {
        if (item.flightDates && Array.isArray(item.flightDates)) {
          item.flightDates.forEach(date => {
            const dateStr = typeof date === 'string' ? date : (date?.date || date);
            if (dateStr && dateStr !== 'N/A') {
              flightDates.push(dateStr);
            }
          });
        } else if (item.plantFlightDate || item.listingDetails?.plantFlightDate) {
          const flightDateStr = item.plantFlightDate || item.listingDetails.plantFlightDate;
          if (flightDateStr && flightDateStr !== 'N/A') {
            flightDates.push(flightDateStr);
          }
        }
      });
      
      console.log('🇹🇭 [flightDateOptions] Thailand plant flight dates found:', flightDates);
      
      if (flightDates.length > 0) {
        // Use plant flight date: parse and get next Saturday on/after the latest date
        const parsedDates = flightDates
          .map(dateStr => parseFlightDate(dateStr))
          .filter(date => date !== null)
          .sort((a, b) => b.getTime() - a.getTime()); // Sort descending to get latest date first
        
        if (parsedDates.length > 0) {
          const latestFlightDate = parsedDates[0]; // Latest date is now first after descending sort
          console.log('🇹🇭 [flightDateOptions] Using latest plant flight date:', latestFlightDate.toISOString().split('T')[0]);
          // Get next Saturday on or after the latest plant flight date
          startSaturday = getNextSaturday(latestFlightDate);
          console.log('✅ [flightDateOptions] Thailand first suggested Saturday (from latest plant date):', startSaturday.toISOString().split('T')[0]);
        } else {
          // Fallback to today + 7 days if parsing failed
          console.log('⚠️ [flightDateOptions] Failed to parse plant flight dates, falling back to today + 7 days');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const sevenDaysLater = new Date(today);
          sevenDaysLater.setDate(today.getDate() + 7);
          startSaturday = getNextSaturday(sevenDaysLater);
        }
      } else {
        // No plant flight date: today + 7 days, then move to next Saturday on/after that date
        console.log('🇹🇭 [flightDateOptions] No plant flight date found, using today + 7 days rule');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // today + 7 days
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7);
        
        console.log('📅 [flightDateOptions] Thailand calculation:', {
          today: today.toISOString().split('T')[0],
          sevenDaysLater: sevenDaysLater.toISOString().split('T')[0],
        });
        
        // Get next Saturday on or after sevenDaysLater
        startSaturday = getNextSaturday(sevenDaysLater);
        
        console.log('✅ [flightDateOptions] Thailand first suggested Saturday (from today + 7):', startSaturday.toISOString().split('T')[0]);
      }
    } else {
      // Non-Thailand: use existing logic with plant flight dates
      console.log('🌍 [flightDateOptions] Non-Thailand plant - using plant flight dates');
      
      // Collect all flight dates from plant items
      const flightDates = [];
      console.log('🔍 [flightDateOptions] Checking plantItems for flight dates...');
      
      plantItems.forEach((item, index) => {
        console.log(`🔍 [flightDateOptions] Checking item ${index} (${item.plantCode}):`, {
          hasFlightDates: !!item.flightDates,
          flightDatesType: Array.isArray(item.flightDates) ? 'array' : typeof item.flightDates,
          flightDatesValue: item.flightDates,
          hasListingDetails: !!item.listingDetails,
          listingDetailsFlightDates: item.listingDetails?.flightDates,
          plantFlightDate: item.plantFlightDate,
          listingDetailsPlantFlightDate: item.listingDetails?.plantFlightDate,
        });
        
        // Check multiple possible locations for flight dates
        let dates = null;
        
        if (item.flightDates && Array.isArray(item.flightDates)) {
          dates = item.flightDates;
          console.log(`✅ [flightDateOptions] Found dates in item.flightDates for ${item.plantCode}:`, dates);
        } else if (item.listingDetails?.flightDates && Array.isArray(item.listingDetails.flightDates)) {
          dates = item.listingDetails.flightDates;
          console.log(`✅ [flightDateOptions] Found dates in item.listingDetails.flightDates for ${item.plantCode}:`, dates);
        } else if (item.plantFlightDate || item.listingDetails?.plantFlightDate) {
          const flightDateStr = item.plantFlightDate || item.listingDetails.plantFlightDate;
          if (flightDateStr && flightDateStr !== 'N/A') {
            dates = [{ date: flightDateStr }];
            console.log(`✅ [flightDateOptions] Found date string for ${item.plantCode}:`, flightDateStr);
          }
        }

        if (dates && Array.isArray(dates)) {
          dates.forEach(date => {
            const dateStr = typeof date === 'string' ? date : (date?.date || date);
            if (dateStr && dateStr !== 'N/A') {
              flightDates.push(dateStr);
              console.log(`📅 [flightDateOptions] Added date string:`, dateStr);
            }
          });
        } else {
          console.log(`⚠️ [flightDateOptions] No dates found for ${item.plantCode}`);
        }
      });

      console.log('🔍 [flightDateOptions] Collected flight dates:', flightDates);

      // Parse all flight dates and find the earliest one
      console.log('🔍 [flightDateOptions] Parsing flight dates...');
      const parsedDates = flightDates
        .map(dateStr => {
          const parsed = parseFlightDate(dateStr);
          console.log(`🔍 [flightDateOptions] Parsing "${dateStr}":`, parsed ? parsed.toISOString() : 'null');
          return parsed;
        })
        .filter(date => date !== null)
        .sort((a, b) => b.getTime() - a.getTime()); // Sort descending to get latest date first

      console.log('🔍 [flightDateOptions] Parsed dates (sorted latest first):', parsedDates.map(d => d.toISOString()));

      // Determine start date - use latest parsed date (greatest date) or fallback to today
      let startDate;
      if (parsedDates.length > 0) {
        startDate = parsedDates[0]; // Latest date is first after descending sort
        console.log('✅ [flightDateOptions] Using latest parsed date (greatest date):', startDate.toISOString());
      } else {
        // If no flight dates found, start from next Saturday from today
        startDate = new Date();
        console.log('⚠️ [flightDateOptions] No parsed dates, using today:', startDate.toISOString());
      }

      // Get the next Saturday from the start date
      startSaturday = getNextSaturday(startDate);
      console.log('🔍 [flightDateOptions] Next Saturday from start date:', startSaturday.toISOString());
    }

    // Return the starting Saturday as ISO date string
    const year = startSaturday.getFullYear();
    const month = String(startSaturday.getMonth() + 1).padStart(2, '0');
    const day = String(startSaturday.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;

    console.log('✅ [calculateStartingSaturday] Calculated starting Saturday:', iso);
    return iso;
  }, [plantItems, isThailandPlant, lockedFlightDate, parseFlightDate, getNextSaturday]);

  // Fetch active flight dates from API
  useEffect(() => {
    const fetchActiveFlightDates = async () => {
      const startDateISO = calculateStartingSaturday();
      
      if (!startDateISO) {
        console.log('⚠️ [fetchActiveFlightDates] No start date calculated, skipping API call');
        setFlightDateOptions([]);
        return;
      }

      try {
        setIsLoadingFlightDates(true);
        console.log('📅 [fetchActiveFlightDates] Calling API with start date:', startDateISO);

        const response = await getActiveFlightDatesApi(startDateISO, 3);

        if (response.success && response.data?.activeDates) {
          const activeDates = response.data.activeDates;
          console.log('✅ [fetchActiveFlightDates] Received active dates:', activeDates);
          setFlightDateOptions(activeDates);
        } else {
          console.error('❌ [fetchActiveFlightDates] API returned no active dates');
          // Fallback: generate 3 consecutive Saturdays as before
          const fallbackOptions = generateFallbackOptions(startDateISO);
          setFlightDateOptions(fallbackOptions);
        }
      } catch (error) {
        console.error('❌ [fetchActiveFlightDates] Error fetching active dates:', error);
        // Fallback: generate 3 consecutive Saturdays as before
        const fallbackOptions = generateFallbackOptions(startDateISO);
        setFlightDateOptions(fallbackOptions);
      } finally {
        setIsLoadingFlightDates(false);
      }
    };

    fetchActiveFlightDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantItems.length, isThailandPlant, lockedFlightDate]);

  // Fallback function to generate 3 consecutive Saturdays (old logic)
  const generateFallbackOptions = useCallback((startDateISO) => {
    console.log('🔄 [generateFallbackOptions] Generating fallback options from:', startDateISO);
    
    const [year, month, day] = startDateISO.split('-').map(Number);
    const startSaturday = new Date(year, month - 1, day);
    
    const options = [];
    for (let i = 0; i < 3; i++) {
      const saturday = new Date(startSaturday);
      saturday.setDate(startSaturday.getDate() + (i * 7));
      
      const y = saturday.getFullYear();
      const m = String(saturday.getMonth() + 1).padStart(2, '0');
      const d = String(saturday.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      const label = formatDateLabel(saturday);
      const key = normalizeFlightKey(label);
      
      options.push({
        date: label,
        iso: iso,
        key: key,
        label: label,
        displayLabel: label,
        value: label,
      });
    }
    
    console.log('✅ [generateFallbackOptions] Generated fallback options:', options);
    return options;
  }, [formatDateLabel, normalizeFlightKey]);

  // Flight lock info
  const flightLockInfo = useMemo(() => {
    if (!lockedFlightDate || !lockedFlightKey) return null;

    return {
      date: lockedFlightDate,
      key: lockedFlightKey,
      reason: 'Existing order requires this flight date',
    };
  }, [lockedFlightDate, lockedFlightKey]);

  // Calculate order cut-off date based on actual business rules
  // This represents the deadline to place an order for the currently selected/shown flight date
  // Cutoff = Selected Flight Date - 7 days, until 11:59 PM Eastern Time
  // Priority: selectedFlightDate > first available option
  const orderCutoffDate = useMemo(() => {
    if (!plantItems.length || !flightDateOptions || flightDateOptions.length === 0) return null;

    try {
      // PRIORITY: Use the selected flight date if user has selected one, otherwise use first option
      const targetFlightDate = selectedFlightDate?.iso || flightDateOptions[0]?.iso;

      if (!targetFlightDate) return null;

      const flightDate = new Date(targetFlightDate);
      if (isNaN(flightDate.getTime())) return null;

      // Calculate cutoff: 7 days before the flight date, until 11:59 PM ET
      const cutoff = new Date(flightDate);
      cutoff.setDate(flightDate.getDate() - 7);

      console.log('📅 [orderCutoffDate] Calculated:', {
        selectedFlightDateIso: selectedFlightDate?.iso || 'none',
        firstOptionIso: flightDateOptions[0]?.iso,
        usedFlightDate: targetFlightDate,
        flightDate: flightDate.toISOString().split('T')[0],
        cutoff: cutoff.toISOString().split('T')[0],
        cutoffRule: 'Flight date - 7 days, until 11:59 PM ET'
      });

      return cutoff;
    } catch (error) {
      console.error('Error calculating order cutoff date:', error);
      return null;
    }
  }, [plantItems, flightDateOptions, selectedFlightDate]);

  // Effects
  useEffect(() => {
    let anim;
    if (checkingOrders) {
      shimmerAnim.setValue(0);
      anim = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [checkingOrders, shimmerAnim]);

  // Shimmer animation for shipping calculation skeleton
  useEffect(() => {
    let anim;
    if (isCalculatingShipping) {
      shimmerAnim.setValue(0);
      anim = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isCalculatingShipping, shimmerAnim]);

  // Helper to convert normalized listingType to API format
  const convertListingTypeToApiFormat = useCallback((listingType) => {
    if (!listingType) return 'Single Plant';
    
    const normalized = listingType.toLowerCase().trim();
    
    // Map to API expected formats
    if (normalized.includes('single') || normalized === 'single_grower') {
      return 'Single Plant';
    }
    if (normalized.includes('wholesale')) {
      return 'Wholesale';
    }
    if (normalized.includes('grower') || normalized.includes('choice')) {
      return "Grower's Choice";
    }
    
    // Default fallback
    return 'Single Plant';
  }, []);

  // Fetch shipping calculation - memoized to prevent infinite loops
  const fetchShippingCalculation = useCallback(async () => {
    if (!plantItems.length || !selectedFlightDate?.iso) {
      console.log('⚠️ [fetchShippingCalculation] Skipping - missing plantItems or flight date', {
        plantItemsLength: plantItems.length,
        hasSelectedFlightDate: !!selectedFlightDate?.iso,
      });
      setIsCalculatingShipping(false);
      setShippingCalculation(prev => ({ ...prev, loading: false }));
      return;
    }

    setIsCalculatingShipping(true);
    setShippingCalculation(prev => ({ ...prev, loading: true }));

    try {
      console.log('📦 [fetchShippingCalculation] Starting calculation:', {
        plantItemsCount: plantItems.length,
        flightDate: selectedFlightDate.iso,
        upsNextDayEnabled,
      });

      const plants = plantItems.map((item, index) => {
        const quantity = item.quantity || 1;
        const totalAmount = item.totalAmount || (item.price || 0) * quantity;
        const unitPrice = totalAmount / quantity;
        
        const apiListingType = convertListingTypeToApiFormat(item.listingType);
        
        const plantItem = {
          plantCode: item.plantCode,
          quantity: quantity,
          listingType: apiListingType,
          price: unitPrice || 0,
        };

        // Add optional fields if available
        if (item.selectedPotSize || item.potSize) {
          plantItem.potSize = item.selectedPotSize || item.potSize;
        }
        if (item.height || item.approximateHeight) {
          plantItem.height = item.height || item.approximateHeight;
          plantItem.approximateHeight = item.approximateHeight || item.height;
        }

        console.log(`📦 [fetchShippingCalculation] Plant ${index}:`, {
          plantCode: plantItem.plantCode,
          quantity: plantItem.quantity,
          listingType: item.listingType,
          apiListingType: plantItem.listingType,
          price: plantItem.price,
          hasPotSize: !!plantItem.potSize,
          hasHeight: !!plantItem.height,
        });

        return plantItem;
      });

      // IMPORTANT: Do NOT pass user credits (leafPoints, plantCredits, shippingCredits) to shipping calculator
      // The shipping calculator's userCredits parameter is for PROMOTIONAL shipping credits only (e.g., $150 promo)
      // User point deductions are handled on the FRONTEND in orderSummary calculation to avoid double deduction
      console.log('💳 [fetchShippingCalculation] User credits (handled on frontend):', {
        leafPointsEnabled,
        leafPoints,
        plantCreditsEnabled,
        plantCredits,
        shippingCreditsEnabled,
        shippingCredits,
        totalCredits: (leafPointsEnabled ? leafPoints : 0) + 
                      (plantCreditsEnabled ? plantCredits : 0) + 
                      (shippingCreditsEnabled ? shippingCredits : 0),
        note: 'Credits are deducted in orderSummary calculation, not in shipping calculator'
      });

      // Prepare free shipping discount info if a freeShipping discount is applied
      let freeShippingDiscount = null;
      if (appliedDiscount.discountDetails && appliedDiscount.discountDetails.type === 'freeShipping') {
        freeShippingDiscount = {
          freeUpsShipping: appliedDiscount.discountDetails.freeUpsShipping || false,
          freeAirCargo: appliedDiscount.discountDetails.freeAirCargo || false,
        };
        console.log('🚚 [fetchShippingCalculation] Free shipping discount applied:', freeShippingDiscount);
      }

      // Use joiner shipping API if user is an approved joiner
      // Pass 0 for userCredits - user points are deducted on frontend to avoid double deduction
      const result = isJoinerApproved
        ? await calculateCheckoutShippingJoinerApi(
            plants, 
            selectedFlightDate.iso, 
            upsNextDayEnabled, 
            0, // userCredits: 0 (user points deducted on frontend)
            freeShippingDiscount
          )
        : await calculateCheckoutShippingApi(
            plants, 
            selectedFlightDate.iso, 
            upsNextDayEnabled, 
            0, // userCredits: 0 (user points deducted on frontend)
            freeShippingDiscount
          );

      if (result && result.success) {
        // The API returns data directly, not nested in result.data
        const shippingData = result.data || result;
        console.log('✅ [fetchShippingCalculation] Received shipping calculation:', shippingData);
        
        // Debug air cargo values
        console.log('✈️ [fetchShippingCalculation] Air Cargo breakdown:', {
          airCargoTotal: shippingData.airCargoTotal,
          regularAirCargoTotal: shippingData.regularAirCargoTotal,
          wholesaleAirCargoTotal: shippingData.wholesaleAirCargoTotal,
          appliedAirBaseCredit: shippingData.appliedAirBaseCredit,
          isSucceedingOrder: shippingData.isSucceedingOrder,
        });
        
        // Only update if data actually changed to prevent unnecessary re-renders
        setShippingCalculation(prev => {
          // Compare without loading field
          const prevWithoutLoading = { ...prev };
          delete prevWithoutLoading.loading;
          const newWithoutLoading = { ...shippingData };
          delete newWithoutLoading.loading;
          
          const prevKey = JSON.stringify(prevWithoutLoading);
          const newKey = JSON.stringify(newWithoutLoading);
          if (prevKey === newKey) {
            console.log('⏸️ [fetchShippingCalculation] Shipping data unchanged, skipping update');
            return { ...prev, loading: false };
          }
          return { ...shippingData, loading: false };
        });
        setIsCalculatingShipping(false);
      } else {
        const errorMessage = result?.error || result?.message || 'Unknown error';
        console.error('⚠️ [fetchShippingCalculation] Shipping calculation failed:', {
          success: result?.success,
          error: errorMessage,
          result: result,
        });
        // Set default empty calculation to prevent undefined errors
        setShippingCalculation({
          shippingTotal: 0,
          upsNextDayUpgrade: 0,
          airCargoTotal: 0,
          wholesaleAirCargoTotal: 0,
          appliedAirBaseCredit: 0,
          shippingCreditsDiscount: 0,
          finalShippingCost: 0,
          totalShippingCost: 0,
          discount: 0,
          total: 0,
          loading: false,
        });
        setIsCalculatingShipping(false);
      }
    } catch (error) {
      console.error('❌ [fetchShippingCalculation] Error calculating shipping:', {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      // Set default empty calculation to prevent undefined errors
      setShippingCalculation({
        shippingTotal: 0,
        upsNextDayUpgrade: 0,
        airCargoTotal: 0,
        wholesaleAirCargoTotal: 0,
        appliedAirBaseCredit: 0,
        shippingCreditsDiscount: 0,
        finalShippingCost: 0,
        totalShippingCost: 0,
        discount: 0,
        total: 0,
        loading: false,
      });
      setIsCalculatingShipping(false);
    }
  }, [
    plantItems, 
    selectedFlightDate, 
    upsNextDayEnabled, 
    leafPointsEnabled, 
    plantCreditsEnabled, 
    shippingCreditsEnabled, 
    leafPoints, 
    plantCredits, 
    shippingCredits, 
    convertListingTypeToApiFormat,
    appliedDiscount // Include appliedDiscount to trigger recalculation when discount changes
  ]);

  // Use ref to track if calculation is in progress to prevent infinite loops
  const isCalculatingRef = useRef(false);
  const lastCalculationParamsRef = useRef(null);

  useEffect(() => {
    // Skip if already calculating
    if (isCalculatingRef.current) {
      console.log('⏸️ [fetchShippingCalculation] Skipping - calculation in progress');
      return;
    }

    // Create a stable key from dependencies to detect actual changes
    const calculationKey = JSON.stringify({
      plantItemsCount: plantItems.length,
      plantCodes: plantItems.map(i => i.plantCode).sort(),
      flightDate: selectedFlightDate?.iso,
      upsNextDay: upsNextDayEnabled,
      leafPointsEnabled,
      plantCreditsEnabled,
      shippingCreditsEnabled,
      leafPoints,
      plantCredits,
      shippingCredits,
      freeShippingDiscount: appliedDiscount.discountDetails?.type === 'freeShipping' ? {
        freeUpsShipping: appliedDiscount.discountDetails.freeUpsShipping,
        freeAirCargo: appliedDiscount.discountDetails.freeAirCargo,
      } : null,
    });

    // Skip if params haven't actually changed
    if (lastCalculationParamsRef.current === calculationKey) {
      console.log('⏸️ [fetchShippingCalculation] Skipping - no changes detected');
      return;
    }

    console.log('🔄 [fetchShippingCalculation] Triggering calculation with key:', calculationKey);
    lastCalculationParamsRef.current = calculationKey;
    isCalculatingRef.current = true;

    fetchShippingCalculation().finally(() => {
      isCalculatingRef.current = false;
      setIsCalculatingShipping(false);
    });
  }, [fetchShippingCalculation, plantItems, selectedFlightDate, upsNextDayEnabled, leafPointsEnabled, plantCreditsEnabled, shippingCreditsEnabled, leafPoints, plantCredits, shippingCredits, appliedDiscount]);

  // Check for existing orders - use ref to access latest flightDateOptions without causing re-renders
  const flightDateOptionsRef = useRef(flightDateOptions);
  const shouldRecheckOrdersRef = useRef(false);
  const pendingFlightDateRef = useRef(null);
  
  useEffect(() => {
    flightDateOptionsRef.current = flightDateOptions;
    
    // If we have pending flight date (from earlier check) and now have options, re-check
    if (shouldRecheckOrdersRef.current && pendingFlightDateRef.current && flightDateOptions.length > 0) {
      console.log('🔄 [checkExistingOrders] Flight options now available, re-checking existing orders...');
      shouldRecheckOrdersRef.current = false;
      const flightDate = pendingFlightDateRef.current;
      pendingFlightDateRef.current = null;
      
      // Since we have an existing order (we're re-checking), disable selection and use existing order's flight date
      // Note: Cutoff check was already done in the main check, so we assume we're within cutoff here
      console.log('🔒 [Re-check Existing Orders] Disabling selection and locking to existing order date');
      
      setDisablePlantFlightSelection(true);
      setLockedFlightDate(flightDate);
      setLockedFlightKey(normalizeFlightKey(flightDate));
      
      // Find and auto-select the matching flight option
      const existingOrderIso = formatFlightDateToISO(flightDate, new Date().getFullYear());
      
      const flightOption = flightDateOptions.find(option => {
        if (option.iso === existingOrderIso) return true;
        if (option.key === normalizeFlightKey(flightDate)) return true;
        return false;
      });
      
      if (flightOption) {
        console.log('✅ [Re-check Existing Orders] Auto-selecting existing order flight date:', flightOption);
        setSelectedFlightDate(flightOption);
        if (flightOption.iso) {
          setCargoDate(flightOption.iso);
        }
        // Trigger shipping calculation after auto-selecting date
        console.log('🔄 [Re-check Existing Orders] Triggering shipping calculation for auto-selected date');
        setTimeout(() => {
          if (isCalculatingRef.current === false) {
            lastCalculationParamsRef.current = null; // Clear to force recalculation
          }
        }, 100);
      } else {
        // Fallback to first suggested option if exact match not found
        const firstSuggestedOption = flightDateOptions
          .filter(opt => opt.iso)
          .sort((a, b) => a.iso.localeCompare(b.iso))[0];
        
        if (firstSuggestedOption) {
          console.log('⚠️ [Re-check Existing Orders] Exact match not found, using first suggested option as fallback');
          setSelectedFlightDate(firstSuggestedOption);
          if (firstSuggestedOption.iso) {
            setCargoDate(firstSuggestedOption.iso);
          }
          // Trigger shipping calculation
          setTimeout(() => {
            if (isCalculatingRef.current === false) {
              lastCalculationParamsRef.current = null;
            }
          }, 100);
        }
      }
    }
    }, [flightDateOptions, formatFlightDateToISO, normalizeFlightKey]);

  console.log('🔍 [CheckoutController] About to define useFocusEffect for checkExistingOrders...');

  // Check for existing orders - runs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 [useFocusEffect-checkOrders] Hook triggered');
      let isCancelled = false;

    const checkExistingOrders = async () => {
      console.log('🔍 [checkExistingOrders] Starting order check...');
      console.log('🔍 [checkExistingOrders] plantItems.length:', plantItems.length);

      setCheckingOrders(true);
      try {
        console.log('🔍 [checkExistingOrders] About to call getBuyerOrdersApi...');
        const ordersResult = await getBuyerOrdersApi();
        console.log('🔍 [checkExistingOrders] getBuyerOrdersApi returned');

          if (isCancelled) return;
          
          console.log('📦 [checkExistingOrders] API response:', {
            success: ordersResult?.success,
            hasData: !!ordersResult?.data,
            dataType: Array.isArray(ordersResult?.data) ? 'array' : typeof ordersResult?.data,
            dataLength: Array.isArray(ordersResult?.data) ? ordersResult.data.length : 'N/A',
            sampleData: ordersResult?.data?.[0] ? {
              status: ordersResult.data[0].status,
              flightDate: ordersResult.data[0].flightDate,
              cargoDate: ordersResult.data[0].cargoDate,
            } : null,
          });
          
          // Handle different API response structures
          let ordersArray = [];
          if (ordersResult && ordersResult.success) {
            if (Array.isArray(ordersResult.data)) {
              ordersArray = ordersResult.data;
            } else if (ordersResult.data?.data?.orders && Array.isArray(ordersResult.data.data.orders)) {
              ordersArray = ordersResult.data.data.orders;
            } else if (ordersResult.data?.orders && Array.isArray(ordersResult.data.orders)) {
              ordersArray = ordersResult.data.orders;
            } else if (ordersResult.data?.data?.plants && Array.isArray(ordersResult.data.data.plants)) {
              // Extract orders from plant records
              const plants = ordersResult.data.data.plants;
              const orderMap = new Map();
              plants.forEach(plant => {
                const orderMeta = plant.order || {};
                const orderId = orderMeta.id || orderMeta.transactionNumber;
                if (orderId && !orderMap.has(orderId)) {
                  orderMap.set(orderId, {
                    ...orderMeta,
                    flightDate: plant.flightDate || orderMeta.flightDate,
                    cargoDate: plant.cargoDate || orderMeta.cargoDate,
                    status: orderMeta.status || plant.status,
                    deliveryStatus: orderMeta.deliveryStatus || null,
                    hubReceiver: orderMeta.hubReceiver || orderMeta.deliveryDetails?.hubReceiver || null,
                    hubReceiverId: orderMeta.hubReceiverId || orderMeta.deliveryDetails?.hubReceiverId || null,
                    deliveryDetails: orderMeta.deliveryDetails || {},
                  });
                }
              });
              ordersArray = Array.from(orderMap.values());
            }
          }
          
          console.log('📋 [checkExistingOrders] Processed orders array:', {
            count: ordersArray.length,
            firstOrder: ordersArray[0] ? {
              status: ordersArray[0].status,
              deliveryStatus: ordersArray[0].deliveryStatus,
              flightDate: ordersArray[0].flightDate,
              cargoDate: ordersArray[0].cargoDate,
              hubReceiver: ordersArray[0].hubReceiver,
              hubReceiverId: ordersArray[0].hubReceiverId,
              deliveryDetails: ordersArray[0].deliveryDetails,
            } : null,
          });
          
          if (ordersArray.length > 0) {
            // Filter for orders with status "Ready to Fly"
            // Only check status, not deliveryStatus (Ready to Fly orders may have deliveryStatus: null)
            console.log('🔍 [checkExistingOrders] Filtering orders - checking each order:');

            const readyToFlyOrders = ordersArray.filter((order, index) => {
              const status = (order.status || order.orderStatus || '').trim().toLowerCase();
              const isReadyToFly = status === 'ready to fly' || status === 'readytofly' || (status.includes('ready') && status.includes('fly'));

              console.log(`  Order ${index + 1}:`, {
                id: order.id || order.transactionNumber,
                status: order.status || order.orderStatus,
                statusLower: status,
                isReadyToFly,
                flightDate: order.flightDate || order.cargoDate,
              });

              return isReadyToFly;
            });

            console.log('✈️ [checkExistingOrders] Ready to Fly orders with Pending delivery:', {
              count: readyToFlyOrders.length,
              totalOrders: ordersArray.length,
              orders: readyToFlyOrders.map(o => ({
                status: o.status || o.orderStatus,
                deliveryStatus: o.deliveryStatus,
                flightDate: o.flightDate,
                cargoDate: o.cargoDate,
                createdAt: o.createdAt,
                orderDate: o.orderDate,
              })),
            });
            
            if (readyToFlyOrders.length > 0) {
              // Sort by creation date to get the FIRST (oldest) order
              // Use createdAt, orderDate, or timestamp - whichever is available
              const sortedOrders = readyToFlyOrders.sort((a, b) => {
                const dateA = a.createdAt || a.orderDate || a.timestamp || 0;
                const dateB = b.createdAt || b.orderDate || b.timestamp || 0;
                // Convert to comparable values
                const timeA = dateA instanceof Date ? dateA.getTime() : (typeof dateA === 'number' ? dateA : new Date(dateA).getTime() || 0);
                const timeB = dateB instanceof Date ? dateB.getTime() : (typeof dateB === 'number' ? dateB : new Date(dateB).getTime() || 0);
                return timeA - timeB; // Ascending order: oldest first
              });
              
              // Get the FIRST (oldest) order
              const firstOrder = sortedOrders[0];
              const flightDate = firstOrder.flightDate || firstOrder.cargoDate || firstOrder.selectedFlightDate;
              
              console.log('🔒 [checkExistingOrders] First Ready to Fly order found with flight date:', {
                orderIndex: 0,
                orderStatus: firstOrder.status || firstOrder.orderStatus,
                flightDate: flightDate,
                createdAt: firstOrder.createdAt || firstOrder.orderDate,
                totalReadyToFlyOrders: readyToFlyOrders.length,
              });
              
              if (flightDate) {
                // CUTOFF DATE LOGIC:
                // Cutoff date = flight date - 7 days at 11:59 PM ET
                // If cutoff date < current date ET: User can select new flight date (enable selection)
                // If cutoff date >= current date ET: Flight selector disabled, use existing order's flight date
                
                // Parse the existing flight date
                let existingFlightDate = null;
                if (typeof flightDate === 'string') {
                  // Try ISO format first (YYYY-MM-DD)
                  existingFlightDate = new Date(flightDate + 'T00:00:00');
                } else if (flightDate?._seconds) {
                  // Firestore timestamp
                  existingFlightDate = new Date(flightDate._seconds * 1000);
                } else if (flightDate instanceof Date) {
                  existingFlightDate = new Date(flightDate);
                }

                // Validate the date was parsed successfully
                if (!existingFlightDate || isNaN(existingFlightDate.getTime())) {
                  console.warn('⚠️ [checkExistingOrders] Could not parse flight date:', flightDate);
                  // If we can't parse the date, allow selection to be safe
                  setDisablePlantFlightSelection(false);
                  setLockedFlightDate(null);
                  setLockedFlightKey(null);
                  if (!isCancelled) {
                    setCheckingOrders(false);
                  }
                  return;
                }

                // Get current date in Eastern Time (America/New_York) as YYYY-MM-DD string
                const now = new Date();
                const nowETString = now.toLocaleDateString('en-CA', { 
                  timeZone: 'America/New_York'
                }); // en-CA gives YYYY-MM-DD format
                
                // Calculate cutoff date: 7 days before flight date
                // Get flight date as YYYY-MM-DD string
                const flightDateString = existingFlightDate.toISOString().split('T')[0];
                
                // Calculate cutoff date by subtracting 7 days
                const cutoffDateObj = new Date(existingFlightDate);
                cutoffDateObj.setDate(existingFlightDate.getDate() - 7);
                const cutoffDateString = cutoffDateObj.toISOString().split('T')[0];

                // Compare date strings: if current ET date > cutoff date, we've passed the cutoff
                // cutoff date < current date ET means we've passed the cutoff
                const isPastCutoff = cutoffDateString < nowETString;

                console.log('📅 [checkExistingOrders] CUTOFF DATE CHECK:', {
                  existingFlightDate: flightDateString,
                  cutoffDate: cutoffDateString,
                  currentDateET: nowETString,
                  isPastCutoff,
                  decision: isPastCutoff
                    ? '✅ Past cutoff → Allow new flight date selection'
                    : '🔒 Before cutoff → Lock to existing flight date'
                });

                // If past cutoff date, allow buyer to select new flight date
                if (isPastCutoff) {
                  console.log('🔓 [checkExistingOrders] Past cutoff date → Allowing new flight date selection');
                  setDisablePlantFlightSelection(false);
                  setLockedFlightDate(null);
                  setLockedFlightKey(null);
                  if (!isCancelled) {
                    setCheckingOrders(false);
                  }
                  return;
                }

                // If before cutoff (within cutoff period), disable selection and use existing order's flight date
                console.log('🔒 [checkExistingOrders] Before cutoff → Disabling selection and locking to existing order date');

                // Disable selection when within cutoff (existing order exists and cutoff hasn't passed)
                // Set this IMMEDIATELY so UI is disabled even if flight options aren't ready yet
                console.log('🔒 [checkExistingOrders] SETTING disablePlantFlightSelection to TRUE');
                setDisablePlantFlightSelection(true);
                setLockedFlightDate(flightDate);
                setLockedFlightKey(normalizeFlightKey(flightDate));
                
                console.log('🔒 [checkExistingOrders] State set:', {
                  disablePlantFlightSelection: true,
                  lockedFlightDate: flightDate,
                  lockedFlightKey: normalizeFlightKey(flightDate),
                });

                // Get current flight options to find matching option
                const currentFlightOptions = flightDateOptionsRef.current;

                if (currentFlightOptions && currentFlightOptions.length > 0) {
                  // Convert existing order flight date to ISO format
                  const existingOrderIso = formatFlightDateToISO(flightDate, new Date().getFullYear());

                  console.log('🔒 [checkExistingOrders] Looking for matching flight option:', {
                    existingOrderDate: flightDate,
                    existingOrderIso: existingOrderIso,
                    flightDateOptionsCount: currentFlightOptions.length,
                  });

                  // Find matching flight option for the existing order's date
                  const flightOption = currentFlightOptions.find(option => {
                    if (option.iso === existingOrderIso) return true;
                    if (option.key === normalizeFlightKey(flightDate)) return true;
                    // Try partial match on date parts
                    if (existingOrderIso && option.iso) {
                      const existingParts = existingOrderIso.split('-');
                      const optionParts = option.iso.split('-');
                      if (existingParts.length === 3 && optionParts.length === 3) {
                        // Match year-month-day
                        return existingParts[0] === optionParts[0] && 
                               existingParts[1] === optionParts[1] && 
                               existingParts[2] === optionParts[2];
                      }
                    }
                    return false;
                  });

                  if (flightOption) {
                    console.log('✅ [checkExistingOrders] Auto-selecting existing order flight date:', flightOption);
                    setSelectedFlightDate(flightOption);
                    if (flightOption.iso) {
                      setCargoDate(flightOption.iso);
                    }
                    // Trigger shipping calculation after auto-selecting date
                    console.log('🔄 [checkExistingOrders] Triggering shipping calculation for auto-selected date');
                    setTimeout(() => {
                      if (isCalculatingRef.current === false) {
                        lastCalculationParamsRef.current = null; // Clear to force recalculation
                      }
                    }, 100);
                  } else {
                    // If no exact match found, use first suggested option as fallback
                    const firstSuggestedOption = currentFlightOptions
                      .filter(opt => opt.iso)
                      .sort((a, b) => a.iso.localeCompare(b.iso))[0];
                    
                    if (firstSuggestedOption) {
                      console.log('⚠️ [checkExistingOrders] No exact match found, using first suggested option as fallback:', firstSuggestedOption);
                      setSelectedFlightDate(firstSuggestedOption);
                      if (firstSuggestedOption.iso) {
                        setCargoDate(firstSuggestedOption.iso);
                      }
                      // Trigger shipping calculation
                      setTimeout(() => {
                        if (isCalculatingRef.current === false) {
                          lastCalculationParamsRef.current = null;
                        }
                      }, 100);
                    }
                  }
                } else {
                  // No flight options available yet - wait for them to be calculated
                  // This can happen for Thailand plants where options are calculated based on today + 7 days
                  console.log('⏳ [checkExistingOrders] No flight options available yet, will check when options are ready');
                  console.log('⏳ [checkExistingOrders] Storing flight date for later comparison:', flightDate);
                  // Store the flight date for later comparison and mark that we need to re-check
                  setLockedFlightDate(flightDate);
                  setLockedFlightKey(normalizeFlightKey(flightDate));
                  pendingFlightDateRef.current = flightDate;
                  shouldRecheckOrdersRef.current = true;
                  // Will re-check when flightDateOptions become available (handled in useEffect above)
                }
              }
            } else {
              console.log('✅ [checkExistingOrders] No Ready to Fly orders found - flight selection unlocked');
              // Clear locks if no orders found
              setLockedFlightDate(null);
              setLockedFlightKey(null);
              setDisablePlantFlightSelection(false);
            }
          } else {
            console.log('✅ [checkExistingOrders] No orders found - flight selection unlocked');
            // Clear locks if no orders
            setLockedFlightDate(null);
            setLockedFlightKey(null);
            setDisablePlantFlightSelection(false);
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('❌ [checkExistingOrders] Error checking existing orders:', error);
          }
        } finally {
          if (!isCancelled) {
            setCheckingOrders(false);
          }
        }
      };

      console.log('🎯 [useFocusEffect-checkOrders] About to call checkExistingOrders()...');
      checkExistingOrders();
      console.log('🎯 [useFocusEffect-checkOrders] checkExistingOrders() called (async, will continue in background)');

      return () => {
        console.log('🎯 [useFocusEffect-checkOrders] Cleanup function called');
        isCancelled = true;
      };
    }, [formatFlightDateToISO, normalizeFlightKey]) // Dependencies for useCallback
  ); // End of useFocusEffect

  // Load delivery details
  // Check if user is a joiner with approved receiver
  useEffect(() => {
    const checkJoinerStatus = async () => {
      // Check if API returned a graceful failure (no token during logout)
      // If so, skip processing to avoid errors
      try {
        const receiverRequestResult = await getMyReceiverRequestApi();
        
        // If API returned gracefully (no token), skip processing
        if (!receiverRequestResult || receiverRequestResult.success === false && receiverRequestResult.message?.includes('token')) {
          console.log('[CheckoutController] Skipping joiner check - no token (likely during logout)');
          return;
        }
        console.log('[CheckoutController] Receiver request result:', receiverRequestResult);
        
        if (receiverRequestResult?.success && receiverRequestResult?.data?.isJoiner) {
          const receiverData = receiverRequestResult.data;
          setIsJoiner(true);
          
          // Check if request is approved
          if (receiverData.status === 'approved') {
            setIsJoinerApproved(true);
            setDisableAddressSelection(true);
            setDisableFlightSelection(true);
            
            // Use structured shipping address data if available, otherwise parse the string
            if (receiverData.shippingAddressData) {
              // Use structured data directly (preferred)
              const addr = receiverData.shippingAddressData;
              setDeliveryDetails({
                address: {
                  street: addr.street || addr.streetAddress || addr.address || '',
                  city: addr.city || '',
                  state: addr.state || '',
                  zipCode: addr.zipCode || '',
                  country: addr.country || 'US',
                },
                contactPhone: '',
                specialInstructions: 'All plants will be delivered to receiver address',
              });
            } else {
              // Fallback: Parse shipping address string to extract components
              // Format: "street, city, state zipCode" or similar
              const shippingAddress = receiverData.shippingAddress || '';
              if (shippingAddress) {
                // Try to parse the address string
                // Common formats:
                // "123 Main St, New York, NY 10001"
                // "123 Main St, New York, NY"
                const addressParts = shippingAddress.split(',').map(s => s.trim());
                
                let street = '';
                let city = '';
                let state = '';
                let zipCode = '';
                
                if (addressParts.length >= 3) {
                  street = addressParts[0] || '';
                  city = addressParts[1] || '';
                  const stateZip = addressParts[2] || '';
                  // Try to split state and zip (e.g., "NY 10001")
                  const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
                  if (stateZipMatch) {
                    state = stateZipMatch[1];
                    zipCode = stateZipMatch[2];
                  } else {
                    // If no zip code match, might be just state
                    state = stateZip;
                  }
                } else if (addressParts.length === 2) {
                  street = addressParts[0] || '';
                  // Second part might be city or city+state+zip
                  const secondPart = addressParts[1] || '';
                  // Try to see if it contains state and zip
                  const stateZipMatch = secondPart.match(/\b([A-Z]{2})\s+(\d{5}(-\d{4})?)\b/);
                  if (stateZipMatch) {
                    city = secondPart.substring(0, stateZipMatch.index).trim();
                    state = stateZipMatch[1];
                    zipCode = stateZipMatch[2];
                  } else {
                    city = secondPart;
                  }
                } else if (addressParts.length === 1) {
                  street = addressParts[0] || '';
                }
                
                // Set delivery details to receiver's address
                setDeliveryDetails({
                  address: {
                    street: street || shippingAddress,
                    city: city || '',
                    state: state || '',
                    zipCode: zipCode || '',
                    country: 'US',
                  },
                  contactPhone: '',
                  specialInstructions: 'All plants will be delivered to receiver address',
                });
              }
            }
            
            // Set receiver's flight date (prefer receiverFlightDate from orders, fallback to expirationDate)
            const flightDate = receiverData.receiverFlightDate || receiverData.expirationDate;
            if (flightDate) {
              setReceiverFlightDate(flightDate);
              
              // Convert to ISO format and set as cargoDate
              try {
                let date;
                // Handle different date formats
                if (typeof flightDate === 'string') {
                  // If already in ISO format (YYYY-MM-DD), use it directly
                  if (/^\d{4}-\d{2}-\d{2}$/.test(flightDate)) {
                    setCargoDate(flightDate);
                    const dateObj = new Date(flightDate);
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const label = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
                    setSelectedFlightDate({ label, iso: flightDate });
                  } else {
                    date = new Date(flightDate);
                    if (!isNaN(date.getTime())) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const isoDate = `${year}-${month}-${day}`;
                      setCargoDate(isoDate);
                      
                      // Also set selectedFlightDate
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const label = `${monthNames[date.getMonth()]} ${date.getDate()}`;
                      setSelectedFlightDate({ label, iso: isoDate });
                    }
                  }
                } else {
                  date = new Date(flightDate);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    setCargoDate(isoDate);
                    
                    // Also set selectedFlightDate
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const label = `${monthNames[date.getMonth()]} ${date.getDate()}`;
                    setSelectedFlightDate({ label, iso: isoDate });
                  }
                }
              } catch (error) {
                console.error('Error parsing receiver flight date:', error);
              }
            }
          } else {
            setIsJoinerApproved(false);
            setDisableAddressSelection(false);
            setDisableFlightSelection(false);
          }
        } else {
          setIsJoiner(false);
          setIsJoinerApproved(false);
          setDisableAddressSelection(false);
          setDisableFlightSelection(false);
        }
      } catch (error) {
        console.error('[CheckoutController] Error checking joiner status:', error);
        setIsJoiner(false);
        setIsJoinerApproved(false);
        setDisableAddressSelection(false);
        setDisableFlightSelection(false);
      }
    };

    checkJoinerStatus();
  }, []);

  useEffect(() => {
    const loadDeliveryDetails = async () => {
      // Skip loading if user is an approved joiner (address already set from receiver)
      if (isJoinerApproved) {
        return;
      }
      
      try {
        const addressResult = await getAddressBookEntriesApi();
        if (addressResult && addressResult.success && addressResult.data && addressResult.data.length > 0) {
          const defaultAddress = addressResult.data[0];
          if (defaultAddress) {
            setDeliveryDetails({
              address: {
                street: defaultAddress.street || defaultAddress.streetAddress || defaultAddress.address || '',
                city: defaultAddress.city || '',
                state: defaultAddress.state || '',
                zipCode: defaultAddress.zipCode || '',
                country: defaultAddress.country || 'US',
              },
              contactPhone: defaultAddress.contactNumber || '',
              specialInstructions: defaultAddress.specialInstructions || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading delivery details:', error);
      }
    };

    loadDeliveryDetails();
  }, [isJoinerApproved]);

  // Load user profile and credits
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log('💳 [CheckoutController] Loading user profile and credits...');
        const profileResult = await getBuyerProfileApi();
        console.log('💳 [CheckoutController] Profile result:', {
          success: profileResult?.success,
          hasData: !!profileResult?.data,
          leafPoints: profileResult?.leafPoints,
          plantCredits: profileResult?.plantCredits,
          shippingCredits: profileResult?.shippingCredits,
          referralPointsBalance: profileResult?.referralPointsBalance,
        });

        // Backend returns data at root level, not in a 'data' property
        if (profileResult && profileResult.success) {
          // Use profileResult directly (data is at root level)
          setLeafPoints(profileResult.referralPointsBalance || profileResult.leafPoints || 0);
          setPlantCredits(profileResult.plantCredits || 0);
          setShippingCredits(profileResult.shippingCredits || 0);
          setVaultedPaymentId(profileResult?.paypalPaymentSource?.id || null);
          setVaultedPaymentUsername(profileResult?.paypalPaymentSource?.details?.venmo?.user_name || null);
          
          console.log('✅ [CheckoutController] Credits loaded:', {
            leafPoints: profileResult.referralPointsBalance || profileResult.leafPoints || 0,
            plantCredits: profileResult.plantCredits || 0,
            shippingCredits: profileResult.shippingCredits || 0,
          });
        } else {
          // If no profile data, set defaults
          console.log('⚠️ [CheckoutController] No profile data, setting defaults to 0');
          setLeafPoints(0);
          setPlantCredits(0);
          setShippingCredits(0);
        }
      } catch (error) {
        console.error('❌ [CheckoutController] Error loading user profile:', error);
        // Set defaults on error
        setLeafPoints(0);
        setPlantCredits(0);
        setShippingCredits(0);
      }
    };

    loadUserProfile();
  }, []);

  // Event handlers
  const handleUpdateDeliveryDetails = (newDetails) => {
    // If user is an approved joiner, disable address selection
    if (disableAddressSelection) {
      Alert.alert(
        'Address Locked',
        'Your shipping address is set to your receiver\'s address. All plants will be delivered to the receiver.',
      );
      return;
    }
    
    // If newDetails is provided directly (e.g., from route params), use it
    if (newDetails && newDetails.address) {
      setDeliveryDetails(newDetails);
    } else {
      // Otherwise, navigate to address selection screen
      navigation.navigate('AddressBookScreen', {
        onSelectAddress: (selectedAddress) => {
          setDeliveryDetails({
            address: {
              street: selectedAddress.street || selectedAddress.address || '',
              city: selectedAddress.city || '',
              state: selectedAddress.state || '',
              zipCode: selectedAddress.zipCode || '',
              country: selectedAddress.country || 'US',
            },
            contactPhone: selectedAddress.contactNumber || '',
            specialInstructions: selectedAddress.specialInstructions || '',
          });
        },
      });
    }
  };
  
  // Reload address when screen comes back into focus (in case address was updated)
  useFocusEffect(
    useCallback(() => {
      const reloadAddress = async () => {
        // Skip reloading if user is an approved joiner (address locked to receiver)
        if (isJoinerApproved) {
          return;
        }
        
        try {
          const addressResult = await getAddressBookEntriesApi();
          if (addressResult && addressResult.success && addressResult.data && addressResult.data.length > 0) {
            const defaultAddress = addressResult.data[0];
            if (defaultAddress) {
              setDeliveryDetails({
                address: {
                  street: defaultAddress.street || defaultAddress.address || '',
                  city: defaultAddress.city || '',
                  state: defaultAddress.state || '',
                  zipCode: defaultAddress.zipCode || '',
                  country: defaultAddress.country || 'US',
                },
                contactPhone: defaultAddress.contactNumber || '',
                specialInstructions: defaultAddress.specialInstructions || '',
              });
            }
          }
        } catch (error) {
          console.error('Error reloading delivery details:', error);
        }
      };
      
      reloadAddress();
    }, [isJoinerApproved])
  );

  const toggleUpsNextDay = () => {
    setUpsNextDayEnabled(!upsNextDayEnabled);
  };

  const toggleLeafPoints = () => {
    setLeafPointsEnabled(!leafPointsEnabled);
  };

  const togglePlantCredits = () => {
    setPlantCreditsEnabled(!plantCreditsEnabled);
  };

  const toggleShippingCredits = () => {
    setShippingCreditsEnabled(!shippingCreditsEnabled);
  };

  const navigateBack = () => {
    // Navigate to Orders screen instead of going back
    navigation.goBack()
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }

    try {
      setLoading(true);

      // Prepare cart items for discount validation
      // Note: listingType should be in original format (not normalized) to match discount criteria
      // The plantItems have been normalized, so we need to get original values
      const cartItemsForDiscount = plantItems.map(item => {
        if (!item || !item.plantCode) {
          console.warn('💳 [handleApplyDiscount] Skipping invalid item:', item);
          return null;
        }

        // Try to get original listing type before normalization
        // Check various sources in order of preference
        let listingType = null;
        
        // First, check if we have access to original cartItem/plantData
        // The item might have originalListingType or we need to get it from cartItems array
        if (cartItems && cartItems.length > 0) {
          const originalCartItem = cartItems.find(ci => ci?.plantCode === item.plantCode);
          if (originalCartItem) {
            listingType = originalCartItem.listingType || originalCartItem.listingDetails?.listingType;
          }
        }
        
        // Also check productData if available
        if (!listingType && productData && productData.length > 0) {
          const originalProduct = productData.find(p => p?.plantCode === item.plantCode);
          if (originalProduct) {
            listingType = originalProduct.listingType || originalProduct.listingDetails?.listingType;
          }
        }
        
        // If not found, check if listingType is already in original format
        if (!listingType) {
          const currentType = item.listingType || item.listingDetails?.listingType;
          // If it doesn't contain underscore, it's probably already original format
          if (currentType && typeof currentType === 'string' && !currentType.includes('_') && !currentType.includes('single_grower')) {
            listingType = currentType;
          }
        }
        
        // Fallback to checking listingDetails directly
        if (!listingType && item.listingDetails?.listingType) {
          listingType = item.listingDetails.listingType;
        }
        
        // Last resort: map normalized back to original format
        if (!listingType) {
          const normalized = item.listingType || '';
          if (normalized && typeof normalized === 'string') {
            if (normalized.includes('single_grower') || normalized === 'single_grower') {
              listingType = 'Single Plant';
            } else if (normalized.includes('growers_choice') || normalized === 'growers_choice') {
              listingType = 'Grower\'s Choice';
            } else if (normalized.includes('wholesale') || normalized === 'wholesale') {
              listingType = 'Wholesale';
            } else {
              listingType = normalized;
            }
          }
        }

        // Final fallback to default
        if (!listingType) {
          listingType = 'Single Plant';
        }

        // Ensure genus is extracted properly
        const genus = item.genus || 
                     item.listingDetails?.genus || 
                     (item.name && typeof item.name === 'string' ? item.name.split(' ')[0] : '') ||
                     '';

        // Get species - try multiple sources including original cartItems
        // Priority: item.species > item.listingDetails?.species > originalCartItem.species > originalCartItem.listingDetails?.species > productData > parse from name
        let species = item.species || 
                      item.listingDetails?.species || 
                      '';
        
        // If species not found, try to get from original cartItems (deep check)
        if (!species && cartItems && cartItems.length > 0) {
          const originalCartItem = cartItems.find(ci => ci?.plantCode === item.plantCode);
          if (originalCartItem) {
            // Check multiple possible locations in the cart item
            species = originalCartItem.species || 
                     originalCartItem.listingDetails?.species ||
                     (originalCartItem.listingDetails && typeof originalCartItem.listingDetails === 'object' ? originalCartItem.listingDetails.species : '') ||
                     '';
            
            // Log for debugging
            if (species) {
              console.log(`💳 [handleApplyDiscount] Found species for ${item.plantCode} from originalCartItem:`, species);
            } else {
              console.log(`💳 [handleApplyDiscount] Species not found in originalCartItem for ${item.plantCode}. Structure:`, {
                hasSpecies: !!originalCartItem.species,
                hasListingDetails: !!originalCartItem.listingDetails,
                listingDetailsKeys: originalCartItem.listingDetails ? Object.keys(originalCartItem.listingDetails) : []
              });
            }
          }
        }
        
        // Also check productData if available
        if (!species && productData && productData.length > 0) {
          const originalProduct = productData.find(p => p?.plantCode === item.plantCode);
          if (originalProduct) {
            species = originalProduct.species || 
                     originalProduct.listingDetails?.species || 
                     '';
            if (species) {
              console.log(`💳 [handleApplyDiscount] Found species for ${item.plantCode} from productData:`, species);
            }
          }
        }
        
        // If still not found, try to parse from name (format: "Genus species" or "GENUS SPECIES ...")
        if (!species && item.name && typeof item.name === 'string') {
          const nameParts = item.name.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            // For names like "ALOCASIA AMAZONICA RESERVED FOR ST-GA"
            // The species is everything after the first word (genus)
            // So we take all parts from index 1 onwards
            species = nameParts.slice(1).join(' ').trim();
            console.log(`💳 [handleApplyDiscount] Parsed species from name for ${item.plantCode}:`, species);
          }
        }
        
        // Also try parsing from title if name didn't work
        if (!species && item.title && typeof item.title === 'string') {
          const titleParts = item.title.trim().split(/\s+/);
          if (titleParts.length >= 2) {
            species = titleParts.slice(1).join(' ').trim();
            console.log(`💳 [handleApplyDiscount] Parsed species from title for ${item.plantCode}:`, species);
          }
        }
        
        // Final fallback: ensure species is at least an empty string (never undefined or null)
        if (!species) {
          species = '';
          console.warn(`⚠️ [handleApplyDiscount] Species not found for ${item.plantCode}. Item structure:`, {
            hasSpecies: !!item.species,
            hasListingDetails: !!item.listingDetails,
            listingDetailsSpecies: item.listingDetails?.species,
            name: item.name,
            title: item.title,
            cartItemsLength: cartItems?.length || 0,
            productDataLength: productData?.length || 0
          });
        }
        
        // Normalize species: ensure it's a string and trim it
        species = typeof species === 'string' ? species.trim() : String(species || '').trim();

        // Get country - try multiple sources
        const country = item.country || 
                       item.listingDetails?.country || 
                       item.plantSourceCountry || 
                       'ID';

        // Get price - ensure it's a number
        const price = typeof item.price === 'number' ? item.price : 
                     (typeof item.unitPrice === 'number' ? item.unitPrice : 
                     (parseFloat(item.price) || parseFloat(item.unitPrice) || 0));

        // Get seller code
        const sellerCode = item.sellerCode || 
                          item.listingDetails?.sellerCode || 
                          '';

        // Get listingId - try multiple sources
        let listingId = null;
        if (item.listingId) {
          listingId = item.listingId;
        } else if (cartItems && cartItems.length > 0) {
          const originalCartItem = cartItems.find(ci => ci?.plantCode === item.plantCode);
          if (originalCartItem) {
            listingId = originalCartItem.listingId || null;
          }
        }
        // Also check productData if available
        if (!listingId && productData && productData.length > 0) {
          const originalProduct = productData.find(p => p?.plantCode === item.plantCode);
          if (originalProduct) {
            listingId = originalProduct.listingId || null;
          }
        }

        const cartItem = {
          plantCode: item.plantCode,
          listingId: listingId, // Include listingId for discount validation
          quantity: item.quantity || 1,
          price: price,
          listingType: listingType,
          country: country,
          genus: genus,
          species: species || '', // Ensure species is always a string, never undefined
          sellerCode: sellerCode,
        };

        // Log detailed information about species extraction
        const speciesSource = item.species ? 'item.species' : 
                        item.listingDetails?.species ? 'item.listingDetails.species' :
                        cartItems.find(ci => ci?.plantCode === item.plantCode)?.species ? 'originalCartItem.species' :
                        cartItems.find(ci => ci?.plantCode === item.plantCode)?.listingDetails?.species ? 'originalCartItem.listingDetails.species' :
                        productData?.find(p => p?.plantCode === item.plantCode)?.species ? 'productData.species' :
                        productData?.find(p => p?.plantCode === item.plantCode)?.listingDetails?.species ? 'productData.listingDetails.species' :
                        item.name ? 'parsed from name' : 'not found';
        
        console.log(`💳 [handleApplyDiscount] Prepared cart item for ${item.plantCode}:`, {
          ...cartItem,
          speciesSource,
          debugInfo: {
            itemHasSpecies: !!item.species,
            itemSpeciesValue: item.species,
            itemHasListingDetails: !!item.listingDetails,
            itemListingDetailsSpecies: item.listingDetails?.species,
            originalCartItemHasSpecies: !!cartItems.find(ci => ci?.plantCode === item.plantCode)?.species,
            originalCartItemListingDetailsSpecies: cartItems.find(ci => ci?.plantCode === item.plantCode)?.listingDetails?.species,
            itemName: item.name
          }
        });

        return cartItem;
      }).filter(item => item !== null); // Remove any null items

      console.log('💳 [handleApplyDiscount] Validating discount code:', discountCode);
      console.log('💳 [handleApplyDiscount] Plant items count:', plantItems.length);
      console.log('💳 [handleApplyDiscount] Sample plantItem structure:', plantItems[0] ? {
        plantCode: plantItems[0].plantCode,
        hasSpecies: !!plantItems[0].species,
        species: plantItems[0].species,
        speciesType: typeof plantItems[0].species,
        hasListingDetails: !!plantItems[0].listingDetails,
        listingDetailsSpecies: plantItems[0].listingDetails?.species,
        name: plantItems[0].name,
        genus: plantItems[0].genus
      } : 'No plantItems');
      console.log('💳 [handleApplyDiscount] Sample cartItem structure:', cartItems[0] ? {
        plantCode: cartItems[0].plantCode,
        hasSpecies: !!cartItems[0].species,
        species: cartItems[0].species,
        hasListingDetails: !!cartItems[0].listingDetails,
        listingDetailsSpecies: cartItems[0].listingDetails?.species,
        listingDetailsKeys: cartItems[0].listingDetails ? Object.keys(cartItems[0].listingDetails) : [],
        name: cartItems[0].name
      } : 'No cartItems');
      
      // Log each cart item's species before sending
      console.log('💳 [handleApplyDiscount] Cart items species check:', cartItemsForDiscount.map(ci => ({
        plantCode: ci.plantCode,
        species: ci.species,
        speciesType: typeof ci.species,
        speciesLength: ci.species ? ci.species.length : 0
      })));
      
      console.log('💳 [handleApplyDiscount] Cart items for discount:', JSON.stringify(cartItemsForDiscount, null, 2));

      if (!cartItemsForDiscount || cartItemsForDiscount.length === 0) {
        Alert.alert('Error', 'No items in cart to apply discount to');
        setLoading(false);
        return;
      }

      const result = await validateDiscountCodeApi(discountCode, cartItemsForDiscount);

      console.log('💳 [handleApplyDiscount] API Result:', JSON.stringify(result, null, 2));

      if (result.success && result.data) {
        let discountAmount = result.data.discountAmount || 0;
        const discountId = result.data.discountId;
        const discountDetails = result.data.discountDetails || {};
        
        // Calculate current subtotal to ensure discount doesn't exceed it
        const currentSubtotal = plantItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const currentShipping = shippingCalculation?.finalShippingCost || shippingCalculation?.totalShippingCost || 0;
        const currentTotalBeforeDiscount = currentSubtotal + currentShipping;
        
        // Cap discount amount to never exceed the total (subtotal + shipping)
        // Discount should never make the total negative
        const maxAllowedDiscount = Math.max(0, currentTotalBeforeDiscount);
        discountAmount = Math.min(discountAmount, maxAllowedDiscount);
        
        console.log('💳 [handleApplyDiscount] Discount applied successfully:', {
          discountAmount,
          originalDiscountAmount: result.data.discountAmount || 0,
          discountId,
          code: discountCode.trim().toUpperCase(),
          resultData: result.data,
          discountDetails,
          currentSubtotal,
          currentShipping,
          currentTotalBeforeDiscount,
          maxAllowedDiscount,
        });
        
        // For freeShipping type, discountAmount is 0 because discount applies to shipping, not order total
        // Skip the discountAmount check for freeShipping type
        if (discountDetails.type !== 'freeShipping' && discountAmount <= 0) {
          console.warn('⚠️ [handleApplyDiscount] Discount amount is 0 or negative:', discountAmount);
          
          // For Buy X Get Y discounts, provide specific message
          if (discountDetails.type === 'buyXGetY') {
            const buyQty = discountDetails.buyQuantity || 2;
            const currentQty = discountDetails.eligibleQuantity || 0;
            Alert.alert(
              'Minimum Quantity Required',
              `This discount requires buying ${buyQty} items to qualify. You currently have ${currentQty} eligible item${currentQty !== 1 ? 's' : ''} in your cart. Please add more items to apply this discount.`
            );
            setLoading(false);
            return;
          }
          
          // For other discount types, show generic message
          Alert.alert(
            'Discount Not Applicable',
            'The discount code was validated, but no discount amount was calculated. This may be because the discount has already been fully used or the items in your cart do not meet the discount requirements.'
          );
          setLoading(false);
          return;
        }
        
        // Store applied discount (including discountDetails for freeShipping type)
        setAppliedDiscount({
          amount: discountAmount,
          discountId: discountId,
          code: discountCode.trim().toUpperCase(),
          discountDetails: discountDetails, // Store discountDetails to access freeShipping flags
        });

        console.log('💳 [handleApplyDiscount] Applied discount state updated with amount:', discountAmount);
        console.log('💳 [handleApplyDiscount] State will trigger orderSummary recalculation');
        
        // Don't show alert - the discount confirmation banner will show instead
        // Just log success for debugging
        console.log('✅ [handleApplyDiscount] Discount successfully applied and visible in UI');
      } else {
        const errorMessage = result.error || result.message || 'Failed to apply discount code';
        console.error('💳 [handleApplyDiscount] Discount validation failed:', errorMessage);
        console.error('💳 [handleApplyDiscount] Debug info:', result.debug);
        
        // Show user-friendly error message
        let userMessage = errorMessage;
        let alertTitle = 'Discount Not Applicable';
        
        // Check if it's an invalid/incorrect/expired code
        const invalidCodePatterns = [
          'Invalid discount code',
          'Discount code not found',
          'Discount code has expired',
          'Discount code is not yet active',
          'Discount code usage limit reached',
          'You are not eligible for this discount code'
        ];
        
        const isInvalidCode = invalidCodePatterns.some(pattern => 
          errorMessage.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isInvalidCode) {
          userMessage = "Uh-oh! This code didn't bloom. It may have expired or been entered incorrectly.";
          alertTitle = 'Invalid Discount Code';
        } else if (result.debug && errorMessage.includes('No eligible items')) {
          userMessage = `No eligible items in cart for this discount code.\n\nThis discount applies to: ${result.debug.appliesTo || 'Unknown'}\n\nPlease check that your cart items match the discount criteria.`;
        }
        
        Alert.alert(alertTitle, userMessage);
      }
    } catch (error) {
      console.error('💳 [handleApplyDiscount] Exception caught:', error);
      console.error('💳 [handleApplyDiscount] Error message:', error.message);
      console.error('💳 [handleApplyDiscount] Error stack:', error.stack);
      console.error('💳 [handleApplyDiscount] Full error object:', JSON.stringify(error, null, 2));
      
      // Check if it's a network or validation error that might indicate invalid code
      const errorMessage = error.message || 'An error occurred while applying the discount code';
      const isNetworkError = errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch');
      
      // For network errors or generic errors, show the friendly message
      if (isNetworkError || errorMessage.includes('Invalid') || errorMessage.includes('not found') || errorMessage.includes('expired')) {
        Alert.alert('Invalid Discount Code', "Uh-oh! This code didn't bloom. It may have expired or been entered incorrectly.");
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedFlightDate?.iso) {
      Alert.alert('Error', 'Please select a flight date');
      return;
    }

    setLoading(true);
    try {
      // Map plantItems to productData format expected by backend
      const productData = plantItems.map(item => ({
        cartItemId: item.cartItemId || item.id, // Include cart item ID for selective deletion
        plantCode: item.plantCode,
        quantity: item.quantity || 1,
        potSize: item.selectedPotSize || item.potSize || item.listingDetails?.potSize || null,
        listingType: convertListingTypeToApiFormat(item.listingType || item.listingDetails?.listingType || 'Single Plant'),
        plantSourceCountry: item.country || item.listingDetails?.country || item.plantSourceCountry || 'ID',
        price: item.price || item.unitPrice || (item.totalAmount && item.quantity ? item.totalAmount / item.quantity : 0),
        notes: item.notes || item.specialInstructions || null,
      }));

      const checkoutData = {
        productData, // Backend expects productData, not plantItems
        useCart: useCart || false, // Indicate if using cart items
        deliveryDetails,
        cargoDate: selectedFlightDate.iso, // Required by backend
        flightDate: selectedFlightDate.iso,
        selectedFlightDate: selectedFlightDate.iso, // Also send as selectedFlightDate for backend compatibility
        paymentMethod,
        upsNextDay: upsNextDayEnabled,
        leafPoints: leafPointsEnabled ? leafPoints : 0,
        plantCredits: plantCreditsEnabled ? plantCredits : 0,
        shippingCredits: shippingCreditsEnabled ? shippingCredits : 0,
        orderSummary: {
          subtotal: orderSummary.subtotal || 0,
          shipping: orderSummary.finalShippingCost || orderSummary.totalShippingCost || 0,
          total: orderSummary.finalTotal || 0,
          discount: orderSummary.discount || 0,
          creditsApplied: orderSummary.creditsApplied || 0,
          // Include shipping breakdown for order document storage
          shippingTotal: orderSummary.baseUpsShipping || 0,
          upsNextDayUpgrade: orderSummary.upsNextDayUpgradeCost || 0,
          regularAirCargoTotal: orderSummary.airBaseCargo || 0,
          wholesaleAirCargoTotal: orderSummary.wholesaleAirCargo || 0,
          shippingCreditsDiscount: orderSummary.shippingCreditsDiscount || 0,
          totalShippingCost: orderSummary.totalShippingCost || 0,
          finalShippingCost: orderSummary.finalShippingCost || 0,
          remainingShippingCredit: orderSummary.shippingCreditNote ? (shippingCalculation?.remainingShippingCredit || 0) : 0,
        },
        // Include discount information to track usage
        // Always send discountCode if discountId exists (even if amount is 0, e.g., for freeShipping)
        ...(appliedDiscount.discountId && {
          discountId: appliedDiscount.discountId,
          discountCode: appliedDiscount.code || discountCode.trim().toUpperCase(),
        }),
      };

      console.log('🛒 [handleCheckout] Sending checkout data:', {
        productDataLength: productData.length,
        productData: productData,
        useCart,
        cargoDate: checkoutData.cargoDate,
        hasDeliveryDetails: !!deliveryDetails,
        orderSummary: checkoutData.orderSummary,
      });

      // Use joiner checkout API if user is an approved joiner
      const result = isJoinerApproved 
        ? await checkoutJoinerApi(checkoutData)
        : await checkoutApi(checkoutData);
      
      if (result.success) {
        // Extract transaction number from response
        const transactionNumber = result.data?.transactionNumber || 
                                  result.data?.transactionNum || 
                                  result.data?.invoiceNumber ||
                                  result.transactionNumber ||
                                  result.transactionNum;
        
        const orderTotal = orderSummary.finalTotal || orderSummary.total || 0;
        
        console.log('✅ [handleCheckout] Order placed successfully:', {
          transactionNumber,
          orderTotal,
          resultData: result.data,
        });
        
        setTransactionNum(transactionNumber);
        
        // Redirect to payment page (same as Pay to Board flow)
        const paymentUrl = `${paymentPaypalVenmoUrl}?amount=${orderTotal}&ileafuOrderId=${transactionNumber}`;
        if (transactionNumber && orderTotal > 0 && vaultedPaymentId) {
          setLoading(true);
          // const paymentResponse = await createAndCapturePaypalOrder({
          //   amount: String(0.02),
          //   ileafuOrderId: 'TXN1762690660039632',
          //   vaultedPaymentId,
          // });
          const paymentResponse = await createAndCapturePaypalOrder({
            amount: String(orderTotal),
            ileafuOrderId: transactionNumber,
            vaultedPaymentId,
          });
          setLoading(false);
          if (paymentResponse.success) {
            Alert.alert('Success', 'Order placed successfully!', [
              { 
                text: 'OK', 
                onPress: () => {
                  if (isLive && onClose) {
                    onClose();
                  } else if (!isLive) {
                    navigation.navigate('Orders');
                  }
                }
              }
            ]);
          }

          if (!paymentResponse.success) {
            if (paymentResponse.error === 'Failed to create/capturing order') {
              Alert.alert(
                'Payment Error',
                'Payment failed. Please try again or contact support.',
                [
                  { text: 'Retry Payment', onPress: () =>  
                    Linking.openURL(paymentUrl).catch(err => {
                      console.error('❌ [handleCheckout] Failed to open payment URL:', err);
                      Alert.alert(
                        'Payment Error',
                        'Unable to open payment page. Please try again or contact support.',
                        [{ text: 'OK', onPress: () => isLive ? null : navigation.navigate('Orders') }]
                      );
                    })
                  },
                  {
                    text: 'Cancel',
                    onPress: () => {
                      if (isLive && onClose) {
                        onClose();
                      } else if (!isLive) {
                        navigation.navigate('Orders');
                      }
                    },
                    style: 'cancel',
                  }
                ]
              );
            } else {
              Alert.alert(
                'Payment Error',
                paymentResponse.error || 'Payment failed. Please try again or contact support.',
                [{ text: 'OK', onPress: () => isLive ? null : navigation.navigate('Orders') }]
              );
            }
          }
            
        } else if (transactionNumber && orderTotal > 0) {
          
          console.log('💳 [handleCheckout] Redirecting to payment:', paymentUrl);
          
          // Open payment URL in browser/app
          Linking.openURL(paymentUrl).catch(err => {
            console.error('❌ [handleCheckout] Failed to open payment URL:', err);
            Alert.alert(
              'Payment Error',
              'Unable to open payment page. Please try again or contact support.',
              [{ text: 'OK', onPress: () => isLive ? null : navigation.navigate('Orders') }]
            );
          });
          
          // Navigate to Orders screen after opening payment URL
          // Small delay to ensure payment URL opens first
          setTimeout(() => {
            if (isLive && onClose) {
              onClose();
            } else if (!isLive) {
              navigation.navigate('Orders');
            }
          }, 500);
        } else {
          // If transaction number or total is missing, show success alert then navigate
          Alert.alert('Success', 'Order placed successfully!', [
            { 
              text: 'OK', 
              onPress: () => {
                if (isLive && onClose) {
                  onClose();
                } else if (!isLive) {
                  navigation.navigate('Orders');
                }
              }
            }
          ]);
        }
      } else {
        Alert.alert('Error', result.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    transactionNum,
    deliveryDetails,
    cargoDate,
    lockedFlightDate,
    lockedFlightKey,
    checkingOrders,
    disablePlantFlightSelection,
    selectedFlightDate,
    shippingCalculation,
    paymentMethod,
    leafPoints,
    plantCredits,
    shippingCredits,
    upsNextDayEnabled,
    leafPointsEnabled,
    plantCreditsEnabled,
    shippingCreditsEnabled,
    shimmerAnim,
    isLive,
    isCalculatingShipping, // Export shipping calculation loading state
    
    // Computed values
    plantItems,
    quantityBreakdown,
    orderSummary,
    flightDateOptions,
    flightLockInfo,
    orderCutoffDate,

    //savedPaymentDetails
    vaultedPaymentUsername,
    vaultedPaymentId,

    // Actions
    setCargoDate,
    setSelectedFlightDate,
    handleUpdateDeliveryDetails,
    toggleUpsNextDay,
    toggleLeafPoints,
    togglePlantCredits,
    toggleShippingCredits,
    handleCheckout,
    navigateBack,
    discountCode,
    setDiscountCode,
    handleApplyDiscount,
    
    // Joiner state
    isJoiner,
    isJoinerApproved,
    disableAddressSelection,
    disableFlightSelection,
    receiverFlightDate,
    
    // Helpers
    normalizeFlightKey,
    formatFlightDateToISO,
    parseFlightDate,
    getNextSaturday,
    formatDateLabel,
    normalizeListingType,
  };
};
