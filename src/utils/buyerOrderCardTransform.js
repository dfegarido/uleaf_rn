import IndonesiaFlag from '../assets/buyer-icons/indonesia-flag.svg';
import PhilippinesFlag from '../assets/buyer-icons/philippines-flag.svg';
import PlaneGrayIcon from '../assets/buyer-icons/plane-gray.svg';
import ThailandFlag from '../assets/buyer-icons/thailand-flag.svg';

const FLAG_MAP = {
  TH: ThailandFlag,
  PH: PhilippinesFlag,
  ID: IndonesiaFlag,
};

const VALID_COUNTRY_CODES = ['PH', 'TH', 'ID'];

export const validateCountryCode = (code) => {
  if (!code) return 'ID';
  const upperCode = String(code).toUpperCase();
  return VALID_COUNTRY_CODES.includes(upperCode) ? upperCode : 'ID';
};

export const getCountryCode = (record) => {
  if (!record) return 'ID';
  if (record.plantSourceCountry) return validateCountryCode(record.plantSourceCountry);
  if (record.order?.plantSourceCountry) return validateCountryCode(record.order.plantSourceCountry);
  if (record.products?.length > 0) {
    return validateCountryCode(
      record.products[0].plantSourceCountry || record.products[0].supplierCountry,
    );
  }
  if (record.plantDetails?.plantSourceCountry) {
    return validateCountryCode(record.plantDetails.plantSourceCountry);
  }
  return 'ID';
};

export const getCountryFlag = (record) => {
  const code = getCountryCode(record);
  return FLAG_MAP[code] || IndonesiaFlag;
};

const getPlantImage = (plantDetails, plant) => {
  if (plantDetails?.imageCollectionWebp?.[0]) return { uri: plantDetails.imageCollectionWebp[0] };
  if (plantDetails?.imagePrimaryWebp) return { uri: plantDetails.imagePrimaryWebp };
  if (plantDetails?.imagePrimary) return { uri: plantDetails.imagePrimary };
  if (plantDetails?.image) return { uri: plantDetails.image };
  if (plantDetails?.imageCollection?.[0]) return { uri: plantDetails.imageCollection[0] };
  if (plant?.image) return { uri: plant.image };
  return require('../assets/images/plant1.png');
};

