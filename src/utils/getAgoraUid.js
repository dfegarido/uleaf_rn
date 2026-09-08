/**
 * src/utils/getAgoraUid.js
 *
 * Agora requires a unique numeric UID (0-2^32-1) per user within a channel.
 * Joining with the same uid (e.g. both parties using 0) makes Agora kick the
 * existing user, which manifests as "no broadcaster found" for the viewer.
 *
 * This derives a stable, collision-resistant uid from the user's id so the
 * broadcaster and every viewer get distinct uids while re-joining the same
 * channel keeps the same uid across token refreshes.
 */

const UID_MAX = 0xffffffff; // 2^32 - 1

function hashStringToUid(input) {
  let hash = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV-1a prime
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Stable 32-bit Agora uid for a given user id.
 * Falls back to a random uid in [1, 2^32-1] if no id is available so we never
 * collide with the uid 0 default.
 */
export function getAgoraUid(userId) {
  if (!userId) {
    // Random uid in the valid range, never 0.
    return Math.floor(Math.random() * UID_MAX) + 1;
  }
  const uid = hashStringToUid(userId);
  // Guard against the reserved uid 0.
  return uid === 0 ? UID_MAX : uid;
}
