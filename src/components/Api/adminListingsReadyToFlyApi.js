import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Admin: check out listings for a buyer who paid by Venmo / Zelle, straight to Ready to Fly.
 * `action: 'preview'` prices the order; `action: 'migrate'` creates it.
 * @param {{
 *   action: 'preview' | 'migrate',
 *   buyerUid: string,
 *   items: Array<{ plantCode: string, potSize?: string, quantity?: number }>,
 *   upsNextDay?: boolean,
 *   discountCode?: string,
 *   useLeafPoints?: boolean, usePlantCredits?: boolean, useShippingCredits?: boolean,
 *   paymentMethod?: 'VENMO' | 'ZELLE',
 *   expectedTotal?: number,
 * }} payload
 */
export const adminListingsReadyToFlyApi = async (payload) => {
  const token = await getStoredAuthToken();
  if (!token) {
    return { success: false, error: 'Authentication required' };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = setTimeout(() => controller?.abort?.(), 60000);

  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_LISTINGS_READY_TO_FLY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      return { ...data, success: false, status: response.status, error: data.error || `HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' };
    }
    return { success: false, error: error.message || 'Request failed' };
  } finally {
    clearTimeout(timeoutId);
  }
};
