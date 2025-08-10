import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
// Import your calendar icon and flag icon as needed
import CalendarIcon from '../../assets/icons/greylight/calendar-blank-regular.svg'; // Adjust path as needed
import ThailandFlag from '../../assets/buyer-icons/thailand-flag.svg'; // Replace with Thailand flag SVG if available

const OrderItemCard = ({
  status = 'Ready to Fly',
  airCargoDate = 'May-30',
  countryCode = 'TH',
  flag: FlagIcon = ThailandFlag,
  image,
  plantName = 'Plant genus species name',
  variety = 'Inner Variegated',
  size = '2"',
  price = '$65.27',
  quantity = 1,
  plantCode = 'AA#####',
  showRequestCredit = false,
  requestDeadline = 'May-31 12:00 AM',
  plantStatus = null,
  creditApproved = false,
  fullOrderData = null, // Full order data for navigation
  activeTab = null, // Active tab from parent screen
  creditRequestStatus = null, // Credit request status for this specific plant
}) => {
  const navigation = useNavigation();

  // Check if a credit request has been submitted for this specific plant
  // Use the new creditRequestStatus prop if available, otherwise fallback to checking fullOrderData
  const hasCreditRequest = creditRequestStatus?.hasRequest || 
    fullOrderData?.creditRequests?.some((req) => req.plantCode === plantCode);

  const handleRequestCredit = () => {
    // Prevent action if a request has already been made
    if (hasCreditRequest) {
      console.log('Credit request already submitted for this item.');
      return;
    }

    console.log('🏷️ OrderItemCard - Request Credit button pressed');
    console.log('Available data:', {
      fullOrderData: fullOrderData ? 'Present' : 'Missing',
      fullOrderDataKeys: fullOrderData ? Object.keys(fullOrderData) : [],
      plantCode: plantCode,
      activeTab: activeTab
    });

    // Create navigation data similar to OrderDetailsScreen
    const navigationData = {
      orderData: fullOrderData,
      plantCode: plantCode,
      // Also pass some backup identifiers
      orderId: fullOrderData?.id || fullOrderData?.transactionNumber,
      transactionNumber: fullOrderData?.transactionNumber || fullOrderData?.id
    };

    console.log('📤 OrderItemCard - Navigation data being sent:', navigationData);
    
    navigation.navigate('ScreenRequestCredit', navigationData);
  };

  const handleCardPress = () => {
    // Navigate to order details screen with enhanced data structure
    const orderDataToPass = {
      // Include direct identifiers for the new API
      id: fullOrderData?.id,
      transactionNumber: fullOrderData?.transactionNumber,
      
      // Include the full order data for fallback
      fullOrderData: fullOrderData,
      
      // Legacy format for backward compatibility
      invoiceNumber: fullOrderData?.transactionNumber || plantCode,
      plantFlight: airCargoDate,
      trackingNumber: fullOrderData?.trackingNumber || '1Z999AA1234567890',
      orderDate: fullOrderData?.orderDate ? new Date(fullOrderData.orderDate.seconds * 1000).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'Wednesday, January 8th 2025',
      plant: {
        image: image,
        code: plantCode,
        country: countryCode,
        name: plantName,
        variegation: variety,
        size: size,
        price: price,
        quantity: quantity,
      },
      deliveryAddress: '123 Main Street\nNew York, NY 10001\nUnited States',
    };
    
    console.log('OrderItemCard - Navigating with orderData:', orderDataToPass);
    navigation.navigate('OrderDetailsScreen', {
      orderData: orderDataToPass,
      activeTab: activeTab
    });
  };

  return (
    <TouchableOpacity style={styles.statusContainer} onPress={handleCardPress} activeOpacity={0.7}>
      {/* Status Row */}
      <View style={styles.statusRow}>
        {plantStatus ? (
          <Text style={[styles.status, styles.plantStatus]}>{plantStatus}</Text>
        ) : (
          <Text style={styles.status}>{status}</Text>
        )}
        {creditApproved && (
          <View style={styles.creditApprovedButton}>
            <Text style={styles.creditApprovedText}>Credit Approved</Text>
          </View>
        )}
      </View>

      {/* Flight Info Row */}
      <View style={styles.flightRow}>
        <View style={styles.flightInfo}>
          <CalendarIcon width={16} height={16} />
          <Text style={styles.cargoDate}>
            Plant Flight <Text style={styles.bold}>{airCargoDate}</Text>
          </Text>
        </View>
        <View style={styles.countryInfo}>
          <Text style={styles.countryCode}>{countryCode}</Text>
          <FlagIcon width={22} height={16} style={{marginLeft: 4}} />
        </View>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Main Content */}
        <View style={styles.contentRow}>
          <Image source={image} style={styles.plantImage} resizeMode="cover" />
          <View style={styles.infoCol}>
            <Text style={styles.plantName}>{plantName}</Text>
            <Text style={styles.variety}>
              {variety} • {size}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.quantity}>{quantity}x</Text>
            </View>
            {showRequestCredit && (
              <View style={styles.requestCreditContainer}>
                <TouchableOpacity
                  style={[
                    styles.requestCreditButton,
                    hasCreditRequest && styles.requestCreditButtonDisabled
                  ]}
                  onPress={handleRequestCredit}
                  disabled={hasCreditRequest}
                >
                  <Text style={[
                    styles.requestCreditText,
                    hasCreditRequest && styles.requestCreditTextDisabled
                  ]}>
                    Request Credit
                  </Text>
                </TouchableOpacity>
                {!hasCreditRequest && (
                  <Text style={styles.requestDeadline}>
                    Request by {requestDeadline}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    backgroundColor: '#F5F6F6',
    paddingVertical: 10,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  status: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#202325',
  },
  plantStatus: {
    color: '#E7522F',
  },
  creditApprovedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  creditApprovedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  flightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  flightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cargoDate: {
    fontSize: 14,
    color: '#647276',
    marginLeft: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#202325',
  },
  countryCode: {
    fontSize: 14,
    color: '#202325',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 180, // Increased to accommodate larger button
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
    borderRadius: 12,
    padding: 8,
  },
  plantImage: {
    width: 80, // Reduced width
    height: 100, // Reduced height
    borderRadius: 8,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from 'center' to 'flex-start'
    paddingLeft: 8, // Add some padding to separate from image
  },
  plantName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#202325',
    marginBottom: 2,
  },
  variety: {
    color: '#647276',
    fontSize: 14,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#202325',
  },
  quantity: {
    fontSize: 16,
    color: '#647276',
    fontWeight: '600',
  },
  requestCreditContainer: {
    marginTop: 12, // Increased margin for better spacing
    alignItems: 'flex-end',
    width: '100%', // Ensure full width
  },
  requestCreditButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12, // Changed back to 12px as per CSS
    paddingHorizontal: 12,
    width: 156, // Fixed width as per CSS
    height: 48, // Changed back to 48px as per CSS
    minHeight: 48,
    borderWidth: 2,
    borderColor: '#539461', // Green border color for active state
    borderRadius: 12,
  },
  requestCreditButtonDisabled: {
    borderColor: '#CDD3D4', // Disabled border color
    backgroundColor: '#FFFFFF', // Disabled background
  },
  requestCreditText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16, // Changed back to 16px as per CSS
    lineHeight: 16,
    color: '#539461', // Green text color for active state
  },
  requestCreditTextDisabled: {
    color: '#CDD3D4', // Disabled text color
  },
  requestDeadline: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12, // Reduced font size
    lineHeight: 16, // Reduced line height
    color: '#647276',
    textAlign: 'right',
    marginTop: 6, // Reduced margin
  },
});

export default OrderItemCard;
