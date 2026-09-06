import {postSellSinglePlantApi, uploadMultipleImagesToBackend} from '../components/Api';
import {getActiveLiveListingApi} from '../components/Api/agoraLiveApi';
import { getSellerUid, resolveCurrentLiveSessionId } from './attachLiveListingsToSession';
import { getStoredUserInfo } from './getStoredUserInfo';

const ALLOWED_POT_SIZES = ['2"', '4"', '6"'];
const MAX_LIVE_LISTING_QTY = 50;

/** Turn quantity on a row into that many identical listings (qty 6 → 6 rows). */
export function expandLiveListingRows(rows = []) {
  const out = [];
  for (const row of rows) {
    const raw = row?.quantity;
    const n = raw === '' || raw == null ? 1 : parseInt(String(raw), 10);
    const count = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), MAX_LIVE_LISTING_QTY) : 1;
    const {quantity, ...rest} = row || {};
    for (let i = 0; i < count; i++) {
      out.push({...rest});
    }
  }
  return out;
}

export function validateLiveListingRow(row) {
  if (!String(row.genus ?? '').trim()) {
    return 'Genus is required';
  }
  if (!String(row.species ?? '').trim()) {
    return 'Species is required';
  }
  const pot = String(row.potSize ?? '').trim();
  if (!pot) {
    return 'Pot size is required';
  }
  if (!ALLOWED_POT_SIZES.includes(pot)) {
    return 'Pot size must be 2", 4", or 6"';
  }
  const price =
    typeof row.localPrice === 'number'
      ? row.localPrice
      : parseFloat(String(row.localPrice).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(price) || price < 0) {
    return 'Valid price is required';
  }
  return null;
}

/**
 * Upload live-sale listing rows (same payload rules as batch manual upload).
 * @param {Array<{genus: string, species: string, variegation?: string, potSize: string, localPrice: string|number, approximateHeight: 'below'|'above', image?: string|null}>} rows
 * @param {{onProgress?: ({current: number, total: number}) => void}} [options]
 */
export async function uploadLiveListingRows(rows, options = {}) {
  const {onProgress} = options;
  let withActiveLiveListing = false;
  try {
    const activeRes = await getActiveLiveListingApi();
    if (activeRes?.success) {
      withActiveLiveListing = true;
    }
  } catch (_) {}

  let sessionId = options.sessionId || null;
  if (!sessionId) {
    try {
      const userInfo = await getStoredUserInfo();
      sessionId = await resolveCurrentLiveSessionId(getSellerUid(userInfo));
    } catch (_) {}
  }

  let successCount = 0;
  let failCount = 0;
  const total = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.({current: i + 1, total});

    try {
      let imagePrimary = null;
      let imageCollection = [];
      if (row.image) {
        const urls = await uploadMultipleImagesToBackend([row.image]);
        if (urls?.length) {
          imagePrimary = urls[0];
          imageCollection = urls;
        }
      }

      const variegation =
        row.variegation === 'Choose the most suitable variegation.'
          ? ''
          : (row.variegation || '');
      const price =
        typeof row.localPrice === 'number'
          ? row.localPrice
          : parseFloat(String(row.localPrice).replace(/[^0-9.]/g, ''));
      const data = {
        listingType: 'Single Plant',
        genus: row.genus || null,
        species: row.species || null,
        variegation,
        isMutation: false,
        mutation: null,
        imagePrimary,
        imageCollection,
        potSize: row.potSize,
        localPrice: price,
        approximateHeight:
          row.approximateHeight === 'above'
            ? '12 inches & above'
            : 'Below 12 inches',
        status: 'Live',
        publishType: 'Publish Now',
        isActiveLiveListing: i === 0 && !withActiveLiveListing,
        ...(sessionId ? {sessionId} : {}),
      };

      await postSellSinglePlantApi(data);
      successCount++;
    } catch (e) {
      console.warn('Live listing row upload failed:', e?.message);
      failCount++;
    }
  }

  return {successCount, failCount, total};
}
