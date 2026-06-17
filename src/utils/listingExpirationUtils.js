/**
 * Single Plant listing expiration (T58): 15 days from publish date
 * in the seller's local timezone (PH / TH / ID).
 */

export const SINGLE_PLANT_EXPIRATION_DAYS = 15;
export const DEFAULT_LISTING_TIMEZONE = 'Asia/Manila';

export const CURRENCY_TIMEZONES = {
  PHP: 'Asia/Manila',
  THB: 'Asia/Bangkok',
  IDR: 'Asia/Jakarta',
};

const COUNTRY_TIMEZONE_BY_KEY = {
  philippines: 'Asia/Manila',
  ph: 'Asia/Manila',
  'the philippines': 'Asia/Manila',
  thailand: 'Asia/Bangkok',
  th: 'Asia/Bangkok',
  indonesia: 'Asia/Jakarta',
  id: 'Asia/Jakarta',
};

const PUBLISHED_STATUSES = ['active', 'live', 'groupchatlisting'];

function normalizeListingType(listingType) {
  return String(listingType || '').trim().toLowerCase();
}

export function isSinglePlantListing(listingType) {
  const t = normalizeListingType(listingType);
  return t === 'single plant' || (t.includes('single') && !t.includes('grower'));
}

function resolveCountryTimezone(country) {
  const key = String(country || '').trim().toLowerCase();
  if (!key) return null;
  return COUNTRY_TIMEZONE_BY_KEY[key] || null;
}

export function resolveListingTimezone(listing) {
  if (!listing) return DEFAULT_LISTING_TIMEZONE;

  if (typeof listing === 'string') {
    const currency = listing.trim().toUpperCase();
    if (CURRENCY_TIMEZONES[currency]) return CURRENCY_TIMEZONES[currency];
    return resolveCountryTimezone(listing) || DEFAULT_LISTING_TIMEZONE;
  }

  const fromCountry = resolveCountryTimezone(listing.country);
  if (fromCountry) return fromCountry;

  const currency = String(listing.localCurrency || '').trim().toUpperCase();
  if (currency && CURRENCY_TIMEZONES[currency]) {
    return CURRENCY_TIMEZONES[currency];
  }

  return DEFAULT_LISTING_TIMEZONE;
}

function timestampToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  if (value._seconds != null) {
    return new Date(value._seconds * 1000);
  }
  if (value.seconds != null) {
    return new Date(value.seconds * 1000);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T12:00:00.000Z`);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function toLocalYmd(value, timeZone = DEFAULT_LISTING_TIMEZONE) {
  const date = timestampToDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return y && m && d ? `${y}-${m}-${d}` : null;
}

function addDaysToYmd(ymd, days) {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function normalizeYmdString(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (trimmed.length >= 10) return trimmed.slice(0, 10);
  }
  return null;
}

/** Publish calendar date (seller local) from raw timestamp or API formatted field. */
export function resolvePublishYmd(listing) {
  return resolveListingTimestampYmd(listing, 'publishDate');
}

/** Format any listing timestamp as yyyy-MM-dd in the seller's local timezone. */
export function formatListingDateYmd(timestamp, listing) {
  if (!timestamp) return null;
  return toLocalYmd(timestamp, resolveListingTimezone(listing));
}

export function getSinglePlantExpirationYmd(listing) {
  if (!listing || !isSinglePlantListing(listing.listingType)) {
    const fallback = normalizeYmdString(listing?.expirationDateFormatted)
      || toLocalYmd(listing?.expirationDate, resolveListingTimezone(listing));
    return fallback;
  }

  const publishYmd = resolvePublishYmd(listing);
  if (!publishYmd) {
    return normalizeYmdString(listing.expirationDateFormatted)
      || toLocalYmd(listing.expirationDate, resolveListingTimezone(listing));
  }

  return addDaysToYmd(publishYmd, SINGLE_PLANT_EXPIRATION_DAYS);
}

/** True when seller must renew (status Expired or past publish+15). */
export function isSellerListingExpired(listing) {
  if (!listing) return false;
  if (String(listing.status || '').trim().toLowerCase() === 'expired') {
    return true;
  }
  return isListingPastExpiration(listing);
}

/** Status label for seller list/detail (Expired overrides stale Active). */
export function getSellerListingDisplayStatus(listing) {
  if (isSellerListingExpired(listing)) {
    return 'Expired';
  }
  return String(listing?.status || '').trim() || 'Inactive';
}

/** Attach seller-facing status used by list badges and detail UI. */
export function applySellerListingExpirationView(listing) {
  if (!listing) return listing;
  listing._effectiveStatus = getSellerListingDisplayStatus(listing);
  return listing;
}

/** Overwrite expirationDateFormatted with publish+15 ymd for Single Plant (not stored field). */
export function applyComputedExpirationFormattedFields(listing) {
  if (!listing || !isSinglePlantListing(listing.listingType)) {
    return listing;
  }
  const expYmd = getSinglePlantExpirationYmd(listing);
  if (expYmd) {
    listing.expirationDateFormatted = expYmd;
  }
  return listing;
}

export function isListingPastExpiration(listing, nowMs = Date.now()) {
  if (!listing || !isSinglePlantListing(listing.listingType)) {
    return false;
  }

  if (String(listing.status || '').trim().toLowerCase() === 'expired') {
    return true;
  }

  const status = String(listing.status || '').trim().toLowerCase();
  if (!PUBLISHED_STATUSES.includes(status)) {
    return false;
  }

  const timeZone = resolveListingTimezone(listing);
  const expYmd = getSinglePlantExpirationYmd(listing);
  const nowYmd = toLocalYmd(new Date(nowMs), timeZone);
  if (!expYmd || !nowYmd) return false;

  return nowYmd >= expYmd;
}

function formatYmdForDisplay(ymd, formatDateMonthDayYear) {
  if (!ymd || !formatDateMonthDayYear) return 'No Data';
  return formatDateMonthDayYear(`${ymd}T12:00:00.000Z`);
}

const TIMESTAMP_FIELD_FORMATTED = {
  createdAt: 'createdAtFormatted',
  updatedAt: 'updatedAtFormatted',
  publishDate: 'publishDateFormatted',
  expirationDate: 'expirationDateFormatted',
};

/** Calendar date (seller local) from raw timestamp or formatted fallback. */
export function resolveListingTimestampYmd(listing, field) {
  if (!listing || !field) return null;

  const timeZone = resolveListingTimezone(listing);
  const raw = listing[field];
  if (raw) {
    const ymd = toLocalYmd(raw, timeZone);
    if (ymd) return ymd;
  }

  const formattedKey = TIMESTAMP_FIELD_FORMATTED[field];
  return formattedKey ? normalizeYmdString(listing[formattedKey]) : null;
}

/** Published date in seller local timezone. */
export function formatListingPublishDisplay(listing, formatDateMonthDayYear) {
  const ymd = resolvePublishYmd(listing);
  return formatYmdForDisplay(ymd, formatDateMonthDayYear);
}

/** Expiration = publish (seller local) + 15 days. */
export function formatListingExpirationDisplay(listing, formatDateMonthDayYear) {
  if (!listing) return 'No Data';
  const ymd = getSinglePlantExpirationYmd(listing);
  return formatYmdForDisplay(ymd, formatDateMonthDayYear);
}

/** Created date in seller local timezone. */
export function formatListingCreatedDisplay(listing, formatDateMonthDayYear) {
  const ymd = resolveListingTimestampYmd(listing, 'createdAt');
  return formatYmdForDisplay(ymd, formatDateMonthDayYear);
}

/** Modified date in seller local timezone. */
export function formatListingModifiedDisplay(listing, formatDateMonthDayYear) {
  const ymd = resolveListingTimestampYmd(listing, 'updatedAt');
  return formatYmdForDisplay(ymd, formatDateMonthDayYear);
}
