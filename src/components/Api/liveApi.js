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
