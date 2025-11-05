import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getBuddyRequestsApi = async () => {
  try {
    const token = await getStoredAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(API_ENDPOINTS.GET_BUDDY_REQUESTS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('getBuddyRequestsApi error:', error);
    throw error;
  }
};

