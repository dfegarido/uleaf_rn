import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CalendarIcon from '../../assets/icons/greylight/calendar-blank-regular.svg';
import ThailandFlag from '../../assets/buyer-icons/thailand-flag.svg';
import PhilippinesFlag from '../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../assets/buyer-icons/indonesia-flag.svg';
import PlaneGrayIcon from '../../assets/buyer-icons/plane-gray.svg';
import { getOrderDetailApi } from '../Api/orderManagementApi';

const JoinerOrderCard = ({
  status = 'Ready to Fly',
  airCargoDate = 'May-30',
  countryCode = 'TH',
  flag: FlagIcon = ThailandFlag,
  planeIcon: PlaneIcon = PlaneGrayIcon,
  image,
  plantName = 'Plant genus species name',
  variety = 'Inner Variegated',
  size = '2"',
  price = '$65.27',
  quantity = 1,
  plantCode = 'AA#####',
  fullOrderData = null,
  activeTab = null,
  joinerInfo = null, // { firstName, lastName, username, profilePhotoUrl }
  showRequestCredit = false, // Show Request Credit button (for Plants are Home)
  requestDeadline = 'May-31 12:00 AM', // Request deadline text
  creditRequestStatus = null, // Credit request status for this specific plant
  optimisticCreditRequest = false, // Optimistic state for credit requests (from Plants are Home)
}) => {
  const navigation = useNavigation();

  // Get country flag
  const getCountryFlag = (code) => {
    const flagMap = {
      'TH': ThailandFlag,
      'PH': PhilippinesFlag,
      'ID': IndonesiaFlag,
    };
    return flagMap[code] || IndonesiaFlag;
  };

  const FlagComponent = getCountryFlag(countryCode);

  // Resolve image
  const resolvedImageUri = (fullOrderData?.plantDetails && (
    (Array.isArray(fullOrderData.plantDetails.imageCollectionWebp) && fullOrderData.plantDetails.imageCollectionWebp[0]) ||
    fullOrderData.plantDetails.imagePrimaryWebp ||
    (Array.isArray(fullOrderData.plantDetails.imageCollection) && fullOrderData.plantDetails.imageCollection[0]) ||
    fullOrderData.plantDetails.image
  )) || (typeof image === 'string' ? image : null);

  // Format joiner name
  const joinerFullName = joinerInfo 
    ? `${joinerInfo.firstName || ''} ${joinerInfo.lastName || ''}`.trim() || joinerInfo.username || 'Joiner'
    : 'Joiner';
  const joinerUsername = joinerInfo?.username || '';

  // Check if a credit request has been submitted for this specific plant
  // Include optimistic state for immediate UI feedback
  // Check multiple sources: optimistic state, creditRequestStatus prop, fullOrderData.creditRequests array, and order.creditRequests
  const hasCreditRequest = optimisticCreditRequest ||
    creditRequestStatus?.hasRequest || 
    creditRequestStatus?.requests?.length > 0 ||
    fullOrderData?.creditRequests?.some((req) => req.plantCode === plantCode) ||
    fullOrderData?.order?.creditRequests?.some((req) => req.plantCode === plantCode);

  const handleRequestCredit = () => {
    // Prevent action if a request has already been made
    if (hasCreditRequest) {
      console.log('Credit request already submitted for this item.');
      return;
    }

    console.log('🏷️ JoinerOrderCard - Request Credit button pressed');
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

    navigation.navigate('ScreenRequestCredit', navigationData);
  };

  const handleCardPress = async () => {
    if (activeTab === 'Pay to Board') {
      return;
    }

    const formatOrderDate = (value) => {
      if (!value) return 'Unknown';
      try {
        if (typeof value === 'string') {
          const d = new Date(value);
          if (!isNaN(d)) return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          return value;
        }
        if (typeof value === 'object' && (value._seconds != null || value.seconds != null)) {
          const s = value._seconds ?? value.seconds;
          const d = new Date(s * 1000);
          return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (value instanceof Date) {
          return value.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        return String(value);
      } catch {
        return 'Unknown';
      }
    };

    // Extract the correct plantCode from the order data itself (most reliable source)
    // Priority: fullOrderData.plantCode > fullOrderData.products[0].plantCode > prop plantCode
    const actualPlantCode = fullOrderData?.plantCode || 
                            fullOrderData?.products?.[0]?.plantCode || 
                            fullOrderData?.products?.[0]?.plant?.plantCode ||
                            plantCode;

    console.log('🔍 JoinerOrderCard - Extracting plantCode:', {
      propPlantCode: plantCode,
      fullOrderDataPlantCode: fullOrderData?.plantCode,
      productsPlantCode: fullOrderData?.products?.[0]?.plantCode,
      actualPlantCode: actualPlantCode,
      transactionNumber: fullOrderData?.transactionNumber
    });

    // Ensure fullOrderData has plantCode at root level for single-plant order processing
    const enrichedFullOrderData = {
      ...fullOrderData,
      plantCode: actualPlantCode, // Use the actual plantCode from order data
    };

    const orderDataToPass = {
      id: enrichedFullOrderData?.id,
      transactionNumber: enrichedFullOrderData?.transactionNumber,
      plantCode: actualPlantCode, // Use the actual plantCode extracted from order data
      fullOrderData: enrichedFullOrderData,
      invoiceNumber: fullOrderData?.transactionNumber || plantCode,
      plantFlight: airCargoDate,
      trackingNumber: fullOrderData?.trackingNumber || '1Z999AA1234567890',
      orderDate: formatOrderDate(fullOrderData?.orderDate) || 'Wednesday, January 8th 2025',
      plant: {
        image: resolvedImageUri || image,
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

    navigation.navigate('OrderDetailsScreen', { 
      orderData: orderDataToPass, 
      activeTab: activeTab 
    });
  };

  return (
    <TouchableOpacity style={styles.statusContainer} onPress={handleCardPress} activeOpacity={0.7}>
      {/* Plant / Fulfillment Status */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {/* Plant / Flight Date */}
      <View style={styles.flightRow}>
        <View style={styles.flightInfo}>
          <PlaneIcon width={16} height={16} />
          <Text style={styles.flightText}>
            Plant Flight <Text style={styles.bold}>{airCargoDate}</Text>
          </Text>
        </View>
        <View style={styles.countryInfo}>
          <Text style={styles.countryCode}>{countryCode}</Text>
          <FlagComponent width={22} height={16} style={{marginLeft: 4}} />
        </View>
      </View>

      {/* User Section */}
      {joinerInfo && (
        <View style={styles.userSection}>
          <View style={styles.userCard}>
            <View style={styles.userRow}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {joinerInfo.profilePhotoUrl ? (
                  <Image 
                    source={{ uri: joinerInfo.profilePhotoUrl }} 
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {(joinerInfo.firstName?.[0] || joinerInfo.username?.[0] || 'J').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.userContent}>
                {/* Name */}
                <View style={styles.nameRow}>
                  <Text style={styles.nameText} numberOfLines={1}>{joinerFullName}</Text>
                  {joinerUsername && (
                    <Text style={styles.usernameText} numberOfLines={1}>@{joinerUsername}</Text>
                  )}
                </View>
                {/* Role */}
                <View style={styles.roleRow}>
                  <Text style={styles.roleLabel}>Joiner</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Plant Card */}
      <View style={styles.card}>
        <View style={styles.contentRow}>
          <Image
            source={resolvedImageUri ? { uri: resolvedImageUri } : (typeof image === 'object' ? image : require('../../assets/images/plant1.png'))}
            style={styles.plantImage}
            resizeMode="cover"
          />
          <View style={styles.infoCol}>
            <Text style={styles.plantName}>{plantName}</Text>
            <Text style={styles.variety}>
              {variety} • {size}
            </Text>
            {activeTab !== 'Pay to Board' && (
              <View style={styles.priceRow}>
                {activeTab !== 'Ready to Fly' && activeTab !== 'Plants are Home' && activeTab !== 'Journey Mishap' && (
                  <Text style={styles.price}>{price}</Text>
                )}
                <Text style={styles.quantity}>{quantity}x</Text>
              </View>
            )}
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
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#202325',
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
  flightText: {
    fontSize: 14,
    color: '#647276',
    marginLeft: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#202325',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryCode: {
    fontSize: 14,
    color: '#202325',
    fontWeight: '600',
  },
  userSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 1000,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#539461',
  },
  userContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    marginBottom: 2,
  },
  nameText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flexShrink: 1,
  },
  usernameText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  roleLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 8,
  },
  plantImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 8,
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
  // Request Credit Section (Plants are Home)
  requestCreditContainer: {
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 12,
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
  requestDeadline: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
});

export default JoinerOrderCard;

