// API Configuration for local and production environments
import { LOCAL_BASE_URL as ENV_LOCAL_BASE_URL } from '@env';
import { LOCAL_SUPABASE_URL as ENV_LOCAL_SUPABASE_URL } from '@env';

// Automatically detect environment based on __DEV__ flag and NODE_ENV
// This prevents accidentally using local API in production builds
// __DEV__ is automatically false in production builds (release mode)
// NODE_ENV can be set via environment variable for additional control
const isDevelopment = __DEV__ === true || process.env.NODE_ENV === 'development';
const isProduction = __DEV__ === false || process.env.NODE_ENV === 'production';

// Use local API only in development mode
// In production builds, __DEV__ is always false, so this will always be false
// Note: This is a const, but can be overridden via setApiEnvironment for runtime switching (dev only)
// FORCE local API in development mode (__DEV__ === true)
let USE_LOCAL_API = __DEV__ === true;

// Safety check: If somehow USE_LOCAL_API is true in a production build, force it to false
// This prevents the issue where local API is accidentally used in production
if (!__DEV__ && USE_LOCAL_API) {
  console.error('⚠️ CRITICAL: USE_LOCAL_API was true in production build! Forcing to false.');
  USE_LOCAL_API = false; // Force to false in production builds
}

// Local development endpoints (Firebase Functions Emulator)
// Loaded from .env file - each team member can configure their own IP address
// Default fallback if .env is not configured
const LOCAL_BASE_URL = ENV_LOCAL_BASE_URL || 'http://localhost:5001/i-leaf-u/us-central1';

// If LOCAL_BASE_URL is not set, log a warning
if (__DEV__ && !ENV_LOCAL_BASE_URL) {
  console.warn('⚠️ LOCAL_BASE_URL not found in .env, using default: http://localhost:5001/i-leaf-u/us-central1');
}

// Supabase Edge Functions base URL
const LOCAL_SUPABASE_BASE_URL = ENV_LOCAL_SUPABASE_URL || 'http://localhost:8000/functions/v1';
const PROD_SUPABASE_BASE_URL = 'https://pjcquavlxknhmuszjmyh.supabase.co/functions/v1';
const getSupabaseBaseUrl = () => (USE_LOCAL_API ? LOCAL_SUPABASE_BASE_URL : PROD_SUPABASE_BASE_URL);

// Production endpoints
const PROD_BASE_URL = 'https://us-central1-i-leaf-u.cloudfunctions.net';

