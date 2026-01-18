import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';

import CloseIcon from '../../../assets/live-icon/close-x.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import AddressSection from './components/AddressSection';
import CheckoutBar from './components/CheckoutBar';
import FlightSelector from './components/FlightSelector';
import OrderSummary from './components/OrderSummary';
import PlantList from './components/PlantList';
import { useCheckoutController } from './controllers/CheckoutController';

// Helper function to determine country from currency
const getCountryFromCurrency = currency => {
  if (!currency) return null;

  switch (currency.toUpperCase()) {
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

// Function to render the correct country flag
const renderCountryFlag = country => {
  if (!country) {
    // Default to Indonesia if country is undefined or empty
    return <IndonesiaFlag width={24} height={16} style={styles.flagIcon} />;
  }

  // Handle emoji flags from cart items
  if (country === '🇹🇭') {
    return <ThailandFlag width={24} height={16} style={styles.flagIcon} />;
  }
  if (country === '🇵🇭') {
    return <PhilippinesFlag width={24} height={16} style={styles.flagIcon} />;
  }
  if (country === '🇮🇩') {
    return <IndonesiaFlag width={24} height={16} style={styles.flagIcon} />;
  }

  // Handle text-based country codes
  const countryCode = country?.toUpperCase();
  
  switch (countryCode) {
    case 'PHILIPPINES':
    case 'PH':
    case 'PHL':
      return <PhilippinesFlag width={24} height={16} style={styles.flagIcon} />;
    case 'THAILAND':
    case 'TH':
    case 'THA':
      return <ThailandFlag width={24} height={16} style={styles.flagIcon} />;
    case 'INDONESIA':
    case 'ID':
    case 'IDN':
    default:
      return <IndonesiaFlag width={24} height={16} style={styles.flagIcon} />;
  }
};

// Plant Item Component (similar to CartComponent from cart screen)
const PlantItemComponent = ({
  image,
  name,
  variation,
  size,
  price,
  quantity,
  title,
  originalPrice,
  discount,
  listingType,
  country,
  shippingMethod,
  airCargoOption,
  onPress,
}) => {
  const isGrowerChoice = listingType === 'growers_choice';
  const isDiscounted = originalPrice && discount && originalPrice > price;

  return (
    <TouchableOpacity style={styles.plant} onPress={onPress}>
      {/* Plant Image */}
      <View style={styles.plantImage}>
        <View style={styles.plantImageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: 96, height: 128, borderRadius: 6 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: 96, height: 128, borderRadius: 6, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No Image</Text>
            </View>
          )}
        </View>
      </View>

      {/* Plant Details */}
      <View style={styles.plantDetails}>
        {/* Plant Name */}
        <View style={styles.plantName}>
          <Text style={styles.plantNameText}>{name}</Text>
          <View style={styles.variationSize}>
            <Text style={styles.variationText}>{variation}</Text>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>
            <Text style={styles.sizeNumber}>{size}</Text>
          </View>
        </View>

        {/* Type and Discount */}
        <View style={styles.typeDiscount}>
          <View style={styles.listingType}>
            <Text style={styles.listingTypeLabel}>
              {listingType === 'single_grower' ? 'Single' : 
               listingType === 'wholesale' ? 'Wholesale' : 'Grower\'s Choice'}
            </Text>
          </View>
          {isDiscounted && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Price and Quantity */}
        <View style={styles.priceQuantity}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceNumber, isDiscounted && styles.discountedPrice]}>
              {formatCurrencyFull(price)}
            </Text>
            {/* Original Price (if discounted) */}
            {originalPrice && discount && (
              <Text style={styles.originalPriceText}>
                {formatCurrencyFull(originalPrice)}
              </Text>
            )}
          </View>

          {/* Quantity - Always show quantity for all listing types */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityNumber}>{quantity || 1}</Text>
            <Text style={styles.quantityMultiple}>x</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const LiveShopCheckoutModal = ({ isVisible, onClose, listingDetails }) => {

  setupURLPolyfill();
    // Use the controller for all business logic
    const {
      // State
      loading,
      deliveryDetails,
      navigateBack, // We'll replace this with onClose
      cargoDate,
      lockedFlightDate,
      lockedFlightKey,
      checkingOrders,
      disablePlantFlightSelection,
      selectedFlightDate,
      shippingCalculation,
      leafPoints,
      plantCredits,
      shippingCredits,
      upsNextDayEnabled,
      leafPointsEnabled,
      plantCreditsEnabled,
      shippingCreditsEnabled,
      shimmerAnim,
      isCalculatingShipping,
      isLive,
      
      // Computed values
      plantItems,
      quantityBreakdown,
      orderSummary,
      flightDateOptions,
      flightLockInfo,
  
      //savedPaymentDetails
      vaultedPaymentUsername,
      vaultedPaymentId,
  
      // Actions
      setCargoDate,
      setSelectedFlightDate,
      handleUpdateDeliveryDetails,
      toggleUpsNextDay,
      toggleLeafPoints,
      togglePlantCredits,
      toggleShippingCredits,
      handleCheckout,
      discountCode,
      setDiscountCode,
      handleApplyDiscount,
      
      // Joiner state
      disableAddressSelection,
      disableFlightSelection,
      receiverFlightDate,
      
      // Helpers
      normalizeFlightKey,
      formatFlightDateToISO,
      
    } = useCheckoutController({ ...listingDetails, onClose });
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>LIVE Checkout</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseIcon width={24} height={24} color="#000" />
            </TouchableOpacity>
          </View>

            <ScrollView
                style={styles.scrollableContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}>
                
                {/* <AddressSection
                  deliveryDetails={deliveryDetails}
                  onUpdateDeliveryDetails={handleUpdateDeliveryDetails}
                  disabled={disableAddressSelection}
                /> */}
                
                <FlightSelector
                  isLive={true}
                  lockedFlightDate={lockedFlightDate}
                  flightDateOptions={flightDateOptions}
                  selectedFlightDate={selectedFlightDate}
                  checkingOrders={checkingOrders}
                  shimmerAnim={shimmerAnim}
                  disablePlantFlightSelection={disablePlantFlightSelection}
                  flightLockInfo={flightLockInfo}
                  lockedFlightKey={lockedFlightKey}
                  cargoDate={cargoDate}
                  onSelectFlightDate={(obj) => {
                    setSelectedFlightDate(obj);
                    if (obj.iso) {
                      console.log('✈️ Setting cargoDate to:', obj.iso);
                      setCargoDate(obj.iso);
                    }
                  }}
                  normalizeFlightKey={normalizeFlightKey}
                  formatFlightDateToISO={formatFlightDateToISO}
                  disableFlightSelection={disableFlightSelection}
                  receiverFlightDate={receiverFlightDate}
                />
                
                {/* <PlantList
                  plantItems={plantItems}
                  renderCountryFlag={renderCountryFlag}
                  PlantItemComponent={PlantItemComponent}
                  onPlantPress={(item) => {
                    // Navigation to plant detail can be implemented here when needed
                    // if (item.plantCode) {
                    //   navigation.navigate('ScreenPlantDetail', {
                    //     plantCode: item.plantCode,
                    //   });
                    // }
                  }}
                /> */}
                
                {/* <OrderSummary
                  quantityBreakdown={quantityBreakdown}
                  orderSummary={orderSummary}
                  shippingCalculation={{ ...shippingCalculation, loading: isCalculatingShipping }}
                  shimmerAnim={shimmerAnim}
                  upsNextDayEnabled={upsNextDayEnabled}
                  onToggleUpsNextDay={toggleUpsNextDay}
                  leafPointsEnabled={leafPointsEnabled}
                  plantCreditsEnabled={plantCreditsEnabled}
                  shippingCreditsEnabled={shippingCreditsEnabled}
                  leafPoints={leafPoints}
                  plantCredits={plantCredits}
                  shippingCredits={shippingCredits}
                  onToggleLeafPoints={toggleLeafPoints}
                  onTogglePlantCredits={togglePlantCredits}
                  onToggleShippingCredits={toggleShippingCredits}
                  discountCode={discountCode}
                  onDiscountCodeChange={setDiscountCode}
                  onApplyDiscount={handleApplyDiscount}
                /> */}
                
                {/* Browse More Plants Component
                {!isLive && (<BrowseMorePlants
                  title="More from our Jungle"
                  initialLimit={4}
                  loadMoreLimit={4}
                  showLoadMore={true}
                />)}
                {isLive && (<View style={{height: 60}}></View>)} */}
              </ScrollView>
              
              <CheckoutBar
                total={orderSummary.finalTotal}
                discount={orderSummary.codeDiscount || 0}
                loading={loading || isCalculatingShipping}
                selectedFlightDateIso={selectedFlightDate?.iso}
                onCheckoutPress={handleCheckout}
                vaultedPaymentId={vaultedPaymentId}
                vaultedPaymentUsername={vaultedPaymentUsername}
              />
              
              {/* Loading Modal */}
              <Modal visible={loading} transparent animationType="fade">
                <View style={styles.modalOverlayProcessingOrder}>
                  <View style={styles.modalContent}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={styles.modalText}>Processing your order...</Text>
                    <Text style={styles.modalSubtext}>Please wait</Text>
                  </View>
                </View>
              </Modal> 
         
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create(
{
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: '60%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    height: 58,
    minHeight: 58,
    flex: 0,
    alignSelf: 'stretch',
    position: 'relative',
  },
  backButton: {
    width: 24,
    height: 24,
    paddingTop: 10,
    flex: 0,
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 14,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    flex: 0,
    zIndex: 2,
    // pointerEvents: 'none',
  },
  navbarRight: {
    width: 24,
    height: 24,
    opacity: 0,
  },
  shipping: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 0,
    gap: 12,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitleText: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 0,
  },
  addressList: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    height: 92,
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    flex: 0,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  iconCircle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8.33,
    width: 40,
    height: 40,
    flex: 0,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    width: 40,
    height: 40,
    backgroundColor: '#FFE7E2',
    borderRadius: 1000,
    flex: 0,
  },
  addressDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    height: 44,
    flex: 1,
  },
  addressAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 44,
    flex: 0,
    alignSelf: 'stretch',
  },
  addressText: {
    height: 44,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 1,
    textAlignVertical: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 44,
    flex: 0,
    alignSelf: 'stretch',
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
    flex: 0,
  },
  plantFlight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    gap: 12,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  flightTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  flightTitleText: {
    width: 100,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 0,
  },
  infoCircle: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCircleText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  flightOptions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 10,
    width: '100%',
    height: 112,
    flex: 0,
    alignSelf: 'stretch',
  },
  optionCards: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 112,
    flex: 0,
    alignSelf: 'stretch',
  },
  optionLabel: {
    width: '100%',
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
    flex: 0,
    alignSelf: 'stretch',
  },
  flightOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    paddingBottom: 15,
    gap: 12,
    width: '100%',
    height: 78,
    flex: 0,
    alignSelf: 'stretch',
  },
  optionCard: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
    minWidth: 80,
    height: 78,
    minHeight: 60,
    borderRadius: 12,
    flex: 1,
  },
  selectedOptionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#539461',
  },
  unselectedOptionCard: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  optionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#202325',
    flex: 0,
  },
  unselectedOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#393D40',
    flex: 0,
  },
  optionSubtext: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    textAlign: 'center',
    color: '#647276',
    flex: 0,
  },
  mutedOption: {
    opacity: 0.45,
  },
  skeletonCard: {
    backgroundColor: '#EDEFF0',
    borderRadius: 14,
    minWidth: 92,
    height: 86,
    marginRight: 12,
  },
  
  plantItemWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 0,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  plantList: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentMethod: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 15,
    paddingBottom: 0,
    gap: 12,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentMethodTitle: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#393D40',
    flex: 0,
  },
  paymentOptionContainer: {
    paddingHorizontal: 15,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  paymentDivider: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 28,
    flex: 0,
    alignSelf: 'stretch',
  },
  paymentDividerLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#F5F6F6',
    flex: 0,
    alignSelf: 'stretch',
  },
  summary: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 20,
    marginBottom: 40,
    gap: 12,
    width: '100%',
    height: 872,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantity: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    height: 112,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantityTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantityTitleText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  quantityContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 80,
    flex: 0,
    alignSelf: 'stretch',
  },
  singleGrowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  wholesaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  growersChoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  quantityTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    marginTop: 4,
    width: '100%',
    height: 28,
    flex: 0,
    alignSelf: 'stretch',
  },
  summaryRowLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 20,
    color: '#647276',
    flex: 1,
    // Allow the label to share space with the amount on the right
    // and avoid covering the entire row which could hide the text.
    flexShrink: 0,
  },
  summaryRowNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
    textAlign: 'right',
  },
  quantityTotalLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  quantityTotalNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  summaryDivider: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 33,
    flex: 0,
    alignSelf: 'stretch',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotal: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    width: '100%',
    minHeight: 56, // Use minHeight for flexibility
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    minHeight: 24,
    marginTop: 8,
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotalLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  subtotalNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  plantCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    minHeight: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  priceComparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPriceStrikethrough: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textDecorationLine: 'line-through',
    color: '#7F8D91',
    marginRight: 8,
  },
  discountedPriceFinal: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#539461',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  discountLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  discountNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#E7522F',
    flex: 0,
  },
  shippingSummary: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    minHeight: 204,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingSummaryTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingSummaryTitleText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  shippingSummaryContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    minHeight: 172,
    flex: 0,
    alignSelf: 'stretch',
  },
  shipping: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    // paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    // width: '100%',
    height: 130,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
    marginLeft: 15,
  },
  shippingTitleText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  shippingContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 172,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    width: '100%',
    minHeight: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  labeledToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    minHeight: 32,
    flex: 0,
    alignSelf: 'stretch',
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    minHeight: 28,
    flex: 1,
  },
  toggleLabelText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  formToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    height: 24,
    flex: 0,
  },
  toggleText: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    height: 22,
    flex: 0,
  },
  toggleOffLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#A9B3B7',
    flex: 0,
  },
  toggleOffNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#A9B3B7',
    flex: 0,
  },
  toggleOnLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    flex: 0,
  },
  toggleOnNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    flex: 0,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    gap: 10,
    width: 44,
    maxWidth: 44,
    height: 24,
    maxHeight: 24,
    backgroundColor: '#7F8D91',
    borderRadius: 32,
    flex: 0,
  },
  switchKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    flex: 0,
  },
  switchContainerActive: {
    backgroundColor: '#539461', // Green background when active
  },
  switchKnobActive: {
    transform: [{translateX: 18}], // Move knob to the right when active
  },
  baseAirCargoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    minHeight: 32,
    flex: 0,
    alignSelf: 'stretch',
  },
  labelTooltip: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    minHeight: 32,
    flex: 1,
    width: '100%',
  },
  tooltip: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 28,
    height: 28,
    flex: 0,
  },
  helper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 10,
    width: 28,
    height: 28,
    flex: 0,
  },
  wholesaleAirCargoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    minHeight: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  airCargoCreditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    width: '100%',
    minHeight: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  airCargoCreditAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#E7522F',
    flex: 0,
    textAlign: 'right',
  },
  shippingCreditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingCreditsAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#E7522F',
    flex: 0,
    textAlign: 'right',
  },
  shippingCreditsNotification: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  shippingCreditsNotificationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  shippingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingTotalLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
  },
  shippingTotalNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
    textAlign: 'right',
  },
  points: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    minHeight: 272,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  pointsTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 48,
    flex: 0,
    alignSelf: 'stretch',
  },
  pointsTitleText: {
    width: '100%',
    height: 48,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  pointOptions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    gap: 12,
    width: '100%',
    minHeight: 216,
    flex: 0,
    alignSelf: 'stretch',
  },
  discountOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 0,
    gap: 8,
    width: '100%',
    height: 56,
    flex: 0,
    alignSelf: 'stretch',
  },
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 252,
    height: 48,
    flex: 0,
    flexGrow: 1,
  },
  textFieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  textFieldPlaceholder: {
    width: 184,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 0,
    flexGrow: 1,
  },
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 85,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 0,
  },
  applyButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 61,
    height: 16,
    flex: 0,
  },
  applyButtonLabel: {
    width: 45,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    flex: 0,
  },
  leafPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  plantCreditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingCreditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 36,
    flex: 0,
    alignSelf: 'stretch',
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    height: 36,
    flex: 0,
  },
  leafIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 8,
    width: 36,
    height: 36,
    backgroundColor: '#539461',
    borderRadius: 1000,
    flex: 0,
  },
  plantIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 8,
    width: 36,
    height: 36,
    backgroundColor: '#6B4EFF',
    borderRadius: 1000,
    flex: 0,
  },
  shippingIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 8,
    width: 36,
    height: 36,
    backgroundColor: '#48A7F8',
    borderRadius: 1000,
    flex: 0,
  },
  iconLabelText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  totalAmount: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 0,
    marginBottom: 40,
    gap: 8,
    width: '100%',
    height: 32,
    borderRadius: 0,
    flex: 1,
    alignSelf: 'stretch',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: '100%',
    height: 32,
    flex: 0,
    alignSelf: 'stretch',
  },
  totalAmountLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  totalAmountNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#202325',
    flex: 0,
  },
  plant: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  plantImage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: 96,
    height: 128,
    borderRadius: 6,
    flex: 0,
  },
  plantImageContainer: {
    width: 96,
    height: 128,
    borderRadius: 6,
    flex: 0,
  },
  plantDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    flex: 1,
  },
  plantName: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    width: '100%',
    height: 50,
    flex: 0,
    alignSelf: 'stretch',
  },
  plantNameText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
    alignSelf: 'stretch',
  },
  variationSize: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  variationText: {
    width: 127,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#647276',
    flex: 0,
  },
  dividerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 0,
    width: 4,
    height: 12,
    flex: 0,
  },
  divider: {
    width: 4,
    maxWidth: 4,
    height: 4,
    maxHeight: 4,
    backgroundColor: '#7F8D91',
    borderRadius: 100,
    flex: 0,
  },
  sizeNumber: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'right',
    color: '#393D40',
    flex: 0,
  },
  typeDiscount: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  listingType: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 8,
    paddingBottom: 1,
    backgroundColor: '#202325',
    borderRadius: 6,
    flex: 0,
  },
  listingTypeLabel: {
    height: 17,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17, // 140% of 12px
    color: '#FFFFFF',
    flex: 0,
  },
  discountBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    flex: 0,
  },
  discountText: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  discountLabel: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  priceQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
  },
  priceNumber: {
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  discountedPrice: {
    color: '#539461',
  },
  originalPriceText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textDecorationLine: 'line-through',
    color: '#7F8D91',
    flex: 0,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    flex: 0,
  },
  quantityNumber: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'right',
    color: '#393D40',
    flex: 0,
  },
  quantityMultiple: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'right',
    color: '#393D40',
    flex: 0,
  },
  plantItemDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 8,
    width: '100%',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  titleCountry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  titleText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 1,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: 53,
    height: 22,
    flex: 0,
  },
  countryText: {
    width: 23,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#556065',
    flex: 0,
  },
  flagIcon: {
    width: 24,
    height: 16,
    flex: 0,
  },
  plantShipping: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    height: 24,
    flex: 1,
  },
  shippingIcon: {
    // width: 24,
    // height: 24,
    // flex: 0,
  },
  airCargoIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  shippingText: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#556065',
    flex: 0,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  editButton: {
    fontSize: 14,
    color: '#699E73',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#647276',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  phoneText: {
    fontSize: 14,
    color: '#647276',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#647276',
    fontStyle: 'italic',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creditsLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  applyButtonOld: {
    fontSize: 14,
    color: '#699E73',
    fontWeight: '500',
  },
  cargoDateText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  checkoutBar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    position: 'absolute',
    width: '100%',
    height: 98,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    flex: 0,
    zIndex: 2,
  },
  checkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 15,
    paddingBottom: 0,
    gap: 15,
    width: '100%',
    height: 64,
    flex: 0,
    alignSelf: 'stretch',
  },
  checkoutSummary: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 0,
    gap: 4,
    width: 199,
    height: 48,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 143,
    height: 24,
    flex: 0,
  },
  amountLabel: {
    width: 43,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 0,
  },
  amountValue: {
    minWidth: 68,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24, // 120% of 20px
    color: '#202325',
    flex: 0,
  },
  infoIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    height: 20,
    flex: 0,
  },
  discountSavings: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
    flexShrink: 0,
  },
  discountAmount: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
    flexShrink: 0,
  },
  placeOrderButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 131,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 0,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#CDD3D4',
  },
  buttonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 107,
    height: 16,
    flex: 0,
  },
  buttonLabel: {
    width: 500,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16, // 100% of 16px
    textAlign: 'center',
    color: '#FFFFFF',
    flex: 0,
  },
  buttonSkeleton: {
    width: 91,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  homeIndicator: {
    width: '100%',
    height: 34,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    flex: 0,
    position: 'relative',
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    bottom: 8,
    marginLeft: -74, // Center the gesture bar
    backgroundColor: '#202325',
    borderRadius: 100,
  },
  // Loading Modal Styles
  modalOverlayProcessingOrder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  modalSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  // Skeleton styles
  skeletonText: {
    height: 16,
    width: 120,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonTextShort: {
    height: 16,
    width: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonTextTotal: {
    height: 20,
    width: 140,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonAmount: {
    height: 16,
    width: 60,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonAmountLarge: {
    height: 20,
    width: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonToggle: {
    height: 24,
    width: 50,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
}
);

export default LiveShopCheckoutModal;