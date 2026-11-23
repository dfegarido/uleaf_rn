import {getStoredAuthToken} from './getStoredAuthToken';
import {API_ENDPOINTS} from '../config/apiConfig';

const TIMEOUT_MS = 2500;
const SHORT_PREFIX = 'https://ileafu.com/l/';
// Long link -> short link, for this app run. Sharing the same thing again is instant.
const known = new Map();

/**
 * Short form (https://ileafu.com/l/CODE) of an ileafU share link.
 * Never rejects and never takes longer than 2.5 s: on any problem (not logged in, server or
 * network error, slow reply) it resolves to the long link, so sharing always works.
 * @param {string} longUrl
 * @returns {Promise<string>}
 */
export function shortenShareUrl(longUrl) {
  if (!longUrl || known.has(longUrl)) {
    return Promise.resolve(known.get(longUrl) || longUrl);
  }
  const attempt = (async () => {
    const token = await getStoredAuthToken();
    if (!token) {
      return longUrl;
    }
    const response = await fetch(API_ENDPOINTS.SHORT_LINK, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({url: longUrl}),
    });
    const data = await response.json();
    const shortUrl = response.ok && data?.success ? data.shortUrl : '';
    if (typeof shortUrl !== 'string' || !shortUrl.startsWith(SHORT_PREFIX)) {
      return longUrl;
    }
    known.set(longUrl, shortUrl);
    return shortUrl;
  })().catch(() => longUrl);
  const timeout = new Promise(resolve => setTimeout(() => resolve(longUrl), TIMEOUT_MS));
  return Promise.race([attempt, timeout]);
}
