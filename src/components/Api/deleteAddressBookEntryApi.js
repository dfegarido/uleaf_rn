import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const deleteAddressBookEntryApi = async (addressId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.DELETE_ADDRESS_BOOK_ENTRY}?id=${addressId}`,
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
