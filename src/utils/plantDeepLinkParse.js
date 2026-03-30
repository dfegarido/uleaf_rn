/**
 * Normalize plant code from universal links / custom scheme.
 * Rejects static-document path segments mistaken for codes (e.g. index.html).
 */
export function normalizeDeepLinkPlantCode(raw) {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const s = raw.trim();
  if (!s) {
    return null;
  }
  const bad = new Set(['index.html', 'default.html', 'index.htm']);
  if (bad.has(s.toLowerCase())) {
    return null;
  }
  return s;
}
