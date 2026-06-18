import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getAddressBookEntriesApi = async () => {
  try {
    const token = await getStoredAuthToken();
    if (!token) {
      // During logout, token may be cleared - return gracefully instead of throwing
      // This prevents error spam when components are unmounting or effects are cleaning up
      return {
        success: false,
        data: [],
        message: 'Authentication token not found',
      };
    }

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getAddressBookEntries',
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
    // Only log error if it's not a missing token (which is expected during logout)
    if (!error.message?.includes('Authentication token not found')) {
      console.log('getAddressBookEntriesApi error:', error.message);
    }
    // Return graceful error response instead of throwing
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch address book entries',
      error: error.message,
    };
  }
};
