import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import FlightIcon from '../../assets/buyer-icons/flight.svg';
import WishListSelected from '../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../assets/buyer-icons/wishlist-unselected.svg';
import HeartIcon from '../../assets/buyer-icons/heart.svg';

const placeholderImage = require('../../assets/buyer-icons/png/ficus-lyrata.png');
const placeholderFlag = require('../../assets/buyer-icons/philippines-flag.svg');
// const HeartIcon = require('../../assets/buyer-icons/heart.svg');
const noteIcon = require('../../assets/buyer-icons/note.svg');

const PlantItemCard = ({
  // Legacy props (for backward compatibility)
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
  // New props
  data = null,
  onAddToCart = () => {},
  style = {},
}) => {
  const navigation = useNavigation();
  const [imageError, setImageError] = React.useState(false);
  
  // If data prop is provided, use it; otherwise fall back to individual props
  const plantData = data || {};
  
  // Reset image error when plant data changes
  React.useEffect(() => {
    setImageError(false);
  }, [plantData?.plantCode, plantData?.imagePrimary]);
  
  const handleCardPress = () => {
    if (data && plantData.plantCode) {
      // Navigate to plant detail screen with plantCode
      navigation.navigate('ScreenPlantDetail', {
        plantCode: plantData.plantCode,
      });
    } else {
      // Fallback to legacy onPress prop
      onPress();
    }
  };
  
  const displayImage = data ? 
    (plantData.imagePrimary && plantData.imagePrimary.trim() !== '' && !imageError ? 
      {uri: plantData.imagePrimary} : 
      placeholderImage) : 
    image;
  
  // Debug logging
  if (data && plantData?.plantCode) {
    console.log(`PlantItemCard ${plantData.plantCode}:`, {
      imagePrimary: plantData.imagePrimary,
      displayImage: displayImage,
      hasImageUri: displayImage.uri ? 'yes' : 'no',
      imageError: imageError
    });
  }
    
  const displayTitle = data ? 
    (plantData.genus || plantData.plantName || 'Unknown Plant') :
    title;
    
  const displaySubtitle = data ? 
    (plantData.species || plantData.variegation || 'Plant Details') :
    subtitle;
    
  const displayPrice = data ? 
    (plantData.usdPriceNew ? `$${plantData.usdPriceNew}` : 
     plantData.usdPrice ? `$${plantData.usdPrice}` : 
     plantData.localPriceNew ? `${plantData.localCurrencySymbol || '$'}${plantData.localPriceNew}` :
     plantData.localPrice ? `${plantData.localCurrencySymbol || '$'}${plantData.localPrice}` : 
     'Price N/A') :
    price;
    
  const displayLikes = data ? 
    (plantData.loveCount ? `${plantData.loveCount}` : '0') :
    likes;
    
  const displayFlag = data ? 
    (plantData.countryFlag && plantData.countryFlag.trim() !== '' ? 
      {uri: plantData.countryFlag} : 
      placeholderFlag) :
    flag;
    
  const displayFlightDate = data ? 
    (plantData.flightDate || 'TBD') :
    flightDate;

  return (
    <View style={[{flexDirection: 'column'}, style]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleCardPress}
        activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image 
            source={displayImage} 
            style={styles.image} 
            resizeMode="cover"
            onError={(error) => {
              console.log('PlantItemCard image load error:', {
                plantCode: plantData?.plantCode,
                imagePrimary: plantData?.imagePrimary,
                error: error.nativeEvent.error
              });
              setImageError(true);
            }}
            onLoad={() => {
              if (data && plantData?.plantCode) {
                console.log(`Image loaded successfully for ${plantData.plantCode}`);
              }
            }}
            key={`${plantData?.plantCode || 'default'}-${imageError}`}
          />
          <Image 
            source={displayFlag} 
            style={styles.flag}
            onError={(error) => {
              console.log('PlantItemCard flag error:', error.nativeEvent.error);
            }}
            defaultSource={placeholderFlag}
          />
          
          {/* Discount Badge */}
          {data && (plantData.discountPercent > 0 || plantData.discountPrice > 0) && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {plantData.discountPercent > 0 
                  ? `${plantData.discountPercent}% OFF`
                  : `$${plantData.discountPrice} OFF`
                }
              </Text>
            </View>
          )}
          
          {/* Love Count Badge */}
          <View style={styles.loveBadge}>
            <HeartIcon width={16} height={16} />
            <Text style={styles.loveCount}>{displayLikes}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={2}>{displayTitle}</Text>
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
        <Text style={styles.subtitle} numberOfLines={1}>{displaySubtitle}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{displayPrice}</Text>
          {data && plantData.usdPriceNew && plantData.usdPrice && plantData.usdPrice > plantData.usdPriceNew && (
            <Text style={styles.oldPrice}>${plantData.usdPrice}</Text>
          )}
        </View>
        
        <View style={styles.flightRow}>
          <FlightIcon width={16} height={16} />
          <Text style={styles.flightText}>
            Plant Flight <Text style={styles.flightDate}>{displayFlightDate}</Text>
          </Text>
        </View>
      </View>
    </View>
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
  discountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    backgroundColor: '#FFE7E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  discountText: {
    color: '#E7522F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loveBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loveCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#393D40',
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
    color: '#202325',
    lineHeight: 22,
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
    color: '#539461',
  },
  oldPrice: {
    fontSize: 14,
    color: '#7F8D91',
    textDecorationLine: 'line-through',
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
