// API Configuration for local and production environments

// Set this to true for local development, false for production
const USE_LOCAL_API = false;

// Local development endpoints (Firebase Functions Emulator)
const LOCAL_BASE_URL = 'http://10.0.2.2:5001/i-leaf-u/us-central1';

// Production endpoints
const PROD_BASE_URL = 'https://us-central1-i-leaf-u.cloudfunctions.net';

// Get the base URL based on environment
const getBaseUrl = () => {
  return USE_LOCAL_API ? LOCAL_BASE_URL : PROD_BASE_URL;
};

// API Endpoints
export const API_ENDPOINTS = {
  // Cart APIs
  ADD_TO_CART: `${getBaseUrl()}/addToCart`,
  GET_CART_ITEMS: `${getBaseUrl()}/getCartItems`,
  UPDATE_CART_ITEM: `${getBaseUrl()}/updateCartItem`,
  REMOVE_FROM_CART: `${getBaseUrl()}/removeFromCart`,
  
  // Shop APIs
  GET_SORT: `${getBaseUrl()}/getSort`,
  GET_GENUS: `${getBaseUrl()}/getGenus`,
  GET_VARIEGATION: `${getBaseUrl()}/getVariegation`,
  GET_COUNTRY: `${getBaseUrl()}/getCountryDropdown`,
  GET_LISTING_TYPE: `${getBaseUrl()}/getListingTypeDropdown`,
  GET_SHIPPING_INDEX: `${getBaseUrl()}/getShippingIndexDropdown`,
  GET_ACCLIMATION_INDEX: `${getBaseUrl()}/getAcclimationIndexDropdown`,
  BROWSE_PLANT_BY_GENUS: `${getBaseUrl()}/browsePlantByGenus`,
  BROWSE_PLANTS_BY_GENUS: `${getBaseUrl()}/browsePlantsByGenus`,
  GET_BUYER_EVENTS: `${getBaseUrl()}/getBuyerEvents`,
  SEARCH_LISTING: `${getBaseUrl()}/searchListing`,
  SEARCH_PLANTS: `${getBaseUrl()}/searchPlants`,
  GET_BUYER_LISTINGS: `${getBaseUrl()}/getBuyerListings`,
  GET_PLANT_RECOMMENDATIONS: `${getBaseUrl()}/getPlantRecommendations`,
  SEARCH_DRAFT_LISTINGS: `${getBaseUrl()}/searchDraftListings`,
  
  // Checkout & Payment APIs
  CHECKOUT: `${getBaseUrl()}/checkout`,
  CREATE_PAYMENT_INTENT: `${getBaseUrl()}/createPaymentIntent`,
  CAPTURE_PAYMENT: `${getBaseUrl()}/capturePayment`,
  
  // Order APIs
  GET_BUYER_ORDERS: `${getBaseUrl()}/getBuyerOrders`,
  GET_ORDER_DETAIL: `${getBaseUrl()}/getOrderDetail`,
  
  // Credit Request APIs
  REQUEST_CREDIT: `${getBaseUrl()}/requestCredit`,
  GET_BUYER_CREDIT_REQUESTS: `${getBaseUrl()}/getBuyerCreditRequests`,
  GET_CREDIT_REQUEST_DETAIL: `${getBaseUrl()}/getCreditRequestDetail`,
  
  // Dropdown APIs
  GET_PLANTS_DROPDOWN: `${getBaseUrl()}/getPlantsDropdown`,
  GET_ALL_PLANT_GENUS: `${getBaseUrl()}/getAllPlantGenus`,
  GET_PLANT_CARE_TAGS: `${getBaseUrl()}/getPlantCareTags`,
  GET_PLANT_TYPES: `${getBaseUrl()}/getPlantTypes`,
  GET_PLANT_GROWTH_FORMS: `${getBaseUrl()}/getPlantGrowthForms`,
  GET_REGIONS_DROPDOWN: `${getBaseUrl()}/getRegionsDropdown`,
  GET_DELIVERY_OPTIONS: `${getBaseUrl()}/getDeliveryOptions`,
};

// Export configuration
export const API_CONFIG = {
  USE_LOCAL_API,
  LOCAL_BASE_URL,
  PROD_BASE_URL,
  BASE_URL: getBaseUrl(),
};

// Helper function to toggle between local and production
export const setApiMode = (useLocal) => {
  // Note: In a real app, you might want to use environment variables
  // or a more sophisticated configuration management system
  console.log(`API Mode switched to: ${useLocal ? 'LOCAL' : 'PRODUCTION'}`);
  console.log(`Base URL: ${useLocal ? LOCAL_BASE_URL : PROD_BASE_URL}`);
};

// Log current configuration
console.log('🔧 API Configuration:');
console.log(`📍 Mode: ${USE_LOCAL_API ? 'LOCAL DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🌐 Base URL: ${getBaseUrl()}`);
