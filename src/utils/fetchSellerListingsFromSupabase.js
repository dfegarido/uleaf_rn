import {getStoredAuthToken} from './getStoredAuthToken';
import { API_ENDPOINTS } from '../config/apiConfig';

// Re-export the shared listing helpers from the Firestore util so callers that
// switch to the Supabase fetch keep the same filter/sort/price helpers.
export {
  getListingPriceInfo,
  getListingTypeDisplayLabel,
  isListingPinned,
  listingMatchesGenusFilter,
  prepareMyStoreActiveListings,
  prepareSellerChannelTabListings,
} from './fetchSellerListingsFromFirestore';

/**
 * Fetch all listings for the current seller from Supabase via the
 * `search-listing` edge function (filterMine=true). Replaces the direct
 * Firestore read in fetchSellerListingsFromFirestore for the My Store screen.
 *
 * The edge fn returns camelCase listings with formatted dates, variations,
 * and discount pricing — matching the shape the My Store screen consumes.
 *
 * @param {string} uid - seller uid (sellerCode)
 * @param {{ maxFetch?: number }} options
 * @returns {Promise<{ listings: Array }>}
 */
export async function fetchSellerListingsFromSupabase(uid, { maxFetch = 500 } = {}) {
  if (!uid) return { listings: [] };

  const token = await getStoredAuthToken();
  const params = new URLSearchParams({
    filterMine: 'true',
    limit: String(maxFetch),
  });

  const response = await fetch(
    `${API_ENDPOINTS.SEARCH_LISTING}?${params.toString()}`,
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
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load listings.');
  }

  return { listings: json.listings || [] };
}
