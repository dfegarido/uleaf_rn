import {Alert, Linking} from 'react-native';
import {checkoutApi} from '../components/Api/checkoutApi';
import {createPaymentIntentApi, capturePaymentApi} from '../components/Api/paymentApi';

/**
 * Payment utility class for handling the complete payment flow
 */
export class PaymentManager {
  
  /**
   * Create an order and initiate payment process
   * @param {Object} orderData - Order details
   * @param {Object} options - Payment options
   * @param {string} options.returnUrl - URL to return to after successful payment
   * @param {string} options.cancelUrl - URL to return to after cancelled payment
   * @param {boolean} options.preferVenmo - Whether to prefer Venmo payment method
   * @returns {Promise<Object>} Payment flow result
   */
  static async initiatePayment(orderData, options = {}) {
    try {
      // Step 1: Create the order through checkout
      console.log('Creating order...');
      const checkoutResult = await checkoutApi(orderData);
      
      if (!checkoutResult.success) {
        throw new Error(checkoutResult.error || 'Failed to create order');
      }
      
      const {orderId, transactionNumber, orderSummary} = checkoutResult.data;
      console.log(`Order created successfully: ${transactionNumber}`);
      
      // Step 2: Create payment intent
      console.log('Creating payment intent...');
      const paymentIntentData = {
        orderId,
        returnUrl: options.returnUrl || 'ileafu://payment-success',
        cancelUrl: options.cancelUrl || 'ileafu://payment-cancel',
        preferVenmo: options.preferVenmo || true,
      };
      
      const paymentIntentResult = await createPaymentIntentApi(paymentIntentData);
      
      if (!paymentIntentResult.success) {
        throw new Error(paymentIntentResult.error || 'Failed to create payment intent');
      }
      
      const {approvalUrl, paypalOrderId} = paymentIntentResult.data;
      console.log('Payment intent created successfully');
      
      return {
        success: true,
        data: {
          orderId,
          transactionNumber,
          orderSummary,
          paypalOrderId,
          approvalUrl,
          message: 'Order created successfully. Please complete payment.',
        },
      };
      
    } catch (error) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initiation failed',
      };
    }
  }
  
  /**
   * Open PayPal payment URL in browser
   * @param {string} approvalUrl - PayPal approval URL
   */
  static async openPaymentUrl(approvalUrl) {
    try {
      const supported = await Linking.canOpenURL(approvalUrl);
      if (supported) {
        await Linking.openURL(approvalUrl);
      } else {
        Alert.alert(
          'Error',
          'Cannot open payment URL. Please try again or contact support.',
        );
      }
    } catch (error) {
      console.error('Error opening payment URL:', error);
      Alert.alert(
        'Error',
        'Failed to open payment page. Please try again.',
      );
    }
  }
  
  /**
   * Capture payment after user returns from PayPal
   * @param {string} paypalOrderId - PayPal order ID
   * @returns {Promise<Object>} Capture result
   */
  static async capturePayment(paypalOrderId) {
    try {
      console.log('Capturing payment...');
      const captureResult = await capturePaymentApi({paypalOrderId});
      
      if (!captureResult.success) {
        throw new Error(captureResult.error || 'Failed to capture payment');
      }
      
      console.log('Payment captured successfully');
      return {
        success: true,
        data: captureResult.data,
      };
      
    } catch (error) {
      console.error('Payment capture failed:', error);
      return {
        success: false,
        error: error.message || 'Payment capture failed',
      };
    }
  }
  
  /**
   * Handle the complete checkout flow for cart items
   * @param {Object} checkoutData - Checkout data
   * @param {string} checkoutData.cargoDate - Cargo date
   * @param {Object} checkoutData.deliveryDetails - Delivery details
   * @param {string} checkoutData.paymentMethod - Payment method
   * @param {number} checkoutData.leafPoints - Leaf points to apply
   * @param {number} checkoutData.plantCredits - Plant credits to apply
   * @param {number} checkoutData.shippingCredits - Shipping credits to apply
   * @param {Object} paymentOptions - Payment options
   * @returns {Promise<Object>} Complete checkout result
   */
  static async checkoutWithCart(checkoutData, paymentOptions = {}) {
    const orderData = {
      ...checkoutData,
      useCart: true, // Use cart items
      paymentMethod: checkoutData.paymentMethod || 'PAYPAL',
    };
    
    return await this.initiatePayment(orderData, paymentOptions);
  }
  
  /**
   * Handle the complete checkout flow for specific products
   * @param {Object} checkoutData - Checkout data
   * @param {Array} checkoutData.productData - Array of products
   * @param {string} checkoutData.cargoDate - Cargo date
   * @param {Object} checkoutData.deliveryDetails - Delivery details
   * @param {string} checkoutData.paymentMethod - Payment method
   * @param {number} checkoutData.leafPoints - Leaf points to apply
   * @param {number} checkoutData.plantCredits - Plant credits to apply
   * @param {number} checkoutData.shippingCredits - Shipping credits to apply
   * @param {Object} paymentOptions - Payment options
   * @returns {Promise<Object>} Complete checkout result
   */
  static async checkoutWithProducts(checkoutData, paymentOptions = {}) {
    const orderData = {
      ...checkoutData,
      useCart: false, // Use specific products
      paymentMethod: checkoutData.paymentMethod || 'PAYPAL',
    };
    
    return await this.initiatePayment(orderData, paymentOptions);
  }
  
  /**
   * Show payment confirmation dialog
   * @param {Object} orderSummary - Order summary data
   * @param {Function} onConfirm - Callback when user confirms
   * @param {Function} onCancel - Callback when user cancels
   */
  static showPaymentConfirmation(orderSummary, onConfirm, onCancel) {
    const {totalItems, finalTotal, paymentMethod} = orderSummary;
    
    Alert.alert(
      'Confirm Payment',
      `You are about to pay $${finalTotal.toFixed(2)} for ${totalItems} item(s) via ${paymentMethod}.\n\nProceed with payment?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Pay Now',
          style: 'default',
          onPress: onConfirm,
        },
      ],
    );
  }
  
  /**
   * Show payment success message
   * @param {string} transactionNumber - Transaction number
   * @param {number} amount - Payment amount
   */
  static showPaymentSuccess(transactionNumber, amount) {
    Alert.alert(
      'Payment Successful',
      `Your payment of $${amount.toFixed(2)} has been processed successfully.\n\nTransaction: ${transactionNumber}`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    );
  }
  
  /**
   * Show payment error message
   * @param {string} error - Error message
   */
  static showPaymentError(error) {
    Alert.alert(
      'Payment Failed',
      `Payment could not be processed: ${error}\n\nPlease try again or contact support.`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    );
  }
}

export default PaymentManager;
