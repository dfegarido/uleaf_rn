import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
// Removed image caching (AsyncStorage) usage
import FlightIcon from '../../assets/buyer-icons/flight.svg';
import WishListSelected from '../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../assets/buyer-icons/wishlist-unselected.svg';
import HeartIcon from '../../assets/buyer-icons/heart.svg';
import PhilippinesFlag from '../../assets/buyer-icons/philippines-flag.svg';
import ThailandFlag from '../../assets/buyer-icons/thailand-flag.svg';
import IndonesiaFlag from '../../assets/buyer-icons/indonesia-flag.svg';
import { formatCurrencyFull } from '../../utils/formatCurrency';

const placeholderImage = require('../../assets/buyer-icons/png/ficus-lyrata.png');
const placeholderFlag = require('../../assets/buyer-icons/philippines-flag.svg');
// const HeartIcon = require('../../assets/buyer-icons/heart.svg');
const noteIcon = require('../../assets/buyer-icons/note.svg');

// Function to get flag component based on country
// Helper function to map currency codes to country codes
const mapCurrencyToCountry = (localCurrency) => {
  if (!localCurrency) return null;
  
  switch (localCurrency.toUpperCase()) {
    case 'PHP':
      return 'PH';
    case 'THB':
      return 'TH';
    case 'IDR':
      return 'ID';
    default:
      return null;
  }
};

