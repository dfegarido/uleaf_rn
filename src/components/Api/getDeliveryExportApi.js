import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getDeliveryExportApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://deliveryexport-nstilwgvua-uc.a.run.app/',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // use token from AsyncStorage
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
    console.log('getDeliveryExportApi error:', error.message);
    throw error;
  }
};
