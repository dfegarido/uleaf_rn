import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get list of admin users (Jungle Access users)
 * @param {Object} filters - Filter options
 * @param {string} filters.role - Filter by role (admin, sub_admin, or undefined for all)
 * @param {string} filters.status - Filter by status (active, inactive)
 * @param {string} filters.search - Search term for name or email
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 20, max: 50)
 * @returns {Promise<Object>} Response with admin users list
 */
export const listAdminsApi = async (filters = {}) => {
  try {
    const token = await getStoredAuthToken();
    
    console.log('listAdminsApi: Preparing request', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + '...',
      filters
    });
    
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters.role) {
      queryParams.append('role', filters.role);
    }
    
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    
    if (filters.limit) {
      queryParams.append('limit', filters.limit.toString());
    }

    const url = `${API_ENDPOINTS.LIST_ADMINS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('listAdminsApi: Sending request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('listAdminsApi: Response received', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('listAdminsApi: Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    console.log('listAdminsApi: Success response received', {
      dataCount: json.data?.length,
      pagination: json.pagination
    });
    return json;
  } catch (error) {
    console.log('listAdminsApi error:', error.message);
    throw error;
  }
};
