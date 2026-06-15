// API retry fetch
export const retryAsync = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(res => setTimeout(res, delay));
    return retryAsync(fn, retries - 1, delay * 2);
  }
};

/**
 * Compare two semver-like version strings (e.g. "1.0.0" vs "1.1.0").
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
export const compareVersions = (a, b) => {
  const parse = v => String(v || '').split('.').map(n => parseInt(n, 10) || 0);
  const av = parse(a);
  const bv = parse(b);
  const len = Math.max(av.length, bv.length, 3);
  for (let i = 0; i < len; i++) {
    const an = av[i] ?? 0;
    const bn = bv[i] ?? 0;
    if (an < bn) return -1;
    if (an > bn) return 1;
  }
  return 0;
};

/**
 * Returns true when the local app version is below the minimum version
 * published by the version API (i.e. an update is required).
 * @param {string} appVersion - Local build version (e.g. from package.json)
 * @param {string} minimumVersion - Minimum version required by the backend
 */
export const isAppUpdateRequired = (appVersion, minimumVersion) => {
  if (!appVersion || !minimumVersion) return false;
  return compareVersions(appVersion, minimumVersion) < 0;
};
