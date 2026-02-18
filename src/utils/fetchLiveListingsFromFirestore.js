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

function extractValues(arr) {
  return (arr || [])
    .map((x) => (typeof x === 'string' ? x : (x?.value ?? x?.label ?? x?.name ?? '')))
    .filter(Boolean);
}

/**
 * Fetch Live listings for the given seller/supplier uid with cursor-based pagination.
 * When fetchAll or filters are used, fetches up to 500 and applies filter/sort client-side.
 * @param {string} uid - seller/supplier uid (sellerCode in listing docs)
 * @param {{ pageSize?: number, lastDoc?: import('firebase/firestore').DocumentSnapshot | null, fetchAll?: boolean, filters?: object }} options
 * @returns {Promise<{ listings: Array, docs: Array, hasMore: boolean }>}
 */
export async function fetchLiveListingsFromFirestore(uid, {
  pageSize = 12,
  lastDoc = null,
  fetchAll = false,
  filters = {},
} = {}) {
  if (!uid) {
    return { listings: [], docs: [], hasMore: false };
  }

  const effectiveLimit = fetchAll ? 500 : pageSize;
  const listingRef = collection(db, 'listing');
  const q = fetchAll
    ? query(
        listingRef,
        where('sellerCode', '==', uid),
        where('status', '==', 'Live'),
        orderBy('createdAt', 'asc'),
        limit(effectiveLimit),
      )
    : lastDoc
      ? query(
          listingRef,
          where('sellerCode', '==', uid),
          where('status', '==', 'Live'),
          orderBy('createdAt', 'asc'),
          startAfter(lastDoc),
          limit(pageSize),
        )
      : query(
          listingRef,
          where('sellerCode', '==', uid),
          where('status', '==', 'Live'),
          orderBy('createdAt', 'asc'),
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

  let result = listings;
  if (fetchAll) {
    result.forEach((item, i) => {
      item._originalIndex = i + 1;
    });
  }
  if (fetchAll && filters) {
    const genusVals = extractValues(filters.genus);
    const variegationVals = extractValues(filters.variegation);
    const listingTypeVals = extractValues(filters.listingType);
    const searchQ = (filters.search || '').trim().toLowerCase();

    if (genusVals.length) {
      result = result.filter((l) => genusVals.includes(l.genus));
    }
    if (variegationVals.length) {
      result = result.filter((l) => variegationVals.includes(l.variegation));
    }
    if (listingTypeVals.length) {
      result = result.filter((l) => listingTypeVals.includes(l.listingType));
    }
    if (searchQ) {
      result = result.filter((l) => {
        const g = (l.genus || '').toLowerCase();
        const s = (l.species || '').toLowerCase();
        const v = (l.variegation || '').toLowerCase();
        return g.includes(searchQ) || s.includes(searchQ) || v.includes(searchQ);
      });
    }

    const sortValNorm = (filters.sort || '').trim().toLowerCase();
    if (sortValNorm.includes('price') && sortValNorm.includes('low to high')) {
      result = [...result].sort(
        (a, b) =>
          parseFloat(a.localPrice || 0) - parseFloat(b.localPrice || 0),
      );
    } else if (sortValNorm.includes('price') && sortValNorm.includes('high to low')) {
      result = [...result].sort(
        (a, b) =>
          parseFloat(b.localPrice || 0) - parseFloat(a.localPrice || 0),
      );
    } else if (sortValNorm === 'newest' || sortValNorm === 'newest to oldest') {
      result = [...result].reverse();
    } else if (sortValNorm === 'oldest' || sortValNorm === 'oldest to newest') {
      // already fetched in createdAt asc order, no change needed
    } else if (sortValNorm === 'most loved') {
      result = [...result].sort((a, b) => (b.loveCount ?? 0) - (a.loveCount ?? 0));
    } else {
      // default: newest first (same as "Newest to Oldest")
      result = [...result].reverse();
    }
  }

  const hasMore = fetchAll ? false : snapshot.docs.length === pageSize;
  if (__DEV__) {
    console.log(
      `[fetchLiveListingsFromFirestore] sellerCode=${uid} status=Live → ${result.length} listing(s), hasMore=${hasMore}`,
    );
  }

  return {
    listings: result,
    docs: snapshot.docs,
    hasMore,
  };
}
