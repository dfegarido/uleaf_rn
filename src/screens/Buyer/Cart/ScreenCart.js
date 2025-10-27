/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import MinusIcon from '../../../assets/buyer-icons/minus.svg';
import PlusIcon from '../../../assets/buyer-icons/plus.svg';
import PlusDisabledIcon from '../../../assets/icons/greylight/plus-regular.svg';
import {useNavigation} from '@react-navigation/native';
import CartBar from '../../../components/CartBar';
import {getCartItemsApi, removeFromCartApi, updateCartItemApi} from '../../../components/Api/cartApi';
import {getBuyerListingsApi, searchPlantsApi} from '../../../components/Api/listingBrowseApi';
import {addToCartApi} from '../../../components/Api/cartApi';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

import PromoBadgeList from '../../../components/PromoBadgeList';
import CloseIcon from '../../../assets/buyer-icons/close.svg';
import {selectedCard} from '../../../assets/buyer-icons/png';
import DownArrowIcon from '../../../assets/buyer-icons/downicon.svg';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PlantItemCard from '../../../components/PlantItemCard/PlantItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';

// Get screen dimensions for responsive design
const screenWidth = Dimensions.get('window').width;
const checkboxSize = Math.max(20, Math.min(28, screenWidth * 0.065)); // Responsive checkbox size (20-28px based on screen width)

// Helper function to get a valid image source
const getValidImageSource = (imageUrl, plantCode) => {
  // Array of default plant images to choose from
  const defaultImages = [
    require('../../../assets/images/plant1.png'),
    require('../../../assets/images/plant2.png'),
    require('../../../assets/images/plant3.png'),
    require('../../../assets/images/alocasia.png'),
    require('../../../assets/images/anthurium.png'),
    require('../../../assets/images/begonia.png'),
    require('../../../assets/images/hoya.png'),
    require('../../../assets/images/monstera.png'),
    require('../../../assets/images/philodendron.png'),
    require('../../../assets/images/scindapsus.png'),
    require('../../../assets/images/syngonium.png'),
  ];
  
  try {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      // Select a random default image
      const randomIndex = Math.floor(Math.random() * defaultImages.length);
      const selectedDefaultImage = defaultImages[randomIndex];
      console.log('❌ No valid image URL for', plantCode, ', using random default image at index:', randomIndex);
      return selectedDefaultImage;
    }
    
    const trimmedUrl = imageUrl.trim();
    console.log('✅ Valid image URL for', plantCode, ':', trimmedUrl);
    return { uri: trimmedUrl };
  } catch (error) {
    // Fallback to a random default image on error
    const randomIndex = Math.floor(Math.random() * defaultImages.length);
    const selectedDefaultImage = defaultImages[randomIndex];
    console.log('❌ Error processing image for', plantCode, ':', error.message, ', using random default image at index:', randomIndex);
    return selectedDefaultImage;
  }
};

// Header height constant for safe area calculations
const HEADER_HEIGHT = 110;

