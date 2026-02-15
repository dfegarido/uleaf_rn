/**
 * ============================================================================
 * BUYER ORDER FILTERING SCRIPT (FRONTEND VERSION)
 * ============================================================================
 * 
 * This is the frontend version of the buyer order filtering script.
 * It provides the same filtering logic as the backend version but is
 * optimized for React Native/JavaScript environments.
 * 
 * For complete documentation, see the backend version:
 * iLeafU-functions/functions/firestore/buyer/buyerOrderFiltering.js
 * 
 * USAGE:
 * 
 * import { filterBuyerOrders, TAB } from '../utils/buyerOrderFiltering';
 * 
 * const filteredOrders = filterBuyerOrders(orders, TAB.READY_TO_FLY, plantOwnerFilter);
 * 
 * ============================================================================
 */

// Note: For React Native, we use date-fns or moment instead of luxon
// If you prefer luxon, install it: npm install luxon
// For now, using native Date with timezone handling

/**
 * Status value constants (normalized to lowercase for comparison)
 */
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  READY_TO_FLY: 'ready to fly',
  READY_TO_FLY_ALT1: 'readytofly',
  READY_TO_FLY_ALT2: 'ready_to_fly',
  DELIVERED: 'delivered',
  MISSING: 'missing',
  DAMAGED: 'damaged',
};

export const LEAF_TRAIL_STATUS = {
  MISSING: 'missing',
  DAMAGED: 'damaged',
  SHIPPING: 'shipping',
  NEEDS_TO_STAY: 'needstostay',
};

/**
 * Tab identifiers
 */
export const TAB = {
  PAY_TO_BOARD: 'pay_to_board',
  READY_TO_FLY: 'ready_to_fly',
  PLANTS_ARE_HOME: 'plants_are_home',
  JOURNEY_MISHAP: 'journey_mishap',
};

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Normalizes a string value to lowercase and trims whitespace.
 */
export const normalizeString = (value) => {
  if (value == null) return '';
  if (typeof value !== 'string') return String(value).toLowerCase().trim();
  return value.toLowerCase().trim();
};

/**
 * Gets the order status from an order object.
 */
export const getOrderStatus = (order) => {
  if (!order) return '';
  return normalizeString(order.status || order.orderStatus || '');
};

/**
 * Gets the leaf trail status from an order object.
 */
export const getLeafTrailStatus = (order) => {
  if (!order) return '';
  return normalizeString(order.leafTrailStatus || '');
};

/**
 * Gets the buyer UID from an order object.
 */
export const getBuyerUid = (order) => {
  if (!order) return null;
  return (
    order.buyerUid ||
    order.buyerId ||
    order.buyerInfo?.uid ||
    order.buyerInfo?.id ||
    null
  );
};

/**
 * Checks if an order has a tracking number.
 */
export const hasTrackingNumber = (order) => {
  if (!order) return false;
  return !!(
    order.shippingData?.trackingNumber ||
    order.tracking?.number ||
    order.trackingNumber
  );
};

/**
 * Checks if an order has delivery date and time.
 */
export const hasDeliveryDateTime = (order) => {
  if (!order) return false;
  const hasDate = !!(
    order.shippedData?.deliveryDate ||
    order.delivery?.date ||
    order.deliveryDate
  );
  const hasTime = !!(
    order.shippedData?.deliveryTime ||
    order.delivery?.time ||
    order.deliveryTime
  );
  return hasDate && hasTime;
};

/**
 * Checks if an order has credit requests.
 */
export const hasCreditRequests = (order) => {
  if (!order) return false;
  const requests = order.creditRequests || [];
  return Array.isArray(requests) && requests.length > 0;
};

/**
 * Gets the current Eastern Time.
 * Note: JavaScript Date doesn't have native timezone support,
 * so we use UTC offset for Eastern Time.
 * EST = UTC-5, EDT = UTC-4 (handles DST automatically)
 */
export const getEasternDateTime = () => {
  return new Date();
};

/**
 * Converts a date to Eastern Time string for comparison.
 */
