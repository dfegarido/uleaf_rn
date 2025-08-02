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
}) => {
  const navigation = useNavigation();

  const handleRequestCredit = () => {
    navigation.navigate('ScreenRequestCredit');
  };
  return (
    <View style={styles.statusContainer}>
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
                  style={styles.requestCreditButton}
                  onPress={handleRequestCredit}>
                  <Text style={styles.requestCreditText}>Request Credit</Text>
                </TouchableOpacity>
                <Text style={styles.requestDeadline}>
                  Request by {requestDeadline}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
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
    height: 160,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
  },
  plantImage: {
    width: 96,
    height: 128,
    borderRadius: 8,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
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
    marginTop: 8,
    alignItems: 'flex-end',
  },
  requestCreditButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  requestCreditText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  requestDeadline: {
    fontSize: 12,
    color: '#647276',
    marginTop: 4,
  },
});

export default OrderItemCard;
