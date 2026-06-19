import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const sendEveryoneMentionNotificationApi = async ({
  chatId,
  senderId,
  senderName,
  groupChatName,
  messageText,
}) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.SEND_EVERYONE_MENTION_NOTIFICATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        chatId,
        senderId,
        senderName,
        groupChatName,
        messageText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('sendEveryoneMentionNotificationApi error:', error.message);
    throw error;
  }
};
