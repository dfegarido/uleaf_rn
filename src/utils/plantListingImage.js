/** Shown after a slow load or fetch error while the original keeps retrying. */
export const PLANT_LISTING_SLOW_LOAD_FALLBACK = require('../assets/buyer-icons/png/internet-jungle-placeholder.png');

/** Shown when a listing has no image URL at all. */
export const PLANT_LISTING_MISSING_IMAGE = require('../assets/buyer-icons/png/ficus-lyrata.png');

/** Shop grid cards — prefer WebP for faster loads. */
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

  return uri.trim();
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

  return uri.trim();
};

export const listingImageUriToSource = (uri) => {
  const resolved = uri && String(uri).trim();
  return resolved ? {uri: resolved} : null;
};
