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

  const listingTypeCanon = canonicalListingType(data.listingType);
  const needsVariations =
    listingTypeCanon === "grower's choice" || listingTypeCanon === 'wholesale';

  if (needsVariations) {
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

function normalizeFilterValues(filterArray) {
  if (!Array.isArray(filterArray) || filterArray.length === 0) {
    return [];
  }
  return filterArray
    .map(item => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return (item.value || item.label || '').toString().trim();
      }
      return '';
    })
    .filter(Boolean);
}

/** Main catalog genera; "Others" = any listing genus not in this set (buyer shop parity). */
export const MAIN_GENERA = [
  'ALOCASIA',
  'ANTHURIUM',
  'BEGONIA',
  'HOYA',
  'MONSTERA',
  'SCINDAPSUS',
  'SYNGONIUM',
  'PHILODENDRON',
];

const isOthersGenusFilterValue = value =>
  ['others', 'other'].includes(String(value || '').trim().toLowerCase());

/**
 * Client-side genus filter (supports "Others" = not in MAIN_GENERA).
 */
export function listingMatchesGenusFilter(listing, genusFilters) {
  const filters = normalizeFilterValues(genusFilters);
  if (!filters.length) return true;

  const hasOthers = filters.some(isOthersGenusFilterValue);
  const explicitFilters = filters.filter(f => !isOthersGenusFilterValue(f));
  const explicitLower = explicitFilters.map(g => g.toLowerCase());

  const listingGenusUpper = (listing.genus || '').toString().trim().toUpperCase();
  const listingGenusLower = (listing.genus || '').toString().trim().toLowerCase();

  const matchesExplicit =
    explicitLower.length > 0 && explicitLower.includes(listingGenusLower);
  const matchesOthers =
    hasOthers && listingGenusUpper !== '' && !MAIN_GENERA.includes(listingGenusUpper);

  if (hasOthers && explicitLower.length === 0) return matchesOthers;
  if (!hasOthers) return matchesExplicit;
  return matchesExplicit || matchesOthers;
}

