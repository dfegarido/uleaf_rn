/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../auth/AuthProvider';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ShareIcon from '../../../assets/live-icon/share.svg';
import HeartIcon from '../../../assets/buyer-icons/heart.svg';
import WishListSelected from '../../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../../assets/buyer-icons/wishlist-unselected.svg';
import FlightIcon from '../../../assets/buyer-icons/flight.svg';
import CartIcon from '../../../assets/icontabs/buyer-tabs/cart-solid.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import {getPlantDetailApi} from '../../../components/Api/getPlantDetailApi';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

const ScreenPlantDetail = ({navigation, route}) => {
  const {user} = useAuth();
  const {plantCode} = route.params || {};

  // Plant data state
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageSource, setImageSource] = useState(
    require('../../../assets/buyer-icons/png/ficus-lyrata.png'),
  );

  // Load plant details when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (plantCode) {
        loadPlantDetails();
      }
    }, [plantCode]),
  );

  useEffect(() => {
    if (plantData?.imagePrimary) {
      setImageSource({uri: plantData.imagePrimary});
    }
  }, [plantData]);

  const loadPlantDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading plant details for:', plantCode);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getPlantDetailApi(plantCode), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load plant details');
      }

      console.log('Plant details loaded successfully:', res.data);
      console.log('Image Primary URL:', res.data?.imagePrimary);
      // Extract the nested data object from the response
      setPlantData(res.data);

    } catch (error) {
      console.error('Error loading plant details:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    console.log('Add to cart:', plantCode);
    // TODO: Implement add to cart functionality
    Alert.alert('Success', 'Plant added to cart!');
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    console.log('Wishlist toggled:', !isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const handleShare = () => {
    console.log('Share plant:', plantCode);
    // TODO: Implement share functionality
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#539461" />
        <Text style={styles.loadingText}>Loading plant details...</Text>
      </View>
    );
  }

  if (!plantData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plant not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Plant Image */}
      <Image
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => {
          console.log('Image load error:', error.nativeEvent.error);
          setImageSource(require('../../../assets/buyer-icons/png/ficus-lyrata.png'));
        }}
        onLoad={() => console.log('Image loaded successfully')}
      />
      


      <SafeAreaView style={styles.safeArea}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>


          {/* Content */}
          <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            {plantData.genus} {plantData.species}
          </Text>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.variegationLabel}>
              {plantData.variegation || 'Standard'}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mutation:</Text>
              <Text style={styles.detailValue}>
                {plantData.mutation || 'Not specified'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Country:</Text>
              {plantData.countryFlag ? (
                <Image
                  source={{uri: plantData.countryFlag}}
                  style={styles.flagImage}
                />
              ) : (
                <PhilippinesFlag width={28} height={19} style={styles.flagImage} />
              )}
              <Text style={styles.detailValue}>
                {plantData.country || 'Philippines'}
              </Text>
            </View>
          </View>

          {/* Social Bar */}
          <View style={styles.socialBar}>
            <View style={styles.leftControls}>
              <TouchableOpacity style={styles.socialButton}>
                <HeartIcon width={24} height={24} />
                <Text style={styles.socialText}>{plantData.loveCount || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAddToWishlist}>
                {isWishlisted ? (
                  <WishListSelected width={24} height={24} />
                ) : (
                  <WishListUnselected width={24} height={24} />
                )}
                <Text style={styles.socialText}>
                  {plantData.wishlistCount || 0}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <ShareIcon width={24} height={24} />
              <Text style={styles.socialText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Price and Pot Size */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${plantData.usdPriceNew || plantData.usdPrice || '0.00'}
            </Text>
            <View style={styles.shippingInfo}>
              <FlightIcon width={20} height={20} />
              <Text style={styles.shippingText}>
                Plant Flight {plantData.flightDate || 'TBD'}
              </Text>
            </View>
            <View style={styles.potSizeContainer}>
              <Text style={styles.potSizeLabel}>Pot Size:</Text>
              <Text style={styles.potSizeValue}>
                {plantData.potSize || 'Standard'}
              </Text>
            </View>
          </View>

          {/* Plant Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Plant Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailItemLabel}>Size</Text>
              <Text style={styles.detailItemValue}>
                {plantData.size || 'Medium'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailItemLabel}>Care Level</Text>
              <Text style={styles.detailItemValue}>
                {plantData.careLevel || 'Intermediate'}
              </Text>
            </View>
          </View>

          {/* Shipping Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailItemLabel}>Flight Date</Text>
              <Text style={styles.detailItemValue}>
                {plantData.flightDate || 'To be determined'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailItemLabel}>Shipping Index</Text>
              <Text style={styles.detailItemValue}>
                {plantData.shippingIndex || 'Standard'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailItemLabel}>Acclimation Index</Text>
              <Text style={styles.detailItemValue}>
                {plantData.acclimationIndex || 'Base Air Cargo'}
              </Text>
            </View>
          </View>

          {/* Payment Options */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            <View style={styles.paymentOptions}>
              <View style={styles.paymentOption}>
                <Text style={styles.paymentOptionText}>Venmo</Text>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.cartButton}>
            <CartIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowButton}>
            <Text style={styles.buyNowButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 440,
    zIndex: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#393D40',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(245, 246, 246, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(205, 211, 212, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 246, 246, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  imageCounter: {
    position: 'absolute',
    top: 360,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 10,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 400,
    paddingBottom: 106,
    zIndex: 5,
    minHeight: '70%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202325',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  variegationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7F8D91',
    width: 70,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    flex: 1,
  },
  flagImage: {
    width: 28,
    height: 19,
    borderRadius: 2,
  },
  socialBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E4E7E9',
  },
  leftControls: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#647276',
  },
  priceContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202325',
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shippingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#539461',
  },
  potSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  potSizeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  potSizeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#647276',
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#393D40',
  },
  detailItem: {
    gap: 2,
  },
  detailItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  detailItemValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7F8D91',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 96,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202325',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  cartButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyNowButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#414649',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ScreenPlantDetail;
