/**
 * Contact sourcing for the plant-detail share sheet.
 *
 * Two sources are merged, in this order:
 *   1. Chat contacts — the other participant of each private chat the current
 *      user is in, newest chat first (the chat list already arrives sorted by
 *      `timestamp desc`).
 *   2. App users — from `search-user` in list mode, already newest-first.
 *
 * Deduped by uid, never includes the current user, capped at `limit`.
 *
 * Pure: no network, no React. The shape of each source is deliberately
 * tolerated (missing fields, JSON-string `participantIds`, malformed rows)
 * because it comes from an edge function and a jsonb column.
 */

/** Parse a value that may be a real array, a JSON string, or absent. */
const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const asUid = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

/**
 * A group chat as a share target.
 *
 * Groups are shareable too (a seller wants to drop a listing into a buying
 * group), but they are not a *person*: they have no "other participant", so
 * `getOtherParticipant` deliberately ignores them. They key off the chat id and
 * carry the raw row so the caller can navigate straight into the conversation
 * without re-fetching it.
 *
 * `groupAvatars` holds up to two member photo URLs so the sheet can render the
 * group with the same two-joint-avatar treatment the chat list uses (a group
 * carries no avatar of its own — `avatarUrl` is empty for groups in practice).
 *
 * @param {Object} chat a camelCase chat row
 * @returns {{uid, name, avatarUrl, groupAvatars, isGroup: true, chatId, chat} | null}
 */
export const groupChatToContact = (chat) => {
  if (!chat || typeof chat !== 'object') {
    return null;
  }
  if (String(chat.type || '').toLowerCase() !== 'group') {
    return null;
  }
  const chatId = asUid(chat.id);
  if (!chatId) {
    return null;
  }
  const participantIds = asArray(chat.participantIds).map(asUid).filter(Boolean);

  // Two member photos, in row order. Participants arrive as objects with a
  // `name`/`avatarUrl`, but the column has held junk (numeric ids) before, so
  // only http(s) strings are accepted — the renderer falls back to the default
  // avatar for a missing slot, exactly like the chat list does.
  const isUsableUrl = (url) => typeof url === 'string' && url.trim().startsWith('http');
  const groupAvatars = asArray(chat.participants)
    .map((p) => (p && typeof p === 'object' ? p.avatarUrl : ''))
    .filter(isUsableUrl)
    .map((url) => String(url).trim())
    .slice(0, 2);

  return {
    // Keyed by chat id — a group is identified by the conversation, not a user.
    uid: chatId,
    name: String(chat.name || '').trim(),
    avatarUrl: String(chat.avatarUrl || '').trim(),
    groupAvatars,
    isGroup: true,
    chatId,
    participantIds,
    chat,
  };
};

/**
 * The other participant of a private chat, or null.
 *
 * Group chats are skipped here — use `groupChatToContact` for those. A chat
 * whose `participantIds` holds anything other than exactly two uids (including
 * the current user) is treated as unusable rather than guessed at.
 *
 * @param {Object} chat a camelCase chat row (participantIds, participants, …)
 * @param {string} currentUid
 * @returns {{uid: string, name: string, avatarUrl: string} | null}
 */
export const getOtherParticipant = (chat, currentUid) => {
  if (!chat || typeof chat !== 'object') {
    return null;
  }
  if (String(chat.type || '').toLowerCase() === 'group') {
    return null;
  }

  const me = asUid(currentUid);
  const participantIds = asArray(chat.participantIds).map(asUid).filter(Boolean);
  if (!me || participantIds.length !== 2 || !participantIds.includes(me)) {
    return null;
  }

  const otherUid = participantIds.find((uid) => uid !== me);
  if (!otherUid) {
    return null;
  }

  const profile = asArray(chat.participants).find(
    (p) => p && asUid(p.uid) === otherUid,
  );

  return {
    uid: otherUid,
    name: String(profile?.name || '').trim(),
    avatarUrl: String(profile?.avatarUrl || '').trim(),
  };
};

const nameFromAppUser = (user) =>
  String(
    user?.username ||
      user?.gardenOrCompanyName ||
      user?.businessName ||
      user?.companyName ||
      user?.name ||
      '',
  ).trim();

/**
 * Normalize a `search-user` result row into a share-sheet contact.
 *
 * Single source of truth for how an app user is named/thumbnailed — the
 * recommended strip and the search results both use it, so the same person
 * cannot render under two different names.
 *
 * @param {Object} user a row from search-user / searchBuyersApi
 * @returns {{uid: string, name: string, avatarUrl: string, source: 'app'}}
 */
export const appUserToContact = (user) => ({
  uid: asUid(user?.uid || user?.id),
  name: nameFromAppUser(user),
  avatarUrl: String(user?.profileImage || user?.avatarUrl || '').trim(),
  source: 'app',
});

/**
 * Merge the two sources into the sheet's contact list.
 *
 * Chat contacts keep their chat order; app users follow, newest first. A uid
 * present in both keeps the chat version (it carries the fresher avatar) but
 * fills any blank field from the app-user record.
 *
 * @param {Object} opts
 * @param {Array}  opts.memberChats camelCase chat rows from getChatsApi()
 * @param {Array}  opts.recentUsers app users from search-user list mode
 * @param {string} opts.currentUid
 * @param {number} [opts.limit=12]
 * @returns {Array<{uid: string, name: string, avatarUrl: string, source: 'chat'|'app'}>}
 */
export const buildRecommendedContacts = ({
  memberChats = [],
  recentUsers = [],
  currentUid,
  limit = 12,
} = {}) => {
  const me = asUid(currentUid);
  if (!me || !Number.isFinite(limit) || limit <= 0) {
    return [];
  }

  const byUid = new Map();

  const add = ({
    uid,
    name,
    avatarUrl,
    source,
    isGroup,
    groupAvatars,
    chatId,
    participantIds,
    chat,
  }) => {
    const id = asUid(uid);
    if (!id || id === me) {
      return;
    }

    const existing = byUid.get(id);
    if (!existing) {
      byUid.set(id, {
        uid: id,
        name: String(name || '').trim(),
        avatarUrl: String(avatarUrl || '').trim(),
        source,
        ...(isGroup
          ? {isGroup: true, groupAvatars: groupAvatars || [], chatId, participantIds, chat}
          : {}),
      });
      return;
    }

    // Seen in both sources: the chat entry owns identity, the app entry fills gaps.
    existing.name = existing.name || String(name || '').trim();
    existing.avatarUrl = existing.avatarUrl || String(avatarUrl || '').trim();
  };

  // Groups and people in chat order: both come from `memberChats` (newest
  // first), and a group is surfaced as its own target ahead of the app-user
  // list appended after it.
  memberChats.forEach((chat) => {
    const group = groupChatToContact(chat);
    if (group) {
      add({...group, source: 'chat'});
      return;
    }
    const other = getOtherParticipant(chat, me);
    if (other) {
      add({...other, source: 'chat'});
    }
  });

  recentUsers.forEach((user) => {
    const contact = appUserToContact(user);
    add(contact);
  });

  return Array.from(byUid.values()).slice(0, limit);
};
