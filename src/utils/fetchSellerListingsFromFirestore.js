/**
 * Fetches all seller listings directly from Firestore (no backend call).
 * Used by the seller Listings screen for ALL non-Live tabs.
 * Fetches all in one shot (up to maxFetch) and returns raw data for client-side
 * filtering/sorting/pagination — same pattern as fetchLiveListingsFromFirestore.
 */
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    const d = timestamp.toDate();
    return d.toISOString ? d.toISOString().slice(0, 10) : String(d);
  }
  return null;
}

const processDoc = async (docSnap) => {
  const data = docSnap.data();
  const id = docSnap.id;

  data.createdAtFormatted = formatTimestamp(data.createdAt);
  data.updatedAtFormatted = formatTimestamp(data.updatedAt);
  data.publishDateFormatted = formatTimestamp(data.publishDate);
  data.expirationDateFormatted = formatTimestamp(data.expirationDate);

  if (data.listingType === "Grower's Choice" || data.listingType === 'Wholesale') {
    const variationRef = collection(db, 'listing', id, 'variation');
    const variationSnap = await getDocs(variationRef);
    const variations = variationSnap.docs.map((vDoc) => {
      const vData = vDoc.data();
      let localPriceNew = vData.localPrice;
      if (data.discountPrice > 0) {
        localPriceNew -= data.discountPrice;
      } else if (data.discountPercent > 0) {
        localPriceNew -= vData.localPrice * (data.discountPercent / 100);
      }
      return {
        id: vDoc.id,
        ...vData,
        ...(localPriceNew !== vData.localPrice
          ? { localPriceNew: Math.round(localPriceNew * 100) / 100 }
          : {}),
      };
    });
    data.variations = variations;
  }

  if (data.listingType === 'Single Plant') {
    if (data.discountPrice > 0) {
      data.localPriceNew = data.localPrice - data.discountPrice;
    } else if (data.discountPercent > 0) {
      data.localPriceNew =
        data.localPrice - data.localPrice * (data.discountPercent / 100);
    } else {
      data.localPriceNew = data.localPrice;
    }
    data.localPriceNew =
      data.localPriceNew != null
        ? Math.round(data.localPriceNew * 100) / 100
        : data.localPrice;
  }

  return { id, ...data };
};

/**
 * Fetch all listings for the given seller uid from Firestore.
 * @param {string} uid - seller uid (sellerCode in listing docs)
 * @param {{ maxFetch?: number }} options
 * @returns {Promise<{ listings: Array }>}
 */
export async function fetchSellerListingsFromFirestore(uid, { maxFetch = 500 } = {}) {
  if (!uid) return { listings: [] };

  const q = query(
    collection(db, 'listing'),
    where('sellerCode', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(maxFetch),
  );

  let snapshot;
  try {
    snapshot = await getDocs(q);
  } catch (err) {
    if (__DEV__) {
      console.warn(
        '[fetchSellerListingsFromFirestore] getDocs error:',
        err?.code,
        err?.message,
      );
    }
    throw err;
  }

  const listings = [];
  const BATCH_SIZE = 5;
  const delayMs = 50;

  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    const batch = snapshot.docs.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(processDoc));
    listings.push(...results);
    if (i + BATCH_SIZE < snapshot.docs.length && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  if (__DEV__) {
    console.log(
      `[fetchSellerListingsFromFirestore] uid=${uid} → ${listings.length} listing(s)`,
    );
  }

  return { listings };
}