const CartHeader = ({insets}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigation = useNavigation();
  // Local import of reusable Avatar component
  const Avatar = require('../../../components/Avatar/Avatar').default;

  // Debounced search effect - triggers after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        console.log('🔍 Cart search triggered for:', searchTerm);
        performSearch(searchTerm.trim());
      } else if (searchTerm.trim().length === 0) {
        setSearchResults([]);
        setLoadingSearch(false);
      }
    }, 800); // 800ms delay for "finished typing" detection

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);
      console.log('🔍 Starting cart search for:', searchTerm);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const searchParams = {
        query: searchTerm,
        limit: 4,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      const res = await searchPlantsApi(searchParams);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search plants.');
      }

      const plants = res.data?.plants || [];
      console.log(`✅ Cart search completed: found ${plants.length} plants for "${searchTerm}"`);
      setSearchResults(plants);
      
    } catch (error) {
      console.error('❌ Error performing cart search:', error);
      setSearchResults([]);
      
      Alert.alert(
        'Search Error',
        'Could not search for plants. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoadingSearch(false);
    }
  };
  
  return (
    <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Shop')}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ileafU "
                placeholderTextColor="#647276"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Close search results when input loses focus
                  setTimeout(() => {
                    setIsSearchFocused(false);
                  }, 150); // Small delay to allow for result tap
                }}
                multiline={false}
                numberOfLines={1}
                // Disable native autocomplete and suggestions
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                textContentType="none"
                dataDetectorTypes="none"
                keyboardType="default"
              />
              {loadingSearch && (
                <ActivityIndicator size="small" color="#647276" style={{marginLeft: 8}} />
              )}
            </View>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // Wishlist feature temporarily disabled
              console.log('Wishlist feature is temporarily disabled');
            }}>
            <Wishicon width={40} height={40} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ScreenProfile')}>
            {/* Reusable Avatar component will show cached profilePhotoUrl or fallback icon */}
            <Avatar size={40} />
          </TouchableOpacity>
        </View>
      </View>
      
      <PromoBadgeList navigation={navigation} />

      {/* Search Results Dropdown */}
      {isSearchFocused && searchTerm.trim().length >= 2 && (
        <View style={styles.searchResultsContainer}>
          {loadingSearch ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching plants...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsList}>
              {searchResults.slice(0, 8).map((plant, index) => (
                <TouchableOpacity
                  key={`${plant.id}_${index}`}
                  style={styles.searchResultItem}
                  onPress={() => {
                    if (plant.plantCode) {
                      navigation.navigate('ScreenPlantDetail', {
                        plantCode: plant.plantCode
                      });
                    } else {
                      console.error('❌ Missing plantCode for plant:', plant);
                      Alert.alert('Error', 'Unable to view plant details. Missing plant code.');
                    }
                  }}
                >
                  <Text style={styles.searchResultName} numberOfLines={2}>
                    {plant.title && !plant.title.includes('Choose the most suitable variegation') 
                      ? plant.title 
                      : `${plant.genus} ${plant.species}${plant.variegation && plant.variegation !== 'Choose the most suitable variegation.' ? ' ' + plant.variegation : ''}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No plants found for "{searchTerm}"
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const CartComponent = ({
  image,
  name,
  subtitle,
  price,
  originalPrice,
  quantity,
  flightInfo,
  shippingInfo,
  flagIcon,
  checked,
  onRemove,
  onPress,
  onQuantityChange,
  availableQuantity,
  isUnavailable,
  listingType,
}) => {
  // Debug image prop
  console.log('🖼️ CartComponent image prop for', name, ':', image);
  
  return (
  <View style={styles.cartCard}>
    <TouchableOpacity
      style={[styles.cartTopCard, isUnavailable && styles.unavailableCard]}
      onPress={onPress}
      disabled={isUnavailable}
      activeOpacity={isUnavailable ? 1 : 0.7}
      accessibilityState={{ disabled: isUnavailable }}
    >
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View
          style={[
            styles.cartImageContainer,
            {borderColor: checked ? '#539461' : 'transparent'},
          ]}>
          <Image source={image} style={styles.cartImage} />
          {!isUnavailable && (
            <View style={styles.cartCheckOverlay}>
              {checked ? (
                <View style={styles.checkedBox}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              ) : (
                <View style={styles.uncheckedBox} />
              )}
            </View>
          )}
          {/* Discount Badge */}
          {originalPrice && originalPrice > price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>
        <View style={{flex: 1, marginLeft: 12}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <Text style={[styles.cartName, isUnavailable && styles.unavailableText]}>{name}</Text>
            <TouchableOpacity onPress={onRemove}>
              <CloseIcon style={{marginTop: 5}} width={16} height={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cartSubtitle}>{subtitle}</Text>
          
          {/* Listing Type Badge */}
          <View style={[styles.listingTypeBadge, isUnavailable && styles.unavailableBadge]}>
            <Text style={styles.listingTypeText}>{isUnavailable ? 'Unavailable' : (listingType || 'Single Plant')}</Text>
          </View>
          
          {/* Price and Quantity Row */}
          <View style={styles.priceQuantityRow}>
            <View style={styles.priceContainer}>
              {/* Show original price with strikethrough if there's a discount */}
              {originalPrice && originalPrice > price && (
                <Text style={styles.originalPriceText}>
                  $ {(parseFloat(originalPrice) * quantity).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
              )}
              {/* Current price (discounted or regular) */}
              <Text style={styles.totalItemPrice}>$ {(parseFloat(price) * quantity).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</Text>
            </View>
            
            {/* Quantity Stepper - Always show, disable decrement when quantity is 1 */}
            <View style={[styles.quantityStepper, isUnavailable && styles.disabledStepper]}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => onQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isUnavailable}>
                <MinusIcon width={16} height={16} color={(quantity <= 1 || isUnavailable) ? '#CDD3D4' : '#556065'} />
              </TouchableOpacity>
              
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => {
                  console.log('🔼 INCREMENT BUTTON PRESSED');
                  console.log('🔼 Current quantity:', quantity);
                  console.log('🔼 Available quantity:', availableQuantity);
                  console.log('🔼 Is disabled?', quantity >= availableQuantity || isUnavailable);
                  console.log('🔼 Plant name:', name);
                  onQuantityChange(quantity + 1);
                }}
                disabled={quantity >= availableQuantity || isUnavailable}>
                <PlusIcon width={16} height={16} color={(quantity >= availableQuantity || isUnavailable) ? '#CDD3D4' : '#556065'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    
    {/* Details Section */}
    <View style={styles.cartDetailsSection}>
      <View style={styles.cartFooterRow}>
        <Text style={styles.cartFooterText}>✈️ {flightInfo}</Text>
        <Text style={{fontSize: 18}}>{flagIcon}</Text>
      </View>
      <View style={styles.cartFooterRow}>
        <Text style={styles.cartFooterText}>🚚 {shippingInfo}</Text>
      </View>
    </View>
  </View>
  );
};

const ScreenCart = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Calculate proper bottom padding for CartBar + tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height
  const cartBarContentHeight = 124;
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = cartBarContentHeight + safeBottomPadding + tabBarHeight + 16; // Extra 16px for spacing
  
  // Removed bespoke recommendations; will use BrowseMorePlants component
  // Placeholder hooks to keep hook order stable during Fast Refresh (prevents fewer hooks warning)
  const [_removedRecommendations] = useState(null);
  const [_removedLoadingRecommendations] = useState(false);

  // Load cart items on component mount
  useEffect(() => {
    loadCartItems();
  // No bespoke recommendation preload needed now
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      
      // Check internet connection
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const response = await retryAsync(() => getCartItemsApi({ limit: 50, offset: 0 }), 3, 1000);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load cart items');
      }

      console.log('Raw API response:', response.data); // Debug log
      console.log('Cart items from API:', JSON.stringify(response.data.items, null, 2)); // Better debug for items

      // Transform API data to match component structure
      const transformedItems = response.data.items?.map(item => {
        console.log('Transforming item:', item); // Debug log
        console.log('Listing details:', JSON.stringify(item.listingDetails, null, 2)); // Better debug for listing details
        console.log({transformedItems})
        // Check if listing is no longer available
        const isListingUnavailable = item.listingDetails?.title === "Listing no longer available";
        
        // Debug image mapping
        console.log('🖼️ Image mapping for item:', item.plantCode);
        console.log('🖼️ Image field:', item.listingDetails?.image);
        console.log('🔗 Image type:', typeof item.listingDetails?.image);
        console.log('🔗 Image length:', item.listingDetails?.image?.length || 'N/A');
        
        // Use helper function to get valid image
        const itemImage = getValidImageSource(item.listingDetails?.image, item.plantCode);
        
        // Debug available quantity mapping
        console.log('📦 Stock info for item:', item.plantCode);
        console.log('📦 availableQty field:', item.listingDetails?.availableQty);
        console.log('📦 availableQuantity field:', item.listingDetails?.availableQuantity);
        console.log('📦 Final mapped value:', item.listingDetails?.availableQty || 999);
        
        // Calculate current price and determine if there's a discount
        let currentPrice = 0;
        let originalPrice = null;
        
        if (item.listingDetails) {
          // Check if there's discount information
          if (item.listingDetails.originalPrice && item.listingDetails.price) {
            // New format: originalPrice exists means item has discount
            originalPrice = parseFloat(item.listingDetails.originalPrice);
            currentPrice = parseFloat(item.listingDetails.price);
          }
          // Legacy format: discountPrice exists
          else if (item.listingDetails.discountPrice) {
            currentPrice = parseFloat(item.listingDetails.discountPrice);
            originalPrice = parseFloat(item.listingDetails.price);
          } 
          // Otherwise just use the regular price
          else if (item.listingDetails.price) {
            currentPrice = parseFloat(item.listingDetails.price);
          }
        }
        
        // Fallback to item price if nothing else is available
        if (currentPrice === 0 && item.price) {
          currentPrice = parseFloat(item.price);
        }
        
        // Log the price data for debugging
        console.log('Price data for item:', item.plantCode, {
          discountPrice: item.listingDetails?.discountPrice,
          regularPrice: item.listingDetails?.price,
          itemPrice: item.price,
          calculatedCurrentPrice: currentPrice,
          calculatedOriginalPrice: originalPrice
        });

        // Create plant data object for flight date calculation
        const plantData = {
          country: item.listingDetails?.country || 'TH', // Default to Thailand if not specified
          genus: item.listingDetails?.genus,
          species: item.listingDetails?.species,
          plantFlightDate: item.listingDetails?.plantFlightDate || 'N/A' // Use API response
        };

        // Get country flag based on country code
        const getCountryFlag = (countryCode) => {
          const flags = {
            'PH': '🇵🇭', // Philippines
            'TH': '🇹🇭', // Thailand  
            'ID': '🇮🇩', // Indonesia
          };
          
          // If no country code or empty string, try to infer from plant flight date
          if (!countryCode || countryCode === '') {
            const flightDate = item.listingDetails?.plantFlightDate || '';
            // Quick heuristic based on flight dates
            if (flightDate.includes('Aug 23')) {
              return flags['PH']; // Philippines typically has shorter flight times
            } else if (flightDate.includes('Sep 20')) {
              return flags['TH']; // Thailand
            }
            return flags['TH']; // Default to Thailand
          }
          
          return flags[countryCode] || '🌍'; // Default globe emoji
        };

        // Calculate shipping cost based on listing type and specifications (matches ScreenPlantDetail logic)
        const getShippingCost = () => {
          const listingType = (item.listingDetails?.listingType || 'Single Plant').toLowerCase();
          const potSize = item.selectedVariation?.potSize || item.potSize || '2"';
          const plantHeight = item.listingDetails?.approximateHeight || '0';
          
          // Convert height description to numeric value
          const getHeightValue = (heightDesc) => {
            if (typeof heightDesc === 'number') return heightDesc;
            if (typeof heightDesc === 'string') {
              if (heightDesc.includes('12 inches & above') || heightDesc.includes('above')) return 15;
              if (heightDesc.includes('Below 12') || heightDesc.includes('below')) return 8;
              const match = heightDesc.match(/(\d+)/);
              return match ? parseFloat(match[1]) : 0;
            }
            return 0;
          };
          
          switch (listingType) {
            case 'single':
            case 'single plant':
              // Based on plant height
              const height = getHeightValue(plantHeight);
              const singleCost = height > 12 ? 70 : 50;
              const singleAddOn = height > 12 ? 7 : 5;
              return {
                cost: singleCost,
                addOnCost: singleAddOn,
                baseCargo: 150,
                description: height > 12 ? 'UPS 2nd Day $70, add-on plant $7' : 'UPS 2nd Day $50, add-on plant $5',
                displayText: 'UPS 2nd Day ',
                mainPrice: height > 12 ? '$70' : '$50',
                addOnText: ', add-on plant ',
                addOnPrice: height > 12 ? '$7' : '$5',
                rule: `Based on plant height: ${height > 12 ? '>12"' : '≤12"'} = $${singleCost}`,
                baseCost: singleCost
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
                displayText: 'UPS 2nd Day ',
                mainPrice: potSizeNum > 4 ? '$70' : '$50',
                addOnText: ', add-on plant ',
                addOnPrice: potSizeNum > 4 ? '$7' : '$5',
                rule: `Based on pot size: ${potSizeNum > 4 ? '>4"' : '≤4"'} = $${growersCost}`,
                baseCost: growersCost
              };
              
            case 'wholesale':
              // Based on pot size
              const wholePotSizeNum = parseFloat(potSize.replace('"', '')) || 2;
              const wholesaleCost = wholePotSizeNum > 4 ? 200 : 150;
              const wholesaleAddOn = wholePotSizeNum > 4 ? 25 : 20;
              return {
                cost: wholesaleCost,
                addOnCost: wholesaleAddOn,
                baseCargo: 150,
                description: wholePotSizeNum > 4 ? 'Wholesale Shipping $200, add-on plant $25' : 'Wholesale Shipping $150, add-on plant $20',
                displayText: 'Wholesale Shipping ',
                mainPrice: wholePotSizeNum > 4 ? '$200' : '$150',
                addOnText: ', add-on plant ',
                addOnPrice: wholePotSizeNum > 4 ? '$25' : '$20',
                rule: `Based on pot size: ${wholePotSizeNum > 4 ? '>4"' : '≤4"'} = $${wholesaleCost}`,
                baseCost: wholesaleCost
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
                rule: 'Default shipping rate',
                baseCost: 50
              };
          }
        };

        const shippingCost = getShippingCost();

        console.log('🛒 Cart Item Processing:', {
          plantCode: item.plantCode,
          country: item.listingDetails?.country,
          plantFlightDate: item.listingDetails?.plantFlightDate,
          listingType: item.listingDetails?.listingType,
          potSize: item.selectedVariation?.potSize || item.potSize,
          height: item.listingDetails?.approximateHeight,
          flagIcon: getCountryFlag(item.listingDetails?.country || 'TH'),
          shippingCost: shippingCost,
          shippingRule: shippingCost.rule
        });

        return {
          id: item.cartId || item.id,
          cartItemId: item.cartId,
          plantCode: item.plantCode,
          image: itemImage,
          name: isListingUnavailable 
            ? `${item.plantCode} (No longer available)` 
            : (`${item.listingDetails?.genus || ''} ${item.listingDetails?.species || ''}`.trim() 
               || item.listingDetails?.title || 'Unknown Plant'),
          subtitle: `${item.listingDetails?.variegation || 'Standard'} • ${item.potSize || '2"'}`,
          price: currentPrice,
          originalPrice: originalPrice,
          quantity: item.quantity || 1,
          flightInfo: `Plant Flight ${plantData.plantFlightDate}`,
          shippingInfo: isListingUnavailable ? 'Item no longer available' : `${shippingCost.displayText}${shippingCost.mainPrice}${shippingCost.addOnText}${shippingCost.addOnPrice}`,
          flagIcon: getCountryFlag(item.listingDetails?.country || 'TH'),
          availableQuantity: item.listingDetails?.availableQty || 999, // Fixed: use availableQty instead of availableQuantity
          isUnavailable: isListingUnavailable,
          listingType: item.listingDetails?.listingType || 'Single Plant' // Add the listing type
        };
      }) || [];

      console.log('🛒 Cart items after transformation:', 
        transformedItems.map(item => ({
          name: item.name,
          listingType: item.listingType,
          quantity: item.quantity
        }))
      );

      setCartItems(transformedItems);
      // Remove any unavailable items from current selection so they don't
      // contribute to totals or checkout even if previously selected.
      setSelectedItems(prev => {
        const availableIds = new Set(transformedItems.filter(it => !it.isUnavailable).map(it => it.id));
        return new Set([...prev].filter(id => availableIds.has(id)));
      });
      console.log('Cart items loaded:', transformedItems.length);
      console.log('First cart item:', transformedItems[0]); // Debug log to see the actual data

    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', error.message);
      // Keep empty array on error
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartItems();
    setRefreshing(false);
  };

  const updateItemQuantity = async (itemId, newQuantity) => {
    try {
      console.log('🔄 UPDATE QUANTITY CALLED');
      console.log('🔄 Item ID:', itemId);
      console.log('🔄 New quantity:', newQuantity);

      if (newQuantity < 1) {
        // If quantity is 0 or less, remove the item
        await removeItem(itemId);
        return;
      }

      const item = cartItems.find(cartItem => cartItem.id === itemId);
      if (!item?.cartItemId) {
        Alert.alert('Error', 'Unable to update item quantity');
        return;
      }

      console.log('🔄 Found item:', item);
      console.log('🔄 Item available quantity:', item.availableQuantity);
      console.log('🔄 Item plant code:', item.plantCode);

      // Check if quantity exceeds available stock
      const maxQuantity = item.availableQuantity || 999; // Default to 999 if undefined
      console.log('🔄 Max quantity (with fallback):', maxQuantity);
      
      if (newQuantity > maxQuantity) {
        console.log('🔄 STOCK LIMIT EXCEEDED!');
        Alert.alert('Stock Limit', `Only ${maxQuantity} items available in stock`);
        return;
      }

      // Optimistically update the UI
      setCartItems(prev => prev.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      ));

      // Update via API
      const response = await updateCartItemApi({ 
        cartItemId: item.cartItemId, 
        quantity: newQuantity 
      });
      
      if (!response.success) {
        // Revert on error
        setCartItems(prev => prev.map(cartItem => 
          cartItem.id === itemId 
            ? { ...cartItem, quantity: item.quantity }
            : cartItem
        ));
        throw new Error(response.error || 'Failed to update quantity');
      }

      console.log('Quantity updated successfully');
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', error.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const item = cartItems.find(cartItem => cartItem.id === itemId);
      if (!item?.cartItemId) {
        Alert.alert('Error', 'Unable to remove item');
        return;
      }

      // Optimistically remove item from local state immediately
      setCartItems(prev => prev.filter(cartItem => cartItem.id !== itemId));
      
      // Remove from selectedItems if it was selected
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      // Make API call in the background without waiting for it
      removeFromCartApi({ cartItemId: item.cartItemId })
        .then(response => {
          if (!response.success) {
            console.error('Error from API when removing item:', response.error);
            // We could restore the item here, but it's better UX to just log the error
          }
        })
        .catch(error => {
          console.error('Exception when removing item from cart:', error);
        });
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', error.message);
    }
  };

  const toggleItemSelection = itemId => {
    // Prevent selecting unavailable items
    const item = cartItems.find(c => c.id === itemId);
    if (item?.isUnavailable) {
      // Ignore selection toggles for unavailable items
      return;
    }

    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    // Only toggle selection for available items. Unavailable items should not be
    // selected as part of "Select All" and must not contribute to totals.
    const availableItems = cartItems.filter(item => !item.isUnavailable);
    if (selectedItems.size === availableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(availableItems.map(item => item.id)));
    }
  };

  const calculateTotalAmount = () => {
    // Sum only selected items that are available. Unavailable items must not
    // contribute to the total plant cost.
    return cartItems
      .filter(item => selectedItems.has(item.id) && !item.isUnavailable)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    // Calculate discount based on original prices vs current prices
    let totalDiscount = 0;
    
    // Log information for debugging
    console.log('Calculating discounts for selected items:', 
      cartItems.filter(item => selectedItems.has(item.id)).length);
    
    // Process each selected item
    // Only consider selected and available items when computing discounts.
    cartItems
      .filter(item => selectedItems.has(item.id) && !item.isUnavailable)
      .forEach(item => {
        // Log the item for debugging
        console.log('Processing item for discount:', item.name, 'Original:', item.originalPrice, 'Current:', item.price);
        
        // If the item has an originalPrice, calculate the difference
  if (item.originalPrice && item.originalPrice > item.price) {
          const itemDiscount = (item.originalPrice - item.price) * item.quantity;
          console.log('Item discount from original price:', itemDiscount);
          totalDiscount += itemDiscount;
        }
      });
    
    console.log('Total calculated discount:', totalDiscount);
    return totalDiscount;
  };

  const handleAddToCartFromRecommendations = async (plant) => {
    try {
      if (!plant.plantCode) {
        Alert.alert('Error', 'Plant code is missing');
        return;
      }

      // Use the first available pot size or default to '2"'
      const potSize = plant.potSize || '2"';
      
      console.log('Adding to cart from recommendations:', {
        plantCode: plant.plantCode,
        potSize: potSize,
        quantity: 1
      });

      const response = await retryAsync(() => addToCartApi({
        plantCode: plant.plantCode,
        potSize: potSize,
        quantity: 1
      }), 3, 1000);

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to add to cart');
      }

      Alert.alert('Success', 'Plant added to cart successfully!');
      
      // Reload cart items to show the new addition
      loadCartItems();
      
    } catch (error) {
      console.error('Error adding to cart from recommendations:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleCheckout = () => {
    // Only include selected AND available items in checkout
    const selectedCartItems = cartItems.filter(item => 
      selectedItems.has(item.id) && !item.isUnavailable
    );

    if (selectedCartItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select available items to checkout');
      return;
    }

    // If some previously-selected items were unavailable, inform the user
    const hadUnavailableSelected = Array.from(selectedItems).some(id => {
      const it = cartItems.find(ci => ci.id === id);
      return it && it.isUnavailable;
    });
    if (hadUnavailableSelected) {
      Alert.alert('Notice', 'Unavailable items were removed from your selection and will not be checked out.');
    }

    // Navigate to checkout screen with selected available items
    console.log('📦 Navigating to checkout with items:', 
      selectedCartItems.map(item => ({
        name: item.name,
        listingType: item.listingType,
        quantity: item.quantity
      }))
    );
    
    navigation.navigate('CheckoutScreen', {
      cartItems: selectedCartItems,
      useCart: true, // Use real cart data
      totalAmount: calculateTotalAmount(),
      discountAmount: calculateDiscountAmount(),
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CartHeader insets={insets} />
        <ScrollView
          style={[styles.container]}
          contentContainerStyle={{paddingTop: HEADER_HEIGHT + insets.top, paddingBottom: totalBottomPadding}}
          showsVerticalScrollIndicator={false}>
          
          {/* Skeleton loading for cart items */}
          {Array.from({length: 3}).map((_, index) => (
            <View key={index} style={styles.cartCard}>
              <View style={styles.cartTopCard}>
                <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                  <View style={[styles.cartImageContainer, styles.skeletonImage]} />
                  <View style={{flex: 1, marginLeft: 12}}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}>
                      <View style={[styles.skeletonText, {width: '60%', height: 16}]} />
                      <View style={[styles.skeletonText, {width: 24, height: 24}]} />
                    </View>
                    <View style={[styles.skeletonText, {width: '80%', height: 14, marginBottom: 8}]} />
                    <View style={[styles.skeletonText, {width: '40%', height: 20, marginBottom: 12}]} />
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <View style={[styles.skeletonText, {width: '30%', height: 18}]} />
                      <View style={[styles.skeletonText, {width: 80, height: 32}]} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.cartDetailsSection}>
                <View style={[styles.skeletonText, {width: '70%', height: 14, marginBottom: 4}]} />
                <View style={[styles.skeletonText, {width: '60%', height: 14}]} />
              </View>
            </View>
          ))}
          
          {/* Skeleton for recommendations section */}
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <View style={[styles.skeletonText, {width: '50%', height: 20, marginBottom: 16}]} />
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 8 }}>
              {Array.from({length: 2}).map((_, idx) => (
                <View key={idx} style={{ flex: 1 }}>
                  <View style={[styles.skeletonText, {width: '100%', height: 160, borderRadius: 12}]} />
                  <View style={[styles.skeletonText, {width: '80%', height: 16, marginTop: 8}]} />
                  <View style={[styles.skeletonText, {width: '60%', height: 14, marginTop: 4}]} />
                  <View style={[styles.skeletonText, {width: '40%', height: 16, marginTop: 8}]} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <CartBar
          isSelectAllChecked={false}
          onSelectAllToggle={() => {}}
          selectedItemsCount={0}
          totalAmount={0}
          discountAmount={0}
          onCheckoutPress={() => {}}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CartHeader insets={insets} />
      <SafeAreaView style={{flex: 1}}>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{paddingTop: HEADER_HEIGHT + insets.top, paddingBottom: totalBottomPadding}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }>
        
        {cartItems.length === 0 ? (
          <View style={{ flex: 1 }}>
            {/* Empty cart image only */}
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
              <Image 
                source={require('../../../assets/images/no-item-cart.png')} 
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : (
          cartItems.map(item => (
            <CartComponent
              key={item.id}
              image={item.image}
              name={item.name}
              subtitle={item.subtitle}
              price={item.price.toFixed(2)}
              originalPrice={item.originalPrice?.toFixed(2)}
              quantity={item.quantity}
              flightInfo={item.flightInfo}
              shippingInfo={item.shippingInfo}
              flagIcon={item.flagIcon}
              checked={selectedItems.has(item.id)}
              onRemove={() => removeItem(item.id)}
              onPress={() => toggleItemSelection(item.id)}
              onQuantityChange={(newQuantity) => updateItemQuantity(item.id, newQuantity)}
              availableQuantity={item.availableQuantity}
              isUnavailable={item.isUnavailable}
              listingType={item.listingType}
            />
          ))
        )}

        {/* You may also like section - Always visible */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          
          <BrowseMorePlants 
            title="More from our Jungle" 
            initialLimit={8}
            loadMoreLimit={8}
            showLoadMore={false}
            containerStyle={{paddingTop: 0}}
            onAddToCart={handleAddToCartFromRecommendations}
          />
        </View>
      </ScrollView>
      
      {cartItems.length > 0 && (
        <>
          {/* Log discount amount for debugging */}
          {console.log('Discount amount passed to CartBar:', calculateDiscountAmount())}
          <CartBar
            // Determine available items count for consistent "Select All" behavior
            isSelectAllChecked={(() => {
              const availableItems = cartItems.filter(item => !item.isUnavailable);
              return selectedItems.size === availableItems.length && availableItems.length > 0;
            })()}
            onSelectAllToggle={toggleSelectAll}
            // Only show selected count for available items
            selectedItemsCount={(() => cartItems.filter(item => selectedItems.has(item.id) && !item.isUnavailable).length)()}
            totalAmount={calculateTotalAmount()}
            discountAmount={calculateDiscountAmount()}
            onCheckoutPress={handleCheckout}
          />
        </>
      )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
    width: '100%',
    height: 58,
  },
  backButton: {
    width: 24,
    height: 24,
    flex: 0,
  },
  searchContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 209,
    height: 40,
    flex: 1,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 40,
    flex: 0,
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    height: 40,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
  },
  searchInput: {
    width: 145,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  backButton: {
    width: 24,
    height: 24,
    flex: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 40,
    flex: 0,
  },
  avatar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 32,
    minWidth: 32,
    height: 32,
    minHeight: 32,
    borderRadius: 1000,
    position: 'relative',
    flex: 0,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
    zIndex: 1,
  },
  badgeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    left: 1,
    top: 1,
    backgroundColor: '#E7522F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
  },
  cartCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    // paddingTop: 12,
    // paddingBottom: 12,
    // gap: 12,
    backgroundColor: '#F5F6F6',
    // marginBottom: 12,
    // marginHorizontal: 12,
  },
  cartTopCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 12,
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  unavailableCard: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
  cartImageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 96,
    position: 'relative',
  },
  cartImage: {
    width: 96,
    height: 128,
    borderWidth: 3,
    borderColor: '#539461',
    borderRadius: 8,
  },
  cartCheckOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: checkboxSize,
    height: checkboxSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: checkboxSize,
    height: checkboxSize,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    width: checkboxSize,
    height: checkboxSize,
    borderWidth: 2,
    borderColor: '#539461',
    borderRadius: 4,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: checkboxSize * 0.7, // Responsive font size based on checkbox size
    fontWeight: 'bold',
    lineHeight: checkboxSize,
  },
  discountBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 96,
    height: 24,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  discountText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  cartName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  cartSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    marginTop: 4,
  },
  listingTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    height: 24,
    backgroundColor: '#202325',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  unavailableText: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  unavailableBadge: {
    backgroundColor: '#999999',
  },
  disabledStepper: {
    opacity: 0.5,
    borderColor: '#CDD3D4',
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
    gap: 12,
    alignSelf: 'stretch',
    height: 50,
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
  },
  cartPrice: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#539461',
  },
  originalPriceText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textDecorationLine: 'line-through',
    color: '#7F8D91',
  },
  totalItemPrice: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#539461',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: 96,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 8,
  },
  stepperButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 30,
    flex: 1,
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#393D40',
  },
  cartDetailsSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  cartFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
    gap: 6,
    alignSelf: 'stretch',
    height: 24,
  },
  cartFooterText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
  },
  costContainer: {
    alignItems: 'flex-end',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCostText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202325',
    marginRight: 4,
  },
  caret: {
    fontSize: 12,
    color: '#202325',
  },
  savingsText: {
    fontSize: 14,
    color: '#E7522F',
    fontWeight: '500',
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skeletonText: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonImage: {
    backgroundColor: '#f0f0f0',
  },
  // Search Results Styles
  searchResultsContainer: {
    position: 'absolute',
    top: 52, // Position below the header
    left: 13, // Match header paddingHorizontal
    right: 53, // Account for header icons width
    backgroundColor: '#FFFFFF',
    borderWidth: 2, // Thicker border for better definition
    borderColor: '#d1d5db', // Slightly darker border
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 9999, // Ensure it appears on top of everything
    elevation: 15, // Higher elevation for Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25, // Stronger shadow for better visibility
    shadowRadius: 8,
    // Ensure completely opaque background
    opacity: 1,
    // Additional properties to ensure visibility
    borderStyle: 'solid',
    overflow: 'hidden', // Ensure content doesn't bleed
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
  searchResultsList: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#FFFFFF', // Ensure solid background for each item
    // Additional properties for visibility
    opacity: 1,
    borderStyle: 'solid',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Inter',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
});
export default ScreenCart;
