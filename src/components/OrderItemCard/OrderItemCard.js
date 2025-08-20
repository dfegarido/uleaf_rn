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
  // Journey Mishap specific props
  showCreditStatus = false, // Show credit status section
  issueType = 'Unknown Issue', // Type of issue (Missing, Dead on Arrival, Damaged)
  creditStatus = 'pending', // Credit request status
}) => {
  const navigation = useNavigation();

  // Create plant data object for utility function
  const plantData = {
    country: countryCode,
    // You can add other relevant plant data fields here if needed
  };

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
      {/* Status Row - Hidden for Journey Mishap cards */}
      {!showCreditStatus && (
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
      )}

      {/* Flight Info Row */}
      {!showCreditStatus && (
        <View style={styles.flightRow}>
          <View style={styles.flightInfo}>
            <CalendarIcon width={16} height={16} />
            <Text style={styles.cargoDate}>
              Plant Flight <Text style={styles.bold}>{plantData?.plantFlightDate || airCargoDate || 'N/A'}</Text>
            </Text>
          </View>
          <View style={styles.countryInfo}>
            <Text style={styles.countryCode}>{countryCode}</Text>
            <FlagIcon width={22} height={16} style={{marginLeft: 4}} />
          </View>
        </View>
      )}

      {/* Journey Mishap Details Section */}
      {showCreditStatus && (
        <View style={styles.journeyMishapDetails}>
          {/* Plant / Fulfillment Status */}
          <View style={styles.plantFulfillmentStatus}>
            <Text style={styles.issueTypeText}>{issueType}</Text>
            <View style={[
              styles.creditStatusBadge,
              getCreditStatusBadgeStyle(creditRequestStatus || creditStatus)
            ]}>
              <Text style={styles.creditStatusText}>
                {(creditRequestStatus || creditStatus) === 'pending' ? 'Credit Requested' :
                 (creditRequestStatus || creditStatus) === 'approved' ? 'Credit Approved' :
                 (creditRequestStatus || creditStatus) === 'processed' ? 'Credit Completed' :
                 (creditRequestStatus || creditStatus) === 'rejected' ? 'Credit Rejected' :
                 'Credit Requested'}
              </Text>
            </View>
          </View>

          {/* Plant / Flight Date */}
          <View style={styles.plantFlightDate}>
            <View style={styles.flightContent}>
              <CalendarIcon width={24} height={24} />
              <Text style={styles.flightDateText}>Plant Flight {plantData?.plantFlightDate || airCargoDate || 'N/A'}</Text>
            </View>
            <View style={styles.countrySection}>
              <Text style={styles.countryText}>{countryCode}</Text>
              <FlagIcon width={24} height={16} style={{marginLeft: 6}} />
            </View>
          </View>
        </View>
      )}

      {/* Main Card */}
      <View style={[
        styles.card,
        showRequestCredit ? styles.cardWithButton : styles.cardCompact
      ]}>
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
    marginVertical: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 12,
  },
  cardWithButton: {
    minHeight: 180, // Larger height for cards with request credit button
  },
  cardCompact: {
    minHeight: 120, // Smaller height for Journey Mishap and other cards without button
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
  
  /*
  CSS Design Specification for Journey Mishap Details:
  
  Details - Auto layout
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 6px;
  gap: 12px;
  width: 351px;
  height: 64px;
  flex: none;
  order: 0;
  align-self: stretch;
  flex-grow: 0;

  Plant / Fulfillment Status - Auto layout
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 10px;
  width: 339px;
  height: 28px;
  flex: none;
  order: 0;
  align-self: stretch;
  flex-grow: 0;

  Text
  width: 194px;
  height: 24px;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-size: 18px;
  line-height: 24px;
  color: #E7522F;
  flex: none;
  order: 0;
  flex-grow: 1;

  Credit Status - Auto layout
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px 8px 1px;
  width: 135px;
  height: 28px;
  min-height: 28px;
  background: #48A7F8;
  border-radius: 8px;
  flex: none;
  order: 1;
  flex-grow: 0;

  Label
  width: 119px;
  height: 20px;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 140%;
  color: #FFFFFF;
  flex: none;
  order: 0;
  flex-grow: 0;

  Plant / Flight Date - Auto layout
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 113px;
  width: 339px;
  height: 24px;
  flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0;

  Content - Auto layout
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 183px;
  height: 24px;
  flex: none;
  order: 0;
  flex-grow: 0;

  Icon
  width: 24px;
  height: 24px;
  flex: none;
  order: 0;
  flex-grow: 0;

  Vector
  position: absolute;
  left: 9.38%;
  right: 12.48%;
  top: 12.48%;
  bottom: 9.37%;
  background: #556065;

  Text
  width: 153px;
  height: 22px;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 140%;
  color: #556065;
  flex: none;
  order: 1;
  flex-grow: 0;

  Country - Auto layout
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 53px;
  height: 22px;
  flex: none;
  order: 1;
  flex-grow: 0;

  Country
  width: 23px;
  height: 22px;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 140%;
  color: #556065;
  flex: none;
  order: 0;
  flex-grow: 0;

  TH Flag
  width: 24px;
  height: 16px;
  border-radius: 2px;
  flex: none;
  order: 1;
  flex-grow: 0;

  Basic / User - Auto layout
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  display: none;
  width: 345px;
  height: 44px;
  border-radius: 12px;
  flex: none;
  order: 2;
  flex-grow: 0;
  */
  
  // Journey Mishap Details Styles
  journeyMishapDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 12,
    width: '100%',
    height: 64,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  plantFulfillmentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 10,
    width: '100%',
    height: 28,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  issueTypeText: {
    width: 194,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#E7522F',
    order: 0,
    flexGrow: 1,
  },
  creditStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    paddingBottom: 2,
    width: 135,
    height: 28,
    minHeight: 28,
    backgroundColor: '#48A7F8',
    borderRadius: 8,
    order: 1,
    flexGrow: 0,
  },
  creditStatusText: {
    width: 119,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#FFFFFF',
    order: 0,
    flexGrow: 0,
  },
  plantFlightDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 113,
    width: '100%',
    height: 24,
    order: 1,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  flightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 6,
    width: 183,
    height: 24,
    order: 0,
    flexGrow: 0,
  },
  flightDateText: {
    width: 153,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#556065',
    order: 1,
    flexGrow: 0,
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginRight: 12,
    paddingVertical: 0,
    gap: 6,
    width: 53,
    height: 22,
    order: 1,
    flexGrow: 0,
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
    order: 0,
    flexGrow: 0,
  },
});

export default OrderItemCard;
