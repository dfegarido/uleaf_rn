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
import {useNavigation} from '@react-navigation/native';
import CartBar from '../../../components/CartBar';
import {getCartItemsApi, removeFromCartApi} from '../../../components/Api/cartApi';
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
  flightInfo,
  shippingInfo,
  flagIcon,
  checked,
  onRemove,
  onPress,
}) => (
  <TouchableOpacity style={styles.cartCard} onPress={onPress}>
    <View style={styles.cartTopCard}>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View
          style={[
            styles.cartImageContainer,
            {borderColor: checked ? '#4CAF50' : 'transparent'},
          ]}>
          <Image source={image} style={styles.cartImage} />
          {checked && (
            <View style={styles.cartCheckOverlay}>
              <Image source={selectedCard} style={{width: 24, height: 24}} />
            </View>
          )}
        </View>
        <View style={{flex: 1, marginLeft: 10}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <Text style={styles.cartName}>{name}</Text>
            <TouchableOpacity onPress={onRemove}>
              <CloseIcon style={{marginTop: 5}} width={15} height={15} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cartSubtitle}>{subtitle}</Text>
          <Text style={styles.cartPrice}>${price}</Text>
        </View>
      </View>
    </View>
    <View style={styles.cartFooterRow}>
      <Text style={styles.cartFooterText}>✈️ {flightInfo}</Text>
      {flagIcon}
    </View>
    <View style={styles.cartFooterRow}>
      <Text style={styles.cartFooterText}>🚚 {shippingInfo}</Text>
    </View>
  </TouchableOpacity>
);

const cartItems = Array.from({length: 10}).map((_, i) => ({
  id: i,
  image: require('../../../assets/images/plant1.png'),
  name: 'Spinacia Oleracea',
  subtitle: 'Inner Variegated • 2"',
  price: 65.27,
  flightInfo: 'Plant Flight May-30',
  shippingInfo: 'UPS 2nd Day $50, add-on plant $5',
  flagIcon: <Text style={{fontSize: 18}}>🇹🇭</Text>,
}));

const ScreenCart = () => {
  const navigation = useNavigation();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load cart items on component mount
  useEffect(() => {
    loadCartItems();
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

      // Transform API data to match component structure
      const transformedItems = response.data.items?.map(item => ({
        id: item.cartId || item.id,
        cartItemId: item.cartId,
        plantCode: item.plantCode,
        image: item.listingDetails?.imagePrimary 
          ? { uri: item.listingDetails.imagePrimary } 
          : require('../../../assets/images/plant1.png'),
        name: `${item.listingDetails?.genus || ''} ${item.listingDetails?.species || ''}`.trim() 
          || item.listingDetails?.title || 'Unknown Plant',
        subtitle: `${item.listingDetails?.variegation || 'Standard'} • ${item.potSize || '2"'}`,
        price: parseFloat(item.listingDetails?.discountPrice || item.listingDetails?.price || item.price || 0),
        originalPrice: item.listingDetails?.discountPrice ? parseFloat(item.listingDetails.price) : null,
        quantity: item.quantity || 1,
        flightInfo: `Plant Flight ${item.listingDetails?.flightDate || 'May-30'}`,
        shippingInfo: 'UPS 2nd Day $50, add-on plant $5',
        flagIcon: <Text style={{fontSize: 18}}>🇹🇭</Text>,
        availableQuantity: item.listingDetails?.availableQuantity || 999
      })) || [];

      setCartItems(transformedItems);
      console.log('Cart items loaded:', transformedItems.length);

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
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
            <Text style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>Your cart is empty</Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
              onPress={() => navigation.navigate('Shop')}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cartItems.map(item => (
            <CartComponent
              key={item.id}
              image={item.image}
              name={item.name}
              subtitle={item.subtitle}
              price={item.price.toFixed(2)}
              flightInfo={item.flightInfo}
              shippingInfo={item.shippingInfo}
              flagIcon={item.flagIcon}
              checked={selectedItems.has(item.id)}
              onRemove={() => removeItem(item.id)}
              onPress={() => toggleItemSelection(item.id)}
            />
          ))
        )}
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
    backgroundColor: '#F5F6F6',
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cartTopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  cartImageContainer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    width: 96,
    height: 128,
    position: 'relative',
  },
  cartImage: {
    width: 96,
    height: 128,
    borderRadius: 12,
  },
  cartCheckOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,

    borderRadius: 10,
    padding: 2,
    zIndex: 2,
  },
  cartName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
  },
  cartSubtitle: {
    color: '#647276',
    fontSize: 14,
    marginVertical: 2,
  },
  cartPrice: {
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 2,
  },
  cartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'space-between',
  },
  cartFooterText: {
    color: '#647276',
    fontWeight: 'bold',
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
