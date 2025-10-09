/* eslint-disable react-native/no-inline-styles */
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../../assets/buyer-icons/close.svg';
import FlightIcon from '../../../assets/buyer-icons/flight.svg';
import HeartSolidIcon from '../../../assets/buyer-icons/heart.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import MinusIcon from '../../../assets/buyer-icons/minus.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import PlaneIcon from '../../../assets/buyer-icons/plane-gray.svg';
import PlusIcon from '../../../assets/buyer-icons/plus.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import TruckIcon from '../../../assets/buyer-icons/truck-gray.svg';
import VenmoLogo from '../../../assets/buyer-icons/venmo-logo.svg';
import WishListSelected from '../../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../../assets/buyer-icons/wishlist-unselected.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import BoxIcon from '../../../assets/icons/greylight/box-regular.svg';
import FlakesIcon from '../../../assets/icons/greylight/flakes.svg';
import HeartIcon from '../../../assets/icons/greylight/heart-regular.svg';
import ReturnIcon from '../../../assets/icons/greylight/return.svg';
import CartIcon from '../../../assets/icontabs/buyer-tabs/cart-solid.svg';
import { useAuth } from '../../../auth/AuthProvider';
import { addToCartApi } from '../../../components/Api/cartApi';
import { getPlantDetailApi } from '../../../components/Api/getPlantDetailApi';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import { retryAsync } from '../../../utils/utils';

