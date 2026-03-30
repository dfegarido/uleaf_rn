import {PLANT_SHARE_BASE_URL} from '@env';

const DEFAULT_SHARE_BASE = 'https://ileafu.com';

function getShareBaseUrl() {
  const raw =
    typeof PLANT_SHARE_BASE_URL === 'string' ? PLANT_SHARE_BASE_URL.trim() : '';
  if (raw) {
    return raw.replace(/\/$/, '');
  }
  return DEFAULT_SHARE_BASE;
}

/**
 * Public HTTPS link for a listing (plantCode). Web / universal links can route later.
 * @param {string} plantCode
 * @returns {string} empty string if plantCode is missing
 */
export function getPlantListingShareUrl(plantCode) {
  const code = String(plantCode ?? '').trim();
  if (!code) {
    return '';
  }
  // Same pattern as /refer/?code= — works on static hosts (plant/index.html) without rewrites
  return `${getShareBaseUrl()}/plant/?code=${encodeURIComponent(code)}`;
}
