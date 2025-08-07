import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import PaymentManager from '../../utils/PaymentManager';

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Get PayPal order ID from URL params or route params
  const {paypalOrderId, orderId} = route.params || {};

  useEffect(() => {
    if (paypalOrderId) {
      capturePayment();
    } else {
      setLoading(false);
      setPaymentStatus('error');
    }
  }, [paypalOrderId]);

  const capturePayment = async () => {
    try {
      setLoading(true);
      
      const result = await PaymentManager.capturePayment(paypalOrderId);
      
      if (result.success) {
        setPaymentStatus('success');
        setOrderDetails(result.data);
        
        // Show success message
        const {transactionNumber} = result.data;
        PaymentManager.showPaymentSuccess(transactionNumber, orderDetails?.finalTotal || 0);
        
      } else {
        setPaymentStatus('error');
        PaymentManager.showPaymentError(result.error);
      }
      
    } catch (error) {
      console.error('Payment capture error:', error);
      setPaymentStatus('error');
      PaymentManager.showPaymentError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    // Navigate to home screen
    navigation.reset({
      index: 0,
      routes: [{name: 'Home'}], // Adjust route name as needed
    });
  };

  const handleViewOrders = () => {
    // Navigate to orders screen
    navigation.navigate('Orders'); // Adjust route name as needed
  };

  const handleRetryPayment = () => {
    // Go back to checkout or retry payment
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#699E73" />
          <Text style={styles.loadingText}>Processing your payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {paymentStatus === 'success' ? (
          <>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
            
            {/* Success Message */}
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successMessage}>
              Your order has been placed successfully. You will receive a confirmation email shortly.
            </Text>
            
            {/* Order Details */}
            {orderDetails && (
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailTitle}>Order Details</Text>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Transaction Number:</Text>
                  <Text style={styles.orderDetailValue}>{orderDetails.transactionNumber}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order ID:</Text>
                  <Text style={styles.orderDetailValue}>{orderDetails.orderId}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Capture ID:</Text>
                  <Text style={styles.orderDetailValue}>{orderDetails.captureId}</Text>
                </View>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrders}>
                <Text style={styles.primaryButtonText}>View My Orders</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorMark}>✕</Text>
              </View>
            </View>
            
            {/* Error Message */}
            <Text style={styles.errorTitle}>Payment Failed</Text>
            <Text style={styles.errorMessage}>
              We couldn't process your payment. Please try again or contact support if the problem persists.
            </Text>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRetryPayment}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#647276',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  errorMark: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  orderDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#647276',
    flex: 1,
  },
  orderDetailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#699E73',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#647276',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PaymentSuccessScreen;
