import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

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
