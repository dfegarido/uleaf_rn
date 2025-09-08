// API Configuration for local and production environments

// Set this to true for local development, false for production
const USE_LOCAL_API = false;

// Local development endpoints (Firebase Functions Emulator)
const LOCAL_BASE_URL = 'http://10.0.2.2:5001/i-leaf-u/us-central1';

// Production endpoints
const PROD_BASE_URL = 'https://us-central1-i-leaf-u.cloudfunctions.net';

// Get the base URL based on current environment setting
const getBaseUrl = () => {
  return USE_LOCAL_API ? LOCAL_BASE_URL : PROD_BASE_URL;
};

// Helper function to dynamically switch API environment
export const setApiEnvironment = (useLocal) => {
  USE_LOCAL_API = useLocal;
  console.log(`🔄 API Environment switched to: ${useLocal ? 'LOCAL DEVELOPMENT' : 'PRODUCTION'}`);
  console.log(`🌐 New Base URL: ${getBaseUrl()}`);
  
  // Regenerate endpoints with new base URL
  updateEndpoints();
};

// Function to generate endpoints with current base URL
const generateEndpoints = () => ({
  // Authentication APIs
  FIREBASE_LOGIN: `${getBaseUrl()}/firebaseLogin`,
  SIGN_IN_SUPPLIER: `${getBaseUrl()}/signInSupplier`,
  VALIDATE_SIGN_IN_PIN: `${getBaseUrl()}/validateSignInPin`,
  EXCHANGE_CUSTOM_TOKEN: `${getBaseUrl()}/exchangeCustomToken`,
  
  // Admin Management APIs
  CREATE_ADMIN: `${getBaseUrl()}/createAdmin`,
  ADMIN_LOGIN: `${getBaseUrl()}/adminLogin`,
  GET_ADMIN_INFO: `${getBaseUrl()}/getAdminInfo`,
  LIST_ADMINS: `${getBaseUrl()}/listAdmins`,
  UPDATE_ADMIN: `${getBaseUrl()}/updateAdmin`,
  UPDATE_ADMIN_PASSWORD: `${getBaseUrl()}/updateAdminPassword`,
  GET_ALL_USERS: `${getBaseUrl()}/getAllUsers`,
  UPDATE_USER_STATUS: `${getBaseUrl()}/updateUserStatus`,
  
  // QR Code APIs
  QR_GENERATOR: `${getBaseUrl()}/qrGenerator`,
  QR_GENERATOR_ORDERS: `${getBaseUrl()}/qrGenerator/orders`,
  
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
  GET_BUYER_LISTING: `${getBaseUrl()}/getBuyerListing`, // Single plant detail
  GET_PLANT_RECOMMENDATIONS: `${getBaseUrl()}/getPlantRecommendations`,
  SEARCH_DRAFT_LISTINGS: `${getBaseUrl()}/searchDraftListings`,
  
  // Checkout & Payment APIs
  CHECKOUT: `${getBaseUrl()}/checkout`,
  CREATE_PAYMENT_INTENT: `${getBaseUrl()}/createPaymentIntent`,
  CAPTURE_PAYMENT: `${getBaseUrl()}/capturePayment`,
  
  // Order APIs
  GET_ORDERS: `${getBaseUrl()}/getOrders`,
  GET_BUYER_ORDERS: `${getBaseUrl()}/getBuyerOrders`,
  GET_ORDER_DETAIL: `${getBaseUrl()}/getOrderDetail`,
  
  // Credit Request APIs
  REQUEST_CREDIT: `${getBaseUrl()}/requestCredit`,
  GET_BUYER_CREDIT_REQUESTS: `${getBaseUrl()}/getBuyerCreditRequests`,
  GET_CREDIT_REQUEST_DETAIL: `${getBaseUrl()}/getCreditRequestDetail`,
  GET_JOURNEY_MISHAP_ORDERS: `${getBaseUrl()}/getJourneyMishapOrders`,
  GET_PLANTS_WITH_CREDIT_REQUESTS: `${getBaseUrl()}/getPlantsWithCreditRequests`,
  GET_JOURNEY_MISHAP_DATA: `${getBaseUrl()}/getJourneyMishapData`,
  
  // Dropdown APIs
  GET_PLANTS_DROPDOWN: `${getBaseUrl()}/getPlantsDropdown`,
  GET_ALL_PLANT_GENUS: `${getBaseUrl()}/getAllPlantGenus`,
  GET_PLANT_CARE_TAGS: `${getBaseUrl()}/getPlantCareTags`,
  GET_PLANT_TYPES: `${getBaseUrl()}/getPlantTypes`,
  GET_PLANT_GROWTH_FORMS: `${getBaseUrl()}/getPlantGrowthForms`,
  GET_REGIONS_DROPDOWN: `${getBaseUrl()}/getRegionsDropdown`,
  GET_DELIVERY_OPTIONS: `${getBaseUrl()}/getDeliveryOptions`,
  
  // Location Dropdown APIs
  GET_DROPDOWN_STATES: `${getBaseUrl()}/getDropdownStates`,
  GET_DROPDOWN_CITIES: `${getBaseUrl()}/getDropdownCities`,
  POPULATE_DROPDOWN_STATES: `${getBaseUrl()}/populateDropdownStates`,
  POPULATE_DROPDOWN_CITIES: `${getBaseUrl()}/populateDropdownCities`,
  TRIGGER_LOCATION_DATA_UPDATE: `${getBaseUrl()}/triggerLocationDataUpdate`,
  // Public (unauthenticated) location endpoints
  PUBLIC_STATES: `${getBaseUrl()}/getStatesData`,
  PUBLIC_CITIES: `${getBaseUrl()}/getCitiesData`,
  
  // User related endpoints
  SEARCH_USER: `${getBaseUrl()}/searchUser`,
});

// API Endpoints - Initially generated with default environment
export let API_ENDPOINTS = generateEndpoints();

// Function to update endpoints when environment changes
const updateEndpoints = () => {
  API_ENDPOINTS = generateEndpoints();
};

// Export configuration
export const API_CONFIG = {
  get USE_LOCAL_API() { return USE_LOCAL_API; },
  LOCAL_BASE_URL,
  PROD_BASE_URL,
  get BASE_URL() { return getBaseUrl(); },
};

// Helper function to check current API environment
export const getCurrentApiEnvironment = () => {
  return {
    isLocal: USE_LOCAL_API,
    baseUrl: getBaseUrl(),
    environment: USE_LOCAL_API ? 'LOCAL DEVELOPMENT' : 'PRODUCTION'
  };
};

// Helper function to toggle between local and production (deprecated - use setApiEnvironment)
export const setApiMode = (useLocal) => {
  console.warn('⚠️  setApiMode is deprecated. Use setApiEnvironment instead.');
  setApiEnvironment(useLocal);
};

// Log current configuration
console.log('🔧 API Configuration:');
console.log(`📍 Mode: ${USE_LOCAL_API ? 'LOCAL DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🌐 Base URL: ${getBaseUrl()}`);
