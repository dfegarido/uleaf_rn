import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Submit a receiver request
 * @param {string} receiverUsername - The username of the receiver (with or without @)
 * @param {string} receiverId - Optional: The user ID of the receiver (more reliable)
 * @returns {Promise<Object>} Response from the API
 */
export const submitReceiverRequestApi = async (receiverUsername, receiverId = null) => {
  try {
    if (!receiverUsername && !receiverId) {
      throw new Error('Receiver username or ID is required');
    }

    const token = await getStoredAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const requestBody = {};
    if (receiverUsername) {
      requestBody.receiverUsername = receiverUsername.trim();
    }
    if (receiverId) {
      requestBody.receiverId = receiverId;
    }

    const response = await fetch(API_ENDPOINTS.SUBMIT_RECEIVER_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to submit receiver request');
    }

    if (!data.success) {
      throw new Error(data.message || data.error || 'Failed to submit receiver request');
    }

    return data;
  } catch (error) {
    console.error('submitReceiverRequestApi error:', error);
    throw error;
  }
};

