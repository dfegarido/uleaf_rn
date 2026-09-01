/** Shown after a slow load or fetch error while the original keeps retrying. */
export const PLANT_LISTING_SLOW_LOAD_FALLBACK = require('../assets/buyer-icons/png/internet-jungle-placeholder.png');

/** Shown when a listing has no image URL at all. */
export const PLANT_LISTING_MISSING_IMAGE = require('../assets/buyer-icons/png/ficus-lyrata.png');

/** Default width for grid-card resize transforms. */
const GRID_IMAGE_WIDTH = 400;

/** Default width for detail-hero resize transforms. */
const DETAIL_IMAGE_WIDTH = 1000;

/** Default JPEG quality for transformed images. */
const TRANSFORM_QUALITY = 70;

/**
 * Rewrite a Supabase storage object URL into a resized server image URL.
 *
 * A plain `.../object/public/...?width=` does NOT resize — Supabase only applies
 * image transforms via the `/render/image/public/` endpoint. Very large originals
 * (multi-MB JPEGs) can fail to decode in React Native's image pipeline, leaving
 * the loading spinner stuck, so we downscale at the server for the grid.
 *
 * Only Supabase hostnames are rewritten; Firebase/other URLs are returned as-is.
 *
 * @param {string} uri
 * @param {number} width
 * @returns {string}
 */
export const toResizedSupabaseUri = (uri, width = GRID_IMAGE_WIDTH) => {
  if (!uri || typeof uri !== 'string') return uri;

  const trimmed = uri.trim();
  if (!trimmed) return uri;

  try {
    const u = new URL(trimmed);

    // Only transform Supabase storage object URLs.
    const isSupabaseObject =
      u.hostname.endsWith('.supabase.co') &&
      u.pathname.startsWith('/storage/v1/object/public/');

    if (!isSupabaseObject) return trimmed;

    u.pathname = u.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/',
    );
    u.searchParams.set('width', String(width));
    u.searchParams.set('quality', String(TRANSFORM_QUALITY));

    return u.toString();
  } catch {
    return trimmed;
  }
};

/** Shop grid cards — prefer WebP for faster loads (resized for grid display). */
export const getShopListingImageUri = (plant) => {
  if (!plant) {
    return null;
  }

  const uri =
    plant.imagePrimaryWebp ||
    plant.imagePrimary ||
    (Array.isArray(plant.imageCollectionWebp) && plant.imageCollectionWebp[0]) ||
    (Array.isArray(plant.imageCollection) && plant.imageCollection[0]) ||
    (Array.isArray(plant.images) && plant.images[0]) ||
    plant.imagePrimaryOriginal;

  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return null;
  }

  return toResizedSupabaseUri(uri.trim(), GRID_IMAGE_WIDTH);
};

/** Plant detail hero — prefer full original so it matches the final image, not WebP first. */
export const getDetailListingImageUri = (plant) => {
  if (!plant) {
    return null;
  }

  const uri =
    plant.imagePrimaryOriginal ||
    plant.imagePrimary ||
    (Array.isArray(plant.imageCollection) && plant.imageCollection[0]) ||
    (Array.isArray(plant.images) && plant.images[0]) ||
    plant.imagePrimaryWebp ||
    (Array.isArray(plant.imageCollectionWebp) && plant.imageCollectionWebp[0]);

  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return null;
  }

  return toResizedSupabaseUri(uri.trim(), DETAIL_IMAGE_WIDTH);
};

export const listingImageUriToSource = (uri) => {
  const resolved = uri && String(uri).trim();
  return resolved ? {uri: resolved} : null;
};