// GeoDB API Configuration (RapidAPI)
export const GEODATABASE_CONFIG = {
  BASE_URL: 'https://wft-geo-db.p.rapidapi.com/v1/geo',
  RAPIDAPI_KEY: '338134f81cmsh08060506ff78566p1938abjsna0f4b19f0323',
  RAPIDAPI_HOST: 'wft-geo-db.p.rapidapi.com',
  
  // Create headers for GeoDB API requests (Multiple formats for compatibility)
  createHeaders: () => {
    const headers = new Headers();
    headers.append("x-rapidapi-key", GEODATABASE_CONFIG.RAPIDAPI_KEY);
    headers.append("x-rapidapi-host", GEODATABASE_CONFIG.RAPIDAPI_HOST);
    return headers;
  },
  
  // Create headers as plain object (sometimes more compatible)
  createHeadersObject: () => ({
    "X-RapidAPI-Key": GEODATABASE_CONFIG.RAPIDAPI_KEY,
    "X-RapidAPI-Host": GEODATABASE_CONFIG.RAPIDAPI_HOST,
    "Content-Type": "application/json"
  }),
  
  // Create headers exactly like your working code
  createHeadersExact: () => {
    const myHeaders = new Headers();
    myHeaders.append("x-rapidapi-key", GEODATABASE_CONFIG.RAPIDAPI_KEY);
    myHeaders.append("x-rapidapi-host", GEODATABASE_CONFIG.RAPIDAPI_HOST);
    return myHeaders;
  },
  
  // Create request options for GeoDB API
  createRequestOptions: (method = "GET") => ({
    method: method,
    headers: GEODATABASE_CONFIG.createHeadersExact(),
    redirect: "follow"
  }),
  
  // Create request options with object headers
  createRequestOptionsObject: (method = "GET") => ({
    method: method,
    headers: GEODATABASE_CONFIG.createHeadersObject()
  }),
  
  // GeoDB API Endpoints
  ENDPOINTS: {
    COUNTRIES: () => `${GEODATABASE_CONFIG.BASE_URL}/countries`,
    US_REGIONS: (limit = 55, offset = 0) => `${GEODATABASE_CONFIG.BASE_URL}/countries/US/regions?limit=${limit}&offset=${offset}`,
    COUNTRY_REGIONS: (countryCode, limit = 50, offset = 0) => `${GEODATABASE_CONFIG.BASE_URL}/countries/${countryCode}/regions?limit=${limit}&offset=${offset}`,
    REGION_CITIES: (countryCode, regionCode, limit = 100, offset = 0, namePrefix = '') => {
      let url = `${GEODATABASE_CONFIG.BASE_URL}/countries/${countryCode}/regions/${regionCode}/cities?limit=${limit}&offset=${offset}`;
      if (namePrefix) {
        url += `&namePrefix=${encodeURIComponent(namePrefix)}`;
      }
      return url;
    },
    COUNTRY_CITIES: (countryCode, limit = 100, offset = 0) => `${GEODATABASE_CONFIG.BASE_URL}/countries/${countryCode}/cities?limit=${limit}&offset=${offset}`,
    
    // New general cities endpoint
    ALL_CITIES: (limit = 5, offset = 0, namePrefix = '', countryIds = 'US') => {
      let url = `${GEODATABASE_CONFIG.BASE_URL}/cities?limit=${limit}&offset=${offset}`;
      if (countryIds) url += `&countryIds=${countryIds}`;
      if (namePrefix) url += `&namePrefix=${namePrefix}`;
      return url;
    },
    
    // Search cities with state filter
    SEARCH_CITIES: (limit = 5, offset = 0, namePrefix = '', stateCode = '', countryIds = 'US') => {
      let url = `${GEODATABASE_CONFIG.BASE_URL}/cities?limit=${limit}&offset=${offset}`;
      if (countryIds) url += `&countryIds=${countryIds}`;
      if (namePrefix) url += `&namePrefix=${namePrefix}`;
      if (stateCode) url += `&regionCode=${stateCode}`;
      return url;
    },
    
    // Alias for backward compatibility
    STATE_CITIES: (countryCode, stateCode, limit = 5, offset = 0) => 
      `${GEODATABASE_CONFIG.BASE_URL}/cities?limit=${limit}&offset=${offset}&countryIds=${countryCode}&regionCode=${stateCode}`,
    
    SEARCH_PLACES: (namePrefix, limit = 10, offset = 0, types = ['CITY']) => {
      const typeQuery = types.length > 0 ? `&types=${types.join(',')}` : '';
      return `${GEODATABASE_CONFIG.BASE_URL}/places?namePrefix=${encodeURIComponent(namePrefix)}&limit=${limit}&offset=${offset}${typeQuery}`;
    }
  }
};

// Get the base URL based on current environment setting
const getBaseUrl = () => {
  const baseUrl = USE_LOCAL_API ? LOCAL_BASE_URL : PROD_BASE_URL;
  
  // Log the actual URL being used (only in development, and only once per session)
  if (__DEV__ && !getBaseUrl._logged) {
    console.log('[apiConfig] API Base URL:', {
      USE_LOCAL_API,
      LOCAL_BASE_URL: LOCAL_BASE_URL || 'NOT SET',
      selectedBaseUrl: baseUrl,
      environment: USE_LOCAL_API ? 'LOCAL EMULATOR' : 'PRODUCTION CLOUD',
    });
    getBaseUrl._logged = true;
  }
  
  return baseUrl;
};

// Helper function to dynamically switch API environment
// WARNING: This only works in development mode. In production, it will be ignored.
export const setApiEnvironment = (useLocal) => {
  // Prevent switching to local API in production builds
  if (!__DEV__ && useLocal) {
    console.error('⚠️ Cannot switch to LOCAL API in production build! Ignoring request.');
    return;
  }
  
  USE_LOCAL_API = useLocal;
  // Environment switch - minimal logging
  console.info(`API environment switched to: ${useLocal ? 'LOCAL' : 'PROD'}`);
  updateEndpoints();
};

