import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const updateOrderSellerScanned = async (data, isScanning = false) => {
  try {

    if (isScanning) {
      return;
    }
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

    return await response.json();
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

