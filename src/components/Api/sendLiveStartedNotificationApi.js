import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const sendLiveStartedNotificationApi = async ({ liveId, title, sellerId }) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.SEND_LIVE_STARTED_NOTIFICATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ liveId, title, sellerId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('sendLiveStartedNotificationApi error:', error.message);
    throw error;
  }
};
