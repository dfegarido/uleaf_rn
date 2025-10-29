import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Animated, Easing } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { paymentPaypalVenmoUrl } from '../../../../../config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { getAddressBookEntriesApi } from '../../../../components/Api';
import { getBuyerProfileApi } from '../../../../components/Api/getBuyerProfileApi';
import { checkoutApi } from '../../../../components/Api/checkoutApi';
import { getBuyerOrdersApi } from '../../../../components/Api/orderManagementApi';
import { calculateCheckoutShippingApi } from '../../../../components/Api/checkoutShippingApi';
import { formatCurrencyFull } from '../../../../utils/formatCurrency';
import { roundToCents } from '../../../../utils/money';

/**
 * CheckoutController - Handles all business logic for CheckoutScreen
 */
export const useCheckoutController = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get parameters from navigation
  const routeParams = route.params || {};
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
    
    // Handle various formats
    if (normalized.includes('whole')) return 'wholesale';
    if (normalized.includes('grower') || normalized.includes('choice')) return 'growers_choice';
    if (normalized.includes('single')) return 'single_grower';
    
    // Direct matches
    if (normalized === 'wholesale') return 'wholesale';
    if (normalized === 'growers_choice' || normalized === "grower's choice") return 'growers_choice';
    if (normalized === 'single_grower' || normalized === 'single plant') return 'single_grower';
    
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
      const normalizedType = normalizeListingType(item.listingType);
      if (normalizedType === 'single_grower') {
        breakdown.singlePlant += item.quantity;
        breakdown.singleGrower += item.quantity; // Keep for backwards compatibility
      } else if (normalizedType === 'wholesale') {
        breakdown.wholesale += item.quantity;
      } else if (normalizedType === 'growers_choice') {
        breakdown.growersChoice += item.quantity;
      }
      breakdown.total += item.quantity;
    });

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
    
    // For display purposes, use backend's finalTotal if available (it accounts for all credits)
    // Otherwise calculate: subtotal + shipping (already has credits applied)
    const backendFinalTotal = shippingCalculation?.finalTotal;
    const discount = shippingCalculation?.discount || 0;
    const finalTotal = backendFinalTotal !== undefined 
      ? backendFinalTotal 
      : (subtotal + shippingTotal - discount);
    
    // Debug logging for shipping calculation matching
    console.log('🔍 [orderSummary] Shipping calculation check:', {
      backendFinalShippingCost,
      backendTotalShippingCost,
      backendShippingCreditsDiscount,
      shippingTotal,
      backendFinalTotal,
      subtotal,
      calculatedFinalTotal: subtotal + shippingTotal - discount,
      finalTotal,
    });

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
    const creditsApplied = (leafPointsEnabled ? leafPoints : 0) + (plantCreditsEnabled ? plantCredits : 0);

    return {
      subtotal: roundToCents(subtotal),
      discount: roundToCents(discount),
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
    };
  }, [plantItems, shippingCalculation, quantityBreakdown, leafPointsEnabled, plantCreditsEnabled, leafPoints, plantCredits, normalizeListingType]);

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
  const flightDateOptions = useMemo(() => {
    console.log('🔍 [flightDateOptions] Starting generation...', {
      plantItemsLength: plantItems.length,
      isThailandPlant,
    });

    if (!plantItems.length) {
      console.log('⚠️ [flightDateOptions] No plantItems, returning empty array');
      return [];
    }

    let startSaturday;
    
    if (isThailandPlant) {
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

    // Generate 3 Saturday options starting from the startSaturday
    const options = [];
    
    console.log('🔍 [flightDateOptions] Generating Saturday options...');
    for (let i = 0; i < 3; i++) {
      const saturday = new Date(startSaturday);
      saturday.setDate(startSaturday.getDate() + (i * 7));
      
      // Include all Saturdays (past, current, future) - all should be clickable
      // Use local date components to avoid timezone issues with toISOString()
      const year = saturday.getFullYear();
      const month = String(saturday.getMonth() + 1).padStart(2, '0');
      const day = String(saturday.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;
      const label = formatDateLabel(saturday);
      const key = normalizeFlightKey(label);
      
      const option = {
        date: label,
        iso: iso,
        key: key,
        label: label,
        displayLabel: label,
        value: label,
      };
      
      options.push(option);
      console.log(`✅ [flightDateOptions] Generated option ${i}:`, option);
    }

    console.log('🎯 [flightDateOptions] Final options array:', options);
    console.log('🎯 [flightDateOptions] Options count:', options.length);
    console.log('🎯 [flightDateOptions] First suggested Saturday:', options[0]?.iso);
    
    return options;
  }, [plantItems, isThailandPlant, normalizeFlightKey, formatFlightDateToISO, parseFlightDate, getNextSaturday, formatDateLabel]);

  // Flight lock info
  const flightLockInfo = useMemo(() => {
    if (!lockedFlightDate || !lockedFlightKey) return null;
    
    return {
      date: lockedFlightDate,
      key: lockedFlightKey,
      reason: 'Existing order requires this flight date',
    };
  }, [lockedFlightDate, lockedFlightKey]);

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

      // Calculate total userCredits as a number (API expects a number)
      const totalUserCredits = (leafPointsEnabled ? (leafPoints || 0) : 0) +
                               (plantCreditsEnabled ? (plantCredits || 0) : 0) +
                               (shippingCreditsEnabled ? (shippingCredits || 0) : 0);

      console.log('💳 [fetchShippingCalculation] User credits:', {
        leafPointsEnabled,
        leafPoints,
        plantCreditsEnabled,
        plantCredits,
        shippingCreditsEnabled,
        shippingCredits,
        totalUserCredits,
      });

      const result = await calculateCheckoutShippingApi(
        plants, 
        selectedFlightDate.iso, 
        upsNextDayEnabled, 
        totalUserCredits
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
    convertListingTypeToApiFormat
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
  }, [fetchShippingCalculation, plantItems, selectedFlightDate, upsNextDayEnabled, leafPointsEnabled, plantCreditsEnabled, shippingCreditsEnabled, leafPoints, plantCredits, shippingCredits]);

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
      
      // Perform the comparison now that we have options
      const firstSuggestedOption = flightDateOptions
        .filter(opt => opt.iso)
        .sort((a, b) => a.iso.localeCompare(b.iso))[0];
      
      const existingOrderIso = formatFlightDateToISO(flightDate, new Date().getFullYear());
      
      if (existingOrderIso && firstSuggestedOption?.iso) {
        // Compare ISO dates as strings (format: "YYYY-MM-DD")
        const dateComparison = existingOrderIso.localeCompare(firstSuggestedOption.iso);
        
        // Thailand: disable if existing <= firstSuggested
        // Non-Thailand: disable only if existing >= firstSuggested
        const shouldDisableAll = isThailandPlant 
          ? dateComparison <= 0
          : dateComparison >= 0;
        
        console.log('🔒 [Re-check Existing Orders] Decision:', {
          existingOrderIso,
          firstSuggestedIso: firstSuggestedOption.iso,
          isThailandPlant,
          comparison: isThailandPlant 
            ? `${existingOrderIso} <= ${firstSuggestedOption.iso}`
            : `${existingOrderIso} >= ${firstSuggestedOption.iso}`,
          localeCompareResult: dateComparison,
          shouldDisableAll,
          rule: isThailandPlant 
            ? 'Thailand: disable if existing <= firstSuggested'
            : 'Non-Thailand: disable if existing >= firstSuggested',
        });
        
        console.log('🔒 [Re-check Existing Orders] Setting disablePlantFlightSelection to:', shouldDisableAll);
        setDisablePlantFlightSelection(shouldDisableAll);
        setLockedFlightDate(flightDate);
        setLockedFlightKey(normalizeFlightKey(flightDate));
        
        if (shouldDisableAll) {
          console.log('🚫 [Re-check Existing Orders] ✅ DISABLING all 3 flight selections');
          const flightOption = flightDateOptions.find(option => 
            option.key === normalizeFlightKey(flightDate) || option.iso === existingOrderIso
          );
          
          if (flightOption) {
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
          } else if (firstSuggestedOption) {
            // Fallback to first suggested option
            setSelectedFlightDate(firstSuggestedOption);
            if (firstSuggestedOption.iso) {
              setCargoDate(firstSuggestedOption.iso);
            }
            // Trigger shipping calculation
            console.log('🔄 [Re-check Existing Orders] Triggering shipping calculation for auto-selected first option');
            setTimeout(() => {
              if (isCalculatingRef.current === false) {
                lastCalculationParamsRef.current = null;
              }
            }, 100);
          }
        } else {
          console.log('✅ [Re-check Existing Orders] Enabling all 3 flight selections');
          const flightOption = flightDateOptions.find(option => 
            option.key === normalizeFlightKey(flightDate) || option.iso === existingOrderIso
          );
          
          if (flightOption) {
            setSelectedFlightDate(flightOption);
            if (flightOption.iso) {
              setCargoDate(flightOption.iso);
            }
            // Trigger shipping calculation after auto-selecting date
            console.log('🔄 [Re-check Existing Orders] Triggering shipping calculation for auto-selected enabled date');
            setTimeout(() => {
              if (isCalculatingRef.current === false) {
                lastCalculationParamsRef.current = null; // Clear to force recalculation
              }
            }, 100);
          }
        }
      } else {
        console.log('⚠️ [Re-check Existing Orders] Cannot compare - missing ISO dates');
        setDisablePlantFlightSelection(true);
        setLockedFlightDate(flightDate);
        setLockedFlightKey(normalizeFlightKey(flightDate));
      }
    }
  }, [flightDateOptions, formatFlightDateToISO, normalizeFlightKey, isThailandPlant]);

  // Check for existing orders
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      
      const checkExistingOrders = async () => {
        console.log('🔍 [checkExistingOrders] Starting order check...');
        setCheckingOrders(true);
        try {
          const ordersResult = await getBuyerOrdersApi();
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
              flightDate: ordersArray[0].flightDate,
              cargoDate: ordersArray[0].cargoDate,
            } : null,
          });
          
          if (ordersArray.length > 0) {
            // Filter for orders with status "Ready to Fly" (exact match, case-sensitive)
            const readyToFlyOrders = ordersArray.filter(order => {
              const status = (order.status || '').trim();
              return status === 'Ready to Fly';
            });
            
            console.log('✈️ [checkExistingOrders] Ready to Fly orders:', {
              count: readyToFlyOrders.length,
              orders: readyToFlyOrders.map(o => ({
                status: o.status,
                flightDate: o.flightDate,
                cargoDate: o.cargoDate,
              })),
            });
            
            if (readyToFlyOrders.length > 0) {
              // Get the latest order (first in array, assuming API returns sorted)
              const latestOrder = readyToFlyOrders[0];
              const flightDate = latestOrder.flightDate || latestOrder.cargoDate;
              
              console.log('🔒 [checkExistingOrders] Existing order found with flight date:', flightDate);
              
              if (flightDate) {
                // Get current flight options to compare with existing order
                const currentFlightOptions = flightDateOptionsRef.current;
                
                if (currentFlightOptions && currentFlightOptions.length > 0) {
                  // For Thailand rule: compare with FIRST suggested Saturday (index 0)
                  // For non-Thailand: compare with earliest option (same logic but clearer naming)
                  const firstSuggestedOption = currentFlightOptions
                    .filter(opt => opt.iso)
                    .sort((a, b) => a.iso.localeCompare(b.iso))[0];
                  
                  // Convert existing order flight date to ISO for comparison
                  // Use the same year as the first suggested option to ensure consistent comparison
                  const firstSuggestedYear = firstSuggestedOption?.iso ? 
                    parseInt(firstSuggestedOption.iso.split('-')[0]) : 
                    new Date().getFullYear();
                  const existingOrderIso = formatFlightDateToISO(flightDate, firstSuggestedYear);
                  
                  console.log('📅 [checkExistingOrders] Comparing dates:', {
                    existingOrderDate: flightDate,
                    existingOrderIso: existingOrderIso,
                    firstSuggestedIso: firstSuggestedOption?.iso,
                    firstSuggestedLabel: firstSuggestedOption?.label,
                    firstSuggestedYear,
                    isThailandPlant,
                    allFlightOptions: currentFlightOptions.map(o => ({ iso: o.iso, label: o.label })),
                  });
                  
                  // Rule: 
                  // For Thailand plants: If existing order date <= first suggested Saturday: disable all 3
                  // For Non-Thailand plants: Only disable if existing order date is on or AFTER the first suggested (existing >= firstSuggested)
                  // Otherwise: enable all 3
                  if (existingOrderIso && firstSuggestedOption?.iso) {
                    // Compare ISO dates as strings (format: "YYYY-MM-DD")
                    const dateComparison = existingOrderIso.localeCompare(firstSuggestedOption.iso);
                    
                    // Thailand: disable if existing <= firstSuggested (user must use existing order date)
                    // Non-Thailand: disable only if existing >= firstSuggested (existing order prevents selecting future dates)
                    const shouldDisableAll = isThailandPlant 
                      ? dateComparison <= 0  // Thailand: existing <= firstSuggested means disable all
                      : dateComparison >= 0; // Non-Thailand: existing >= firstSuggested means disable all
                    
                    console.log('🔢 [checkExistingOrders] Date comparison details:', {
                      existingOrderIso,
                      firstSuggestedIso: firstSuggestedOption.iso,
                      isThailandPlant,
                      comparison: isThailandPlant 
                        ? `${existingOrderIso} <= ${firstSuggestedOption.iso}`
                        : `${existingOrderIso} >= ${firstSuggestedOption.iso}`,
                      localeCompareResult: dateComparison,
                      shouldDisableAll,
                      rule: isThailandPlant 
                        ? 'Thailand: disable if existing <= firstSuggested'
                        : 'Non-Thailand: disable if existing >= firstSuggested',
                    });
                    
                    console.log('🔒 [checkExistingOrders] Decision:', {
                      existingOrderDate: flightDate,
                      existingOrderIso: existingOrderIso,
                      firstSuggestedIso: firstSuggestedOption.iso,
                      firstSuggestedLabel: firstSuggestedOption.label,
                      comparison: `${existingOrderIso} <= ${firstSuggestedOption.iso}`,
                      comparisonResult: existingOrderIso <= firstSuggestedOption.iso,
                      shouldDisableAll,
                      rule: 'If existing order <= first suggested Saturday, disable all 3',
                    });
                    
                    console.log('🔒 [checkExistingOrders] Setting disablePlantFlightSelection to:', shouldDisableAll);
                    setDisablePlantFlightSelection(shouldDisableAll);
                    
                    // Also set lockedFlightDate and lockedFlightKey for reference
                    setLockedFlightDate(flightDate);
                    setLockedFlightKey(normalizeFlightKey(flightDate));
                    
                    if (shouldDisableAll) {
                      console.log('🚫 [checkExistingOrders] ✅ DISABLING all 3 flight selections - existing order date is <= first suggested Saturday');
                      // Auto-select the existing order's date if it matches one of the options
                      const flightOption = currentFlightOptions.find(option => 
                        option.key === normalizeFlightKey(flightDate) || 
                        option.iso === existingOrderIso ||
                        (option.iso && option.iso === existingOrderIso)
                      );
                      
                      console.log('🔍 [checkExistingOrders] Looking for matching flight option:', {
                        flightDate,
                        existingOrderIso,
                        normalizedKey: normalizeFlightKey(flightDate),
                        foundOption: !!flightOption,
                        flightOption,
                        allOptions: currentFlightOptions.map(o => ({ iso: o.iso, key: o.key, label: o.label })),
                      });
                      
                      if (flightOption) {
                        console.log('✅ [checkExistingOrders] Auto-selecting existing order flight date:', flightOption);
                        setSelectedFlightDate(flightOption);
                        if (flightOption.iso) {
                          setCargoDate(flightOption.iso);
                        }
                        // Force trigger shipping calculation after auto-selecting disabled date
                        console.log('🔄 [checkExistingOrders] Triggering shipping calculation for auto-selected disabled date');
                        // The useEffect watching selectedFlightDate should trigger, but we'll ensure it by updating the ref
                        setTimeout(() => {
                          if (isCalculatingRef.current === false) {
                            lastCalculationParamsRef.current = null; // Clear to force recalculation
                          }
                        }, 100);
                      } else {
                        // If no exact match found, select the first option (which matches existing order date)
                        console.log('⚠️ [checkExistingOrders] No exact match found, selecting first suggested option');
                        if (firstSuggestedOption) {
                          setSelectedFlightDate(firstSuggestedOption);
                          if (firstSuggestedOption.iso) {
                            setCargoDate(firstSuggestedOption.iso);
                          }
                          // Force trigger shipping calculation
                          console.log('🔄 [checkExistingOrders] Triggering shipping calculation for auto-selected first option');
                          setTimeout(() => {
                            if (isCalculatingRef.current === false) {
                              lastCalculationParamsRef.current = null;
                            }
                          }, 100);
                        }
                      }
                    } else {
                      console.log('✅ [checkExistingOrders] Enabling all 3 flight selections - existing order date is > first suggested Saturday');
                      // Enable all selections - user can choose any date
                      // Auto-select the existing order's flight date if it's available
                      const flightOption = currentFlightOptions.find(option => 
                        option.key === normalizeFlightKey(flightDate) || option.iso === existingOrderIso
                      );
                      
                      if (flightOption) {
                        console.log('🎯 [checkExistingOrders] Auto-selecting existing order flight date:', flightOption);
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
                      }
                    }
                  } else {
                    // Fallback: if we can't compare, disable all for safety
                    console.log('⚠️ [checkExistingOrders] Cannot compare dates - disabling all selections for safety');
                    console.log('⚠️ [checkExistingOrders] Missing data:', {
                      hasExistingOrderIso: !!existingOrderIso,
                      existingOrderIso,
                      hasFirstSuggestedIso: !!firstSuggestedOption?.iso,
                      firstSuggestedIso: firstSuggestedOption?.iso,
                    });
                    setDisablePlantFlightSelection(true);
                    setLockedFlightDate(flightDate);
                    setLockedFlightKey(normalizeFlightKey(flightDate));
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

      checkExistingOrders();
      
      return () => {
        isCancelled = true;
      };
    }, [normalizeFlightKey, formatFlightDateToISO, isThailandPlant]) // Include dependencies
  );

  // Load delivery details
  useEffect(() => {
    const loadDeliveryDetails = async () => {
      try {
        const addressResult = await getAddressBookEntriesApi();
        if (addressResult && addressResult.success && addressResult.data && addressResult.data.length > 0) {
          const defaultAddress = addressResult.data[0];
          if (defaultAddress) {
            setDeliveryDetails({
              address: {
                street: defaultAddress.street || '',
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
  }, []);

  // Load user profile and credits
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileResult = await getBuyerProfileApi();
        if (profileResult && profileResult.success && profileResult.data) {
          const profile = profileResult.data;
          setLeafPoints(profile.referralPointsBalance || 0);
          setPlantCredits(profile.plantCredits || 0);
          setShippingCredits(profile.shippingCredits || 0);
        } else {
          // If no profile data, set defaults
          setLeafPoints(0);
          setPlantCredits(0);
          setShippingCredits(0);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
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
    }, [])
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

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }
    // TODO: Implement discount code validation and application
    // This should call an API to validate the discount code
    // and update the order summary with the discount
    console.log('💳 [handleApplyDiscount] Applying discount code:', discountCode);
    Alert.alert('Info', `Discount code "${discountCode}" will be validated. Implementation pending.`);
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
        },
      };

      console.log('🛒 [handleCheckout] Sending checkout data:', {
        productDataLength: productData.length,
        productData: productData,
        useCart,
        cargoDate: checkoutData.cargoDate,
        hasDeliveryDetails: !!deliveryDetails,
        orderSummary: checkoutData.orderSummary,
      });

      const result = await checkoutApi(checkoutData);
      
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
        if (transactionNumber && orderTotal > 0) {
          const paymentUrl = `${paymentPaypalVenmoUrl}?amount=${orderTotal}&ileafuOrderId=${transactionNumber}`;
          
          console.log('💳 [handleCheckout] Redirecting to payment:', paymentUrl);
          
          // Open payment URL in browser/app
          Linking.openURL(paymentUrl).catch(err => {
            console.error('❌ [handleCheckout] Failed to open payment URL:', err);
            Alert.alert(
              'Payment Error',
              'Unable to open payment page. Please try again or contact support.',
              [{ text: 'OK', onPress: () => navigation.navigate('Orders') }]
            );
          });
          
          // Navigate to Orders screen after opening payment URL
          // Small delay to ensure payment URL opens first
          setTimeout(() => {
            navigation.navigate('Orders');
          }, 500);
        } else {
          // If transaction number or total is missing, show success alert then navigate
          Alert.alert('Success', 'Order placed successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Orders') }
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
    isCalculatingShipping, // Export shipping calculation loading state
    
    // Computed values
    plantItems,
    quantityBreakdown,
    orderSummary,
    flightDateOptions,
    flightLockInfo,
    
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
    
    // Helpers
    normalizeFlightKey,
    formatFlightDateToISO,
    parseFlightDate,
    getNextSaturday,
    formatDateLabel,
    normalizeListingType,
  };
};
