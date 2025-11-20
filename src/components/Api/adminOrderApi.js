import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Get orders for admin order summary
 * @param {Object} filters - Filter parameters
 * @param {string} filters.status - Order status filter (readyToFly, completed, wildgone)
 * @param {string} filters.sort - Sort order
 * @param {number} filters.limit - Number of orders to fetch
 * @param {number} filters.page - Page number for pagination
 * @param {string} filters.search - Search term
 * @returns {Promise<Object>} Orders response
 */
export const getAdminOrdersApi = async (filters = {}) => {
  try {
    const token = await getStoredAuthToken();

    // Map frontend status to backend status
    const statusMapping = {
      'readyToFly': 'Ready to Fly', // Orders ready to fly
      'completed': 'delivered', // Plants are Home - delivered orders (matches buyer side)
      'wildgone': 'cancelled' // Cancelled/wildgone orders
    };

    // Map frontend sort values to backend sort field and direction
    const sortMapping = {
      'latest': { field: 'createdAt', direction: 'desc' },      // Newest to Oldest
      'oldest': { field: 'createdAt', direction: 'asc' },       // Oldest to Newest
      'priceLow': { field: 'price', direction: 'asc' },         // Price Low to High
      'priceHigh': { field: 'price', direction: 'desc' }        // Price High to Low
    };

    const queryParams = new URLSearchParams();
   
    // Add status filter if provided
    if (filters.status && statusMapping[filters.status]) {
      const mappedStatus = statusMapping[filters.status];
      queryParams.append('status', mappedStatus);
      console.log(`Tab: ${filters.status} → Backend status: ${mappedStatus}`);
    }
    
    // Add sort parameters with field and direction
    if (filters.sort && sortMapping[filters.sort]) {
      const sortConfig = sortMapping[filters.sort];
      queryParams.append('sortField', sortConfig.field);
      queryParams.append('sortDirection', sortConfig.direction);
      console.log(`Sort: ${filters.sort} → Field: ${sortConfig.field}, Direction: ${sortConfig.direction}`);
    }
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.search) {
      queryParams.append('search', filters.search);
      console.log('Search term being sent:', filters.search);
    }
    
    // Handle array filters - convert to comma-separated strings
    if (filters.genus && Array.isArray(filters.genus) && filters.genus.length > 0) {
      queryParams.append('genus', filters.genus.join(','));
    }
    if (filters.variegation && Array.isArray(filters.variegation) && filters.variegation.length > 0) {
      queryParams.append('variegation', filters.variegation.join(','));
    }
    if (filters.listingType && Array.isArray(filters.listingType) && filters.listingType.length > 0) {
      queryParams.append('listingType', filters.listingType.join(','));
    }
    
    // Handle single value filters
    if (filters.garden) queryParams.append('garden', filters.garden);
    if (filters.buyer) queryParams.append('buyer', filters.buyer);
    if (filters.receiver) queryParams.append('receiver', filters.receiver);
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        const fromISO = filters.dateRange.from.toISOString().split('T')[0]; // Just the date part
        queryParams.append('dateFrom', fromISO);
        console.log('Date Range - From:', fromISO);
      }
      if (filters.dateRange.to) {
        const toISO = filters.dateRange.to.toISOString().split('T')[0]; // Just the date part
        queryParams.append('dateTo', toISO);
        console.log('Date Range - To:', toISO);
      }
    }
    if (filters.plantFlight) queryParams.append('plantFlight', filters.plantFlight);

    // Use the new admin-specific endpoint
    const url = `${API_ENDPOINTS.GET_ADMIN_ORDERS}?${queryParams.toString()}`;

    console.log('Admin Orders API - Fetching from URL:', url);
    console.log('Admin Orders API - Filters:', filters);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Admin Orders API - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Admin Orders API - Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    console.log('Admin Orders API - Response data:', json);
    return json;
  } catch (error) {
    console.log('getAdminOrdersApi error:', error.message);
    throw error;
  }
};

/**
 * Get flight change requests for admin panel
 * @param {Object} params - Query parameters
 * @param {string} params.currentFlightDate - Filter by current flight date (formatted string)
 * @param {string} params.status - Filter by status (pending, approved, rejected)
 * @param {string} params.buyerUid - Filter by buyer UID
 * @param {number} params.limit - Number of requests to fetch
 * @param {number} params.offset - Pagination offset
 * @returns {Promise<Object>} Flight change requests response
 */
export const getAdminFlightChangeRequestsApi = async (params = {}) => {
  try {
    const token = await getStoredAuthToken();
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    const url = `${API_ENDPOINTS.GET_ADMIN_FLIGHT_CHANGE_REQUESTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
    console.error('Get admin flight change requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching flight change requests',
    };
  }
};

/**
 * Approve or reject a flight change request (admin only)
 * @param {Object} requestData - Request data
 * @param {string} requestData.requestId - Flight change request ID
 * @param {string} requestData.status - New status ('approved' or 'rejected')
 * @param {string} requestData.reviewNotes - Optional review notes
 * @returns {Promise<Object>} Update response
 */
export const updateFlightChangeRequestApi = async (requestData) => {
  try {
    const token = await getStoredAuthToken();
    
    const response = await fetch(API_ENDPOINTS.UPDATE_FLIGHT_CHANGE_REQUEST, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
    console.error('Update flight change request API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating the flight change request',
    };
  }
};
