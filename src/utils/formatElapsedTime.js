/**
 * Format a Firestore Timestamp as a human-readable elapsed time string.
 * Returns "just now", "Xm", "Xh Ym", or "Xh".
 */
export function formatElapsedTime(timestamp) {
  if (!timestamp || !timestamp.toMillis) return '';

  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (seconds < 86400) return `${hours}h ${minutes}m`;
  return `${hours}h`;
}
