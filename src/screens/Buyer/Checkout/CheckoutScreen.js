import React from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import styles from './components/styles/CheckoutScreenStyles';
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

const CheckoutScreen = () => {
  setupURLPolyfill();
  
  // Use the controller for all business logic
  const {
    // State
    loading,
    deliveryDetails,
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
    orderCutoffDate,

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
    navigateBack,
    discountCode,
    setDiscountCode,
    handleApplyDiscount,
    
    // Joiner state
    isJoinerApproved,
    disableAddressSelection,
    disableFlightSelection,
    receiverFlightDate,
    
    // Helpers
    normalizeFlightKey,
    formatFlightDateToISO,
  } = useCheckoutController();

  // Debug logging in CheckoutScreen
  console.log('🛒 [CheckoutScreen] Render with plantItems:', {
    count: plantItems?.length || 0,
    plantItems: plantItems?.map(item => ({
      plantCode: item?.plantCode,
      name: item?.name,
      hasImage: !!item?.image,
      image: item?.image,
      price: item?.price,
      quantity: item?.quantity,
    })),
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={navigateBack}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.navbarRight} />
      </View>

      <ScrollView
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>
        
        <AddressSection
          deliveryDetails={deliveryDetails}
          onUpdateDeliveryDetails={handleUpdateDeliveryDetails}
          disabled={disableAddressSelection}
        />
        
        <FlightSelector
          lockedFlightDate={lockedFlightDate}
          flightDateOptions={flightDateOptions}
          selectedFlightDate={selectedFlightDate}
          checkingOrders={checkingOrders}
          shimmerAnim={shimmerAnim}
          disablePlantFlightSelection={disablePlantFlightSelection}
          flightLockInfo={flightLockInfo}
          lockedFlightKey={lockedFlightKey}
          cargoDate={cargoDate}
          orderCutoffDate={orderCutoffDate}
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
        
        <PlantList
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
        />
        
        <OrderSummary
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
          isJoinerApproved={isJoinerApproved}
        />
        
        {/* Browse More Plants Component */}
        {!isLive && (<BrowseMorePlants
          title="More from our Jungle"
          initialLimit={4}
          loadMoreLimit={4}
          showLoadMore={true}
        />)}
        {isLive && (<View style={{height: 60}}></View>)}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.modalText}>Processing your order...</Text>
            <Text style={styles.modalSubtext}>Please wait</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen;