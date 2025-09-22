import { API_CONFIG } from '../config/apiConfig';

/**
 * Approve Genus Request API Client
 * 
 * Approves a pending genus request and adds it to the main taxonomy.
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.requestId - ID of the request to approve
 * @param {string} params.adminId - ID of the admin approving the request
 * @param {string} params.comment - Optional admin comment
 * @param {string} params.authToken - Authentication token (optional for emulator)
 * 
 * @returns {Promise<Object>} Response containing approval result
 * 
 * @example
 * const response = await approveGenusRequestApi({
 *   requestId: 'req123',
 *   adminId: 'admin456',
 *   comment: 'Valid species, approved for taxonomy'
 * });
 * 
 * if (response.success) {
 *   console.log('Request approved:', response.data);
 * }
 */
export const approveGenusRequestApi = async (params) => {
  try {
    console.log('✅ Starting approveGenusRequestApi call with params:', params);

    const { requestId, adminId, comment, authToken } = params;

    // Validate required parameters
    if (!requestId) {
      throw new Error('requestId is required');
    }

    if (!adminId) {
      throw new Error('adminId is required');
    }

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/approveGenusRequest`;
    
    console.log('🌐 Making request to:', url);

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Prepare request body
    const body = {
      requestId,
      adminId,
      comment: comment || ''
    };

    console.log('📤 Request body:', body);

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
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
        status: response.status
      };
    }

    const data = await response.json();
    console.log('✅ Approval response received:', data);

    return {
      success: data.success || true,
      data: data.data || {},
      message: data.message,
      timestamp: data.timestamp
    };

  } catch (error) {
    console.error('❌ Error in approveGenusRequestApi:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed'
    };
  }
};

/**
 * Reject Genus Request API Client
 * 
 * Rejects a pending genus request with an optional reason.
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.requestId - ID of the request to reject
 * @param {string} params.adminId - ID of the admin rejecting the request
 * @param {string} params.reason - Optional rejection reason
 * @param {string} params.comment - Optional admin comment
 * @param {string} params.authToken - Authentication token (optional for emulator)
 * 
 * @returns {Promise<Object>} Response containing rejection result
 * 
 * @example
 * const response = await rejectGenusRequestApi({
 *   requestId: 'req123',
 *   adminId: 'admin456',
 *   reason: 'Species already exists',
 *   comment: 'Please check existing taxonomy before submitting'
 * });
 * 
 * if (response.success) {
 *   console.log('Request rejected:', response.data);
 * }
 */
export const rejectGenusRequestApi = async (params) => {
  try {
    console.log('❌ Starting rejectGenusRequestApi call with params:', params);

    const { requestId, adminId, reason, comment, authToken } = params;

    // Validate required parameters
    if (!requestId) {
      throw new Error('requestId is required');
    }

    if (!adminId) {
      throw new Error('adminId is required');
    }

    // Build URL
    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}/rejectGenusRequest`;
    
    console.log('🌐 Making request to:', url);

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Prepare request body
    const body = {
      requestId,
      adminId,
      reason: reason || '',
      comment: comment || ''
    };

    console.log('📤 Request body:', body);

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
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
        status: response.status
      };
    }

    const data = await response.json();
    console.log('❌ Rejection response received:', data);

    return {
      success: data.success || true,
      data: data.data || {},
      message: data.message,
      timestamp: data.timestamp
    };

  } catch (error) {
    console.error('❌ Error in rejectGenusRequestApi:', error);
    
    return {
      success: false,
      error: error.message || 'Network request failed'
    };
  }
};
