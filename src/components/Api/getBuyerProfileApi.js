import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {getCachedResponse, setCachedResponse} from '../../utils/apiResponseCache';
import {API_ENDPOINTS} from '../../config/apiConfig';
import {jwtDecode} from 'jwt-decode';

// How long a cached buyer profile is considered fresh. Buyer credits/points
// can change (referral rewards, purchases), so keep this short enough to
// avoid stale balances while still skipping the network call on quick
// re-entry (e.g. tab switches / navigating back).
const BUYER_PROFILE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const CACHE_ENDPOINT = 'GET_BUYER_PROFILE';

const getBuyerUidFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded?.uid || decoded?.user_id || decoded?.sub || 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

export const getBuyerProfileApi = async (forceRefresh = false) => {
  try {
    const token = await getStoredAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const userKey = getBuyerUidFromToken(token);

    // Return cached profile when fresh and a refresh wasn't explicitly forced.
    if (!forceRefresh) {
      const cached = await getCachedResponse(CACHE_ENDPOINT, '', userKey);
      if (cached) {
        return cached;
      }
    }

    const response = await fetch(
      API_ENDPOINTS.GET_BUYER_PROFILE,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    await setCachedResponse(CACHE_ENDPOINT, '', userKey, json, BUYER_PROFILE_CACHE_TTL_MS);
    return json;
  } catch (error) {
    console.log('getBuyerProfileApi error:', error.message);
    throw error;
  }
};
