import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

// Helpers: normalize timestamps, prices, and image urls so the UI can rely on a
// stable shape.
const toIsoDate = (val) => {
  if (!val) return null;
  // Firestore Timestamp-like
  if (typeof val === 'object' && val !== null && val.seconds != null) {
    return new Date(Number(val.seconds) * 1000).toISOString();
  }
  if (typeof val === 'number') {
    // Heuristic: treat < 1e12 as seconds
    if (val < 1e12) return new Date(val * 1000).toISOString();
    return new Date(val).toISOString();
  }
  // string
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return null;
};

const parsePriceAndSymbol = (rawPrice, rawSymbol) => {
  if (rawSymbol) {
    return {price: Number(rawPrice) || 0, symbol: rawSymbol || ''};
  }

  if (rawPrice == null) return {price: 0, symbol: ''};
  if (typeof rawPrice === 'number') return {price: rawPrice, symbol: ''};
  if (typeof rawPrice === 'object' && rawPrice.price != null)
    return {price: Number(rawPrice.price) || 0, symbol: rawPrice.symbol || ''};

  // string like "Rp600" or "USD 600"
  if (typeof rawPrice === 'string') {
    const match = rawPrice.match(/([^0-9.,\s]+)?\s*([0-9,\.\s]+)/);
    if (match) {
      const symbol = match[1] ? match[1].trim() : '';
      const num = Number(match[2].replace(/,/g, '').trim());
      return {price: Number.isFinite(num) ? num : 0, symbol};
    }
  }
  return {price: 0, symbol: ''};
};

const ensureHttpUrl = (uri) => {
  if (!uri) return null;
  if (typeof uri !== 'string') return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  // gs:// or other storage paths can't be used directly by <Image/>
  return null;
};

const normalizeOrder = (order) => {
  if (!order || typeof order !== 'object') return order;

  const {
    orderDate,
    deliveredDate,
    receivedDate,
    localPrice,
    localPriceCurrencySymbol,
    // keep rest of fields
    ...rest
  } = order;

  const {price, symbol} = parsePriceAndSymbol(localPrice, localPriceCurrencySymbol);

  // Prefer an HTTP(S) image URL from a set of possible fields (original and WebP variants).
  const imageCandidates = [
    order.imagePrimary,
    order.image_primary,
    order.primaryImage,
    order.imagePrimaryWebp,
    order.primaryImageWebp,
    order.image_primary_webp,
    order.image_webp,
    order.imageWebp,
  ];

  let chosenImage = null;
  for (const candidate of imageCandidates) {
    const url = ensureHttpUrl(candidate);
    if (url) {
      chosenImage = url;
      break;
    }
  }

  return {
    ...rest,
    orderDate: toIsoDate(orderDate),
    deliveredDate: toIsoDate(deliveredDate),
    receivedDate: toIsoDate(receivedDate),
    localPrice: price,
    localPriceCurrencySymbol: symbol,
    imagePrimary: chosenImage,
  };
};

const normalizeResponse = (data) => {
  if (!data) return data;
  // If the service returns an array of orders
  if (Array.isArray(data)) return data.map(normalizeOrder);
  // If the service returns an object with orders key
  if (data && Array.isArray(data.orders)) {
    return {...data, orders: data.orders.map(normalizeOrder)};
  }
  // Unknown shape: try to normalize common list properties
  return data;
};

export const getOrderListingApi = async (
  limit,
  sortBy,
  date,
  deliveryStatus,
  listingType = [],
  nextPageToken = '', // Changed from offset to nextPageToken
  startDate,
  endDate,
  search,
  screen = '', // 'orders' for Orders screen, 'delivery' for Delivery screen
) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();

    params.append('limit', limit ?? '');
  // keep existing param name for callers, but also append 'sort' so backend
  // which expects `sort` (values: 'Oldest'|'Newest') will receive it.
  params.append('sortBy', sortBy ?? '');
    params.append('sort', sortBy ?? '');
    params.append('date', date ?? '');
    params.append('deliveryStatus', deliveryStatus ?? '');
    params.append('listingType',
      Array.isArray(listingType) ? listingType.join(',') : '');
    params.append('startDate', startDate ?? '');
    params.append('endDate', endDate ?? '');
    params.append('plant', search ?? '');
    // Use nextPageToken for pagination
    if (nextPageToken) {
      params.append('nextPageToken', nextPageToken);
    }
    // Add screen parameter to distinguish between Orders and Delivery screens
    if (screen) {
      params.append('screen', screen);
    }


    const url = `${API_ENDPOINTS.GET_ORDERS}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

  const json = await response.json();
  // normalize orders if present, but return full response so callers can read nextOffset
  return normalizeResponse(json);
  } catch (error) {
    // console.error('getOrderListingApi error:', error.message);
    throw error;
  }
};
