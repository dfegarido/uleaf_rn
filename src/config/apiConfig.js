// API Configuration for local and production environments

// Set this to true for local development, false for production
const USE_LOCAL_API = true;

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
  BROWSE_PLANT_BY_GENUS: `${getBaseUrl()}/browsePlantByGenus`,
  GET_BUYER_EVENTS: `${getBaseUrl()}/getBuyerEvents`,
  SEARCH_LISTING: `${getBaseUrl()}/searchListing`,
  GET_BUYER_LISTINGS: `${getBaseUrl()}/getBuyerListings`,
  GET_PLANT_RECOMMENDATIONS: `${getBaseUrl()}/getPlantRecommendations`,
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
