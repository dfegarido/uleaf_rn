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
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import PaymentManager from '../../utils/PaymentManager';
import {globalStyles} from '../../assets/styles/styles';

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
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');
  const [leafPoints, setLeafPoints] = useState(0);
  const [plantCredits, setPlantCredits] = useState(0);
  const [shippingCredits, setShippingCredits] = useState(0);
  
  // Mock order summary
  const [orderSummary, setOrderSummary] = useState({
    totalItems: useCart ? cartItems.length : productData.length,
    subtotal: 89.99,
    shipping: 15.00,
    discount: 5.00,
    finalTotal: 99.99,
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
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{width: 50}} />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({orderSummary.totalItems})</Text>
            <Text style={styles.summaryValue}>${orderSummary.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>${orderSummary.shipping.toFixed(2)}</Text>
          </View>
          {orderSummary.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -${orderSummary.discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderSummary.finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <TouchableOpacity onPress={handleUpdateDeliveryDetails}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressText}>
            {deliveryDetails.address.street}{'\n'}
            {deliveryDetails.address.city}, {deliveryDetails.address.state} {deliveryDetails.address.zipCode}
          </Text>
          <Text style={styles.phoneText}>Phone: {deliveryDetails.contactPhone}</Text>
          {deliveryDetails.specialInstructions && (
            <Text style={styles.instructionsText}>
              Instructions: {deliveryDetails.specialInstructions}
            </Text>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity onPress={handleUpdatePaymentMethod}>
              <Text style={styles.editButton}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
        </View>

        {/* Credits & Points */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Credits & Points</Text>
          <View style={styles.creditsRow}>
            <Text style={styles.creditsLabel}>Leaf Points: {leafPoints}</Text>
            <TouchableOpacity onPress={() => setLeafPoints(leafPoints + 100)}>
              <Text style={styles.applyButton}>Apply</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.creditsRow}>
            <Text style={styles.creditsLabel}>Plant Credits: ${plantCredits.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => setPlantCredits(plantCredits + 5)}>
              <Text style={styles.applyButton}>Apply</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.creditsRow}>
            <Text style={styles.creditsLabel}>Shipping Credits: ${shippingCredits.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => setShippingCredits(shippingCredits + 2.5)}>
              <Text style={styles.applyButton}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cargo Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cargo Date</Text>
          <Text style={styles.cargoDateText}>{cargoDate}</Text>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutFooter}>
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              Complete Order • ${orderSummary.finalTotal.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    fontSize: 16,
    color: '#699E73',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
  discountText: {
    color: '#22C55E',
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
  addressText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
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
  applyButton: {
    fontSize: 14,
    color: '#699E73',
    fontWeight: '500',
  },
  cargoDateText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  checkoutFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    backgroundColor: '#fff',
  },
  checkoutButton: {
    backgroundColor: '#699E73',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#CDD3D4',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
