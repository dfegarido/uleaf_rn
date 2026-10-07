import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Wrap an ISO timestamp into a Firestore-Timestamp-shaped object so the
 * screen's `.createdAt._seconds * 1000` call site (legacy Firestore shape)
 * keeps working after the Supabase migration returns ISO strings.
 */
const toTimestampShape = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return {
    _seconds: Math.floor(d.getTime() / 1000),
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: (d.getTime() % 1000) * 1e6,
    toDate: () => d,
  };
};

/** Prefer a calendar day. "Oct 10, 2026" does not parse on the phone. */
const isoFlightDate = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

/** Seller QR scan returns a raw orders row. The sheet reads camelCase names. */
const normalizeScannedOrder = (row) => {
  if (!row || typeof row !== 'object') return {};
  const flightDate = isoFlightDate(row.flightdate)
    || isoFlightDate(row.flightDate)
    || row.flightdateformatted
    || null;
  const createdRaw = row.dateCreated || row.datecreated || row.createdAt || row.createdat || row.orderdate || null;
  return {
    ...row,
    transactionNumber: row.transactionNumber || row.transactionnumber || '',
    imagePrimary: row.imagePrimary || row.imageprimary || '',
    plantCode: row.plantCode || row.plantcode || '',
    plantSourceCountry: row.plantSourceCountry || row.plantsourcecountry || '',
    genus: row.genus || '',
    variegation: row.variegation || '',
    size: row.size || row.potsizevariation || row.potSizeVariation || '',
    listingType: row.listingType || row.listingtype || '',
    orderQty: row.orderQty || row.orderqty || '',
    flightDate,
    dateCreated: typeof createdRaw === 'string' ? toTimestampShape(createdRaw) : createdRaw,
  };
};

/** Normalize raw order rows from the edge fn into the screen's expected shape. */
const normalizeOrderRow = (row) => {
  const normalized = { ...row };
  // Wrap createdAt only: OrderScreen/ScreenOrderSearch read
  // `createdAt._seconds`. flightDate MUST stay an ISO string — those same
  // screens call `moment(item.flightDate)` directly, and moment() of the
  // Timestamp-shaped object is Invalid, which blanked the Flight: line.
  if (normalized.createdAt && typeof normalized.createdAt === 'string') {
    normalized.createdAt = toTimestampShape(normalized.createdAt);
  }
  return normalized;
};

export const updateOrderSellerScanned = async (data) => {
  try {

    const token = await getStoredAuthToken();
    if ((typeof data) === 'string') {      
      data = JSON.parse(data)
    }
    const url = API_ENDPOINTS.UPDATE_ORDER_SELLER_SCANNED;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    if (json && json.data) {
      json.data = normalizeScannedOrder(json.data);
    }
    return json;
  } catch (error) {
    console.error('updateOrderSellerScanned error:', error.message);
    throw error;
  }
};

export const getSellerOrderCounts = async () => {
  try {
    const token = await getStoredAuthToken();

    const url = API_ENDPOINTS.GET_SELLER_ORDER_COUNTS;
    
    const response = await fetch(
      url,
      {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('getSellerOrderCounts error:', error.message);
    throw error;
  }
};

export const getOrderForReceiving = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();
    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null && value !== '')
      );
    }
    
    const url = `${API_ENDPOINTS.GET_ORDER_FOR_RECEIVING}${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`
    
    console.log('🌐 [API] getOrderForReceiving called:', {
      filters: cleanedParams,
      baseUrl: API_ENDPOINTS.GET_ORDER_FOR_RECEIVING,
      fullUrl: url,
      fullParams: new URLSearchParams(cleanedParams).toString(),
      isLocal: url.includes('localhost') || url.includes('127.0.0.1')
    });
    
    const response = await fetch(
      url,
      {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    // Wrap ISO timestamps into Firestore-Timestamp-shaped objects so the
    // screen's `.createdAt._seconds` and `moment(flightDate)` call sites work.
    if (json && Array.isArray(json.data)) {
      json.data = json.data.map(normalizeOrderRow);
    }
    return json;
  } catch (error) {
    console.error('getOrderForReceiving error:', error.message);
    throw error;
  }
};

export const updateOrderLeafTrailStatus = async (orderId, status) => {
  try {
    const token = await getStoredAuthToken();

    const url = API_ENDPOINTS.UPDATE_ORDER_LEAF_TRAIL_STATUS;
    
    const response = await fetch(
      url,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status
        })
      },
    );

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('updateOrderLeafTrailStatus error:', error.message);
    return error; 
  }
};

