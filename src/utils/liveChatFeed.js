/**
 * The live chat feed = messages and "joined" notices in ONE list.
 *
 * The join notice used to render as a separate block pinned above the message list (its own
 * state, its own row, its own expand/collapse). That put it OUT of the chronological order: a
 * viewer joining after the last message still drew at the top of the panel. Interleaving the
 * two by timestamp is what a chat is supposed to do, and it removes the duplicate state.
 *
 * `live.joiners[]` entries carry `joinedAt` (an ISO string, written by
 * `addViewerToLiveSession`), whereas comments carry a Firestore-shaped `createdAt`
 * (`{seconds}`). Both are normalised to seconds so one sort orders the whole feed.
 *
 * Join notices are given an id of their own (`join_<uid>`) so a shared FlatList can key them
 * alongside the message ids the server assigns.
 */

const toSeconds = (value) => {
  if (!value) return 0;
  if (typeof value === 'object' && value.seconds !== undefined) return value.seconds;
  const ms = new Date(value).getTime();
  return isNaN(ms) ? 0 : ms / 1000;
};

/**
 * `live.joiners[]` is APPEND-ONLY per join event: `addViewerToLiveSession` pushes a new entry
 * every time a viewer enters, while `removeViewerFromLiveSession` only clears `viewers` — it
 * never removes from `joiners`. So one viewer who leaves and rejoins N times owns N identical
 * notices (measured: 8 entries for a single uid in one session). Collapse them to the EARLIEST
 * join per uid, which is also what the previous `uniqueJoinedUsers` Map kept, so the notice
 * neither repeats nor slides down the list as the same viewer comes back.
 */
const uniqueJoinersByUid = (joiners) => {
  const earliest = new Map();
  (joiners || []).forEach((joiner) => {
    if (!joiner || !joiner.uid) return;
    const sortSeconds = toSeconds(joiner.joinedAt);
    const seen = earliest.get(joiner.uid);
    if (!seen || sortSeconds < seen.sortSeconds) {
      earliest.set(joiner.uid, {
        id: `join_${joiner.uid}`,
        uid: joiner.uid,
        name: joiner.displayName || '',
        avatar: joiner.photoURL || '',
        message: '👋 joined',
        isJoin: true,
        sortSeconds,
      });
    }
  });
  return [...earliest.values()];
};

export const buildLiveChatFeed = (comments = [], joiners = []) => {
  const messages = (comments || []).map((comment) => ({
    ...comment,
    isJoin: false,
    sortSeconds: toSeconds(comment?.createdAt),
  }));

  return [...messages, ...uniqueJoinersByUid(joiners)].sort(
    (a, b) => a.sortSeconds - b.sortSeconds,
  );
};

export default { buildLiveChatFeed };
