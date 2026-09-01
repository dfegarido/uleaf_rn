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

/** Parse JSON body safely; fall back to {}. */
const parseJson = (res) => res.json().catch(() => ({}));

/** Normalize an Edge Function response envelope into { success, data, error }. */
const normalize = (body) => {
  if (body && body.success === true) {
    return { success: true, data: body, error: null };
  }
  return {
    success: false,
    data: null,
    error: body?.error || body?.message || 'Request failed',
  };
};

/**
 * Get paginated messages for a chat.
 * @param {string} chatId
 * @param {Object} opts { limit, before, after, around }
 */
export const getChatMessagesApi = async (chatId, opts = {}) => {
  try {
    const params = new URLSearchParams({ chatId });
    if (opts.limit) params.append('limit', opts.limit);
    if (opts.before) params.append('before', opts.before);
    if (opts.after) params.append('after', opts.after);
    if (opts.around) params.append('around', opts.around);
    const res = await fetch(`${API_ENDPOINTS.GET_CHAT_MESSAGES}?${params.toString()}`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    if (!res.ok) {
      const err = await parseJson(res);
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const body = await parseJson(res);
    return {
      success: true,
      messages: body.messages || [],
      hasOlder: body.hasOlder || false,
      hasNewer: body.hasNewer || false,
      data: body,
    };
  } catch (error) {
    console.error('getChatMessagesApi error:', error.message);
    return { success: false, messages: [], hasOlder: false, hasNewer: false, error: error.message };
  }
};

/**
 * Send a new message.
 * @param {Object} msg { chatId, text, imageUrl, imageUrls, videoUrl, clientId, mentions, replyTo, isListing, listingId }
 */
export const sendChatMessageApi = async (msg) => {
  try {
    const res = await fetch(API_ENDPOINTS.POST_CHAT_MESSAGE, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(msg),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return normalize(body);
  } catch (error) {
    console.error('sendChatMessageApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update a message (edit text/history or add reactions).
 * @param {Object} msg { id, text?, reactions?, editHistory? }
 */
export const updateChatMessageApi = async (msg) => {
  try {
    const res = await fetch(API_ENDPOINTS.PUT_CHAT_MESSAGE, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(msg),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return normalize(body);
  } catch (error) {
    console.error('updateChatMessageApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** Soft-delete a message. */
export const deleteChatMessageApi = async (messageId) => {
  try {
    const res = await fetch(`${API_ENDPOINTS.DELETE_CHAT_MESSAGE}?id=${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return normalize(body);
  } catch (error) {
    console.error('deleteChatMessageApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get membership metadata for a chat.
 * @returns {Promise<{success, isPublic, isMember, hasPendingRequest, hasRejectedRequest, participants}>}
 */
export const getChatMembershipApi = async (chatId) => {
  try {
    const res = await fetch(`${API_ENDPOINTS.GET_CHAT_MEMBERSHIP}?chatId=${encodeURIComponent(chatId)}`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return {
      success: true,
      isPublic: body.isPublic,
      isMember: body.isMember,
      hasPendingRequest: body.hasPendingRequest,
      hasRejectedRequest: body.hasRejectedRequest,
      participants: body.participants || [],
      data: body,
    };
  } catch (error) {
    console.error('getChatMembershipApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/** Submit a join request for a public group chat. */
export const submitChatJoinRequestApi = async ({ chatId, userName, userAvatar }) => {
  try {
    const res = await fetch(API_ENDPOINTS.POST_CHAT_JOIN_REQUEST, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ chatId, userName, userAvatar }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return normalize(body);
  } catch (error) {
    console.error('submitChatJoinRequestApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Resolve participant names/avatars for a chat.
 * @returns {Promise<{success, participants: {uid:{name,avatarUrl}}}}>
 */
export const getChatParticipantsApi = async (chatId) => {
  try {
    const res = await fetch(`${API_ENDPOINTS.GET_CHAT_PARTICIPANTS}?chatId=${encodeURIComponent(chatId)}`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, participants: body.participants || {}, data: body };
  } catch (error) {
    console.error('getChatParticipantsApi error:', error.message);
    return { success: false, participants: {}, error: error.message };
  }
};

/**
 * Resolve name + avatarUrl for a batch of UIDs (buyer/supplier/admin).
 * Uses POST with a JSON body to avoid URL-length limits when the Rooms tab sends
 * hundreds of group participant UIDs (React Native fetch can fail on very long
 * GET query strings). Chunks into batches of 500 to respect the Edge cap.
 * @param {string[]} uids
 * @returns {Promise<{success, participants: {uid:{name,avatarUrl}}}}>
 */
const BATCH_CHUNK_SIZE = 500;
export const getChatParticipantsBatchApi = async (uids) => {
  try {
    const unique = Array.from(new Set((uids || []).filter(Boolean)));
    if (unique.length === 0) return { success: true, participants: {} };

    const participants = {};
    for (let i = 0; i < unique.length; i += BATCH_CHUNK_SIZE) {
      const chunk = unique.slice(i, i + BATCH_CHUNK_SIZE);
      const res = await fetch(API_ENDPOINTS.GET_CHAT_PARTICIPANTS_BATCH, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ uids: chunk }),
      });
      const body = await parseJson(res);
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      Object.assign(participants, body.participants || {});
    }
    return { success: true, participants, data: { participants } };
  } catch (error) {
    console.error('getChatParticipantsBatchApi error:', error.message);
    return { success: false, participants: {}, error: error.message };
  }
};

/**
 * Normalize a chat row from the Edge Function into the Firestore-compatible shape
 * the MessagesScreen already consumes (Firestore Timestamp-like objects with
 * .seconds / .toDate()). The Edge returns `timestamp` as an ISO string; the screen
 * calls `chat.timestamp?.toDate?.()` / `.seconds` everywhere, so we wrap it.
 */
const toFirestoreTimestamp = (value) => {
  if (value === null || value === undefined) return null;
  if (value && typeof value.toDate === 'function') return value; // already a Timestamp
  if (value && typeof value === 'object' && value.seconds !== undefined) return value; // already Timestamp-like
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: (d.getTime() % 1000) * 1e6,
    toDate: () => new Date(d.getTime()),
  };
};

const normalizeChatRow = (chat) => {
  if (!chat) return chat;
  return {
    ...chat,
    timestamp: toFirestoreTimestamp(chat.timestamp),
    createdAt: toFirestoreTimestamp(chat.createdAt),
    updatedAt: toFirestoreTimestamp(chat.updatedAt),
  };
};

/**
 * Get the chat list for the current user.
 * @returns {Promise<{success, memberChats, adminGroupChats, publicGroupChats}>}
 */
export const getChatsApi = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.GET_CHATS, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return {
      success: true,
      memberChats: (body.memberChats || []).map(normalizeChatRow),
      adminGroupChats: (body.adminGroupChats || []).map(normalizeChatRow),
      publicGroupChats: (body.publicGroupChats || []).map(normalizeChatRow),
      data: body,
    };
  } catch (error) {
    console.error('getChatsApi error:', error.message);
    return { success: false, memberChats: [], adminGroupChats: [], publicGroupChats: [], error: error.message };
  }
};

/** Get a short-lived Supabase Realtime JWT from the Firebase token. */
export const getChatRealtimeTokenApi = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.GET_CHAT_REALTIME_TOKEN, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, token: body.token, expiresAt: body.expiresAt, data: body };
  } catch (error) {
    console.error('getChatRealtimeTokenApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Chat management operations backed by Supabase.
 * @param {Object} opts { mode: 'delete'|'leave'|'remove-member', chatId, memberUid? }
 */
export const chatDeleteApi = async ({ mode, chatId, memberUid }) => {
  try {
    const res = await fetch(API_ENDPOINTS.POST_CHAT_DELETE, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ mode, chatId, memberUid }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return normalize(body);
  } catch (error) {
    console.error('chatDeleteApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Find an existing private chat between the current user and another user.
 * Replaces the Firestore getDocs(query(collection(db,'chats'), ...)) lookup.
 * @param {string} otherUid
 * @returns {Promise<{success, chat: Object|null, error?}>}
 */
export const findPrivateChatApi = async (otherUid) => {
  try {
    const res = await fetch(`${API_ENDPOINTS.GET_CHAT_FIND_PRIVATE}?otherUid=${encodeURIComponent(otherUid)}`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { success: true, chat: body.chat || null, data: body };
  } catch (error) {
    console.error('findPrivateChatApi error:', error.message);
    return { success: false, chat: null, error: error.message };
  }
};

/**
 * Mark a chat as read for the current user (removes them from unreadby).
 * Replaces the Firestore updateDoc(doc(db,'chats',id), {unreadBy: arrayRemove(uid)}).
 * @param {string} chatId
 * @returns {Promise<{success, error?}>}
 */
export const markChatReadApi = async (chatId) => {
  try {
    const res = await fetch(API_ENDPOINTS.POST_CHAT_MARK_READ, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ chatId }),
    });
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return normalize(body);
  } catch (error) {
    console.error('markChatReadApi error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 /** Create a new private or group chat in Supabase (closes the create-chat gap:
  * the old Firestore-only addDoc produced chats that Supabase message reads
  * rejected with "Not a participant of this chat").
  * @param {Object} opts { id?, participantIds, participants, name?, avatarUrl?, type?, isPublic?, lastMessage? }
  * @returns {Promise<{success, chat: {id, ...}}>}
  */
 export const chatCreateApi = async ({ id, participantIds, participants, name, avatarUrl, type, isPublic, lastMessage }) => {
   try {
     const res = await fetch(API_ENDPOINTS.POST_CHAT_CREATE, {
       method: 'POST',
       headers: await authHeaders(),
       body: JSON.stringify({ id, participantIds, participants, name, avatarUrl, type, isPublic, lastMessage }),
     });
     const body = await parseJson(res);
     if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
     return normalize(body);
   } catch (error) {
     console.error('chatCreateApi error:', error.message);
     return { success: false, error: error.message };
   }
 };

 /**
  * Group-admin chat operations backed by Supabase.
  * @param {Object} opts { mode: 'add-participant'|'toggle-public'|'approve-join'|'reject-join'|'remove-invited'|'rename', chatId, participant?, isPublic?, requestId?, userId?, name? }
  */
 export const chatUpdateApi = async (opts) => {
   try {
     const res = await fetch(API_ENDPOINTS.POST_CHAT_UPDATE, {
       method: 'POST',
       headers: await authHeaders(),
       body: JSON.stringify(opts),
     });
     const body = await parseJson(res);
     if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
     return normalize(body);
   } catch (error) {
     console.error('chatUpdateApi error:', error.message);
     return { success: false, error: error.message };
   }
 };