const ScreenPlantDetail = ({navigation, route}) => {
  const {user} = useAuth();
  const {plantCode} = route.params || {};
  
  // Get screen dimensions for dynamic card sizing
  const screenWidth = Dimensions.get('window').width;
  const sectionPadding = 48; // Total horizontal padding (24 * 2) from sectionContainer
  const cardGap = 12; // Gap between cards
  const availableWidth = screenWidth - sectionPadding; // Width after container padding
  const cardWidth = Math.floor((availableWidth - cardGap) / 2); // Width for each card

  // Plant data state
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageSource, setImageSource] = useState(
    require('../../../assets/buyer-icons/png/ficus-lyrata.png'),
  );
  
  // Available pot sizes from backend
  const [availablePotSizes, setAvailablePotSizes] = useState([]);
  const [potSizeGroups, setPotSizeGroups] = useState({});
  
  // (Replaced manual recommendations with BrowseMorePlants component)
  
  // Add to cart modal state
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedPotSize, setSelectedPotSize] = useState('2"');
  const [quantity, setQuantity] = useState(1);
  const [modalAction, setModalAction] = useState('add-to-cart'); // 'add-to-cart' or 'buy-now'
  const insets = useSafeAreaInsets();

  // Load plant details when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (plantCode) {
        loadPlantDetails();
      }
    }, [plantCode]),
  );

  useEffect(() => {
    console.log('🚀 Plant data useEffect triggered with:', {
      hasPlantData: !!plantData,
      variationsLength: plantData?.variations?.length || 0,
      mainPotSize: plantData?.potSize,
      availablePotSizes: plantData?.availablePotSizes
    });
    
    if (plantData?.imagePrimary) {
      setImageSource({uri: plantData.imagePrimary});
    }
    if (plantData?.loveCount !== undefined) {
      setLoveCount(plantData.loveCount || 0);
    }
    
    // Handle variations-based pot size structure
    if (plantData?.variations && plantData.variations.length > 0) {
      console.log('🔍 Processing variations for pot sizes:', plantData.variations);
      // Extract pot sizes from variations
      const potSizes = plantData.variations.map(variation => variation.potSize).filter(Boolean);
      console.log('🧪 Extracted pot sizes:', potSizes);
      setAvailablePotSizes(potSizes);
      
      // Create pot size groups mapping from variations
      const potSizeGroups = {};
      plantData.variations.forEach(variation => {
        if (variation.potSize) {
          potSizeGroups[variation.potSize] = [variation];
        }
      });
      setPotSizeGroups(potSizeGroups);
      console.log('📦 Pot size groups:', potSizeGroups);
      
      // Set initial pot size to the first available one
      if (potSizes.length > 0 && (!selectedPotSize || !potSizes.includes(selectedPotSize))) {
        console.log('🎯 Setting selected pot size to:', potSizes[0]);
        setSelectedPotSize(potSizes[0]);
      }
    } else if (plantData?.availablePotSizes && plantData.availablePotSizes.length > 0) {
      // Handle legacy pot size data structure
      setAvailablePotSizes(plantData.availablePotSizes);
      setPotSizeGroups(plantData.potSizeGroups || {});
      
      // Set initial pot size to the first available one
      if (!selectedPotSize || !plantData.availablePotSizes.includes(selectedPotSize)) {
        setSelectedPotSize(plantData.availablePotSizes[0]);
      }
    } else if (plantData?.potSize) {
      // Fallback for old single pot size structure
      setSelectedPotSize(plantData.potSize);
      setAvailablePotSizes([plantData.potSize]);
    }
    
  }, [plantData, selectedPotSize]);

  // Log when shipping costs update
  useEffect(() => {
    if (plantData && selectedPotSize) {
      const shippingInfo = getShippingCost();
    }
  }, [selectedPotSize, plantData?.listingType, plantData?.approximateHeight]);

  // Ensure single plants always have quantity = 1
  useEffect(() => {
    if (plantData?.listingType?.toLowerCase() === 'single' && quantity !== 1) {
      setQuantity(1);
    }
  }, [plantData?.listingType, quantity]);

  const loadPlantDetails = async () => {
    try {
      setLoading(true);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getPlantDetailApi(plantCode), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plant details');
      }
      // Extract the nested data object from the response
      console.log('📱 Plant data loaded:', {
        plantCode,
        listingType: res.data?.listingType,
        hasVariations: !!res.data?.variations,
        variationsLength: res.data?.variations?.length || 0,
        availableQty: res.data?.availableQty,
        stockInfo: {
          availableQty: res.data?.availableQty,
          totalQuantity: res.data?.totalQuantity,
          maxQuantity: res.data?.maxQuantity,
          stock: res.data?.stock,
          quantity: res.data?.quantity
        },
        fullData: res.data
      });
      setPlantData(res.data);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    console.log('🛒 Opening Add to Cart modal for plant:', {
      plantCode,
      listingType: plantData?.listingType,
      currentQuantity: quantity,
      plantDataExists: !!plantData
    });
    setModalAction('add-to-cart');
    setShowAddToCartModal(true);
  };

  const handleBuyNow = () => {
    console.log('💰 Opening Buy Now modal for plant:', {
      plantCode,
      listingType: plantData?.listingType,
      currentQuantity: quantity,
      plantDataExists: !!plantData
    });
    setModalAction('buy-now');
    setShowAddToCartModal(true);
  };

  const handleConfirmAddToCart = async () => {
    if (quantity < 1) {
      Alert.alert('Invalid Quantity', 'Please select a quantity of at least 1');
      return;
    }

    // Check stock limits
    const availableStock = getAvailableStock();
    if (quantity > availableStock) {
      Alert.alert('Stock Limit', `Only ${availableStock} items available in stock. Please reduce your quantity.`);
      return;
    }

    setShowAddToCartModal(false);

    if (modalAction === 'buy-now') {
      // Navigate to checkout screen with plant data
      const discountedPriceData = getDiscountedPrice();
      const unitPrice = parseFloat(discountedPriceData.discountedPrice);
      
      // Ensure plantData has a country code
      const plantDataWithCountry = { ...plantData };
      // If country is missing, try to determine it from currency

      if (!plantDataWithCountry.country) {
        const mapCurrencyToCountry = (localCurrency) => {
          if (!localCurrency) return 'ID'; // Default to Indonesia
          
          switch (localCurrency.toUpperCase()) {
            case 'PHP':
              return 'PH';
            case 'THB':
              return 'TH';
            case 'IDR':
              return 'ID';
            default:
              return 'ID'; // Default to Indonesia
          }
        };
        
        plantDataWithCountry.country = mapCurrencyToCountry(plantDataWithCountry.localCurrency);
      }
      
      console.log('🛍️ Buy Now navigation with plant data:', {
        plantCode: plantCode,
        listingType: plantData.listingType,
        quantity: quantity,
        name: `${plantData.genus || ''} ${plantData.species || ''}`.trim()
      });
      
      navigation.navigate('CheckoutScreen', {
        plantData: {
          ...plantDataWithCountry,
          // pass through backend-provided flight/cargo dates if present so checkout initializes correctly
          flightDate: plantData.plantFlightDate || plantData.flightDate || null,
          cargoDate: plantData.cargoDate || null,
        },
        selectedPotSize: selectedPotSize,
        quantity: quantity,
        plantCode: plantCode,
        totalAmount: unitPrice * quantity,
        fromBuyNow: true,
      });
    } else {
      // Add to cart using API
      try {
        // Validate before sending to API
        if (!plantCode) {
          throw new Error('Plant code is missing');
        }
        
        if (!plantData) {
          throw new Error('Plant data is not loaded');
        }
        
        // Check if plant is available for purchase
        if (plantData.status && plantData.status !== 'Active') {
          throw new Error(`This plant is currently ${plantData.status} and not available for purchase`);
        }

        // Determine country if not present
        let country = plantData.country;
        if (!country) {
          const mapCurrencyToCountry = (localCurrency) => {
            if (!localCurrency) return 'ID'; // Default to Indonesia
            
            switch (localCurrency.toUpperCase()) {
              case 'PHP':
                return 'PH';
              case 'THB':
                return 'TH';
              case 'IDR':
                return 'ID';
              default:
                return 'ID'; // Default to Indonesia
            }
          };
          
          country = mapCurrencyToCountry(plantData.localCurrency);
        }

        const cartData = {
          plantCode: plantCode,
          quantity: quantity,
          potSize: selectedPotSize,
          country: country, // Add country to cart data
          notes: `${plantData.genus} ${plantData.species} - ${plantData.variegation || 'Standard'}`
        };

        const response = await addToCartApi(cartData);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to add to cart');
        }

        Alert.alert('Success', `Added ${quantity} plant(s) to cart!`);
        
        // Optional: Trigger cart count refresh
        // You could emit an event or call a context method here
        
      } catch (error) {
        // Enhanced error handling with specific messages
        let errorMessage = 'Failed to add item to cart';
        if (error.message.includes('No active listing found')) {
          errorMessage = `This plant (${plantCode}) is currently not available for purchase. It may be sold out or temporarily unavailable.`;
        } else if (error.message.includes('Insufficient stock')) {
          errorMessage = 'Sorry, not enough items in stock for your request.';
        } else if (error.message.includes('Invalid pot size')) {
          errorMessage = 'The selected pot size is not available for this plant.';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Please log in to add items to your cart.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddToCartModal(false);
  };

  // Helper function to check if plant is single
  const isSinglePlant = () => {
    if (!plantData) {
      console.log('🔍 No plant data available');
      return false;
    }
    
    const listingType = plantData?.listingType;
    const listingTypeLower = listingType?.toLowerCase();
    
    // Check multiple possible ways to identify single plants
    const checks = {
      listingTypeExact: listingTypeLower === 'single',
      listingTypeIncludes: listingTypeLower?.includes('single'),
      variationsEmpty: !plantData?.variations || plantData?.variations?.length === 0,
      availableQuantity: plantData?.availableQuantity === 1,
      stockQuantity: plantData?.stockQuantity === 1,
      quantity: plantData?.quantity === 1
    };
    
    const isSingle = checks.listingTypeExact || checks.listingTypeIncludes;
    
    console.log('🔍 Plant listing type check:', {
      originalListingType: listingType,
      lowercaseListingType: listingTypeLower,
      checks,
      finalResult: isSingle,
      currentQuantity: quantity,
      modalVisible: showAddToCartModal
    });
    
    return isSingle;
  };

  // Get available stock quantity
  const getAvailableStock = () => {
    console.log('plantData for stock calculation:', plantData);
    
    const stock = plantData?.availableQty || plantData?.stock || plantData?.quantity || plantData?.maxQuantity || 999;
    console.log('📊 Available stock calculation:', {
      availableQty: plantData?.availableQty,
      stock: plantData?.stock,
      quantity: plantData?.quantity,
      maxQuantity: plantData?.maxQuantity,
      finalStock: stock
    });
    return stock;
  };

  // Check if increase button should be disabled
  const isIncreaseDisabled = () => {
    if (isSinglePlant()) return true;
    const availableStock = getAvailableStock();
    return quantity >= availableStock;
  };

  const increaseQuantity = () => {
    // Early return for single plants - absolutely no quantity changes allowed
    if (isSinglePlant()) {
      console.log('🚫 Increment blocked: Single plant detected');
      return;
    }
    
    const availableStock = getAvailableStock();
    const newQuantity = quantity + 1;
    
    // Check stock limits
    if (newQuantity > availableStock) {
      console.log('🚫 Increment blocked: Stock limit reached', {
        currentQuantity: quantity,
        newQuantity,
        availableStock
      });
      Alert.alert('Stock Limit', `Only ${availableStock} items available in stock`);
      return;
    }
    
    console.log('✅ Increment allowed:', {
      currentQuantity: quantity,
      newQuantity,
      availableStock
    });
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    // Early return for single plants - absolutely no quantity changes allowed
    if (isSinglePlant()) {
      console.log('🚫 Decrement blocked: Single plant detected');
      return;
    }
    if (quantity > 1) {
      console.log('✅ Decrement allowed: Not a single plant and quantity > 1');
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToWishlist = () => {
    // Wishlist feature temporarily disabled
    // setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const handleLovePress = () => {
    setIsLoved(!isLoved);
    setLoveCount(prevCount => isLoved ? prevCount - 1 : prevCount + 1);
    // TODO: Implement love functionality API call
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  // Get shipping cost based on listing type and specifications
  const getShippingCost = () => {
    const listingType = plantData?.listingType?.toLowerCase() || 'single';
    const potSize = selectedPotSize || '2"';
    const plantHeight = plantData?.approximateHeight || 0;
    
    switch (listingType) {
      case 'single':
        // Based on plant height
        const height = parseFloat(plantHeight) || 0;
        const singleCost = height > 12 ? 70 : 50;
        const singleAddOn = height > 12 ? 7 : 5;
        return {
          cost: singleCost,
          addOnCost: singleAddOn,
          baseCargo: 150,
          description: height > 12 ? 'UPS 2nd Day $70, add-on plant $7' : 'UPS 2nd Day $50, add-on plant $5',
          displayText: height > 12 ? 'UPS 2nd Day ' : 'UPS 2nd Day ',
          mainPrice: height > 12 ? '$70' : '$50',
          addOnText: ', add-on plant ',
          addOnPrice: height > 12 ? '$7' : '$5',
          rule: `Based on plant height: ${height > 12 ? '>12"' : '≤12"'} = $${singleCost}`
        };
        
      case 'growers':
      case "grower's choice":
        // Based on pot size
        const potSizeNum = parseFloat(potSize.replace('"', '')) || 2;
        const growersCost = potSizeNum > 4 ? 70 : 50;
        const growersAddOn = potSizeNum > 4 ? 7 : 5;
        return {
          cost: growersCost,
          addOnCost: growersAddOn,
          baseCargo: 150,
          description: potSizeNum > 4 ? 'UPS 2nd Day $70, add-on plant $7' : 'UPS 2nd Day $50, add-on plant $5',
          displayText: potSizeNum > 4 ? 'UPS 2nd Day ' : 'UPS 2nd Day ',
          mainPrice: potSizeNum > 4 ? '$70' : '$50',
          addOnText: ', add-on plant ',
          addOnPrice: potSizeNum > 4 ? '$7' : '$5',
          rule: `Based on pot size: ${potSizeNum > 4 ? '>4"' : '≤4"'} = $${growersCost}`
        };
        
      case 'wholesale':
        // Based on pot size
        const wholePotSizeNum = parseFloat(potSize.replace('"', '')) || 2;
        const wholesaleCost = wholePotSizeNum > 4 ? 200 : 150;
        const wholesaleAddOn = wholePotSizeNum > 4 ? 25 : 20;
        return {
          cost: wholesaleCost,
          addOnCost: wholesaleAddOn,
          baseCargo: 150, // Higher base cargo for wholesale
          description: wholePotSizeNum > 4 ? 'Wholesale Shipping $200, add-on plant $25' : 'Wholesale Shipping $150, add-on plant $20',
          displayText: wholePotSizeNum > 4 ? 'Wholesale Shipping ' : 'Wholesale Shipping ',
          mainPrice: wholePotSizeNum > 4 ? '$200' : '$150',
          addOnText: ', add-on plant ',
          addOnPrice: wholePotSizeNum > 4 ? '$25' : '$20',
          rule: `Based on pot size: ${wholePotSizeNum > 4 ? '>4"' : '≤4"'} = $${wholesaleCost}`
        };
        
      default:
        // Default to single listing rules
        return {
          cost: 50,
          addOnCost: 5,
          baseCargo: 150,
          description: 'UPS 2nd Day $50, add-on plant $5',
          displayText: 'UPS 2nd Day ',
          mainPrice: '$50',
          addOnText: ', add-on plant ',
          addOnPrice: '$5',
          rule: 'Default shipping rate'
        };
    }
  };

  // Get price for selected pot size
  const getPriceForSelectedPotSize = () => {
    if (potSizeGroups[selectedPotSize] && potSizeGroups[selectedPotSize].length > 0) {
      const selectedPlant = potSizeGroups[selectedPotSize][0]; // Take first plant of selected pot size
      return {
        usdPrice: selectedPlant.usdPrice,
        usdPriceNew: selectedPlant.usdPriceNew,
        localPrice: selectedPlant.localPrice,
        localPriceNew: selectedPlant.localPriceNew,
        discountPercent: selectedPlant.discountPercent,
        originalPrice: selectedPlant.originalPrice,
        finalPrice: selectedPlant.finalPrice,
      };
    }
    // Fallback to main plant data
    return {
      usdPrice: plantData?.usdPrice,
      usdPriceNew: plantData?.usdPriceNew,
      localPrice: plantData?.localPrice,
      localPriceNew: plantData?.localPriceNew,
      discountPercent: plantData?.discountPercent,
      originalPrice: plantData?.originalPrice,
      finalPrice: plantData?.finalPrice,
    };
  };

  // Calculate discounted price
  const getDiscountedPrice = () => {
    const priceData = getPriceForSelectedPotSize();
    // Preferred fields per spec
    const original = parseFloat(priceData.originalPrice ?? priceData.usdPrice ?? 0) || 0;
    let current = parseFloat(priceData.usdPriceNew ?? priceData.finalPrice ?? priceData.usdPrice ?? original) || 0;

    // Guard: if current is 0 but original exists, fallback to original
    if (current === 0 && original > 0) current = original;

    let deduction = 0;
    let discountPercent = 0;
    if (original > 0 && current < original) {
      deduction = original - current;
      discountPercent = (deduction / original) * 100;
    }

    return {
      originalPrice: original.toFixed(2),
      discountedPrice: current.toFixed(2),
      deduction: deduction.toFixed(2),
      discountPercent: parseFloat(discountPercent.toFixed(0)), // whole number percent per common UI convention
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Skeleton Background Image */}
        <View style={styles.skeletonBackgroundImage} />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Header Navigation */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer}>
            {/* Skeleton Content */}
            <View style={styles.content}>
              {/* Skeleton Title */}
              <View style={styles.skeletonTitle} />
              
              {/* Skeleton Description */}
              <View style={styles.descriptionContainer}>
                <View style={styles.skeletonVariegation} />
                <View style={styles.skeletonDetailRow}>
                  <View style={styles.skeletonDetailLabel} />
                  <View style={styles.skeletonDetailValue} />
                </View>
                <View style={styles.skeletonDetailRow}>
                  <View style={styles.skeletonDetailLabel} />
                  <View style={styles.skeletonDetailValue} />
                </View>
              </View>

              {/* Skeleton Price Section */}
              <View style={styles.priceContainer}>
                <View style={styles.skeletonPrice} />
                <View style={styles.skeletonOriginalPrice} />
              </View>

              {/* Skeleton Pot Size Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.potSizeContainer}>
                  {Array.from({length: 3}).map((_, idx) => (
                    <View key={idx} style={styles.skeletonPotSize} />
                  ))}
                </View>
              </View>

              {/* Skeleton Details Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.skeletonSectionTitle} />
                {Array.from({length: 4}).map((_, idx) => (
                  <View key={idx} style={styles.skeletonDetailRow}>
                    <View style={styles.skeletonDetailLabel} />
                    <View style={styles.skeletonDetailValue} />
                  </View>
                ))}
              </View>

              {/* Skeleton Recommendations */}
              <View style={styles.sectionContainer}>
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.recommendationGrid}>
                  {Array.from({length: 2}).map((_, idx) => (
                    <View key={idx} style={styles.skeletonRecommendationCard}>
                      <View style={styles.skeletonRecommendationImage} />
                      <View style={styles.skeletonRecommendationText} />
                      <View style={styles.skeletonRecommendationPrice} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (!plantData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plant not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Plant Image */}
      <Image
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => {
          setImageSource(require('../../../assets/buyer-icons/png/ficus-lyrata.png'));
        }}
      />
      


      <SafeAreaView style={styles.safeArea}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 72 + Math.max(insets.bottom, 8) }}>


          {/* Content */}
          <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            {plantData.genus} {plantData.species}
          </Text>

          {/* Variegation + Listing Type */}
          <View style={styles.variegationTypeRow}>
            {plantData.variegation && plantData.variegation !== 'None' && plantData.variegation.trim() !== '' && (
              <Text style={styles.variegationLabel} numberOfLines={1}>
                {plantData.variegation}
              </Text>
            )}
            {plantData.listingType && (
              <View style={styles.listingTypeBadgeDetail}>
                <Text style={styles.listingTypeBadgeTextDetail} numberOfLines={1}>
                  {plantData.listingType}
                </Text>
              </View>
            )}
          </View>

          {/* Additional Description */}
          <View style={styles.descriptionContainer}>
            {plantData.mutation && plantData.mutation !== 'Not specified' && plantData.mutation.trim() !== '' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mutation:</Text>
                <Text style={styles.detailValue}>
                  {plantData.mutation}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Country:</Text>
              {plantData.countryFlag ? (
                <Image
                  source={{uri: plantData.countryFlag}}
                  style={styles.flagImage}
                />
              ) : (
                (() => {
                  // Helper function to map currency codes to country codes
                  const mapCurrencyToCountry = (localCurrency) => {
                    if (!localCurrency) return null;
                    
                    switch (localCurrency.toUpperCase()) {
                      case 'PHP':
                        return 'PH';
                      case 'THB':
                        return 'TH';
                      case 'IDR':
                        return 'ID';
                      default:
                        return null;
                    }
                  };

                  // First try to use the country field if available
                  let countryCode = plantData.country;
                  
                  // If no country field, try to map from localCurrency
                  if (!countryCode && plantData.localCurrency) {
                    countryCode = mapCurrencyToCountry(plantData.localCurrency);
                  }

                  // If still not found and listing is Grower's Choice / Wholesale,
                  // attempt to derive localCurrency from variations
                  if (!countryCode && plantData.variations && plantData.variations.length > 0 && (plantData.listingType && (plantData.listingType.toLowerCase().includes("grower") || plantData.listingType.toLowerCase().includes('wholesale')))) {
                    const v = plantData.variations.find(x => x.localCurrency || x.lowestVariationLocalCurrency || x.localCurrencySymbol);
                    if (v) {
                      const currencyFromVar = (v.localCurrency || v.lowestVariationLocalCurrency || '').toString();
                      if (currencyFromVar) {
                        countryCode = mapCurrencyToCountry(currencyFromVar) || currencyFromVar;
                      }
                    }
                  }

                  const country = countryCode?.toString().toLowerCase() || '';
                  if (country.includes('philippines') || country.includes('ph')) {
                    return <PhilippinesFlag width={28} height={19} style={styles.flagImage} />;
                  } else if (country.includes('thailand') || country.includes('th')) {
                    return <ThailandFlag width={28} height={19} style={styles.flagImage} />;
                  } else if (country.includes('indonesia') || country.includes('id')) {
                    return <IndonesiaFlag width={28} height={19} style={styles.flagImage} />;
                  }
                  // Default to Philippines
                  return <PhilippinesFlag width={28} height={19} style={styles.flagImage} />;
                })()
              )}
              <Text style={styles.detailValue}>
                {(() => {
                      // Helper to map currency -> display name
                      const mapCurrencyToCountryText = (localCurrency) => {
                        if (!localCurrency) return null;
                        switch (localCurrency.toUpperCase()) {
                          case 'PHP': return 'Philippines';
                          case 'THB': return 'Thailand';
                          case 'IDR': return 'Indonesia';
                          default: return null;
                        }
                      };

                      // Prefer explicit country, then localCurrency, then check variations for growers/wholesale
                      let countryText = plantData.country || null;
                      if (!countryText && plantData.localCurrency) {
                        countryText = mapCurrencyToCountryText(plantData.localCurrency);
                      }
                      if (!countryText && plantData.variations && plantData.variations.length > 0 && (plantData.listingType && (plantData.listingType.toLowerCase().includes("grower") || plantData.listingType.toLowerCase().includes('wholesale')))) {
                        const v = plantData.variations.find(x => x.localCurrency || x.lowestVariationLocalCurrency || x.localCurrencySymbol);
                        if (v) {
                          const currencyFromVar = (v.localCurrency || v.lowestVariationLocalCurrency || '').toString();
                          if (currencyFromVar) countryText = mapCurrencyToCountryText(currencyFromVar) || currencyFromVar;
                        }
                      }
                      // If still no country, default to Philippines
                      return countryText || 'Philippines';
                })()}
              </Text>
            </View>
          </View>

          {/* Social Bar */}
          <View style={styles.socialBar}>
            <View style={styles.leftControls}>
              <TouchableOpacity style={styles.socialButton} onPress={handleLovePress}>
                {isLoved ? (
                  <HeartSolidIcon width={32} height={32} color="#E53E3E" />
                ) : (
                  <HeartIcon width={32} height={32} />
                )}
                <Text style={styles.socialText}>{loveCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, {opacity: 0.5}]}
                onPress={() => {
                  // Wishlist feature temporarily disabled
                }}
                disabled={true}>
                {isWishlisted ? (
                  <WishListSelected width={32} height={32} />
                ) : (
                  <WishListUnselected width={32} height={32} />
                )}
                <Text style={styles.socialText}>
                  {plantData.wishlistCount || 0}
                </Text>
              </TouchableOpacity>
            </View>
            {/* <View style={styles.rightControls}>
              <TouchableOpacity style={styles.socialButton} onPress={handleShare}>
                <ShareIcon width={32} height={32} />
                <Text style={styles.socialText}>Share</Text>
              </TouchableOpacity>
            </View> */}
          </View>

          {/* Price and Pot Size */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              {(() => {
                const {originalPrice, discountedPrice, discountPercent} = getDiscountedPrice();
                const hasDiscount = discountPercent > 0;
                return (
                  <>
                    <Text style={styles.price}>${discountedPrice}</Text>
                    {hasDiscount && (
                      <>
                        <Text style={styles.originalPriceSmall}>${originalPrice}</Text>
                        <View style={styles.discountBadgeSmall}>
                          <Text style={styles.discountTextSmall}>{discountPercent}% OFF</Text>
                        </View>
                      </>
                    )}
                  </>
                );
              })()}
            </View>
            <View style={styles.shippingInfo}>
              <FlightIcon width={20} height={20} />
              <Text style={styles.shippingText}>
                {plantData?.listingType?.toLowerCase() === 'wholesale' ? (
                  <>Initial Wholesale Air Cargo <Text style={{color: '#539461'}}>${getShippingCost().baseCargo}</Text>, add-on wholesale order <Text style={{color: '#539461'}}>$50</Text>.</>
                ) : (
                  <>Base Air Cargo <Text style={{color: '#539461'}}>${getShippingCost().baseCargo}</Text></>
                )}
              </Text>
            </View>
            <View style={styles.potSizeContainer}>
              <View style={styles.potSizeHeader}>
                <Text style={styles.potSizeLabel}>Pot Size:</Text>
                <Text style={styles.potSizeValue}>
                  {selectedPotSize} | Standard Nursery Pot
                </Text>
              </View>
              <View style={styles.potSizeCards}>
                {availablePotSizes.length > 0 ? availablePotSizes.map((potSize) => (
                  <TouchableOpacity
                    key={potSize}
                    style={[
                      styles.potSizeCard,
                      selectedPotSize === potSize && styles.selectedPotSizeCard,
                    ]}
                    onPress={() => setSelectedPotSize(potSize)}
                  >
                    <View style={[
                      styles.potSizeImage,
                      selectedPotSize === potSize && { borderColor: '#539461' }
                    ]}>
                      <Image
                        source={imageSource}
                        style={styles.potImage}
                      />
                    </View>
                    <Text style={styles.potSizeCardLabel}>{potSize}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={styles.noPotSizesText}>No pot sizes available</Text>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Important Index Details */}
          <View style={styles.plantDetailsContainer}>
            <View style={styles.plantDetailsHeader}>
              <Text style={styles.plantDetailsTitle}>Important index (7-10 being best) that you need to know before importing this plant</Text>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <PlaneIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.plantDetailData}>
                      {plantData.shippingIndex || 'Best (7-10)'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Shipping Index</Text>
              </View>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <FlakesIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.plantDetailData}>
                      {plantData.acclimationIndex || 'Best (7-10)'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Acclimation Index</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Shipping Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <View style={styles.shippingDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <TruckIcon width={24} height={24} />
              </View>
              <View style={styles.shippingDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.shippingDetailData}>
                      {getShippingCost().displayText}
                      <Text style={[styles.shippingDetailData, {color: '#539461'}]}>
                        {getShippingCost().mainPrice}
                      </Text>
                      {getShippingCost().addOnText}
                      <Text style={[styles.shippingDetailData, {color: '#539461'}]}>
                        {getShippingCost().addOnPrice}
                      </Text>
                    </Text>
                  </View>
                </View>
                <Text style={styles.shippingDetailLabel}>
                  {plantData?.listingType ? `${plantData.listingType} - ` : ''}Upgrade to Next Day UPS is available at checkout.
                </Text>
              </View>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <PlaneIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.flightDetailData}>
                      Plant Flight <Text style={{color: '#539461'}}>{plantData?.plantFlightDate || 'N/A'}</Text>
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Soonest air cargo schedule</Text>
              </View>
            </View>
            <View style={styles.baseCargoDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <BoxIcon width={30} height={30} />
              </View>
              <View style={styles.baseCargoDetailContent}>
                <View style={styles.baseCargoTextContainer}>
                  <View style={styles.baseCargoTextAndAmount}>
                    <Text style={styles.baseCargoDetailData}>
                      {plantData?.listingType?.toLowerCase() === 'wholesale' ? (
                        <>Initial Wholesale Air Cargo <Text style={{color: '#539461'}}>${getShippingCost().baseCargo}</Text>, add-on wholesale order <Text style={{color: '#539461'}}>$50</Text>.</>
                      ) : (
                        <>Base Air Cargo <Text style={{color: '#539461'}}>${getShippingCost().baseCargo}</Text></>
                      )}
                    </Text>
                    <View style={styles.tooltipContainer}>
                      {/* Tooltip helper icon can be added here */}
                    </View>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Pay upfront, earn back when you and shipping buddies reach $500 on 15 plants.</Text>
              </View>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <ReturnIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.returnDetailData}>
                      Not Allowed
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Return and exchanges</Text>
              </View>
            </View>
          </View>

        {/* Divider */}
          <View style={styles.divider} />


          {/* Payment Options */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            <View style={styles.paymentOptions}>
              <View style={styles.paymentOption}>
                <VenmoLogo width={60} height={20} />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* You may also like section (BrowseMorePlants component) */}
          
            <BrowseMorePlants
              title="You May Also Like"
              initialLimit={4}
              loadMoreLimit={4}
              onPlantPress={(plant) => navigation.push('ScreenPlantDetail', { plantCode: plant.plantCode, plantData: plant })}
              containerStyle={{paddingVertical:0}}
            />
        
        </View>
        </ScrollView>

        {/* Action Bar */}
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 8), height: 72 + Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('ScreenCart')}>
            <CartIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleBuyNow}>
            <Text style={styles.addToCartButtonText}>Buy Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowButton} onPress={handleAddToCart}>
            <Text style={styles.buyNowButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Add to Cart Modal */}
      <Modal
        visible={showAddToCartModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Title */}
            <View style={styles.modalTitle}>
              <Text style={styles.modalTitleText}>
                {modalAction === 'buy-now' ? 'Buy Now' : 'Add to Cart'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Pot Size Section */}
            <View style={styles.potSizeSection}>
              <View style={styles.plantPriceContainer}>
                {/* Price */}
                <View style={styles.modalPriceContainer}>
                  <View style={styles.priceRow}>
                    {(() => {
                      const {originalPrice, discountedPrice, discountPercent} = getDiscountedPrice();
                      const hasDiscount = discountPercent > 0;
                      return (
                        <>
                          <Text style={styles.modalPrice}>${discountedPrice}</Text>
                          {hasDiscount && (
                            <>
                              <Text style={styles.originalPrice}>${originalPrice}</Text>
                              <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                              </View>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </View>
                  <View style={styles.shippingInfo}>
                    <FlightIcon width={20} height={20} />
                    <Text style={styles.shippingText}>
                      Plant Flight {plantData?.plantFlightDate || 'N/A'} • {getShippingCost().displayText}
                      <Text style={[styles.shippingText, {color: '#539461'}]}>
                        {getShippingCost().mainPrice}
                      </Text>
                      {getShippingCost().addOnText}
                      <Text style={[styles.shippingText, {color: '#539461'}]}>
                        {getShippingCost().addOnPrice}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Pot Size */}
                <View style={styles.modalPotSizeContainer}>
                  <View style={styles.potSizeHeader}>
                    <Text style={styles.potSizeLabel}>Pot Size:</Text>
                    <Text style={styles.potSizeValue}>
                      {selectedPotSize} | Standard Nursery Pot
                    </Text>
                  </View>
                  <View style={styles.modalPotSizeCards}>
                    {availablePotSizes.map((potSize) => (
                      <TouchableOpacity
                        key={potSize}
                        style={[
                          styles.modalPotSizeCard,
                          selectedPotSize === potSize && styles.selectedPotSizeCard,
                        ]}
                        onPress={() => setSelectedPotSize(potSize)}
                      >
                        <View style={[
                          styles.modalPotSizeImage,
                          selectedPotSize === potSize && styles.modalSelectedPotSizeImage
                        ]}>
                          <Image
                            source={imageSource}
                            style={styles.modalPotImage}
                          />
                        </View>
                        <Text style={styles.modalPotSizeCardLabel}>{potSize}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.modalDividerContainer}>
              <View style={styles.modalDivider} />
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <View style={styles.quantityLabelContainer}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                {isSinglePlant() ? (
                  <Text style={styles.singlePlantNote}>Single plant only</Text>
                ) : (
                  <Text style={styles.stockAvailabilityNote}>
                    {getAvailableStock()} available
                  </Text>
                )}
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    isSinglePlant() && styles.disabledStepperButton
                  ]}
                  onPress={isSinglePlant() ? undefined : decreaseQuantity}
                  disabled={isSinglePlant()}
                  activeOpacity={isSinglePlant() ? 1 : 0.7}
                  pointerEvents={isSinglePlant() ? 'none' : 'auto'}
                >
                  <MinusIcon 
                    width={24} 
                    height={24} 
                    color={isSinglePlant() ? '#CDD3D4' : '#556065'} 
                  />
                </TouchableOpacity>
                <View style={[
                  styles.quantityInput,
                  isSinglePlant() && styles.disabledQuantityInputContainer
                ]}>
                  <TextInput
                    style={[
                      styles.quantityInputText,
                      isSinglePlant() && styles.disabledQuantityInputText
                    ]}
                    value={quantity.toString()}
                    onChangeText={(text) => {
                      if (isSinglePlant()) {
                        console.log('🚫 Text input blocked: Single plant detected');
                        return;
                      }
                      const num = parseInt(text) || 1;
                      const validatedNum = Math.max(1, num);
                      const availableStock = getAvailableStock();
                      
                      if (validatedNum > availableStock) {
                        console.log('🚫 Quantity exceeds stock limit:', { requested: validatedNum, available: availableStock });
                        Alert.alert(
                          'Stock Limit Exceeded',
                          `Only ${availableStock} items available in stock. Please reduce your quantity.`,
                          [{ text: 'OK' }]
                        );
                        setQuantity(availableStock);
                      } else {
                        setQuantity(validatedNum);
                      }
                    }}
                    keyboardType="numeric"
                    textAlign="center"
                    editable={!isSinglePlant()}
                    selectTextOnFocus={!isSinglePlant()}
                    pointerEvents={isSinglePlant() ? 'none' : 'auto'}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.stepperButton, 
                    styles.stepperButtonRight,
                    isIncreaseDisabled() && styles.disabledStepperButton
                  ]}
                  onPress={isIncreaseDisabled() ? undefined : increaseQuantity}
                  disabled={isIncreaseDisabled()}
                  activeOpacity={isIncreaseDisabled() ? 1 : 0.7}
                  pointerEvents={isIncreaseDisabled() ? 'none' : 'auto'}
                >
                  <PlusIcon 
                    width={24} 
                    height={24} 
                    color={isIncreaseDisabled() ? '#CDD3D4' : '#556065'} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action */}
            <View style={styles.modalAction}>
              <View style={styles.modalActionContent}>
                <TouchableOpacity
                  style={styles.addToCartModalButton}
                  onPress={handleConfirmAddToCart}
                >
                  <Text style={styles.addToCartModalButtonText}>
                    {modalAction === 'buy-now' ? 'Buy Now' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.homeIndicator}>
                <View style={styles.gestureBar} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 440,
    zIndex: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#393D40',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(245, 246, 246, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(205, 211, 212, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 44,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 246, 246, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  imageCounter: {
    position: 'absolute',
    top: 360,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 10,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 400,
    paddingBottom: 106,
    zIndex: 5,
    minHeight: '70%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202325',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  variegationTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 8,
    minHeight: 28,
  justifyContent: 'space-between',
  },
  variegationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  flexShrink: 1,
  flex: 1,
  },
  listingTypeBadgeDetail: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 1,
    backgroundColor: '#202325',
    borderRadius: 8,
    height: 28,
    minHeight: 28,
  },
  listingTypeBadgeTextDetail: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7F8D91',
    width: 70,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    flex: 1,
  },
  flagImage: {
    width: 28,
    height: 19,
    borderRadius: 2,
  },
  socialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    width: '100%',
    height: 64,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E4E7E9',
    alignSelf: 'stretch',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    height: 32,
  },
  rightControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    height: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
    height: 32,
  },
  socialText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  priceContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
  },
  price: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: '#539461',
  },
  originalPriceSmall: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    textDecorationLine: 'line-through',
    color: '#7F8D91',
  },
  discountBadgeSmall: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    height: 24,
    minHeight: 24,
  },
  discountTextSmall: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shippingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#539461',
  },
  potSizeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
    height: 178,
  },
  potSizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 24,
    alignSelf: 'stretch',
  },
  potSizeLabel: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  potSizeValue: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  potSizeCards: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to left instead of center
    alignItems: 'flex-start',
    gap: 12,
    width: 188,
    height: 146,
  },
  potSizeCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 88,
    height: 146,
  },
  selectedPotSizeCard: {
    // Selected state will be handled by border in potSizeImage
  },
  potSizeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    height: 116,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  potImage: {
    width: 88,
    height: 116,
  },
  potSizeCardLabel: {
    width: 41,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginHorizontal: 24,
  },
  plantDetailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    alignSelf: 'stretch',
    height: 216,
  },
  plantDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    height: 72,
  },
  plantDetailsTitle: {
    height: 72,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 1,
  },
  plantDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    alignSelf: 'stretch',
    height: 48,
  },
  plantDetailIconContainer: {
    width: 24,
    height: 24,
  },
  plantDetailIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#556065',
    borderRadius: 2,
  },
  plantDetailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    minHeight: 48,
    flex: 1,
  },
  plantDetailTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    alignSelf: 'stretch',
  },
  plantDetailTextAndAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    flex: 1,
  },
  plantDetailData: {
    fontFamily: 'Inter',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  plantDetailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    alignSelf: 'stretch',
    flexWrap: 'wrap',
  },
  shippingDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    height: 70,
    alignSelf: 'stretch',
  },
  shippingDetailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    height: 70,
    flex: 1,
  },
  shippingDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  shippingDetailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    alignSelf: 'stretch',
  },
  flightDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  baseCargoDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 52,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  baseCargoDetailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
  },
  baseCargoTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    alignSelf: 'stretch',
    flexWrap: 'wrap',
  },
  baseCargoTextAndAmount: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 4,
    flex: 1,
    alignSelf: 'stretch',
    flexWrap: 'wrap',
  },
  baseCargoDetailData: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
    flexWrap: 'wrap',
  },
  tooltipContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: 28,
    height: 28,
  },
  returnDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#393D40',
  },
  detailItem: {
    gap: 2,
  },
  detailItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  detailItemValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7F8D91',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 96,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202325',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    height: 72, // base height: paddingVertical(24) + button height(48)
  },
  cartButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyNowButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#414649',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recommendationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Consistent spacing between columns
    alignItems: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 12, // Small horizontal padding for container
  },
  recommendationCard: {
    // Equal width for two columns with consistent spacing
    width: '48%', // 48% width for each card allows for proper 2-column layout
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'flex-start', // Prevent vertical stretching
    padding: 0,
  },
  noRecommendationsContainer: {
    marginTop: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#8B9096',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    height: 585,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
  },
  modalTitle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  modalTitleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
  },
  potSizeSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 12,
    width: '100%',
    height: 330,
    alignSelf: 'stretch',
  },
  plantPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 16,
    height: 318,
    alignSelf: 'stretch',
  },
  modalPriceContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
    height: 100,
    alignSelf: 'stretch',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
  },
  modalPrice: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: '#539461',
  },
  originalPrice: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    textDecorationLine: 'line-through',
    color: '#7F8D91',
  },
  discountBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    // Allow the badge to size to its content to avoid clipping text like "80% OFF"
    // width: 75,
    alignSelf: 'flex-start',
    flexShrink: 0,
    height: 24,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
  },
  discountText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#CC512A',
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 6,
    paddingHorizontal: 12,
    gap: 6,
    minHeight: 24,
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 8,
  },
  shippingText: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#539461',
  },
  potSizeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    width: 327,
    height: 178,
  },
  potSizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 24,
  },
  potSizeLabel: {
    height: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  potSizeValue: {
    width: 247,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  potSizeCards: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to left instead of center
    alignItems: 'flex-start',
    gap: 12,
    width: 188,
    height: 146,
  },
  potSizeCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 88,
    height: 146,
  },
  selectedPotSizeCard: {
    // Selected state will be handled by border in potSizeImage
  },
  potSizeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    height: 116,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  potImage: {
    width: 88,
    height: 116,
  },
  potSizeCardLabel: {
    width: 41,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  
  // Modal pot size styles
  modalPotSizeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    height: 178,
    alignSelf: 'stretch',
  },
  modalPotSizeCards: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to left instead of center
    alignItems: 'flex-start',
    gap: 12,
    width: 188,
    height: 146,
  },
  modalPotSizeCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 88,
    height: 146,
  },
  modalPotSizeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    height: 116,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalSelectedPotSizeImage: {
    borderColor: '#539461',
  },
  modalPotImage: {
    width: 88,
    height: 116,
  },
  modalPotSizeCardLabel: {
    width: 41,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  modalDividerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
    height: 17,
    alignSelf: 'stretch',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    alignSelf: 'stretch',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
    width: '100%',
    height: 84,
    alignSelf: 'stretch',
  },
  quantityLabelContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 48,
    flex: 1,
  },
  quantityLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  singlePlantNote: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#7F8D91',
    marginTop: 2,
  },
  stockAvailabilityNote: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#539461',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 48,
    flex: 1,
  },
  stepperButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 48,
    minWidth: 48,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: -1,
  },
  stepperButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginRight: 0,
    marginLeft: -1,
  },
  disabledStepperButton: {
    backgroundColor: '#F8F9FA',
    opacity: 0.6,
  },
  quantityInput: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    flex: 1,
    marginHorizontal: -1,
    paddingHorizontal: 4,
  },
  quantityInputText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
    width: '100%',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent', // Ensure no background on text input
  },
  disabledQuantityInputContainer: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E4E7E9',
  },
  disabledQuantityInputText: {
    color: '#7F8D91',
    backgroundColor: 'transparent', // Ensure no background layering
  },
  modalAction: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    height: 94,
    backgroundColor: '#FFFFFF',
  },
  modalActionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    width: '100%',
    height: 60,
    alignSelf: 'stretch',
  },
  addToCartModalButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  addToCartModalButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  homeIndicator: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    bottom: 8,
    marginLeft: -74,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
  // Skeleton loading styles
  skeletonBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  skeletonTitle: {
    width: '70%',
    height: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 16,
  },
  skeletonVariegation: {
    width: '50%',
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonDetailLabel: {
    width: '30%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonDetailValue: {
    width: '40%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonPrice: {
    width: '40%',
    height: 28,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonOriginalPrice: {
    width: '30%',
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonSectionTitle: {
    width: '60%',
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 16,
  },
  skeletonPotSize: {
    width: 80,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonRecommendationCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3E6E8',
    marginBottom: 16,
  },
  skeletonRecommendationImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonRecommendationText: {
    width: '80%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonRecommendationPrice: {
    width: '50%',
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
});

export default ScreenPlantDetail;