/** Canonical listing type key for filter matching. */
export function canonicalListingType(value) {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  if (
    normalized === 'single plant' ||
    normalized === 'singleplant' ||
    normalized === 'single_plant' ||
    normalized === 'single-plant'
  ) {
    return 'single plant';
  }
  if (normalized === 'wholesale' || normalized.includes('whole')) {
    return 'wholesale';
  }
  if (
    normalized === "grower's choice" ||
    normalized === 'growers choice' ||
    normalized === 'grower choice' ||
    normalized === 'growerschoice'
  ) {
    return "grower's choice";
  }
  const compact = normalized.replace(/\s+/g, '').replace(/'/g, '');
  if (compact.includes('single') && !compact.includes('grower')) {
    return 'single plant';
  }
  if (compact.includes('whole')) return 'wholesale';
  if (compact.includes('grower') || compact.includes('choice')) {
    return "grower's choice";
  }
  return normalized;
}

export function inferListingType(listing) {
  const raw =
    listing?.listingType ||
    listing?.listingData?.listingType ||
    listing?.variationType ||
    listing?.type;
  if (raw) return String(raw).trim();

  const variations = Array.isArray(listing?.variations) ? listing.variations : [];
  if (variations.length > 0) return "Grower's Choice";
  if (Array.isArray(listing?.availableQty) || listing?.bulkDetails) {
    return 'Wholesale';
  }
  return 'Single Plant';
}

/** User-facing listing type label for cards and detail headers. */
export function getListingTypeDisplayLabel(listing) {
  const canon = canonicalListingType(inferListingType(listing));
  switch (canon) {
    case 'single plant':
      return 'Single Plant';
    case "grower's choice":
      return "Grower's Choice";
    case 'wholesale':
      return 'Wholesale';
    default: {
      const raw = inferListingType(listing);
      return raw ? String(raw).trim() : 'Single Plant';
    }
  }
}

function listingMatchesTypeFilter(listing, listingTypeFilters) {
  if (!listingTypeFilters.length) return true;
  const listingCanon = canonicalListingType(inferListingType(listing));
  return listingTypeFilters.some(
    filter => canonicalListingType(filter) === listingCanon,
  );
}

const parseSafeFloat = val => {
  const num = parseFloat(val);
  return Number.isNaN(num) ? 0 : num;
};

/** Price used for sort (handles variation listings). */
export function getListingSortPrice(listing) {
  const variations = Array.isArray(listing?.variations) ? listing.variations : [];
  if (variations.length > 0) {
    const prices = variations
      .map(v =>
        parseSafeFloat(
          v.localPriceNew != null && v.localPriceNew !== ''
            ? v.localPriceNew
            : v.localPrice,
        ),
      )
      .filter(p => p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }
  const direct = parseSafeFloat(
    listing?.localPriceNew != null && listing?.localPriceNew !== ''
      ? listing.localPriceNew
      : listing?.localPrice ?? listing?.usdPrice,
  );
  return direct > 0 ? direct : 0;
}

export function getListingLoveCount(listing) {
  const wish = parseInt(listing?.wishListCount, 10);
  if (!Number.isNaN(wish) && wish > 0) return wish;
  const love = parseInt(listing?.loveCount, 10);
  if (!Number.isNaN(love) && love > 0) return love;
  return 0;
}

export function getListingPriceInfo(listing) {
  let totalLocalPrice = 0;
  let totalLocalPriceNew = 0;
  let hasNewPrice = false;
  let finalCurrencySymbol = listing?.localCurrencySymbol || '';

  const isNonEmpty = val =>
    val !== null &&
    val !== undefined &&
    (typeof val === 'number' || (typeof val === 'string' && val.trim() !== ''));

  if (Array.isArray(listing?.variations) && listing.variations.length > 0) {
    listing.variations.forEach(variation => {
      const localPrice = parseSafeFloat(variation.localPrice);
      const localPriceNew = isNonEmpty(variation.localPriceNew)
        ? parseSafeFloat(variation.localPriceNew) !=
          parseSafeFloat(variation.localPrice)
          ? parseSafeFloat(variation.localPriceNew)
          : 0
        : 0;

      totalLocalPrice += localPrice;
      if (localPriceNew > 0) {
        totalLocalPriceNew += localPriceNew;
        hasNewPrice = true;
      } else {
        totalLocalPriceNew += localPrice;
      }

      if (variation.localCurrencySymbol) {
        finalCurrencySymbol = variation.localCurrencySymbol;
      }
    });
  } else {
    const localPrice = parseSafeFloat(listing?.localPrice);
    const localPriceNew = isNonEmpty(listing?.localPriceNew)
      ? parseSafeFloat(listing.localPriceNew) !=
        parseSafeFloat(listing.localPrice)
        ? parseSafeFloat(listing.localPriceNew)
        : 0
      : 0;

    totalLocalPrice = localPrice;
    totalLocalPriceNew = localPriceNew;
    hasNewPrice = localPriceNew > 0;

    if (listing?.localCurrencySymbol) {
      finalCurrencySymbol = listing.localCurrencySymbol;
    }
  }

  return {totalLocalPrice, totalLocalPriceNew, hasNewPrice, finalCurrencySymbol};
}

function normalizeSortValue(sortBy) {
  if (!sortBy) return '';
  const value = String(sortBy).trim();
  const lower = value.toLowerCase();

  if (lower.includes('price') && lower.includes('low')) return 'Price Low To High';
  if (lower.includes('price') && lower.includes('high')) return 'Price High To Low';
  if (lower.includes('love') || lower.includes('loved')) return 'Most Loved';
  if (lower.includes('oldest') && lower.includes('newest')) {
    return 'Oldest to Newest';
  }
  if (lower.includes('newest')) return 'Newest to Oldest';

  switch (value) {
    case 'Price Low To High':
    case 'Price Low to High':
      return 'Price Low To High';
    case 'Price High To Low':
    case 'Price High to Low':
      return 'Price High To Low';
    case 'Most Loved':
      return 'Most Loved';
    case 'Newest':
    case 'Newest to Oldest':
    case 'Newest To Oldest':
      return 'Newest to Oldest';
    case 'Oldest':
    case 'Oldest to Newest':
    case 'Oldest To Newest':
      return 'Oldest to Newest';
    default:
      return value;
  }
}

/** Whether a listing is pinned (handles boolean, string, and numeric Firestore values). */
export function isListingPinned(listing) {
  const value = listing?.pinTag;
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

/** Active tab rules: status Active and at least one unit in stock (incl. variations). */
export function isSellerActiveListing(listing) {
  const isActiveStatus =
    (listing.status || '').trim().toLowerCase() === 'active';
  const qty = parseInt(listing.availableQty, 10) || 0;
  const variations = Array.isArray(listing.variations) ? listing.variations : [];
  const hasVariationQuantity =
    variations.length > 0
      ? variations.some(v => (parseInt(v.availableQty, 10) || 0) > 0)
      : true;
  const hasQuantity = qty > 0 || (variations.length > 0 && hasVariationQuantity);
  return isActiveStatus && hasQuantity;
}

const toMs = val => {
  if (!val) return 0;
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  return new Date(val).getTime() || 0;
};

/**
 * Filter/sort seller listings for My Store (Active listings with stock only).
 */
export function prepareMyStoreActiveListings(rawListings, filters = {}) {
  const {
    sortBy = '',
    genus = [],
    variegation = [],
    listingType = [],
    search = '',
    pinOnly = false,
  } = filters;

  const listingTypeFilters = normalizeFilterValues(listingType);
  const genusFilters = normalizeFilterValues(genus);
  const variegationFilters = normalizeFilterValues(variegation).map(v =>
    v.toLowerCase(),
  );
  const searchTerm = typeof search === 'string' ? search.trim().toLowerCase() : '';
  const normalizedSortValue = normalizeSortValue(sortBy);

  const seen = new Set();
  const filtered = (Array.isArray(rawListings) ? rawListings : []).filter(
    listing => {
      if (!isSellerActiveListing(listing)) return false;

      const uniqueKey = listing.plantCode || listing.id;
      if (uniqueKey) {
        if (seen.has(uniqueKey)) return false;
        seen.add(uniqueKey);
      }

      if (pinOnly && !isListingPinned(listing)) return false;

      if (searchTerm) {
        const haystack = [
          listing.genus,
          listing.species,
          listing.variegation,
          listing.mutation,
          listing.plantCode,
        ]
          .map(v => (v || '').toString().toLowerCase())
          .join(' ');
        if (!haystack.includes(searchTerm)) return false;
      }

      if (!listingMatchesTypeFilter(listing, listingTypeFilters)) {
        return false;
      }

      if (!listingMatchesGenusFilter(listing, genusFilters)) {
        return false;
      }

      const variegationNormalized = (listing.variegation || listing.mutation || '')
        .trim()
        .toLowerCase();
      if (
        variegationFilters.length > 0 &&
        !variegationFilters.includes(variegationNormalized)
      ) {
        return false;
      }

      return true;
    },
  );

  const sorted = [...filtered];
  const comparePinned = (a, b) => {
    const aPinned = isListingPinned(a) ? 1 : 0;
    const bPinned = isListingPinned(b) ? 1 : 0;
    return bPinned - aPinned;
  };

  const compareBySort = (a, b) => {
    switch (normalizedSortValue) {
      case 'Price Low To High':
        return getListingSortPrice(a) - getListingSortPrice(b);
      case 'Price High To Low':
        return getListingSortPrice(b) - getListingSortPrice(a);
      case 'Most Loved':
        return getListingLoveCount(b) - getListingLoveCount(a);
      case 'Oldest to Newest':
        return (
          toMs(a.createdAt || a.orderDate) - toMs(b.createdAt || b.orderDate)
        );
      case 'Newest to Oldest':
      default:
        return (
          toMs(b.createdAt || b.orderDate) - toMs(a.createdAt || a.orderDate)
        );
    }
  };

  sorted.sort((a, b) => {
    const pinCmp = comparePinned(a, b);
    if (pinCmp !== 0) return pinCmp;
    return compareBySort(a, b);
  });

  return sorted;
}
