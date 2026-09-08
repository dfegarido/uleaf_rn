import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_ENDPOINTS} from '../../config/apiConfig';

// All buyer profile / address book endpoints are Supabase Edge Functions
// (migrated from the legacy Firebase Cloud Functions). The password update
// remains on the Firebase functions base because it manages the Firebase
// Auth credential itself (auth stays direct-Firebase per project decision).

// Get buyer profile information (Supabase buyer-profile edge fn — response
// shape matches the legacy getBuyerInfo root-level camelCase contract).
export const getBuyerProfileApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.GET_BUYER_PROFILE, {
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

// Update buyer profile information (Supabase buyer-update edge fn; legacy
// validation preserved: username/email rejected, protected fields stripped).
export const updateBuyerProfileApi = async (profileData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.BUYER_UPDATE, {
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

// Update buyer password — stays on the Firebase functions base (AUTH domain:
// verifies the old password against Firebase Auth and updates the credential).
export const updateBuyerPasswordApi = async (passwordData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.UPDATE_BUYER_PASSWORD, {
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

// Create address book entry (Supabase address-book edge fn)
export const createAddressBookEntryApi = async (addressData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.CREATE_ADDRESS_BOOK_ENTRY, {
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

// Get all address book entries (Supabase address-book edge fn)
export const getAddressBookEntriesApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.GET_ADDRESS_BOOK_ENTRIES, {
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

// Get specific address book entry (Supabase address-book edge fn)
export const getAddressBookEntryApi = async (entryId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.GET_ADDRESS_BOOK_ENTRY}?entryId=${entryId}`,
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
    console.log('getAddressBookEntryApi error:', error.message);
    throw error;
  }
};

// Update address book entry (Supabase address-book edge fn)
export const updateAddressBookEntryApi = async (entryId, addressData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.UPDATE_ADDRESS_BOOK_ENTRY}?id=${entryId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addressData,
        }),
      },
    );

    const json = await response.json();

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

// Delete address book entry (Supabase address-book edge fn)
export const deleteAddressBookEntryApi = async (entryId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.DELETE_ADDRESS_BOOK_ENTRY}?id=${entryId}`,
      {
        method: 'DELETE',
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
    console.log('deleteAddressBookEntryApi error:', error.message);
    throw error;
  }
};

// Toggle love/favorite status for a listing — still on the legacy Firebase
// function (the wishlist feature is not wired to any screen yet; the Supabase
// schema for per-user loved listings does not exist yet). Unchanged behavior.
export const toggleLoveListingApi = async (listingId) => {
  return legacyAuthedCall(`${'https://us-central1-i-leaf-u.cloudfunctions.net'}/toggleLoveListing`, {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });
};

// Get all loved listings for the current user — legacy Firebase (unused; see
// note on toggleLoveListingApi).
export const getLovedListingsApi = async () => {
  return legacyAuthedCall(
    `${'https://us-central1-i-leaf-u.cloudfunctions.net'}/getLovedListings?userId=${await getUidFromToken()}`,
    { method: 'GET' },
  );
};

// Check if specific listings are loved by the current user — legacy Firebase
// (see note on toggleLoveListingApi).
export const checkLovedListingsApi = async (listingIds) => {
  const userId = await getUidFromToken();
  return legacyAuthedCall(
    `${'https://us-central1-i-leaf-u.cloudfunctions.net'}/checkLovedListings`,
    {
      method: 'POST',
      body: JSON.stringify({ userId, listingIds }),
    },
  );
};

// --- helpers for the not-yet-migrated loved-listing calls ---

const getUidFromToken = async () => {
  const token = await getStoredAuthToken();
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('Invalid token format');
  }
  const payload = JSON.parse(
    global.atob ? atob(tokenParts[1]) : Buffer.from(tokenParts[1], 'base64').toString(),
  );
  return {token, userId: payload.user_id || payload.uid};
};

const legacyAuthedCall = async (url, {method = 'GET', body} = {}) => {
  const {token} = {token: await getStoredAuthToken()};
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? {body} : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return await response.json();
};