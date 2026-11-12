import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

const request = async (options = {}) => {
  const token = await getStoredAuthToken();
  const res = await fetch(API_ENDPOINTS.TERMS_OF_PURCHASE, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
};

/** @returns {Promise<{success: boolean, imageUrl?: string|null, text?: string, error?: string}>} */
export const getTermsOfPurchaseApi = async () => {
  try {
    const data = await request();
    return { success: true, imageUrl: data.imageUrl || null, text: data.text || '' };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const saveTermsOfPurchaseApi = async ({ imageUrl, text }) => {
  try {
    const data = await request({ method: 'PUT', body: JSON.stringify({ imageUrl, text }) });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
