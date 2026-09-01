import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

const authHeaders = async (extra = {}) => {
  const token = await getStoredAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
};

const parseJson = (res) => res.json().catch(() => ({}));

/**
 * Wrap an ISO timestamp string into a Firestore-Timestamp-shaped object so the
 * live screens' `.seconds` / `.toDate()` calls keep working unchanged.
 */
const toFirestoreTimestamp = (value) => {
  if (value === null || value === undefined) return null;
  if (value && typeof value.toDate === 'function') return value; // already a Timestamp
  if (value && typeof value === 'object' && value.seconds !== undefined) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: (d.getTime() % 1000) * 1e6,
    toDate: () => new Date(d.getTime()),
  };
};

/**
 * Normalize a live stream row from the Edge Function into the shape the
 * screens consume (camelCase + Timestamp-shaped timestamps). Also used to
 * normalize Realtime postgres_changes payload rows (snake_case DB columns).
 */
export const normalizeLiveRow = (row) => ({
  id: row.id,
  title: row.title || 'Untitled Stream',
  coverPhotoUrl: row.coverPhotoUrl || row.coverphotourl || null,
  coverPhotoPath: row.coverPhotoPath || row.coverphotopath || null,
  sessionId: row.sessionId || row.sessionid || '',
  status: row.status,
  totalViewers: row.totalViewers || row.totalviewers || 0,
  viewerCount: row.viewerCount || row.viewercount || 0,
  viewers: row.viewers || 0,
  createdBy: row.createdBy || row.createdby || '',
  liveType: row.liveType || row.livetype || 'live',
  scheduledAt: toFirestoreTimestamp(row.scheduledAt ?? row.scheduledat),
  createdAt: toFirestoreTimestamp(row.createdAt ?? row.createdat),
  endedAt: toFirestoreTimestamp(row.endedAt ?? row.endedat),
  updatedAt: toFirestoreTimestamp(row.updatedAt ?? row.updatedat),
  duration: row.duration || 0,
  stickyNote: row.stickyNote || row.stickynote || null,
  likeCount: row.likeCount || row.likecount || 0,
  joiners: row.joiners || [],
  lovedByUids: row.lovedByUids || row.lovedbyuids || [],
});

/**
 * Get the live streams list.
 * @returns {Promise<{success: boolean, streams: Array, error: string|null}>}
 */
export const getLiveStreamsApi = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.GET_LIVE_STREAMS, {
      method: 'GET',
      headers: await authHeaders(),
    });
    if (!res.ok) {
      const err = await parseJson(res);
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const body = await parseJson(res);
    const streams = (body.streams || []).map(normalizeLiveRow);
    return { success: true, streams, data: body };
  } catch (error) {
    console.error('getLiveStreamsApi error:', error.message);
    return { success: false, streams: [], error: error.message };
  }
};

/**
 * Resolve seller display info for a batch of UIDs.
 * @param {string[]} uids
 * @returns {Promise<{success: boolean, sellers: Object, error: string|null}>}
 */
export const getLiveSellersApi = async (uids) => {
  try {
    const unique = [...new Set((uids || []).map((u) => String(u).trim()).filter(Boolean))];
    if (unique.length === 0) return { success: true, sellers: {}, error: null };
    const res = await fetch(API_ENDPOINTS.GET_LIVE_SELLERS, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ uids: unique }),
    });
    if (!res.ok) {
      const err = await parseJson(res);
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const body = await parseJson(res);
    return { success: true, sellers: body.sellers || {}, data: body };
  } catch (error) {
    console.error('getLiveSellersApi error:', error.message);
    return { success: false, sellers: {}, error: error.message };
  }
};

export default { getLiveStreamsApi, getLiveSellersApi };

/** Get a single live session (camelCase + Timestamp-shaped timestamps). */
export const getLiveDetailApi = async (sessionId) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_DETAIL, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'get', sessionId }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    const s = body.session || {};
    return {
      success: true,
      session: {
        ...s,
        scheduledAt: toFirestoreTimestamp(s.scheduledAt),
        createdAt: toFirestoreTimestamp(s.createdAt),
        endedAt: toFirestoreTimestamp(s.endedAt),
        updatedAt: toFirestoreTimestamp(s.updatedAt),
      },
    };
  } catch (error) {
    console.error('getLiveDetailApi error:', error.message);
    return { success: false, session: null, error: error.message };
  }
};

/** Update a live session's stickyNote (owner only). */
export const updateLiveStickyNoteApi = async (sessionId, stickyNote) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_DETAIL, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'sticky', sessionId, stickyNote }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, ...body };
  } catch (error) {
    console.error('updateLiveStickyNoteApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** Update a live session's coverPhotoUrl (owner only). */
export const updateLiveCoverApi = async (sessionId, coverPhotoUrl) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_DETAIL, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'cover', sessionId, coverPhotoUrl }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, ...body };
  } catch (error) {
    console.error('updateLiveCoverApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** List comments for a live session (asc by createdAt). */
export const getLiveCommentsApi = async (sessionId) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_COMMENTS, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'list', sessionId }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    const comments = (body.comments || []).map((c) => ({
      ...c,
      createdAt: toFirestoreTimestamp(c.createdAt),
      updatedAt: toFirestoreTimestamp(c.updatedAt),
    }));
    return { success: true, comments };
  } catch (error) {
    console.error('getLiveCommentsApi error:', error.message);
    return { success: false, comments: [], error: error.message };
  }
};

/** Add a comment to a live session. */
export const addLiveCommentApi = async ({ sessionId, message, name, avatar }) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_COMMENTS, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'add', sessionId, message, name, avatar }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, comment: body.comment };
  } catch (error) {
    console.error('addLiveCommentApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** Edit a comment (owner only). */
export const updateLiveCommentApi = async ({ sessionId, commentId, message }) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_COMMENTS, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'update', sessionId, commentId, message }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, ...body };
  } catch (error) {
    console.error('updateLiveCommentApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** Delete a comment (owner only). */
export const deleteLiveCommentApi = async ({ sessionId, commentId }) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_COMMENTS, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode: 'delete', sessionId, commentId }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, ...body };
  } catch (error) {
    console.error('deleteLiveCommentApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** Find the buyer who placed a Ready to Fly order on a listing. */
export const getLiveSoldToApi = async (listingId) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_SOLD_TO, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ listingId }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, soldToUser: body.soldToUser || null };
  } catch (error) {
    console.error('getLiveSoldToApi error:', error.message);
    return { success: false, soldToUser: null, error: error.message };
  }
};

/** Send a heartbeat for a live session (seller keeps it visible as live). */
export const sendLiveHeartbeatApi = async (sessionId) => {
  try {
    const res = await fetch(API_ENDPOINTS.LIVE_HEARTBEAT, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ sessionId }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, ...body };
  } catch (error) {
    console.error('sendLiveHeartbeatApi error:', error.message);
    return { success: false, error: error.message };
  }
};
