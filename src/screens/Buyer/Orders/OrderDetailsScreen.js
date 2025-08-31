import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {getOrderDetailApi} from '../../../components/Api/orderManagementApi';

// Import icons
import BackIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import CopyIcon from '../../../assets/icons/greylight/copy-regular.svg';
import CalendarIcon from '../../../assets/icons/greylight/calendar-blank-regular.svg';
import HelpIcon from '../../../assets/icons/greylight/question-regular.svg';
import LocationIcon from '../../../assets/icons/greylight/pin.svg';
import DownloadIcon from '../../../assets/icons/greylight/printer.svg';
import CheckIcon from '../../../assets/icons/white/check-regular.svg';

// Import flag components
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  // Local require for reusable Avatar component
  const Avatar = require('../../../components/Avatar/Avatar').default;
  
  // Get order data from navigation params
  const {orderData, activeTab} = route.params || {};
  
  // Use real order data if available, otherwise fallback to mock data
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helper function to get credit status badge color
  const getCreditStatusBadgeStyle = (status) => {
    switch (status) {
      case 'approved':
        return { backgroundColor: '#4CAF50' }; // Green for approved
      case 'processed':
        return { backgroundColor: '#23C16B' }; // Darker green for completed
      case 'rejected':
        return { backgroundColor: '#F44336' }; // Red for rejected
      case 'pending':
      default:
        return { backgroundColor: '#48A7F8' }; // Blue for pending/requested
    }
  };
  
  // Debug logging
  useEffect(() => {
    console.log('OrderDetailsScreen - Received orderData:', orderData);
  }, [orderData]);
  
  useEffect(() => {
    const loadOrderDetails = async () => {
      // Helper function to parse various date formats
      const parseDate = (dateValue) => {
        if (!dateValue) return null;
        
        try {
          // Handle Firestore timestamp format
          if (dateValue.seconds) {
            return new Date(dateValue.seconds * 1000);
          }
          // Handle ISO string format
          if (typeof dateValue === 'string') {
            return new Date(dateValue);
          }
          // Handle already parsed Date object
          if (dateValue instanceof Date) {
            return dateValue;
          }
          // Try direct conversion
          return new Date(dateValue);
        } catch (error) {
          console.error('Error parsing date:', dateValue, error);
          return null;
        }
      };

      // Helper function to format cargo date
      const formatCargoDate = (dateValue) => {
        const date = parseDate(dateValue);
        if (!date || isNaN(date.getTime())) return 'TBD';
        
        try {
          const formatted = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
          // Convert "Sat, Feb 15" to "Sat, Feb-15"
          return formatted.replace(/(\w{3}),\s(\w{3})\s(\d+)/, '$1, $2-$3');
        } catch (error) {
          console.error('Error formatting cargo date:', error);
          return 'TBD';
        }
      };

      // Helper function to format order date
      const formatOrderDate = (dateValue) => {
        const date = parseDate(dateValue);
        if (!date || isNaN(date.getTime())) return 'Unknown';
        
        try {
          return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } catch (error) {
          console.error('Error formatting order date:', error);
          return 'Unknown';
        }
      };

  // Always try to fetch detailed data first if we have valid parameters for the API
  // The API supports two modes:
  // 1. transactionNumber + plantCode for specific plant lookup
  // 2. orderId for legacy order lookup
  const hasTransactionAndPlant = !!(orderData && 
    (orderData.transactionNumber || orderData.fullOrderData?.transactionNumber) && 
    (orderData.plant?.code || orderData.plantCode || orderData.product?.plantCode || orderData.fullOrderData?.products?.[0]?.plantCode));
  
  const hasOrderId = !!(orderData && (orderData.id || orderData.fullOrderData?.id));
  const canFetchDetail = hasTransactionAndPlant || hasOrderId;
  
  if (canFetchDetail) {
        try {
          let response;
          const apiParams = {};

          // Determine the best identifier to use
          apiParams.transactionNumber = orderData.fullOrderData.transactionNumber;
          // Prefer passing the plantCode so backend returns the per-plant record
          apiParams.plantCode = orderData?.plant?.code || orderData?.plantCode || orderData?.product?.plantCode || orderData?.fullOrderData?.products?.[0]?.plantCode;

          console.log('Fetching order details with params:', apiParams);

          // Use same API for all tabs - getOrderDetailApi handles all order types
          console.log('🔍 Using getOrderDetailApi for order details');
          response = await getOrderDetailApi(apiParams);
          
          // API response shapes:
          // 1. Single plant with embedded order: { plantCode, plantName, order: {...} }
          // 2. Array of plants: { plants: [{...}, {...}], order: {...} }
          if (response.success && response.data?.data) {
            const apiData = response.data.data;
            console.log('API response data structure:', Object.keys(apiData));

            // Choose the relevant plant record based on response structure
            const requestedPlantCode = apiParams.plantCode || orderData?.plantCode || orderData?.product?.plantCode || orderData?.fullOrderData?.products?.[0]?.plantCode;
            let plantRecord = null;

            if (Array.isArray(apiData.plants) && apiData.plants.length > 0) {
              // Structure with plants array
              plantRecord = requestedPlantCode ? apiData.plants.find(p => p.plantCode === requestedPlantCode) : apiData.plants[0];
              if (!plantRecord) plantRecord = apiData.plants[0];
            } else if (apiData.plantCode || apiData.listingId) {
              // Single plant record structure (direct plant object with embedded order)
              plantRecord = apiData;
            }

            // Extract order metadata based on response structure
            const detailedOrder = Array.isArray(apiData.plants) 
              ? (apiData.order || {}) 
              : (apiData.order || {});
              
            console.log('✅ Successfully fetched detailed order:', {
              responsePaths: Object.keys(apiData),
              hasPlantArray: Array.isArray(apiData.plants),
              hasPlantCode: !!apiData.plantCode,
              hasOrderObject: !!apiData.order,
              plantCode: plantRecord?.plantCode,
              orderId: detailedOrder.id,
              transactionNumber: detailedOrder.transactionNumber
            });
            
            // Transform the comprehensive API data for the UI based on active tab
            const transformedOrder = {
              // Order level data
              invoiceNumber: detailedOrder.transactionNumber || detailedOrder.id || 'N/A',
              plantFlight: detailedOrder.cargoDateFormatted || plantRecord?.flightDateFormatted || formatCargoDate(detailedOrder.cargoDate) || formatCargoDate(plantRecord?.flightDate),
              trackingNumber: activeTab === 'Journey Mishap' ? 'Credit Request Tracking' : (detailedOrder.trackingNumber || 'Not Available'),
              orderDate: formatOrderDate(detailedOrder.orderDate) || formatOrderDate(detailedOrder.createdAt),
              status: activeTab === 'Journey Mishap' ? 'Credit Requested' : (detailedOrder.status || 'Ready to Fly'),

              // Enhanced plant data from API per-plant record
              plant: plantRecord ? {
                // Image handling with priority for webp formats
                image: plantRecord.plantDetails?.imageCollectionWebp?.[0] ? 
                  { uri: plantRecord.plantDetails.imageCollectionWebp[0] } :
                  plantRecord.plantDetails?.imagePrimaryWebp ? 
                  { uri: plantRecord.plantDetails.imagePrimaryWebp } :
                  plantRecord.plantDetails?.imagePrimary ? 
                  { uri: plantRecord.plantDetails.imagePrimary } :
                  plantRecord.plantDetails?.image ? 
                  { uri: plantRecord.plantDetails.image } : 
                  plantRecord.plantDetails?.imageCollection?.[0] ?
                  { uri: plantRecord.plantDetails.imageCollection[0] } :
                  plantRecord.image ? 
                  { uri: plantRecord.image } :
                  require('../../../assets/images/plant1.png'),
                code: plantRecord.plantCode || 'N/A',
                country: plantRecord.plantSourceCountry || plantRecord.order?.plantSourceCountry || plantRecord.supplierCode || 'TH',
                name: plantRecord.plantDetails?.title || plantRecord.plantName || `${plantRecord.genus || ''} ${plantRecord.species || ''}`.trim() || 'Unknown Plant',
                variegation: plantRecord.variegation || plantRecord.plantDetails?.variegation || 'Standard',
                size: plantRecord.potSize || plantRecord.plantDetails?.potSize || 'N/A',
                // Prefer using the productTotal or unitPrice from the plant record when available
                price: `$${((typeof detailedOrder.pricing?.finalTotal === 'number' ? detailedOrder.pricing.finalTotal : (plantRecord.productTotal ?? plantRecord.unitPrice ?? detailedOrder.pricing?.itemTotal ?? detailedOrder.pricing?.subtotal ?? 0))).toFixed(2)}`,
                quantity: plantRecord.quantity || 1,
                scientificName: plantRecord.plantDetails?.scientificName || `${plantRecord.genus || ''} ${plantRecord.species || ''}`.trim(),
                description: plantRecord.plantDetails?.description || '',
                careLevel: plantRecord.plantDetails?.careLevel || '',
                rarityLevel: plantRecord.plantDetails?.rarityLevel || '',
                // Journey Mishap specific credit data
                ...(activeTab === 'Journey Mishap' && {
                  creditRequests: plantRecord.creditRequestStatus?.requests || plantRecord.creditRequests || [],
                  creditRequestStatus: plantRecord.creditRequestStatus?.hasRequest ? (plantRecord.creditRequestStatus?.latestRequest?.status || 'pending') : (plantRecord.creditRequestStatus || 'pending')
                })
              } : {
                image: require('../../../assets/images/plant1.png'),
                code: 'N/A',
                country: 'TH',
                name: 'Unknown Plant',
                variegation: 'Standard',
                size: 'N/A',
                price: '$0.00',
                quantity: 1,
                ...(activeTab === 'Journey Mishap' && { creditRequests: [], creditRequestStatus: 'pending' })
              },

              // Enhanced delivery data
              deliveryAddress: detailedOrder.deliveryDetails?.address ? `${detailedOrder.deliveryDetails.address.street || ''}\n${detailedOrder.deliveryDetails.address.city || ''}, ${detailedOrder.deliveryDetails.address.state || ''} ${detailedOrder.deliveryDetails.address.zipCode || ''}\n${detailedOrder.deliveryDetails.address.country || ''}`.trim() : 'Address not available',

              // Additional comprehensive data
              supplierName: plantRecord.supplierName || plantRecord.plantDetails?.supplierName || detailedOrder.supplierInfo?.supplierName || detailedOrder.supplierName || 'Unknown Supplier',

              // Store the full API payload for future use/navigation
              _fullDetailedOrder: apiData,

              // Add credit request status from the plant record if available
              creditRequestStatus: plantRecord?.creditRequestStatus || { hasRequest: false, requests: [], latestRequest: null },

              ...(activeTab === 'Journey Mishap' && {
                totalCreditRequests: detailedOrder.creditRequests?.length || plantRecord?.creditRequestStatus?.requests?.length || 0,
                creditRequests: detailedOrder.creditRequests || plantRecord?.creditRequestStatus?.requests || [],
                hasActiveCreditRequests: (detailedOrder.creditRequests?.length || plantRecord?.creditRequestStatus?.requests?.length) > 0
              })
            };
            
            setOrder(transformedOrder);
            setLoading(false);
            return;
          } else {
            console.log('API call succeeded but no order data returned:', response);
          }
        } catch (error) {
          console.error('Error fetching detailed order data:', error);
          
          // Special handling for the case where backend still requires transactionNumber + plantCode
          // even when orderId is provided
          if (error.message && error.message.includes('transactionNumber and plantCode are required') && orderData.fullOrderData) {
            console.log('Backend API requires transactionNumber + plantCode. Using local order data instead.');
            // Continue to local data path - don't show error to user
          } else {
            // Show error for other failure types
            Alert.alert('Error', 'Failed to load order details. Please try again.');
          }
          // Fall through to use existing data if API call fails
        }
      }
      
      // Fallback to existing logic if detailed API call fails or isn't available
      if (orderData && orderData.fullOrderData) {
        // Use real API data
        const realOrder = orderData.fullOrderData;
        const product = realOrder.products?.[0];
        const plantDetails = product?.plantDetails;
        
        const transformedOrder = {
        // Order level data
        invoiceNumber: realOrder.transactionNumber || realOrder.id || 'N/A',
        plantFlight: realOrder.cargoDateFormatted || formatCargoDate(realOrder.cargoDate),
        trackingNumber: realOrder.trackingNumber || realOrder.shipment?.trackingNumber || 'Not Available',
        orderDate: formatOrderDate(realOrder.orderDate) || formatOrderDate(realOrder.createdAt),
        status: realOrder.status || 'Ready to Fly',
        
        // Plant data
        plant: {
          image: plantDetails?.image ? { uri: plantDetails.image } : require('../../../assets/images/plant1.png'),
          code: product?.plantCode || 'N/A',
          country: product?.supplierCode || realOrder.supplierCode || 'TH',
          name: plantDetails?.title || product?.plantName || `${product?.genus || ''} ${product?.species || ''}`.trim() || 'Unknown Plant',
          variegation: product?.variegation || plantDetails?.variegation || 'Standard',
          size: product?.potSize || plantDetails?.potSize || 'N/A',
                // Prefer showing order final total when available, otherwise fall back to product/unit/subtotals
                price: `$${( (typeof realOrder.pricing?.finalTotal === 'number' ? realOrder.pricing.finalTotal : (product?.price ?? product?.unitPrice ?? realOrder.pricing?.itemTotal ?? realOrder.pricing?.subtotal ?? plantDetails?.price ?? 0)) ).toFixed(2)}`,
          quantity: product?.quantity || 1,
          scientificName: plantDetails?.scientificName || `${product?.genus || ''} ${product?.species || ''}`.trim(),
          description: plantDetails?.description || '',
          careLevel: plantDetails?.careLevel || '',
          rarityLevel: plantDetails?.rarityLevel || '',
        },
        
        // Delivery and pricing data
        deliveryAddress: realOrder.deliveryDetails?.address ? 
          `${realOrder.deliveryDetails.address.street || ''}\n${realOrder.deliveryDetails.address.city || ''}, ${realOrder.deliveryDetails.address.state || ''} ${realOrder.deliveryDetails.address.zipCode || ''}\n${realOrder.deliveryDetails.address.country || ''}`.trim() :
          'Address not available',
        contactPhone: realOrder.deliveryDetails?.contactPhone || 'Not provided',
        specialInstructions: realOrder.deliveryDetails?.specialInstructions || 'None',
        
        // Pricing breakdown
        pricing: {
          subtotal: realOrder.pricing?.subtotal || 0,
          shipping: realOrder.pricing?.shipping || 0,
          discount: realOrder.pricing?.discount || 0,
          finalTotal: realOrder.pricing?.finalTotal || 0,
          creditsApplied: realOrder.pricing?.creditsApplied || 0,
        },
        
        // Payment info
        paymentMethod: realOrder.paymentMethod || 'Not specified',
        paymentStatus: realOrder.payment?.status || realOrder.paymentStatus || 'Ready to Fly',
        
        // Supplier info
        supplierName: plantDetails?.supplierName || realOrder.supplierName || 'Unknown Supplier',
        
        // Add credit request status from product if available
        creditRequestStatus: product?.creditRequestStatus || {
          hasRequest: false,
          requests: [],
          latestRequest: null
        }
      };
      
      setOrder(transformedOrder);
      setLoading(false);
    } else if (orderData) {
      // Use legacy format data
      setOrder({
        invoiceNumber: orderData.invoiceNumber || 'AA12345',
        plantFlight: orderData.plantFlight || 'May-30',
        trackingNumber: orderData.trackingNumber || '1Z999AA1234567890',
        orderDate: orderData.orderDate || 'Wednesday, January 8th 2025',
        status: 'Ready to Fly',
        plant: orderData.plant || {
          image: require('../../../assets/images/plant1.png'),
          code: 'AA12345',
          country: 'TH',
          name: 'Philodendron Melanochrysum',
          variegation: 'Inner Variegated',
          size: '6"',
          price: '$65.27',
          quantity: 1,
        },
        deliveryAddress: orderData.deliveryAddress || '123 Main Street\nNew York, NY 10001\nUnited States',
        contactPhone: '+1-555-0123',
        specialInstructions: 'Leave at front door',
        pricing: {
          subtotal: 65.27,
          shipping: 15.00,
          discount: 0,
          finalTotal: 80.27,
          creditsApplied: 0,
        },
        paymentMethod: 'PayPal',
        paymentStatus: 'completed',
        supplierName: 'Thailand Supplier',
        creditRequestStatus: {
          hasRequest: false,
          requests: [],
          latestRequest: null
        }
      });
      setLoading(false);
    } else {
      // Default mock data
      setOrder({
        invoiceNumber: 'AA12345',
        plantFlight: 'May-30',
        trackingNumber: '1Z999AA1234567890',
        orderDate: 'Wednesday, January 8th 2025',
        status: 'Ready to Fly',
        plant: {
          image: require('../../../assets/images/plant1.png'),
          code: 'AA12345',
          country: 'TH',
          name: 'Philodendron Melanochrysum',
          variegation: 'Inner Variegated',
          size: '6"',
          price: '$65.27',
          quantity: 1,
        },
        deliveryAddress: '123 Main Street\nNew York, NY 10001\nUnited States',
        contactPhone: '+1-555-0123',
        specialInstructions: 'Leave at front door',
        pricing: {
          subtotal: 65.27,
          shipping: 15.00,
          discount: 0,
          finalTotal: 80.27,
          creditsApplied: 0,
        },
        paymentMethod: 'PayPal',
        paymentStatus: 'completed',
        supplierName: 'Thailand Supplier',
        
        // Default credit request status
        creditRequestStatus: {
          hasRequest: false,
          requests: [],
          latestRequest: null
        }
      });
    }
    
    setLoading(false);
    };

    loadOrderDetails();
  }, [orderData]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready to fly':
        return '#202325'; // Black color for Ready to fly
      case 'paid':
      case 'completed':
      case 'delivered':
        return '#4CAF50';
      case 'shipped':
      case 'in-transit':
        return '#2196F3';
      case 'processing':
      case 'pending':
        return '#FF9800';
      case 'cancelled':
      case 'canceled':
        return '#F44336';
      default:
        return '#6c757d';
    }
  };

  // Skeleton Loading Components
  const SkeletonLoader = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );

      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    const ShimmerBox = ({style}) => (
      <Animated.View style={[styles.shimmerBox, style, {opacity}]} />
    );

    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.min(insets.top, 12) }] }>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity style={styles.headerSpacer} onPress={() => navigation.navigate('ScreenProfile')}>
            <Avatar size={40} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Invoice Header Skeleton */}
          <View style={styles.invoiceHeader}>
            <ShimmerBox style={styles.skeletonInvoiceNumber} />
            <View style={styles.flightInfo}>
              <ShimmerBox style={styles.skeletonIcon} />
              <ShimmerBox style={styles.skeletonFlightDate} />
            </View>
          </View>

          {/* Status Section Skeleton */}
          <View style={styles.section}>
            <ShimmerBox style={styles.skeletonSectionTitle} />
            <View style={styles.statusCard}>
              <ShimmerBox style={styles.skeletonStatusBadge} />
              <ShimmerBox style={styles.skeletonTrackingNumber} />
            </View>
          </View>

          {/* Plant Details Skeleton */}
          <View style={styles.section}>
            <ShimmerBox style={styles.skeletonSectionTitle} />
            <View style={styles.plantCard}>
              <ShimmerBox style={styles.skeletonPlantImage} />
              <View style={styles.plantInfo}>
                <ShimmerBox style={styles.skeletonPlantName} />
                <ShimmerBox style={styles.skeletonPlantDetails} />
                <ShimmerBox style={styles.skeletonPlantPrice} />
              </View>
            </View>
          </View>

          {/* Delivery Info Skeleton */}
          <View style={styles.section}>
            <ShimmerBox style={styles.skeletonSectionTitle} />
            <View style={styles.deliveryCard}>
              <ShimmerBox style={styles.skeletonDeliveryAddress} />
              <ShimmerBox style={styles.skeletonDeliveryPhone} />
            </View>
          </View>

          {/* Pricing Skeleton */}
          <View style={styles.section}>
            <ShimmerBox style={styles.skeletonSectionTitle} />
            <View style={styles.pricingCard}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.pricingRow}>
                  <ShimmerBox style={styles.skeletonPricingLabel} />
                  <ShimmerBox style={styles.skeletonPricingValue} />
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons Skeleton */}
          <View style={styles.actionButtonsContainer}>
            <ShimmerBox style={styles.skeletonActionButton} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  const getStatusDisplayText = (status) => {
    if (!status) return 'Unknown Status';
    
    // Format status for display
    return status.split(/[-_\s]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getOrderTitle = () => {
    // If we have activeTab from navigation, use it for non-mishap cases
    if (activeTab && activeTab !== 'Journey Mishap') {
      return activeTab;
    }
    
    // For Journey Mishap, check for specific mishap types in order data
    if (activeTab === 'Journey Mishap' || 
        (order?.status && (order.status.toLowerCase().includes('damaged') || 
         order.status.toLowerCase().includes('missing') || 
         order.status.toLowerCase().includes('mishap') || 
         order.status.toLowerCase().includes('casualty') ||
         order.status.toLowerCase().includes('dead')))) {
      
      // Check for specific mishap type in order data
      const mishapType = order?.mishapType || order?.issueType || order?.problemType;
      if (mishapType) {
        const type = mishapType.toLowerCase();
        if (type.includes('damage')) return 'Damaged Plant';
        if (type.includes('missing')) return 'Missing Plant';
        if (type.includes('dead') || type.includes('arrival')) return 'Dead on Arrival';
      }
      
      // Check order status for specific mishap types
      if (order?.status) {
        const status = order.status.toLowerCase();
        if (status.includes('damage')) return 'Damaged Plant';
        if (status.includes('missing')) return 'Missing Plant';
        if (status.includes('dead')) return 'Dead on Arrival';
      }
      
      // Check for additional fields that might indicate mishap type
      const description = order?.description || order?.issueDescription || '';
      if (description.toLowerCase().includes('damage')) return 'Damaged Plant';
      if (description.toLowerCase().includes('missing')) return 'Missing Plant';
      if (description.toLowerCase().includes('dead') || description.toLowerCase().includes('arrival')) return 'Dead on Arrival';
      
      // Default Journey Mishap title
      return 'Journey Mishap';
    }
    
    // Otherwise, determine from order status
    if (order?.status) {
      const status = order.status.toLowerCase();
      if (status.includes('delivered') || status.includes('home')) {
        return 'Plants are Home';
      } else if (status.includes('ready') || status.includes('fly') || status.includes('pending') || status.includes('confirmed') || status.includes('ship')) {
        return 'Ready To Fly';
      }
    }
    
    // Default fallback
    return 'Ready To Fly';
  };

  const handleCopyToClipboard = (text, label) => {
    Alert.alert('Copied', `${label} copied to clipboard: ${text}`);
  };

  const handleDownloadInvoice = () => {
    Alert.alert('Download', 'Invoice download functionality to be implemented');
  };

  const renderCountryFlag = (countryCode) => {
    switch (countryCode?.toUpperCase()) {
      case 'TH':
      default:
        return <ThailandFlag width={24} height={16} />;
    }
  };

  // Show skeleton loading while loading
  if (loading) {
    return <SkeletonLoader />;
  }

  // Show loading state if order is not yet loaded
  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <View style={[styles.header, { paddingTop: Math.min(insets.top, 12) }] }>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity style={styles.headerSpacer} onPress={() => navigation.navigate('ScreenProfile')}>
            <Avatar size={40} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.min(insets.top, 25) }] }>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity style={styles.headerSpacer} onPress={() => navigation.navigate('ScreenProfile')}>
          <Avatar size={40} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        {/* Status Details */}
        <View style={styles.statusDetails}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[
              styles.title, 
              activeTab === 'Journey Mishap' && styles.titleJourneyMishap
            ]}>
              {getOrderTitle()}
            </Text>
            {/* Credit Status Badge - Only show for Journey Mishap */}
            {activeTab === 'Journey Mishap' && order?.plant?.creditRequestStatus && (
              <View style={[
                styles.creditStatusBadge,
                getCreditStatusBadgeStyle(order.plant.creditRequestStatus)
              ]}>
                <Text style={styles.creditStatusText}>
                  {order.plant.creditRequestStatus === 'pending' ? 'Credit Requested' :
                   order.plant.creditRequestStatus === 'approved' ? 'Credit Approved' :
                   order.plant.creditRequestStatus === 'processed' ? 'Credit Completed' :
                   order.plant.creditRequestStatus === 'rejected' ? 'Credit Rejected' :
                   'Credit Requested'}
                </Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Conditional first row based on activeTab */}
            {activeTab === 'Journey Mishap' && order?.plant?.creditRequests?.length > 0 && (
              <View style={styles.creditCompletedSection}>
                <View style={styles.creditCompletedCard}>
                  <View style={styles.creditIcon}>
                    <CheckIcon width={16} height={16} />
                  </View>
                  <View style={styles.creditLabel}>
                    <Text style={styles.creditLabelText}>
                      {order.plant.creditRequestStatus === 'processed' ? 
                        'Your credit request has been approved and processed successfully.' :
                       order.plant.creditRequestStatus === 'approved' ?
                        'Your credit request has been approved and is being processed.' :
                       order.plant.creditRequestStatus === 'pending' ?
                        `Credit request submitted for ${order.plant.creditRequests[0]?.issueType || 'plant issue'}. Review in progress.` :
                       order.plant.creditRequestStatus === 'rejected' ?
                        'Your credit request has been reviewed but was not approved.' :
                        'Credit request is being reviewed.'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Invoice Number */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice Number</Text>
              <View style={styles.detailValue}>
                <Text style={styles.detailValueText}>{order.invoiceNumber}</Text>
                <TouchableOpacity 
                  onPress={() => handleCopyToClipboard(order.invoiceNumber, 'Invoice Number')}>
                  <CopyIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional second row based on activeTab */}
            {activeTab === 'Plants are Home' ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, styles.arrivalDateLabel]}>Arrival Date</Text>
                <View style={styles.detailValueSimple}>
                  <Text style={styles.detailValueText}>{order.plantFlight}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plant Flight</Text>
                <View style={styles.detailValueSimple}>
                  <Text style={styles.detailValueText}>{order.plantFlight}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Plant List */}
        {order.plant ? (
          <View style={styles.plantList}>
            <View style={styles.plantContainer}>
              <View style={styles.plantCard}>
                {/* Plant Image */}
                <View style={styles.imageContainer}>
                  <Image source={order.plant.image} style={styles.plantImage} resizeMode="cover" />
                </View>

                {/* Plant Details */}
                <View style={styles.plantDetails}>
                {/* Name Section */}
                <View style={styles.nameSection}>
                  {/* Code + Country */}
                  <View style={styles.codeCountryRow}>
                    <View style={styles.codeSection}>
                      <Text style={styles.plantCode}>{order.plant.code}</Text>
                      <TouchableOpacity style={styles.tooltipButton}>
                        <HelpIcon width={20} height={20} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.countrySection}>
                      <Text style={styles.countryText}>{order.plant.country}</Text>
                    </View>
                  </View>

                  {/* Plant Name */}
                  <Text style={styles.plantName}>{order.plant.name}</Text>

                  {/* Variegation + Size */}
                  <View style={styles.variationSizeRow}>
                    <Text style={styles.variationText}>{`${order.plant.variegation} * ${order.plant.size}`}</Text>
                  </View>
                </View>

                {/* Price + Quantity */}
                <View style={styles.priceQuantityRow}>
                  <Text style={styles.priceText}>{order.plant.price}</Text>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityNumber}>{order.plant.quantity}</Text>
                    <Text style={styles.quantityMultiple}>x</Text>
                  </View>
                </View>

                {/* Request Credit Button - Only show for Plants are Home */}
                {activeTab === 'Plants are Home' && (
                  <View style={styles.requestCreditContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.requestCreditButton,
                        order?.creditRequestStatus?.hasRequest && styles.requestCreditButtonDisabled
                      ]}
                      onPress={() => {
                        // Prevent action if request already exists
                        if (order?.creditRequestStatus?.hasRequest) {
                          Alert.alert(
                            'Credit Already Requested',
                            'A credit request has already been submitted for this plant.',
                            [{ text: 'OK' }]
                          );
                          return;
                        }

                        console.log('🚀 Credit request button pressed!');
                        console.log('Current activeTab:', activeTab);
                        console.log('Order object structure:', {
                          order: order ? 'Present' : 'Missing',
                          orderKeys: order ? Object.keys(order) : [],
                          orderData: orderData ? 'Present' : 'Missing',
                          orderDataKeys: orderData ? Object.keys(orderData) : [],
                          fullDetailedOrder: order?._fullDetailedOrder ? 'Present' : 'Missing',
                          plantCode: order?.plant?.code,
                          invoiceNumber: order?.invoiceNumber
                        });
                        
                        const navigationData = {
                          orderData: order._fullDetailedOrder || orderData || order,
                          plantCode: order.plant.code,
                          // Also pass some backup identifiers
                          orderId: order.invoiceNumber || order._fullDetailedOrder?.id || orderData?.id,
                          transactionNumber: order.invoiceNumber || order._fullDetailedOrder?.transactionNumber || orderData?.transactionNumber
                        };
                        
                        console.log('📤 Navigation data being sent:', navigationData);
                        
                        navigation.navigate('ScreenRequestCredit', navigationData);
                      }}
                      disabled={order?.creditRequestStatus?.hasRequest}
                    >
                      <Text style={[
                        styles.requestCreditText,
                        order?.creditRequestStatus?.hasRequest && styles.requestCreditTextDisabled
                      ]}>
                        {order?.creditRequestStatus?.hasRequest ? 'Credit Requested' : 'Request Credit'}
                      </Text>
                    </TouchableOpacity>
                    {!order?.creditRequestStatus?.hasRequest && (
                      <Text style={styles.requestCreditSubtext}>
                        If there's an issue with your plant, request credit by May-31 12:00 AM
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
          </View>
        ) : (
          // Show error message when plant data is not available
          <View style={styles.plantList}>
            <View style={styles.plantContainer}>
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Plant Details Unavailable</Text>
                <Text style={styles.errorMessage}>
                  Unable to load plant information. Please check your connection and try again.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Shipping Details */}
        <View style={styles.shippingDetails}>
          {/* Title */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Shipping Details</Text>
          </View>

          {/* Details */}
          <View style={styles.shippingDetailsContent}>
            {/* Conditional content based on activeTab */}
            {activeTab === 'Journey Mishap' ? (
              <>
                {/* Plant Price */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Plant Price</Text>
                  <View style={styles.detailValueSimple}>
                    <Text style={styles.plantPriceText}>
                      {order.plant?.price || 'N/A'}
                    </Text>
                  </View>
                </View>
                {/* Shipping Cost */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shipping Cost</Text>
                  <View style={styles.detailValueSimple}>
                    <Text style={styles.detailValueText}>$0</Text>
                  </View>
                </View>
              </>
            ) : (
              /* Tracking Number */
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tracking Number</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.detailValueText}>{order.trackingNumber}</Text>
                  <TouchableOpacity 
                    onPress={() => handleCopyToClipboard(order.trackingNumber, 'Tracking Number')}>
                    <CopyIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.deliveryDetails}>
          {/* Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitleText}>Delivery Details</Text>
          </View>

          {/* Address List */}
          <View style={styles.addressList}>
            <View style={styles.addressContent}>
              {/* Icon Circle */}
              <View style={styles.iconCircle}>
                <View style={styles.iconContainer}>
                  <LocationIcon width={24} height={24} />
                </View>
              </View>

              {/* Address Details */}
              <View style={styles.addressDetails}>
                <View style={styles.addressAction}>
                  <Text style={styles.addressText}>{order.deliveryAddress}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.datesContainer}>
            {/* Conditional date fields based on activeTab */}
            {activeTab === 'Plants are Home' ? (
              <>
                {/* Plant Flight */}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, styles.plantFlightLabel]}>Plant Flight</Text>
                  <View style={styles.detailValueSimple}>
                    <Text style={styles.detailValueText}>{order.plantFlight}</Text>
                  </View>
                </View>
                {/* Order Date */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date</Text>
                  <View style={styles.detailValueSimple}>
                    <Text style={styles.detailValueTextBold}>{order.orderDate}</Text>
                  </View>
                </View>
              </>
            ) : (
              /* Order Date */
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Date</Text>
                <View style={styles.detailValueSimple}>
                  <Text style={styles.detailValueTextBold}>{order.orderDate}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Invoice */}
        <View style={styles.invoiceSection}>
          <TouchableOpacity style={styles.invoiceButton} onPress={handleDownloadInvoice}>
            <DownloadIcon width={24} height={24} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonText}>Download Invoice</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingLeft: 0,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },

  // Status Details
  statusDetails: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
    gap: 12,
    minHeight: 32,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#202325',
    flex: 1,
  },
  titleJourneyMishap: {
    color: '#E7522F',
  },
  creditStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 28,
    minHeight: 28,
    borderRadius: 8,
  },
  creditStatusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  creditCompletedSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 12,
  },
  creditCompletedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 8,
    gap: 6,
    alignSelf: 'stretch',
    minHeight: 56,
  },
  creditIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#539461',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditLabel: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 44,
  },
  creditLabelText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#539461',
  },
  plantPriceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
  },
  detailsContainer: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 32,
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  arrivalDateLabel: {
    color: '#556065',
  },
  plantFlightLabel: {
    color: '#556065',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValueSimple: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValueText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  detailValueTextBold: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },

  // Plant List
  plantList: {
    gap: 6,
  },
  plantContainer: {
    backgroundColor: '#F5F6F6',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  imageContainer: {
  width: 80,
  height: 100,
    borderRadius: 6,
    overflow: 'hidden',
  },
  plantImage: {
  width: 80,
  height: 100,
  },
  plantDetails: {
    flex: 1,
    gap: 12,
  },
  nameSection: {
    gap: 4,
    flex: 1,
  },
  codeCountryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 28,
  },
  codeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  tooltipButton: {
    padding: 4,
    marginLeft: 4,
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  plantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  variationSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variationText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  dividerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    width: 4,
    height: 12,
  },
  divider: {
    width: 4,
    height: 4,
    backgroundColor: '#7F8D91',
    borderRadius: 100,
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  priceQuantityRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  // allow content to size naturally
  },
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
  },
  quantityContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  // don't stretch; keep content snug to the price
  minWidth: 44,
  },
  quantityNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    textAlign: 'right',
  },
  quantityMultiple: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    textAlign: 'right',
  },

  // Request Credit Section (Plants are Home)
  requestCreditContainer: {
    alignItems: 'flex-end',
    gap: 10,
    flex: 1,
  },
  requestCreditButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 48,
    minHeight: 48,
    borderWidth: 2,
    borderColor: '#539461',
    borderRadius: 12,
    minWidth: 156,
  },
  requestCreditButtonDisabled: {
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
  },
  requestCreditText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
  },
  requestCreditTextDisabled: {
    color: '#CDD3D4',
  },
  requestCreditSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    textAlign: 'right',
    flexWrap: 'wrap',
  },

  // Shipping Details
  shippingDetails: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    height: 24,
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  shippingDetailsContent: {
    gap: 0,
  },

  // Delivery Details
  deliveryDetails: {
    backgroundColor: '#F5F6F6',
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionTitleContainer: {
    paddingHorizontal: 15,
    height: 24,
    justifyContent: 'center',
  },
  addressList: {
    padding: 12,
    backgroundColor: '#F5F6F6',
  },
  addressContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFE7E2',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
    gap: 4,
  },
  addressAction: {
    justifyContent: 'center',
    minHeight: 44,
    flex: 1,
  },
  addressText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  datesContainer: {
    paddingHorizontal: 15,
  },

  // Pricing Section
  pricingSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingVertical: 20,
  },
  pricingContainer: {
    paddingHorizontal: 15,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#6B7280',
  },
  pricingValue: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  totalValue: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },

  // Invoice
  invoiceSection: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
  },
  invoiceButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
    flex: 1,
  },
  buttonTextContainer: {
    paddingHorizontal: 8,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },

  // Skeleton Loading Styles
  shimmerBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  // Invoice header wrapper for skeleton
  invoiceHeader: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  // Flight info row wrapper used by the skeleton
  flightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  skeletonInvoiceNumber: {
    width: 140,
    height: 24,
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  skeletonFlightDate: {
    width: 80,
    height: 16,
  },
  skeletonSectionTitle: {
    width: 140,
    height: 20,
    marginBottom: 16,
  },
  skeletonStatusBadge: {
    width: 100,
    height: 32,
    borderRadius: 16,
    marginBottom: 12,
  },
  skeletonTrackingNumber: {
    width: 200,
    height: 16,
  },
  // Match actual plant image dimensions in the real layout
  skeletonPlantImage: {
    width: 96,
    height: 128,
    borderRadius: 12,
    marginRight: 16,
  },
  skeletonPlantName: {
    width: '80%',
    height: 20,
    marginBottom: 8,
  },
  skeletonPlantDetails: {
    width: '60%',
    height: 16,
    marginBottom: 6,
  },
  skeletonPlantPrice: {
    width: 80,
    height: 18,
  },
  skeletonDeliveryAddress: {
    width: '90%',
    height: 16,
    marginBottom: 8,
  },
  skeletonDeliveryPhone: {
    width: '70%',
    height: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonPricingLabel: {
    width: 100,
    height: 16,
  },
  skeletonPricingValue: {
    width: 60,
    height: 16,
  },
  skeletonActionButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
  },

  // Error States
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#E7522F',
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#539461',
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default OrderDetailsScreen;
