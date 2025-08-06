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
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
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
import {getBuyerListingsApi} from '../../../components/Api/listingBrowseApi';
import {addToCartApi} from '../../../components/Api/cartApi';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import NewArrivalsIcon from '../../../assets/buyer-icons/megaphone.svg';
import PriceDropIcon from '../../../assets/buyer-icons/price-drop-icons.svg';
import PromoBadge from '../../../components/PromoBadge/PromoBadge';
import CloseIcon from '../../../assets/buyer-icons/close.svg';
import {selectedCard} from '../../../assets/buyer-icons/png';
import DownArrowIcon from '../../../assets/buyer-icons/downicon.svg';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PlantItemCard from '../../../components/PlantItemCard/PlantItemCard';

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

const CartHeader = () => {
  const promoBadges = [
    {label: 'Price Drop', icon: PriceDropIcon},
    {label: 'New Arrivals', icon: NewArrivalsIcon},
    {label: 'Latest Nursery Drop', icon: LeavesIcon},
    {label: 'Below $20', icon: PriceTagIcon},
    {label: 'Unicorn', icon: UnicornIcon},
    {label: 'Top 5 Buyer Wish List', icon: Top5Icon},
  ];

  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();
  
  return (
    <View style={styles.header}>
      <View style={styles.controls}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Shop')}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ileafU"
                placeholderTextColor="#647276"
                value={searchText}
                onChangeText={setSearchText}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>

        {/* Wishlist Action */}
          <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScreenWishlist')}>
          <Wishicon width={24} height={24} />
          </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity 
          style={styles.profileContainer}
          onPress={() => navigation.navigate('ScreenProfile')}>
          <View style={styles.avatar}>
            <AvatarIcon width={32} height={32} />
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0, paddingVertical: 1}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 6,
          alignItems: 'flex-start',
          paddingHorizontal: 9,
        }}>
        {promoBadges.map(badge => (
          <PromoBadge
            key={badge.label}
            icon={badge.icon}
            label={badge.label}
            style={{marginRight: 5}}
          />
        ))}
      </ScrollView>
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
}) => {
  // Debug image prop
  console.log('🖼️ CartComponent image prop for', name, ':', image);
  
  return (
  <View style={styles.cartCard}>
    <TouchableOpacity style={styles.cartTopCard} onPress={onPress}>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View
          style={[
            styles.cartImageContainer,
            {borderColor: checked ? '#539461' : 'transparent'},
          ]}>
          <Image source={image} style={styles.cartImage} />
          {checked && (
            <View style={styles.cartCheckOverlay}>
              <Image source={selectedCard} style={{width: 24, height: 24}} />
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
              <CloseIcon style={{marginTop: 5}} width={24} height={24} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cartSubtitle}>{subtitle}</Text>
          
          {/* Listing Type Badge */}
          <View style={[styles.listingTypeBadge, isUnavailable && styles.unavailableBadge]}>
            <Text style={styles.listingTypeText}>{isUnavailable ? 'Unavailable' : 'Premium'}</Text>
          </View>
          
          {/* Price and Quantity Row */}
          <View style={styles.priceQuantityRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.totalItemPrice}>${(parseFloat(price) * quantity).toFixed(2)}</Text>
            </View>
            
            {/* Quantity Stepper - Only show when quantity > 1 */}
            {quantity > 1 && (
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
            )}
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
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Load cart items on component mount
  useEffect(() => {
    loadCartItems();
    loadRecommendations(); // Load recommendations for empty cart
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
          price: parseFloat(item.listingDetails?.discountPrice || item.listingDetails?.price || item.price || 0),
          originalPrice: item.listingDetails?.discountPrice ? parseFloat(item.listingDetails.price) : null,
          quantity: item.quantity || 1,
          flightInfo: `Plant Flight ${item.listingDetails?.flightDate || 'May-30'}`,
          shippingInfo: isListingUnavailable ? 'Item no longer available' : 'UPS 2nd Day $50, add-on plant $5',
          flagIcon: '🇹🇭',
          availableQuantity: item.listingDetails?.availableQty || 999, // Fixed: use availableQty instead of availableQuantity
          isUnavailable: isListingUnavailable
        };
      }) || [];

      setCartItems(transformedItems);
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

      const response = await removeFromCartApi({ cartItemId: item.cartItemId });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove item');
      }

      // Remove item from local state
      setCartItems(prev => prev.filter(cartItem => cartItem.id !== itemId));
      
      // Remove from selectedItems if it was selected
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      Alert.alert('Success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', error.message);
    }
  };

  const toggleItemSelection = itemId => {
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
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const calculateTotalAmount = () => {
    return cartItems
      .filter(item => selectedItems.has(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    // Calculate discount based on original prices vs current prices
    return cartItems
      .filter(item => selectedItems.has(item.id) && item.originalPrice)
      .reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);
  };

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      
      // Check internet connection
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        console.log('No internet connection for recommendations');
        return;
      }

      // Get popular plants sorted by love count for empty cart recommendations
      const response = await retryAsync(() => getBuyerListingsApi({
        limit: 6,
        sortBy: 'loveCount',
        sortOrder: 'desc'
      }), 3, 1000);
      
      if (!response?.success) {
        console.log('Failed to load recommendations:', response?.error);
        return;
      }

      console.log('Recommendations loaded successfully:', response.data?.listings?.length || 0);
      setRecommendations(response.data?.listings || []);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
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
    const selectedCartItems = cartItems.filter(item => 
      selectedItems.has(item.id)
    );
    
    if (selectedCartItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select items to checkout');
      return;
    }
    
    // Navigate to checkout screen with selected items
    navigation.navigate('CheckoutScreen', {
      cartItems: selectedCartItems,
      useCart: true, // Use real cart data
      totalAmount: calculateTotalAmount(),
      discountAmount: calculateDiscountAmount(),
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#666' }}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CartHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{paddingBottom: 170}}
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
            />
          ))
        )}

        {/* You may also like section - Always visible */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#202325',
            marginBottom: 16,
          }}>
            Browse More Plants
          </Text>
          
          {loadingRecommendations ? (
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 8 }}>
              {Array.from({length: 2}).map((_, idx) => (
                <View key={idx} style={{ flex: 1 }}>
                  <View style={{
                    width: '100%',
                    height: 160,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 12,
                  }} />
                  <View style={{
                    width: '80%',
                    height: 16,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                    marginTop: 8,
                  }} />
                  <View style={{
                    width: '60%',
                    height: 12,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                    marginTop: 4,
                  }} />
                </View>
              ))}
            </View>
          ) : recommendations.length > 0 ? (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              {recommendations.slice(0, 6).map((plant, index) => (
                <View 
                  key={plant.id || plant.plantCode || index} 
                  style={{ 
                    width: '48%',
                    marginBottom: 16 
                  }}
                >
                  <PlantItemCard 
                    data={plant}
                    onPress={() => {
                      navigation.navigate('ScreenPlantDetail', { 
                        plantCode: plant.plantCode,
                        plantData: plant 
                      });
                    }}
                    onAddToCart={() => handleAddToCartFromRecommendations(plant)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#999', fontSize: 14 }}>
                No recommendations available at the moment
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {cartItems.length > 0 && (
        <CartBar
          isSelectAllChecked={selectedItems.size === cartItems.length && cartItems.length > 0}
          onSelectAllToggle={toggleSelectAll}
          selectedItemsCount={selectedItems.size}
          totalAmount={calculateTotalAmount()}
          discountAmount={calculateDiscountAmount()}
          onCheckoutPress={handleCheckout}
        />
      )}
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
  },
  header: {
    width: '100%',
    height: 100,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
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
    padding: 12,
    gap: 12,
    backgroundColor: '#F5F6F6',
    marginBottom: 12,
    marginHorizontal: 12,
  },
  cartTopCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  cartImageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 96,
    height: 160,
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
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
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
    paddingHorizontal: 6,
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
});
export default ScreenCart;