export const getRequestDeadline = (order) => {
  const deliveredDate =
    order?.deliveredDate ||
    order?.deliveryDate ||
    order?.deliveryDetails?.deliveryDate ||
    order?.deliveryDetails?.[0]?.deliveryDate ||
    order?.products?.[0]?.deliveryDate ||
    order?.products?.[0]?.deliveredDate ||
    order?.shippedData?.deliveryDate;

  if (!deliveredDate) return 'TBD';

  try {
    let deliveryDateObj;
    if (deliveredDate._seconds) {
      deliveryDateObj = new Date(deliveredDate._seconds * 1000);
    } else if (deliveredDate.toDate) {
      deliveryDateObj = deliveredDate.toDate();
    } else if (typeof deliveredDate === 'string') {
      deliveryDateObj = new Date(deliveredDate);
    } else if (deliveredDate instanceof Date) {
      deliveryDateObj = deliveredDate;
    } else {
      return 'TBD';
    }

    if (!isNaN(deliveryDateObj.getTime())) {
      const deadline = new Date(deliveryDateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
      return `${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 12:00 AM`;
    }
  } catch (error) {
    console.error('Error parsing delivery date:', error);
  }
  return 'TBD';
};

const mapPayToBoardStatus = (status) => {
  if (!status) return 'Pay to Board';
  if (status === 'pending_payment') return 'Pay to Board';
  if (status === 'ready_to_fly') return 'Ready to Fly';
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildCardId = (orderMeta, plant) =>
  `${orderMeta.id || orderMeta.transactionNumber || ''}_${plant.plantCode || ''}`;

const buildFullOrderLike = (orderMeta, plant, plantDetails) => ({
  ...orderMeta,
  plantCode: plant.plantCode || orderMeta.plantCode,
  products: [plant],
  plantDetails,
});

/** Ready to Fly tab card shape */
export const transformReadyToFlyPlant = (plant) => {
  const plantDetails = plant.plantDetails || {};
  const orderMeta = plant.order || {};
  const fullOrderLike = buildFullOrderLike(orderMeta, plant, plantDetails);

  return {
    id: buildCardId(orderMeta, plant),
    activeTab: 'Ready to Fly',
    leafTrailHistory: orderMeta.leafTrailHistory || {},
    status: orderMeta.status || 'Ready to Fly',
    airCargoDate:
      plant.flightDateFormatted || orderMeta.flightDateFormatted || plant.flightDate || 'TBD',
    countryCode: getCountryCode(plant),
    flag: getCountryFlag(plant),
    planeIcon: PlaneGrayIcon,
    image: getPlantImage(plantDetails, plant),
    plantName:
      plantDetails.title ||
      plant.plantName ||
      `${plant.genus || ''} ${plant.species || ''}`.trim() ||
      'Unknown Plant',
    variety: plant.variegation || plantDetails.variegation || 'Standard',
    size: plant.potSize || plantDetails.potSize || '',
    price: `$${((orderMeta.pricing?.finalTotal ?? plant.productTotal ?? plant.unitPrice) || 0).toFixed(2)}`,
    quantity: plant.quantity || 1,
    plantCode: plant.plantCode || '',
    orderId: orderMeta.id,
    transactionNumber: orderMeta.transactionNumber || orderMeta.id || '',
    products: [plant],
    fullOrderData: fullOrderLike,
    isJoinerOrder: plant.isJoinerOrder || false,
    joinerInfo: plant.joinerInfo || null,
    buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
    _rawPlantRecord: plant,
  };
};

/** Plants Are Home tab card shape (delivered) */
export const transformPlantsAreHomePlant = (plant) => {
  const plantDetails = plant.plantDetails || {};
  const orderMeta = plant.order || {};
  const fullOrderLike = buildFullOrderLike(orderMeta, plant, plantDetails);

  return {
    id: buildCardId(orderMeta, plant),
    activeTab: 'Plants are Home',
    shippingData: orderMeta.shippingData || {},
    shippedData: orderMeta.shippedData || {},
    status: 'Plants are Home',
    airCargoDate:
      plant.flightDateFormatted ||
      orderMeta.flightDateFormatted ||
      orderMeta.cargoDateFormatted ||
      'TBD',
    countryCode: getCountryCode(plant),
    flag: getCountryFlag(plant),
    planeIcon: PlaneGrayIcon,
    image: getPlantImage(plantDetails, plant),
    plantName:
      plantDetails.title ||
      plant.plantName ||
      `${plant.genus || ''} ${plant.species || ''}`.trim() ||
      'Unknown Plant',
    variety: plant.variegation || plantDetails.variegation || 'Standard',
    size: plant.potSize || plantDetails.potSize || '',
    price: `$${(orderMeta.pricing?.finalTotal || plant.unitPrice || plant.productTotal || 0).toFixed(2)}`,
    quantity: plant.quantity || 1,
    plantCode: plant.plantCode || '',
    showRequestCredit: true,
    requestDeadline: getRequestDeadline(orderMeta),
    creditRequestStatus: plant.creditRequestStatus || orderMeta.creditRequestStatus,
    orderId: orderMeta.id,
    transactionNumber: orderMeta.transactionNumber || orderMeta.id || '',
    products: [plant],
    fullOrderData: fullOrderLike,
    isJoinerOrder: plant.isJoinerOrder || orderMeta.isJoinerOrder || false,
    joinerInfo: plant.joinerInfo || orderMeta.joinerInfo || null,
    buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
    _rawPlantRecord: plant,
  };
};

/** Pay to Board tab card shape (grouped pending payment) */
export const transformPayToBoardPlant = (plant, group) => {
  const plantDetails = plant.plantDetails || {};
  const orderMeta = group || plant.order || {};
  const fullOrderLike = buildFullOrderLike(orderMeta, plant, plantDetails);

  return {
    id: buildCardId(orderMeta, plant),
    activeTab: 'Pay to Board',
    status: mapPayToBoardStatus(orderMeta.status || 'pending_payment'),
    airCargoDate:
      plant.flightDateFormatted || orderMeta.flightDateFormatted || plant.flightDate || 'TBD',
    countryCode: getCountryCode(plant),
    flag: getCountryFlag(plant),
    planeIcon: PlaneGrayIcon,
    image: getPlantImage(plantDetails, plant),
    plantName: plantDetails.title || plant.plantName || 'Unknown Plant',
    variety: plant.variegation || plantDetails.variegation || 'Standard',
    size: plant.potSize || plantDetails.potSize || '',
    price: `$${((orderMeta.pricing?.finalTotal ?? plant.productTotal ?? plant.unitPrice) || 0).toFixed(2)}`,
    quantity: plant.quantity || 1,
    plantCode: plant.plantCode || '',
    orderId: orderMeta.id,
    transactionNumber: orderMeta.transactionNumber || orderMeta.id || '',
    products: [plant],
    fullOrderData: fullOrderLike,
    isJoinerOrder: plant.isJoinerOrder || orderMeta.isJoinerOrder || false,
    joinerInfo: plant.joinerInfo || orderMeta.joinerInfo || null,
    buyerUid: plant.buyerUid || orderMeta.buyerUid || null,
    _rawPlantRecord: plant,
  };
};
