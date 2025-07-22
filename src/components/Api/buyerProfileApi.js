import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

// Base URL for API endpoints
const BASE_URL = 'https://us-central1-i-leaf-u.cloudfunctions.net';

// Get buyer profile information
export const getBuyerProfileApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/getBuyerInfo`, {
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
    return json;
  } catch (error) {
    console.log('getBuyerProfileApi error:', error.message);
    throw error;
  }
};

// Update buyer profile information
export const updateBuyerProfileApi = async (profileData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/updateBuyerInfo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('updateBuyerProfileApi error:', error.message);
    throw error;
  }
};

// Update buyer password
export const updateBuyerPasswordApi = async (passwordData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/updateBuyerPassword`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('updateBuyerPasswordApi error:', error.message);
    throw error;
  }
};

// Create address book entry
export const createAddressBookEntryApi = async (addressData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/createAddressBookEntry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();

    
    return json;
  } catch (error) {
    console.log('createAddressBookEntryApi error:', error.message);
    throw error;
  }
};

// Get all address book entries
export const getAddressBookEntriesApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/getAddressBookEntries`, {
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
    return json;
  } catch (error) {
    console.log('getAddressBookEntriesApi error:', error.message);
    throw error;
  }
};

// Get specific address book entry
export const getAddressBookEntryApi = async (entryId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/getAddressBookEntry?entryId=${entryId}`, {
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
    return json;
  } catch (error) {
    console.log('getAddressBookEntryApi error:', error.message);
    throw error;
  }
};

// Update address book entry
export const updateAddressBookEntryApi = async (entryId, addressData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/updateAddressBookEntry?id=${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...addressData,
      }),
    });

    const json = await response.json();
    console.log({json});



    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    
    
    return json;
  } catch (error) {
    console.log('updateAddressBookEntryApi error:', error.message);
    throw error;
  }
};

// Delete address book entry
export const deleteAddressBookEntryApi = async (entryId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/deleteAddressBookEntry?id=${entryId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('deleteAddressBookEntryApi error:', error.message);
    throw error;
  }
};
