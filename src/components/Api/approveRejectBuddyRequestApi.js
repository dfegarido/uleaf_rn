import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const approveRejectBuddyRequestApi = async (requestId, action) => {
  try {
    if (!requestId || !action) {
      throw new Error('Request ID and action are required');
    }

    if (action !== 'approve' && action !== 'reject') {
      throw new Error('Action must be either "approve" or "reject"');
    }

    const token = await getStoredAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(API_ENDPOINTS.APPROVE_REJECT_BUDDY_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId, action }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('approveRejectBuddyRequestApi error:', error);
    throw error;
  }
};

