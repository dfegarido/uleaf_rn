// API Configuration for local and production environments

// Set this to true for local development, false for production
const USE_LOCAL_API = false;

// Local development endpoints (Firebase Functions Emulator)
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator/web, your IP for physical devices
// Using actual IP address (192.168.1.6) instead of 10.0.2.2 for better Android emulator connectivity
const LOCAL_BASE_URL = 'http://localhost:5001/i-leaf-u/us-central1';

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
  return USE_LOCAL_API ? LOCAL_BASE_URL : PROD_BASE_URL;
};

// Helper function to dynamically switch API environment
export const setApiEnvironment = (useLocal) => {
  USE_LOCAL_API = useLocal;
  // Environment switch - minimal logging
  console.info(`API environment switched to: ${useLocal ? 'LOCAL' : 'PROD'}`);
  updateEndpoints();
};

// Function to generate endpoints with current base URL
const generateEndpoints = () => ({
  // Authentication APIs
  FIREBASE_LOGIN: `${getBaseUrl()}/firebaseLogin`,
  SIGN_IN_SUPPLIER: `${getBaseUrl()}/signInSupplier`,
  VALIDATE_SIGN_IN_PIN: `${getBaseUrl()}/validateSignInPin`,
  EXCHANGE_CUSTOM_TOKEN: `${getBaseUrl()}/exchangeCustomToken`,
  FORCE_LOGOUT: `${getBaseUrl()}/forceLogout`,
  
  // Admin Management APIs
  CREATE_ADMIN: `${getBaseUrl()}/createAdmin`,
  ADMIN_LOGIN: `${getBaseUrl()}/adminLogin`,
  GET_ADMIN_INFO: `${getBaseUrl()}/getAdminInfo`,
  LIST_ADMINS: `${getBaseUrl()}/listAdmins`,
  UPDATE_ADMIN: `${getBaseUrl()}/updateAdmin`,
  UPDATE_ADMIN_PASSWORD: `${getBaseUrl()}/updateAdminPassword`,
  DELETE_ADMIN: `${getBaseUrl()}/deleteAdmin`,
  GET_ALL_USERS: `${getBaseUrl()}/getAllUsers`,
  UPDATE_USER_STATUS: `${getBaseUrl()}/updateUserStatus`,
  GET_ADMIN_LISTINGS: `${getBaseUrl()}/getAdminListings`,
  GET_ADMIN_LISTING_DETAIL: `${getBaseUrl()}/getAdminListingDetail`,
  GET_GENUS_LIST: `${getBaseUrl()}/getGenusList`, // Admin taxonomy management (genus collection with metadata)
  GET_GENUS_DROPDOWN: `${getBaseUrl()}/getGenusFromPlantCatalogDropdown`, // Seller dropdown (genus collection, simple list)
  // Taxonomy Management APIs
  ADD_PLANT_TAXONOMY: `${getBaseUrl()}/addPlantTaxonomy`,
  UPDATE_PLANT_TAXONOMY: `${getBaseUrl()}/updatePlantTaxonomy`,
  DELETE_PLANT_TAXONOMY: `${getBaseUrl()}/deletePlantTaxonomy`,
  GET_SPECIES_FOR_GENUS: `${getBaseUrl()}/getSpeciesForGenus`,
  IMPORT_TAXONOMY_DATA: `${getBaseUrl()}/importTaxonomyData`,
  DOWNLOAD_TAXONOMY_TEMPLATE: `${getBaseUrl()}/downloadTaxonomyTemplate`,
  MIGRATE_PLANT_CATALOG_TO_TAXONOMY: `${getBaseUrl()}/migratePlantCatalogToTaxonomy`,
  // Genus Request Workflow
  INSERT_GENUS_REQUEST: `${getBaseUrl()}/insertGenusRequest`,
  GET_GENUS_REQUESTS: `${getBaseUrl()}/getGenusRequests`,
  APPROVE_GENUS_REQUEST: `${getBaseUrl()}/approveGenusRequest`,
  REJECT_GENUS_REQUEST: `${getBaseUrl()}/rejectGenusRequest`,
  
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
  
  // Listing Management APIs
  UPLOAD_LISTING_IMAGE: `${getBaseUrl()}/uploadListingImage`,
  ADD_LISTING: `${getBaseUrl()}/addListing`,
  UPDATE_LISTING: `${getBaseUrl()}/updateListing`,
  DUPLICATE_LISTING: `${getBaseUrl()}/duplicateListing`,
  DELETE_LISTING: `${getBaseUrl()}/deleteListingByPlantCode`,
  // External listing/reporting service used for business performance charts
  // Cloud Run endpoint that accepts POST { interval }
  // Use a local path when running with the emulator so developers can stub the endpoint.
  GET_LISTING_REPORT: USE_LOCAL_API ? `${getBaseUrl()}/getListingReport` : 'https://getlistingreport-nstilwgvua-uc.a.run.app',
  
  // News & Events (buyer announcements)
  GET_NEWS_AND_EVENT: (limit = 10, category = 'announcement') => `${getBaseUrl()}/getNewsAndEvent?limit=${limit}&category=${encodeURIComponent(category)}`,
  // External dashboard statistics (not hosted on our functions base)
  GET_DASHBOARD_STATISTICS: `${getBaseUrl()}/getDashboardStatistics`,
  // External listing/reporting service used for business performance charts
  // This is an external Cloud Run endpoint that accepts POST { interval }
  
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

// Current API configuration logging suppressed in normal runs. Use getCurrentApiEnvironment() to inspect.
