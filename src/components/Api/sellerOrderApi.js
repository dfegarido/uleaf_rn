import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const updateOrderSellerScanned = async (data) => {
  try {
    const token = await getStoredAuthToken();
    if ((typeof data) === 'string') {      
      data = JSON.parse(data)
    }
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/updateOrderSellerScanned`;

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

    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getSellerOrderCounts`
    
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
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }
    console.log('token', token);
    
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getOrderForReceiving${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`
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

    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/updateOrderLeafTrailStatus`
    
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

