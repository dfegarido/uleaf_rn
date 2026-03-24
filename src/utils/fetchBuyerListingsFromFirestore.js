/**
 * Fetches buyer (Active) listings directly from Firestore (no backend call).
 * Replaces the getBuyerListings Cloud Function for the buyer shop/genus flows.
 * Uses cursor-based pagination and applies post-query filters (country, species, variegation, price, etc.) on the client.
 */
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

const MAIN_GENERA = ['ALOCASIA', 'ANTHURIUM', 'BEGONIA', 'HOYA', 'MONSTERA', 'SCINDAPSUS', 'SYNGONIUM', 'PHILODENDRON'];
const CURRENCY_TO_COUNTRY = { PHP: 'PH', THB: 'TH', IDR: 'ID', USD: 'US' };
const COUNTRY_TO_CURRENCY = { Indonesia: 'IDR', ID: 'IDR', Philippines: 'PHP', PH: 'PHP', Thailand: 'THB', TH: 'THB' };

const LISTING_TYPES = {
  GROWERS_CHOICE: ["Grower's Choice", "Grower's choice", "growers choice", "grower choice"],
  WHOLESALE: ['Wholesale', 'wholesale'],
  SINGLE_PLANT: ['Single Plant', 'single plant'],
};

const FX_RATES_TO_USD = { PHP: 56, IDR: 16338, THB: 32.52, USD: 1 };

function formatTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString ? ts.toDate().toISOString().slice(0, 19) : String(ts.toDate());
  if (ts._seconds != null) return new Date(ts._seconds * 1000).toISOString().slice(0, 19);
  return null;
}

function getSortFieldValue(doc, sortBy) {
  const data = doc.data();
  let val = data[sortBy];
  if (val && typeof val.toMillis === 'function') return val.toMillis();
  if (val && val._seconds != null) return val._seconds * 1000;
  return val;
}

