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

/**
 * Read the cached buyer profile (if any) without hitting the network.
 * Used to seed the profile screen instantly on mount so it doesn't flash a
 * skeleton when the data is already cached.
 *
 * Normalizes lowercase PostgREST keys (e.g. profileimage, profilephotourl)
 * to camelCase so callers can rely on camelCase regardless of when the cache
 * was written.
 * @returns {Promise<Object|null>} Cached profile, or null if none/fresh.
 */
export const getCachedBuyerProfile = async () => {
  try {
    const token = await getStoredAuthToken();
    if (!token) return null;
    const userKey = getBuyerUidFromToken(token);
    const cached = await getCachedResponse(CACHE_ENDPOINT, '', userKey);
    if (!cached) return null;
    // Map known lowercase profile keys to camelCase.
    const lowerToCamel = {
      profileimage: 'profileImage',
      profilephotourl: 'profilePhotoUrl',
      profilephotopath: 'profilePhotoPath',
      profilephotoupdatedat: 'profilePhotoUpdatedAt',
      firstname: 'firstName',
      lastname: 'lastName',
      username: 'username',
      email: 'email',
    };
    const normalized = { ...cached };
    for (const [lower, camel] of Object.entries(lowerToCamel)) {
      if (normalized[lower] !== undefined && normalized[camel] === undefined) {
        normalized[camel] = normalized[lower];
      }
    }
    return normalized;
  } catch (e) {
    return null;
  }
};
