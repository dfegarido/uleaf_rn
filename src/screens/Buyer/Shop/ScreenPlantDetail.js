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
  Modal,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../auth/AuthProvider';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ShareIcon from '../../../assets/buyer-icons/share-gray.svg';
import HeartIcon from '../../../assets/icons/greylight/heart-regular.svg';
import HeartSolidIcon from '../../../assets/buyer-icons/heart.svg';
import WishListSelected from '../../../assets/buyer-icons/wishlist-selected.svg';
import WishListUnselected from '../../../assets/buyer-icons/wishlist-unselected.svg';
import FlightIcon from '../../../assets/buyer-icons/flight.svg';
import PlaneIcon from '../../../assets/buyer-icons/plane-gray.svg';
import FlakesIcon from '../../../assets/icons/greylight/flakes.svg';
import TruckIcon from '../../../assets/buyer-icons/truck-gray.svg';
import BoxIcon from '../../../assets/icons/greylight/box-regular.svg';
import ReturnIcon from '../../../assets/icons/greylight/return.svg';
import VenmoLogo from '../../../assets/buyer-icons/venmo-logo.svg';
import CartIcon from '../../../assets/icontabs/buyer-tabs/cart-solid.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import CloseIcon from '../../../assets/buyer-icons/close.svg';
import MinusIcon from '../../../assets/buyer-icons/minus.svg';
import PlusIcon from '../../../assets/buyer-icons/plus.svg';
import {getPlantDetailApi} from '../../../components/Api/getPlantDetailApi';
import {getPlantRecommendationsApi} from '../../../components/Api/listingBrowseApi';
import PlantItemCard from '../../../components/PlantItemCard/PlantItemCard';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