const getFlagComponent = (country, localCurrency) => {
  // First try to use the country field if available
  let countryCode = country;
  
  // If no country field, try to map from localCurrency
  if (!countryCode && localCurrency) {
    countryCode = mapCurrencyToCountry(localCurrency);
  }
  
  const countryLower = countryCode?.toLowerCase() || '';
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
  },
  onPress = () => {},
  flightDate = 'May-30',
  country = null,
  localCurrency = null,
  // New props
  data = null,
  onAddToCart = () => {},
  style = {},
  cardStyle = {}, // override internal card dimensions/styling
}) => {
  const navigation = useNavigation();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  // Placeholder state/effect retained after removing caching hooks to keep hook order stable during fast refresh
  const [_removedCacheHook] = React.useState(null);
  React.useEffect(() => { /* no-op */ }, []);
  
  // If data prop is provided, use it; otherwise fall back to individual props
  const plantData = data || {};
  
  // Removed AsyncStorage-based image caching effect
  
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
  
  const resolvedPrimary = plantData.imagePrimaryWebp || plantData.imagePrimary || (Array.isArray(plantData.imageCollectionWebp) && plantData.imageCollectionWebp[0]) || plantData.imagePrimaryOriginal;
  const displayImage = data ? (resolvedPrimary ? { uri: resolvedPrimary } : placeholderImage) : image;
  
  // Debug logging
    
  const displayTitle = data ? 
    (plantData.genus || plantData.plantName || 'Unknown Plant') :
    title;
    
  const displaySubtitle = data ? 
    (plantData.species || plantData.variegation || 'Plant Details') :
    subtitle;
    
  // Pricing logic (updated to always prioritize usdPriceNew)
  // Always use usdPriceNew as the primary displayed price when available
  const displayPrice = data ? (
    plantData.usdPriceNew != null ? formatCurrencyFull(plantData.usdPriceNew) :
    plantData.finalPrice != null ? formatCurrencyFull(plantData.finalPrice) :
    plantData.usdPrice != null ? formatCurrencyFull(plantData.usdPrice) :
    plantData.localPriceNew != null ? formatCurrencyFull(plantData.localPriceNew) :
    plantData.localPrice != null ? formatCurrencyFull(plantData.localPrice) :
    'Price N/A'
  ) : price;

  // Determine strike-through (original) price for discounted items
  // Prefer originalPrice from API, but ensure we're showing a valid comparison
  const rawOriginal = data ? (
    plantData.originalPrice != null && plantData.usdPriceNew != null ? plantData.originalPrice : 
    plantData.usdPrice != null && plantData.usdPriceNew != null ? plantData.usdPrice : 
    null
  ) : null;
  const showStrikethrough = data && rawOriginal != null && plantData.usdPriceNew != null && rawOriginal > plantData.usdPriceNew;
    
  const displayLikes = data ? 
    (plantData.loveCount ? `${plantData.loveCount}` : '0') :
    likes;
    
  const displayFlag = data ? 
    (plantData.countryFlag && plantData.countryFlag.trim() !== '' ? 
      {uri: plantData.countryFlag} : 
      placeholderFlag) :
    flag;
    
  const displayFlightDate = data ? 
    // Use backend-provided plantFlightDate or fallback to 'N/A'
    (plantData.plantFlightDate || 'N/A') :
    // Legacy support: Use provided flightDate prop or fallback to 'N/A'
    (flightDate || 'N/A');

  // Determine if discounted for badge (prioritizing usdPriceNew for all discount calculations)
  const hasDiscount = !!(data && (
    (plantData.discountPercent && plantData.discountPercent > 0) ||
    (plantData.originalPrice && plantData.usdPriceNew && plantData.originalPrice > plantData.usdPriceNew) ||
    (plantData.usdPrice && plantData.usdPriceNew && plantData.usdPrice > plantData.usdPriceNew)
  ));

  // Compute discount percent (prefer backend discountPercent, else derive from originalPrice/usdPriceNew)
  let derivedDiscountPercent = null;
  if (hasDiscount) {
    if (plantData.discountPercent && plantData.discountPercent > 0) {
      // Use backend-provided discount percent if available
      derivedDiscountPercent = Math.round(plantData.discountPercent);
    } else if (plantData.originalPrice && plantData.usdPriceNew && plantData.originalPrice > plantData.usdPriceNew) {
      // Calculate discount from originalPrice and usdPriceNew
      const original = parseFloat(plantData.originalPrice);
      const current = parseFloat(plantData.usdPriceNew);
      if (original > 0 && current < original) {
        derivedDiscountPercent = Math.round(((original - current) / original) * 100);
      }
    } else if (plantData.usdPrice && plantData.usdPriceNew && plantData.usdPrice > plantData.usdPriceNew) {
      // Calculate discount from usdPrice and usdPriceNew
      const original = parseFloat(plantData.usdPrice);
      const current = parseFloat(plantData.usdPriceNew);
      if (original > 0 && current < original) {
        derivedDiscountPercent = Math.round(((original - current) / original) * 100);
      }
    }
  }

  return (
    <View style={[{flexDirection: 'column'}, style]}>
      <TouchableOpacity
        style={[styles.card, cardStyle]}
        onPress={handleCardPress}
        activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image 
            source={displayImage} 
            style={styles.image} 
            resizeMode="cover"
            onError={(error) => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => {
              setImageLoading(false);
            }}
            onLoadStart={() => {
              setImageLoading(true);
            }}
            key={`${plantData?.plantCode || 'default'}-${imageError}`}
          />
          
          {/* Loading Overlay */}
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#7CBD58" />
            </View>
          )}
          
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
                const FlagComponent = getFlagComponent(plantData.country, plantData.localCurrency);
                return <FlagComponent width={24} height={16} style={styles.countryFlag} />;
              })()}
            </View>
          </View>
          
          {/* Discount Badge (using "Snip & Save" instead of percentage) */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>Snip & Save</Text>
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
        <View style={styles.priceRow}>
          <Text style={styles.price}>{displayPrice}</Text>
          {showStrikethrough && (
            <Text style={styles.oldPrice}> {formatCurrencyFull(rawOriginal)}</Text>
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
  skeletonImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
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
    paddingVertical: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  discountText: {
    color: '#E7522F',
    fontSize: 11,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    zIndex: 2,
  },
});

export default PlantItemCard;
