import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const deleteAddressBookEntryApi = async (addressId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/deleteAddressBookEntry?id=${addressId}`,
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
