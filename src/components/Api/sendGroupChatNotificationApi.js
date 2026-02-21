import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const sendGroupChatNotificationApi = async (allParticipantIds, groupChatName) => {
  try {
    
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.SEND_GROUP_CHAT_NOTIFICATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({allParticipantIds, groupChatName}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('sendGroupChatNotificationApi error:', error.message);
    throw error;
  }
};