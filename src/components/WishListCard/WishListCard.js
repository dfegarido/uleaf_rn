import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import ShippingIcon from '../../assets/buyer-icons/truck-gray.svg';
import PlaneIcon from '../../assets/buyer-icons/plane-gray.svg';
import CloseIcon from '../../assets/buyer-icons/close.svg';
import {thFlag} from '../../assets/buyer-icons/png/index';

const WishListCard = ({
  image,
  name,
  variety,
  size,
  isWholesale,
  discountPercent,
  price,
  oldPrice,
  onBuyNow,
  onAddToCart,
  flightInfo,
  flightDate,
  countryFlag = thFlag,
  upsInfo,
  upsPrice,
  upsNote,
  onClose,
}) => {
  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <CloseIcon width={15} height={15} />
        </TouchableOpacity>
        <View style={styles.row}>
          <Image source={image} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.variety}>
              {variety} · {size}
            </Text>
            <View style={styles.badgesRow}>
              {isWholesale && (
                <View style={styles.wholesaleBadge}>
                  <Text style={styles.wholesaleText}>Wholesale</Text>
                </View>
              )}
              {discountPercent && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${price}</Text>
              {oldPrice && <Text style={styles.oldPrice}>${oldPrice}</Text>}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buyNowBtn} onPress={onBuyNow}>
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addToCartBtn}
                onPress={onAddToCart}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.shippingRow}>
        <PlaneIcon width={18} height={18} style={{marginRight: 4}} />
        <Text style={styles.flightInfo}>
          {flightInfo} <Text style={styles.bold}>{flightDate}</Text>
        </Text>
        <View style={{flex: 1}} />
        <Text>TH</Text>
        <Image source={countryFlag} style={styles.flag} />
      </View>
      <View style={styles.upsRow}>
        <ShippingIcon width={18} height={18} style={{marginRight: 4}} />
        <Text style={styles.upsInfo}>
          {upsInfo} <Text style={styles.bold}>${upsPrice}</Text>, {upsNote}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#F5F6F6',
    padding: 12,

    margin: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    paddingTop: 18,
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  image: {
    width: 96,
    height: 128,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#eee',
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#222',
  },
  variety: {
    color: '#7A7A7A',
    fontSize: 14,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wholesaleBadge: {
    backgroundColor: '#222',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 7,
  },
  wholesaleText: {
    color: '#fff',
    fontSize: 12,
  },
  discountBadge: {
    backgroundColor: '#FFE5E0',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  discountText: {
    color: '#FF5A36',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    color: '#2EAD5B',
    fontWeight: 'bold',
    fontSize: 20,
    marginRight: 10,
  },
  oldPrice: {
    color: '#888',
    textDecorationLine: 'line-through',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'flex-start',
  },
  buyNowBtn: {
    backgroundColor: '#4E9A5E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    flex: 1,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addToCartBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flex: 1,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 2,
    paddingHorizontal: 10,
  },
  flightInfo: {
    color: '#555',
    fontSize: 15,
    marginLeft: 6,
  },
  bold: {
    fontWeight: 'bold',
    color: '#222',
  },
  flag: {
    width: 28,
    height: 18,
    marginLeft: 8,
    borderRadius: 3,
    resizeMode: 'contain',
  },
  upsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  upsInfo: {
    color: '#555',
    fontSize: 15,
    marginLeft: 6,
  },
});

export default WishListCard;
