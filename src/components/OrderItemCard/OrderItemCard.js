import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
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
}) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.status}>{status}</Text>
        <View style={styles.headerRight}>
          <CalendarIcon width={16} height={16} />
          <Text style={styles.cargoDate}>
            {' '}
            Air Cargo Date <Text style={styles.bold}>{airCargoDate}</Text>
          </Text>
          <Text style={styles.countryCode}>{countryCode}</Text>
          <FlagIcon width={22} height={16} style={{marginLeft: 4}} />
        </View>
      </View>
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
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#202325',
  },
  headerRight: {
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
    marginLeft: 8,
    marginRight: 2,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F6',
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
});

export default OrderItemCard;
