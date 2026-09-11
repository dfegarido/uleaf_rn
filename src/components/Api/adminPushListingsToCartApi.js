import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Admin: push listings into a buyer's cart.
 * @param {{ buyerUid: string, items: Array<{ plantCode: string, potSize?: string, quantity?: number }> }} payload
 */
export const adminPushListingsToCartApi = async (payload) => {
  const token = await getStoredAuthToken();
  if (!token) {
    return { success: false, error: 'Authentication required' };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = setTimeout(() => controller?.abort?.(), 45000);

  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_PUSH_LISTINGS_TO_CART, {
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
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
        results: data.results || [],
        added: data.added || 0,
        failed: data.failed || 0,
      };
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' };
    }
    return { success: false, error: error.message || 'Could not add to cart' };
  } finally {
    clearTimeout(timeoutId);
  }
};
