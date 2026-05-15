import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const scheduleLiveReminderApi = async ({ liveId, scheduledAt, title, sellerId }) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.SCHEDULE_LIVE_REMINDER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ liveId, scheduledAt, title, sellerId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('scheduleLiveReminderApi error:', error.message);
    throw error;
  }
};