export const toEasternTimeString = (date) => {
  if (!date) return '';
  return date.toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Parses a flight date from various formats.
 */
export const parseFlightDate = (flightDate) => {
  if (!flightDate) return null;
  
  if (flightDate instanceof Date) {
    return flightDate;
  }
  
  // Firestore Timestamp format
  if (flightDate._seconds) {
    return new Date(flightDate._seconds * 1000);
  }
  
  if (typeof flightDate === 'string') {
    const parsed = new Date(flightDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
};

/**
 * Checks if an order is past its Ready to Fly cutoff.
 * Cutoff = flight date - 6 days at 1:00 AM ET
 */
export const isPastReadyToFlyCutoff = (order) => {
  if (!order) return false;
  
  const flightDate = parseFlightDate(order.flightDate || order.cargoDate);
  if (!flightDate) {
    return false;
  }
  
  // Create a date string in Eastern Time for accurate comparison
  const flightDateET = new Date(flightDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  // Set to midnight ET
  flightDateET.setHours(0, 0, 0, 0);
  
  // Calculate cutoff: flight date - 6 days at 1:00 AM ET
  const cutoffET = new Date(flightDateET);
  cutoffET.setDate(cutoffET.getDate() - 6);
  cutoffET.setHours(1, 0, 0, 0);
  
  // Get current time in ET
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  return nowET >= cutoffET;
};

/**
 * ============================================================================
 * TAB FILTERING FUNCTIONS
 * ============================================================================
 */

/**
 * Determines if an order should appear in the "Pay to Board" tab.
 */
export const isPayToBoard = (order) => {
  if (!order) return false;
  const status = getOrderStatus(order);
  return status === ORDER_STATUS.PENDING_PAYMENT;
};

/**
 * Determines if an order should appear in the "Ready to Fly" tab.
 */
export const isReadyToFly = (order) => {
  if (!order) return false;
  
  const status = getOrderStatus(order);
  const leafTrailStatus = getLeafTrailStatus(order);
  
  const isReadyToFlyStatus = (
    status === ORDER_STATUS.READY_TO_FLY ||
    status === ORDER_STATUS.READY_TO_FLY_ALT1 ||
    status === ORDER_STATUS.READY_TO_FLY_ALT2
  );
  
  if (!isReadyToFlyStatus) return false;
  
  if (leafTrailStatus === LEAF_TRAIL_STATUS.MISSING || 
      leafTrailStatus === LEAF_TRAIL_STATUS.DAMAGED) {
    return false;
  }
  
  if (isPastReadyToFlyCutoff(order)) {
    return false;
  }
  
  return true;
};

/**
 * Determines if an order should appear in the "Plants are Home" tab.
 */
export const isPlantsAreHome = (order) => {
  if (!order) return false;
  const hasTracking = hasTrackingNumber(order);
  const hasDelivery = hasDeliveryDateTime(order);
  return hasTracking && hasDelivery;
};

/**
 * Determines if an order should appear in the "Journey Mishap" tab.
 */
export const isJourneyMishap = (order) => {
  if (!order) return false;
  
  const leafTrailStatus = getLeafTrailStatus(order);
  
  if (leafTrailStatus === LEAF_TRAIL_STATUS.MISSING || 
      leafTrailStatus === LEAF_TRAIL_STATUS.DAMAGED) {
    return true;
  }
  
  if (hasCreditRequests(order)) {
    return true;
  }
  
  return false;
};

/**
 * ============================================================================
 * PLANT OWNER FILTERING FUNCTIONS
 * ============================================================================
 */

/**
 * Filters orders by buyer/plant owner.
 */
export const filterByPlantOwner = (orders, plantOwnerFilter) => {
  if (!plantOwnerFilter || plantOwnerFilter === null) {
    return orders;
  }
  
  return orders.filter(order => {
    const buyerUid = getBuyerUid(order);
    return buyerUid === plantOwnerFilter;
  });
};

/**
 * ============================================================================
 * GROUPED ORDER FILTERING
 * ============================================================================
 */

/**
 * Filters grouped orders (by transaction number) for Pay to Board tab.
 */
export const filterPayToBoardGroups = (groups, plantOwnerFilter = null) => {
  if (!groups || !Array.isArray(groups)) return [];
  
  return groups.filter(group => {
    if (plantOwnerFilter) {
      const hasMatchingPlant = (group.plants || []).some(plant => {
        const plantBuyerUid = plant.buyerUid || group.buyerUid;
        return plantBuyerUid === plantOwnerFilter;
      });
      
      if (!hasMatchingPlant) return false;
    }
    
    const status = getOrderStatus(group);
    return status === ORDER_STATUS.PENDING_PAYMENT;
  });
};

/**
 * Filters plants within a group based on plant owner filter.
 */
export const filterGroupPlants = (group, plantOwnerFilter = null) => {
  if (!group) return group;
  if (!plantOwnerFilter) return group;
  
  const filteredPlants = (group.plants || []).filter(plant => {
    const plantBuyerUid = plant.buyerUid || group.buyerUid;
    return plantBuyerUid === plantOwnerFilter;
  });
  
  return {
    ...group,
    plants: filteredPlants
  };
};

/**
 * ============================================================================
 * MAIN FILTERING FUNCTION
 * ============================================================================
 */

/**
 * Filters orders based on tab and optional plant owner filter.
 * This is the main filtering function that should be used throughout the app.
 * 
 * @param {Array<Object>} orders - Array of order objects to filter
 * @param {string} tab - Tab identifier (use TAB constants)
 * @param {string|null} plantOwnerFilter - Optional buyer UID filter
 * @returns {Array<Object>} Filtered array of orders
 */
export const filterBuyerOrders = (orders, tab, plantOwnerFilter = null) => {
  if (!orders || !Array.isArray(orders)) return [];
  
  let filteredOrders = [];
  
  switch (tab) {
    case TAB.PAY_TO_BOARD:
      filteredOrders = orders.filter(isPayToBoard);
      break;
      
    case TAB.READY_TO_FLY:
      filteredOrders = orders.filter(isReadyToFly);
      break;
      
    case TAB.PLANTS_ARE_HOME:
      filteredOrders = orders.filter(isPlantsAreHome);
      break;
      
    case TAB.JOURNEY_MISHAP:
      filteredOrders = orders.filter(isJourneyMishap);
      break;
      
    default:
      console.warn(`Unknown tab: ${tab}, returning unfiltered orders`);
      filteredOrders = orders;
  }
  
  if (plantOwnerFilter) {
    filteredOrders = filterByPlantOwner(filteredOrders, plantOwnerFilter);
  }
  
  return filteredOrders;
};

/**
 * ============================================================================
 * DEFAULT EXPORT
 * ============================================================================
 */

export default {
  ORDER_STATUS,
  LEAF_TRAIL_STATUS,
  TAB,
  normalizeString,
  getOrderStatus,
  getLeafTrailStatus,
  getBuyerUid,
  hasTrackingNumber,
  hasDeliveryDateTime,
  hasCreditRequests,
  getEasternDateTime,
  parseFlightDate,
  isPastReadyToFlyCutoff,
  isPayToBoard,
  isReadyToFly,
  isPlantsAreHome,
  isJourneyMishap,
  filterByPlantOwner,
  filterPayToBoardGroups,
  filterGroupPlants,
  filterBuyerOrders,
};

