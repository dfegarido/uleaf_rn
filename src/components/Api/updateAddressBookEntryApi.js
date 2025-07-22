import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const updateAddressBookEntryApi = async (addressId, addressData) => {
  try {
    // Validate that addressId is provided
    if (!addressId || addressId === 'undefined' || addressId === 'null') {
      throw new Error('Address ID is required for updating address book entry');
    }

    const token = await getStoredAuthToken();

    console.log('Updating address with ID:', addressId, 'Data:', addressData);

    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/updateAddressBookEntry?id=${addressId}`,
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
