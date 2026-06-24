import { ENABLE_TRAIL1_FOR_RECEIVING as ENV_ENABLE_TRAIL1_FOR_RECEIVING } from '@env';

function isDevEnvOptOut(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'false' || raw === '0' || raw === 'no';
}

/**
 * Leaf Trail / Greenhouse hub spec — receiver boxes, hub toolbar, scan/export on trails.
 *
 * On by default in all builds (dev + production release).
 * Set ENABLE_TRAIL1_FOR_RECEIVING=false in .env to use the legacy UI.
 */
export function isLeafTrailHubSpecEnabled() {
  if (isDevEnvOptOut(ENV_ENABLE_TRAIL1_FOR_RECEIVING)) {
    return false;
  }
  return true;
}

/** @deprecated alias — same flag as isLeafTrailHubSpecEnabled */
export function isTrail1ForReceivingEnabled() {
  return isLeafTrailHubSpecEnabled();
}
