// Example usage in CartScreen or any other component

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import PaymentManager from '../../utils/PaymentManager';
import {useNavigation} from '@react-navigation/native';

const CartExampleUsage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Example cart items
  const cartItems = [
    {
      id: 1,
      plantCode: 'ALO001',
      quantity: 2,
      potSize: '4"',
      price: 25.99,
    },
    {
      id: 2,
      plantCode: 'PHI002',
      quantity: 1,
      potSize: '6"',
      price: 45.00,
    },
  ];

  // Example: Checkout with cart items
  const handleCheckoutWithCart = async () => {
    try {
      setLoading(true);

      const checkoutData = {
        cargoDate: '2025-02-15',
        deliveryDetails: {
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          contactPhone: '+1-555-0123',
          specialInstructions: 'Leave at front door'
        },
        paymentMethod: 'PAYPAL',
        leafPoints: 100,      // Optional: leaf points to apply
        plantCredits: 5.0,    // Optional: plant credits to apply
        shippingCredits: 2.5, // Optional: shipping credits to apply
      };

      const paymentOptions = {
        returnUrl: 'ileafu://payment-success',
        cancelUrl: 'ileafu://payment-cancel',
        preferVenmo: true,
      };

      const result = await PaymentManager.checkoutWithCart(checkoutData, paymentOptions);

      if (result.success) {
        const {approvalUrl, transactionNumber, orderSummary} = result.data;
        
        Alert.alert(
          'Order Created',
          `Order ${transactionNumber} created successfully! Total: $${orderSummary.finalTotal.toFixed(2)}`,
          [
            {
              text: 'Pay Now',
              onPress: () => PaymentManager.openPaymentUrl(approvalUrl),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      } else {
        PaymentManager.showPaymentError(result.error);
      }
    } catch (error) {
      PaymentManager.showPaymentError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Checkout with specific products (not from cart)
  const handleCheckoutWithProducts = async () => {
    try {
      setLoading(true);

      const checkoutData = {
        cargoDate: '2025-02-15',
        productData: [
          {
            plantCode: 'ALO001',
            quantity: 1,
            potSize: '4"',
          },
        ],
        deliveryDetails: {
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'US'
          },
          contactPhone: '+1-555-0456',
        },
        paymentMethod: 'PAYPAL',
      };

      const paymentOptions = {
        returnUrl: 'ileafu://payment-success',
        cancelUrl: 'ileafu://payment-cancel',
        preferVenmo: false, // Use PayPal instead of Venmo
      };

      const result = await PaymentManager.checkoutWithProducts(checkoutData, paymentOptions);

      if (result.success) {
        const {approvalUrl, transactionNumber} = result.data;
        
        Alert.alert(
          'Order Created',
          `Order ${transactionNumber} created! Redirecting to payment...`,
          [
            {
              text: 'Pay Now',
              onPress: () => PaymentManager.openPaymentUrl(approvalUrl),
            },
          ],
        );
      } else {
        PaymentManager.showPaymentError(result.error);
      }
    } catch (error) {
      PaymentManager.showPaymentError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Navigate to full checkout screen
  const handleNavigateToCheckout = () => {
    navigation.navigate('CheckoutScreen', {
      cartItems,
      useCart: true,
    });
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 20}}>
        Payment Examples
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#699E73',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={handleCheckoutWithCart}
        disabled={loading}>
        <Text style={{color: 'white', textAlign: 'center', fontWeight: '600'}}>
          Quick Checkout with Cart
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#2563EB',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={handleCheckoutWithProducts}
        disabled={loading}>
        <Text style={{color: 'white', textAlign: 'center', fontWeight: '600'}}>
          Quick Checkout with Products
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#7C3AED',
          padding: 15,
          borderRadius: 8,
        }}
        onPress={handleNavigateToCheckout}
        disabled={loading}>
        <Text style={{color: 'white', textAlign: 'center', fontWeight: '600'}}>
          Full Checkout Screen
        </Text>
      </TouchableOpacity>

      {loading && (
        <Text style={{textAlign: 'center', marginTop: 10, color: '#666'}}>
          Processing...
        </Text>
      )}
    </View>
  );
};

export default CartExampleUsage;
