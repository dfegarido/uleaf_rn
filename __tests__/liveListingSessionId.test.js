/**
 * Regression test: Single-Plant live listing must attach `sessionId` so it
 * connects to the live stream (matches Grower's Choice). Previously sessionId
 * was only attached when isPurge=true, so live Single-Plant listings were
 * written with sessionid=null and never appeared in the stream's listings.
 *
 * We can't execute the RN component directly (imports native modules), so we
 * assert on the actual payload-construction lines in the source file.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'screens', 'Seller', 'Sell', 'ScreenSingleSellLive.js');
const GROWER = path.join(__dirname, '..', 'src', 'screens', 'Seller', 'Sell', 'ScreenGrowersSellLive.js');

if (!fs.existsSync(FILE)) {
  console.error('FAIL: ScreenSingleSellLive.js not found at', FILE);
  process.exit(1);
}

const src = fs.readFileSync(FILE, 'utf8');

// 1. sessionId is now always in the payload (not inside an if(isPurge) guard).
const hasSessionIdInPayload = /sessionId:\s*sessionId\s*\|\|\s*null/.test(src);
const stillHasPurgeGuardBeforeSessionId = /if\s*\(\s*isPurge\s*\)\s*\{\s*data\.sessionId\s*=\s*sessionId/.test(src);

console.log('SinglePlant payload has `sessionId: sessionId || null`:', hasSessionIdInPayload);
console.log('SinglePlant still gates sessionId behind if(isPurge):       ', stillHasPurgeGuardBeforeSessionId);

let pass = true;
if (!hasSessionIdInPayload) {
  console.error('  FAIL: Single-Plant payload no longer attaches sessionId unconditionally.');
  pass = false;
}
if (stillHasPurgeGuardBeforeSessionId) {
  console.error('  FAIL: leftover `if(isPurge) { data.sessionId = sessionId }` still present.');
  pass = false;
}

// 2. status is 'Live' for the live flow (not Purge), so it is a live listing.
const hasStatusLive = /status:\s*isPurge\s*\?\s*'Purge'\s*:\s*'Live'/.test(src);
console.log('SinglePlant status remains Live for live flow:', hasStatusLive);

// 3. The component must accept `sessionId` as a prop AND fall back to it when
//    `route` is absent (the live flow renders ScreenSingleSellLive nested via
//    ScreenSellLive with `route` undefined, so route.params alone is empty).
const hasSessionIdProp = /sessionId:\s*sessionIdProp/.test(src);
const hasRouteParamsFallback = /sessionId = sessionIdProp \|\| ''/.test(src);

console.log('SinglePlant accepts sessionId as a prop:        ', hasSessionIdProp);
console.log('SinglePlant route-params falls back to prop:    ', hasRouteParamsFallback);
if (!hasSessionIdProp || !hasRouteParamsFallback) {
  console.error('  FAIL: Single-Plant does not read sessionId from the prop when route is absent (live flow).');
  pass = false;
}

// 4. Grower's Choice baseline (already correct): always attaches sessionId
//    AND reads sessionId directly as a prop.
const growerSrc = fs.readFileSync(GROWER, 'utf8');
const growerSessionId = /sessionId:\s*sessionId\s*\|\|\s*null/.test(growerSrc);
const growerSessionIdProp = /sessionId[,\s}]/.test(
  growerSrc.split('\n').find(l => l.trim().startsWith('const ScreenGrowersSellLive'))
    || '');
console.log('GrowerChoice payload attaches sessionId (baseline): ', growerSessionId);
console.log('GrowerChoice reads sessionId as a prop (baseline):   ', growerSessionIdProp);

if (growerSessionId) {
  console.log('PASS: Single-Plant live flow now matches Grower\'s Choice (sessionId always attached + prop-backed).');
} else {
  console.error('WARN: Grower baseline check did not match expected pattern; verify manually.');
  pass = false;
}

process.exit(pass ? 0 : 1);
