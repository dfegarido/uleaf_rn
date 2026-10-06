/**
 * Chat presence — the single source of truth for "is this person active?".
 *
 * Activity is decided by `lastseen` freshness ALONE: a user is active while seen
 * within the last PRESENCE_ACTIVE_WINDOW_MS. The stored `chat_presence.isonline`
 * column is deliberately NOT part of the rule — it is sticky true after a
 * force-quit (the app is killed before its AppState "background" write runs), so
 * including it (`isOnline || fresh`) stranded gone users as "Active now".
 *
 * Both the chat header and the group-info screen must agree on the wording and the
 * window, so they share this module rather than each deriving their own.
 */

/** How long a `lastseen` stamp counts as "active". Matches the server rule. */
export const PRESENCE_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Human label for a presence stamp.
 *
 * `lastSeenMs` is a tri-state, because "we have not looked yet" and "we looked and
 * there is no row" must not render the same:
 *   undefined -> the poll has not resolved yet => render nothing (never guess)
 *   null      -> resolved, no presence row     => "Offline"
 *   number    -> epoch ms of chat_presence.lastseen
 *
 * A non-positive/finite number is treated like null (resolved, unknown) rather than
 * claimed as activity.
 */
export const formatPresenceLabel = (lastSeenMs, now = Date.now()) => {
  if (lastSeenMs === undefined) return '';
  if (lastSeenMs === null || !Number.isFinite(lastSeenMs) || lastSeenMs <= 0) return 'Offline';
  const elapsed = now - lastSeenMs;
  if (elapsed < PRESENCE_ACTIVE_WINDOW_MS) return 'Active now';
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;
  return `Active ${new Date(lastSeenMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};
