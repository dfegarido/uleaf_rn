import { API_CONFIG } from '../config/apiConfig';

/**
 * Get Genus Requests API Client
 * 
 * Fetches all genus requests submitted by users for display in the
 * Admin Taxonomy "Requests" tab.
 * 
 * @param {Object} options - Request options
 * @param {number} options.limit - Number of requests to return (default: 50, max: 100)
 * @param {number} options.offset - Number of requests to skip for pagination (default: 0)
 * @param {string} options.status - Filter by status: 'pending', 'approved', 'rejected' (optional)
 * @param {string} options.sortBy - Sort field: 'createdAt', 'genus', 'species', 'status' (default: 'createdAt')
 * @param {string} options.sortOrder - Sort order: 'asc', 'desc' (default: 'desc')
 * @param {string} options.authToken - Authentication token (optional for emulator)
 * 
 * @returns {Promise<Object>} Response containing requests data and pagination info
 * 
 * @example
 * // Get first 20 pending requests, sorted by creation date (newest first)
 * const response = await getGenusRequestsApi({
 *   limit: 20,
 *   offset: 0,
 *   status: 'pending',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 * 
 * if (response.success) {
 *   console.log('Requests:', response.data);
 *   console.log('Total:', response.total);
 *   console.log('Has more:', response.hasMore);
 * }
 */
export const getGenusRequestsApi = async (options = {}) => {
  try {
    console.log('📋 Starting getGenusRequestsApi call with options:', options);

    // Build query parameters
    const params = new URLSearchParams();
    
    if (options.limit !== undefined) {
      params.append('limit', Math.min(Math.max(options.limit, 1), 100).toString());
    }
    
    if (options.offset !== undefined) {
      params.append('offset', Math.max(options.offset, 0).toString());
    }
    
    if (options.status && ['pending', 'approved', 'rejected'].includes(options.status)) {
      params.append('status', options.status);
    }
    
    if (options.sortBy && ['createdAt', 'genus', 'species', 'status'].includes(options.sortBy)) {
      params.append('sortBy', options.sortBy);
    }
    
    if (options.sortOrder && ['asc', 'desc'].includes(options.sortOrder)) {
      params.append('sortOrder', options.sortOrder);
    }

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/getGenusRequests${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log('🌐 Making request to:', url);

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token provided
    if (options.authToken) {
      headers['Authorization'] = `Bearer ${options.authToken}`;
    }

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Network request failed' };
      }

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status,
        data: [],
        total: 0,
        count: 0,
        hasMore: false
      };
    }

    const data = await response.json();
    console.log('✅ API Response received:', {
      success: data.success,
      count: data.count,
      total: data.total,
      hasMore: data.hasMore
    });
    console.log('🔍 Full API response data:', JSON.stringify(data, null, 2));

    const result = {
      success: data.success || true,
      data: data.data || [],
      total: data.total || 0,
      count: data.count || 0,
      hasMore: data.hasMore || false,
      pagination: data.pagination || {},
      timestamp: data.timestamp,
      message: data.message
    };
    
    console.log('🔍 Processed result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('❌ Error in getGenusRequestsApi:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed',
      data: [],
      total: 0,
      count: 0,
      hasMore: false
    };
  }
};

/**
 * Get Genus Requests with Default Parameters
 * 
 * Convenience function that calls getGenusRequestsApi with sensible defaults
 * for the Admin Taxonomy Requests tab.
 * 
 * @param {string} authToken - Authentication token (optional for emulator)
 * @returns {Promise<Object>} Response containing requests data
 */
export const getGenusRequestsDefault = async (authToken = null) => {
  return await getGenusRequestsApi({
    limit: 50,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    authToken: authToken
  });
};

/**
 * Get Genus Requests by Status
 * 
 * Convenience function to filter requests by status.
 * 
 * @param {string} status - Status to filter by: 'pending', 'approved', 'rejected'
 * @param {number} limit - Number of requests to return (default: 20)
 * @param {string} authToken - Authentication token (optional for emulator)
 * @returns {Promise<Object>} Response containing filtered requests data
 */
export const getGenusRequestsByStatus = async (status, limit = 20, authToken = null) => {
  return await getGenusRequestsApi({
    status: status,
    limit: limit,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    authToken: authToken
  });
};

/**
 * Get Paginated Genus Requests
 * 
 * Convenience function for pagination.
 * 
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Items per page (default: 20)
 * @param {Object} filters - Additional filters (status, sortBy, sortOrder)
 * @param {string} authToken - Authentication token (optional for emulator)
 * @returns {Promise<Object>} Response containing paginated requests data
 */
export const getGenusRequestsPaginated = async (page = 1, pageSize = 20, filters = {}, authToken = null) => {
  const offset = (Math.max(page, 1) - 1) * pageSize;
  
  return await getGenusRequestsApi({
    limit: pageSize,
    offset: offset,
    status: filters.status,
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
    authToken: authToken
  });
};
