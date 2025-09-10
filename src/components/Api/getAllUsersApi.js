import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getAllUsersApi = async (filters = {}) => {
  try {
    console.log("Fetching all users...");
    const token = await getStoredAuthToken();
    console.log({ token });
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
    
    if (filters.sortBy) {
      queryParams.append('sortBy', filters.sortBy);
    }
    
    if (filters.sortDir) {
      queryParams.append('sortDir', filters.sortDir);
    }

    const url = `${API_ENDPOINTS.GET_ALL_USERS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getAllUsersApi error:', error.message);
    throw error;
  }
};
