import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import LocationIcon from '../../../assets/buyer-icons/address.svg';
import ArrowRightIcon from '../../../assets/icons/greydark/caret-right-regular.svg';
import CaretDownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import TagIcon from '../../../assets/icons/greylight/tag.svg';
import TruckIcon from '../../../assets/buyer-icons/truck-gray.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import LeafIcon from '../../../assets/buyer-icons/leaf-green.svg';
import PlantIcon from '../../../assets/buyer-icons/plant-violet.svg';
import TruckBlueIcon from '../../../assets/buyer-icons/truck-blue.svg';
import PaymentManager from '../../../utils/PaymentManager';
import {globalStyles} from '../../../assets/styles/styles';

// Plant Item Component (similar to CartComponent from cart screen)
const PlantItemComponent = ({
  image,
  name,
  variation,
  size,
  price,
  quantity,
  title,
  country,
  shippingMethod,
  listingType,
  discount,
  originalPrice,
  hasAirCargo,
}) => (
  <View style={styles.plant}>
    {/* Plant Image */}
    <View style={styles.plantImage}>
      <Image source={image} style={styles.plantImageContainer} />
    </View>
    
    {/* Plant Details */}
    <View style={styles.plantDetails}>
      {/* Name */}
      <View style={styles.plantName}>
        <Text style={styles.plantNameText}>{name}</Text>
        
        {/* Variegation + Size */}
        <View style={styles.variationSize}>
          <Text style={styles.variationText}>{variation}</Text>
          
          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
          </View>
          
          <Text style={styles.sizeNumber}>{size}</Text>
        </View>
      </View>
      
      {/* Type + Discount (if available) */}
      {(listingType || discount) && (
        <View style={styles.typeDiscount}>
          {/* Listing Type */}
          {listingType && (
            <View style={styles.listingType}>
              <Text style={styles.listingTypeLabel}>{listingType}</Text>
            </View>
          )}
          
          {/* Discount Badge */}
          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}</Text>
              <Text style={styles.discountLabel}>OFF</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Price + Quantity */}
      <View style={styles.priceQuantity}>
        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={[styles.priceNumber, discount && styles.discountedPrice]}>
            ${price.toFixed(2)}
          </Text>
          {/* Original Price (if discounted) */}
          {originalPrice && discount && (
            <Text style={styles.originalPriceText}>${originalPrice.toFixed(2)}</Text>
          )}
        </View>
        
        {/* Quantity */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityNumber}>{quantity}</Text>
          <Text style={styles.quantityMultiple}>x</Text>
        </View>
      </View>
    </View>
  </View>
);

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get parameters from navigation (cart items, products, etc.)
  const {
    cartItems = [],
    productData = [],
    useCart = true,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US'
    },
    contactPhone: '+1-555-0123',
    specialInstructions: 'Leave at front door'
  });
  
  const [cargoDate, setCargoDate] = useState('2025-02-15');
  const [selectedFlightDate, setSelectedFlightDate] = useState('May 30');
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');
  const [leafPoints, setLeafPoints] = useState(0);
  const [plantCredits, setPlantCredits] = useState(0);
  const [shippingCredits, setShippingCredits] = useState(0);
  
  // Mock plant items data (similar to cart screen approach)
  const plantItems = useCart && cartItems.length > 0 
    ? cartItems 
    : productData.length > 0 
    ? productData 
    : [
        {
          id: 1,
          image: require('../../../assets/images/plant1.png'),
          name: 'Monstera Deliciosa',
          variation: 'Variegated',
          size: '6',
          price: 89.99,
          quantity: 2,
          title: 'Rare Tropical Plants from Thailand',
          country: 'TH',
          shippingMethod: 'Plant / UPS Ground Shipping',
        },
        {
          id: 2,
          image: require('../../../assets/images/plant1.png'),
          name: 'Philodendron Spiritus',
          variation: 'Variegated',
          size: '4" pot',
          price: 125.50,
          originalPrice: 150.00,
          quantity: 1,
          title: 'Rare Tropical Plants from Thailand',
          country: 'TH',
          shippingMethod: 'Plant / UPS Ground Shipping',
          listingType: 'Wholesale Plant',
          discount: '15%',
          hasAirCargo: false,
        },
        {
          id: 3,
          image: require('../../../assets/images/plant1.png'),
          name: 'Anthurium Warocqueanum',
          variation: 'Variegated',
          size: '6" pot',
          price: 299.99,
          originalPrice: 350.00,
          quantity: 3,
          title: 'Rare Tropical Plants from Thailand',
          country: 'TH',
          shippingMethod: 'Plant / UPS Ground Shipping',
          listingType: 'Auction',
          discount: '14%',
          hasAirCargo: true,
        }
      ];
  
  // Mock order summary
  const [orderSummary, setOrderSummary] = useState({
    totalItems: plantItems.length,
    subtotal: plantItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
    shipping: 15.00,
    discount: 5.00,
    finalTotal: plantItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) + 15.00 - 5.00,
  });

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Prepare checkout data
      const checkoutData = {
        cargoDate,
        deliveryDetails,
        paymentMethod,
        leafPoints,
        plantCredits,
        shippingCredits,
      };

      // Add product data if not using cart
      if (!useCart && productData.length > 0) {
        checkoutData.productData = productData;
      }

      // Payment options
      const paymentOptions = {
        returnUrl: 'ileafu://payment-success',
        cancelUrl: 'ileafu://payment-cancel',
        preferVenmo: true,
      };

      // Show confirmation dialog
      PaymentManager.showPaymentConfirmation(
        orderSummary,
        async () => {
          // User confirmed, proceed with payment
          const result = useCart
            ? await PaymentManager.checkoutWithCart(checkoutData, paymentOptions)
            : await PaymentManager.checkoutWithProducts(checkoutData, paymentOptions);

          if (result.success) {
            const {approvalUrl, transactionNumber, orderSummary: resultSummary} = result.data;
            
            Alert.alert(
              'Order Created',
              `Order ${transactionNumber} has been created successfully. You will now be redirected to complete payment.`,
              [
                {
                  text: 'Pay Now',
                  onPress: () => PaymentManager.openPaymentUrl(approvalUrl),
                },
              ],
            );
            
            // Navigate to payment success screen or handle accordingly
            // You can also store the paypalOrderId for later capture
            
          } else {
            PaymentManager.showPaymentError(result.error);
          }
        },
        () => {
          // User cancelled
          console.log('Payment cancelled by user');
        }
      );

    } catch (error) {
      console.error('Checkout error:', error);
      PaymentManager.showPaymentError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryDetails = () => {
    // Navigate to delivery details screen
    Alert.alert('Info', 'Navigate to delivery details screen');
  };

  const handleUpdatePaymentMethod = () => {
    // Show payment method selector
    Alert.alert(
      'Select Payment Method',
      'Choose your preferred payment method',
      [
        {text: 'PayPal', onPress: () => setPaymentMethod('PAYPAL')},
        {text: 'Venmo', onPress: () => setPaymentMethod('VENMO')},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.controls}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          
          {/* Title */}
          <Text style={styles.headerTitle}>Checkout</Text>
          
          {/* Navbar Right (hidden) */}
          <View style={styles.navbarRight} />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>
        
        {/* Shipping Address Section */}
        <View style={styles.shipping}>
          {/* Title */}
          <View style={styles.shippingTitle}>
            <Text style={styles.shippingTitleText}>Shipping Address</Text>
          </View>
          
          {/* Address List */}
          <View style={styles.addressList}>
            <TouchableOpacity style={styles.addressContent} onPress={handleUpdateDeliveryDetails}>
              {/* Icon Circle */}
              <View style={styles.iconCircle}>
                <View style={styles.iconContainer}>
                  <LocationIcon width={24} height={24} />
                </View>
              </View>
              
              {/* Details */}
              <View style={styles.addressDetails}>
                <View style={styles.addressAction}>
                  <Text style={styles.addressText}>
                    {deliveryDetails.address.street}{'\n'}
                    {deliveryDetails.address.city}, {deliveryDetails.address.state} {deliveryDetails.address.zipCode}
                  </Text>
                  
                  {/* Action Arrow */}
                  <View style={styles.actionContainer}>
                    <View style={styles.arrow}>
                      <ArrowRightIcon width={24} height={24} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant Flight Section */}
        <View style={styles.plantFlight}>
          {/* Title */}
          <View style={styles.flightTitle}>
            <Text style={styles.flightTitleText}>Plant Flight</Text>
          </View>
          
          {/* Options */}
          <View style={styles.flightOptions}>
            <View style={styles.optionCards}>
              <Text style={styles.optionLabel}>Select flight date</Text>
              
              {/* Flight Options */}
              <View style={styles.flightOptionsRow}>
                {/* May 30 Option (Selected) */}
                <TouchableOpacity
                  style={[styles.optionCard, styles.selectedOptionCard]}
                  onPress={() => setSelectedFlightDate('May 30')}>
                  <Text style={styles.optionText}>May 30</Text>
                  <Text style={styles.optionSubtext}>2025</Text>
                </TouchableOpacity>
                
                {/* Jun 15 Option */}
                <TouchableOpacity
                  style={[styles.optionCard, styles.unselectedOptionCard]}
                  onPress={() => setSelectedFlightDate('Jun 15')}>
                  <Text style={styles.unselectedOptionText}>Jun 15</Text>
                  <Text style={styles.optionSubtext}>2025</Text>
                </TouchableOpacity>
                
                {/* Jul 20 Option */}
                <TouchableOpacity
                  style={[styles.optionCard, styles.unselectedOptionCard]}
                  onPress={() => setSelectedFlightDate('Jul 20')}>
                  <Text style={styles.unselectedOptionText}>Jul 20</Text>
                  <Text style={styles.optionSubtext}>2025</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Plant List Section */}
        <View style={styles.plantList}>
          {/* Dynamic Plant Items */}
          {plantItems.map((item, index) => (
            <View key={item.id || index} style={styles.plantItemWrapper}>
              <PlantItemComponent
                image={item.image}
                name={item.name}
                variation={item.variation || 'Variegated'}
                size={item.size || '6'}
                price={item.price}
                quantity={item.quantity || 1}
                title={item.title || 'Rare Tropical Plants from Thailand'}
                country={item.country || 'TH'}
                shippingMethod={item.shippingMethod || 'Plant / UPS Ground Shipping'}
                listingType={item.listingType}
                discount={item.discount}
                originalPrice={item.originalPrice}
                hasAirCargo={item.hasAirCargo}
              />
              
              {/* Details for each item */}
              <View style={styles.plantItemDetails}>
                {/* Title + Country */}
                <View style={styles.titleCountry}>
                  <Text style={styles.titleText}>{item.title || 'Rare Tropical Plants from Thailand'}</Text>
                  
                  {/* Country */}
                  <View style={styles.countryContainer}>
                    <Text style={styles.countryText}>{item.country || 'TH'}</Text>
                    <ThailandFlag width={24} height={16} style={styles.flagIcon} />
                  </View>
                </View>
                
                {/* Plant / UPS Shipping */}
                <View style={styles.plantShipping}>
                  {/* Content */}
                  <View style={styles.shippingContent}>
                    <TruckIcon width={24} height={24} style={styles.shippingIcon} />
                    <Text style={styles.shippingText}>{item.shippingMethod || 'Plant / UPS Ground Shipping'}</Text>
                  </View>
                </View>
                
                {/* Air Cargo Option (if available) */}
                {item.hasAirCargo && (
                  <View style={styles.plantShipping}>
                    <View style={styles.shippingContent}>
                      <TruckIcon width={24} height={24} style={styles.airCargoIcon} />
                      <Text style={styles.shippingText}>Plant / Wholesale Air Cargo</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <View style={styles.paymentMethodRow}>
            <Text style={styles.paymentMethodTitle}>Payment Method</Text>
            <Text style={styles.paymentOptionText}>Venmo</Text>
          </View>
        </View>

        {/* Payment Method Divider */}
        <View style={styles.paymentDivider}>
          <View style={styles.paymentDividerLine} />
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          {/* Quantity */}
          <View style={styles.quantity}>
            {/* Title */}
            <View style={styles.quantityTitle}>
              <Text style={styles.quantityTitleText}>Your Plant Haul</Text>
            </View>
            
            {/* Content */}
            <View style={styles.quantityContent}>
              {/* Single / Growers */}
              <View style={styles.singleGrowerRow}>
                <Text style={styles.summaryRowLabel}>Single Plant Quantity</Text>
                <Text style={styles.summaryRowNumber}>2</Text>
              </View>
              
              {/* Wholesale */}
              <View style={styles.wholesaleRow}>
                <Text style={styles.summaryRowLabel}>Wholesale Quantity</Text>
                <Text style={styles.summaryRowNumber}>1</Text>
              </View>
              
              {/* Total */}
              <View style={styles.quantityTotalRow}>
                <Text style={styles.quantityTotalLabel}>Total quantity</Text>
                <Text style={styles.quantityTotalNumber}>3</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Subtotal */}
          <View style={styles.subtotal}>
            {/* Total */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Total Plant Cost</Text>
              <Text style={styles.subtotalNumber}>${orderSummary.subtotal.toFixed(2)}</Text>
            </View>
            
            {/* Discount */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Total Discount on Plants</Text>
              <Text style={styles.subtotalNumber}>-${orderSummary.discount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Shipping Summary */}
          <View style={styles.shippingSummary}>
            {/* Title */}
            <View style={styles.shippingSummaryTitle}>
              <Text style={styles.shippingSummaryTitleText}>Where your shipping bucks go</Text>
            </View>
            
            {/* Content */}
            <View style={styles.shippingSummaryContent}>
              {/* Shipping Fee */}
              <View style={styles.shippingFeeRow}>
                <Text style={styles.summaryRowLabel}>UPS 2nd day shippping</Text>
                <Text style={styles.summaryRowNumber}>${orderSummary.shipping.toFixed(2)}</Text>
              </View>
              
              {/* Form / Labeled Toggle */}
              <View style={styles.labeledToggle}>
                <View style={styles.toggleLabel}>
                  <Text style={styles.toggleLabelText}>Upgrading to UPS Next Day</Text>
                </View>
                <View style={styles.formToggle}>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleOffLabel}>-</Text>
                    <Text style={styles.toggleOffNumber}>$0.00</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
              
              {/* Base Air Cargo */}
              <View style={styles.baseAirCargoRow}>
                <View style={styles.labelTooltip}>
                  <Text style={styles.summaryRowLabel}>Base Air Cargo</Text>
                  <View style={styles.tooltip}>
                    <View style={styles.helper}>
                      {/* Tooltip icon would go here */}
                    </View>
                  </View>
                </View>
                <Text style={styles.summaryRowNumber}>$25.00</Text>
              </View>
              
              {/* Wholesale Air Cargo */}
              <View style={styles.wholesaleAirCargoRow}>
                <Text style={styles.summaryRowLabel}>Wholesale Air Cargo</Text>
                <Text style={styles.summaryRowNumber}>$18.00</Text>
              </View>
              
              {/* Air Cargo Credit */}
              <View style={styles.airCargoCreditRow}>
                <Text style={styles.summaryRowLabel}>Air Cargo Shipping Credit</Text>
                <Text style={styles.airCargoCreditAmount}>-$10.00</Text>
              </View>
              
              {/* Total */}
              <View style={styles.shippingTotalRow}>
                <Text style={styles.shippingTotalLabel}>Total Shipping Cost</Text>
                <Text style={styles.shippingTotalNumber}>$33.00</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Points */}
          <View style={styles.points}>
            {/* Title */}
            <View style={styles.pointsTitle}>
              <Text style={styles.pointsTitleText}>Use available iLeaf points, rewards, and discount</Text>
            </View>
            
            {/* Point Options */}
            <View style={styles.pointOptions}>
              {/* Discount */}
              <View style={styles.discountOption}>
                {/* Text Field */}
                <View style={styles.textField}>
                  <View style={styles.textFieldInput}>
                    <TagIcon width={24} height={24} />
                    <Text style={styles.textFieldPlaceholder}>Discount code</Text>
                  </View>
                </View>
                {/* Apply Button */}
                <TouchableOpacity style={styles.applyButton}>
                  <View style={styles.applyButtonText}>
                    <Text style={styles.applyButtonLabel}>Apply</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Leaf Points */}
              <View style={styles.leafPointsRow}>
                <View style={styles.iconLabel}>
                  <View style={styles.leafIcon}>
                    <LeafIcon width={36} height={36} />
                  </View>
                  <Text style={styles.iconLabelText}>Leaf Points</Text>
                </View>
                <View style={styles.formToggle}>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleOnLabel}>Use</Text>
                    <Text style={styles.toggleOnNumber}>$0.00</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
              
              {/* Plant Credits */}
              <View style={styles.plantCreditsRow}>
                <View style={styles.iconLabel}>
                  <View style={styles.plantIcon}>
                    <PlantIcon width={36} height={36} />
                  </View>
                  <Text style={styles.iconLabelText}>Plant Credits</Text>
                </View>
                <View style={styles.formToggle}>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleOnLabel}>Use</Text>
                    <Text style={styles.toggleOnNumber}>$0.00</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
              
              {/* Shipping Credits */}
              <View style={styles.shippingCreditsRow}>
                <View style={styles.iconLabel}>
                  <View style={styles.shippingIcon}>
                    <TruckBlueIcon width={36} height={36} />
                  </View>
                  <Text style={styles.iconLabelText}>Shipping Credits</Text>
                </View>
                <View style={styles.formToggle}>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleOnLabel}>Use</Text>
                    <Text style={styles.toggleOnNumber}>$0.00</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Total Amount */}
          <View style={styles.totalAmount}>
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalAmountLabel}>Total</Text>
              <Text style={styles.totalAmountNumber}>${orderSummary.finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Checkout Bar */}
      <View style={styles.checkoutBar}>
        {/* Content */}
        <View style={styles.checkoutContent}>
          {/* Summary */}
          <View style={styles.checkoutSummary}>
            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>${orderSummary.finalTotal.toFixed(2)}</Text>
              <CaretDownIcon width={24} height={24} style={styles.infoIcon} />
            </View>
            
            {/* Discount (if available) */}
            {orderSummary.discount > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountSavings}>You're saving</Text>
                <Text style={styles.discountAmount}>${orderSummary.discount.toFixed(2)}</Text>
              </View>
            )}
          </View>
          
          {/* Button */}
          <TouchableOpacity
            style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
            onPress={handleCheckout}
            disabled={loading}>
            <View style={styles.buttonText}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonLabel}>Place Order</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Home Indicator */}
        <View style={styles.homeIndicator}>
          <View style={styles.gestureBar} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollableContent: {
    flex: 1,
    marginTop: 24,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    width: '100%',
    height: 58,
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    height: 58,
    minHeight: 58,
    flex: 0,
    alignSelf: 'stretch',
    position: 'relative',
  },
  backButton: {
    width: 24,
    height: 24,
    flex: 0,
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 14,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    flex: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  navbarRight: {
    width: 24,
    height: 24,
    opacity: 0,
  },
  shipping: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 0,
    gap: 12,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitleText: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 0,
  },
  addressList: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    height: 92,
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    flex: 0,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  iconCircle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8.33,
    width: 40,
    height: 40,
    flex: 0,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    width: 40,
    height: 40,
    backgroundColor: '#FFE7E2',
    borderRadius: 1000,
    flex: 0,
  },
  addressDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    height: 44,
    flex: 1,
  },
  addressAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 44,
    flex: 0,
    alignSelf: 'stretch',
  },
  addressText: {
    height: 44,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 1,
    textAlignVertical: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 44,
    flex: 0,
    alignSelf: 'stretch',
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
    flex: 0,
  },
  plantFlight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    gap: 12,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  flightTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  flightTitleText: {
    width: 100,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 0,
  },
  flightOptions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 10,
    width: '100%',
    height: 112,
    flex: 0,
    alignSelf: 'stretch',
  },
  optionCards: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 112,
    flex: 0,
    alignSelf: 'stretch',
  },
  optionLabel: {
    width: '100%',
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
    flex: 0,
    alignSelf: 'stretch',
  },
  flightOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 78,
    flex: 0,
    alignSelf: 'stretch',
  },
  optionCard: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
    minWidth: 80,
    height: 78,
    minHeight: 60,
    borderRadius: 12,
    flex: 1,
  },
  selectedOptionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#539461',
  },
  unselectedOptionCard: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  optionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#202325',
    flex: 0,
  },
  unselectedOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#393D40',
    flex: 0,
  },
  optionSubtext: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    textAlign: 'center',
    color: '#647276',
    flex: 0,
  },
  plantItemWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 0,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  plantList: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentMethod: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 15,
    paddingBottom: 0,
    gap: 12,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentMethodTitle: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 0,
  },
  paymentOptionContainer: {
    paddingHorizontal: 15,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  paymentDivider: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 28,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentDividerLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#F5F6F6',
    flex: 0,
    alignSelf: 'stretch',
  },
  summary: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 20,
    gap: 12,
    width: '100%',
    height: 872,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantity: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    height: 112,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantityTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantityTitleText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  quantityContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 80,
    flex: 0,
    alignSelf: 'stretch',
  },
  singleGrowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  wholesaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantityTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  summaryRowLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  summaryRowNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
    textAlign: 'right',
  },
  quantityTotalLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  quantityTotalNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  summaryDivider: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 17,
    flex: 0,
    alignSelf: 'stretch',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotal: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    height: 56,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 99,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotalLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  subtotalNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  discountLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  discountNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#E7522F',
    flex: 0,
  },
  shippingSummary: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    minHeight: 204,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingSummaryTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingSummaryTitleText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  shippingSummaryContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    minHeight: 172,
    flex: 0,
    alignSelf: 'stretch',
  },
  shipping: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    height: 204,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitleText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  shippingContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 172,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  labeledToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    minHeight: 32,
    flex: 0,
    alignSelf: 'stretch',
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    minHeight: 28,
    flex: 1,
  },
  toggleLabelText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  formToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    height: 24,
    flex: 0,
  },
  toggleText: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    height: 22,
    flex: 0,
  },
  toggleOffLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#A9B3B7',
    flex: 0,
  },
  toggleOffNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#A9B3B7',
    flex: 0,
  },
  toggleOnLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    flex: 0,
  },
  toggleOnNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    flex: 0,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    gap: 10,
    width: 44,
    maxWidth: 44,
    height: 24,
    maxHeight: 24,
    backgroundColor: '#7F8D91',
    borderRadius: 32,
    flex: 0,
  },
  switchKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    flex: 0,
  },
  baseAirCargoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    minHeight: 32,
    flex: 0,
    alignSelf: 'stretch',
  },
  labelTooltip: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    minHeight: 32,
    flex: 1,
  },
  tooltip: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 28,
    height: 28,
    flex: 0,
  },
  helper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 10,
    width: 28,
    height: 28,
    flex: 0,
  },
  wholesaleAirCargoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  airCargoCreditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  airCargoCreditAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#E7522F',
    flex: 0,
    textAlign: 'right',
  },
  shippingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTotalLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
  },
  shippingTotalNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
    textAlign: 'right',
  },
  points: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    minHeight: 272,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  pointsTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 48,
    flex: 0,
    alignSelf: 'stretch',
  },
  pointsTitleText: {
    width: '100%',
    height: 48,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  pointOptions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    gap: 12,
    width: '100%',
    minHeight: 216,
    flex: 0,
    alignSelf: 'stretch',
  },
  discountOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 0,
    gap: 8,
    width: '100%',
    height: 56,
    flex: 0,
    alignSelf: 'stretch',
  },
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 252,
    height: 48,
    flex: 0,
    flexGrow: 1,
  },
  textFieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: "100%",
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  textFieldPlaceholder: {
    width: 184,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 0,
    flexGrow: 1,
  },
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 85,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 0,
  },
  applyButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 61,
    height: 16,
    flex: 0,
  },
  applyButtonLabel: {
    width: 45,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    flex: 0,
  },
  leafPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  plantCreditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingCreditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    height: 36,
    flex: 0,
  },
  leafIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 8,
    width: 36,
    height: 36,
    backgroundColor: '#539461',
    borderRadius: 1000,
    flex: 0,
  },
  plantIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 8,
    width: 36,
    height: 36,
    backgroundColor: '#6B4EFF',
    borderRadius: 1000,
    flex: 0,
  },
  shippingIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 8,
    width: 36,
    height: 36,
    backgroundColor: '#48A7F8',
    borderRadius: 1000,
    flex: 0,
  },
  iconLabelText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  totalAmount: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    height: 32,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 32,
    flex: 0,
    alignSelf: 'stretch',
  },
  totalAmountLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  totalAmountNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#202325',
    flex: 0,
  },
  plant: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  plantImage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: 96,
    height: 128,
    borderRadius: 6,
    flex: 0,
  },
  plantImageContainer: {
    width: 96,
    height: 128,
    borderRadius: 6,
    flex: 0,
  },
  plantDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    flex: 1,
  },
  plantName: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 50,
    flex: 0,
    alignSelf: 'stretch',
  },
  plantNameText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
    alignSelf: 'stretch',
  },
  variationSize: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  variationText: {
    width: 127,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#647276',
    flex: 0,
  },
  dividerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 0,
    width: 4,
    height: 12,
    flex: 0,
  },
  divider: {
    width: 4,
    maxWidth: 4,
    height: 4,
    maxHeight: 4,
    backgroundColor: '#7F8D91',
    borderRadius: 100,
    flex: 0,
  },
  sizeNumber: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#647276',
    flex: 0,
  },
  typeDiscount: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  listingType: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 8,
    paddingBottom: 1,
    backgroundColor: '#202325',
    borderRadius: 6,
    flex: 0,
  },
  listingTypeLabel: {
    height: 17,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17, // 140% of 12px
    color: '#FFFFFF',
    flex: 0,
  },
  discountBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    flex: 0,
  },
  discountText: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  discountLabel: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  priceQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
  },
  priceNumber: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  discountedPrice: {
    color: '#539461',
  },
  originalPriceText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textDecorationLine: 'line-through',
    color: '#7F8D91',
    flex: 0,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    flex: 0,
  },
  quantityNumber: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'right',
    color: '#393D40',
    flex: 0,
  },
  quantityMultiple: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'right',
    color: '#393D40',
    flex: 0,
  },
  plantItemDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 0,
    paddingHorizontal: 6,
    gap: 8,
    width: '100%',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  titleCountry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  titleText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 1,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: 53,
    height: 22,
    flex: 0,
  },
  countryText: {
    width: 23,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#556065',
    flex: 0,
  },
  flagIcon: {
    width: 24,
    height: 16,
    flex: 0,
  },
  plantShipping: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 1,
  },
  shippingIcon: {
    // width: 24,
    // height: 24,
    // flex: 0,
  },
  airCargoIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  shippingText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#556065',
    flex: 0,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  editButton: {
    fontSize: 14,
    color: '#699E73',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#647276',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  phoneText: {
    fontSize: 14,
    color: '#647276',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#647276',
    fontStyle: 'italic',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creditsLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  applyButtonOld: {
    fontSize: 14,
    color: '#699E73',
    fontWeight: '500',
  },
  cargoDateText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  checkoutBar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    position: 'absolute',
    width: '100%',
    height: 98,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#141414',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    flex: 0,
    zIndex: 2,
  },
  checkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 15,
    paddingBottom: 0,
    gap: 15,
    width: '100%',
    height: 64,
    flex: 0,
    alignSelf: 'stretch',
  },
  checkoutSummary: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 0,
    gap: 4,
    width: 199,
    height: 48,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 143,
    height: 24,
    flex: 0,
  },
  amountLabel: {
    width: 43,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 0,
  },
  amountValue: {
    width: 68,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24, // 120% of 20px
    color: '#202325',
    flex: 0,
  },
  infoIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 146,
    height: 20,
    flex: 0,
  },
  discountSavings: {
    width: 94,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  discountAmount: {
    width: 48,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  placeOrderButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 131,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 0,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#CDD3D4',
  },
  buttonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 107,
    height: 16,
    flex: 0,
  },
  buttonLabel: {
    width: 91,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16, // 100% of 16px
    textAlign: 'center',
    color: '#FFFFFF',
    flex: 0,
  },
  homeIndicator: {
    width: '100%',
    height: 34,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    flex: 0,
    position: 'relative',
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    bottom: 8,
    marginLeft: -74, // Center the gesture bar
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default CheckoutScreen;
