import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Persist profilePhotoUrl so header image can be populated on app start
    try {
      if (json && json.profilePhotoUrl) {
        await AsyncStorage.setItem('profilePhotoUrl', json.profilePhotoUrl);
      }
    } catch (e) {
      console.warn('Failed to cache profilePhotoUrl:', e?.message || e);
    }

    // Persist full buyer profile for offline / fast access
    try {
      await AsyncStorage.setItem('buyerProfile', JSON.stringify(json));
      await AsyncStorage.setItem('buyerProfileCachedAt', String(Date.now()));
    } catch (e) {
      console.warn('Failed to cache buyerProfile:', e?.message || e);
    }

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

// Toggle love/favorite status for a listing
export const toggleLoveListingApi = async (listingId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(`${BASE_URL}/toggleLoveListing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listingId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json; // Returns { isLoved, loveCount, success, timestamp }
  } catch (error) {
    console.log('toggleLoveListingApi error:', error.message);
    throw error;
  }
};

// Get all loved listings for the current user
export const getLovedListingsApi = async () => {
  try {
    const token = await getStoredAuthToken();
    
    // Extract userId from token (JWT decode)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.user_id || payload.uid;

    const response = await fetch(`${BASE_URL}/getLovedListings?userId=${userId}`, {
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
    return json; // Returns { lovedListings: [...], count, success, timestamp }
  } catch (error) {
    console.log('getLovedListingsApi error:', error.message);
    throw error;
  }
};

// Check if specific listings are loved by the current user
export const checkLovedListingsApi = async (listingIds) => {
  try {
    const token = await getStoredAuthToken();
    
    // Extract userId from token (JWT decode)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.user_id || payload.uid;

    const response = await fetch(`${BASE_URL}/checkLovedListings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, listingIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json; // Returns { lovedStatus: { listingId: true/false, ... }, success, timestamp }
  } catch (error) {
    console.log('checkLovedListingsApi error:', error.message);
    throw error;
  }
};
