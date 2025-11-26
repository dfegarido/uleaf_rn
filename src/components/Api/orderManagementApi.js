import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Submit a flight change request
 * @param {Object} requestData - Flight change request data
 * @param {Array<string>} requestData.transactionNumbers - Array of transaction numbers
 * @param {Array<string>} requestData.orderIds - Array of order IDs
 * @param {string} requestData.currentFlightDate - Current flight date (formatted string)
 * @param {Date|string} requestData.currentFlightDateObj - Current flight date object
 * @param {string} requestData.newFlightDate - New flight date (formatted string)
 * @param {string} requestData.reason - Reason for the change
 * @returns {Promise<Object>} Flight change request response
 */
export const submitFlightChangeRequestApi = async (requestData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(API_ENDPOINTS.SUBMIT_FLIGHT_CHANGE_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Submit flight change request API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while submitting flight change request',
    };
  }
};

/**
 * Get flight change requests for the current buyer
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (pending, approved, rejected)
 * @param {number} params.limit - Number of requests to fetch
 * @param {number} params.offset - Pagination offset
 * @returns {Promise<Object>} Flight change requests response
 */
export const getFlightChangeRequestsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const url = `${API_ENDPOINTS.GET_FLIGHT_CHANGE_REQUESTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get flight change requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching flight change requests',
    };
  }
};

/**
 * Get orders with filters
 * @param {Object} params - Query parameters
 * @param {string} params.supplierId - Supplier ID filter
 * @param {string} params.status - Order status filter
 * @param {number} params.limit - Number of orders to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise<Object>} Orders response
 */
export const getOrdersApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_ORDERS}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get orders API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching orders',
    };
  }
};

/**
 * Get buyer orders
 * @param {Object} params - Query parameters
 * @param {string} params.status - Order status filter
 * @param {number} params.limit - Number of orders to fetch
 * @param {string} params.nextPageToken - Pagination token
 * @returns {Promise<Object>} Buyer orders response
 */
export const getBuyerOrdersApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    console.log({authToken})
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const url = `${API_ENDPOINTS.GET_BUYER_ORDERS}?${queryParams.toString()}`
    console.log("url", url)
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log("data.plants", data.data.order)
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get buyer orders API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching buyer orders',
    };
  }
};

/**
 * Get buyer orders grouped by transaction number
 * @param {Object} params - Query parameters
 * @param {string} params.status - Order status filter
 * @param {number} params.limit - Number of grouped orders to fetch
 * @param {number} params.offset - Pagination offset
 * @returns {Promise<Object>} Buyer orders grouped response
 */
export const getBuyerOrdersGroupedApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const url = `${API_ENDPOINTS.GET_BUYER_ORDERS_GROUPED}?${queryParams.toString()}`
    console.log("🔍 getBuyerOrdersGroupedApi url:", url);
    
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log("✅ getBuyerOrdersGroupedApi response:", data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get buyer orders grouped API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching grouped buyer orders',
    };
  }
};

/**
 * Get detailed information for a specific order
 * @param {Object} params - Query parameters
 * @param {string} params.orderId - Order ID (legacy mode)
 * @param {string} params.transactionNumber - Transaction number (required)
 * @param {string} params.plantCode - Plant code (optional - if not provided, backend returns first product)
 * @returns {Promise<Object>} Order detail response with comprehensive information and images
 */
export const getOrderDetailApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();

    // Check if we have required parameters for one of the valid modes:
    // Mode 1: transactionNumber (plantCode is optional - backend returns first product if not provided)
    // Mode 2: orderId for legacy order lookup
    if (!params.transactionNumber && !params.orderId) {
      throw new Error('Either transactionNumber OR orderId is required');
    }
    
    const queryParams = new URLSearchParams();
    // Add orderId parameter if present
    if (params.orderId) {
      queryParams.append('orderId', params.orderId);
    }
    // Add transactionNumber parameter if present
    if (params.transactionNumber) {
      queryParams.append('transactionNumber', params.transactionNumber);
    }
    // Add plantCode parameter if present
    if (params.plantCode) {
      queryParams.append('plantCode', params.plantCode);
    }
    
    const url = `${API_ENDPOINTS.GET_ORDER_DETAIL}?${queryParams.toString()}`;
    console.log('getOrderDetailApi - Making request to:', url);
    console.log('getOrderDetailApi - With params:', params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('getOrderDetailApi - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('getOrderDetailApi - Error response:', errorData);
      
      // Preserve availablePlantCodes in the error response for retry logic
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      const errorResponse = {
        success: false,
        error: errorMessage,
        availablePlantCodes: errorData.availablePlantCodes || [],
        data: errorData // Include full error data for debugging
      };
      
      // If we have availablePlantCodes, return them for retry logic
      if (errorData.availablePlantCodes && errorData.availablePlantCodes.length > 0) {
        console.log('⚠️ Error includes availablePlantCodes:', errorData.availablePlantCodes);
      }
      
      return errorResponse;
    }

    const data = await response.json();
    console.log('getOrderDetailApi - Success response:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get order detail API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching order details',
      availablePlantCodes: [],
    };
  }
};

/**
 * Update delivery status by transaction number
 * @param {Object} updateData - Update data
 * @param {string} updateData.transactionNumber - Transaction number
 * @param {string} updateData.deliveryStatus - New delivery status
 * @param {string} updateData.notes - Optional notes
 * @returns {Promise<Object>} Update response
 */
export const updateDeliveryStatusApi = async (updateData) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/updateDeliveryStatusByTrxNumber',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Update delivery status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating delivery status',
    };
  }
};

/**
 * Export delivery data
 * @param {Object} params - Export parameters
 * @param {string} params.startDate - Start date for export
 * @param {string} params.endDate - End date for export
 * @param {string} params.format - Export format (excel/csv)
 * @returns {Promise<Object>} Export response
 */
export const deliveryExportApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/deliveryExport?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Delivery export API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while exporting delivery data',
    };
  }
};

/**
 * Generate Excel report
 * @param {Object} params - Excel generation parameters
 * @param {string} params.reportType - Type of report to generate
 * @param {string} params.startDate - Start date for report
 * @param {string} params.endDate - End date for report
 * @returns {Promise<Object>} Excel generation response
 */
export const excelGeneratorApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/excelGenerator?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Excel generator API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while generating Excel report',
    };
  }
};

/**
 * Request credit for plant issues
 * @param {Object} params - Credit request parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.plantCode - Plant code
 * @param {string} params.issueType - Type of issue (Missing, Dead on Arrival, Damaged)
 * @param {string} params.description - Optional description of the issue
 * @param {Array} params.attachments - Optional attachments (images/videos)
 * @returns {Promise<Object>} Credit request response
 */
export const requestCreditApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    console.log('🔍 Requesting credit with params:', params);

    const response = await fetch(API_ENDPOINTS.REQUEST_CREDIT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('✅ Credit request successful:', data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Request credit API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while requesting credit',
    };
  }
};

/**
 * Get buyer credit requests
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.limit - Number of requests to fetch
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Object>} Credit requests response
 */
export const getBuyerCreditRequestsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_BUYER_CREDIT_REQUESTS}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get buyer credit requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching credit requests',
    };
  }
};

/**
 * Get credit request details
 * @param {Object} params - Query parameters
 * @param {string} params.requestId - Credit request ID
 * @returns {Promise<Object>} Credit request details response
 */
export const getCreditRequestDetailApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_CREDIT_REQUEST_DETAIL}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get credit request detail API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching credit request details',
    };
  }
};

/**
 * Get invoice PDF as base64 for viewing (without sending email)
 * @param {Object} params - Query parameters
 * @param {string} params.transactionNumber - Transaction number (required)
 * @param {string} params.plantCode - Plant code (optional - if not provided, shows all products in order)
 * @returns {Promise<Object>} Invoice PDF response with base64 data
 */
export const getInvoicePdfApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!params.transactionNumber) {
      throw new Error('transactionNumber is required');
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('transactionNumber', params.transactionNumber);
    if (params.plantCode) {
      queryParams.append('plantCode', params.plantCode);
    }
    queryParams.append('view', 'true'); // Request view mode (base64 PDF)
    
    const url = `${API_ENDPOINTS.GENERATE_INVOICE}?${queryParams.toString()}`;
    console.log('📄 Fetching invoice PDF for viewing:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    // Parse JSON response
    const data = await response.json();
    
    return {
      success: data.success || true,
      message: data.message || 'Invoice generated successfully',
      pdfBase64: data.pdfBase64 || '',
      filename: data.filename || '',
      transactionNumber: data.transactionNumber || params.transactionNumber,
      plantCode: data.plantCode || params.plantCode,
    };
  } catch (error) {
    console.error('❌ Get invoice PDF API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching invoice',
    };
  }
};

/**
 * Generate and send invoice PDF via email for a Ready to Fly order
 * @param {Object} params - Query parameters
 * @param {string} params.transactionNumber - Transaction number (required)
 * @param {string} params.plantCode - Plant code (optional - if not provided, sends invoice for all products)
 * @returns {Promise<Object>} Invoice email response
 */
export const generateInvoiceApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!params.transactionNumber) {
      throw new Error('transactionNumber is required');
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('transactionNumber', params.transactionNumber);
    if (params.plantCode) {
      queryParams.append('plantCode', params.plantCode);
    }
    // Note: view parameter is not included, so backend will send email
    
    const url = `${API_ENDPOINTS.GENERATE_INVOICE}?${queryParams.toString()}`;
    console.log('📧 Sending invoice via email:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    // Parse JSON response
    const data = await response.json();
    
    return {
      success: data.success || true,
      message: data.message || 'Invoice sent successfully',
      details: data.details || {},
      sentTo: data.details?.sentTo || '',
    };
  } catch (error) {
    console.error('❌ Generate invoice API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while sending invoice',
    };
  }
};

/**
 * Get Journey Mishap data from requestCredit collection linked with orders and listings
 * This API fetches comprehensive data by joining requestCredit with orders and listings collections
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of records to fetch (default: 20)
 * @param {number} params.offset - Offset for pagination (default: 0)
 * @param {string} params.status - Filter by credit request status (pending, approved, rejected)
 * @param {string} params.issueType - Filter by issue type (missing, damaged, dead_on_arrival)
 * @param {string} params.orderId - Filter by specific order ID
 * @param {string} params.plantCode - Filter by specific plant code
 * @param {string} params.startDate - Filter by request date range start
 * @param {string} params.endDate - Filter by request date range end
 * @returns {Promise<Object>} Journey Mishap data response with linked order and listing details
 */
export const getJourneyMishapDataApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    // Set default parameters
    const defaultParams = {
      limit: 20,
      offset: 0,
      includeOrderDetails: true,
      includeListingDetails: true,
      includePlantDetails: true,
      ...params
    };
    
    const queryParams = new URLSearchParams();
    Object.keys(defaultParams).forEach(key => {
      if (defaultParams[key] !== undefined && defaultParams[key] !== null) {
        queryParams.append(key, defaultParams[key].toString());
      }
    });
    
    console.log('🚀 Fetching Journey Mishap data with params:', defaultParams);
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_JOURNEY_MISHAP_DATA}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('✅ Journey Mishap data received:', {
      totalRecords: data.data?.totalRecords || 0,
      creditRequestsCount: data.data?.creditRequests?.length || 0,
      hasOrderDetails: data.data?.creditRequests?.[0]?.orderDetails ? true : false,
      hasListingDetails: data.data?.creditRequests?.[0]?.listingDetails ? true : false,
    });
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Get Journey Mishap data API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching Journey Mishap data',
    };
  }
};
