import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {setupURLPolyfill} from 'react-native-url-polyfill';
import {paymentPaypalVenmoUrl} from '../../../../config';
import LocationIcon from '../../../assets/buyer-icons/address.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import LeafIcon from '../../../assets/buyer-icons/leaf-green.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import PlantIcon from '../../../assets/buyer-icons/plant-violet.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import TruckBlueIcon from '../../../assets/buyer-icons/truck-blue.svg';
import TruckIcon from '../../../assets/buyer-icons/truck-gray.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ArrowRightIcon from '../../../assets/icons/greydark/caret-right-regular.svg';
import CaretDownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import TagIcon from '../../../assets/icons/greylight/tag.svg';
import {getAddressBookEntriesApi} from '../../../components/Api';
import {getBuyerOrdersApi} from '../../../components/Api/orderManagementApi';
import {checkoutApi} from '../../../components/Api/checkoutApi';
import BrowseMorePlants from '../../../components/BrowseMorePlants';
import {formatCurrencyFull} from '../../../utils/formatCurrency';

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
  console.log({countryCode});
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
  country,
  shippingMethod,
  listingType,
  discount,
  originalPrice,
  hasAirCargo,
  onPress,
}) => (
  <TouchableOpacity style={styles.plant} onPress={onPress} activeOpacity={0.7}>
    {/* Plant Image */}
    <View style={styles.plantImage}>
      <Image source={image} style={styles.plantImageContainer} />
    </View>

    {/* Plant Details */}
    <View style={styles.plantDetails}>
      {/* Name */}
      <View style={styles.plantName}>
        <Text style={styles.plantNameText}>{name}</Text>

        {/* Variegation + Size */}
        <View style={styles.variationSize}>
          <Text style={styles.variationText}>{variation}</Text>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
          </View>

          <Text style={styles.sizeNumber}>{size}</Text>
        </View>
      </View>

      {/* Type + Discount (if available) */}
      {(listingType || discount) && (
        <View style={styles.typeDiscount}>
          {/* Listing Type */}
          {listingType && (
            <View style={styles.listingType}>
              <Text style={styles.listingTypeLabel}>{listingType}</Text>
            </View>
          )}

          {/* Discount Badge */}
          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}</Text>
              <Text style={styles.discountLabel}>OFF</Text>
            </View>
          )}
        </View>
      )}

      {/* Price + Quantity */}
      <View style={styles.priceQuantity}>
        {/* Price */}
        <View style={styles.priceContainer}>
          <Text
            style={[styles.priceNumber, discount && styles.discountedPrice]}>
            {formatCurrencyFull(price)}
          </Text>
          {/* Original Price (if discounted) */}
          {originalPrice && discount && (
            <Text style={styles.originalPriceText}>
              {formatCurrencyFull(originalPrice)}
            </Text>
          )}
        </View>

        {/* Quantity */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityNumber}>{quantity}</Text>
          <Text style={styles.quantityMultiple}>x</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  setupURLPolyfill();
  const insets = useSafeAreaInsets();

  // Get parameters from navigation (cart items, products, etc.)
  const {
    cartItems = [],
    productData = [],
    useCart = true,
    // Buy Now parameters
    fromBuyNow = false,
    plantData = null,
    selectedPotSize = null,
    quantity = 1,
    plantCode = null,
    totalAmount = 0,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
    },
    contactPhone: '+1-555-0123',
    specialInstructions: 'Leave at front door',
  });

  const [cargoDate, setCargoDate] = useState('2025-02-15');
  // Track if buyer already has a paid order for the selected cargo date
  const [priorPaidAirBaseCargoAmount, setPriorPaidAirBaseCargoAmount] =
    useState(0);

  // Initialize flight date with backend-provided value or fallback
  const getInitialFlightDate = () => {
    // For cart checkout, find the latest flight date among all cart items
    if (useCart && cartItems.length > 0) {
      const flightDates = [];

      cartItems.forEach(item => {
        if (item.flightInfo) {
          // Extract flight date from flightInfo like "Plant Flight Aug 23" or "Plant Flight Aug-23"
          const flightDateMatch = item.flightInfo.match(
            /Plant Flight\s+(\w+)[\s-](\d+)/,
          );
          if (flightDateMatch) {
            const [, month, day] = flightDateMatch;

            // Convert month name to number
            const monthNames = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];
            const monthIndex = monthNames.indexOf(month);

            if (monthIndex !== -1) {
              // Create date object for comparison (use current year, adjust if needed)
              const currentYear = new Date().getFullYear();
              let flightDate = new Date(currentYear, monthIndex, parseInt(day));

              // If the date is in the past, move to next year
              if (flightDate < new Date()) {
                flightDate = new Date(
                  currentYear + 1,
                  monthIndex,
                  parseInt(day),
                );
              }

              flightDates.push({
                date: flightDate,
                formatted: `${month} ${day}`,
              });
            }
          }
        }
      });

      if (flightDates.length > 0) {
        // Sort by date and get the latest (furthest out) flight date
        flightDates.sort((a, b) => b.date - a.date);
        const latestFlightDate = flightDates[0].formatted;

        console.log(
          '🛫 Flight dates found in cart:',
          flightDates.map(f => f.formatted),
        );
        console.log('🛫 Latest flight date selected:', latestFlightDate);

        return latestFlightDate;
      }
    }

    // For buy now or single item, use plant data
    if (plantData?.plantFlightDate) {
      // Use the backend-provided plant flight date
      return plantData.plantFlightDate;
    }

    // Default fallback if no backend date available
    return 'N/A';
  };

  // Generate next 3 Saturday flight dates starting from the plant flight date
  const getFlightDateOptions = () => {
    const baseFlightDate = getInitialFlightDate();
    const options = [];

    // Handle case where no flight date is available
    if (!baseFlightDate || baseFlightDate === 'N/A') {
      return [
        {label: 'Flight Date TBD', value: 'TBD'},
        {label: 'Next Available', value: 'Next Available'},
        {label: 'Later Flight', value: 'Later Flight'},
      ];
    }

    // Helper function to get next Saturday from a given date
    const getNextSaturday = fromDate => {
      const date = new Date(fromDate);
      const currentDay = date.getDay(); // 0 = Sunday, 6 = Saturday

      let daysUntilSaturday;
      if (currentDay === 6) {
        // If it's Saturday, next Saturday is 7 days away
        daysUntilSaturday = 7;
      } else {
        // Days until next Saturday
        daysUntilSaturday = (6 - currentDay + 7) % 7;
        if (daysUntilSaturday === 0) daysUntilSaturday = 7;
      }

      const nextSaturday = new Date(date);
      nextSaturday.setDate(date.getDate() + daysUntilSaturday);
      return nextSaturday;
    };

    // Helper function to format date as "MMM DD"
    const formatFlightDate = date => {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    };

    // Parse the base flight date (format: "Aug 17" or "Aug-17")
    const normalizedFlightDate = baseFlightDate.replace('-', ' ');
    const [monthName, day] = normalizedFlightDate.split(' ');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthIndex = monthNames.indexOf(monthName);

    if (monthIndex === -1) {
      // Fallback if parsing fails - use the backend date as-is and generate subsequent Saturdays
      return [
        {label: baseFlightDate, value: baseFlightDate},
        {label: 'Next Saturday', value: 'Next Saturday'},
        {label: 'Later Saturday', value: 'Later Saturday'},
      ];
    }

    // Create date object for the base flight date
    const currentYear = new Date().getFullYear();
    let baseDate = new Date(currentYear, monthIndex, parseInt(day));

    // If the date is in the past, move to next year
    if (baseDate < new Date()) {
      baseDate = new Date(currentYear + 1, monthIndex, parseInt(day));
    }

    // Option 1: Use the plant flight date as-is (should already be a Saturday from backend)
    options.push({
      label: formatFlightDate(baseDate),
      value: formatFlightDate(baseDate),
      fullDate: baseDate,
    });

    // Option 2: Next Saturday after the plant flight date
    const nextSaturday = getNextSaturday(baseDate);
    options.push({
      label: formatFlightDate(nextSaturday),
      value: formatFlightDate(nextSaturday),
      fullDate: nextSaturday,
    });

    // Option 3: Saturday after the next Saturday
    const laterSaturday = getNextSaturday(nextSaturday);
    options.push({
      label: formatFlightDate(laterSaturday),
      value: formatFlightDate(laterSaturday),
      fullDate: laterSaturday,
    });

    return options;
  };

  const flightDateOptions = getFlightDateOptions();

  // Initialize selectedFlightDate with the first option
  const [selectedFlightDate, setSelectedFlightDate] = useState(() => {
    const options = getFlightDateOptions();
    return options[0]?.value || getInitialFlightDate();
  });

  // Calculate UPS 2nd Day shipping cost based on plant details (matching ScreenPlantDetail logic)
  const calculateUpsShippingCost = () => {
    // Get plant data from either cart items or buy now data
    const plants = useCart ? cartItems : plantItems;

    if (!plants || plants.length === 0) {
      return {baseCost: 50, addOnCost: 5, baseCargo: 150}; // Default
    }

    // Calculate total items and total plant cost for air base cargo rule
    const totalItems = plants.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );
    const totalPlantCost = plants.reduce((sum, item) => {
      const price = parseFloat(item.usdPriceNew || item.usdPrice || 0);
      const quantity = item.quantity || 1;
      return sum + price * quantity;
    }, 0);

    // Check if air base cargo should be free (>= 15 items AND >= $500 total cost)
    const isFreeBaseCargo = totalItems >= 15 && totalPlantCost >= 500;

    // Use the first plant's data to determine shipping rules
    const firstPlant = plants[0];
    const listingType = firstPlant.listingType?.toLowerCase() || 'single';

    console.log('🚚 Shipping calculation debug:', {
      firstPlant: {
        listingType: firstPlant.listingType,
        listingTypeLower: listingType,
        height: firstPlant.height,
        approximateHeight: firstPlant.approximateHeight,
        potSize: firstPlant.potSize,
        size: firstPlant.size,
      },
    });

    switch (listingType) {
      case 'single':
      case 'single plant':
      case 'discounted':
        // Based on plant height (if available in plant data)
        const height = parseFloat(
          firstPlant.height || firstPlant.approximateHeight || 0,
        );
        return {
          baseCost: height > 12 ? 70 : 50,
          addOnCost: height > 12 ? 7 : 5,
          baseCargo: isFreeBaseCargo ? 0 : 150,
          rule: `Single plant - Height ${height > 12 ? '>12"' : '≤12"'}${
            isFreeBaseCargo ? ' (Free base cargo: ≥15 items & ≥$500)' : ''
          }`,
        };

      case 'growers':
      case "grower's choice":
        // Based on pot size
        const potSize = firstPlant.potSize || firstPlant.size || '2"';
        const potSizeNum = parseFloat(potSize.replace('"', '')) || 2;
        return {
          baseCost: potSizeNum > 4 ? 70 : 50,
          addOnCost: potSizeNum > 4 ? 7 : 5,
          baseCargo: isFreeBaseCargo ? 0 : 150,
          rule: `Grower's Choice - Pot size ${potSizeNum > 4 ? '>4"' : '≤4"'}${
            isFreeBaseCargo ? ' (Free base cargo: ≥15 items & ≥$500)' : ''
          }`,
        };

      case 'wholesale':
        // Wholesale has different pricing - only trigger for actual wholesale items
        const wholePotSize = firstPlant.potSize || firstPlant.size || '2"';
        const wholePotSizeNum = parseFloat(wholePotSize.replace('"', '')) || 2;
        return {
          baseCost: wholePotSizeNum > 4 ? 200 : 150,
          addOnCost: wholePotSizeNum > 4 ? 25 : 20,
          baseCargo: 250, // Wholesale always has higher base cargo, not affected by free cargo rule
          rule: `Wholesale - Pot size ${wholePotSizeNum > 4 ? '>4"' : '≤4"'}`,
        };

      default:
        // Default to single plant pricing for any unrecognized listing types
        const defaultHeight = parseFloat(
          firstPlant.height || firstPlant.approximateHeight || 0,
        );
        return {
          baseCost: defaultHeight > 12 ? 70 : 50,
          addOnCost: defaultHeight > 12 ? 7 : 5,
          baseCargo: isFreeBaseCargo ? 0 : 150,
          rule: `Default (Single plant) - Height ${
            defaultHeight > 12 ? '>12"' : '≤12"'
          }${isFreeBaseCargo ? ' (Free base cargo: ≥15 items & ≥$500)' : ''}`,
        };
    }
  };

  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');
  const [leafPoints, setLeafPoints] = useState(0);
  const [plantCredits, setPlantCredits] = useState(0);
  const [shippingCredits, setShippingCredits] = useState(0);

  // Toggle states for switches
  const [upsNextDayEnabled, setUpsNextDayEnabled] = useState(false);
  const [leafPointsEnabled, setLeafPointsEnabled] = useState(false);
  const [plantCreditsEnabled, setPlantCreditsEnabled] = useState(false);
  const [shippingCreditsEnabled, setShippingCreditsEnabled] = useState(false);

  // Toggle handlers
  const toggleUpsNextDay = () => {
    setUpsNextDayEnabled(!upsNextDayEnabled);
    console.log('UPS Next Day toggled:', !upsNextDayEnabled);
  };

  const toggleLeafPoints = () => {
    setLeafPointsEnabled(!leafPointsEnabled);
    console.log('Leaf Points toggled:', !leafPointsEnabled);
  };

  const togglePlantCredits = () => {
    setPlantCreditsEnabled(!plantCreditsEnabled);
    console.log('Plant Credits toggled:', !plantCreditsEnabled);
  };

  const toggleShippingCredits = () => {
    setShippingCreditsEnabled(!shippingCreditsEnabled);
    console.log('Shipping Credits toggled:', !shippingCreditsEnabled);
  };

  // Prepare plant items for display - handle cart data, direct product data, and buy now
  const plantItems = useMemo(() => {
    console.log('plantData test', plantData);
    if (fromBuyNow && plantData) {
      return [
        {
          id: plantCode || Math.random().toString(),
          image: plantData.imagePrimary
            ? {uri: plantData.imagePrimary}
            : require('../../../assets/buyer-icons/png/ficus-lyrata.png'),
          name:
            `${plantData.genus || ''} ${plantData.species || ''}`.trim() ||
            'Unknown Plant',
          variation:
            plantData.variegation && plantData.variegation !== 'None'
              ? plantData.variegation
              : 'Standard',
          size: selectedPotSize || '2"',
          price: parseFloat(
            plantData.finalPrice ||
              plantData.usdPriceNew ||
              plantData.usdPrice ||
              '0',
          ),
          originalPrice:
            plantData.hasDiscount && plantData.originalPrice
              ? parseFloat(plantData.originalPrice)
              : null,
          quantity: quantity,
          title: 'Direct Purchase from Plant Detail',
          country: (() => {
            // Log determination process
            const directCountry = plantData.country;
            const variationCurrency =
              plantData.variations && plantData.variations.length > 0
                ? plantData.variations[0].localCurrency
                : null;
            const countryFromVariation = variationCurrency
              ? getCountryFromCurrency(variationCurrency)
              : null;
            const mainCurrency = plantData.localCurrency;
            const countryFromMain = mainCurrency
              ? getCountryFromCurrency(mainCurrency)
              : null;

            // For Grower's Choice and Wholesale, prioritize using variation currency
            const isGrowersOrWholesale =
              plantData.listingType === "Grower's Choice" ||
              plantData.listingType === 'Wholesale' ||
              plantData.listingType === 'Growers Choice';

            let result;
            if (isGrowersOrWholesale && countryFromVariation) {
              // For Grower's Choice and Wholesale, use variation currency country if available
              result = countryFromVariation;
            } else {
              // For other listing types, use direct country first
              result = directCountry || countryFromVariation || countryFromMain;
            }

            console.log('Country determination:', {
              directCountry,
              variationCurrency,
              countryFromVariation,
              mainCurrency,
              countryFromMain,
              listingType: plantData.listingType,
              isGrowersOrWholesale,
              result,
            });

            return result;
          })(),
          shippingMethod: 'Plant / UPS Ground Shipping',
          plantCode: plantCode,
          listingType: plantData.listingType,
          discount:
            plantData.hasDiscount && plantData.discountAmount
              ? `${Math.round(
                  (plantData.discountAmount / plantData.originalPrice) * 100,
                )}%`
              : null,
          hasAirCargo: true,
        },
      ];
    } else if (useCart && cartItems.length > 0) {
      return cartItems.map(item => ({
        id: item.id || item.cartItemId,
        image: item.image || require('../../../assets/images/plant1.png'),
        name: item.name || 'Unknown Plant',
        variation: item.subtitle?.split(' • ')[0] || 'Standard',
        size:
          item.subtitle
            ?.split(' • ')[1]
            ?.replace(' pot', '')
            .replace(' inch', '"') ||
          item.potSize ||
          '2"',
        price: item.price || 0,
        originalPrice: item.originalPrice,
        quantity: item.quantity || 1,
        title: 'Delivery Details',
        country: item.flagIcon,
        shippingMethod: item.shippingInfo || 'Plant / UPS Ground Shipping',
        plantCode: item.plantCode,
        listingType:
          item.listingType ||
          (item.originalPrice ? 'Discounted' : 'Single Plant'),
        discount: item.originalPrice
          ? `${Math.round(
              ((item.originalPrice - item.price) / item.originalPrice) * 100,
            )}%`
          : null,
        hasAirCargo: true,
        // Additional cart-specific data
        availableQuantity: item.availableQuantity,
        isUnavailable: item.isUnavailable,
        flightInfo: item.flightInfo,
        cartItemId: item.cartItemId,
      }));
    } else if (productData.length > 0) {
      return productData.map(item => ({
        id: item.id || Math.random().toString(),
        image: item.image || require('../../../assets/images/plant1.png'),
        name: item.name || 'Unknown Plant',
        variation: item.variation || item.variegation || 'Standard',
        size: item.size || item.potSize || '2"',
        price: item.price || 0,
        originalPrice: item.originalPrice,
        quantity: item.quantity || 1,
        title: item.title || 'Rare Tropical Plants from Thailand',
        country: item.country || 'TH',
        shippingMethod: item.shippingMethod || 'Plant / UPS Ground Shipping',
        plantCode: item.plantCode,
        listingType: item.listingType,
        discount: item.discount,
        hasAirCargo: item.hasAirCargo !== false,
      }));
    } else {
      return [];
    }
  }, [
    fromBuyNow,
    plantData,
    selectedPotSize,
    quantity,
    plantCode,
    useCart,
    cartItems,
    productData,
  ]);

  // Update selected flight date when cart items change
  useEffect(() => {
    if (useCart && cartItems.length > 0) {
      const latestFlightDate = getInitialFlightDate();
      if (latestFlightDate && latestFlightDate !== 'N/A') {
        setSelectedFlightDate(latestFlightDate);
        console.log(
          '🛫 Flight date updated from cart analysis:',
          latestFlightDate,
        );
      }
    }
  }, [useCart, cartItems]);

  // Fetch buyer orders and check if any order has status 'Ready To Fly'.
  // This is defensive: the API can return an array, a single object, or nested shapes.
  // When a matching prior-paid order exists we credit the current cart's base air cargo
  // so the effective base air cargo on checkout becomes $0.
  useEffect(() => {
    let mounted = true;
    const checkReadyToFlyOrders = async () => {
      try {
        const params = {limit: 50, status: 'Ready to Fly'};

        const resp = await getBuyerOrdersApi(params);
        if (!mounted) return;

        // Normalize possible response shapes into an array of orders
        let orders = [];
        try {
          if (Array.isArray(resp?.data?.orders)) orders = resp.data.orders;
          else if (Array.isArray(resp?.data)) orders = resp.data;
          else if (Array.isArray(resp?.data?.data)) orders = resp.data.data;
          else if (
            resp?.data?.data?.plants &&
            Array.isArray(resp.data.data.plants)
          )
            orders = resp.data.data.plants;
          else if (resp?.data && typeof resp.data === 'object') {
            // resp.data might be a single order object
            const maybe = resp.data.orders || resp.data.order || resp.data;
            orders = Array.isArray(maybe) ? maybe : [maybe];
          }
        } catch (e) {
          // Fallback to empty array on unexpected shapes
          orders = [];
        }

        console.log('🔎 Buyer orders fetched (status=Ready to Fly) preview:', {
          respPreview: resp?.data || resp,
          ordersCount: orders.length,
        });

        // Detect if any order (or nested order object) has status 'Ready to Fly'
        const hasReadyToFly = orders.some(o => {
          const statusCandidate = (
            o?.status ||
            o?.order?.status ||
            o?.order?.statusText ||
            ''
          )
            .toString()
            .toLowerCase();
          return (
            statusCandidate.includes('ready to fly') ||
            statusCandidate.includes('readytofly')
          );
        });

        if (hasReadyToFly && resp?.success !== false) {
          const shippingRates = calculateUpsShippingCost();
          const baseCargoAmount = shippingRates?.baseCargo || 150;
          // Credit the buyer the full base cargo for the current cart so effective becomes $0
          setPriorPaidAirBaseCargoAmount(baseCargoAmount);
          console.log(
            'Found Ready To Fly order(s) — applying air base cargo credit of',
            baseCargoAmount,
          );
        } else {
          setPriorPaidAirBaseCargoAmount(0);
        }
      } catch (error) {
        console.warn(
          'Failed to fetch buyer orders for Ready To Fly check:',
          error,
        );
        setPriorPaidAirBaseCargoAmount(0);
      }
    };

    checkReadyToFlyOrders();
    return () => {
      mounted = false;
    };
  }, [cargoDate, selectedFlightDate]);

  const orderSummary = useMemo(() => {
    // Calculate default shipping cost
    const defaultShippingRates = calculateUpsShippingCost();
    const defaultShipping = defaultShippingRates.baseCost;

    const defaultSummary = {
      totalItems: 0,
      subtotal: 0,
      shipping: defaultShipping,
      discount: 0,
      finalTotal: defaultShipping,
    };

    if (!plantItems || plantItems.length === 0) {
      console.log('🛒 No plant items for order summary');
      return defaultSummary;
    }

    const totalItems = plantItems.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );

    // Use the totalAmount passed from cart if available, otherwise calculate from plantItems
    let subtotal;
    if (totalAmount && totalAmount > 0) {
      // Use the exact total from cart calculation
      subtotal = totalAmount;
      console.log('💰 Using cart total amount:', totalAmount);
    } else {
      // Calculate from plant items (for Buy Now flow)
      subtotal = plantItems.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0,
      );
      console.log('💰 Calculated subtotal from plant items:', subtotal);
    }

    // Calculate discount amount from route params if available
    let discountAmount = 0;
    if (route.params?.discountAmount) {
      discountAmount = route.params.discountAmount;
      console.log('💸 Using cart discount amount:', discountAmount);
    } else {
      // Calculate discount from plant items
      discountAmount = plantItems.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
          return sum + (item.originalPrice - item.price) * (item.quantity || 1);
        }
        return sum;
      }, 0);
      console.log('💸 Calculated discount from plant items:', discountAmount);
    }

    // Calculate UPS 2nd Day shipping cost based on plant characteristics
    const shippingRates = calculateUpsShippingCost();
    let shipping = shippingRates.baseCost;

    // Add costs for additional plants beyond the first one
    const totalItemsForShipping = plantItems.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );
    if (totalItemsForShipping > 1) {
      shipping += (totalItemsForShipping - 1) * shippingRates.addOnCost;
    }

    // Calculate wholesale air cargo separately if there are wholesale items
    let wholesaleAirCargo = 0;
    let airBaseCargo = shippingRates.baseCargo || 0;

    const wholesaleItems = plantItems.filter(
      item =>
        item.listingType?.toLowerCase() === 'wholesale' ||
        item.listingType?.toLowerCase().includes('wholesale'),
    );

    // Rule: If cart has wholesale items, base air cargo becomes zero and wholesale air cargo is populated
    if (wholesaleItems.length > 0) {
      airBaseCargo = 0; // Base air cargo becomes zero when wholesale items are present

      // Calculate wholesale air cargo cost - use the wholesale base cargo from shipping rates
      const wholesaleQuantity = wholesaleItems.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0,
      );
      wholesaleAirCargo = shippingRates.baseCargo; // Use the wholesale base cargo (250)

      // Add additional wholesale item costs if more than 1 wholesale item
      if (wholesaleQuantity > 1) {
        wholesaleAirCargo += (wholesaleQuantity - 1) * 50; // $50 per additional wholesale item
      }
    }

    console.log(
      `📦 UPS 2nd Day Shipping: Base $${shippingRates.baseCost}, Add-on $${
        shippingRates.addOnCost
      } × ${totalItemsForShipping - 1} = $${shipping} (${shippingRates.rule})`,
    );
    console.log(
      `✈️ Air Cargo: Base Air Cargo $${airBaseCargo}, Wholesale Air Cargo $${wholesaleAirCargo}`,
    );

    // Add UPS Next Day upgrade if enabled (60% of UPS 2nd day shipping cost)
    let upsNextDayUpgradeCost = 0;
    if (upsNextDayEnabled) {
      upsNextDayUpgradeCost = shipping * 0.6; // 60% of UPS 2nd day shipping cost
      shipping += upsNextDayUpgradeCost;
      console.log(
        `🚀 UPS Next Day upgrade: +$${upsNextDayUpgradeCost.toFixed(
          2,
        )} (60% of UPS 2nd day $${
          shipping - upsNextDayUpgradeCost
        }), UPS shipping now: $${shipping}`,
      );
    }

    // Apply prior-paid air base cargo credit (if any) - ensure we don't go negative
    const appliedAirBaseCargoCredit = Math.min(
      priorPaidAirBaseCargoAmount || 0,
      airBaseCargo || 0,
    );
    const effectiveAirBaseCargo = Math.max(
      0,
      (airBaseCargo || 0) - appliedAirBaseCargoCredit,
    );

    // Calculate total shipping including air cargo costs
    const totalShippingCost =
      shipping + effectiveAirBaseCargo + wholesaleAirCargo;
    console.log(
      `💸 Total Shipping Cost: UPS $${shipping} + Effective Base Air Cargo $${effectiveAirBaseCargo} + Wholesale Air Cargo $${wholesaleAirCargo} (credit applied: $${appliedAirBaseCargoCredit}) = $${totalShippingCost}`,
    );

    // Apply credits
    let creditsApplied = 0;
    if (leafPointsEnabled) {
      creditsApplied += leafPoints;
    }
    if (plantCreditsEnabled) {
      creditsApplied += plantCredits;
    }
    if (shippingCreditsEnabled) {
      creditsApplied += shippingCredits;
    }

    const finalTotal = Math.max(
      0,
      subtotal + totalShippingCost - creditsApplied,
    );

    const summary = {
      totalItems,
      subtotal,
      shipping, // This is just UPS 2nd day shipping (without air cargo)
      upsNextDayUpgradeCost: upsNextDayUpgradeCost, // Add UPS Next Day upgrade cost to summary
      airBaseCargo: airBaseCargo, // Original air base cargo (before credit)
      airBaseCargoCreditApplied: appliedAirBaseCargoCredit, // Credit applied because buyer already paid base cargo
      airBaseCargoEffective: effectiveAirBaseCargo, // Effective base cargo after credit
      wholesaleAirCargo: wholesaleAirCargo, // Add wholesale air cargo to summary
      totalShippingCost: totalShippingCost, // Total of all shipping costs combined
      discount: discountAmount,
      creditsApplied,
      finalTotal,
    };

    console.log('🛒 Order Summary:', {
      ...summary,
      plantItemsCount: plantItems.length,
      routeParams: route.params ? Object.keys(route.params) : 'none',
      toggleStates: {
        upsNextDayEnabled,
        leafPointsEnabled,
        plantCreditsEnabled,
        shippingCreditsEnabled,
      },
    });

    return summary;
  }, [
    plantItems,
    cartItems, // Added for shipping calculation
    totalAmount,
    route.params?.discountAmount,
    upsNextDayEnabled,
    leafPointsEnabled,
    plantCreditsEnabled,
    shippingCreditsEnabled,
    leafPoints,
    plantCredits,
    shippingCredits,
    priorPaidAirBaseCargoAmount,
  ]);

  const quantityBreakdown = useMemo(() => {
    const defaultBreakdown = {
      singlePlant: 0,
      wholesale: 0,
    };

    if (!plantItems || plantItems.length === 0) {
      return defaultBreakdown;
    }

    const singlePlant = plantItems.reduce((sum, item) => {
      if (
        item.listingType === 'Single Plant' ||
        item.listingType === 'Discounted' ||
        !item.listingType
      ) {
        return sum + (item.quantity || 1);
      }
      return sum;
    }, 0);

    const wholesale = plantItems.reduce((sum, item) => {
      if (item.listingType === 'Wholesale') {
        return sum + (item.quantity || 1);
      }
      return sum;
    }, 0);

    return {
      singlePlant,
      wholesale,
    };
  }, [plantItems]);

  // Fetch the default address on screen focus (including initial load)
  useFocusEffect(
    React.useCallback(() => {
      const fetchDefaultAddress = async () => {
        try {
          const response = await getAddressBookEntriesApi();

          if (response?.success && response?.data) {
            // Look for the default address
            const defaultAddress = response.data.find(
              address => address.isDefault,
            );

            if (defaultAddress) {
              console.log('Default address found:', defaultAddress);
              setDeliveryDetails({
                address: {
                  street:
                    defaultAddress.streetAddress ||
                    defaultAddress.address ||
                    '',
                  city: defaultAddress.city || '',
                  state: defaultAddress.state || '',
                  zipCode:
                    defaultAddress.postalCode || defaultAddress.zipCode || '',
                  country: defaultAddress.country || 'US',
                },
                contactPhone: defaultAddress.phoneNumber || '+1-555-0123',
                specialInstructions: 'Leave at front door',
              });
            } else if (response.data.length > 0) {
              // If no default address is set, use the first one
              const firstAddress = response.data[0];
              console.log(
                'No default address found, using first address:',
                firstAddress,
              );
              setDeliveryDetails({
                address: {
                  street:
                    firstAddress.streetAddress || firstAddress.address || '',
                  city: firstAddress.city || '',
                  state: firstAddress.state || '',
                  zipCode:
                    firstAddress.postalCode || firstAddress.zipCode || '',
                  country: firstAddress.country || 'US',
                },
                contactPhone: firstAddress.phoneNumber || '+1-555-0123',
                specialInstructions: 'Leave at front door',
              });
            }
          }
        } catch (error) {
          console.error('Error fetching default address:', error);
        }
      };

      fetchDefaultAddress();
    }, []),
  );

  // Handle Buy Now specific data updates
  useEffect(() => {
    if (fromBuyNow && plantData) {
      // Update flight date if available from plant data
      if (plantData.flightDate) {
        setSelectedFlightDate(plantData.flightDate);
      }

      // Update cargo date if available
      if (plantData.cargoDate) {
        setCargoDate(plantData.cargoDate);
      }
    }
  }, [fromBuyNow, plantData]);

  useEffect(() => {
    // Handle when app is opened from deep link
    const handleUrl = event => {
      const url = event.url;

      if (url.startsWith('ileafu://payment-success')) {
        Alert.alert(
          'Payment Success',
          'Order completed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Orders');
              },
            },
          ],
          {cancelable: false},
        );
        navigation.navigate('Orders');
      }
    };

    // Listen to incoming links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened from a link
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({url});
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Validate required data
      if (!plantItems || plantItems.length === 0) {
        Alert.alert('Error', 'No items to checkout');
        return;
      }

      // Prepare order data for API
      const orderData = {
        cargoDate,
        selectedFlightDate,
        deliveryDetails: {
          address: deliveryDetails.address,
          contactPhone: deliveryDetails.contactPhone,
          specialInstructions: deliveryDetails.specialInstructions,
        },
        paymentMethod: paymentMethod || 'VENMO',
        leafPoints: leafPointsEnabled ? leafPoints : 0,
        plantCredits: plantCreditsEnabled ? plantCredits : 0,
        shippingCredits: shippingCreditsEnabled ? shippingCredits : 0,
        upsNextDay: upsNextDayEnabled,
        useCart: useCart && cartItems.length > 0,
        orderSummary: {
          subtotal: orderSummary.subtotal,
          discount: orderSummary.discount,
          creditsApplied: orderSummary.creditsApplied || 0,
          shipping: orderSummary.shipping,
          total: orderSummary.finalTotal,
        },
      };

      // Add items based on checkout type
      if (fromBuyNow && plantData) {
        // Direct purchase from plant detail
        orderData.productData = [
          {
            plantCode: plantCode,
            genus: plantData.genus,
            species: plantData.species,
            variegation: plantData.variegation,
            potSize: selectedPotSize,
            quantity: quantity,
            price: plantData.usdPriceNew || plantData.usdPrice,
            originalPrice: plantData.usdPrice,
            country: plantData.country,
            // Include flight/cargo date and plant source country for backend
            flightDate:
              plantData.flightDate || plantData.plantFlightDate || cargoDate,
            plantSourceCountry:
              plantData.country || plantData.plantSourceCountry || null,
          },
        ];
        orderData.useCart = false;
      } else if (useCart && cartItems.length > 0) {
        // Use cart items with enhanced data
        orderData.useCart = true;

        // Console log cart items to debug plantSourceCountry
        console.log('Cart items for checkout:', cartItems);

        // When using cart, we need to add plantSourceCountry to each item
        // Also map the cart item data to a properly formatted productData array
        orderData.productData = cartItems.map(item => {
          // Extract country from cart item
          const country =
            item.country ||
            // Check for flag emoji to convert to country code
            (item.flagIcon === '🇵🇭'
              ? 'PH'
              : item.flagIcon === '🇹🇭'
              ? 'TH'
              : item.flagIcon === '🇮🇩'
              ? 'ID'
              : // Fall back to extracting from currency if available
              item.localCurrency
              ? getCountryFromCurrency(item.localCurrency)
              : 'ID');

          return {
            plantCode: item.plantCode,
            quantity: item.quantity || 1,
            potSize: item.potSize || item.size,
            price: item.price,
            // Include flight date and plantSourceCountry fields
            flightDate: item.flightDate || cargoDate,
            plantSourceCountry: country,
          };
        });

        // Keep the legacy cartItems structure for backward compatibility
        orderData.cartItems = cartItems.map(item => ({
          cartItemId: item.cartItemId,
          plantCode: item.plantCode,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          listingType: item.listingType,
          flightInfo: item.flightInfo,
          shippingInfo: item.shippingInfo,
          availableQuantity: item.availableQuantity,
          isUnavailable: item.isUnavailable,
          flagIcon: item.flagIcon,
          subtitle: item.subtitle,
          plantSourceCountry:
            item.country ||
            (item.flagIcon === '🇵🇭'
              ? 'PH'
              : item.flagIcon === '🇹🇭'
              ? 'TH'
              : item.flagIcon === '🇮🇩'
              ? 'ID'
              : item.localCurrency
              ? getCountryFromCurrency(item.localCurrency)
              : 'ID'),
        }));
        // The API can use either the cart items from backend or the passed cart items
      } else if (productData && productData.length > 0) {
        // Product data checkout
        orderData.productData = productData.map(item => ({
          plantCode: item.plantCode,
          genus: item.genus || item.name?.split(' ')[0],
          species: item.species || item.name?.split(' ')[1],
          variegation: item.variegation || item.variation,
          potSize: item.potSize || item.size,
          quantity: item.quantity || 1,
          price: item.price,
          originalPrice: item.originalPrice,
          country: item.country,
        }));
        orderData.useCart = false;
      } else {
        Alert.alert('Error', 'No valid items found for checkout');
        return;
      }

      console.log('🛒 Starting checkout with order data:', orderData);

      // Show confirmation dialog
      Alert.alert(
        'Confirm Order',
        `Total: ${formatCurrencyFull(
          orderSummary.finalTotal,
        )}\n\nProceed with checkout?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Proceed',
            onPress: async () => {
              // Call checkout API
              const result = await checkoutApi(orderData);

              if (result.success) {
                const {transactionNumber, paypalOrderId, approvalUrl, orderId} =
                  result.data;

                Alert.alert(
                  'Order Created Successfully!',
                  `Order #${transactionNumber} has been created.\n\nYou will now be redirected to complete payment.`,
                  [
                    {
                      text: 'Complete Payment',
                      onPress: () => {
                        // TODO: Payment module integration pending
                        // Currently redirecting to orders screen while waiting for payment module to be finished
                        console.log(
                          '💳 Payment button clicked - redirecting to orders screen',
                        );
                        Linking.openURL(
                          `${paymentPaypalVenmoUrl}?amount=${orderSummary.finalTotal}&ileafuOrderId=${orderId}`,
                        );
                      },
                    },
                  ],
                );
              } else {
                Alert.alert(
                  'Checkout Failed',
                  result.error ||
                    'An error occurred during checkout. Please try again.',
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('❌ Checkout error:', error);
      Alert.alert(
        'Checkout Error',
        error.message || 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryDetails = () => {
    // Navigate to address book screen for selecting shipping address
    navigation.navigate('AddressBookScreen', {
      fromCheckout: true,
      onSelectAddress: selectedAddress => {
        // Update delivery details with the selected address
        setDeliveryDetails({
          ...deliveryDetails,
          address: {
            street: selectedAddress.streetAddress,
            city: selectedAddress.city,
            state: selectedAddress.state,
            zipCode: selectedAddress.postalCode,
            country: selectedAddress.country,
          },
          contactPhone:
            selectedAddress.phoneNumber || deliveryDetails.contactPhone,
        });
      },
    });
  };

  const handleUpdatePaymentMethod = () => {
    // Show payment method selector
    Alert.alert(
      'Select Payment Method',
      'Choose your preferred payment method',
      [
        {text: 'PayPal', onPress: () => setPaymentMethod('PAYPAL')},
        {text: 'Venmo', onPress: () => setPaymentMethod('VENMO')},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.controls}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>Checkout</Text>

          {/* Navbar Right (hidden) */}
          <View style={styles.navbarRight} />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContentContainer,
          {paddingBottom: 100 + Math.max(insets.bottom, 8)},
        ]}>
        {/* Shipping Address Section */}
        <View style={styles.shipping}>
          {/* Title */}
          <View style={styles.shippingTitle}>
            <Text style={styles.shippingTitleText}>Shipping Address</Text>
          </View>

          {/* Address List */}
          <View style={styles.addressList}>
            <TouchableOpacity
              style={styles.addressContent}
              onPress={handleUpdateDeliveryDetails}>
              {/* Icon Circle */}
              <View style={styles.iconCircle}>
                <View style={styles.iconContainer}>
                  <LocationIcon width={24} height={24} />
                </View>
              </View>

              {/* Details */}
              <View style={styles.addressDetails}>
                <View style={styles.addressAction}>
                  <Text style={styles.addressText}>
                    {deliveryDetails.address.street}
                    {'\n'}
                    {deliveryDetails.address.city},{' '}
                    {deliveryDetails.address.state}{' '}
                    {deliveryDetails.address.zipCode}
                  </Text>

                  {/* Action Arrow */}
                  <View style={styles.actionContainer}>
                    <View style={styles.arrow}>
                      <ArrowRightIcon width={24} height={24} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant Flight Section */}
        <View style={styles.plantFlight}>
          {/* Title */}
          <View style={styles.flightTitle}>
            <Text style={styles.flightTitleText}>Plant Flight</Text>
          </View>

          {/* Options */}
          <View style={styles.flightOptions}>
            <View style={styles.optionCards}>
              <Text style={styles.optionLabel}>Select One:</Text>

              {/* Flight Options */}
              <View style={styles.flightOptionsRow}>
                {flightDateOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionCard,
                      selectedFlightDate === option.value
                        ? styles.selectedOptionCard
                        : styles.unselectedOptionCard,
                    ]}
                    onPress={() => setSelectedFlightDate(option.value)}>
                    <Text
                      style={
                        selectedFlightDate === option.value
                          ? styles.optionText
                          : styles.unselectedOptionText
                      }>
                      {option.label}
                    </Text>
                    <Text style={styles.optionSubtext}>Sat</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Plant List Section */}
        <View style={styles.plantList}>
          {/* Dynamic Plant Items */}
          {plantItems.map((item, index) => (
            <View key={item.id || index} style={styles.plantItemWrapper}>
              <PlantItemComponent
                image={item.image}
                name={item.name}
                variation={item.variation}
                size={item.size}
                price={item.price}
                quantity={item.quantity}
                title={item.title}
                country={item.country}
                shippingMethod={item.shippingMethod}
                listingType={item.listingType}
                discount={item.discount}
                originalPrice={item.originalPrice}
                hasAirCargo={item.hasAirCargo}
                onPress={() => {
                  // Navigate to plant detail screen using plantCode
                  if (item.plantCode) {
                    navigation.navigate('ScreenPlantDetail', {
                      plantCode: item.plantCode,
                    });
                  } else {
                    console.warn('No plantCode available for navigation');
                  }
                }}
              />

              {/* Details for each item */}
              <View style={styles.plantItemDetails}>
                {/* Title + Country */}
                <View style={styles.titleCountry}>
                  <Text style={styles.titleText}>
                    {item.title || 'Rare Tropical Plants from Thailand'}
                  </Text>

                  {/* Country */}
                  <View style={styles.countryContainer}>
                    <Text style={styles.countryText}></Text>
                    {renderCountryFlag(item.country)}
                  </View>
                </View>

                {/* Plant / UPS Shipping */}
                <View style={styles.plantShipping}>
                  {/* Content */}
                  <View style={styles.shippingContent}>
                    <TruckIcon
                      width={24}
                      height={24}
                      style={styles.shippingIcon}
                    />
                    <Text style={styles.shippingText}>
                      {item.shippingMethod || 'Plant / UPS Ground Shipping'}
                    </Text>
                  </View>
                </View>

                {/* Flight Info (if available from cart) */}
                {item.flightInfo && (
                  <View style={styles.plantShipping}>
                    <View style={styles.shippingContent}>
                      <TruckIcon
                        width={24}
                        height={24}
                        style={styles.airCargoIcon}
                      />
                      <Text style={styles.shippingText}>{item.flightInfo}</Text>
                    </View>
                  </View>
                )}

                {/* Air Cargo Option (if available) */}
                {item.hasAirCargo && !item.flightInfo && (
                  <View style={styles.plantShipping}>
                    <View style={styles.shippingContent}>
                      <TruckIcon
                        width={24}
                        height={24}
                        style={styles.airCargoIcon}
                      />
                      <Text style={styles.shippingText}>
                        Plant / Wholesale Air Cargo
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <View style={styles.paymentMethodRow}>
            <Text style={styles.paymentMethodTitle}>Payment Method</Text>
            <Text style={styles.paymentOptionText}>Venmo</Text>
          </View>
        </View>

        {/* Payment Method Divider */}
        <View style={styles.paymentDivider}>
          <View style={styles.paymentDividerLine} />
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          {/* Quantity */}
          <View style={styles.quantity}>
            {/* Title */}
            <View style={styles.quantityTitle}>
              <Text style={styles.quantityTitleText}>Your Plant Haul</Text>
            </View>

            {/* Content */}
            <View style={styles.quantityContent}>
              {/* Single / Growers */}
              <View style={styles.singleGrowerRow}>
                <Text style={styles.summaryRowLabel}>
                  Single Plant Quantity
                </Text>
                <Text style={styles.summaryRowNumber}>
                  {quantityBreakdown.singlePlant}
                </Text>
              </View>

              {/* Wholesale */}
              <View style={styles.wholesaleRow}>
                <Text style={styles.summaryRowLabel}>Wholesale Quantity</Text>
                <Text style={styles.summaryRowNumber}>
                  {quantityBreakdown.wholesale}
                </Text>
              </View>

              {/* Total */}
              <View style={styles.quantityTotalRow}>
                <Text style={styles.quantityTotalLabel}>Total quantity</Text>
                <Text style={styles.quantityTotalNumber}>
                  {orderSummary.totalItems}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Subtotal */}
          <View style={styles.subtotal}>
            {/* Total */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Total Plant Cost</Text>
              <Text style={styles.subtotalNumber}>
                {formatCurrencyFull(orderSummary.subtotal)}
              </Text>
            </View>

            {/* Discount */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Total Discount on Plants</Text>
              <Text style={styles.subtotalNumber}>
                -{formatCurrencyFull(orderSummary.discount)}
              </Text>
            </View>

            {/* Credits Applied */}
            {orderSummary.creditsApplied > 0 && (
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Credits Applied</Text>
                <Text style={styles.subtotalNumber}>
                  -{formatCurrencyFull(orderSummary.creditsApplied)}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Shipping Summary */}
          <View style={styles.shippingSummary}>
            {/* Title */}
            <View style={styles.shippingSummaryTitle}>
              <Text style={styles.shippingSummaryTitleText}>
                Where your shipping bucks go
              </Text>
            </View>

            {/* Content */}
            <View style={styles.shippingSummaryContent}>
              {/* Shipping Fee */}
              <View style={styles.shippingFeeRow}>
                <Text style={styles.summaryRowLabel}>
                  {upsNextDayEnabled
                    ? 'UPS Next Day shipping'
                    : 'UPS 2nd day shipping'}
                </Text>
                <Text style={styles.summaryRowNumber}>
                  {formatCurrencyFull(orderSummary.shipping)}
                </Text>
              </View>

              {/* Form / Labeled Toggle */}
              <View style={styles.labeledToggle}>
                <View style={styles.toggleLabel}>
                  <Text style={styles.toggleLabelText}>
                    Upgrading to UPS Next Day
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.formToggle}
                  onPress={toggleUpsNextDay}>
                  <View style={styles.toggleText}>
                    <Text
                      style={
                        upsNextDayEnabled
                          ? styles.toggleOnLabel
                          : styles.toggleOffLabel
                      }>
                      {upsNextDayEnabled ? '+' : '-'}
                    </Text>
                    <Text
                      style={
                        upsNextDayEnabled
                          ? styles.toggleOnNumber
                          : styles.toggleOffNumber
                      }>
                      {upsNextDayEnabled
                        ? formatCurrencyFull(
                            orderSummary.upsNextDayUpgradeCost || 0,
                          )
                        : formatCurrencyFull(0)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.switchContainer,
                      upsNextDayEnabled && styles.switchContainerActive,
                    ]}>
                    <View
                      style={[
                        styles.switchKnob,
                        upsNextDayEnabled && styles.switchKnobActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Base Air Cargo (effective after any prior-paid credit) */}
              <View style={styles.baseAirCargoRow}>
                <Text style={styles.summaryRowLabel}>Base Air Cargo</Text>
                <Text style={styles.summaryRowNumber}>
                  {formatCurrencyFull(
                    orderSummary.airBaseCargoEffective ??
                      orderSummary.airBaseCargo,
                  )}
                </Text>
              </View>

              {/* Wholesale Air Cargo */}
              <View style={styles.wholesaleAirCargoRow}>
                <Text style={styles.summaryRowLabel}>Wholesale Air Cargo</Text>
                <Text style={styles.summaryRowNumber}>
                  {formatCurrencyFull(orderSummary.wholesaleAirCargo)}
                </Text>
              </View>

              {/* Air Cargo Credit (shown when applied) */}
              {(orderSummary.airBaseCargoCreditApplied || 0) > 0 && (
                <View style={styles.airCargoCreditRow}>
                  <Text style={styles.summaryRowLabel}>
                    Air Cargo Shipping Credit
                  </Text>
                  <Text style={styles.airCargoCreditAmount}>
                    -
                    {formatCurrencyFull(orderSummary.airBaseCargoCreditApplied)}
                  </Text>
                </View>
              )}

              {/* Total */}
              <View style={styles.shippingTotalRow}>
                <Text style={styles.shippingTotalLabel}>
                  Total Shipping Cost
                </Text>
                <Text style={styles.shippingTotalNumber}>
                  {formatCurrencyFull(orderSummary.totalShippingCost)}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Points */}
          <View style={styles.points}>
            {/* Title */}
            <View style={styles.pointsTitle}>
              <Text style={styles.pointsTitleText}>
                Use available iLeaf points, rewards, and discount
              </Text>
            </View>

            {/* Point Options */}
            <View style={styles.pointOptions}>
              {/* Discount */}
              <View style={styles.discountOption}>
                {/* Text Field */}
                <View style={styles.textField}>
                  <View style={styles.textFieldInput}>
                    <TagIcon width={24} height={24} />
                    <Text style={styles.textFieldPlaceholder}>
                      Discount code
                    </Text>
                  </View>
                </View>
                {/* Apply Button */}
                <TouchableOpacity style={styles.applyButton}>
                  <View style={styles.applyButtonText}>
                    <Text style={styles.applyButtonLabel}>Apply</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Leaf Points */}
              <View style={styles.leafPointsRow}>
                <View style={styles.iconLabel}>
                  <View style={styles.leafIcon}>
                    <LeafIcon width={36} height={36} />
                  </View>
                  <Text style={styles.iconLabelText}>Leaf Points</Text>
                </View>
                <TouchableOpacity
                  style={styles.formToggle}
                  onPress={toggleLeafPoints}>
                  <View style={styles.toggleText}>
                    <Text
                      style={
                        leafPointsEnabled
                          ? styles.toggleOnLabel
                          : styles.toggleOffLabel
                      }>
                      {leafPointsEnabled ? 'Use' : '-'}
                    </Text>
                    <Text
                      style={
                        leafPointsEnabled
                          ? styles.toggleOnNumber
                          : styles.toggleOffNumber
                      }>
                      {leafPointsEnabled
                        ? formatCurrencyFull(leafPoints)
                        : formatCurrencyFull(0)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.switchContainer,
                      leafPointsEnabled && styles.switchContainerActive,
                    ]}>
                    <View
                      style={[
                        styles.switchKnob,
                        leafPointsEnabled && styles.switchKnobActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Plant Credits */}
              <View style={styles.plantCreditsRow}>
                <View style={styles.iconLabel}>
                  <View style={styles.plantIcon}>
                    <PlantIcon width={36} height={36} />
                  </View>
                  <Text style={styles.iconLabelText}>Plant Credits</Text>
                </View>
                <TouchableOpacity
                  style={styles.formToggle}
                  onPress={togglePlantCredits}>
                  <View style={styles.toggleText}>
                    <Text
                      style={
                        plantCreditsEnabled
                          ? styles.toggleOnLabel
                          : styles.toggleOffLabel
                      }>
                      {plantCreditsEnabled ? 'Use' : '-'}
                    </Text>
                    <Text
                      style={
                        plantCreditsEnabled
                          ? styles.toggleOnNumber
                          : styles.toggleOffNumber
                      }>
                      {plantCreditsEnabled
                        ? formatCurrencyFull(plantCredits)
                        : formatCurrencyFull(0)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.switchContainer,
                      plantCreditsEnabled && styles.switchContainerActive,
                    ]}>
                    <View
                      style={[
                        styles.switchKnob,
                        plantCreditsEnabled && styles.switchKnobActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Shipping Credits */}
              <View style={styles.shippingCreditsRow}>
                <View style={styles.iconLabel}>
                  <View style={styles.shippingIcon}>
                    <TruckBlueIcon width={36} height={36} />
                  </View>
                  <Text style={styles.iconLabelText}>Shipping Credits</Text>
                </View>
                <TouchableOpacity
                  style={styles.formToggle}
                  onPress={toggleShippingCredits}>
                  <View style={styles.toggleText}>
                    <Text
                      style={
                        shippingCreditsEnabled
                          ? styles.toggleOnLabel
                          : styles.toggleOffLabel
                      }>
                      {shippingCreditsEnabled ? 'Use' : '-'}
                    </Text>
                    <Text
                      style={
                        shippingCreditsEnabled
                          ? styles.toggleOnNumber
                          : styles.toggleOffNumber
                      }>
                      {shippingCreditsEnabled
                        ? formatCurrencyFull(shippingCredits)
                        : formatCurrencyFull(0)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.switchContainer,
                      shippingCreditsEnabled && styles.switchContainerActive,
                    ]}>
                    <View
                      style={[
                        styles.switchKnob,
                        shippingCreditsEnabled && styles.switchKnobActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Total Amount */}
          <View style={styles.totalAmount}>
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalAmountLabel}>Total</Text>
              <Text style={styles.totalAmountNumber}>
                {formatCurrencyFull(orderSummary.finalTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Browse More Plants Component */}
        <BrowseMorePlants
          title="More from our Jungle"
          initialLimit={4}
          loadMoreLimit={4}
          showLoadMore={true}
          containerStyle={{marginTop: 24}}
        />
      </ScrollView>

      {/* Fixed Checkout Bar */}
      <View
        style={[
          styles.checkoutBar,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            height: 98 + Math.max(insets.bottom, 8),
          },
        ]}>
        {/* Content */}
        <View style={styles.checkoutContent}>
          {/* Summary */}
          <View style={styles.checkoutSummary}>
            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>
                {formatCurrencyFull(orderSummary.finalTotal)}
              </Text>
              <CaretDownIcon width={24} height={24} style={styles.infoIcon} />
            </View>

            {/* Discount (if available) */}
            {orderSummary.discount > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountSavings}>You're saving</Text>
                <Text style={styles.discountAmount}>
                  {formatCurrencyFull(orderSummary.discount)}
                </Text>
              </View>
            )}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              loading && styles.placeOrderButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={loading}>
            <View style={styles.buttonText}>
              {loading ? (
                <View style={styles.buttonSkeleton} />
              ) : (
                <Text style={styles.buttonLabel}>Place Order</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Home Indicator */}
        <View style={styles.homeIndicator}>
          <View style={styles.gestureBar} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollableContent: {
    flex: 1,
    marginTop: 24,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    width: '100%',
    height: 58,
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
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
  quantityTotalRow: {
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
  summaryRowLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
    width: '100%',
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
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 17,
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
    paddingVertical: 0,
    gap: 8,
    width: '100%',
    height: 56,
    borderRadius: 0,
    flex: 0,
    alignSelf: 'stretch',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 99,
    width: '100%',
    height: 24,
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
    gap: 187,
    width: '100%',
    height: 22,
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
    gap: 187,
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
    gap: 187,
    width: '100%',
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  airCargoCreditRow: {
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
  shippingTotalRow: {
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
    gap: 8,
    width: '100%',
    height: 32,
    borderRadius: 0,
    flex: 0,
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
    shadowColor: '#141414',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 146,
    height: 20,
    flex: 0,
  },
  discountSavings: {
    width: 94,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
  },
  discountAmount: {
    width: 48,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#E7522F',
    flex: 0,
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
});

export default CheckoutScreen;