// Function to generate endpoints with current base URL
const generateEndpoints = () => ({
  // Authentication APIs
  FIREBASE_LOGIN: `${getBaseUrl()}/firebaseLogin`,
  BUYER_SIGNUP: `${getBaseUrl()}/buyerSignup`,
  SIGN_IN_SUPPLIER: `${getBaseUrl()}/signInSupplier`,
  VALIDATE_SIGN_IN_PIN: `${getBaseUrl()}/validateSignInPin`,
  EXCHANGE_CUSTOM_TOKEN: `${getBaseUrl()}/exchangeCustomToken`,
  FORCE_LOGOUT: `${getBaseUrl()}/forceLogout`,
  
  // Admin Management APIs
  CREATE_ADMIN: `${getBaseUrl()}/createAdmin`,
  ADMIN_LOGIN: `${getSupabaseBaseUrl()}/admin-login`,
  GET_ADMIN_INFO: `${getSupabaseBaseUrl()}/admin-info`,
  GET_BUYER_INFO: `${getBaseUrl()}/getBuyerInfo`,
GET_SUPPLIER_INFO: `${getSupabaseBaseUrl()}/supplier-info`,
  LIST_ADMINS: `${getSupabaseBaseUrl()}/admin-list`,
  UPDATE_ADMIN: `${getSupabaseBaseUrl()}/admin-update`,
  UPDATE_ADMIN_PASSWORD: `${getBaseUrl()}/updateAdminPassword`,
  DELETE_ADMIN: `${getSupabaseBaseUrl()}/admin-delete`,
  GET_ALL_USERS: `${getSupabaseBaseUrl()}/admin-users`,
  UPDATE_USER_STATUS: `${getSupabaseBaseUrl()}/admin-user-status`,
  GET_ADMIN_LISTINGS: `${getSupabaseBaseUrl()}/admin-listings`,
  GET_ADMIN_LISTING_DETAIL: `${getSupabaseBaseUrl()}/admin-listing-detail`,
  GET_GENUS_LIST: `${getSupabaseBaseUrl()}/genus-list`, // Admin taxonomy management (genus collection with metadata)
  GET_GENUS_DROPDOWN: `${getSupabaseBaseUrl()}/dropdown-genus`, // Seller dropdown (genus collection, simple list)
  GET_SPECIES_FROM_PLANT_CATALOG: `${getSupabaseBaseUrl()}/get-species-from-plant-catalog`,
  // Taxonomy Management APIs
  ADD_PLANT_TAXONOMY: `${getSupabaseBaseUrl()}/add-plant-taxonomy`,
  UPDATE_PLANT_TAXONOMY: `${getSupabaseBaseUrl()}/update-plant-taxonomy`,
  DELETE_PLANT_TAXONOMY: `${getSupabaseBaseUrl()}/delete-plant-taxonomy`,
  GET_SPECIES_FOR_GENUS: `${getSupabaseBaseUrl()}/species-for-genus`,
  IMPORT_TAXONOMY_DATA: `${getBaseUrl()}/importTaxonomyData`,
  DOWNLOAD_TAXONOMY_TEMPLATE: `${getBaseUrl()}/downloadTaxonomyTemplate`,
  DOWNLOAD_LIVE_LISTING_BATCH_TEMPLATE: `${getBaseUrl()}/downloadLiveListingBatchTemplate`,
  MIGRATE_PLANT_CATALOG_TO_TAXONOMY: `${getBaseUrl()}/migratePlantCatalogToTaxonomy`,
  // Genus Request Workflow
  INSERT_GENUS_REQUEST: `${getSupabaseBaseUrl()}/genus-request`,
  GET_GENUS_REQUESTS: `${getSupabaseBaseUrl()}/genus-requests`,
  APPROVE_GENUS_REQUEST: `${getSupabaseBaseUrl()}/approve-genus-request`,
  REJECT_GENUS_REQUEST: `${getSupabaseBaseUrl()}/reject-genus-request`,
  
  // QR Code APIs
  QR_GENERATOR: `${getBaseUrl()}/qrGenerator`,
  QR_GENERATOR_ORDERS: `${getBaseUrl()}/qrGenerator/orders`,
  THERMAL_LABEL_GENERATOR: `${getBaseUrl()}/thermalLabelGenerator`,
  EMAIL_THERMAL_LABELS: `${getBaseUrl()}/emailThermalLabels`,
  GENERATE_RECEIVER_BOX_LABELS: `${getBaseUrl()}/generateReceiverBoxLabels`,
  
  // Cart APIs
  ADD_TO_CART: `${getSupabaseBaseUrl()}/add-to-cart`,
  GET_CART_ITEMS: `${getSupabaseBaseUrl()}/cart-items`,
  UPDATE_CART_ITEM: `${getSupabaseBaseUrl()}/cart-update`,
  REMOVE_FROM_CART: `${getSupabaseBaseUrl()}/cart-remove`,
  
  // Shop APIs
  GET_SORT: `${getBaseUrl()}/getSort`,
GET_GENUS: `${getSupabaseBaseUrl()}/get-genus`,
GET_VARIEGATION: `${getSupabaseBaseUrl()}/get-variegation`,
  GET_VARIEGATION_DROPDOWN: `${getSupabaseBaseUrl()}/dropdown-variegation`,
  GET_COUNTRY: `${getSupabaseBaseUrl()}/dropdown-country`,
  GET_LISTING_TYPE: `${getSupabaseBaseUrl()}/dropdown-listing-type`,
  GET_SHIPPING_INDEX: `${getSupabaseBaseUrl()}/dropdown-shipping-index`,
  GET_ACCLIMATION_INDEX: `${getSupabaseBaseUrl()}/dropdown-acclimation-index`,
  BROWSE_PLANT_BY_GENUS: `${getBaseUrl()}/browsePlantByGenus`,
  BROWSE_PLANTS_BY_GENUS: `${getSupabaseBaseUrl()}/browse-plants-by-genus`,
  GET_BUYER_EVENTS: `${getBaseUrl()}/getBuyerEvents`,
SEARCH_LISTING: `${getSupabaseBaseUrl()}/search-listing`,
  SEARCH_PLANTS: `${getSupabaseBaseUrl()}/plant-search`,
  GET_BUYER_LISTINGS: `${getSupabaseBaseUrl()}/buyer-listings`,
  GET_BUYER_LISTING: `${getSupabaseBaseUrl()}/listing-detail`, // Single plant detail
GET_BUYER_LISTING_LIVE: `${getSupabaseBaseUrl()}/buyer-listing-live`, // Single plant detail
  GET_PRICE_DROP_BADGE_LISTINGS: `${getSupabaseBaseUrl()}/price-drop-badge`, // Price Drop badge
  GET_PLANT_RECOMMENDATIONS: `${getSupabaseBaseUrl()}/plant-recommendations`,
  GET_BUYER_CONTENT: `${getSupabaseBaseUrl()}/buyer-content`,
  GET_CHAT_SHOPS: `${getSupabaseBaseUrl()}/chat-shops`,
  GET_CHAT_DETAIL: `${getSupabaseBaseUrl()}/chat-detail`,
  GET_CHAT_MESSAGES: `${getSupabaseBaseUrl()}/chat-messages`,
  POST_CHAT_MESSAGE: `${getSupabaseBaseUrl()}/chat-message`,
  PUT_CHAT_MESSAGE: `${getSupabaseBaseUrl()}/chat-message`,
  DELETE_CHAT_MESSAGE: `${getSupabaseBaseUrl()}/chat-message`,
  GET_CHAT_MEMBERSHIP: `${getSupabaseBaseUrl()}/chat-membership`,
  POST_CHAT_JOIN_REQUEST: `${getSupabaseBaseUrl()}/chat-join-request`,
  GET_CHAT_PARTICIPANTS: `${getSupabaseBaseUrl()}/chat-participants`,
  GET_CHAT_PARTICIPANTS_BATCH: `${getSupabaseBaseUrl()}/chat-participants-batch`,
  GET_CHATS: `${getSupabaseBaseUrl()}/chats`,
  POST_CHAT_DELETE: `${getSupabaseBaseUrl()}/chat-delete`,
  POST_CHAT_CREATE: `${getSupabaseBaseUrl()}/chat-create`,
  GET_CHAT_REALTIME_TOKEN: `${getSupabaseBaseUrl()}/chat-realtime-token`,
  GET_LIVE_STREAMS: `${getSupabaseBaseUrl()}/live-list`,
  GET_LIVE_SELLERS: `${getSupabaseBaseUrl()}/live-sellers`,
  POST_GENERATE_LIVE_SESSION: `${getSupabaseBaseUrl()}/generate-live-session`,
  POST_SUPPLIER_UPDATE: `${getSupabaseBaseUrl()}/supplier-update`,
  POST_REPORT_PROBLEM: `${getSupabaseBaseUrl()}/report-problem`,
  POST_GENUS_REQUEST: `${getSupabaseBaseUrl()}/genus-request`,
  POST_PROFILE_PHOTO_UPLOAD: `${getSupabaseBaseUrl()}/profile-photo-upload`,
SEARCH_DRAFT_LISTINGS: `${getSupabaseBaseUrl()}/search-draft-listings`,
  
  // Listing Management APIs
  UPLOAD_LISTING_IMAGE: `${getBaseUrl()}/uploadListingImage`,
  UPLOAD_CHAT_VIDEO: `${getBaseUrl()}/uploadChatVideo`,
ADD_LISTING: `${getSupabaseBaseUrl()}/add-listing`,
UPDATE_LISTING: `${getSupabaseBaseUrl()}/update-listing`,
GET_LISTING: `${getSupabaseBaseUrl()}/get-listing`,
  SYNC_SELLER_EXPIRED_LISTINGS: `${getBaseUrl()}/syncSellerExpiredListings`,
DUPLICATE_LISTING: `${getSupabaseBaseUrl()}/duplicate-listing`,
DELETE_LISTING: `${getSupabaseBaseUrl()}/delete-listing`,
  // External listing/reporting service used for business performance charts
  // Cloud Run endpoint that accepts POST { interval }
  // Use a local path when running with the emulator so developers can stub the endpoint.
  GET_LISTING_REPORT: USE_LOCAL_API ? `${getBaseUrl()}/getListingReport` : 'https://getlistingreport-nstilwgvua-uc.a.run.app',
  
  // News & Events (buyer announcements)
  GET_NEWS_AND_EVENT: (limit = 10, category = 'announcement') => `${getBaseUrl()}/getNewsAndEvent?limit=${limit}&category=${encodeURIComponent(category)}`,
  // External dashboard statistics (not hosted on our functions base)
GET_DASHBOARD_STATISTICS: `${getSupabaseBaseUrl()}/dashboard-statistics`,
  // External listing/reporting service used for business performance charts
  // This is an external Cloud Run endpoint that accepts POST { interval }
  
  // Checkout & Payment APIs
  CHECKOUT: `${getBaseUrl()}/checkout`,
  CHECKOUT_JOINER: `${getBaseUrl()}/checkoutJoiner`,
  CALCULATE_CHECKOUT_SHIPPING: `${getSupabaseBaseUrl()}/checkout-shipping`,
  CALCULATE_CHECKOUT_SHIPPING_JOINER: `${getBaseUrl()}/calculateCheckoutShippingJoiner`,
  CREATE_PAYMENT_INTENT: `${getBaseUrl()}/createPaymentIntent`,
  CAPTURE_PAYMENT: `${getBaseUrl()}/capturePayment`,

  // Discount Code APIs
  VALIDATE_DISCOUNT_CODE: `${getSupabaseBaseUrl()}/validate-discount`,
CREATE_DISCOUNT: `${getSupabaseBaseUrl()}/create-discount`,
UPDATE_DISCOUNT: `${getSupabaseBaseUrl()}/update-discount`,
DELETE_DISCOUNT: `${getSupabaseBaseUrl()}/delete-discount`,
GET_DISCOUNTS: `${getSupabaseBaseUrl()}/get-discounts`,
GET_DISCOUNT: `${getSupabaseBaseUrl()}/get-discount`,

  // Order APIs
GET_ORDERS: `${getSupabaseBaseUrl()}/get-orders`,
GET_ORDER_FOR_RECEIVING: `${getSupabaseBaseUrl()}/order-for-receiving`,
  GET_BUYER_ORDERS: `${getSupabaseBaseUrl()}/buyer-orders`,
  GET_BUYER_ORDERS_GROUPED: `${getSupabaseBaseUrl()}/buyer-orders-grouped`,
  GET_BUYER_PROFILE: `${getSupabaseBaseUrl()}/buyer-profile`,
  GET_ADMIN_ORDERS: `${getSupabaseBaseUrl()}/admin-orders`,
  GET_ORDER_DETAIL: `${getSupabaseBaseUrl()}/order-detail`,
  GENERATE_INVOICE: `${getSupabaseBaseUrl()}/generate-invoice`,
  
  // Seller Order APIs
UPDATE_ORDER_SELLER_SCANNED: `${getSupabaseBaseUrl()}/update-order-seller-scanned`,
GET_SELLER_ORDER_COUNTS: `${getSupabaseBaseUrl()}/seller-order-counts`,
  UPDATE_ORDER_LEAF_TRAIL_STATUS: `${getSupabaseBaseUrl()}/update-order-leaf-trail-status`,
  
  // System APIs
CHECK_MAINTENANCE: `${getSupabaseBaseUrl()}/check-maintenance`,
SET_MAINTENANCE: `${getSupabaseBaseUrl()}/set-maintenance`,
GET_APP_VERSION: `${getSupabaseBaseUrl()}/get-app-version`,
SET_APP_VERSION: `${getSupabaseBaseUrl()}/set-app-version`,
  
  // Credit Request APIs
REQUEST_CREDIT: `${getSupabaseBaseUrl()}/request-credit`,
GET_BUYER_CREDIT_REQUESTS: `${getSupabaseBaseUrl()}/buyer-credit-requests`,
GET_CREDIT_REQUEST_DETAIL: `${getSupabaseBaseUrl()}/credit-request-detail`,
GET_JOURNEY_MISHAP_ORDERS: `${getSupabaseBaseUrl()}/journey-mishap-orders`,
GET_PLANTS_WITH_CREDIT_REQUESTS: `${getSupabaseBaseUrl()}/plants-with-credit-requests`,
  GET_JOURNEY_MISHAP_DATA: `${getSupabaseBaseUrl()}/journey-mishap-data`,
GET_ADMIN_JOURNEY_MISHAP_DATA: `${getSupabaseBaseUrl()}/admin-journey-mishap-data`,
UPDATE_JOURNEY_MISHAP_STATUS: `${getSupabaseBaseUrl()}/update-journey-mishap-status`,
  EXPORT_BUYER_ORDERS: `${getSupabaseBaseUrl()}/export-buyer-orders`,
CLEAR_CREDITS: `${getSupabaseBaseUrl()}/clear-credits`,
GET_PLANT_CREDIT_LEDGER: `${getSupabaseBaseUrl()}/plant-credit-ledger`,
GET_BUYER_CREDIT_STATEMENT: `${getSupabaseBaseUrl()}/buyer-credit-statement`,
MANUAL_ADJUST_CREDITS: `${getSupabaseBaseUrl()}/manual-adjust-credits`,
  
  // Dropdown APIs
  GET_PLANTS_DROPDOWN: `${getBaseUrl()}/getPlantsDropdown`,
  GET_ALL_PLANT_GENUS: `${getBaseUrl()}/getAllPlantGenus`,
  GET_PLANT_CARE_TAGS: `${getBaseUrl()}/getPlantCareTags`,
  GET_PLANT_TYPES: `${getBaseUrl()}/getPlantTypes`,
  GET_PLANT_GROWTH_FORMS: `${getBaseUrl()}/getPlantGrowthForms`,
  GET_REGIONS_DROPDOWN: `${getBaseUrl()}/getRegionsDropdown`,
  GET_DELIVERY_OPTIONS: `${getBaseUrl()}/getDeliveryOptions`,
  
  // Location Dropdown APIs
GET_DROPDOWN_STATES: `${getSupabaseBaseUrl()}/states-data`,
GET_DROPDOWN_CITIES: `${getSupabaseBaseUrl()}/cities-data`,
  POPULATE_DROPDOWN_STATES: `${getBaseUrl()}/populateDropdownStates`,
  POPULATE_DROPDOWN_CITIES: `${getBaseUrl()}/populateDropdownCities`,
  TRIGGER_LOCATION_DATA_UPDATE: `${getBaseUrl()}/triggerLocationDataUpdate`,
  // Public (unauthenticated) location endpoints
  PUBLIC_STATES: `${getBaseUrl()}/getStatesData`,
  PUBLIC_CITIES: `${getBaseUrl()}/getCitiesData`,
GET_CITIES_BY_STATE: `${getSupabaseBaseUrl()}/cities-by-state`,
  
  // User related endpoints
  SEARCH_USER: `${getSupabaseBaseUrl()}/search-user`,
  UPLOAD_PROFILE_PHOTO: `${getBaseUrl()}/uploadProfilePhoto`,
  UPLOAD_CHAT_SHOP_PHOTO: `${getBaseUrl()}/uploadChatShopPhoto`,
  UPLOAD_BUYER_CONTENT_PHOTO: `${getBaseUrl()}/uploadBuyerContentPhoto`,
  
  // Shipping Buddy endpoints
  SUBMIT_RECEIVER_REQUEST: `${getBaseUrl()}/submitReceiverRequest`,
  GET_BUDDY_REQUESTS: `${getBaseUrl()}/getBuddyRequests`,
  APPROVE_REJECT_BUDDY_REQUEST: `${getBaseUrl()}/approveRejectBuddyRequest`,
  GET_MY_RECEIVER_REQUEST: `${getBaseUrl()}/getMyReceiverRequest`,
  CANCEL_RECEIVER_REQUEST: `${getBaseUrl()}/cancelReceiverRequest`,

  // Address Book APIs
  GET_ADDRESS_BOOK_ENTRIES: `${getSupabaseBaseUrl()}/address-book`,
  GET_ADDRESS_BOOK_ENTRY: `${getSupabaseBaseUrl()}/address-book`,
  CREATE_ADDRESS_BOOK_ENTRY: `${getSupabaseBaseUrl()}/address-book`,
  UPDATE_ADDRESS_BOOK_ENTRY: `${getSupabaseBaseUrl()}/address-book`,
  DELETE_ADDRESS_BOOK_ENTRY: `${getSupabaseBaseUrl()}/address-book`,

  // Referral APIs
  REFERRAL_INFO: `${getSupabaseBaseUrl()}/referral-info`,
  LIST_REFERRAL_REWARDS: `${getSupabaseBaseUrl()}/list-referral-rewards`,
  CREATE_REFERRAL: `${getSupabaseBaseUrl()}/create-referral`,
  REDEEM_REFERRAL_REWARD: `${getBaseUrl()}/redeemReferralReward`,
  
  // Flight Change Request endpoints
SUBMIT_FLIGHT_CHANGE_REQUEST: `${getSupabaseBaseUrl()}/submit-flight-change-request`,
  GET_FLIGHT_CHANGE_REQUESTS: `${getBaseUrl()}/getFlightChangeRequests`,
  GET_ADMIN_FLIGHT_CHANGE_REQUESTS: `${getSupabaseBaseUrl()}/flight-change-requests`,
  UPDATE_FLIGHT_CHANGE_REQUEST: `${getSupabaseBaseUrl()}/flight-change-request-update`,

  // Flight Schedule endpoints
  GET_FLIGHT_SCHEDULE: `${getSupabaseBaseUrl()}/flight-schedule`,
  UPDATE_FLIGHT_DATE_STATUS: `${getSupabaseBaseUrl()}/flight-date-status`,
  UPDATE_FLIGHT_DATE_FOR_SCHEDULE: `${getSupabaseBaseUrl()}/flight-date-schedule-update`,
  GET_ACTIVE_FLIGHT_DATES: `${getSupabaseBaseUrl()}/active-flight-dates`,

  // Leaf Trail endpoints
  UPDATE_LEAF_TRAIL_STATUS: `${getSupabaseBaseUrl()}/leaf-trail-status`,
  UPDATE_PLANT_STATUS: `${getSupabaseBaseUrl()}/plant-status`,
  GET_ADMIN_LEAF_TRAIL_RECEIVING: `${getSupabaseBaseUrl()}/admin-order-details`,
  EXPORT_ALL_ORDERS_TO_CSV: `${getSupabaseBaseUrl()}/admin-export-orders`,
  GET_ADMIN_LEAF_TRAIL_SORTING: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ADMIN_LEAF_TRAIL_PACKING: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ADMIN_LEAF_TRAIL_SHIPPING: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ADMIN_LEAF_TRAIL_SHIPPED: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ADMIN_LEAF_TRAIL_FILTERS: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ADMIN_SCAN_QR: `${getSupabaseBaseUrl()}/admin-order-details`,
  ADD_LEAF_TRAIL_BOX_NUMBER: `${getSupabaseBaseUrl()}/leaf-trail-box-number`,
  ASSIGN_RECEIVER_BOXES: `${getSupabaseBaseUrl()}/assign-receiver-boxes`,
  ADD_LEAF_SORT_TRAY: `${getSupabaseBaseUrl()}/leaf-trail-sort-tray`,
  UPDATE_PLANTS_TO_SORTED: `${getSupabaseBaseUrl()}/plants-sorted-needs-stay`,
  UPDATE_PLANTS_TO_NEEDS_TO_STAY: `${getSupabaseBaseUrl()}/plants-sorted-needs-stay`,
  GET_ORDERS_BY_SORTING_TRAY: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ORDERS_BY_BOX_NUMBER: `${getSupabaseBaseUrl()}/admin-order-details`,
  GET_ORDERS_BY_TRACKING_NUMBER: `${getSupabaseBaseUrl()}/admin-order-details`,
  ADD_LEAF_TRAIL_TRACKING_NUMBER: `${getSupabaseBaseUrl()}/leaf-trail-tracking-number`,
  ADD_LEAF_TRAIL_SHIPPING_DETAILS: `${getSupabaseBaseUrl()}/leaf-trail-shipping-details`,
  SEND_RECEIVER_BOXES_TO_IN_TRANSIT: `${getSupabaseBaseUrl()}/send-receiver-boxes-in-transit`,

  // Delivery Export endpoint
  DELIVERY_EXPORT: `${getBaseUrl()}/deliveryExport`,
  
  // Order Export endpoints
  EXPORT_ORDERS_EMAIL: `${getBaseUrl()}/exportOrdersEmail`,

  // Payment Management APIs
  GET_PENDING_PAYMENT_ORDERS: `${getSupabaseBaseUrl()}/admin-payment-management`,
  UPDATE_ORDER_READY_TO_FLY: `${getSupabaseBaseUrl()}/admin-payment-management`,
  DELETE_PENDING_ORDER: `${getSupabaseBaseUrl()}/admin-payment-management`,

  // Group Chat Notification
  SEND_GROUP_CHAT_NOTIFICATION: `${getBaseUrl()}/sendGroupChatNotification`,
  SEND_EVERYONE_MENTION_NOTIFICATION: `${getBaseUrl()}/sendEveryoneMentionNotification`,

  // Live Notifications
  SCHEDULE_LIVE_REMINDER: `${getBaseUrl()}/scheduleLiveReminder`,
  SEND_LIVE_STARTED_NOTIFICATION: `${getBaseUrl()}/sendLiveStartedNotification`,

  // Live Stream Requests
  CREATE_LIVE_REQUEST: `${getBaseUrl()}/createLiveRequest`,
  UPDATE_LIVE_SESSION_STATUS: `${getSupabaseBaseUrl()}/update-live-session-status`,
  GET_LIVE_REQUESTS: `${getBaseUrl()}/getLiveRequests`,
  UPDATE_LIVE_REQUEST_STATUS: `${getBaseUrl()}/updateLiveRequestStatus`,
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

// Current API configuration logging suppressed in normal runs. Use getCurrentApiEnvironment() to inspect.
