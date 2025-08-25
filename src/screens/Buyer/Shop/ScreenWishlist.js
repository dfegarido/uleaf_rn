import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AvatarIcon from '../../../assets/images/avatar.svg';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import WishListCard from '../../../components/WishListCard/WishListCard';
import {wishlist1} from '../../../assets/buyer-icons/png/index';

const products = [
  {
    image: wishlist1,
    name: 'Plant One',
    variety: 'Alocasia',
    size: '120cm',
    isWholesale: false,
    discountPercent: 10,
    price: 100,
    oldPrice: 120,
    flightInfo: 'Flight Info',
    flightDate: '2025-01-01',
    upsInfo: 'UPS 2nd Day',
    upsPrice: 50,
    upsNote: 'add-on wholesale order $50',
  },
  {
    image: wishlist1,
    name: 'Plant Two',
    variety: 'Anthurium',
    size: '80cm',
    isWholesale: true,
    discountPercent: 20,
    price: 80,
    oldPrice: 100,
    flightInfo: 'Flight Info',
    flightDate: '2025-02-01',
    upsInfo: 'UPS 2nd Day',
    upsPrice: 40,
    upsNote: 'add-on wholesale order $40',
  },
  {
    image: wishlist1,
    name: 'Plant Three',
    variety: 'Begonia',
    size: '60cm',
    isWholesale: false,
    discountPercent: 15,
    price: 60,
    oldPrice: 70,
    flightInfo: 'Flight Info',
    flightDate: '2025-03-01',
    upsInfo: 'UPS 2nd Day',
    upsPrice: 30,
    upsNote: 'add-on wholesale order $30',
  },
  {
    image: wishlist1,
    name: 'Plant Four',
    variety: 'Philodendron',
    size: '90cm',
    isWholesale: true,
    discountPercent: 25,
    price: 90,
    oldPrice: 120,
    flightInfo: 'Flight Info',
    flightDate: '2025-04-01',
    upsInfo: 'UPS 2nd Day',
    upsPrice: 45,
    upsNote: 'add-on wholesale order $45',
  },
  {
    image: wishlist1,
    name: 'Plant Five',
    variety: 'Monstera',
    size: '100cm',
    isWholesale: false,
    discountPercent: 5,
    price: 110,
    oldPrice: 130,
    flightInfo: 'Flight Info',
    flightDate: '2025-05-01',
    upsInfo: 'UPS 2nd Day',
    upsPrice: 55,
    upsNote: 'add-on wholesale order $55',
  },
];

const ScreenWishlist = ({navigation}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  return (
    <>
      <View style={styles.container}>
        <View style={[styles.header, {paddingTop: insets.top + 10}]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackSolidIcon width={24} height={24} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Wish List</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ScreenProfile')}>
            <AvatarIcon width={32} height={32} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: totalBottomPadding}}>
          {products.map((product, idx) => (
            <WishListCard key={idx} {...product} />
          ))}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#393D40',
  },
});

export default ScreenWishlist;