function encodeNextPageToken(lastDoc, sortBy) {
  const lastSortValue = getSortFieldValue(lastDoc, sortBy);
  const payload = { lastId: lastDoc.id, sortBy, lastSortValue };
  try {
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch (e) {
    return btoa(JSON.stringify(payload));
  }
}

function decodeNextPageToken(token) {
  if (!token) return null;
  try {
    let str;
    try {
      str = decodeURIComponent(atob(token));
    } catch (e) {
      str = atob(token);
    }
    const parsed = JSON.parse(str);
    if (parsed && parsed.lastId) return parsed;
  } catch (e) { /* ignore */ }
  return null;
}

/** Omit live-session “active” rows and status Live from buyer shop/browse */
function shouldExcludeLiveListingFromBuyerBrowse(data) {
  if (!data) return true;
  if (data.isActiveLiveListing === true) return true;
  if (String(data.status || '').trim() === 'Live') return true;
  return false;
}

function shouldExcludeSoldListing(listing, isSoldOut, variationsSoldOut) {
  if (!isSoldOut && !variationsSoldOut) return false;
  const updatedAt = listing.updatedAt;
  if (!updatedAt) return false;
  try {
    const ms = updatedAt.toMillis ? updatedAt.toMillis() : (updatedAt._seconds || 0) * 1000;
    const hoursSince = (Date.now() - ms) / (1000 * 60 * 60);
    return hoursSince >= 24;
  } catch (e) {
    return false;
  }
}

function expandIndexRange(filterString) {
  const values = (filterString || '').split(',').map((x) => x.trim()).filter(Boolean);
  const expanded = new Set();
  values.forEach((val) => {
    const labelMatch = val.match(/\((\d+)-(\d+)\)/);
    if (labelMatch) {
      for (let i = parseInt(labelMatch[1], 10); i <= parseInt(labelMatch[2], 10); i++) expanded.add(String(i));
    } else if (val.includes('-') && !val.includes('(')) {
      const [s, e] = val.split('-').map((x) => parseInt(x.trim(), 10));
      if (!isNaN(s) && !isNaN(e)) for (let i = s; i <= e; i++) expanded.add(String(i));
    } else if (!isNaN(parseInt(val, 10))) {
      expanded.add(val);
    } else {
      expanded.add(val);
    }
  });
  return Array.from(expanded);
}

function getPriceFromListing(listing) {
  const data = listing;
  const listingType = data.listingType;
  const discountPrice = data.discountPrice || 0;
  const discountPercent = data.discountPercent || 0;

  if (listingType === 'Wholesale' || listingType === "Grower's Choice" || listingType === "Grower's choice") {
    const denormUsd = typeof data.lowestVariationUsdPrice === 'number' ? data.lowestVariationUsdPrice : null;
    const denormLocal = typeof data.lowestVariationLocalPrice === 'number' ? data.lowestVariationLocalPrice : null;
    const hasValid = !!data.hasValidVariationPrice;
    const currency = data.lowestVariationLocalCurrency || data.localCurrency || null;
    const symbol = data.lowestVariationLocalCurrencySymbol || data.localCurrencySymbol || null;

    if (hasValid && (denormUsd || denormLocal)) {
      const originalPrice = denormUsd && denormUsd > 0 ? denormUsd : (denormLocal && FX_RATES_TO_USD[currency] ? denormLocal / FX_RATES_TO_USD[currency] : 0);
      let finalPrice = originalPrice;
      let hasDiscount = false;
      if (discountPrice > 0) {
        finalPrice = Math.max(0, originalPrice - discountPrice);
        hasDiscount = true;
      } else if (discountPercent > 0) {
        finalPrice = Math.max(0, originalPrice * (1 - discountPercent / 100));
        hasDiscount = true;
      }
      return {
        finalPrice: Math.round(finalPrice * 100) / 100,
        originalPrice: Math.round(originalPrice * 100) / 100,
        hasDiscount,
        discountAmount: hasDiscount ? Math.round((originalPrice - finalPrice) * 100) / 100 : 0,
        isValid: true,
        localCurrency: currency,
        localCurrencySymbol: symbol,
      };
    }
    return { finalPrice: 0, originalPrice: 0, hasDiscount: false, discountAmount: 0, isValid: false };
  }

  const mainUsd = data.usdPrice || 0;
  if (mainUsd > 0) {
    let finalPrice = mainUsd;
    let hasDiscount = false;
    if (discountPrice > 0) {
      finalPrice = Math.max(0, mainUsd - discountPrice);
      hasDiscount = true;
    } else if (discountPercent > 0) {
      finalPrice = Math.max(0, mainUsd * (1 - discountPercent / 100));
      hasDiscount = true;
    }
    return {
      finalPrice: Math.round(finalPrice * 100) / 100,
      originalPrice: Math.round(mainUsd * 100) / 100,
      hasDiscount,
      discountAmount: hasDiscount ? Math.round((mainUsd - finalPrice) * 100) / 100 : 0,
      isValid: true,
    };
  }
  return { finalPrice: 0, originalPrice: 0, hasDiscount: false, discountAmount: 0, isValid: true };
}

function passesCountryFilter(listing, countryFilterList) {
  if (!countryFilterList || countryFilterList.length === 0) return true;
  const listedCountry = (listing.country || '').toString().toLowerCase();
  const listedCurrency = (listing.localCurrency || '').toString().toLowerCase();
  const lowestVarCurrency = (listing.lowestVariationLocalCurrency || '').toString().toLowerCase();
  const normalized = {};
  Object.keys(COUNTRY_TO_CURRENCY).forEach((k) => { normalized[k.toLowerCase()] = COUNTRY_TO_CURRENCY[k].toLowerCase(); });
  const currencyToCountry = {};
  Object.keys(CURRENCY_TO_COUNTRY).forEach((k) => { currencyToCountry[k.toLowerCase()] = (CURRENCY_TO_COUNTRY[k] || '').toLowerCase(); });
  const acceptable = new Set();
  countryFilterList.forEach((f) => {
    const fn = (f || '').toString().trim().toLowerCase();
    if (!fn) return;
    acceptable.add(fn);
    if (normalized[fn]) acceptable.add(normalized[fn]);
    const maybeCur = normalized[fn] || fn;
    if (currencyToCountry[maybeCur]) acceptable.add(currencyToCountry[maybeCur]);
  });
  const passes = acceptable.has(listedCountry) || acceptable.has(listedCurrency) || acceptable.has(lowestVarCurrency);
  return passes;
}

function passesVariegationFilter(listing, variegationFilterList) {
  if (!variegationFilterList || variegationFilterList.length === 0) return true;
  const listed = (listing.variegation || '').toString().trim().toLowerCase();
  return variegationFilterList.some((filterValue) => {
    const f = filterValue.toLowerCase().trim();
    if (listed === f) return true;
    if ((f === 'none' || f === '') && (!listed || listed === 'none')) return true;
    if (!listed || listed === 'none') return false;
    if (listed.includes(f) || f.includes(listed)) return true;
    if (!f.includes(' ')) {
      const regex = new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      return regex.test(listing.variegation || '');
    }
    return false;
  });
}

function passesSpeciesFilter(listing, speciesFilterList) {
  if (!speciesFilterList || speciesFilterList.length === 0) return true;
  const listed = (listing.species || '').toString().trim().toUpperCase();
  return speciesFilterList.some((rs) => {
    if (!rs) return false;
    const r = rs.toUpperCase();
    return listed === r || listed.includes(r);
  });
}

function passesPriceFilter(listing, minPrice, maxPrice, isUnicornFilter) {
  const minVal = minPrice != null && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) : null;
  const maxVal = maxPrice != null && !isNaN(parseFloat(maxPrice)) ? parseFloat(maxPrice) : null;
  if (minVal == null && maxVal == null) return true;
  let priceToCheck;
  if (isUnicornFilter) {
    const prices = [
      listing.originalPrice || 0,
      listing.usdPrice || 0,
      listing.finalPrice || 0,
    ].filter((p) => p > 0);
    priceToCheck = prices.length > 0 ? Math.max(...prices) : 0;
    return priceToCheck >= 2000 && (maxVal == null || priceToCheck <= maxVal);
  }
  priceToCheck = listing.finalPrice ?? listing.usdPrice ?? 0;
  if (minVal != null && priceToCheck < minVal) return false;
  if (maxVal != null && priceToCheck > maxVal) return false;
  return true;
}

