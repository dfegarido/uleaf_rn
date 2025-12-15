import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getAdminLeafTrailReceiving = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();
    
    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }

    const url = `${API_ENDPOINTS.GET_ADMIN_LEAF_TRAIL_RECEIVING}${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`
    
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
    console.error('getAdminLeafTrailReceiving error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const updateLeafTrailStatus = async (orderId, status) => {
  try {
    const token = await getStoredAuthToken();

    const url = API_ENDPOINTS.UPDATE_LEAF_TRAIL_STATUS
    
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
    console.error('updateLeafTrailStatus error:', error.message);
    return error; 
  }
};

export const getAdminScanQr = async (filters, leafTrailStatus, isScanning = false) => {
  try {
    if (isScanning) {
      return;
    }
    const token = await getStoredAuthToken();

    if ((typeof filters) === 'string') {      
      filters = JSON.parse(filters)
    }

    if (leafTrailStatus) {
      filters.leafTrailStatus = leafTrailStatus
    }
    const urlParam = new URLSearchParams(filters).toString()
    const url = `${API_ENDPOINTS.GET_ADMIN_SCAN_QR}?${urlParam}`
    
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

    const json = await response.json();

    if (!response.ok) {
      const errorMessage = json.error || json.message || `Error ${response.status}`;
      throw new Error(errorMessage);
    }

    return json;
  } catch (error) {
    console.error('getAdminScanQr error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailFilters = async (statuses = null) => {
  try {
    const token = await getStoredAuthToken();
    let url = API_ENDPOINTS.GET_ADMIN_LEAF_TRAIL_FILTERS

    if (statuses) {
      url = url + '?statuses=' + statuses
    }
    console.log('urlurl', url);
    
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
    console.error('getAdminLeafTrailFilters error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailSorting = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();

    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }

    const url = `${API_ENDPOINTS.GET_ADMIN_LEAF_TRAIL_SORTING}${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`

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
    const data =  await response.json();
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = data;
    return json;
  } catch (error) {
    console.error('getAdminLeafTrailSorting error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const addLeafTrailBoxNumber = async (data) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.ADD_LEAF_TRAIL_BOX_NUMBER,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data)
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('addLeafTrailBoxNumber error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const addSortingTrayNumber = async (data) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.ADD_LEAF_SORT_TRAY,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data)
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('addSortingTrayNumber error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const updatePlantsToSorted = async (data) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.UPDATE_PLANTS_TO_SORTED,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data)
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('updatePlantsToSorted error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailPacking = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();

    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }

    const url = `${API_ENDPOINTS.GET_ADMIN_LEAF_TRAIL_PACKING}${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`
    
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
    console.error('getAdminLeafTrailPacking error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getOrdersBySortingTray = async (trayNumber) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.GET_ORDERS_BY_SORTING_TRAY}?sortingTrayNumber=${trayNumber}`,
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
    console.error('getOrdersBySortingTray error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getOrdersByBoxNumber = async (boxNumber) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.GET_ORDERS_BY_BOX_NUMBER}?boxNumber=${boxNumber}`,
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
    console.error('getOrdersByBoxNumber error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getOrdersByTrackingNumber = async (trackingNumber) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.GET_ORDERS_BY_TRACKING_NUMBER}?trackingNumber=${trackingNumber}`,
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
    console.error('getOrdersByTrackingNumber error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const addLeafTrailTrackingNumber = async (data) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.ADD_LEAF_TRAIL_TRACKING_NUMBER,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data)
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('addLeafTrailTrackingNumber error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailShipping = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();

    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }

    const url = `${API_ENDPOINTS.GET_ADMIN_LEAF_TRAIL_SHIPPING}${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`

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
    console.error('getAdminLeafTrailShipping error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const getAdminLeafTrailShipped = async (filters = {sort: 'desc'}) => {
  try {
    const token = await getStoredAuthToken();

    let cleanedParams = null;
    if (filters) {
      cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null)
      );
    }

    const url = `${API_ENDPOINTS.GET_ADMIN_LEAF_TRAIL_SHIPPED}${cleanedParams ? '?' + new URLSearchParams(cleanedParams).toString() : ''}`
    console.log('url', url);

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
    console.error('getAdminLeafTrailShipped error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};

export const addLeafTrailShippingDetails = async (data) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.ADD_LEAF_TRAIL_SHIPPING_DETAILS,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data)
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('addLeafTrailShippingDetails error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
