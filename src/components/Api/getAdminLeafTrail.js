import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const getAdminLeafTrailReceiving = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();
    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }

    console.log('cleanedParams', cleanedParams);
    
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getAdminLeafTrailReceiving${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`
    
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
    console.log('getAdminLeafTrailReceiving error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const updateLeafTrailStatus = async (orderId, status) => {
  try {
    const token = await getStoredAuthToken();

    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/updateLeafTrailStatus`
    
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
    console.log('updateLeafTrailStatus error:', error.message);
    return error; 
  }
};

export const getAdminScanQr = async (filters) => {
  try {
    const token = await getStoredAuthToken();

    if ((typeof filters) === 'string') {
      filters = JSON.parse(filters)
    }
    
    const urlParam = new URLSearchParams(filters).toString()
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getAdminScanQr?${urlParam}`
    
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
    console.log('getAdminScanQr error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailFilters = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();
    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getAdminFilters`
    
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
    console.log('getAdminLeafTrailFilters error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};


export const getAdminLeafTrailSorting = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getAdminLeafTrailSorting',
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
    console.log('getAdminLeafTrailSorting error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailPacking = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getAdminLeafTrailPacking',
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
    console.log('getAdminLeafTrailPacking error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailShipping = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getAdminLeafTrailShipping',
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
    console.log('getAdminLeafTrailShipping error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
