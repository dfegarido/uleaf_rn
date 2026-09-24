import {API_ENDPOINTS} from '../../config/apiConfig';
import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Generic user search — `search-user` WITHOUT a `userType` filter.
 *
 * `search-user` resolves the caller's own role from the admin/supplier/buyer
 * tables and then enforces the matching cohort itself (buyer -> buyers,
 * supplier -> suppliers, admin -> everyone). Omitting `userType` therefore
 * yields exactly the people the caller is allowed to see, in one place.
 *
 * Do NOT pass `userType=buyer` from a screen that a supplier can also reach:
 * the edge function answers that with 403 "Suppliers can only search for other
 * suppliers", which is correct server behaviour.
 *
 * Name fields are kept intact (unlike `searchBuyersApi`, which trims to a
 * buyer-shaped subset) because suppliers are named by `gardenOrCompanyName`.
 *
 * @param {Object} params
 *   query      — search text (>=2 chars switches to search mode)
 *   limit      — page size (default 20)
 *   offset     — pagination offset
 *   role       — explicit cohort hint: 'buyer' | 'supplier' | 'admin'. Needed
 *                because an account can exist in more than one table; without
 *                it the server resolves precedence (admin > supplier > buyer)
 *                and a buyer-shell account holding a stale supplier row is
 *                served seller results.
 * @returns {Promise<{success: boolean, data?: {users: Array, totalCount: number}}>}
 */
export const searchUsersApi = async ({
  query = '',
  limit = 20,
  offset = 0,
  role = '',
  uids = null,
} = {}) => {
  const token = await getStoredAuthToken();

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const trimmed = String(query || '').trim();
  if (trimmed.length >= 2) {
    params.append('query', trimmed);
  }
  if (role) {
    params.append('role', role);
  }
  // Resolve a known set of ids (e.g. chat partners) through the server's cohort
  // rules, instead of trusting a client-side role guess.
  if (Array.isArray(uids) && uids.length > 0) {
    params.append('uids', uids.slice(0, 200).join(','));
  }

  const response = await fetch(`${API_ENDPOINTS.SEARCH_USER}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Search failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data?.error || 'Search failed');
  }

  const users = (data.results || []).map((user) => ({
    id: user.id,
    uid: user.id,
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    gardenOrCompanyName: user.gardenOrCompanyName || '',
    businessName: user.businessName || '',
    companyName: user.companyName || '',
    profileImage: user.profileImage || '',
    userType: user.userType || '',
    createdAt: user.createdAt || null,
  }));

  return {
    success: true,
    data: {
      users,
      totalCount: data.totalCount || users.length,
    },
  };
};
