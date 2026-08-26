import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

const request = async (url, options = {}) => {
  const token = await getStoredAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
};

/** Open-or-create a private admin<->buyer chat for a flight date (dedupes). */
export const openFlightDateChatApi = async ({ flightDate, buyerUid, buyerName, buyerAvatar }) => {
  try {
    const data = await request(API_ENDPOINTS.FLIGHT_DATE_ORDERS, {
      method: 'POST',
      body: JSON.stringify({ flightDate, buyerUid, buyerName, buyerAvatar }),
    });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