function passesShippingAcclimationFilter(listing, shippingIndexFilterList, acclimationIndexFilterList) {
  if (shippingIndexFilterList && shippingIndexFilterList.length > 0) {
    const listingVal = (listing.shippingIndex ?? listing.shipping_index ?? '').toString();
    if (listingVal && !shippingIndexFilterList.includes(String(listingVal))) return false;
  }
  if (acclimationIndexFilterList && acclimationIndexFilterList.length > 0) {
    const listingVal = (listing.acclimationIndex ?? listing.acclimation_index ?? '').toString();
    if (listingVal && !acclimationIndexFilterList.includes(String(listingVal))) return false;
  }
  return true;
}

function passesPlantSearchFilter(listing, plantTerm) {
  if (!plantTerm || !plantTerm.trim()) return true;
  const term = plantTerm.trim().toLowerCase();
  const genus = (listing.genus || '').toLowerCase();
  const species = (listing.species || '').toLowerCase();
  const variegation = (listing.variegation || '').toLowerCase();
  const plantCode = (listing.plantCode || '').toLowerCase();
  const title = (listing.title || listing.plantName || '').toLowerCase();
  const plantName = `${genus} ${species}`.trim();
  const variegatedName = `${genus} ${species} ${variegation}`.trim();
  return genus.includes(term) || species.includes(term) || variegation.includes(term) ||
    plantCode.includes(term) || plantName.includes(term) || variegatedName.includes(term) || title.includes(term);
}

function docToListing(docSnap, priceData) {
  const data = docSnap.data();
  const id = docSnap.id;
  const listing = {
    id,
    plantCode: data.plantCode || id,
    genus: data.genus || '',
    species: data.species || '',
    variegation: data.variegation || '',
    plantName: data.plantName || data.title || `${data.genus || ''} ${data.species || ''}`.trim(),
    imagePrimary: data.imagePrimary || null,
    images: data.images || [],
    imageCollection: data.images || data.imageCollection || [],
    listingType: data.listingType || 'Single Plant',
    availableQty: data.availableQty ?? 0,
    country: data.country || '',
    localCurrency: data.localCurrency || 'USD',
    lowestVariationLocalCurrency: data.lowestVariationLocalCurrency || '',
    localCurrencySymbol: data.localCurrencySymbol || '',
    shippingIndex: data.shippingIndex ?? data.shipping_index ?? null,
    acclimationIndex: data.acclimationIndex ?? data.acclimation_index ?? null,
    potSize: data.potSize || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdAtFormatted: formatTimestamp(data.createdAt),
    updatedAtFormatted: formatTimestamp(data.updatedAt),
    discountPrice: data.discountPrice ?? 0,
    discountPercent: data.discountPercent ?? 0,
    ...priceData,
    usdPrice: priceData.originalPrice || data.usdPrice || 0,
    hasLocalCurrency: !!data.localCurrency,
    quantity: data.availableQty ?? 0,
    stock: data.availableQty ?? 0,
    isSoldOut: !(data.availableQty > 0),
    totalAvailableQty: data.availableQty ?? 0,
  };
  if (priceData.localCurrency) listing.localCurrency = priceData.localCurrency;
  if (priceData.localCurrencySymbol) listing.localCurrencySymbol = priceData.localCurrencySymbol;
  return listing;
}

