import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import FlightIcon from '../../assets/buyer-icons/flight.svg';
import WishListSelected from '../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../assets/buyer-icons/wishlist-unselected.svg';
import HeartIcon from '../../assets/buyer-icons/heart.svg';

const placeholderImage = require('../../assets/buyer-icons/png/ficus-lyrata.png');
const placeholderFlag = require('../../assets/buyer-icons/philippines-flag.svg');
// const HeartIcon = require('../../assets/buyer-icons/heart.svg');
const noteIcon = require('../../assets/buyer-icons/note.svg');

const PlantItemCard = ({
  image = placeholderImage,
  flag = placeholderFlag,
  title = 'Ficus lyrata',
  subtitle = 'Inner Variegated',
  price = '$65.27',
  likes = '5K',
  isWishlisted = false,
  onWishlistPress = () => {},
  onPress = () => {},
  flightDate = 'May-30',
}) => {
  return (
    <>
      <View style={{flexDirection: 'column'}}>
        <TouchableOpacity
          style={styles.card}
          onPress={onPress}
          activeOpacity={0.9}>
          <View style={styles.imageContainer}>
            <Image source={image} style={styles.image} resizeMode="cover" />
            <Image source={flag} style={styles.flag} />
          </View>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.row}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onWishlistPress}
              style={styles.likeButton}>
              {isWishlisted ? (
                <WishListSelected width={22} height={22} />
              ) : (
                <WishListUnselected width={20} height={20} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.row}>
            <Text style={styles.price}>{price}</Text>
            <Image source={noteIcon} style={styles.noteIcon} />
          </View>
          <View style={styles.flightRow}>
            <FlightIcon width={16} height={16} />
            <Text style={styles.flightText}>
              Plant Flight <Text style={styles.flightDate}>{flightDate}</Text>
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 2,
    margin: 11,
    width: 166,
    height: 220,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  flag: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 18,
    borderRadius: 4,
  },
  infoContainer: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
    tintColor: '#222',
  },
  likes: {
    fontSize: 14,
    color: '#222',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginVertical: 2,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  noteIcon: {
    width: 18,
    height: 18,
    tintColor: '#f66',
  },
  flightRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-start',
    marginTop: 6,
  },
  flightIcon: {
    width: 16,
    height: 16,
    tintColor: '#4caf50',
    marginRight: 4,
  },
  flightText: {
    color: '#647276',
    fontSize: 13,
  },
  flightDate: {
    fontWeight: '600',
    color: '#647276',
  },
});

export default PlantItemCard;
