import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import FlightIcon from '../../assets/buyer-icons/flight.svg';
import WishListSelected from '../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../assets/buyer-icons/wishlist-unselected.svg';
import HeartIcon from '../../assets/buyer-icons/heart.svg';
import PhilippinesFlag from '../../assets/buyer-icons/philippines-flag.svg';
import ThailandFlag from '../../assets/buyer-icons/thailand-flag.svg';
import IndonesiaFlag from '../../assets/buyer-icons/indonesia-flag.svg';
import {calculatePlantFlightDate} from '../../utils/plantFlightUtils';

const placeholderImage = require('../../assets/buyer-icons/png/ficus-lyrata.png');
const placeholderFlag = require('../../assets/buyer-icons/philippines-flag.svg');
// const HeartIcon = require('../../assets/buyer-icons/heart.svg');
const noteIcon = require('../../assets/buyer-icons/note.svg');

// Function to get flag component based on country
const getFlagComponent = (country) => {
  const countryLower = country?.toLowerCase() || '';
  if (countryLower.includes('philippines') || countryLower.includes('ph')) {
    return PhilippinesFlag;
  } else if (countryLower.includes('thailand') || countryLower.includes('th')) {
    return ThailandFlag;
  } else if (countryLower.includes('indonesia') || countryLower.includes('id')) {
    return IndonesiaFlag;
  }
  return PhilippinesFlag; // Default to Philippines
};

const PlantItemCard = ({
  // Legacy props (for backward compatibility)
  image = placeholderImage,
  flag = placeholderFlag,
  title = 'Ficus lyrata',
  subtitle = 'Inner Variegated',
  price = '$65.27',
  likes = '5K',
  isWishlisted = false,
  onWishlistPress = () => {
    // Wishlist feature temporarily disabled
    console.log('Wishlist feature is temporarily disabled');
  },
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
    
  const displayTitle = data ? 
    (plantData.genus || plantData.plantName || 'Unknown Plant') :
    title;
    
  const displaySubtitle = data ? 
    (plantData.species || plantData.variegation || 'Plant Details') :
    subtitle;
    
  const displayPrice = data ? 
    (plantData.usdPriceNew ? `$${plantData.usdPriceNew}` : 
     plantData.usdPrice ? `$${plantData.usdPrice}` : 
     plantData.finalPrice ? `$${plantData.finalPrice}` :
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
    calculatePlantFlightDate({ 
      country: plantData.country || plantData.countryCode || 'TH' // Default to Thailand
    }) :
    calculatePlantFlightDate({ 
      country: country || 'TH' // Use country prop or default to Thailand
    });

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
              setImageError(true);
            }}
            onLoad={() => {
              // Image loaded successfully
            }}
            key={`${plantData?.plantCode || 'default'}-${imageError}`}
          />
          
          {/* Listing Type + Country Overlay */}
          <View style={styles.listingOverlay}>
            <View style={styles.listingTypeContainer}>
              <View style={styles.listingTypeBadge}>
                <Text style={styles.listingTypeText}>
                  {plantData.listingType || 'Single Plant'}
                </Text>
              </View>
            </View>
            <View style={styles.countryContainer}>
              {(() => {
                const FlagComponent = getFlagComponent(plantData.country);
                return <FlagComponent width={24} height={16} style={styles.countryFlag} />;
              })()}
            </View>
          </View>
          
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
            onPress={() => {
              // Wishlist feature temporarily disabled
              console.log('Wishlist feature is temporarily disabled');
            }}
            style={[styles.likeButton, {opacity: 0.5}]}
            disabled={true}>
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
    width: 150,
    height: 220,
  },
  imageContainer: {
    position: 'relative',
    width: 150,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  listingOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    zIndex: 1,
  },
  listingTypeContainer: {
    width: 126,
    height: 24,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  listingTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: '#202325',
    borderRadius: 6,
    height: 24,
    minHeight: 24,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  countryContainer: {
    width: 24,
    height: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  countryFlag: {
    width: 24,
    height: 16,
    borderRadius: 2,
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
    fontWeight: '500',
    fontSize: 18,
    color: '#23C16B',
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