const ScreenPlantDetail = ({navigation, route}) => {
  const {user} = useAuth();
  const {plantCode} = route.params || {};

  // Plant data state
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageSource, setImageSource] = useState(
    require('../../../assets/buyer-icons/png/ficus-lyrata.png'),
  );
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Add to cart modal state
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedPotSize, setSelectedPotSize] = useState('2"');
  const [quantity, setQuantity] = useState(0);
  const [modalAction, setModalAction] = useState('add-to-cart'); // 'add-to-cart' or 'buy-now'

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
    if (plantData?.loveCount !== undefined) {
      setLoveCount(plantData.loveCount || 0);
    }
    // Set initial pot size from plant data
    if (plantData?.potSize) {
      setSelectedPotSize(plantData.potSize);
    }
    // Load recommendations when plant data is available and we're not already loading
    if (plantData?.plantCode && !loadingRecommendations && recommendations.length === 0) {
      console.log('Triggering loadRecommendations from useEffect');
      loadRecommendations();
    }
  }, [plantData, loadingRecommendations, recommendations.length]);

  const loadRecommendations = async () => {
    // Prevent multiple concurrent calls
    if (loadingRecommendations) {
      console.log('Recommendations already loading, skipping...');
      return;
    }
    
    if (!plantData?.plantCode) {
      console.log('No plant code available for recommendations');
      return;
    }
    
    try {
      console.log('Starting to load plant recommendations for:', plantData.plantCode);
      setLoadingRecommendations(true);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getPlantRecommendationsApi({
        plantCode: plantData.plantCode,
        limit: 10
      }), 3, 1000);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to load recommendations');
      }

      const recommendationsData = res.data?.recommendations || [];
      console.log('Plant recommendations loaded successfully:', recommendationsData.length);
      
      // Set recommendations first, then loading state
      setRecommendations(recommendationsData);
      setLoadingRecommendations(false);
      
      console.log('Recommendations state updated successfully');

    } catch (error) {
      console.error('Error loading plant recommendations:', error);
      setRecommendations([]);
      setLoadingRecommendations(false);
    }
  };

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
    console.log('Opening add to cart modal for:', plantCode);
    setModalAction('add-to-cart');
    setShowAddToCartModal(true);
  };

  const handleBuyNow = () => {
    console.log('Opening buy now modal for:', plantCode);
    setModalAction('buy-now');
    setShowAddToCartModal(true);
  };

  const handleConfirmAddToCart = () => {
    console.log('Adding to cart:', {
      plantCode,
      potSize: selectedPotSize,
      quantity,
      action: modalAction,
    });
    setShowAddToCartModal(false);
    if (modalAction === 'buy-now') {
      // Navigate to checkout screen with plant data
      navigation.navigate('CheckoutScreen', {
        plantData: plantData,
        selectedPotSize: selectedPotSize,
        quantity: quantity,
        plantCode: plantCode,
        totalAmount: parseFloat(plantData?.usdPrice || '0') * quantity,
        fromBuyNow: true,
      });
    } else {
      Alert.alert('Success', `Added ${quantity} plant(s) to cart!`);
    }
  };

  const handleCloseModal = () => {
    setShowAddToCartModal(false);
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 0) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    console.log('Wishlist toggled:', !isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const handleLovePress = () => {
    setIsLoved(!isLoved);
    setLoveCount(prevCount => isLoved ? prevCount - 1 : prevCount + 1);
    console.log('Love toggled:', !isLoved);
    // TODO: Implement love functionality API call
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
            {plantData.variegation && plantData.variegation !== 'None' && plantData.variegation.trim() !== '' && (
              <Text style={styles.variegationLabel}>
                {plantData.variegation}
              </Text>
            )}
            {plantData.mutation && plantData.mutation !== 'Not specified' && plantData.mutation.trim() !== '' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mutation:</Text>
                <Text style={styles.detailValue}>
                  {plantData.mutation}
                </Text>
              </View>
            )}
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
              <TouchableOpacity style={styles.socialButton} onPress={handleLovePress}>
                {isLoved ? (
                  <HeartSolidIcon width={32} height={32} color="#E53E3E" />
                ) : (
                  <HeartIcon width={32} height={32} />
                )}
                <Text style={styles.socialText}>{loveCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAddToWishlist}>
                {isWishlisted ? (
                  <WishListSelected width={32} height={32} />
                ) : (
                  <WishListUnselected width={32} height={32} />
                )}
                <Text style={styles.socialText}>
                  {plantData.wishlistCount || 0}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rightControls}>
              <TouchableOpacity style={styles.socialButton} onPress={handleShare}>
                <ShareIcon width={32} height={32} />
                <Text style={styles.socialText}>Share</Text>
              </TouchableOpacity>
            </View>
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
              <View style={styles.potSizeHeader}>
                <Text style={styles.potSizeLabel}>Pot Size:</Text>
                <Text style={styles.potSizeValue}>
                  2"-4" (5 to 11 cm)
                </Text>
              </View>
              <View style={styles.potSizeCards}>
                <TouchableOpacity
                  style={[
                    styles.potSizeCard,
                    selectedPotSize === '2"' && styles.selectedPotSizeCard,
                  ]}
                  onPress={() => setSelectedPotSize('2"')}
                >
                  <View style={[
                    styles.potSizeImage,
                    selectedPotSize === '2"' && { borderColor: '#539461' }
                  ]}>
                    <Image
                      source={imageSource}
                      style={styles.potImage}
                    />
                  </View>
                  <Text style={styles.potSizeCardLabel}>2"</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.potSizeCard,
                    selectedPotSize === '4"' && styles.selectedPotSizeCard,
                  ]}
                  onPress={() => setSelectedPotSize('4"')}
                >
                  <View style={[
                    styles.potSizeImage,
                    selectedPotSize === '4"' && { borderColor: '#539461' }
                  ]}>
                    <Image
                      source={imageSource}
                      style={styles.potImage}
                    />
                  </View>
                  <Text style={styles.potSizeCardLabel}>4"</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Important Index Details */}
          <View style={styles.plantDetailsContainer}>
            <View style={styles.plantDetailsHeader}>
              <Text style={styles.plantDetailsTitle}>Important index (7-10 being best) that you need to know before importing this plant</Text>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <PlaneIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.plantDetailData}>
                      {plantData.shippingIndex || 'Best (7-10)'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Shipping Index</Text>
              </View>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <FlakesIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.plantDetailData}>
                      {plantData.acclimationIndex || 'Best (7-10)'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Acclimation Index</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Shipping Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <View style={styles.shippingDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <TruckIcon width={24} height={24} />
              </View>
              <View style={styles.shippingDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.shippingDetailData}>
                      UPS 2nd Day $50, add-on plant $5
                    </Text>
                  </View>
                </View>
                <Text style={styles.shippingDetailLabel}>
                  Upgrade to Next Day UPS is available at checkout.
                </Text>
              </View>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <PlaneIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.flightDetailData}>
                      Plant Flight {plantData.flightDate || 'May-30'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Soonest air cargo schedule</Text>
              </View>
            </View>
            <View style={styles.baseCargoDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <BoxIcon width={30} height={30} />
              </View>
              <View style={styles.baseCargoDetailContent}>
                <View style={styles.baseCargoTextContainer}>
                  <View style={styles.baseCargoTextAndAmount}>
                    <Text style={styles.baseCargoDetailData}>
                      Base Air Cargo $150
                    </Text>
                    <View style={styles.tooltipContainer}>
                      {/* Tooltip helper icon can be added here */}
                    </View>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Paid on your first order</Text>
              </View>
            </View>
            <View style={styles.plantDetailItem}>
              <View style={styles.plantDetailIconContainer}>
                <ReturnIcon width={24} height={24} />
              </View>
              <View style={styles.plantDetailContent}>
                <View style={styles.plantDetailTextContainer}>
                  <View style={styles.plantDetailTextAndAmount}>
                    <Text style={styles.returnDetailData}>
                      Not Allowed
                    </Text>
                  </View>
                </View>
                <Text style={styles.plantDetailLabel}>Return and exchanges</Text>
              </View>
            </View>
          </View>

        {/* Divider */}
          <View style={styles.divider} />


          {/* Payment Options */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            <View style={styles.paymentOptions}>
              <View style={styles.paymentOption}>
                <VenmoLogo width={60} height={20} />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* You may also like section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>You may also like</Text>
            
            {(() => {
              console.log('Rendering recommendations section - loadingRecommendations:', loadingRecommendations, 'recommendations.length:', recommendations.length);
              return null;
            })()}
            
            {loadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#539461" />
                <Text style={styles.loadingText}>Loading recommendations...</Text>
              </View>
            ) : recommendations.length > 0 ? (
              <View style={styles.recommendationGrid}>
                {recommendations.map((plant, index) => {
                  console.log('Rendering recommendation card:', index, plant.plantCode);
                  return (
                    <View key={plant.id || plant.plantCode || index} style={styles.recommendationCard}>
                      <PlantItemCard 
                        data={plant}
                        onPress={() => {
                          navigation.push('ScreenPlantDetail', { 
                            plantCode: plant.plantCode,
                            plantData: plant 
                          });
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noRecommendationsContainer}>
                <Text style={styles.noRecommendationsText}>No recommendations available</Text>
              </View>
            )}
          </View>
        </View>
        </ScrollView>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('ScreenCart')}>
            <CartIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleBuyNow}>
            <Text style={styles.addToCartButtonText}>Buy Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowButton} onPress={handleAddToCart}>
            <Text style={styles.buyNowButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Add to Cart Modal */}
      <Modal
        visible={showAddToCartModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Title */}
            <View style={styles.modalTitle}>
              <Text style={styles.modalTitleText}>
                {modalAction === 'buy-now' ? 'Buy Now' : 'Add to Cart'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Pot Size Section */}
            <View style={styles.potSizeSection}>
              <View style={styles.plantPriceContainer}>
                {/* Price */}
                <View style={styles.modalPriceContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.modalPrice}>
                      ${plantData?.usdPrice || '65.00'}
                    </Text>
                    <Text style={styles.originalPrice}>
                      ${(parseFloat(plantData?.usdPrice || 75) * 1.15).toFixed(2)}
                    </Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>15% OFF</Text>
                    </View>
                  </View>
                  <View style={styles.shippingInfo}>
                    <FlightIcon width={20} height={20} />
                    <Text style={styles.shippingText}>
                      Plant Flight {plantData?.flightDate || 'May-30'} • UPS 2nd Day $50, add-on plant $5
                    </Text>
                  </View>
                </View>

                {/* Pot Size */}
                <View style={styles.modalPotSizeContainer}>
                  <View style={styles.potSizeHeader}>
                    <Text style={styles.potSizeLabel}>Pot Size:</Text>
                    <Text style={styles.potSizeValue}>
                      {selectedPotSize} | Standard Nursery Pot
                    </Text>
                  </View>
                  <View style={styles.modalPotSizeCards}>
                    <TouchableOpacity
                      style={[
                        styles.modalPotSizeCard,
                        selectedPotSize === '2"' && styles.selectedPotSizeCard,
                      ]}
                      onPress={() => setSelectedPotSize('2"')}
                    >
                      <View style={[
                        styles.modalPotSizeImage,
                        selectedPotSize === '2"' && styles.modalSelectedPotSizeImage
                      ]}>
                        <Image
                          source={require('../../../assets/buyer-icons/png/ficus-lyrata.png')}
                          style={styles.modalPotImage}
                        />
                      </View>
                      <Text style={styles.modalPotSizeCardLabel}>2"</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalPotSizeCard,
                        selectedPotSize === '4"' && styles.selectedPotSizeCard,
                      ]}
                      onPress={() => setSelectedPotSize('4"')}
                    >
                      <View style={[
                        styles.modalPotSizeImage,
                        selectedPotSize === '4"' && styles.modalSelectedPotSizeImage
                      ]}>
                        <Image
                          source={require('../../../assets/buyer-icons/png/ficus-lyrata.png')}
                          style={styles.modalPotImage}
                        />
                      </View>
                      <Text style={styles.modalPotSizeCardLabel}>4"</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.modalDividerContainer}>
              <View style={styles.modalDivider} />
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <View style={styles.quantityLabelContainer}>
                <Text style={styles.quantityLabel}>Quantity</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={decreaseQuantity}
                >
                  <MinusIcon width={24} height={24} />
                </TouchableOpacity>
                <View style={styles.quantityInput}>
                  <TextInput
                    style={styles.quantityInputText}
                    value={quantity.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setQuantity(num >= 0 ? num : 0);
                    }}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.stepperButton, styles.stepperButtonRight]}
                  onPress={increaseQuantity}
                >
                  <PlusIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action */}
            <View style={styles.modalAction}>
              <View style={styles.modalActionContent}>
                <TouchableOpacity
                  style={styles.addToCartModalButton}
                  onPress={handleConfirmAddToCart}
                >
                  <Text style={styles.addToCartModalButtonText}>
                    {modalAction === 'buy-now' ? 'Buy Now' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.homeIndicator}>
                <View style={styles.gestureBar} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    width: '100%',
    height: 64,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E4E7E9',
    alignSelf: 'stretch',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    height: 32,
  },
  rightControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    height: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
    height: 32,
  },
  socialText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
    height: 178,
  },
  potSizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 24,
    alignSelf: 'stretch',
  },
  potSizeLabel: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  potSizeValue: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  potSizeCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
    width: 188,
    height: 146,
  },
  potSizeCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 88,
    height: 146,
  },
  selectedPotSizeCard: {
    // Selected state will be handled by border in potSizeImage
  },
  potSizeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    height: 116,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  potImage: {
    width: 88,
    height: 116,
  },
  potSizeCardLabel: {
    width: 41,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginHorizontal: 24,
  },
  plantDetailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    alignSelf: 'stretch',
    height: 216,
  },
  plantDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    height: 72,
  },
  plantDetailsTitle: {
    height: 72,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 1,
  },
  plantDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    alignSelf: 'stretch',
    height: 48,
  },
  plantDetailIconContainer: {
    width: 24,
    height: 24,
  },
  plantDetailIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#556065',
    borderRadius: 2,
  },
  plantDetailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    height: 48,
    flex: 1,
  },
  plantDetailTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    alignSelf: 'stretch',
  },
  plantDetailTextAndAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    flex: 1,
  },
  plantDetailData: {
    fontFamily: 'Inter',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  plantDetailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    alignSelf: 'stretch',
  },
  shippingDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    height: 70,
    alignSelf: 'stretch',
  },
  shippingDetailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    height: 70,
    flex: 1,
  },
  shippingDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  shippingDetailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    alignSelf: 'stretch',
  },
  flightDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  baseCargoDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    height: 52,
    alignSelf: 'stretch',
  },
  baseCargoDetailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    height: 52,
    flex: 1,
  },
  baseCargoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    alignSelf: 'stretch',
  },
  baseCargoTextAndAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    flex: 1,
  },
  baseCargoDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  tooltipContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: 28,
    height: 28,
  },
  returnDetailData: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
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
  recommendationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  recommendationCard: {
    width: '48%',
    marginBottom: 16,
  },
  noRecommendationsContainer: {
    marginTop: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#8B9096',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    height: 585,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
  },
  modalTitle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  modalTitleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
  },
  potSizeSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 12,
    width: '100%',
    height: 330,
    alignSelf: 'stretch',
  },
  plantPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 16,
    height: 318,
    alignSelf: 'stretch',
  },
  modalPriceContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
    height: 100,
    alignSelf: 'stretch',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
  },
  modalPrice: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: '#539461',
  },
  originalPrice: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    textDecorationLine: 'line-through',
    color: '#7F8D91',
  },
  discountBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 75,
    height: 24,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
  },
  discountText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#CC512A',
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 6,
    paddingHorizontal: 12,
    gap: 6,
    minHeight: 24,
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 8,
  },
  shippingText: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#539461',
  },
  potSizeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    width: 327,
    height: 178,
  },
  potSizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 24,
  },
  potSizeLabel: {
    height: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  potSizeValue: {
    width: 247,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  potSizeCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
    width: 188,
    height: 146,
  },
  potSizeCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 88,
    height: 146,
  },
  selectedPotSizeCard: {
    // Selected state will be handled by border in potSizeImage
  },
  potSizeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    height: 116,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  potImage: {
    width: 88,
    height: 116,
  },
  potSizeCardLabel: {
    width: 41,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  
  // Modal pot size styles
  modalPotSizeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    height: 178,
    alignSelf: 'stretch',
  },
  modalPotSizeCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
    width: 188,
    height: 146,
  },
  modalPotSizeCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 88,
    height: 146,
  },
  modalPotSizeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    height: 116,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalSelectedPotSizeImage: {
    borderColor: '#539461',
  },
  modalPotImage: {
    width: 88,
    height: 116,
  },
  modalPotSizeCardLabel: {
    width: 41,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  modalDividerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
    height: 17,
    alignSelf: 'stretch',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    alignSelf: 'stretch',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
    width: '100%',
    height: 84,
    alignSelf: 'stretch',
  },
  quantityLabelContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 48,
    flex: 1,
  },
  quantityLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 48,
    flex: 1,
  },
  stepperButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 48,
    minWidth: 48,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: -1,
  },
  stepperButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginRight: 0,
    marginLeft: -1,
  },
  quantityInput: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    flex: 1,
    marginHorizontal: -1,
    paddingHorizontal: 4,
  },
  quantityInputText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
    width: '100%',
    padding: 0,
    margin: 0,
  },
  modalAction: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    height: 94,
    backgroundColor: '#FFFFFF',
  },
  modalActionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    width: '100%',
    height: 60,
    alignSelf: 'stretch',
  },
  addToCartModalButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  addToCartModalButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  homeIndicator: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    bottom: 8,
    marginLeft: -74,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default ScreenPlantDetail;
