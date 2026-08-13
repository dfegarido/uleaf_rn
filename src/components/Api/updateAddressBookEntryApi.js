import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const updateAddressBookEntryApi = async (addressId, addressData) => {
  try {
    // Validate that addressId is provided
    if (!addressId || addressId === 'undefined' || addressId === 'null') {
      throw new Error('Address ID is required for updating address book entry');
    }

    const token = await getStoredAuthToken();

    console.log('Updating address with ID:', addressId, 'Data:', addressData);

    const response = await fetch(
      `${API_ENDPOINTS.UPDATE_ADDRESS_BOOK_ENTRY}?id=${addressId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('updateAddressBookEntryApi error:', error.message);
    throw error;
  }
};
