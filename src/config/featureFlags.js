import { ENABLE_TRAIL1_FOR_RECEIVING as ENV_ENABLE_TRAIL1_FOR_RECEIVING } from '@env';

function isDevEnvOptOut(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'false' || raw === '0' || raw === 'no';
}

/**
 * Leaf Trail / Greenhouse hub spec (development builds only):
 * - Trail #1 For Receiving intake
 * - Plant Flight + Garden + Seller filters on all trails
 * - Scan, Print barcode, Export on all trails
 *
 * On by default when __DEV__ is true (no .env entry required).
 * Set ENABLE_TRAIL1_FOR_RECEIVING=false in .env to use the legacy UI locally.
 * Production release builds: __DEV__ === false → always off.
 */
export function isLeafTrailHubSpecEnabled() {
  if (!__DEV__) {
    return false;
  }
  if (isDevEnvOptOut(ENV_ENABLE_TRAIL1_FOR_RECEIVING)) {
    return false;
  }
  return true;
}

/** @deprecated alias — same flag as isLeafTrailHubSpecEnabled */
export function isTrail1ForReceivingEnabled() {
  return isLeafTrailHubSpecEnabled();
}
