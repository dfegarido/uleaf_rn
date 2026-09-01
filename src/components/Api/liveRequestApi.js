import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/** Admin list of live requests (Supabase). */
export const getLiveRequestsAdminApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.GET_LIVE_REQUESTS_ADMIN, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Get live requests admin API error:', error);
    return { success: false, error: error.message };
  }
};

/** Admin edit of a live request (Supabase). */
export const updateLiveRequestApi = async (data) => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.UPDATE_LIVE_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Update live request API error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a live stream request
 * @param {Object} data - Request data
 * @param {string} data.title - Live session title
 * @param {string} data.liveType - 'live' or 'purge'
 * @param {string} data.requestedDate - ISO date string
 * @param {string} data.description - Optional reason/description
 * @returns {Promise<Object>} Create response
 */
export const createLiveRequestApi = async (data) => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.CREATE_LIVE_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Create live request API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating live request',
    };
  }
};

/**
 * Get live requests for seller (own) or admin (all)
 * @param {Object} params - Query params
 * @param {string} params.status - Filter by status
 * @param {string} params.sellerUid - Filter by seller
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @param {number} params.limit - Pagination limit
 * @param {number} params.offset - Pagination offset
 * @returns {Promise<Object>} Get response
 */
export const getLiveRequestsApi = async (params = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(`${API_ENDPOINTS.GET_LIVE_REQUESTS}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get live requests API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching live requests',
    };
  }
};

/**
 * Update live request status (approve/reject) - Admin only
 * @param {Object} data - Update data
 * @param {string} data.requestId - Request ID
 * @param {string} data.status - 'approved' or 'rejected'
 * @param {string} data.rejectionReason - Required when rejecting
 * @returns {Promise<Object>} Update response
 */
export const updateLiveRequestStatusApi = async (data) => {
  try {
    if (!data || !data.requestId || !data.status) {
      throw new Error('requestId and status are required');
    }

    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.UPDATE_LIVE_REQUEST_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Update live request status API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating live request status',
    };
  }
};

/** Delete a live session the seller owns (Supabase live-delete). */
export const deleteLiveSessionApi = async (sessionId) => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.LIVE_DELETE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('deleteLiveSessionApi error:', error);
    return { success: false, error: error.message };
  }
};

/** Seller write to liveRequests (create/update/delete) via Supabase live-request-write. */
export const liveRequestWriteApi = async ({ mode, requestId, ...rest }) => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.LIVE_REQUEST_WRITE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ mode, requestId, ...rest }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('liveRequestWriteApi error:', error);
    return { success: false, error: error.message };
  }
};

/** Wrap an ISO timestamp into a Firestore-Timestamp-shaped object. */
const toFirestoreTimestamp = (value) => {
  if (value == null) return null;
  if (value && typeof value.toDate === 'function') return value;
  if (value && typeof value === 'object' && value.seconds !== undefined) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: (d.getTime() % 1000) * 1e6,
    toDate: () => new Date(d.getTime()),
  };
};

/** Get the seller's own live sessions + live requests (Supabase my-live-sessions). */
export const getMyLiveSessionsApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.MY_LIVE_SESSIONS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }
    // Wrap timestamps for the screen's .seconds call sites.
    const wrap = (r) => ({
      ...r,
      createdAt: toFirestoreTimestamp(r.createdAt),
      updatedAt: toFirestoreTimestamp(r.updatedAt),
      endedAt: toFirestoreTimestamp(r.endedAt),
      scheduledAt: toFirestoreTimestamp(r.scheduledAt),
      requestedAt: toFirestoreTimestamp(r.requestedAt),
      requestedDate: toFirestoreTimestamp(r.requestedDate),
    });
    return {
      success: true,
      sessions: (data.sessions || []).map(wrap),
      pendingRequests: (data.pendingRequests || []).map(wrap),
    };
  } catch (error) {
    console.error('getMyLiveSessionsApi error:', error);
    return { success: false, sessions: [], pendingRequests: [], error: error.message };
  }
};
