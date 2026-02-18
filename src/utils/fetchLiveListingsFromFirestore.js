/**
 * Fetches seller "Live" listings directly from Firestore (no backend call).
 * Used by the seller Listings tab when the Live tab is selected.
 * Supports cursor-based pagination for infinite scroll.
 */
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    const d = timestamp.toDate();
    return d.toISOString ? d.toISOString().slice(0, 10) : String(d);
  }
  return null;
}

/**
 * Fetch Live listings for the given seller/supplier uid with cursor-based pagination.
 * @param {string} uid - seller/supplier uid (sellerCode in listing docs)
 * @param {{ pageSize?: number, lastDoc?: import('firebase/firestore').DocumentSnapshot | null }} options - pageSize (default 12), lastDoc cursor for next page
 * @returns {Promise<{ listings: Array, docs: Array, hasMore: boolean }>}
 */
export async function fetchLiveListingsFromFirestore(uid, { pageSize = 12, lastDoc = null } = {}) {
  if (!uid) {
    return { listings: [], docs: [], hasMore: false };
  }

  const listingRef = collection(db, 'listing');
  const q = lastDoc
    ? query(
        listingRef,
        where('sellerCode', '==', uid),
        where('status', '==', 'Live'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize),
      )
    : query(
        listingRef,
        where('sellerCode', '==', uid),
        where('status', '==', 'Live'),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      );

  let snapshot;
  try {
    snapshot = await getDocs(q);
  } catch (err) {
    if (__DEV__) {
      console.warn('[fetchLiveListingsFromFirestore] getDocs error:', err?.code, err?.message);
    }
    throw err;
  }

  const listings = [];
  const BATCH_SIZE = 5;
  const delayMs = 50;

  const processDoc = async (docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    data.createdAtFormatted = formatTimestamp(data.createdAt);
    data.updatedAtFormatted = formatTimestamp(data.updatedAt);
    data.publishDateFormatted = formatTimestamp(data.publishDate);
    data.expirationDateFormatted = formatTimestamp(data.expirationDate);

    if (
      data.listingType === "Grower's Choice" ||
      data.listingType === 'Wholesale'
    ) {
      const variationRef = collection(db, 'listing', id, 'variation');
      const variationSnap = await getDocs(variationRef);
      const variations = variationSnap.docs.map((vDoc) => {
        const vData = vDoc.data();
        let localPriceNew = vData.localPrice;
        if (data.discountPrice > 0) {
          localPriceNew -= data.discountPrice;
        } else if (data.discountPercent > 0) {
          localPriceNew -=
            vData.localPrice * (data.discountPercent / 100);
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

  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    const batch = snapshot.docs.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(processDoc));
    listings.push(...results);
    if (i + BATCH_SIZE < snapshot.docs.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  if (__DEV__) {
    console.log(
      `[fetchLiveListingsFromFirestore] sellerCode=${uid} status=Live → ${listings.length} listing(s), hasMore=${snapshot.docs.length === pageSize}`,
    );
  }

  return {
    listings,
    docs: snapshot.docs,
    hasMore: snapshot.docs.length === pageSize,
  };
}