/**
 * Fetch buyer (Active) listings from Firestore with cursor-based pagination.
 * @param {Object} params - Same shape as getBuyerListingsApi: limit, nextPageToken, genus, country, sortBy, sortOrder, species, variegation, listingType, potSize, minPrice, maxPrice, hasDiscount, nurseryDrop, plant, shippingIndex, acclimationIndex
 * @returns {Promise<{ success: boolean, data?: { listings, hasNextPage, nextPageToken, pageSize }, error?: string }>}
 */
export async function fetchBuyerListingsFromFirestore(params = {}) {
  try {
    const limitParam = Math.max(1, Math.min(100, parseInt(params.limit, 10) || 10));
    const pageSize = limitParam;
    const hasCountryFilter = !!(params.country || '').trim();
    const fetchLimit = hasCountryFilter ? Math.min(200, pageSize * 5) : Math.min(100, pageSize * 3 + 5);
    const genus = (params.genus || '').trim();
    const country = (params.country || '').trim();

    // Build currency list from country filter for Firestore-level filtering
    // Logs confirmed the `country` field is empty on many listings; localCurrency is the reliable field
    const countryCurrencyMap = {};
    Object.keys(COUNTRY_TO_CURRENCY).forEach((k) => { countryCurrencyMap[k.toLowerCase()] = COUNTRY_TO_CURRENCY[k]; });
    const countryFilterCurrencies = hasCountryFilter
      ? [...new Set(
          country.split(',').map((x) => x.trim()).filter(Boolean)
            .map((c) => countryCurrencyMap[c.toLowerCase()])
            .filter(Boolean)
        )]
      : [];
    const sortByParam = (params.sortBy || 'createdAt').trim();
    const sortOrder = (params.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const nurseryDrop = String(params.nurseryDrop || '').toLowerCase() === 'true';
    const minPriceNum = params.minPrice != null ? parseFloat(params.minPrice) : null;
    const isUnicornFilter = minPriceNum != null && !isNaN(minPriceNum) && minPriceNum >= 2000;

    let sortBy = sortByParam;
    if (nurseryDrop && (sortBy === 'createdAt' || !sortBy || sortBy === 'publishDate')) {
      sortBy = 'nurseryDropDate';
    }
    if (sortBy === 'price' || sortBy === 'finalPrice') sortBy = 'usdPrice';

    const listingRef = collection(db, 'listing');
    let q = query(listingRef, where('status', '==', 'Active'));

    const genusParts = genus ? genus.split(',').map((x) => x.trim()).filter(Boolean) : [];
    const hasOthers = genusParts.some((x) => ['others', 'other'].includes(x.toLowerCase()));
    const explicit = genusParts.filter((x) => !['others', 'other'].includes(x.toLowerCase()));

    if (hasOthers && explicit.length === 0) {
      q = query(q, where('genus', 'not-in', MAIN_GENERA));
    } else if (explicit.length > 0) {
      const upper = explicit.map((g) => g.toUpperCase()).slice(0, 10);
      q = query(q, where('genus', 'in', upper));
    }

    // Filter by localCurrency at DB level when country filter is active
    // Logs confirmed: `country` field is empty on listings; localCurrency is the only reliable identifier
    if (countryFilterCurrencies.length === 1) {
      q = query(q, where('localCurrency', '==', countryFilterCurrencies[0]));
    } else if (countryFilterCurrencies.length > 1 && countryFilterCurrencies.length <= 10) {
      q = query(q, where('localCurrency', 'in', countryFilterCurrencies));
    }

    if (params.potSize && String(params.potSize).trim()) {
      q = query(q, where('potSize', '==', String(params.potSize).trim()));
    }

    if (params.listingType && String(params.listingType).trim()) {
      const requested = params.listingType.split(',').map((x) => x.trim()).filter(Boolean);
      const variantToCanonical = new Map();
      Object.keys(LISTING_TYPES).forEach((key) => {
        const canonical = key === 'GROWERS_CHOICE' ? "Grower's Choice" : (key === 'WHOLESALE' ? 'Wholesale' : 'Single Plant');
        LISTING_TYPES[key].forEach((v) => variantToCanonical.set(v.toString().toLowerCase(), canonical));
      });
      const normalized = [...new Set(requested.map((r) => variantToCanonical.get(r.toString().toLowerCase()) || r))];
      if (normalized.length === 1) {
        q = query(q, where('listingType', '==', normalized[0]));
      } else if (normalized.length <= 10) {
        q = query(q, where('listingType', 'in', normalized));
      }
    }

    if (nurseryDrop) {
      q = query(q, where('publishedViaNurseryDrop', '==', true));
    }

    if (isUnicornFilter) {
      q = query(q, where('usdPrice', '>=', 2000));
    }

    const cursor = decodeNextPageToken(params.nextPageToken || params.pageToken);
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';
    try {
      q = query(q, orderBy(sortBy, orderDir), orderBy(documentId(), orderDir));
    } catch (e) {
      try {
        sortBy = '__name__';
        q = query(q, orderBy(documentId(), orderDir));
      } catch (e2) {
        if (__DEV__) console.warn('[fetchBuyerListingsFromFirestore] orderBy failed', e?.message, e2?.message);
      }
    }
    if (cursor) {
      let lastSortValue = cursor.lastSortValue;
      if (sortBy === '__name__') {
        q = query(q, startAfter(cursor.lastId), limit(fetchLimit));
      } else {
        if ((sortBy === 'createdAt' || sortBy === 'nurseryDropDate') && typeof lastSortValue === 'number') {
          lastSortValue = Timestamp.fromMillis(lastSortValue);
        }
        q = query(q, startAfter(lastSortValue, cursor.lastId), limit(fetchLimit));
      }
    } else {
      q = query(q, limit(fetchLimit));
    }

    const snapshot = await getDocs(q);

    const countryFilterList = country ? country.split(',').map((x) => x.trim()).filter(Boolean) : null;
    const variegationFilterList = (params.variegation || '').split(',').map((x) => x.trim()).filter(Boolean);
    const speciesFilterList = (params.species || '').split(',').map((x) => x.trim()).filter(Boolean);
    const hasDiscountFilter = String(params.hasDiscount || '').toLowerCase() === 'true';
    const shippingIndexFilterList = params.shippingIndex ? expandIndexRange(params.shippingIndex) : null;
    const acclimationIndexFilterList = params.acclimationIndex ? expandIndexRange(params.acclimationIndex) : null;
    const plantTerm = (params.plant || '').trim();

    const results = [];
    let lastIncludedDoc = null;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (shouldExcludeLiveListingFromBuyerBrowse(data)) continue;
      const priceData = getPriceFromListing({ ...data, id: doc.id });
      if (!priceData.isValid && (data.listingType === 'Wholesale' || data.listingType === "Grower's Choice")) continue;

      const listing = docToListing(doc, priceData);
      if (isUnicornFilter && (data.usdPrice || 0) >= 2000) {
        listing.usdPrice = data.usdPrice;
        if ((data.usdPrice || 0) > (listing.originalPrice || 0)) listing.originalPrice = data.usdPrice;
        if (!listing.hasDiscount && (data.usdPrice || 0) > (listing.finalPrice || 0)) listing.finalPrice = data.usdPrice;
      }

      const isSoldOut = listing.availableQty === 0;
      const variationsSoldOut = (listing.listingType === 'Wholesale' || listing.listingType === "Grower's Choice") ? isSoldOut : false;
      if (shouldExcludeSoldListing(listing, isSoldOut, variationsSoldOut)) continue;

      if (hasDiscountFilter) {
        const hasDiscount = (listing.discountPrice && listing.discountPrice > 0) || (listing.discountPercent && listing.discountPercent > 0);
        if (!hasDiscount) continue;
      }

      if (!passesCountryFilter(listing, countryFilterList)) continue;
      if (!passesPriceFilter(listing, params.minPrice, params.maxPrice, isUnicornFilter)) continue;
      if (!passesVariegationFilter(listing, variegationFilterList.length ? variegationFilterList : null)) continue;
      if (!passesSpeciesFilter(listing, speciesFilterList.length ? speciesFilterList : null)) continue;
      if (!passesShippingAcclimationFilter(listing, shippingIndexFilterList, acclimationIndexFilterList)) continue;
      if (!passesPlantSearchFilter(listing, plantTerm)) continue;

      results.push(listing);
      lastIncludedDoc = doc;
      if (results.length >= pageSize) break;
    }

    const hasNextPage = snapshot.docs.length >= fetchLimit && results.length >= pageSize;
    const nextPageToken = hasNextPage && lastIncludedDoc ? encodeNextPageToken(lastIncludedDoc, sortBy) : null;
    const listings = results.slice(0, pageSize);

    return {
      success: true,
      data: {
        listings,
        hasNextPage: nextPageToken != null,
        nextPageToken: nextPageToken || undefined,
        pageSize,
        totalCount: listings.length,
        totalCountTruncated: hasNextPage,
      },
    };
  } catch (error) {
    if (__DEV__) console.warn('[fetchBuyerListingsFromFirestore] error', error?.message || error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch buyer listings',
    };
  }
}
