import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const getAdminLeafTrailReceiving = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getAdminLeafTrailReceiving',
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
