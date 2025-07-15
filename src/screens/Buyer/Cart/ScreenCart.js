/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import SearchIcon from '../../../assets/iconnav/search.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import {useNavigation} from '@react-navigation/native';

import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import NewArrivalsIcon from '../../../assets/buyer-icons/megaphone.svg';
import PriceDropIcon from '../../../assets/buyer-icons/price-drop-icons.svg';
import PromoBadge from '../../../components/PromoBadge/PromoBadge';
import CloseIcon from '../../../assets/buyer-icons/close.svg';
// import {selectedCard} from '../../../assets/buyer-icons/png';

const CartHeader = () => {
  const promoBadges = [
    {label: 'Price Drop', icon: PriceDropIcon},
    {label: 'New Arrivals', icon: NewArrivalsIcon},
    {label: 'Latest Nursery Drop', icon: LeavesIcon},
    {label: 'Below $20', icon: PriceTagIcon},
    {label: 'Unicorn', icon: UnicornIcon},
    {label: 'Top 5 Buyer Wish List', icon: Top5Icon},
  ];

  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ileafU"
                placeholderTextColor="#647276"
                value={searchText}
                onChangeText={setSearchText}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('')}>
            <Wishicon width={40} height={40} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.profileContainer}>
          <View style={styles.avatar}>
            <AvatarIcon width={32} height={32} />
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0, paddingVertical: 1}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 6,
          alignItems: 'flex-start',
          paddingHorizontal: 9,
        }}>
        {promoBadges.map(badge => (
          <PromoBadge
            key={badge.label}
            icon={badge.icon}
            label={badge.label}
            style={{marginRight: 5}}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const CartComponent = ({
  image,
  name,
  subtitle,
  price,
  flightInfo,
  shippingInfo,
  flagIcon,
  checked,
  onRemove,
}) => (
  <View style={styles.cartCard}>
    <View style={styles.cartTopCard}>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View
          style={[
            styles.cartImageContainer,
            {borderColor: checked ? '#4CAF50' : 'transparent'},
          ]}>
          <Image source={image} style={styles.cartImage} />
          {checked && (
            <View style={styles.cartCheckOverlay}>
              <Image source={selectedCard} style={{width: 24, height: 24}} />
            </View>
          )}
        </View>
        <View style={{flex: 1, marginLeft: 10}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <Text style={styles.cartName}>{name}</Text>
            <TouchableOpacity onPress={onRemove}>
              <CloseIcon style={{marginTop: 5}} width={15} height={15} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cartSubtitle}>{subtitle}</Text>
          <Text style={styles.cartPrice}>${price}</Text>
        </View>
      </View>
    </View>
    <View style={styles.cartFooterRow}>
      <Text style={styles.cartFooterText}>✈️ {flightInfo}</Text>
      {flagIcon}
    </View>
    <View style={styles.cartFooterRow}>
      <Text style={styles.cartFooterText}>🚚 {shippingInfo}</Text>
    </View>
  </View>
);

const cartItems = Array.from({length: 10}).map((_, i) => ({
  id: i,
  image: require('../../../assets/images/plant1.png'),
  name: 'Spinacia Oleracea',
  subtitle: 'Inner Variegated • 2"',
  price: '65.27',
  flightInfo: 'Plant Flight May-30',
  shippingInfo: 'UPS 2nd Day $50, add-on plant $5',
  flagIcon: <Text style={{fontSize: 18}}>🇹🇭</Text>,
  checked: true,
}));

const ScreenCart = () => {
  return (
    <View style={styles.container}>
      <CartHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{paddingBottom: 170}}
        showsVerticalScrollIndicator={false}>
        {cartItems.map(item => (
          <CartComponent
            key={item.id}
            image={item.image}
            name={item.name}
            subtitle={item.subtitle}
            price={item.price}
            flightInfo={item.flightInfo}
            shippingInfo={item.shippingInfo}
            flagIcon={item.flagIcon}
            checked={item.checked}
            onRemove={() => {}}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    width: '100%',
    height: 100,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
    width: '100%',
    height: 58,
  },
  searchContainer: {
    flex: 1,
    height: 40,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  profileContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 1000,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 50,
    backgroundColor: '#E7522F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartCard: {
    backgroundColor: '#F5F6F6',
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cartTopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  cartImageContainer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    width: 96,
    height: 128,
    position: 'relative',
  },
  cartImage: {
    width: 96,
    height: 128,
    borderRadius: 12,
  },
  cartCheckOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,

    borderRadius: 10,
    padding: 2,
    zIndex: 2,
  },
  cartName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
  },
  cartSubtitle: {
    color: '#647276',
    fontSize: 14,
    marginVertical: 2,
  },
  cartPrice: {
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 2,
  },
  cartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'space-between',
  },
  cartFooterText: {
    color: '#647276',
    fontWeight: 'bold',
  },
});
export default ScreenCart;
